/**
 * Neo4j Pattern Detection & Analytics Engine
 *
 * Graph algorithms for network analysis and pattern detection:
 * - Centrality measures (degree, betweenness, closeness, PageRank)
 * - Community detection (Louvain, Label Propagation)
 * - Influence scoring
 * - Communication pattern analysis
 * - Relationship strength calculations
 *
 * @module lib/neo4j/analytics
 */

import { readQuery, writeQuery, executeTransaction } from './client';
import { ContactEntity } from './entities';

/**
 * Centrality scores for a contact
 */
export interface CentralityScores {
  contactId: string;
  contactEmail: string;
  contactName?: string;
  degreeCentrality: number; // Number of direct connections
  betweennessCentrality?: number; // How often contact is on shortest paths
  closenessCentrality?: number; // Average distance to all other contacts
  pageRank?: number; // Importance based on connections
  eigenvectorCentrality?: number; // Influence based on influential connections
}

/**
 * Community detection result
 */
export interface Community {
  communityId: number;
  members: Array<{
    contactId: string;
    email: string;
    name?: string;
  }>;
  size: number;
  density: number; // Internal connection density
  avgAiScore?: number;
}

/**
 * Influence score result
 */
export interface InfluenceScore {
  contactId: string;
  email: string;
  name?: string;
  influenceScore: number; // Composite score (0-100)
  factors: {
    networkCentrality: number; // Network position (0-1)
    connectionQuality: number; // Quality of connections (0-1)
    activityLevel: number; // Communication frequency (0-1)
    aiScore: number; // Contact AI score (0-1)
  };
  rank: number; // Rank within workspace
}

/**
 * Communication pattern result
 */
export interface CommunicationPattern {
  contactId: string;
  email: string;
  name?: string;
  patterns: {
    emailFrequency: number; // Emails per week
    responseRate: number; // % of emails with responses
    avgResponseTime?: number; // Average hours to respond
    preferredDays?: string[]; // Most active days
    sentimentTrend?: 'positive' | 'neutral' | 'negative';
  };
  lastActivity: string;
  activityTrend: 'increasing' | 'stable' | 'decreasing';
}

/**
 * Relationship strength result
 */
export interface RelationshipStrength {
  contact1: {
    id: string;
    email: string;
    name?: string;
  };
  contact2: {
    id: string;
    email: string;
    name?: string;
  };
  strength: number; // Composite strength (0-1)
  factors: {
    interactionCount: number;
    interactionRecency: number; // Days since last interaction
    mutualConnections: number;
    sharedCompany: boolean;
  };
  type: 'strong' | 'moderate' | 'weak';
}

/**
 * Network statistics for workspace
 */
export interface NetworkStats {
  workspaceId: string;
  totalContacts: number;
  totalConnections: number;
  avgConnections: number;
  networkDensity: number; // Actual connections / possible connections
  largestComponent: number; // Size of largest connected component
  avgPathLength?: number; // Average shortest path length
  clusteringCoefficient?: number; // How connected neighbors are
  communities: number; // Number of detected communities
}

/**
 * Calculate degree centrality for all contacts in workspace
 *
 * Degree centrality = number of direct connections
 *
 * @param workspaceId - Workspace to analyze
 * @param limit - Maximum results to return (default: 100)
 * @returns Array of contacts with degree centrality scores
 */
export async function calculateDegreeCentrality(
  workspaceId: string,
  limit: number = 100
): Promise<CentralityScores[]> {
  const query = `
    MATCH (c:Contact {workspace_id: $workspaceId})
    OPTIONAL MATCH (c)-[r:CONNECTED_TO]-(other:Contact)
    WITH c, COUNT(DISTINCT other) as degreeCount
    RETURN
      c.id as contactId,
      c.email as contactEmail,
      c.name as contactName,
      degreeCount as degreeCentrality
    ORDER BY degreeCentrality DESC
    LIMIT $limit
  `;

  const result = await readQuery(query, { workspaceId, limit });

  return result.records.map((record) => ({
    contactId: record.get('contactId'),
    contactEmail: record.get('contactEmail'),
    contactName: record.get('contactName'),
    degreeCentrality: record.get('degreeCentrality').toNumber(),
  }));
}

/**
 * Calculate betweenness centrality (requires GDS library)
 *
 * Betweenness centrality = how often contact appears on shortest paths
 *
 * @param workspaceId - Workspace to analyze
 * @param limit - Maximum results to return (default: 100)
 * @returns Array of contacts with betweenness scores
 */
export async function calculateBetweennessCentrality(
  workspaceId: string,
  limit: number = 100
): Promise<CentralityScores[]> {
  // Create in-memory graph projection
  const projectQuery = `
    CALL gds.graph.project(
      'workspace-graph-' + $workspaceId,
      {
        Contact: {
          properties: ['workspace_id']
        }
      },
      {
        CONNECTED_TO: {
          orientation: 'UNDIRECTED'
        }
      }
    )
  `;

  // Calculate betweenness
  const betweennessQuery = `
    CALL gds.betweenness.stream('workspace-graph-' + $workspaceId)
    YIELD nodeId, score
    WITH gds.util.asNode(nodeId) as contact, score
    WHERE contact.workspace_id = $workspaceId
    RETURN
      contact.id as contactId,
      contact.email as contactEmail,
      contact.name as contactName,
      score as betweennessCentrality
    ORDER BY betweennessCentrality DESC
    LIMIT $limit
  `;

  // Drop graph
  const dropQuery = `
    CALL gds.graph.drop('workspace-graph-' + $workspaceId)
  `;

  try {
    await writeQuery(projectQuery, { workspaceId });
    const result = await readQuery(betweennessQuery, { workspaceId, limit });
    await writeQuery(dropQuery, { workspaceId });

    return result.records.map((record) => ({
      contactId: record.get('contactId'),
      contactEmail: record.get('contactEmail'),
      contactName: record.get('contactName'),
      betweennessCentrality: record.get('betweennessCentrality'),
      degreeCentrality: 0, // Will be populated by combined function
    }));
  } catch (error: any) {
    console.warn('[Analytics] GDS library not available, skipping betweenness:', error.message);
    return [];
  }
}

/**
 * Calculate PageRank scores (requires GDS library)
 *
 * PageRank = importance based on connections and their importance
 *
 * @param workspaceId - Workspace to analyze
 * @param limit - Maximum results to return (default: 100)
 * @returns Array of contacts with PageRank scores
 */
export async function calculatePageRank(
  workspaceId: string,
  limit: number = 100
): Promise<CentralityScores[]> {
  const projectQuery = `
    CALL gds.graph.project(
      'pagerank-' + $workspaceId,
      {
        Contact: {
          properties: ['workspace_id']
        }
      },
      {
        CONNECTED_TO: {
          orientation: 'UNDIRECTED'
        }
      }
    )
  `;

  const pageRankQuery = `
    CALL gds.pageRank.stream('pagerank-' + $workspaceId)
    YIELD nodeId, score
    WITH gds.util.asNode(nodeId) as contact, score
    WHERE contact.workspace_id = $workspaceId
    RETURN
      contact.id as contactId,
      contact.email as contactEmail,
      contact.name as contactName,
      score as pageRank
    ORDER BY pageRank DESC
    LIMIT $limit
  `;

  const dropQuery = `
    CALL gds.graph.drop('pagerank-' + $workspaceId)
  `;

  try {
    await writeQuery(projectQuery, { workspaceId });
    const result = await readQuery(pageRankQuery, { workspaceId, limit });
    await writeQuery(dropQuery, { workspaceId });

    return result.records.map((record) => ({
      contactId: record.get('contactId'),
      contactEmail: record.get('contactEmail'),
      contactName: record.get('contactName'),
      pageRank: record.get('pageRank'),
      degreeCentrality: 0,
    }));
  } catch (error: any) {
    console.warn('[Analytics] GDS library not available, skipping PageRank:', error.message);
    return [];
  }
}

/**
 * Detect communities using Label Propagation (requires GDS library)
 *
 * Groups contacts into communities based on connection patterns
 *
 * @param workspaceId - Workspace to analyze
 * @returns Array of detected communities
 */
export async function detectCommunities(workspaceId: string): Promise<Community[]> {
  const projectQuery = `
    CALL gds.graph.project(
      'community-' + $workspaceId,
      {
        Contact: {
          properties: ['workspace_id', 'ai_score']
        }
      },
      {
        CONNECTED_TO: {
          orientation: 'UNDIRECTED',
          properties: ['strength']
        }
      }
    )
  `;

  const communityQuery = `
    CALL gds.labelPropagation.stream('community-' + $workspaceId)
    YIELD nodeId, communityId
    WITH gds.util.asNode(nodeId) as contact, communityId
    WHERE contact.workspace_id = $workspaceId
    RETURN
      communityId,
      COLLECT({
        contactId: contact.id,
        email: contact.email,
        name: contact.name
      }) as members,
      COUNT(contact) as size,
      AVG(contact.ai_score) as avgAiScore
    ORDER BY size DESC
  `;

  const dropQuery = `
    CALL gds.graph.drop('community-' + $workspaceId)
  `;

  try {
    await writeQuery(projectQuery, { workspaceId });
    const result = await readQuery(communityQuery, { workspaceId });
    await writeQuery(dropQuery, { workspaceId });

    return result.records.map((record) => ({
      communityId: record.get('communityId').toNumber(),
      members: record.get('members'),
      size: record.get('size').toNumber(),
      density: 0, // Calculated separately if needed
      avgAiScore: record.get('avgAiScore'),
    }));
  } catch (error: any) {
    console.warn('[Analytics] GDS library not available, using simple clustering:', error.message);
    return await detectCommunitiesSimple(workspaceId);
  }
}

/**
 * Simple community detection without GDS library
 *
 * Uses connected components as communities
 *
 * @param workspaceId - Workspace to analyze
 * @returns Array of communities
 */
async function detectCommunitiesSimple(workspaceId: string): Promise<Community[]> {
  const query = `
    MATCH (c:Contact {workspace_id: $workspaceId})-[:CONNECTED_TO*]-(other:Contact)
    WITH c, COLLECT(DISTINCT other) as group
    WHERE SIZE(group) > 0
    RETURN
      ID(c) as communityId,
      COLLECT({
        contactId: c.id,
        email: c.email,
        name: c.name
      }) + COLLECT({
        contactId: other.id,
        email: other.email,
        name: other.name
      }) as members,
      SIZE(group) + 1 as size,
      AVG(c.ai_score) as avgAiScore
    ORDER BY size DESC
    LIMIT 20
  `;

  const result = await readQuery(query, { workspaceId });

  return result.records.map((record) => ({
    communityId: record.get('communityId').toNumber(),
    members: record.get('members'),
    size: record.get('size').toNumber(),
    density: 0,
    avgAiScore: record.get('avgAiScore'),
  }));
}

/**
 * Calculate influence scores for contacts
 *
 * Composite score based on:
 * - Network centrality (position in network)
 * - Connection quality (quality of connections)
 * - Activity level (communication frequency)
 * - AI score (contact quality)
 *
 * @param workspaceId - Workspace to analyze
 * @param limit - Maximum results to return (default: 100)
 * @returns Array of contacts with influence scores
 */
export async function calculateInfluenceScores(
  workspaceId: string,
  limit: number = 100
): Promise<InfluenceScore[]> {
  const query = `
    MATCH (c:Contact {workspace_id: $workspaceId})

    // Network centrality - degree and connection strength
    OPTIONAL MATCH (c)-[conn:CONNECTED_TO]-(other:Contact)
    WITH c,
      COUNT(DISTINCT other) as connectionCount,
      AVG(conn.strength) as avgConnectionStrength

    // Connection quality - avg AI score of connections
    OPTIONAL MATCH (c)-[:CONNECTED_TO]-(connected:Contact)
    WITH c, connectionCount, avgConnectionStrength,
      AVG(connected.ai_score) as connectionQuality

    // Activity level - email frequency
    OPTIONAL MATCH (c)-[r:SENT|RECEIVED]->(e:Email)
    WHERE e.sent_at >= datetime() - duration('P30D')
    WITH c, connectionCount, avgConnectionStrength, connectionQuality,
      COUNT(e) as recentEmailCount

    // Calculate factors
    WITH c,
      toFloat(connectionCount) / 100.0 as networkFactor,
      COALESCE(avgConnectionStrength, 0.5) as strengthFactor,
      COALESCE(connectionQuality, 50.0) / 100.0 as qualityFactor,
      toFloat(recentEmailCount) / 50.0 as activityFactor,
      COALESCE(c.ai_score, 50.0) / 100.0 as aiFactor

    // Composite influence score
    WITH c,
      networkFactor,
      qualityFactor,
      activityFactor,
      aiFactor,
      (networkFactor * 0.35 + qualityFactor * 0.25 + activityFactor * 0.20 + aiFactor * 0.20) * 100 as influenceScore

    RETURN
      c.id as contactId,
      c.email as email,
      c.name as name,
      influenceScore,
      networkFactor as networkCentrality,
      qualityFactor as connectionQuality,
      activityFactor as activityLevel,
      aiFactor as aiScore
    ORDER BY influenceScore DESC
    LIMIT $limit
  `;

  const result = await readQuery(query, { workspaceId, limit });

  return result.records.map((record, index) => ({
    contactId: record.get('contactId'),
    email: record.get('email'),
    name: record.get('name'),
    influenceScore: Math.min(100, record.get('influenceScore')),
    factors: {
      networkCentrality: Math.min(1, record.get('networkCentrality')),
      connectionQuality: record.get('connectionQuality'),
      activityLevel: Math.min(1, record.get('activityLevel')),
      aiScore: record.get('aiScore'),
    },
    rank: index + 1,
  }));
}

/**
 * Analyze communication patterns for contacts
 *
 * Detects frequency, response rates, and trends
 *
 * @param workspaceId - Workspace to analyze
 * @param contactId - Optional specific contact to analyze
 * @param limit - Maximum results to return (default: 50)
 * @returns Array of communication patterns
 */
export async function analyzeCommunicationPatterns(
  workspaceId: string,
  contactId?: string,
  limit: number = 50
): Promise<CommunicationPattern[]> {
  const query = `
    MATCH (c:Contact {workspace_id: $workspaceId})
    ${contactId ? 'WHERE c.id = $contactId' : ''}

    // Email frequency (last 30 days)
    OPTIONAL MATCH (c)-[r:SENT|RECEIVED]->(e:Email)
    WHERE e.sent_at >= datetime() - duration('P30D')
    WITH c, COUNT(e) as recentEmailCount, MAX(e.sent_at) as lastActivity

    // Response rate calculation
    OPTIONAL MATCH (c)-[:RECEIVED]->(inbound:Email)-[:REPLIED_TO]-(outbound:Email)
    WHERE inbound.sent_at >= datetime() - duration('P90D')
    WITH c, recentEmailCount, lastActivity,
      toFloat(COUNT(DISTINCT outbound)) / NULLIF(toFloat(COUNT(DISTINCT inbound)), 0) as responseRate

    // Email frequency over time (trend detection)
    OPTIONAL MATCH (c)-[:SENT|RECEIVED]->(recent:Email)
    WHERE recent.sent_at >= datetime() - duration('P30D')
    WITH c, recentEmailCount, lastActivity, responseRate, COUNT(recent) as last30Days

    OPTIONAL MATCH (c)-[:SENT|RECEIVED]->(previous:Email)
    WHERE previous.sent_at >= datetime() - duration('P60D')
      AND previous.sent_at < datetime() - duration('P30D')
    WITH c, recentEmailCount, lastActivity, responseRate, last30Days, COUNT(previous) as previous30Days

    // Determine trend
    WITH c, recentEmailCount, lastActivity, responseRate,
      CASE
        WHEN last30Days > previous30Days * 1.2 THEN 'increasing'
        WHEN last30Days < previous30Days * 0.8 THEN 'decreasing'
        ELSE 'stable'
      END as activityTrend

    WHERE recentEmailCount > 0

    RETURN
      c.id as contactId,
      c.email as email,
      c.name as name,
      toFloat(recentEmailCount) * 7.0 / 30.0 as emailFrequency,
      COALESCE(responseRate, 0.0) as responseRate,
      lastActivity,
      activityTrend
    ORDER BY emailFrequency DESC
    LIMIT $limit
  `;

  const result = await readQuery(query, { workspaceId, contactId, limit });

  return result.records.map((record) => ({
    contactId: record.get('contactId'),
    email: record.get('email'),
    name: record.get('name'),
    patterns: {
      emailFrequency: record.get('emailFrequency'),
      responseRate: record.get('responseRate'),
    },
    lastActivity: record.get('lastActivity'),
    activityTrend: record.get('activityTrend') as 'increasing' | 'stable' | 'decreasing',
  }));
}

/**
 * Calculate relationship strength between contacts
 *
 * Based on interaction count, recency, mutual connections, shared company
 *
 * @param workspaceId - Workspace to analyze
 * @param contactId - Optional specific contact
 * @param minStrength - Minimum strength threshold (default: 0.3)
 * @param limit - Maximum results to return (default: 50)
 * @returns Array of relationship strengths
 */
export async function calculateRelationshipStrength(
  workspaceId: string,
  contactId?: string,
  minStrength: number = 0.3,
  limit: number = 50
): Promise<RelationshipStrength[]> {
  const query = `
    MATCH (c1:Contact {workspace_id: $workspaceId})-[conn:CONNECTED_TO]-(c2:Contact)
    ${contactId ? 'WHERE c1.id = $contactId' : ''}

    // Interaction count
    WITH c1, c2, conn,
      COALESCE(conn.interaction_count, 1) as interactionCount

    // Interaction recency (days since last interaction)
    OPTIONAL MATCH (c1)-[:SENT|RECEIVED]->(e:Email)<-[:SENT|RECEIVED]-(c2)
    WITH c1, c2, conn, interactionCount,
      duration.between(MAX(e.sent_at), datetime()).days as daysSinceInteraction

    // Mutual connections
    OPTIONAL MATCH (c1)-[:CONNECTED_TO]-(mutual:Contact)-[:CONNECTED_TO]-(c2)
    WITH c1, c2, conn, interactionCount, daysSinceInteraction,
      COUNT(DISTINCT mutual) as mutualCount

    // Shared company
    OPTIONAL MATCH (c1)-[:WORKS_AT]->(company:Company)<-[:WORKS_AT]-(c2)
    WITH c1, c2, interactionCount, daysSinceInteraction, mutualCount,
      company IS NOT NULL as sharedCompany

    // Calculate strength factors
    WITH c1, c2,
      toFloat(interactionCount) / 20.0 as interactionFactor,
      1.0 / (1.0 + toFloat(COALESCE(daysSinceInteraction, 365)) / 30.0) as recencyFactor,
      toFloat(mutualCount) / 10.0 as mutualFactor,
      CASE WHEN sharedCompany THEN 0.2 ELSE 0.0 END as companyBonus,
      interactionCount,
      daysSinceInteraction,
      mutualCount,
      sharedCompany

    // Composite strength
    WITH c1, c2,
      (interactionFactor * 0.4 + recencyFactor * 0.3 + mutualFactor * 0.2 + companyBonus) as strength,
      interactionCount, daysSinceInteraction, mutualCount, sharedCompany

    WHERE strength >= $minStrength

    RETURN
      c1.id as contact1Id,
      c1.email as contact1Email,
      c1.name as contact1Name,
      c2.id as contact2Id,
      c2.email as contact2Email,
      c2.name as contact2Name,
      strength,
      interactionCount,
      daysSinceInteraction,
      mutualCount,
      sharedCompany,
      CASE
        WHEN strength >= 0.7 THEN 'strong'
        WHEN strength >= 0.5 THEN 'moderate'
        ELSE 'weak'
      END as type
    ORDER BY strength DESC
    LIMIT $limit
  `;

  const result = await readQuery(query, { workspaceId, contactId, minStrength, limit });

  return result.records.map((record) => ({
    contact1: {
      id: record.get('contact1Id'),
      email: record.get('contact1Email'),
      name: record.get('contact1Name'),
    },
    contact2: {
      id: record.get('contact2Id'),
      email: record.get('contact2Email'),
      name: record.get('contact2Name'),
    },
    strength: Math.min(1, record.get('strength')),
    factors: {
      interactionCount: record.get('interactionCount').toNumber(),
      interactionRecency: record.get('daysSinceInteraction')?.toNumber() || 0,
      mutualConnections: record.get('mutualCount').toNumber(),
      sharedCompany: record.get('sharedCompany'),
    },
    type: record.get('type') as 'strong' | 'moderate' | 'weak',
  }));
}

/**
 * Get network statistics for workspace
 *
 * @param workspaceId - Workspace to analyze
 * @returns Network statistics
 */
export async function getNetworkStats(workspaceId: string): Promise<NetworkStats> {
  const query = `
    MATCH (c:Contact {workspace_id: $workspaceId})

    // Total contacts
    WITH COUNT(c) as totalContacts

    // Total connections
    MATCH (c1:Contact {workspace_id: $workspaceId})-[conn:CONNECTED_TO]-(c2:Contact)
    WITH totalContacts, COUNT(DISTINCT conn) as totalConnections

    // Average connections per contact
    WITH totalContacts, totalConnections,
      toFloat(totalConnections) / toFloat(totalContacts) as avgConnections

    // Network density
    WITH totalContacts, totalConnections, avgConnections,
      toFloat(totalConnections) / (toFloat(totalContacts) * (toFloat(totalContacts) - 1) / 2.0) as networkDensity

    // Largest connected component
    MATCH (start:Contact {workspace_id: $workspaceId})-[:CONNECTED_TO*]-(connected:Contact)
    WITH totalContacts, totalConnections, avgConnections, networkDensity,
      start, COUNT(DISTINCT connected) as componentSize

    RETURN
      totalContacts,
      totalConnections,
      avgConnections,
      networkDensity,
      MAX(componentSize) as largestComponent
  `;

  const result = await readQuery(query, { workspaceId });

  if (result.records.length === 0) {
    return {
      workspaceId,
      totalContacts: 0,
      totalConnections: 0,
      avgConnections: 0,
      networkDensity: 0,
      largestComponent: 0,
      communities: 0,
    };
  }

  const record = result.records[0];

  // Get community count
  const communities = await detectCommunities(workspaceId);

  return {
    workspaceId,
    totalContacts: record.get('totalContacts').toNumber(),
    totalConnections: record.get('totalConnections').toNumber(),
    avgConnections: record.get('avgConnections'),
    networkDensity: record.get('networkDensity'),
    largestComponent: record.get('largestComponent').toNumber(),
    communities: communities.length,
  };
}

/**
 * Find shortest path between two contacts
 *
 * @param contact1Id - First contact ID
 * @param contact2Id - Second contact ID
 * @param workspaceId - Workspace ID
 * @returns Path of contacts or null if no path exists
 */
export async function findShortestPath(
  contact1Id: string,
  contact2Id: string,
  workspaceId: string
): Promise<ContactEntity[] | null> {
  const query = `
    MATCH (c1:Contact {id: $contact1Id, workspace_id: $workspaceId}),
          (c2:Contact {id: $contact2Id, workspace_id: $workspaceId})
    MATCH path = shortestPath((c1)-[:CONNECTED_TO*]-(c2))
    RETURN [node in nodes(path) | {
      id: node.id,
      email: node.email,
      name: node.name,
      workspace_id: node.workspace_id
    }] as pathContacts
  `;

  const result = await readQuery(query, { contact1Id, contact2Id, workspaceId });

  if (result.records.length === 0) {
    return null;
  }

  return result.records[0].get('pathContacts') as ContactEntity[];
}
