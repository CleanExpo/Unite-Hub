# Neo4j Entity Resolution Engine

**Created**: 2026-01-27
**Status**: Complete
**Task**: Unite-Hub-ove.2.3 (Entity Resolution Engine)

---

## Overview

The Entity Resolution Engine identifies and merges duplicate entities in Unite-Hub's knowledge graph using:
- **Fuzzy matching** algorithms (Levenshtein distance)
- **Similarity scoring** with weighted factors
- **AI-powered** conflict resolution (Claude Sonnet 4.5)
- **Intelligent merging** with relationship preservation

---

## Core Concepts

### Similarity Scoring

Contacts are compared across multiple dimensions with weighted importance:

```typescript
{
  emailSimilarity: 0.4,      // 40% weight - Most important
  nameSimilarity: 0.3,       // 30% weight
  phoneSimilarity: 0.15,     // 15% weight
  companySimilarity: 0.1,    // 10% weight
  metadataSimilarity: 0.05,  // 5% weight
}
```

**Overall Score**: 0-1 (0 = completely different, 1 = identical)

### Confidence Levels

Based on similarity score:
- **High** (≥0.9): Very likely duplicates → Auto-merge recommended
- **Medium** (0.7-0.9): Probable duplicates → Merge with review
- **Low** (0.3-0.7): Possible connection → Link or manual review
- **Very Low** (<0.3): Unlikely duplicates → Ignore

### Suggested Actions

- **Merge**: Combine into single entity (high confidence)
- **Link**: Create SIMILAR_TO relationship (medium confidence)
- **Review**: Manual inspection needed (low confidence)

---

## Similarity Algorithms

### Email Similarity

```typescript
// Exact match
'john@example.com' === 'john@example.com'  → 1.0

// Same domain, different user
'john@example.com' vs 'j.doe@example.com'  → 0.3-0.5

// Different domain
'john@example.com' vs 'john@other.com'     → 0.0
```

### Name Similarity (Levenshtein Distance)

```typescript
// Exact match
'John Doe' === 'John Doe'                  → 1.0

// Minor typo
'John Doe' vs 'Jon Doe'                    → 0.89

// Different order
'John Doe' vs 'Doe, John'                  → 0.67

// Completely different
'John Doe' vs 'Jane Smith'                 → 0.22
```

### Phone Similarity

```typescript
// Exact match (normalized)
'+1 (555) 123-4567' === '555-123-4567'     → 1.0

// Last 10 digits match
'+1-555-123-4567' vs '555-123-4567'        → 0.9

// Partial match
'555-123-4567' vs '555-123-9999'           → 0.4
```

---

## Usage Examples

### Find All Duplicates in Workspace

```bash
curl -X POST http://localhost:3008/api/neo4j/resolution \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "workspace-123",
    "action": "find",
    "threshold": 0.7
  }'
```

**Response**:
```json
{
  "success": true,
  "workspace_id": "workspace-123",
  "threshold": 0.7,
  "matches": [
    {
      "contact1": {
        "id": "contact-1",
        "email": "john@example.com",
        "name": "John Doe"
      },
      "contact2": {
        "id": "contact-2",
        "email": "j.doe@example.com",
        "name": "John D."
      },
      "score": 0.85,
      "factors": {
        "emailSimilarity": 0.45,
        "nameSimilarity": 0.78,
        "phoneSimilarity": 1.0,
        "companySimilarity": 1.0
      },
      "confidence": "high",
      "suggestedAction": "merge"
    }
  ],
  "count": 1
}
```

### Find Duplicates for Specific Contact

```bash
curl -X POST http://localhost:3008/api/neo4j/resolution \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "workspace-123",
    "contact_id": "contact-abc",
    "action": "find",
    "threshold": 0.6
  }'
```

### Merge Two Contacts

```bash
curl -X POST http://localhost:3008/api/neo4j/resolution \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "workspace-123",
    "action": "merge",
    "contact1_id": "contact-1",
    "contact2_id": "contact-2",
    "strategy": "prefer_complete"
  }'
```

**Response**:
```json
{
  "success": true,
  "mergedContact": {
    "id": "contact-1",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "+1-555-123-4567",
    "company": "Acme Inc",
    "ai_score": 85
  },
  "removedContactId": "contact-2",
  "conflicts": [
    {
      "field": "name",
      "value1": "John Doe",
      "value2": "John D.",
      "resolution": "John Doe",
      "strategy": "prefer_complete"
    }
  ]
}
```

### Link Similar Contacts (Without Merging)

```bash
curl -X POST http://localhost:3008/api/neo4j/resolution \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "workspace-123",
    "action": "link",
    "contact1_id": "contact-1",
    "contact2_id": "contact-2",
    "similarity_score": 0.72,
    "factors": {
      "emailSimilarity": 0.5,
      "nameSimilarity": 0.8
    }
  }'
```

Creates a `SIMILAR_TO` relationship for manual review later.

---

## Programmatic Usage

### Calculate Similarity

```typescript
import { calculateSimilarity } from '@/lib/neo4j/resolution';

const contact1 = {
  id: '1',
  workspace_id: 'workspace-123',
  email: 'john@example.com',
  name: 'John Doe',
  phone: '555-123-4567',
  company: 'Acme Inc',
};

const contact2 = {
  id: '2',
  workspace_id: 'workspace-123',
  email: 'j.doe@example.com',
  name: 'John D.',
  phone: '5551234567',
  company: 'Acme Inc',
};

const match = calculateSimilarity(contact1, contact2);

console.log(match);
// {
//   score: 0.85,
//   confidence: 'high',
//   suggestedAction: 'merge',
//   factors: { ... }
// }
```

### Find Duplicates

```typescript
import { findDuplicates, findDuplicatesForContact } from '@/lib/neo4j/resolution';

// Find all duplicates
const allMatches = await findDuplicates('workspace-123', 0.7);

// Find duplicates for specific contact
const contactMatches = await findDuplicatesForContact(
  'contact-abc',
  'workspace-123',
  0.6
);
```

### Merge Contacts

```typescript
import { mergeContacts } from '@/lib/neo4j/resolution';

const result = await mergeContacts(
  'contact-1',     // Keep this contact
  'contact-2',     // Remove this contact
  'workspace-123',
  'prefer_complete' // Merge strategy
);

console.log(result);
// {
//   success: true,
//   mergedContact: { ... },
//   removedContactId: 'contact-2',
//   conflicts: [...]
// }
```

### AI-Powered Conflict Resolution

```typescript
import { aiResolveConflicts } from '@/lib/neo4j/resolution';

const mergedContact = await aiResolveConflicts(contact1, contact2);

// Claude analyzes both contacts and suggests best merged record
```

---

## Merge Strategies

### 1. `keep_first`
Always keep value from first contact.

**Use case**: When contact1 is known to be more authoritative.

```typescript
await mergeContacts(authoritativeId, duplicateId, workspaceId, 'keep_first');
```

### 2. `keep_second`
Always keep value from second contact.

**Use case**: When contact2 has more recent data.

```typescript
await mergeContacts(oldId, newId, workspaceId, 'keep_second');
```

### 3. `prefer_complete` (Default)
Choose value with more information.

**Rules**:
- Longer strings preferred
- Higher numbers preferred
- Non-null over null

**Use case**: General-purpose merging.

```typescript
await mergeContacts(id1, id2, workspaceId, 'prefer_complete');
```

### 4. `ai_resolve`
Use Claude AI to resolve conflicts intelligently.

**Features**:
- Context-aware resolution
- Considers data quality
- Identifies most accurate values

**Use case**: Complex conflicts requiring intelligence.

```typescript
await mergeContacts(id1, id2, workspaceId, 'ai_resolve');
```

---

## Merge Process

### What Gets Merged

1. **Properties**: name, phone, company, status, ai_score, metadata
2. **Relationships**: All emails, connections, and other relationships
3. **Activity**: Complete interaction history

### Merge Steps

1. **Fetch both contacts** from graph database
2. **Compare properties** field by field
3. **Resolve conflicts** using selected strategy
4. **Update primary contact** with merged data
5. **Transfer relationships** from duplicate to primary
   - Emails (SENT/RECEIVED)
   - Connections (CONNECTED_TO)
   - Campaign enrollments
   - Tags
6. **Delete duplicate contact** and dangling relationships
7. **Return merge result** with conflict details

### Relationship Transfer Example

```cypher
// Before merge
(Contact-1)-[:SENT]->(Email-A)
(Contact-2)-[:SENT]->(Email-B)
(Contact-2)-[:CONNECTED_TO]-(Contact-3)

// After merging Contact-2 into Contact-1
(Contact-1)-[:SENT]->(Email-A)
(Contact-1)-[:SENT]->(Email-B)     // Transferred
(Contact-1)-[:CONNECTED_TO]-(Contact-3)  // Transferred
// Contact-2 deleted
```

---

## Query Patterns

### Find Contacts with High Similarity

```cypher
MATCH (c1:Contact {workspace_id: $workspaceId})-[r:SIMILAR_TO]-(c2:Contact)
WHERE r.similarity_score > 0.8
RETURN c1, c2, r.similarity_score as score, r.factors as factors
ORDER BY score DESC
```

### Find Contacts Needing Review

```cypher
MATCH (c1:Contact {workspace_id: $workspaceId})-[r:SIMILAR_TO]-(c2:Contact)
WHERE r.similarity_score >= 0.5 AND r.similarity_score < 0.7
RETURN c1.email, c2.email, r.similarity_score
ORDER BY r.similarity_score DESC
```

### Count Potential Duplicates

```cypher
MATCH (c:Contact {workspace_id: $workspaceId})
OPTIONAL MATCH (c)-[r:SIMILAR_TO]-()
WHERE r.similarity_score >= 0.7
WITH c, count(DISTINCT r) as duplicate_count
WHERE duplicate_count > 0
RETURN count(c) as contacts_with_duplicates, sum(duplicate_count) as total_duplicates
```

---

## API Endpoints

### Find Duplicates
```
POST /api/neo4j/resolution
Body: { workspace_id, action: "find", threshold?, contact_id? }
```

### Merge Contacts
```
POST /api/neo4j/resolution
Body: { workspace_id, action: "merge", contact1_id, contact2_id, strategy?, use_ai? }
```

### Link Similar Contacts
```
POST /api/neo4j/resolution
Body: { workspace_id, action: "link", contact1_id, contact2_id, similarity_score, factors }
```

### Get Statistics
```
GET /api/neo4j/resolution/stats?workspace_id=xxx
```

---

## Best Practices

### 1. Set Appropriate Thresholds

```typescript
// Conservative (high precision, may miss some duplicates)
const matches = await findDuplicates(workspaceId, 0.85);

// Balanced (recommended)
const matches = await findDuplicates(workspaceId, 0.7);

// Aggressive (high recall, more false positives)
const matches = await findDuplicates(workspaceId, 0.5);
```

### 2. Review Before Merging

Always review matches with `confidence: 'medium'` or `'low'` before auto-merging.

```typescript
const matches = await findDuplicates(workspaceId, 0.7);

for (const match of matches) {
  if (match.confidence === 'high') {
    // Auto-merge
    await mergeContacts(match.contact1.id, match.contact2.id, workspaceId);
  } else {
    // Flag for manual review
    await linkSimilarContacts(
      match.contact1.id,
      match.contact2.id,
      workspaceId,
      match.score,
      match.factors
    );
  }
}
```

### 3. Use Batch Processing

For large workspaces, process in batches:

```typescript
const batchSize = 100;
const matches = await findDuplicates(workspaceId, 0.7);

for (let i = 0; i < matches.length; i += batchSize) {
  const batch = matches.slice(i, i + batchSize);

  await Promise.all(
    batch
      .filter(m => m.confidence === 'high')
      .map(m => mergeContacts(m.contact1.id, m.contact2.id, workspaceId))
  );
}
```

### 4. Monitor Resolution Stats

```typescript
import { getResolutionStats } from '@/lib/neo4j/resolution';

const stats = await getResolutionStats(workspaceId);

console.log(`Total contacts: ${stats.totalContacts}`);
console.log(`Similarity links: ${stats.similarityLinks}`);
console.log(`Avg similarity: ${stats.avgSimilarityScore.toFixed(2)}`);
```

### 5. Handle Errors Gracefully

```typescript
try {
  const result = await mergeContacts(id1, id2, workspaceId);

  if (result.conflicts.length > 0) {
    console.log(`Resolved ${result.conflicts.length} conflicts`);
  }
} catch (error) {
  console.error('Merge failed:', error);
  // Fallback: create SIMILAR_TO link for manual review
  await linkSimilarContacts(id1, id2, workspaceId, 0.75, {});
}
```

---

## Performance Optimization

### 1. Index Critical Properties

Already created in schema initialization:
- `Contact.email` (unique)
- `Contact.name`
- `Contact.phone`

### 2. Limit Comparison Scope

```typescript
// Don't compare all contacts - use filters
const query = `
  MATCH (c:Contact {workspace_id: $workspaceId})
  WHERE c.created_at >= datetime() - duration('P30D')  // Last 30 days only
  RETURN c
`;
```

### 3. Parallel Processing

```typescript
const contacts = await getAllContacts(workspaceId);
const chunks = chunkArray(contacts, 50);

const allMatches = await Promise.all(
  chunks.map(chunk => findDuplicatesInChunk(chunk))
);

const flatMatches = allMatches.flat();
```

### 4. Cache Results

Store duplicate detection results temporarily:

```typescript
import { redis } from '@/lib/redis';

const cacheKey = `duplicates:${workspaceId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const matches = await findDuplicates(workspaceId);
await redis.setex(cacheKey, 3600, JSON.stringify(matches)); // 1 hour cache

return matches;
```

---

## Troubleshooting

### High False Positive Rate

**Problem**: Too many incorrect duplicate matches

**Solution**:
- Increase threshold: `threshold: 0.8` or `0.85`
- Adjust weights in similarity calculation
- Add custom filtering logic

### Missing True Duplicates

**Problem**: Known duplicates not detected

**Solution**:
- Lower threshold: `threshold: 0.6` or `0.5`
- Check data quality (typos, missing fields)
- Add custom similarity factors

### Slow Performance

**Problem**: Duplicate detection takes too long

**Solution**:
- Reduce contact set with date filters
- Use parallel processing (chunks)
- Cache results
- Index additional properties

### Merge Conflicts

**Problem**: Unclear which value to keep

**Solution**:
- Use `ai_resolve` strategy
- Manually review `SIMILAR_TO` links
- Implement custom resolution logic

---

## Next Steps

1. ✅ Entity resolution engine complete
2. ⏭️  Pattern detection & analytics (Unite-Hub-ove.2.4)
3. ⏭️  API endpoints & integration (Unite-Hub-ove.2.5)

---

**Status**: ✅ COMPLETE
**Task**: Unite-Hub-ove.2.3
**Next**: Unite-Hub-ove.2.4 (Pattern Detection & Analytics)
