/**
 * Neo4j Entity Resolution Engine
 *
 * Identifies and resolves duplicate entities in the knowledge graph using:
 * - Fuzzy matching algorithms
 * - Similarity scoring
 * - AI-powered conflict resolution
 * - Intelligent entity merging
 *
 * @module lib/neo4j/resolution
 */

import { readQuery, writeQuery, executeTransaction } from './client';
import { ContactEntity } from './entities';
import Anthropic from '@anthropic-ai/sdk';
import { extractCacheStats, logCacheStats } from '@/lib/anthropic/features/prompt-cache';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

/**
 * Similarity match result
 */
export interface SimilarityMatch {
  contact1: ContactEntity;
  contact2: ContactEntity;
  score: number;
  factors: {
    emailSimilarity: number;
    nameSimilarity: number;
    phoneSimilarity?: number;
    companySimilarity?: number;
    metadataSimilarity?: number;
  };
  confidence: 'high' | 'medium' | 'low';
  suggestedAction: 'merge' | 'link' | 'review';
}

/**
 * Merge strategy for conflicting fields
 */
export type MergeStrategy = 'keep_first' | 'keep_second' | 'prefer_complete' | 'ai_resolve';

/**
 * Merge result
 */
export interface MergeResult {
  success: boolean;
  mergedContact: ContactEntity;
  removedContactId: string;
  conflicts: Array<{
    field: string;
    value1: unknown;
    value2: unknown;
    resolution: unknown;
    strategy: MergeStrategy;
  }>;
}

/**
 * Calculate Levenshtein distance between two strings
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Edit distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity score between two strings (0-1)
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score (0 = different, 1 = identical)
 */
function stringSimilarity(str1: string | null | undefined, str2: string | null | undefined): number {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(s1, s2);
  return 1 - distance / maxLen;
}

/**
 * Calculate email similarity
 *
 * @param email1 - First email
 * @param email2 - Second email
 * @returns Similarity score (0-1)
 */
function emailSimilarity(email1: string, email2: string): number {
  // Exact match
  if (email1.toLowerCase() === email2.toLowerCase()) return 1;

  // Check if same domain
  const domain1 = email1.split('@')[1];
  const domain2 = email2.split('@')[1];

  if (domain1 !== domain2) return 0;

  // Same domain, check username similarity
  const user1 = email1.split('@')[0];
  const user2 = email2.split('@')[0];

  return stringSimilarity(user1, user2) * 0.5; // Max 0.5 if same domain but different user
}

/**
 * Calculate phone number similarity
 *
 * @param phone1 - First phone
 * @param phone2 - Second phone
 * @returns Similarity score (0-1)
 */
function phoneSimilarity(phone1: string | null | undefined, phone2: string | null | undefined): number {
  if (!phone1 || !phone2) return 0;

  // Normalize: remove all non-digit characters
  const p1 = phone1.replace(/\D/g, '');
  const p2 = phone2.replace(/\D/g, '');

  // Exact match
  if (p1 === p2) return 1;

  // Check last 10 digits (for international numbers)
  const last10_1 = p1.slice(-10);
  const last10_2 = p2.slice(-10);

  if (last10_1 === last10_2 && last10_1.length === 10) return 0.9;

  return stringSimilarity(p1, p2);
}

/**
 * Calculate overall contact similarity
 *
 * @param contact1 - First contact
 * @param contact2 - Second contact
 * @returns Similarity match with score and factors
 */
export function calculateSimilarity(
  contact1: ContactEntity,
  contact2: ContactEntity
): SimilarityMatch {
  const factors = {
    emailSimilarity: emailSimilarity(contact1.email, contact2.email),
    nameSimilarity: stringSimilarity(contact1.name, contact2.name),
    phoneSimilarity: phoneSimilarity(contact1.phone, contact2.phone),
    companySimilarity: stringSimilarity(contact1.company, contact2.company),
    metadataSimilarity: 0, // TODO: Implement metadata similarity
  };

  // Weighted score
  const weights = {
    email: 0.4,
    name: 0.3,
    phone: 0.15,
    company: 0.1,
    metadata: 0.05,
  };

  const score =
    factors.emailSimilarity * weights.email +
    factors.nameSimilarity * weights.name +
    (factors.phoneSimilarity || 0) * weights.phone +
    (factors.companySimilarity || 0) * weights.company +
    factors.metadataSimilarity * weights.metadata;

  // Determine confidence and suggested action
  let confidence: 'high' | 'medium' | 'low';
  let suggestedAction: 'merge' | 'link' | 'review';

  if (score >= 0.9) {
    confidence = 'high';
    suggestedAction = 'merge';
  } else if (score >= 0.7) {
    confidence = 'medium';
    suggestedAction = 'merge';
  } else if (score >= 0.5) {
    confidence = 'medium';
    suggestedAction = 'link';
  } else if (score >= 0.3) {
    confidence = 'low';
    suggestedAction = 'review';
  } else {
    confidence = 'low';
    suggestedAction = 'review';
  }

  return {
    contact1,
    contact2,
    score,
    factors,
    confidence,
    suggestedAction,
  };
}

/**
 * Find duplicate contacts in a workspace
 *
 * @param workspaceId - Workspace ID
 * @param threshold - Minimum similarity score (default: 0.7)
 * @returns Array of similarity matches
 */
export async function findDuplicates(
  workspaceId: string,
  threshold: number = 0.7
): Promise<SimilarityMatch[]> {
  // Get all contacts in workspace
  const query = `
    MATCH (c:Contact {workspace_id: $workspaceId})
    RETURN c
    ORDER BY c.email
  `;

  const result = await readQuery(query, { workspaceId });
  const contacts: ContactEntity[] = result.records.map((r) => r.get('c').properties);

  const matches: SimilarityMatch[] = [];

  // Compare each pair of contacts
  for (let i = 0; i < contacts.length; i++) {
    for (let j = i + 1; j < contacts.length; j++) {
      const match = calculateSimilarity(contacts[i], contacts[j]);

      if (match.score >= threshold) {
        matches.push(match);
      }
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  return matches;
}

/**
 * Find potential duplicates for a specific contact
 *
 * @param contactId - Contact ID
 * @param workspaceId - Workspace ID
 * @param threshold - Minimum similarity score (default: 0.7)
 * @returns Array of similarity matches
 */
export async function findDuplicatesForContact(
  contactId: string,
  workspaceId: string,
  threshold: number = 0.7
): Promise<SimilarityMatch[]> {
  // Get target contact
  const targetQuery = `
    MATCH (c:Contact {id: $contactId, workspace_id: $workspaceId})
    RETURN c
  `;

  const targetResult = await readQuery(targetQuery, { contactId, workspaceId });

  if (targetResult.records.length === 0) {
    throw new Error(`Contact ${contactId} not found`);
  }

  const targetContact: ContactEntity = targetResult.records[0].get('c').properties;

  // Get other contacts
  const othersQuery = `
    MATCH (c:Contact {workspace_id: $workspaceId})
    WHERE c.id <> $contactId
    RETURN c
  `;

  const othersResult = await readQuery(othersQuery, { contactId, workspaceId });
  const otherContacts: ContactEntity[] = othersResult.records.map((r) => r.get('c').properties);

  const matches: SimilarityMatch[] = [];

  for (const otherContact of otherContacts) {
    const match = calculateSimilarity(targetContact, otherContact);

    if (match.score >= threshold) {
      matches.push(match);
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  return matches;
}

/**
 * Resolve field conflict using strategy
 *
 * @param field - Field name
 * @param value1 - First value
 * @param value2 - Second value
 * @param strategy - Merge strategy
 * @returns Resolved value
 */
function resolveConflict(
  field: string,
  value1: unknown,
  value2: unknown,
  strategy: MergeStrategy
): unknown {
  // Handle null/undefined
  if (!value1 && !value2) return null;
  if (!value1) return value2;
  if (!value2) return value1;

  switch (strategy) {
    case 'keep_first':
      return value1;

    case 'keep_second':
      return value2;

    case 'prefer_complete':
      // Prefer longer string or higher number
      if (typeof value1 === 'string' && typeof value2 === 'string') {
        return value1.length >= value2.length ? value1 : value2;
      }
      if (typeof value1 === 'number' && typeof value2 === 'number') {
        return Math.max(value1, value2);
      }
      return value1;

    case 'ai_resolve':
      // AI resolution handled separately
      return value1;

    default:
      return value1;
  }
}

/**
 * Merge two contacts into one
 *
 * @param contact1Id - First contact ID (will be kept)
 * @param contact2Id - Second contact ID (will be removed)
 * @param workspaceId - Workspace ID
 * @param strategy - Merge strategy (default: 'prefer_complete')
 * @returns Merge result
 */
export async function mergeContacts(
  contact1Id: string,
  contact2Id: string,
  workspaceId: string,
  strategy: MergeStrategy = 'prefer_complete'
): Promise<MergeResult> {
  // Get both contacts
  const query = `
    MATCH (c1:Contact {id: $contact1Id, workspace_id: $workspaceId})
    MATCH (c2:Contact {id: $contact2Id, workspace_id: $workspaceId})
    RETURN c1, c2
  `;

  const result = await readQuery(query, { contact1Id, contact2Id, workspaceId });

  if (result.records.length === 0) {
    throw new Error('Contacts not found');
  }

  const c1: ContactEntity = result.records[0].get('c1').properties;
  const c2: ContactEntity = result.records[0].get('c2').properties;

  // Track conflicts
  const conflicts: MergeResult['conflicts'] = [];

  // Merge properties
  const merged: ContactEntity = { ...c1 };

  const fieldsToMerge = ['name', 'phone', 'company', 'status', 'ai_score', 'metadata'];

  for (const field of fieldsToMerge) {
    const v1 = c1[field as keyof ContactEntity];
    const v2 = c2[field as keyof ContactEntity];

    if (v1 !== v2) {
      const resolved = resolveConflict(field, v1, v2, strategy);
      conflicts.push({
        field,
        value1: v1,
        value2: v2,
        resolution: resolved,
        strategy,
      });
      (merged as Record<string, unknown>)[field] = resolved;
    }
  }

  // Update merged contact and transfer relationships
  const mergeQueries = [
    // Update contact1 with merged data
    {
      query: `
        MATCH (c:Contact {id: $contact1Id, workspace_id: $workspaceId})
        SET c.name = $name,
            c.phone = $phone,
            c.company = $company,
            c.status = $status,
            c.ai_score = $ai_score,
            c.metadata = $metadata,
            c.updated_at = $updated_at
        RETURN c
      `,
      params: {
        contact1Id,
        workspaceId,
        name: merged.name,
        phone: merged.phone,
        company: merged.company,
        status: merged.status,
        ai_score: merged.ai_score,
        metadata: merged.metadata,
        updated_at: new Date().toISOString(),
      },
    },
    // Transfer emails from contact2 to contact1
    {
      query: `
        MATCH (c2:Contact {id: $contact2Id, workspace_id: $workspaceId})-[r:SENT|RECEIVED]->(e:Email)
        MATCH (c1:Contact {id: $contact1Id, workspace_id: $workspaceId})
        CREATE (c1)-[r2:${r.type}]->(e)
        SET r2 = properties(r)
        DELETE r
        RETURN count(*) as transferred_emails
      `,
      params: { contact1Id, contact2Id, workspaceId },
    },
    // Transfer connections from contact2 to contact1
    {
      query: `
        MATCH (c2:Contact {id: $contact2Id, workspace_id: $workspaceId})-[r:CONNECTED_TO]-(other:Contact)
        MATCH (c1:Contact {id: $contact1Id, workspace_id: $workspaceId})
        WHERE other.id <> $contact1Id
        MERGE (c1)-[r2:CONNECTED_TO]-(other)
        ON CREATE SET r2 = properties(r)
        ON MATCH SET r2.interaction_count = r2.interaction_count + r.interaction_count
        DELETE r
        RETURN count(*) as transferred_connections
      `,
      params: { contact1Id, contact2Id, workspaceId },
    },
    // Delete contact2
    {
      query: `
        MATCH (c:Contact {id: $contact2Id, workspace_id: $workspaceId})
        DETACH DELETE c
      `,
      params: { contact2Id, workspaceId },
    },
  ];

  await executeTransaction(mergeQueries);

  return {
    success: true,
    mergedContact: merged,
    removedContactId: contact2Id,
    conflicts,
  };
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'prompt-caching-2024-07-31',
  },
});

/**
 * Use AI to resolve complex merge conflicts
 *
 * @param contact1 - First contact
 * @param contact2 - Second contact
 * @returns AI-suggested merged contact
 */
export async function aiResolveConflicts(
  contact1: ContactEntity,
  contact2: ContactEntity
): Promise<ContactEntity> {
  const systemPrompt = `You are an expert at entity resolution. I have two contact records that are likely duplicates. Please analyze them and suggest the best merged record.

For each conflicting field, choose the most complete, accurate, or recent value. Respond ONLY with valid JSON.`;

  const userPrompt = `Contact 1:
${JSON.stringify(contact1, null, 2)}

Contact 2:
${JSON.stringify(contact2, null, 2)}

Please provide a merged contact record in JSON format.`;

  const result = await callAnthropicWithRetry(async () => {
    return await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });
  });

  const message = result.data;

  // Log cache performance
  const cacheStats = extractCacheStats(message, 'claude-sonnet-4-5-20250929');
  logCacheStats('Neo4jResolution:aiResolveConflicts', cacheStats);

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON from Claude response');
  }

  const merged: ContactEntity = JSON.parse(jsonMatch[0]);

  return merged;
}

/**
 * Create a SIMILAR_TO relationship between contacts
 *
 * @param contact1Id - First contact ID
 * @param contact2Id - Second contact ID
 * @param workspaceId - Workspace ID
 * @param similarityScore - Similarity score (0-1)
 * @param factors - Similarity factors
 */
export async function linkSimilarContacts(
  contact1Id: string,
  contact2Id: string,
  workspaceId: string,
  similarityScore: number,
  factors: Record<string, number>
): Promise<void> {
  const query = `
    MATCH (c1:Contact {id: $contact1Id, workspace_id: $workspaceId})
    MATCH (c2:Contact {id: $contact2Id, workspace_id: $workspaceId})
    MERGE (c1)-[r:SIMILAR_TO]-(c2)
    SET r.similarity_score = $similarityScore,
        r.factors = $factors,
        r.detected_at = datetime()
    RETURN r
  `;

  await writeQuery(query, {
    contact1Id,
    contact2Id,
    workspaceId,
    similarityScore,
    factors: JSON.stringify(factors),
  });
}

/**
 * Get entity resolution statistics for a workspace
 *
 * @param workspaceId - Workspace ID
 * @returns Resolution statistics
 */
export async function getResolutionStats(workspaceId: string): Promise<{
  totalContacts: number;
  potentialDuplicates: number;
  similarityLinks: number;
  avgSimilarityScore: number;
}> {
  const statsQuery = `
    MATCH (c:Contact {workspace_id: $workspaceId})
    WITH count(c) as totalContacts
    OPTIONAL MATCH (:Contact {workspace_id: $workspaceId})-[r:SIMILAR_TO]-()
    WITH totalContacts, count(DISTINCT r) as similarityLinks, avg(r.similarity_score) as avgScore
    RETURN totalContacts, similarityLinks, avgScore
  `;

  const result = await readQuery(statsQuery, { workspaceId });

  if (result.records.length === 0) {
    return {
      totalContacts: 0,
      potentialDuplicates: 0,
      similarityLinks: 0,
      avgSimilarityScore: 0,
    };
  }

  const record = result.records[0];

  return {
    totalContacts: record.get('totalContacts').toNumber(),
    potentialDuplicates: 0, // Calculated separately
    similarityLinks: record.get('similarityLinks').toNumber(),
    avgSimilarityScore: record.get('avgScore') || 0,
  };
}
