# Neo4j Pattern Detection & Analytics

**Created**: 2026-01-27
**Status**: Complete
**Task**: Unite-Hub-ove.2.4 (Pattern Detection & Analytics)

---

## Overview

The Pattern Detection & Analytics Engine provides advanced graph algorithms and network analysis for Unite-Hub's knowledge graph:

- **Centrality measures** - Identify influential contacts (degree, betweenness, closeness, PageRank)
- **Community detection** - Find groups and clusters (Label Propagation, Louvain)
- **Influence scoring** - Composite contact importance (network + quality + activity)
- **Communication patterns** - Frequency, response rates, trends
- **Relationship strength** - Connection quality and longevity
- **Network statistics** - Overall graph health and metrics

---

## Core Concepts

### Centrality Measures

Centrality identifies important nodes in a network:

#### Degree Centrality
**Definition**: Number of direct connections

**Use Case**: Find well-connected contacts

**Formula**: `degree(node) = |neighbors(node)|`

**Interpretation**:
- High degree = Many connections
- Low degree = Few connections

#### Betweenness Centrality (requires GDS)
**Definition**: How often a contact appears on shortest paths between others

**Use Case**: Find "bridge" contacts connecting different groups

**Formula**: `betweenness(v) = Σ(σ(s,t|v) / σ(s,t))`
- σ(s,t) = total shortest paths from s to t
- σ(s,t|v) = shortest paths passing through v

**Interpretation**:
- High betweenness = Critical connector
- Low betweenness = Peripheral or within dense cluster

#### Closeness Centrality
**Definition**: Average distance to all other contacts

**Use Case**: Find contacts who can quickly reach others

**Formula**: `closeness(v) = 1 / Σ distance(v, u)`

**Interpretation**:
- High closeness = Central in network
- Low closeness = On periphery

#### PageRank (requires GDS)
**Definition**: Importance based on connections from important contacts

**Use Case**: Find influential contacts with influential connections

**Formula**: `PR(v) = (1-d)/N + d Σ PR(u)/degree(u)`
- d = damping factor (0.85)
- N = total nodes
- u = nodes linking to v

**Interpretation**:
- High PageRank = Influential with influential connections
- Low PageRank = Less influential or connected to less influential

### Community Detection

Groups contacts into clusters based on connection patterns.

#### Label Propagation (requires GDS)
**Algorithm**: Nodes iteratively adopt labels from neighbors

**Characteristics**:
- Fast (O(n))
- Non-deterministic
- Good for large networks

**Use Case**: Quick community detection for marketing segmentation

#### Louvain (requires GDS)
**Algorithm**: Maximizes modularity through hierarchical clustering

**Characteristics**:
- Slower (O(n log n))
- Deterministic
- Better quality communities

**Use Case**: Detailed community analysis for targeted campaigns

#### Simple Connected Components
**Algorithm**: Groups based on transitive connections

**Characteristics**:
- Very fast
- Always deterministic
- Basic clustering

**Use Case**: Fallback when GDS library unavailable

### Influence Scoring

Composite score (0-100) based on multiple factors:

**Formula**:
```
influence = 0.35 * networkCentrality +
            0.25 * connectionQuality +
            0.20 * activityLevel +
            0.20 * aiScore
```

**Factors**:
- **Network Centrality** (35%) - Position in network (degree / 100)
- **Connection Quality** (25%) - Average AI score of connections
- **Activity Level** (20%) - Email frequency (emails / 50)
- **AI Score** (20%) - Contact's own AI score

**Interpretation**:
- 80-100: Highly influential (top tier)
- 60-80: Influential (important contacts)
- 40-60: Moderately influential
- 20-40: Low influence
- 0-20: Minimal influence

### Communication Patterns

Analyzes email behavior:

**Metrics**:
- **Email Frequency**: Emails per week (last 30 days)
- **Response Rate**: % of received emails with replies
- **Response Time**: Average hours to respond
- **Activity Trend**: increasing / stable / decreasing (comparing last 30 vs previous 30 days)

**Use Case**: Identify engagement levels and optimal outreach timing

### Relationship Strength

Measures connection quality (0-1):

**Formula**:
```
strength = 0.4 * interactionFactor +
           0.3 * recencyFactor +
           0.2 * mutualFactor +
           0.1 * companyBonus
```

**Factors**:
- **Interaction Factor** (40%): `interactionCount / 20`
- **Recency Factor** (30%): `1 / (1 + daysSinceInteraction / 30)`
- **Mutual Connections** (20%): `mutualCount / 10`
- **Company Bonus** (10%): `+0.2` if shared company

**Classification**:
- 0.7-1.0: Strong relationship
- 0.5-0.7: Moderate relationship
- 0.3-0.5: Weak relationship
- <0.3: Minimal relationship (filtered out by default)

---

## Usage Examples

### Calculate Degree Centrality

```bash
curl -X POST http://localhost:3008/api/neo4j/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "workspace-123",
    "action": "centrality",
    "limit": 50
  }'
```

**Response**:
```json
{
  "success": true,
  "workspace_id": "workspace-123",
  "action": "centrality",
  "result": [
    {
      "contactId": "contact-1",
      "contactEmail": "john@example.com",
      "contactName": "John Doe",
      "degreeCentrality": 45
    },
    {
      "contactId": "contact-2",
      "contactEmail": "jane@example.com",
      "contactName": "Jane Smith",
      "degreeCentrality": 38
    }
  ],
  "count": 50,
  "timestamp": "2026-01-27T12:00:00Z"
}
```

### Calculate PageRank (Requires GDS)

```bash
curl -X POST http://localhost:3008/api/neo4j/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "workspace-123",
    "action": "pagerank",
    "limit": 20
  }'
```

**Response**:
```json
{
  "success": true,
  "result": [
    {
      "contactId": "contact-1",
      "contactEmail": "john@example.com",
      "contactName": "John Doe",
      "pageRank": 3.45,
      "degreeCentrality": 0
    }
  ]
}
```

### Detect Communities

```bash
curl -X POST http://localhost:3008/api/neo4j/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "workspace-123",
    "action": "communities"
  }'
```

**Response**:
```json
{
  "success": true,
  "result": [
    {
      "communityId": 1,
      "members": [
        {
          "contactId": "contact-1",
          "email": "john@example.com",
          "name": "John Doe"
        },
        {
          "contactId": "contact-2",
          "email": "jane@example.com",
          "name": "Jane Smith"
        }
      ],
      "size": 12,
      "density": 0.67,
      "avgAiScore": 78.5
    }
  ]
}
```

### Calculate Influence Scores

```bash
curl -X POST http://localhost:3008/api/neo4j/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "workspace-123",
    "action": "influence",
    "limit": 100
  }'
```

**Response**:
```json
{
  "success": true,
  "result": [
    {
      "contactId": "contact-1",
      "email": "john@example.com",
      "name": "John Doe",
      "influenceScore": 87.5,
      "factors": {
        "networkCentrality": 0.45,
        "connectionQuality": 0.82,
        "activityLevel": 0.68,
        "aiScore": 0.85
      },
      "rank": 1
    }
  ]
}
```

### Analyze Communication Patterns

```bash
curl -X POST http://localhost:3008/api/neo4j/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "workspace-123",
    "action": "patterns",
    "contact_id": "contact-1",
    "limit": 50
  }'
```

**Response**:
```json
{
  "success": true,
  "result": [
    {
      "contactId": "contact-1",
      "email": "john@example.com",
      "name": "John Doe",
      "patterns": {
        "emailFrequency": 4.2,
        "responseRate": 0.68
      },
      "lastActivity": "2026-01-27T10:00:00Z",
      "activityTrend": "increasing"
    }
  ]
}
```

### Calculate Relationship Strength

```bash
curl -X POST http://localhost:3008/api/neo4j/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "workspace-123",
    "action": "relationships",
    "contact_id": "contact-1",
    "min_strength": 0.5,
    "limit": 20
  }'
```

**Response**:
```json
{
  "success": true,
  "result": [
    {
      "contact1": {
        "id": "contact-1",
        "email": "john@example.com",
        "name": "John Doe"
      },
      "contact2": {
        "id": "contact-2",
        "email": "jane@example.com",
        "name": "Jane Smith"
      },
      "strength": 0.85,
      "factors": {
        "interactionCount": 42,
        "interactionRecency": 3,
        "mutualConnections": 8,
        "sharedCompany": true
      },
      "type": "strong"
    }
  ]
}
```

### Find Shortest Path

```bash
curl -X POST http://localhost:3008/api/neo4j/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "workspace-123",
    "action": "path",
    "contact1_id": "contact-1",
    "contact2_id": "contact-50"
  }'
```

**Response**:
```json
{
  "success": true,
  "result": [
    {
      "id": "contact-1",
      "email": "john@example.com",
      "name": "John Doe",
      "workspace_id": "workspace-123"
    },
    {
      "id": "contact-25",
      "email": "bob@example.com",
      "name": "Bob Johnson",
      "workspace_id": "workspace-123"
    },
    {
      "id": "contact-50",
      "email": "alice@example.com",
      "name": "Alice Williams",
      "workspace_id": "workspace-123"
    }
  ]
}
```

### Get Network Statistics

```bash
curl http://localhost:3008/api/neo4j/analytics/stats?workspace_id=workspace-123
```

**Response**:
```json
{
  "workspace_id": "workspace-123",
  "stats": {
    "workspaceId": "workspace-123",
    "totalContacts": 150,
    "totalConnections": 487,
    "avgConnections": 3.25,
    "networkDensity": 0.043,
    "largestComponent": 98,
    "communities": 5
  },
  "timestamp": "2026-01-27T12:00:00Z"
}
```

---

## Programmatic Usage

### TypeScript Examples

#### Calculate Centrality

```typescript
import { calculateDegreeCentrality } from '@/lib/neo4j/analytics';

const centrality = await calculateDegreeCentrality('workspace-123', 50);

console.log(centrality);
// [
//   {
//     contactId: 'contact-1',
//     contactEmail: 'john@example.com',
//     contactName: 'John Doe',
//     degreeCentrality: 45
//   },
//   ...
// ]
```

#### Detect Communities

```typescript
import { detectCommunities } from '@/lib/neo4j/analytics';

const communities = await detectCommunities('workspace-123');

console.log(`Found ${communities.length} communities`);
console.log(`Largest community: ${communities[0].size} members`);
```

#### Calculate Influence Scores

```typescript
import { calculateInfluenceScores } from '@/lib/neo4j/analytics';

const influencers = await calculateInfluenceScores('workspace-123', 20);

// Get top 5 influencers
const topInfluencers = influencers.slice(0, 5);

topInfluencers.forEach((contact) => {
  console.log(`${contact.name}: ${contact.influenceScore.toFixed(1)}/100`);
  console.log(`  Network: ${(contact.factors.networkCentrality * 100).toFixed(0)}%`);
  console.log(`  Quality: ${(contact.factors.connectionQuality * 100).toFixed(0)}%`);
  console.log(`  Activity: ${(contact.factors.activityLevel * 100).toFixed(0)}%`);
});
```

#### Analyze Communication Patterns

```typescript
import { analyzeCommunicationPatterns } from '@/lib/neo4j/analytics';

// All contacts
const allPatterns = await analyzeCommunicationPatterns('workspace-123');

// Specific contact
const contactPatterns = await analyzeCommunicationPatterns('workspace-123', 'contact-1');

console.log(`Email frequency: ${contactPatterns[0].patterns.emailFrequency.toFixed(1)}/week`);
console.log(`Response rate: ${(contactPatterns[0].patterns.responseRate * 100).toFixed(0)}%`);
console.log(`Trend: ${contactPatterns[0].activityTrend}`);
```

#### Calculate Relationship Strength

```typescript
import { calculateRelationshipStrength } from '@/lib/neo4j/analytics';

// All strong relationships
const strongRels = await calculateRelationshipStrength('workspace-123', undefined, 0.7);

// Relationships for specific contact
const contactRels = await calculateRelationshipStrength('workspace-123', 'contact-1', 0.5);

console.log(`${strongRels.length} strong relationships found`);
```

#### Get Network Statistics

```typescript
import { getNetworkStats } from '@/lib/neo4j/analytics';

const stats = await getNetworkStats('workspace-123');

console.log(`Total contacts: ${stats.totalContacts}`);
console.log(`Total connections: ${stats.totalConnections}`);
console.log(`Average connections: ${stats.avgConnections.toFixed(2)}`);
console.log(`Network density: ${(stats.networkDensity * 100).toFixed(2)}%`);
console.log(`Communities: ${stats.communities}`);
```

#### Find Shortest Path

```typescript
import { findShortestPath } from '@/lib/neo4j/analytics';

const path = await findShortestPath('contact-1', 'contact-50', 'workspace-123');

if (path) {
  console.log(`Path length: ${path.length - 1} hops`);
  console.log('Path:', path.map((c) => c.name || c.email).join(' → '));
} else {
  console.log('No path found');
}
```

---

## Graph Data Science (GDS) Library

Some algorithms require the Neo4j Graph Data Science library.

### Algorithms Requiring GDS

- Betweenness Centrality
- PageRank
- Louvain Community Detection
- Advanced Label Propagation

### Fallback Behavior

When GDS is not available:
- **Betweenness**: Returns empty array, logs warning
- **PageRank**: Returns empty array, logs warning
- **Communities**: Falls back to simple connected components

### Installing GDS

GDS is already configured in `docker-compose.yml`:

```yaml
NEO4JLABS_PLUGINS: '["apoc", "graph-data-science"]'
```

If Neo4j is already running, restart:

```bash
npm run docker:stop
npm run docker:start
```

Verify installation:

```cypher
CALL gds.list()
```

---

## Use Cases

### Marketing Campaign Targeting

**Goal**: Find influential contacts for campaign seeding

**Approach**:
1. Calculate influence scores
2. Detect communities
3. Select top influencers from each community

```typescript
const influencers = await calculateInfluenceScores(workspaceId, 100);
const communities = await detectCommunities(workspaceId);

// Select top 3 influencers per community
const campaignSeeds = communities.flatMap((community) => {
  const communityInfluencers = influencers.filter((inf) =>
    community.members.some((m) => m.contactId === inf.contactId)
  );

  return communityInfluencers.slice(0, 3);
});

console.log(`Selected ${campaignSeeds.length} campaign seeds`);
```

### Re-Engagement Campaigns

**Goal**: Identify disengaged contacts to re-activate

**Approach**:
1. Analyze communication patterns
2. Find contacts with decreasing activity
3. Calculate relationship strength to prioritize

```typescript
const patterns = await analyzeCommunicationPatterns(workspaceId, undefined, 200);

const disengaged = patterns.filter(
  (p) => p.activityTrend === 'decreasing' && p.patterns.responseRate < 0.3
);

// Prioritize by relationship strength
const relationships = await calculateRelationshipStrength(workspaceId, undefined, 0.3);

const priorityReEngagement = disengaged
  .map((contact) => {
    const rel = relationships.find(
      (r) => r.contact1.id === contact.contactId || r.contact2.id === contact.contactId
    );
    return { ...contact, strength: rel?.strength || 0 };
  })
  .sort((a, b) => b.strength - a.strength);

console.log(`${priorityReEngagement.length} contacts for re-engagement`);
```

### Network Expansion

**Goal**: Find contacts who can introduce you to others

**Approach**:
1. Calculate betweenness centrality
2. Find contacts with high betweenness but moderate connection to you
3. Request introductions

```typescript
const betweenness = await calculateBetweennessCentrality(workspaceId, 100);

// Find contacts with high betweenness
const connectors = betweenness.filter((c) => c.betweennessCentrality! > 0.1);

// Check relationship strength
const myRelationships = await calculateRelationshipStrength(
  workspaceId,
  myContactId,
  0.3
);

// Connectors with moderate relationship
const introductionTargets = connectors.filter((connector) => {
  const rel = myRelationships.find(
    (r) => r.contact2.id === connector.contactId
  );
  return rel && rel.strength >= 0.5 && rel.strength < 0.8;
});

console.log(`${introductionTargets.length} potential introducers`);
```

### Account-Based Marketing (ABM)

**Goal**: Identify key decision-makers within target accounts

**Approach**:
1. Find contacts at target company
2. Calculate influence within company network
3. Map internal relationships

```typescript
const targetCompanyDomain = 'acme.com';

// Get all contacts at company
const query = `
  MATCH (c:Contact {workspace_id: $workspaceId})-[:WORKS_AT]->(co:Company {domain: $domain})
  RETURN c.id as contactId
`;
const result = await readQuery(query, { workspaceId, domain: targetCompanyDomain });
const companyContactIds = result.records.map((r) => r.get('contactId'));

// Calculate influence for company contacts
const companyInfluence = await calculateInfluenceScores(workspaceId, 500);
const keyDecisionMakers = companyInfluence
  .filter((inf) => companyContactIds.includes(inf.contactId))
  .slice(0, 10);

console.log(`Top ${keyDecisionMakers.length} decision-makers at ${targetCompanyDomain}`);
```

---

## Performance Optimization

### 1. Use Appropriate Limits

```typescript
// Good - reasonable limit
const centrality = await calculateDegreeCentrality(workspaceId, 100);

// Bad - too large, slow query
const centrality = await calculateDegreeCentrality(workspaceId, 10000);
```

### 2. Cache Network Statistics

```typescript
import { redis } from '@/lib/redis';

const cacheKey = `network-stats:${workspaceId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const stats = await getNetworkStats(workspaceId);
await redis.setex(cacheKey, 3600, JSON.stringify(stats)); // 1 hour cache

return stats;
```

### 3. Schedule Heavy Computations

For large workspaces, schedule GDS algorithms:

```typescript
import { Queue } from 'bull';

const analyticsQueue = new Queue('analytics');

// Schedule PageRank calculation
await analyticsQueue.add('pagerank', {
  workspaceId,
  limit: 100,
});

// Process in background
analyticsQueue.process('pagerank', async (job) => {
  const { workspaceId, limit } = job.data;
  const result = await calculatePageRank(workspaceId, limit);

  // Store in cache
  await redis.setex(
    `pagerank:${workspaceId}`,
    7200,
    JSON.stringify(result)
  );

  return result;
});
```

### 4. Use Composite Queries

Instead of multiple round-trips:

```typescript
// Bad - 3 separate queries
const centrality = await calculateDegreeCentrality(workspaceId);
const influence = await calculateInfluenceScores(workspaceId);
const patterns = await analyzeCommunicationPatterns(workspaceId);

// Good - single comprehensive query with all metrics
const query = `
  MATCH (c:Contact {workspace_id: $workspaceId})
  OPTIONAL MATCH (c)-[conn:CONNECTED_TO]-(other:Contact)
  WITH c, COUNT(DISTINCT other) as degree
  // ... calculate all metrics in one query
  RETURN c, degree, influence, patterns
`;
```

---

## Troubleshooting

### GDS Library Not Available

**Error**: `There is no procedure with the name gds.pageRank.stream`

**Solution**:
1. Verify GDS plugin in `docker-compose.yml`
2. Restart Neo4j: `npm run docker:stop && npm run docker:start`
3. Check logs: `npm run docker:logs`

**Fallback**: Use degree centrality instead of PageRank

### Slow Queries

**Problem**: Analytics queries taking > 5 seconds

**Solutions**:
1. Reduce limit parameter
2. Add indexes on frequently queried properties
3. Use GDS library for advanced algorithms (much faster)
4. Cache results for 1-2 hours

### Empty Results

**Problem**: Analytics returning empty arrays

**Causes**:
- No CONNECTED_TO relationships created
- Contacts not linked via `linkContacts()`
- Workspace isolation filtering out data

**Solution**: Ensure contacts are properly linked:

```typescript
import { linkContacts } from '@/lib/neo4j';

await linkContacts('john@example.com', 'jane@example.com', workspaceId, 0.8);
```

---

## Next Steps

1. ✅ Pattern detection & analytics engine complete
2. ⏭️  API endpoints & dashboard integration (Unite-Hub-ove.2.5)
3. ⏭️  Visualization components (graphs, charts)
4. ⏭️  Real-time analytics updates

---

**Status**: ✅ COMPLETE
**Task**: Unite-Hub-ove.2.4
**Next**: Unite-Hub-ove.2.5 (API Endpoints & Integration)
