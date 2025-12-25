# Phase 1 Testing Guide - AI Authority Layer

**Status**: Phase 1 code complete, ready for validation
**Time Required**: 30-60 minutes
**Goal**: Verify database schema, MCP server, and Scout Agent foundations

---

## Step 1: Apply Database Migrations (5 minutes)

### 1.1 Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project: `lksfwktwtmyznckodsau`
3. Navigate to: **SQL Editor** (left sidebar)

### 1.2 Apply Main Migration (client_jobs + view)

1. Click **"+ New Query"**
2. Copy contents of: `supabase/migrations/20251226120000_ai_authority_substrate.sql`
3. Paste into SQL Editor
4. Click **"Run"** (or Ctrl+Enter)
5. Verify output shows:
   ```
   CREATE EXTENSION
   CREATE TABLE
   CREATE INDEX (x15)
   CREATE VIEW
   CREATE POLICY (x4)
   CREATE TRIGGER
   ```

### 1.3 Apply Supporting Tables Migration

1. Click **"+ New Query"**
2. Copy contents of: `supabase/migrations/20251226120100_authority_supporting_tables.sql`
3. Paste into SQL Editor
4. Click **"Run"**
5. Verify output shows:
   ```
   CREATE TABLE (x4)
   CREATE INDEX (x20+)
   CREATE POLICY (x16)
   CREATE TRIGGER (x2)
   ```

### 1.4 Verify Extensions

Run this query to verify pgvector is enabled:

```sql
SELECT name, installed_version
FROM pg_available_extensions
WHERE name = 'vector';
```

Expected output:
```
name   | installed_version
-------+------------------
vector | 0.5.1 (or later)
```

---

## Step 2: Load Sample Data (2 minutes)

### Option A: Automated Script

Run the test script:

```bash
node scripts/test-ai-authority-phase1.mjs
```

This will:
- Verify all tables and views exist
- Create sample client "Test Plumbing Co"
- Insert 2 sample jobs (Paddington, Ipswich)
- Test suburb_authority_substrate view
- Find geographic and content gaps

**Expected Output**:
```
✅ pgvector extension installed
✅ client_jobs table exists
✅ information_vacuums table exists
✅ synthex_visual_audits table exists
✅ synthex_suburb_mapping table exists
✅ synthex_compliance_violations table exists
✅ synthex_gbp_outreach table exists
✅ suburb_authority_substrate view exists
✅ Inserted 2 sample jobs
✅ Found 2 geographic gaps
✅ Found 1 content gaps
```

### Option B: Manual Insert

Run in Supabase SQL Editor:

```sql
-- Get your workspace ID
SELECT id, name FROM workspaces LIMIT 1;

-- Insert sample jobs (replace workspace_id and client_id)
INSERT INTO client_jobs (
  workspace_id,
  client_id,
  job_title,
  suburb,
  state,
  postcode,
  job_type,
  status,
  ai_authority_metadata,
  completed_at
) VALUES (
  'YOUR_WORKSPACE_ID',
  'YOUR_CLIENT_ID',
  'Test Job - Paddington',
  'Paddington',
  'NSW',
  '2021',
  'project',
  'completed',
  '{"proof_points": [{"type": "before_after_photo", "photo_url": "/test.jpg"}], "content_gap_score": 0.3}'::jsonb,
  NOW()
);
```

---

## Step 3: Build & Start MCP Server (5 minutes)

### 3.1 Install Dependencies

```bash
cd .claude/mcp_servers/suburb-authority
npm install
npm run build
```

**Expected**: No errors, `dist/` directory created with compiled JS

### 3.2 Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials (should match root .env.local)
```

Your `.env` should contain:
```
NEXT_PUBLIC_SUPABASE_URL=https://lksfwktwtmyznckodsau.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
MCP_TRANSPORT=stdio
```

### 3.3 Start MCP Server

```bash
npm start
```

**Expected Output**:
```
[SuburbaseService] Supabase client initialized
[Server] MCP server initialized
[Server] All tools registered (3 tools)
[Server] MCP server started with stdio transport
[Main] MCP Suburb Authority Server started successfully
```

**Keep this terminal open** - MCP server runs in foreground

---

## Step 4: Test MCP Server (5 minutes)

### 4.1 Test MCP Tools via Claude Code

In a new terminal, with MCP server running:

1. Open Claude Code CLI
2. Ask: "List available MCP tools"
3. Should see:
   - `query_suburb_authority`
   - `find_geographic_gaps`
   - `find_content_gaps`

4. Ask: "Use find_geographic_gaps to find opportunities for my workspace"
   - Should query suburb_authority_substrate
   - Return low authority suburbs

### 4.2 Manual MCP Test (Alternative)

If Claude Code integration not working, test directly:

```bash
# In new terminal
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  node .claude/mcp_servers/suburb-authority/dist/index.js
```

Should return JSON with 3 tools listed.

---

## Step 5: Test Gemini Search Grounding (5 minutes)

### 5.1 Verify API Key

Check environment variable:

```bash
echo $GOOGLE_AI_API_KEY
# or
echo $GEMINI_API_KEY
```

If not set, add to `.env.local`:
```
GOOGLE_AI_API_KEY=your-gemini-api-key-here
```

### 5.2 Test Search Grounding

Create test script:

```javascript
// test-gemini-search.mjs
import { getGeminiSearchGrounding } from './src/lib/integrations/gemini/search-grounding.ts';

const gemini = getGeminiSearchGrounding();

const result = await gemini.analyzeCompetitorLandscape({
  service: 'plumber',
  suburb: 'Ipswich',
  state: 'QLD',
});

console.log('Competitor Analysis:', result);
```

Run:
```bash
npx tsx test-gemini-search.mjs
```

**Expected**: Returns competitor count, competition level, top businesses, keywords, cost

---

## Step 6: Test Scout Agent (10 minutes)

### 6.1 Prerequisites

- ✅ Migrations applied
- ✅ Sample data loaded
- ✅ MCP server running
- ✅ Gemini API key configured
- ✅ RabbitMQ running (or mock)

### 6.2 Test Scout Discovery

Create test:

```javascript
// scripts/test-scout-agent.mjs
import { getScoutAgent } from './src/lib/agents/authority/scout-agent.ts';

const scout = getScoutAgent();

// Test geographic pathway
const task = {
  id: 'test-scout-1',
  task_type: 'scout_geographic',
  workspace_id: 'YOUR_WORKSPACE_ID',
  payload: {
    clientId: 'YOUR_CLIENT_ID',
    pathway: 'geographic',
    targetState: 'NSW',
    targetService: 'plumber',
    maxGaps: 5,
  },
  priority: 5,
  retry_count: 0,
  max_retries: 3,
};

const result = await scout.processTask(task);
console.log('Scout Result:', result);
```

Run:
```bash
npx tsx scripts/test-scout-agent.mjs
```

**Expected**:
- Queries MCP server for low authority suburbs
- Analyzes with Gemini Search Grounding
- Stores vacuums in `information_vacuums` table
- Returns geographic gaps with opportunity scores

---

## Step 7: Verify Database Results (5 minutes)

### 7.1 Check Information Vacuums

In Supabase SQL Editor:

```sql
SELECT
  vacuum_type,
  target_suburb,
  target_state,
  gap_severity,
  competitor_density,
  status,
  discovered_at
FROM information_vacuums
ORDER BY discovered_at DESC
LIMIT 10;
```

**Expected**: Rows inserted by Scout Agent

### 7.2 Check Suburb Authority View

```sql
SELECT
  suburb,
  state,
  authority_score,
  total_jobs,
  total_photo_count,
  verified_review_count
FROM suburb_authority_substrate
ORDER BY authority_score ASC
LIMIT 10;
```

**Expected**: Aggregated data from client_jobs (Paddington, Ipswich)

---

## Troubleshooting

### Error: "relation client_jobs does not exist"
**Fix**: Migration not applied. Go to Step 1.2.

### Error: "pgvector extension not found"
**Fix**: Run in SQL Editor: `CREATE EXTENSION IF NOT EXISTS vector;`

### Error: "MCP server won't start"
**Fix**:
1. Check `.env` has correct Supabase credentials
2. Verify `npm run build` completed without errors
3. Check Node version: `node -v` (need v20+)

### Error: "Scout Agent can't connect to RabbitMQ"
**Fix**: Start RabbitMQ locally:
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

Or mock RabbitMQ connection in Scout test by calling `processTask()` directly (bypass queue)

### Error: "Gemini API quota exceeded"
**Fix**: Gemini free tier limits apply. Upgrade or wait for quota reset.

---

## Success Criteria

Phase 1 is validated when:

- [x] All 6 tables created successfully
- [x] suburb_authority_substrate view returns data
- [x] MCP server starts without errors
- [x] MCP tools can be called (query_suburb_authority works)
- [x] Sample jobs inserted and visible in view
- [x] Gemini Search Grounding returns competitor data
- [x] Scout Agent discovers geographic/content gaps
- [x] Vacuums stored in information_vacuums table

---

## Next: Proceed to Phase 2

Once Phase 1 validated:

1. **Auditor Agent** - Gemini Computer Use + Playwright
2. **Suburb Mapping Worker** - Batch 15K suburbs
3. **Visual Audit Worker** - Video + static page generation
4. **Reflector Agent** - AU compliance
5. **Client Dashboard** - Market intelligence UI
6. **GBP Outreach** - Automated prospecting

**Estimated**: 3-4 hours for Phase 2 implementation

---

**Questions During Testing?**

- MCP server errors → Check logs in terminal
- Database errors → Verify migrations applied correctly
- Gemini errors → Check API key and quota
- Scout errors → Verify RabbitMQ connection

**Ready to proceed once all tests pass.**
