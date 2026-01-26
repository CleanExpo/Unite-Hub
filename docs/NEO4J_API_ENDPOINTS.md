# Neo4j API Endpoints & Integration

**Created**: 2026-01-27
**Status**: Complete
**Task**: Unite-Hub-ove.2.5 (API Endpoints & Integration)

---

## Overview

Complete REST API for Unite-Hub's Neo4j knowledge graph, providing:

- **Schema Management** - Initialize, verify, and manage graph schema
- **Data Synchronization** - Sync from Supabase to Neo4j
- **Entity Queries** - Search and retrieve entities
- **Relationship Traversal** - Navigate entity connections
- **Pattern Detection** - Graph analytics and insights
- **Entity Resolution** - Duplicate detection and merging
- **Query Builder** - Safe, parameterized query execution

---

## Base URL

```
http://localhost:3008/api/neo4j
```

---

## API Endpoints

### Schema Management

#### Initialize Schema
```http
POST /api/neo4j/schema
```

Creates constraints and indexes for knowledge graph.

**Response**:
```json
{
  "success": true,
  "message": "Schema initialized successfully",
  "constraints": 11,
  "indexes": 20
}
```

#### Verify Schema
```http
GET /api/neo4j/schema
```

Check schema health and statistics.

**Response**:
```json
{
  "schema": {
    "nodes": ["Contact", "Company", "Email", ...],
    "relationships": ["SENT", "RECEIVED", "CONNECTED_TO", ...],
    "constraints": 11,
    "indexes": 20
  }
}
```

#### Drop Schema
```http
DELETE /api/neo4j/schema
```

**⚠️ WARNING**: Deletes all graph data.

---

### Data Synchronization

#### Full Sync
```http
POST /api/neo4j/sync
```

**Body**:
```json
{
  "workspace_id": "workspace-123",
  "mode": "full"
}
```

**Response**:
```json
{
  "success": true,
  "synced": {
    "contacts": 150,
    "companies": 45,
    "emails": 1200
  },
  "duration_ms": 5432
}
```

#### Incremental Sync
```http
POST /api/neo4j/sync
```

**Body**:
```json
{
  "workspace_id": "workspace-123",
  "mode": "incremental",
  "since": "2026-01-27T00:00:00Z"
}
```

#### Get Sync Status
```http
GET /api/neo4j/sync?workspace_id=workspace-123
```

---

### Entity Queries

#### Query Entities by Type
```http
GET /api/neo4j/entities?workspace_id=workspace-123&type=contact&limit=100&sort=created_at&order=desc
```

**Query Parameters**:
- `workspace_id` (required): Workspace UUID
- `type` (required): Entity type (contact, company, email, user, workspace, campaign, tag)
- `limit` (optional): Max results (default: 100)
- `offset` (optional): Skip results (default: 0)
- `sort` (optional): Sort field (default: created_at)
- `order` (optional): Sort order (asc|desc, default: desc)

**Response**:
```json
{
  "workspace_id": "workspace-123",
  "type": "contact",
  "entities": [
    {
      "id": "contact-1",
      "email": "john@example.com",
      "name": "John Doe",
      "ai_score": 85
    }
  ],
  "count": 100
}
```

#### Search Entities
```http
POST /api/neo4j/entities/search
```

**Body**:
```json
{
  "workspace_id": "workspace-123",
  "type": "contact",
  "query": "john",
  "filters": {
    "status": "prospect",
    "company": "Acme"
  },
  "limit": 50
}
```

**Response**:
```json
{
  "success": true,
  "results": [
    {
      "id": "contact-1",
      "email": "john@acme.com",
      "name": "John Doe",
      "company": "Acme Inc",
      "status": "prospect"
    }
  ],
  "count": 1
}
```

#### Get Entity by ID
```http
GET /api/neo4j/entities/contact-123?workspace_id=workspace-123&type=contact&include_relationships=true&relationship_limit=50
```

**Query Parameters**:
- `workspace_id` (required)
- `type` (required)
- `include_relationships` (optional): Include relationships (default: false)
- `relationship_limit` (optional): Max relationships (default: 50)

**Response**:
```json
{
  "entity": {
    "id": "contact-123",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "relationships": [
    {
      "type": "CONNECTED_TO",
      "direction": "outgoing",
      "properties": {"strength": 0.85},
      "relatedEntity": {
        "labels": ["Contact"],
        "properties": {"email": "jane@example.com"}
      }
    }
  ],
  "relationshipCount": 15
}
```

---

### Relationship Traversal

#### Traverse Relationships
```http
POST /api/neo4j/relationships/traverse
```

**Body**:
```json
{
  "workspace_id": "workspace-123",
  "entity_id": "contact-1",
  "entity_type": "contact",
  "relationship_types": ["CONNECTED_TO", "WORKS_AT"],
  "direction": "both",
  "depth": 2,
  "limit": 100
}
```

**Parameters**:
- `direction`: outgoing | incoming | both (default: both)
- `depth`: 1-5 (default: 1)
- `relationship_types`: Filter by types (optional)

**Response**:
```json
{
  "success": true,
  "paths": [
    {
      "nodes": [
        {"labels": ["Contact"], "properties": {"email": "john@example.com"}},
        {"labels": ["Contact"], "properties": {"email": "jane@example.com"}}
      ],
      "relationships": [
        {"type": "CONNECTED_TO", "properties": {"strength": 0.85}}
      ],
      "pathLength": 1
    }
  ],
  "pathCount": 25
}
```

#### Find Path Between Entities
```http
POST /api/neo4j/relationships/find
```

**Body**:
```json
{
  "workspace_id": "workspace-123",
  "entity1_id": "contact-1",
  "entity2_id": "contact-50",
  "entity1_type": "contact",
  "entity2_type": "contact",
  "mode": "shortest",
  "max_depth": 5,
  "limit": 10
}
```

**Modes**:
- `shortest`: Single shortest path
- `all`: All paths up to max_depth
- `direct`: Only direct relationships

**Response**:
```json
{
  "success": true,
  "paths": [
    {
      "nodes": [...],
      "relationships": [...],
      "pathLength": 3
    }
  ],
  "pathCount": 1,
  "shortestPathLength": 3
}
```

#### Get Relationship Types
```http
GET /api/neo4j/relationships/types?workspace_id=workspace-123
```

**Response**:
```json
{
  "relationshipTypes": [
    {
      "type": "CONNECTED_TO",
      "count": 487,
      "startNodeTypes": ["Contact"],
      "endNodeTypes": ["Contact"]
    },
    {
      "type": "WORKS_AT",
      "count": 150,
      "startNodeTypes": ["Contact"],
      "endNodeTypes": ["Company"]
    }
  ],
  "totalTypes": 10
}
```

---

### Pattern Detection & Analytics

#### Calculate Centrality
```http
POST /api/neo4j/analytics
```

**Body**:
```json
{
  "workspace_id": "workspace-123",
  "action": "centrality",
  "limit": 50
}
```

**Response**:
```json
{
  "success": true,
  "action": "centrality",
  "result": [
    {
      "contactId": "contact-1",
      "contactEmail": "john@example.com",
      "contactName": "John Doe",
      "degreeCentrality": 45
    }
  ]
}
```

#### Calculate PageRank
```http
POST /api/neo4j/analytics
```

**Body**:
```json
{
  "workspace_id": "workspace-123",
  "action": "pagerank",
  "limit": 20
}
```

Requires Neo4j GDS library.

#### Detect Communities
```http
POST /api/neo4j/analytics
```

**Body**:
```json
{
  "workspace_id": "workspace-123",
  "action": "communities"
}
```

**Response**:
```json
{
  "success": true,
  "result": [
    {
      "communityId": 1,
      "members": [
        {"contactId": "contact-1", "email": "john@example.com"}
      ],
      "size": 12,
      "avgAiScore": 78.5
    }
  ]
}
```

#### Calculate Influence Scores
```http
POST /api/neo4j/analytics
```

**Body**:
```json
{
  "workspace_id": "workspace-123",
  "action": "influence",
  "limit": 100
}
```

**Response**:
```json
{
  "success": true,
  "result": [
    {
      "contactId": "contact-1",
      "email": "john@example.com",
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

#### Analyze Communication Patterns
```http
POST /api/neo4j/analytics
```

**Body**:
```json
{
  "workspace_id": "workspace-123",
  "action": "patterns",
  "contact_id": "contact-1",
  "limit": 50
}
```

**Response**:
```json
{
  "success": true,
  "result": [
    {
      "contactId": "contact-1",
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

#### Calculate Relationship Strength
```http
POST /api/neo4j/analytics
```

**Body**:
```json
{
  "workspace_id": "workspace-123",
  "action": "relationships",
  "contact_id": "contact-1",
  "min_strength": 0.5,
  "limit": 20
}
```

**Response**:
```json
{
  "success": true,
  "result": [
    {
      "contact1": {"id": "contact-1", "email": "john@example.com"},
      "contact2": {"id": "contact-2", "email": "jane@example.com"},
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

#### Find Shortest Path
```http
POST /api/neo4j/analytics
```

**Body**:
```json
{
  "workspace_id": "workspace-123",
  "action": "path",
  "contact1_id": "contact-1",
  "contact2_id": "contact-50"
}
```

#### Get Network Statistics
```http
GET /api/neo4j/analytics/stats?workspace_id=workspace-123
```

**Response**:
```json
{
  "stats": {
    "totalContacts": 150,
    "totalConnections": 487,
    "avgConnections": 3.25,
    "networkDensity": 0.043,
    "largestComponent": 98,
    "communities": 5
  }
}
```

---

### Entity Resolution

#### Find Duplicates
```http
POST /api/neo4j/resolution
```

**Body**:
```json
{
  "workspace_id": "workspace-123",
  "action": "find",
  "threshold": 0.7,
  "contact_id": "contact-1"
}
```

**Response**:
```json
{
  "success": true,
  "matches": [
    {
      "contact1": {"id": "contact-1", "email": "john@example.com"},
      "contact2": {"id": "contact-2", "email": "j.doe@example.com"},
      "score": 0.85,
      "confidence": "high",
      "suggestedAction": "merge"
    }
  ]
}
```

#### Merge Contacts
```http
POST /api/neo4j/resolution
```

**Body**:
```json
{
  "workspace_id": "workspace-123",
  "action": "merge",
  "contact1_id": "contact-1",
  "contact2_id": "contact-2",
  "strategy": "prefer_complete"
}
```

**Strategies**:
- `keep_first`: Keep contact1 values
- `keep_second`: Keep contact2 values
- `prefer_complete`: Choose more complete value
- `ai_resolve`: Use Claude AI for conflicts

**Response**:
```json
{
  "success": true,
  "mergedContact": {
    "id": "contact-1",
    "email": "john@example.com",
    "name": "John Doe"
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

#### Link Similar Contacts
```http
POST /api/neo4j/resolution
```

**Body**:
```json
{
  "workspace_id": "workspace-123",
  "action": "link",
  "contact1_id": "contact-1",
  "contact2_id": "contact-2",
  "similarity_score": 0.72
}
```

Creates SIMILAR_TO relationship for manual review.

#### Get Resolution Statistics
```http
GET /api/neo4j/resolution/stats?workspace_id=workspace-123
```

---

### Query Builder (Safe Queries)

#### Execute Pattern Query
```http
POST /api/neo4j/query
```

**Body**:
```json
{
  "workspace_id": "workspace-123",
  "pattern": "contact_network",
  "parameters": {
    "contactId": "contact-1"
  }
}
```

**Available Patterns**:
- `contact_network`: Get contact with connections and company
- `email_activity`: Get email activity for contact
- `company_contacts`: Get all contacts at a company
- `network_influencers`: Get influential contacts by connection count
- `recent_interactions`: Get recent email interactions
- `community_members`: Get contacts in network community
- `email_thread`: Get email thread with replies
- `contact_timeline`: Get contact activity timeline

**Response**:
```json
{
  "success": true,
  "pattern": "contact_network",
  "results": [
    {
      "contact": {"email": "john@example.com"},
      "connections": [
        {"contact": {"email": "jane@example.com"}, "strength": 0.85}
      ],
      "company": {"name": "Acme Inc"}
    }
  ]
}
```

#### Get Available Patterns
```http
GET /api/neo4j/query
```

**Response**:
```json
{
  "availablePatterns": [
    {
      "name": "contact_network",
      "requiredParams": ["contactId", "workspaceId"],
      "description": "Get contact network"
    }
  ],
  "totalPatterns": 8
}
```

---

## Complete API Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/neo4j/schema` | POST | Initialize schema |
| `/api/neo4j/schema` | GET | Verify schema |
| `/api/neo4j/schema` | DELETE | Drop schema |
| `/api/neo4j/sync` | POST | Sync data |
| `/api/neo4j/sync` | GET | Get sync status |
| `/api/neo4j/entities` | GET | Query entities |
| `/api/neo4j/entities/search` | POST | Search entities |
| `/api/neo4j/entities/[id]` | GET | Get entity by ID |
| `/api/neo4j/relationships/traverse` | POST | Traverse relationships |
| `/api/neo4j/relationships/find` | POST | Find paths |
| `/api/neo4j/relationships/types` | GET | Get relationship types |
| `/api/neo4j/analytics` | POST | Run analytics |
| `/api/neo4j/analytics/stats` | GET | Get network stats |
| `/api/neo4j/resolution` | POST | Entity resolution |
| `/api/neo4j/resolution/stats` | GET | Resolution stats |
| `/api/neo4j/query` | POST | Execute pattern query |
| `/api/neo4j/query` | GET | List patterns |

**Total Endpoints**: 17 (covering all graph operations)

---

## TypeScript Client Example

```typescript
import { NextApiRequest } from 'next';

class Neo4jClient {
  private baseUrl = '/api/neo4j';

  async queryEntities(
    workspaceId: string,
    type: string,
    limit: number = 100
  ) {
    const response = await fetch(
      `${this.baseUrl}/entities?workspace_id=${workspaceId}&type=${type}&limit=${limit}`
    );
    return await response.json();
  }

  async searchEntities(
    workspaceId: string,
    type: string,
    query: string
  ) {
    const response = await fetch(`${this.baseUrl}/entities/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: workspaceId, type, query }),
    });
    return await response.json();
  }

  async traverseRelationships(
    workspaceId: string,
    entityId: string,
    entityType: string,
    depth: number = 1
  ) {
    const response = await fetch(`${this.baseUrl}/relationships/traverse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: workspaceId,
        entity_id: entityId,
        entity_type: entityType,
        depth,
      }),
    });
    return await response.json();
  }

  async calculateInfluence(workspaceId: string, limit: number = 100) {
    const response = await fetch(`${this.baseUrl}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: workspaceId,
        action: 'influence',
        limit,
      }),
    });
    return await response.json();
  }

  async findDuplicates(workspaceId: string, threshold: number = 0.7) {
    const response = await fetch(`${this.baseUrl}/resolution`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: workspaceId,
        action: 'find',
        threshold,
      }),
    });
    return await response.json();
  }

  async executePattern(
    workspaceId: string,
    pattern: string,
    parameters: Record<string, any>
  ) {
    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: workspaceId, pattern, parameters }),
    });
    return await response.json();
  }
}

// Usage
const client = new Neo4jClient();

// Get all contacts
const contacts = await client.queryEntities('workspace-123', 'contact', 100);

// Search contacts
const results = await client.searchEntities('workspace-123', 'contact', 'john');

// Get contact network
const network = await client.traverseRelationships(
  'workspace-123',
  'contact-1',
  'contact',
  2
);

// Calculate influence scores
const influencers = await client.calculateInfluence('workspace-123', 50);

// Find duplicates
const duplicates = await client.findDuplicates('workspace-123', 0.7);

// Execute pattern query
const contactNetwork = await client.executePattern(
  'workspace-123',
  'contact_network',
  { contactId: 'contact-1' }
);
```

---

## Security Notes

### Workspace Isolation
All endpoints enforce workspace isolation. Users can only access data within their workspace.

### No Arbitrary Cypher
The `/api/neo4j/query` endpoint only allows pre-defined, parameterized queries. No arbitrary Cypher execution is permitted (prevents injection attacks).

### Parameter Validation
All endpoints validate:
- Required parameters
- Parameter types
- Workspace ID format (UUID)
- Query depth limits (max 5)
- Result size limits

### Authentication
All endpoints require authentication via Supabase Auth (handled by Next.js middleware).

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description",
  "timestamp": "2026-01-27T12:00:00Z"
}
```

**Common HTTP Status Codes**:
- `200`: Success
- `400`: Bad Request (missing/invalid parameters)
- `401`: Unauthorized (authentication required)
- `404`: Not Found (entity doesn't exist)
- `500`: Internal Server Error

---

## Rate Limiting

**Recommended**:
- Analytics queries: Max 10 per minute
- Entity queries: Max 100 per minute
- Sync operations: Max 1 per minute

Implement in middleware or API gateway.

---

## Next Steps

1. ✅ API endpoints & integration complete
2. ⏭️  Dashboard integration (visualization components)
3. ⏭️  Real-time updates (WebSocket integration)
4. ⏭️  API rate limiting & caching

---

**Status**: ✅ COMPLETE
**Task**: Unite-Hub-ove.2.5
**Next**: Dashboard Integration

**Total Endpoints**: 17 REST APIs covering all graph operations
**Documentation**: Complete with examples for all endpoints
