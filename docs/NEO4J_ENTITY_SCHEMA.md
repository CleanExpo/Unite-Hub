# Neo4j Entity Schema & Data Model

**Created**: 2026-01-27
**Status**: Complete
**Task**: Unite-Hub-ove.2.2 (Entity Schema & Data Model)

---

## Overview

This document defines the complete entity schema for Unite-Hub's knowledge graph, including node types, relationships, properties, constraints, and usage patterns.

---

## Node Types (Entities)

### Contact
Represents individuals in the CRM system.

**Label**: `Contact`

**Properties**:
```typescript
{
  id: string;              // UUID (unique)
  workspace_id: string;    // Workspace isolation (required)
  email: string;           // Email address (unique per workspace)
  name?: string;           // Full name
  phone?: string;          // Phone number
  company?: string;        // Company name
  status?: 'lead' | 'prospect' | 'customer';
  ai_score?: number;       // AI scoring (0-100)
  metadata?: object;       // Additional data
  created_at: string;      // ISO timestamp
  updated_at: string;      // ISO timestamp
}
```

**Constraints**:
- `id` is unique
- `email` is unique (per workspace)
- `workspace_id` is required

**Indexes**:
- `name`
- `status`
- `ai_score`
- `created_at`
- `(workspace_id, email)` composite

### Company
Represents organizations/companies.

**Label**: `Company`

**Properties**:
```typescript
{
  id: string;              // UUID (unique)
  name: string;            // Company name
  domain?: string;         // Website domain (unique)
  industry?: string;       // Industry category
  size?: string;           // Company size
  location?: string;       // Location
  metadata?: object;       // Additional data
  created_at: string;      // ISO timestamp
}
```

**Constraints**:
- `id` is unique
- `domain` is unique

**Indexes**:
- `name`
- `industry`

### Email
Represents email messages.

**Label**: `Email`

**Properties**:
```typescript
{
  id: string;              // UUID (unique)
  workspace_id: string;    // Workspace isolation (required)
  contact_id: string;      // Related contact
  subject: string;         // Email subject
  body?: string;           // Email body
  direction: 'inbound' | 'outbound';
  sent_at: string;         // ISO timestamp
  opened?: boolean;        // Open tracking
  clicked?: boolean;       // Click tracking
  metadata?: object;       // Additional data
}
```

**Constraints**:
- `id` is unique
- `workspace_id` is required

**Indexes**:
- `sent_at`
- `subject`
- `workspace_id`

### User
Represents system users.

**Label**: `User`

**Properties**:
```typescript
{
  id: string;              // UUID (unique)
  email: string;           // Email (unique)
  name?: string;           // Full name
  role?: string;           // User role
  workspace_id: string;    // Primary workspace
  created_at: string;      // ISO timestamp
}
```

**Constraints**:
- `id` is unique
- `email` is unique

**Indexes**:
- `email`
- `name`

### Workspace
Represents team workspaces.

**Label**: `Workspace`

**Properties**:
```typescript
{
  id: string;              // UUID (unique)
  org_id: string;          // Organization ID
  name: string;            // Workspace name
  created_at: string;      // ISO timestamp
}
```

**Constraints**:
- `id` is unique

**Indexes**:
- `org_id`

### Campaign
Represents marketing campaigns.

**Label**: `Campaign`

**Properties**:
```typescript
{
  id: string;              // UUID (unique)
  name: string;            // Campaign name
  type: 'one-time' | 'drip' | 'automated';
  status: 'draft' | 'active' | 'paused' | 'completed';
  workspace_id: string;    // Workspace isolation
  created_at: string;      // ISO timestamp
}
```

**Constraints**:
- `id` is unique

**Indexes**:
- `status`
- `type`

### Tag
Represents classification tags.

**Label**: `Tag`

**Properties**:
```typescript
{
  name: string;            // Tag name (unique)
  category?: string;       // Tag category
  created_at: string;      // ISO timestamp
}
```

**Constraints**:
- `name` is unique

**Indexes**:
- `category`

---

## Relationship Types

### Email Relationships

#### SENT
Contact sent an email.

**Direction**: `(Contact)-[:SENT]->(Email)`

**Properties**:
```typescript
{
  timestamp: string;       // ISO timestamp
}
```

#### RECEIVED
Contact received an email.

**Direction**: `(Contact)-[:RECEIVED]->(Email)`

**Properties**:
```typescript
{
  timestamp: string;       // ISO timestamp
}
```

#### OPENED
Email was opened.

**Direction**: `(Contact)-[:OPENED]->(Email)`

**Properties**:
```typescript
{
  timestamp: string;       // ISO timestamp
  ip_address?: string;
  user_agent?: string;
}
```

#### CLICKED
Link in email was clicked.

**Direction**: `(Contact)-[:CLICKED {url: string}]->(Email)`

**Properties**:
```typescript
{
  url: string;             // Clicked URL
  timestamp: string;       // ISO timestamp
  count: number;           // Click count
}
```

#### REPLIED_TO
Email is a reply to another email.

**Direction**: `(Email)-[:REPLIED_TO]->(Email)`

**Properties**:
```typescript
{
  timestamp: string;       // ISO timestamp
}
```

### Contact Relationships

#### WORKS_AT
Contact works at a company.

**Direction**: `(Contact)-[:WORKS_AT]->(Company)`

**Properties**:
```typescript
{
  title?: string;          // Job title
  created_at: string;      // ISO timestamp
}
```

#### CONNECTED_TO
Contacts are connected (mutual relationship).

**Direction**: `(Contact)-[:CONNECTED_TO]-(Contact)`

**Properties**:
```typescript
{
  strength: number;        // Connection strength (0-1)
  interaction_count: number;
  created_at: string;      // ISO timestamp
  updated_at?: string;     // ISO timestamp
}
```

#### INTRODUCED_BY
Contact was introduced by another contact.

**Direction**: `(Contact)-[:INTRODUCED_BY]->(Contact)`

**Properties**:
```typescript
{
  timestamp: string;       // ISO timestamp
  context?: string;        // Introduction context
}
```

#### SIMILAR_TO
Contacts are similar (ML-detected).

**Direction**: `(Contact)-[:SIMILAR_TO]-(Contact)`

**Properties**:
```typescript
{
  similarity_score: number; // Similarity (0-1)
  factors: string[];        // Similarity factors
}
```

### Organization Relationships

#### MEMBER_OF
User is a member of a workspace.

**Direction**: `(User)-[:MEMBER_OF]->(Workspace)`

**Properties**:
```typescript
{
  role: string;            // Member role
  joined_at: string;       // ISO timestamp
}
```

#### MANAGES
User manages another user.

**Direction**: `(User)-[:MANAGES]->(User)`

**Properties**:
```typescript
{
  since: string;           // ISO timestamp
}
```

#### OWNS
User owns a workspace.

**Direction**: `(User)-[:OWNS]->(Workspace)`

**Properties**:
```typescript
{
  since: string;           // ISO timestamp
}
```

### Campaign Relationships

#### ENROLLED_IN
Contact is enrolled in a campaign.

**Direction**: `(Contact)-[:ENROLLED_IN]->(Campaign)`

**Properties**:
```typescript
{
  enrolled_at: string;     // ISO timestamp
  status: 'active' | 'completed' | 'bounced' | 'unsubscribed';
  current_step?: number;
}
```

#### RESPONDED_TO
Contact responded to a campaign.

**Direction**: `(Contact)-[:RESPONDED_TO]->(Campaign)`

**Properties**:
```typescript
{
  timestamp: string;       // ISO timestamp
  response_type: string;   // Response type
}
```

### Tag Relationships

#### TAGGED_WITH
Entity is tagged.

**Direction**: `(Contact|Email|Campaign)-[:TAGGED_WITH]->(Tag)`

**Properties**:
```typescript
{
  tagged_at: string;       // ISO timestamp
  tagged_by?: string;      // User ID
}
```

---

## Schema Initialization

### Setup Commands

```bash
# Initialize schema (constraints + indexes)
curl -X POST http://localhost:3008/api/neo4j/schema

# Verify schema
curl http://localhost:3008/api/neo4j/schema
```

### Programmatic Initialization

```typescript
import { initializeSchema } from '@/lib/neo4j/schema';

await initializeSchema();
```

### What Gets Created

**Constraints** (11):
- Contact: id unique, email unique, workspace_id required
- Company: id unique, domain unique
- Email: id unique, workspace_id required
- User: id unique, email unique
- Workspace: id unique
- Campaign: id unique
- Tag: name unique

**Indexes** (20+):
- Performance indexes on frequently queried properties
- Composite indexes for workspace isolation queries
- Relationship timestamp indexes

---

## Entity Management

### Create/Update Contact

```typescript
import { upsertContact } from '@/lib/neo4j';

const contact = await upsertContact({
  id: crypto.randomUUID(),
  workspace_id: 'workspace-123',
  email: 'john@example.com',
  name: 'John Doe',
  company: 'Acme Inc',
  status: 'prospect',
  ai_score: 85,
  metadata: { source: 'website' },
});
```

### Create Email with Relationships

```typescript
import { createEmail } from '@/lib/neo4j';

const email = await createEmail({
  id: crypto.randomUUID(),
  workspace_id: 'workspace-123',
  contact_id: 'contact-456',
  subject: 'Meeting Request',
  direction: 'inbound',
  sent_at: new Date().toISOString(),
});

// Creates Email node and RECEIVED relationship automatically
```

### Link Contact to Company

```typescript
import { linkContactToCompany } from '@/lib/neo4j';

await linkContactToCompany(
  'john@example.com',
  'example.com',
  'workspace-123'
);

// Creates WORKS_AT relationship
```

### Create Connection Between Contacts

```typescript
import { linkContacts } from '@/lib/neo4j';

await linkContacts(
  'john@example.com',
  'jane@example.com',
  'workspace-123',
  0.8 // strength
);

// Creates bidirectional CONNECTED_TO relationship
```

### Query Contacts with Relationships

```typescript
import { getContact } from '@/lib/neo4j';

const contact = await getContact('john@example.com', 'workspace-123');

console.log(contact);
// {
//   id: '...',
//   email: 'john@example.com',
//   name: 'John Doe',
//   company_name: 'Acme Inc',
//   email_count: 15,
//   connection_count: 8,
//   top_connections: ['jane@example.com', 'bob@example.com', ...]
// }
```

### Search Contacts

```typescript
import { searchContacts } from '@/lib/neo4j';

const results = await searchContacts(
  'john',
  'workspace-123',
  20 // limit
);
```

---

## Data Synchronization

### Full Sync from Supabase

```bash
# Sync all data for a workspace
curl -X POST http://localhost:3008/api/neo4j/sync \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "workspace-123",
    "mode": "full"
  }'
```

Response:
```json
{
  "success": true,
  "synced": {
    "contacts": 150,
    "companies": 45,
    "emails": 1200,
    "workspaces": 1,
    "relationships": 0
  },
  "errors": [],
  "duration_ms": 5432
}
```

### Incremental Sync

```bash
# Sync only changes since last sync
curl -X POST http://localhost:3008/api/neo4j/sync \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "workspace-123",
    "mode": "incremental",
    "since": "2026-01-27T00:00:00Z"
  }'
```

### Programmatic Sync

```typescript
import { fullSync, incrementalSync } from '@/lib/neo4j/sync';

// Full sync
const result = await fullSync('workspace-123');

// Incremental sync
const incrementalResult = await incrementalSync(
  'workspace-123',
  '2026-01-27T00:00:00Z'
);
```

---

## Common Query Patterns

### Find High-Value Contacts

```cypher
MATCH (c:Contact {workspace_id: $workspaceId})
WHERE c.ai_score > 80
AND c.status = 'prospect'
OPTIONAL MATCH (c)-[:WORKS_AT]->(co:Company)
RETURN c, co.name as company
ORDER BY c.ai_score DESC
LIMIT 20
```

### Find Communication Patterns

```cypher
MATCH (c:Contact {workspace_id: $workspaceId})-[r:SENT|RECEIVED]->(e:Email)
WHERE e.sent_at >= datetime() - duration('P30D')
WITH c, COUNT(e) as email_count
WHERE email_count > 10
RETURN c.name, c.email, email_count
ORDER BY email_count DESC
```

### Find Contact Network

```cypher
MATCH (c:Contact {email: $email, workspace_id: $workspaceId})
MATCH (c)-[:CONNECTED_TO*1..2]-(other:Contact)
OPTIONAL MATCH (other)-[:WORKS_AT]->(co:Company)
RETURN DISTINCT other, co.name as company,
       size((c)-[:CONNECTED_TO]-(other)) as connection_depth
ORDER BY connection_depth ASC, other.ai_score DESC
LIMIT 20
```

### Find Influential Contacts

```cypher
MATCH (c:Contact {workspace_id: $workspaceId})
MATCH (c)-[:CONNECTED_TO]-(other:Contact)
WITH c, COUNT(DISTINCT other) as connection_count
WHERE connection_count > 5
RETURN c.name, c.email, connection_count
ORDER BY connection_count DESC
LIMIT 20
```

### Find Email Response Rates

```cypher
MATCH (c:Contact {workspace_id: $workspaceId})-[:SENT]->(e:Email)
WHERE e.sent_at >= datetime() - duration('P30D')
WITH c, COUNT(e) as sent_count
MATCH (c)-[:RECEIVED]->(r:Email)
WHERE r.sent_at >= datetime() - duration('P30D')
WITH c, sent_count, COUNT(r) as received_count
RETURN c.name, c.email, sent_count, received_count,
       toFloat(received_count) / sent_count as response_rate
ORDER BY response_rate DESC
LIMIT 20
```

---

## API Endpoints

### Schema Management

- `POST /api/neo4j/schema` - Initialize schema
- `GET /api/neo4j/schema` - Verify and get stats
- `DELETE /api/neo4j/schema` - Drop schema (danger!)

### Health Check

- `GET /api/health/neo4j` - Neo4j connectivity and health

### Data Sync

- `POST /api/neo4j/sync` - Sync from Supabase
- `GET /api/neo4j/sync` - Get sync status

---

## Performance Optimization

### Use Indexes

All frequently queried properties have indexes. Always filter by indexed properties first:

```cypher
// Good - Uses index
MATCH (c:Contact {workspace_id: $workspaceId, email: $email})

// Bad - Full scan
MATCH (c:Contact)
WHERE c.workspace_id = $workspaceId AND c.phone = $phone
```

### Limit Result Sets

Always use `LIMIT` clause:

```cypher
MATCH (c:Contact {workspace_id: $workspaceId})
RETURN c
ORDER BY c.created_at DESC
LIMIT 100
```

### Use OPTIONAL MATCH for Optional Relationships

```cypher
MATCH (c:Contact {workspace_id: $workspaceId})
OPTIONAL MATCH (c)-[:WORKS_AT]->(co:Company)
RETURN c, co
```

### Profile Slow Queries

```cypher
PROFILE
MATCH (c:Contact {workspace_id: $workspaceId})
WHERE c.ai_score > 80
RETURN c
```

---

## Best Practices

1. **Always Filter by Workspace**: Maintain workspace isolation
   ```cypher
   MATCH (c:Contact {workspace_id: $workspaceId})
   ```

2. **Use Transactions**: For multi-step operations
   ```typescript
   await executeTransaction([query1, query2, query3]);
   ```

3. **Batch Operations**: Process in batches for large datasets
   ```typescript
   const batchSize = 100;
   for (let i = 0; i < contacts.length; i += batchSize) {
     const batch = contacts.slice(i, i + batchSize);
     await Promise.all(batch.map(c => upsertContact(c)));
   }
   ```

4. **Handle Errors**: Always wrap in try-catch
   ```typescript
   try {
     await upsertContact(contact);
   } catch (error) {
     console.error('Failed to create contact:', error);
   }
   ```

5. **Clean Up Sessions**: Close sessions after use
   ```typescript
   const session = getSession('WRITE');
   try {
     await session.run(query, params);
   } finally {
     await session.close();
   }
   ```

---

## Troubleshooting

### Constraint Violation

**Error**: `Node already exists with label Contact and property email = 'john@example.com'`

**Solution**: Use `upsertContact` instead of `createContact`, or check if contact exists first.

### Relationship Creation Failed

**Error**: `Cannot create relationship, node not found`

**Solution**: Verify both nodes exist before creating relationship.

### Slow Queries

**Problem**: Query takes > 1 second

**Solution**:
1. Add indexes on queried properties
2. Use `PROFILE` to analyze query plan
3. Add `LIMIT` clause
4. Use indexed properties in `WHERE` clause

---

## Next Steps

1. ✅ Schema defined and documented
2. ⏭️  Entity resolution engine (Unite-Hub-ove.2.3)
3. ⏭️  Pattern detection & analytics (Unite-Hub-ove.2.4)
4. ⏭️  API endpoints & integration (Unite-Hub-ove.2.5)

---

**Status**: ✅ COMPLETE
**Task**: Unite-Hub-ove.2.2
**Next**: Unite-Hub-ove.2.3 (Entity Resolution Engine)
