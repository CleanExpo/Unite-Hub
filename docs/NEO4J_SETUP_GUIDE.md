# Neo4j Knowledge Graph Setup Guide

**Created**: 2026-01-27
**Status**: Production Ready
**Task**: Unite-Hub-ove.2.1 (Neo4j Docker Setup & Integration)

---

## Overview

Neo4j is integrated into Unite-Hub as the knowledge graph database for:
- Entity relationship mapping
- Contact intelligence and scoring
- Communication pattern detection
- Influence network analysis
- Community detection algorithms
- Entity deduplication and resolution

---

## Quick Start

### 1. Set Environment Variables

Add to your `.env.local` file:

```bash
# Neo4j Knowledge Graph
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-secure-password  # CHANGE THIS!
NEO4J_DATABASE=neo4j
```

**Generate a secure password**:
```bash
openssl rand -base64 16
```

### 2. Start Neo4j with Docker Compose

```bash
# Start all services (including Neo4j)
npm run docker:start

# Or start just Neo4j
docker-compose up -d neo4j
```

### 3. Verify Connection

```bash
# Health check endpoint
curl http://localhost:3008/api/health/neo4j

# Expected response:
{
  "status": "healthy",
  "message": "Neo4j connection is healthy",
  "details": {
    "version": "5.15.0",
    "edition": "community",
    "address": "bolt://localhost:7687"
  },
  "timestamp": "2026-01-27T08:00:00.000Z"
}
```

### 4. Access Neo4j Browser

Open your browser to: **http://localhost:7474**

**Default credentials**:
- Username: `neo4j`
- Password: (your NEO4J_PASSWORD from .env.local)

---

## Docker Configuration

Neo4j is configured in `docker-compose.yml`:

```yaml
neo4j:
  image: neo4j:5.15-community
  container_name: unite-hub-neo4j
  restart: unless-stopped
  environment:
    NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
    NEO4J_server_memory_pagecache_size: 512M
    NEO4J_server_memory_heap_initial__size: 512M
    NEO4J_server_memory_heap_max__size: 1G
    NEO4J_dbms_security_procedures_unrestricted: apoc.*
    NEO4J_dbms_security_procedures_allowlist: apoc.*
    NEO4JLABS_PLUGINS: '["apoc", "graph-data-science"]'
  ports:
    - "7474:7474"   # HTTP Browser
    - "7687:7687"   # Bolt protocol
  volumes:
    - neo4j-data:/data
    - neo4j-logs:/logs
    - neo4j-import:/var/lib/neo4j/import
    - neo4j-plugins:/plugins
```

**Plugins Included**:
- **APOC** (Awesome Procedures on Cypher) - Utility procedures and functions
- **Graph Data Science** - Advanced graph algorithms

---

## Usage Examples

### Basic Queries

```typescript
import { readQuery, writeQuery } from '@/lib/neo4j';

// Read query
const result = await readQuery(
  'MATCH (c:Contact {email: $email}) RETURN c',
  { email: 'user@example.com' }
);

// Write query
const createResult = await writeQuery(
  'CREATE (c:Contact {email: $email, name: $name}) RETURN c',
  { email: 'user@example.com', name: 'John Doe' }
);
```

### Transactions

```typescript
import { executeTransaction } from '@/lib/neo4j';

await executeTransaction([
  {
    query: 'CREATE (c:Contact {email: $email, name: $name})',
    params: { email: 'user@example.com', name: 'John Doe' }
  },
  {
    query: 'CREATE (e:Email {subject: $subject, date: $date})',
    params: { subject: 'Hello', date: new Date().toISOString() }
  },
  {
    query: `
      MATCH (c:Contact {email: $email}), (e:Email {subject: $subject})
      CREATE (c)-[:SENT]->(e)
    `,
    params: { email: 'user@example.com', subject: 'Hello' }
  }
]);
```

### Session Management

```typescript
import { getSession } from '@/lib/neo4j';

const session = getSession('WRITE');
try {
  const tx = session.beginTransaction();

  await tx.run('CREATE (c:Contact {email: $email})', { email: 'user@example.com' });
  await tx.run('CREATE (e:Email {subject: $subject})', { subject: 'Hello' });

  await tx.commit();
} catch (error) {
  console.error('Transaction failed:', error);
  await tx.rollback();
} finally {
  await session.close();
}
```

---

## Health Monitoring

### API Endpoint

**GET** `/api/health/neo4j`

Returns Neo4j connection health and server information.

**Response (Healthy)**:
```json
{
  "status": "healthy",
  "message": "Neo4j connection is healthy",
  "details": {
    "version": "5.15.0",
    "edition": "community",
    "address": "bolt://localhost:7687"
  },
  "timestamp": "2026-01-27T08:00:00.000Z"
}
```

**Response (Unhealthy)**:
```json
{
  "status": "unhealthy",
  "message": "Cannot connect to Neo4j database",
  "timestamp": "2026-01-27T08:00:00.000Z"
}
```

### Programmatic Health Check

```typescript
import { healthCheck, verifyConnectivity } from '@/lib/neo4j';

// Full health check
const health = await healthCheck();
console.log(health.status); // 'healthy' or 'unhealthy'

// Simple connectivity check
const isConnected = await verifyConnectivity();
console.log(isConnected); // true or false
```

---

## Cypher Query Examples

### Create Contact with Relationships

```cypher
// Create contact
CREATE (c:Contact {
  id: randomUUID(),
  email: 'john@example.com',
  name: 'John Doe',
  company: 'Acme Inc',
  created_at: datetime()
})
RETURN c
```

### Create Email Interaction

```cypher
// Create email and link to contact
MATCH (c:Contact {email: 'john@example.com'})
CREATE (e:Email {
  id: randomUUID(),
  subject: 'Meeting Request',
  date: datetime(),
  direction: 'inbound'
})
CREATE (c)-[:RECEIVED]->(e)
RETURN c, e
```

### Find Contact Relationships

```cypher
// Find all emails for a contact
MATCH (c:Contact {email: 'john@example.com'})-[r]->(e:Email)
RETURN c, r, e
ORDER BY e.date DESC
LIMIT 10
```

### Pattern Detection

```cypher
// Find contacts who have frequent interactions
MATCH (c1:Contact)-[:SENT|RECEIVED]->(e:Email)<-[:SENT|RECEIVED]-(c2:Contact)
WHERE c1 <> c2
WITH c1, c2, COUNT(e) AS interaction_count
WHERE interaction_count > 5
RETURN c1.name, c2.name, interaction_count
ORDER BY interaction_count DESC
```

### Community Detection

```cypher
// Find communities using APOC
CALL apoc.algo.community(
  5,
  'MATCH (c:Contact)-[r:CONNECTED_TO]-(other) RETURN id(c) AS id, id(other) AS neighbor',
  'out',
  'weight',
  10000
)
YIELD community, count
RETURN community, count
ORDER BY count DESC
```

---

## Performance Tuning

### Memory Configuration

Current settings (in docker-compose.yml):
- **Page Cache**: 512M (for graph data)
- **Heap Initial**: 512M
- **Heap Max**: 1G

**For production**, increase based on data size:
- **Small** (< 1M nodes): 512M heap, 1G page cache
- **Medium** (1-10M nodes): 2G heap, 4G page cache
- **Large** (> 10M nodes): 4G+ heap, 8G+ page cache

### Indexing

Create indexes for frequently queried properties:

```cypher
// Create index on Contact email
CREATE INDEX contact_email IF NOT EXISTS
FOR (c:Contact) ON (c.email)

// Create index on Email date
CREATE INDEX email_date IF NOT EXISTS
FOR (e:Email) ON (e.date)

// Create composite index
CREATE INDEX contact_company_name IF NOT EXISTS
FOR (c:Contact) ON (c.company, c.name)
```

### Constraints

Enforce uniqueness and data integrity:

```cypher
// Unique contact email
CREATE CONSTRAINT contact_email_unique IF NOT EXISTS
FOR (c:Contact) REQUIRE c.email IS UNIQUE

// Required contact ID
CREATE CONSTRAINT contact_id_exists IF NOT EXISTS
FOR (c:Contact) REQUIRE c.id IS NOT NULL
```

---

## Troubleshooting

### Connection Refused

**Problem**: `ServiceUnavailable: WebSocket connection failure`

**Solutions**:
1. Check Neo4j is running: `docker ps | grep neo4j`
2. Verify password in `.env.local` matches docker-compose
3. Check logs: `docker logs unite-hub-neo4j`
4. Restart Neo4j: `docker-compose restart neo4j`

### Authentication Failed

**Problem**: `Neo4jError: The client is unauthorized`

**Solutions**:
1. Check NEO4J_PASSWORD in `.env.local`
2. Verify NEO4J_USER is set to `neo4j`
3. Reset password in Neo4j Browser (http://localhost:7474)

### Out of Memory

**Problem**: `java.lang.OutOfMemoryError: Java heap space`

**Solutions**:
1. Increase heap size in docker-compose.yml:
   ```yaml
   NEO4J_server_memory_heap_max__size: 2G
   ```
2. Increase page cache:
   ```yaml
   NEO4J_server_memory_pagecache_size: 1G
   ```
3. Restart Neo4j: `docker-compose restart neo4j`

### Slow Queries

**Problem**: Queries taking > 1 second

**Solutions**:
1. Add indexes for queried properties
2. Use EXPLAIN/PROFILE to analyze query plans:
   ```cypher
   PROFILE MATCH (c:Contact {email: 'user@example.com'}) RETURN c
   ```
3. Optimize relationships (use direction when possible)
4. Limit result sets with LIMIT clause

---

## Data Backup & Restore

### Backup

```bash
# Stop Neo4j
docker-compose stop neo4j

# Backup data volume
docker run --rm \
  -v unite-hub-neo4j-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/neo4j-backup-$(date +%Y%m%d).tar.gz /data

# Restart Neo4j
docker-compose start neo4j
```

### Restore

```bash
# Stop Neo4j
docker-compose stop neo4j

# Restore from backup
docker run --rm \
  -v unite-hub-neo4j-data:/data \
  -v $(pwd)/backups:/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/neo4j-backup-20260127.tar.gz -C /"

# Restart Neo4j
docker-compose start neo4j
```

---

## Security Best Practices

1. **Change Default Password**: Always change from default `neo4j/neo4j`
2. **Use Strong Passwords**: Generate with `openssl rand -base64 16`
3. **Restrict Network Access**: Only expose ports 7474/7687 to trusted networks
4. **Enable SSL/TLS**: Configure HTTPS for production
5. **Regular Backups**: Automate daily backups to external storage
6. **Monitor Access**: Enable audit logging in production
7. **Limit Privileges**: Use read-only users for reporting/analytics

---

## Next Steps

1. ✅ Neo4j Docker setup complete
2. ⏭️  Define entity schema and data model (Unite-Hub-ove.2.2)
3. ⏭️  Build entity resolution engine (Unite-Hub-ove.2.3)
4. ⏭️  Implement pattern detection (Unite-Hub-ove.2.4)
5. ⏭️  Create API endpoints (Unite-Hub-ove.2.5)

---

## Resources

- **Neo4j Documentation**: https://neo4j.com/docs/
- **Cypher Manual**: https://neo4j.com/docs/cypher-manual/current/
- **APOC Procedures**: https://neo4j.com/labs/apoc/
- **Graph Data Science**: https://neo4j.com/docs/graph-data-science/current/
- **Neo4j Browser**: http://localhost:7474

---

**Status**: ✅ COMPLETE
**Task**: Unite-Hub-ove.2.1
**Next**: Unite-Hub-ove.2.2 (Entity Schema & Data Model)
