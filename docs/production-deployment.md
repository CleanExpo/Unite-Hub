# Production Deployment Guide - Domain Memory System

Complete guide for deploying the domain memory system to production environments.

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Deployment Steps](#deployment-steps)
- [Performance Optimization](#performance-optimization)
- [Security Hardening](#security-hardening)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

## Pre-Deployment Checklist

### Database

- [ ] **Supabase production project created**
  - Create at: https://supabase.com/dashboard
  - Note project reference ID

- [ ] **All migrations tested locally**
  ```powershell
  .\scripts\init-database.ps1 -Reset -Verify
  cd apps\backend
  uv run pytest -v
  ```

- [ ] **Migrations ready to apply**
  ```powershell
  # Link to production project
  supabase link --project-ref <your-project-ref>

  # Dry run (verify what will be applied)
  supabase db push --dry-run --linked
  ```

- [ ] **Database backup strategy in place**
  - Supabase automatic daily backups enabled
  - Point-in-time recovery (PITR) enabled (Pro plan)
  - Manual backup procedure documented

- [ ] **RLS policies verified**
  - All tables have appropriate policies
  - Service role can access all data
  - User access properly restricted

- [ ] **Indexes optimized**
  - Vector search index (HNSW) configured
  - Performance benchmarks met locally

### Environment Variables

- [ ] **Production secrets secured**
  - No secrets in code or version control
  - Using environment variables or secret manager
  - API keys have production permissions

- [ ] **Required variables configured:**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` (production URL)
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production anon key)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (production service key)
  - [ ] `OPENAI_API_KEY` (for embeddings - **REQUIRED**)
  - [ ] `ANTHROPIC_API_KEY` (for agents)

### Code & Tests

- [ ] **All tests passing locally**
  ```powershell
  pnpm turbo run type-check lint test
  ```

- [ ] **Integration tests pass**
  ```powershell
  cd apps\backend
  uv run pytest tests\integration\ -v -m integration
  ```

- [ ] **Performance benchmarks acceptable**
  ```powershell
  uv run pytest tests\performance\ -v -m performance -s
  ```
  - [ ] CRUD operations < 100ms (P95)
  - [ ] Vector search < 500ms (P95)

### Security

- [ ] **RLS policies tested and active**
- [ ] **API keys secured** (not in code)
- [ ] **Service role key** restricted to backend only
- [ ] **No sensitive data in migrations**
- [ ] **HTTPS enforced** for all production traffic

### Monitoring

- [ ] **Logging configured**
  - Application logs sent to monitoring service
  - Error tracking enabled (e.g., Sentry)

- [ ] **Database monitoring enabled**
  - Supabase dashboard monitoring active
  - Query performance tracking
  - Connection pool monitoring

- [ ] **Alerting configured**
  - Database connection failures
  - High error rates
  - Slow queries (> 1s)

## Database Setup

### 1. Create Production Supabase Project

1. Go to https://supabase.com/dashboard
2. Create new project
3. Choose region closest to your users
4. Save credentials (displayed once):
   - API URL
   - anon/public key
   - service_role key
   - Database password

### 2. Configure Supabase Project

```powershell
# Link to production project
supabase link --project-ref <your-project-ref>

# Enter database password when prompted
```

### 3. Enable Required Extensions

Extensions should be enabled via migration, but verify:

```sql
-- Check pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- If not enabled, run:
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4. Apply Migrations

```powershell
# Verify what will be applied
supabase db push --dry-run --linked

# Apply migrations to production
supabase db push --linked
```

**Expected output:**
```
✅ Applied migration 00000000000000_initial_schema.sql
✅ Applied migration 00000000000001_create_users.sql
...
✅ Applied migration 00000000000007_domain_memory.sql
```

### 5. Verify Database Structure

```powershell
# List all tables
supabase db execute --linked "
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
"

# Verify memory tables
supabase db execute --linked "
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'domain_%';
"
```

**Expected tables:**
- `domain_memories`
- `domain_knowledge`
- `user_preferences`
- `test_failure_patterns`
- `test_results`
- `debugging_sessions`

### 6. Verify Indexes

```powershell
supabase db execute --linked "
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'domain_memories';
"
```

**Expected indexes:**
- `domain_memories_pkey` (PRIMARY KEY)
- `idx_domain_memories_domain`
- `idx_domain_memories_category`
- `idx_domain_memories_user_id`
- `idx_domain_memories_embedding` (HNSW vector index)
- `idx_domain_memories_tags` (GIN index)

## Environment Configuration

### Production Environment Variables

Create environment-specific configuration files:

**Vercel/Netlify (Frontend):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Backend (Railway/Render/AWS):**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

### Embedding Provider Configuration

**CRITICAL:** Production MUST use OpenAI for embeddings.

```env
# REQUIRED for production
OPENAI_API_KEY=sk-...
```

**Why:**
- Simple provider is development-only (hash-based)
- Anthropic embeddings not yet available
- OpenAI provides production-quality semantic search

### Security Best Practices

1. **Never commit secrets to Git**
   ```powershell
   # Verify .env is in .gitignore
   git check-ignore .env
   ```

2. **Use secret management**
   - Vercel: Project Settings → Environment Variables
   - AWS: Secrets Manager or Parameter Store
   - Railway: Project Settings → Variables

3. **Rotate keys regularly**
   - API keys: Every 90 days
   - Database passwords: Every 180 days

## Deployment Steps

### Step 1: Deploy Database Changes

```powershell
# Final verification before applying
supabase db push --dry-run --linked

# Apply to production
supabase db push --linked

# Verify success
supabase db execute --linked "SELECT COUNT(*) FROM domain_memories;"
```

### Step 2: Deploy Backend

**Docker (recommended):**

```dockerfile
# apps/backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --no-dev

# Copy application code
COPY . .

# Run application
CMD ["uv", "run", "uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Build and deploy:**
```powershell
# Build image
docker build -t your-registry/backend:latest apps/backend

# Push to registry
docker push your-registry/backend:latest

# Deploy to hosting (Railway/Render/AWS)
# (specific to your hosting provider)
```

### Step 3: Deploy Frontend

**Vercel (recommended for Next.js):**

```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy
cd apps/web
vercel --prod
```

**Environment variables in Vercel:**
1. Project Settings → Environment Variables
2. Add production variables
3. Redeploy

### Step 4: Verify Production Deployment

```powershell
# Test backend health endpoint
curl https://api.yourapp.com/health

# Test frontend
curl https://yourapp.com

# Test memory system (via API)
curl https://api.yourapp.com/api/memory/health
```

### Step 5: Smoke Test Memory Operations

Create a test script to verify production memory system:

```python
# scripts/production-smoke-test.py
import asyncio
import os
from src.memory.store import MemoryStore
from src.memory.models import MemoryDomain

async def smoke_test():
    """Smoke test for production memory system."""
    store = MemoryStore()
    await store.initialize()

    # Create test memory
    entry = await store.create(
        domain=MemoryDomain.KNOWLEDGE,
        category="smoke_test",
        key="production_test",
        value={"test": "production smoke test"},
        generate_embedding=True,
    )
    print(f"✅ Created memory: {entry.id}")

    # Retrieve it
    retrieved = await store.get(entry.id)
    assert retrieved is not None
    print(f"✅ Retrieved memory: {retrieved.id}")

    # Search for it
    results = await store.find_similar(
        query_text="production test",
        domain=MemoryDomain.KNOWLEDGE,
        limit=5,
    )
    assert len(results) > 0
    print(f"✅ Vector search found {len(results)} results")

    # Clean up
    await store.delete(entry.id)
    print(f"✅ Deleted test memory")

    print("\n✅ All smoke tests passed!")

if __name__ == "__main__":
    asyncio.run(smoke_test())
```

Run against production:
```powershell
# Set production environment variables
$env:NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-production-key"
$env:OPENAI_API_KEY="your-openai-key"

# Run smoke test
cd apps\backend
uv run python scripts\production-smoke-test.py
```

## Performance Optimization

### Database Optimization

1. **Connection Pooling**
   - Supabase uses PgBouncer (transaction pooling)
   - Configure pool size in Supabase dashboard
   - Recommended: 20 connections for typical workload

2. **Index Optimization**
   ```sql
   -- Check index usage
   SELECT
     schemaname,
     tablename,
     indexname,
     idx_scan as index_scans
   FROM pg_stat_user_indexes
   WHERE tablename = 'domain_memories'
   ORDER BY idx_scan DESC;
   ```

3. **Query Performance**
   ```sql
   -- Enable query statistics
   SELECT pg_stat_statements_reset();

   -- Monitor slow queries
   SELECT
     mean_exec_time,
     calls,
     query
   FROM pg_stat_statements
   WHERE query LIKE '%domain_memories%'
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

### Vector Search Optimization

1. **HNSW Index Parameters**
   ```sql
   -- Verify HNSW index configuration
   SELECT
     indexname,
     indexdef
   FROM pg_indexes
   WHERE indexname LIKE '%embedding%';

   -- Recommended parameters (already in migration):
   -- m=16, ef_construction=64
   ```

2. **Tune Search Parameters**
   - Lower `similarity_threshold` = more results (slower)
   - Higher `similarity_threshold` = fewer results (faster)
   - Recommended production: 0.7 - 0.8

### Application Optimization

1. **Enable Caching**
   ```python
   # Cache frequently accessed memories
   from functools import lru_cache

   @lru_cache(maxsize=1000)
   async def get_cached_memory(memory_id: str):
       return await memory_store.get(memory_id)
   ```

2. **Batch Operations**
   ```python
   # Instead of individual creates, batch them
   entries = [...]
   for entry in entries:
       await memory_store.create(...)  # Consider batching
   ```

## Security Hardening

### Row Level Security (RLS)

Verify RLS policies are active:

```sql
-- Check RLS is enabled
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'domain_%';

-- List all policies
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE tablename LIKE 'domain_%';
```

### API Security

1. **Rate Limiting**
   - Implement at API gateway level
   - Recommended: 100 requests/minute per IP

2. **Authentication**
   - Always verify JWT tokens
   - Use Supabase auth for user operations

3. **Input Validation**
   - Validate all inputs with Pydantic
   - Sanitize user-provided content

### Network Security

1. **HTTPS Only**
   - Enforce SSL/TLS for all connections
   - Configure HSTS headers

2. **CORS Configuration**
   ```python
   # apps/backend/src/api/main.py
   from fastapi.middleware.cors import CORSMiddleware

   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://yourapp.com"],  # Production only
       allow_credentials=True,
       allow_methods=["GET", "POST", "PUT", "DELETE"],
       allow_headers=["*"],
   )
   ```

## Monitoring & Maintenance

### Application Monitoring

1. **Set up error tracking**
   - Sentry, Rollbar, or similar
   - Configure in production environment

2. **Performance monitoring**
   - Track API response times
   - Monitor memory usage
   - Database query performance

3. **Logging**
   ```python
   # Configure structured logging
   import logging
   import json

   logger = logging.getLogger(__name__)
   logger.setLevel(logging.INFO)

   # Production: JSON logs
   # Development: Pretty logs
   ```

### Database Monitoring

1. **Supabase Dashboard**
   - Monitor connection count
   - Track query performance
   - Review error logs

2. **Set up alerts**
   - Connection pool exhaustion
   - Slow query threshold (> 1s)
   - High error rate

### Regular Maintenance

- [ ] **Weekly:** Review error logs
- [ ] **Monthly:** Check database performance metrics
- [ ] **Quarterly:** Review and optimize slow queries
- [ ] **Quarterly:** Prune stale memories
  ```python
  # Run maintenance script
  await memory_store.prune_stale(
      min_relevance=0.3,
      max_age_days=90
  )
  ```

## Rollback Procedures

### Database Rollback

**If migrations fail:**

```powershell
# Rollback to previous migration version
supabase db reset --linked --version <previous-version>
```

**If data corruption:**

```powershell
# Restore from backup (Supabase dashboard)
# 1. Go to Database → Backups
# 2. Select backup point
# 3. Restore
```

### Application Rollback

**Vercel:**
```powershell
# Rollback to previous deployment
vercel rollback
```

**Docker:**
```powershell
# Deploy previous image version
docker pull your-registry/backend:previous-tag
# Redeploy with orchestrator (K8s, Docker Swarm, etc.)
```

### Emergency Procedures

1. **Disable memory system temporarily**
   ```python
   # Feature flag to bypass memory operations
   MEMORY_ENABLED = os.getenv("MEMORY_ENABLED", "true") == "true"

   if MEMORY_ENABLED:
       await memory_store.create(...)
   ```

2. **Fallback to read-only mode**
   ```python
   MEMORY_READ_ONLY = os.getenv("MEMORY_READ_ONLY", "false") == "true"

   if MEMORY_READ_ONLY:
       # Only allow read operations
       raise HTTPException(status_code=503, detail="Memory system in read-only mode")
   ```

## Troubleshooting

### Common Production Issues

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Slow vector search** | Queries > 500ms | Check HNSW index, reduce `match_count`, optimize similarity threshold |
| **Connection pool exhausted** | "too many connections" error | Increase pool size in Supabase, check for connection leaks |
| **High memory usage** | OOM errors | Implement pagination, add memory limits, optimize embedding cache |
| **RLS blocking queries** | Empty results for authenticated users | Verify RLS policies, check JWT claims, test with service role |

### Debug Checklist

- [ ] Check application logs
- [ ] Review Supabase logs (Database → Logs)
- [ ] Verify environment variables
- [ ] Test with reduced traffic
- [ ] Check database connection count
- [ ] Review recent deployments
- [ ] Verify API keys are valid

### Support

- **Supabase Support:** https://supabase.com/support
- **OpenAI Status:** https://status.openai.com/
- **Internal Documentation:** `docs/`

---

## Post-Deployment Checklist

After successful deployment:

- [ ] **Verify all smoke tests pass**
- [ ] **Monitor error rates** (first 24 hours)
- [ ] **Check performance metrics** match benchmarks
- [ ] **Verify backup strategy** is working
- [ ] **Document any production-specific config**
- [ ] **Update runbook** with lessons learned

---

**Last updated:** December 2025
**Production-ready:** Yes
