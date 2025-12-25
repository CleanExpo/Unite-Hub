# AI-Native Authority Layer - Implementation Status

**Commit**: `fae13914`
**Date**: 2025-12-26
**Status**: Phase 1 Complete (40% overall progress)

---

## ✅ Phase 1: Data Substrate + MCP + Scout (COMPLETE)

### 1.1 Database Migrations ✅

**Files Created**:
- `supabase/migrations/20251226120000_ai_authority_substrate.sql` (Main)
- `supabase/migrations/20251226120100_authority_supporting_tables.sql` (Supporting)

**Tables Created**:
1. **`client_jobs`** - Core jobs table with AI metadata
   - `embedding vector(768)` for semantic search
   - `ai_authority_metadata jsonb` for proof points, locality signals
   - Geographic fields: suburb, state, postcode, lat/lng
   - RLS policies for multi-tenant isolation

2. **`information_vacuums`** - Scout discoveries
   - Geographic + content vacuum types
   - Gap severity tracking (0-100)
   - Priority scoring (1-10)

3. **`synthex_visual_audits`** - Auditor outputs
   - Dual format: video_url + static_page_url
   - Browser session metadata
   - Search gap screenshots

4. **`synthex_suburb_mapping`** - Pre-analyzed suburb data
   - 15K+ AU suburbs (to be populated)
   - Competition levels per service category
   - Gemini analysis results

5. **`synthex_compliance_violations`** - Reflector findings
   - AU regulatory compliance tracking
   - GST, Fair Work, ACL violations
   - Auto-fix suggestions

6. **`synthex_gbp_outreach`** - GBP DM tracking
   - Prospect engagement
   - Conversion metrics

**View Created**:
- **`suburb_authority_substrate`** - Aggregates authority per suburb
  - Authority score: 0-100 (Jobs 40pts + Photos 30pts + Reviews 30pts)
  - Used by MCP server for Scout queries

**Indexes**: 15 indexes total (geographic, vector IVFFlat, JSONB GIN, performance)

**Next**: Apply migrations in Supabase Dashboard

### 1.2 MCP Server (suburb-authority) ✅

**Location**: `.claude/mcp_servers/suburb-authority/`

**Tools Provided** (3):
1. `query_suburb_authority` - Flexible suburb data queries
2. `find_geographic_gaps` - Low authority suburbs (opportunities)
3. `find_content_gaps` - Missing proof points

**Integration**:
- Registered in `.claude/mcp.json`
- Uses Supabase service role key
- stdio transport for Claude Code

**Build**: ✅ TypeScript compiled to `dist/`

**Next**: Start MCP server and test tools

### 1.3 Gemini Search Grounding ✅

**File**: `src/lib/integrations/gemini/search-grounding.ts`

**Capabilities**:
- Geo-targeted search with lat/lng
- Competitor landscape analysis
- Cost tracking ($0.075/$0.30 per 1M tokens)
- AU suburb coordinate lookup

**Methods**:
- `search(query, location)` - General search-grounded query
- `analyzeCompetitorLandscape(service, suburb, state)` - Specialized for Scout

**Next**: Test with real Gemini API key

### 1.4 Scout Agent ✅

**File**: `src/lib/agents/authority/scout-agent.ts`

**Architecture**:
- Extends `BaseAgent` (RabbitMQ compatible)
- Dual pathway support (geographic + content + hybrid)
- MCP integration for suburb authority queries
- Gemini Search Grounding for competitor analysis

**Workflows**:
- **Geographic**: MCP → Low authority suburbs → Gemini search → Store vacuums
- **Content**: MCP → High content gap scores → Identify missing proof → Store vacuums

**Next**: Integrate with agent orchestrator, test end-to-end

---

## 🚧 Phase 2: Auditor + Workers (PENDING - 60% remaining)

### 2.1 Auditor Agent (NOT STARTED)

**Planned**: `src/lib/agents/authority/auditor-agent.ts`

**Capabilities** (to implement):
- Playwright browser automation
- Gemini 2.5 Computer Use integration
- 30s screen recording of search gaps
- Dual output: video walkthrough + static landing page
- Client proof photo overlays

**Complexity**: High (browser automation + video generation + Computer Use API)

### 2.2 Suburb Mapping Worker (NOT STARTED)

**Planned**: `src/lib/workers/suburb-mapping-worker.ts`

**Objective**: Map 15,000+ AU suburbs overnight

**Approach**:
- Bull queue processor
- Gemini 2.0 Flash analysis (100 suburbs/batch)
- 2s delay between requests (8 hour total runtime)
- Stores in `synthex_suburb_mapping` table

**Complexity**: Medium (mostly API orchestration)

### 2.3 Visual Audit Worker (NOT STARTED)

**Planned**: `src/lib/workers/visual-audit-worker.ts`

**Outputs**:
- Loom-style MP4 video (Playwright + FFmpeg + ElevenLabs narration)
- Static Next.js page at `/suburbs/[state]/[suburb]/[keyword]`

**Complexity**: High (video editing, dynamic page generation)

### 2.4 Reflector Agent (NOT STARTED)

**Planned**: `src/lib/agents/reflector-agent.ts`

**Purpose**: AU compliance verification

**Rules**:
- GST: All prices inc 10% GST
- Fair Work: Labor law compliance
- ACL: Consumer guarantees
- Location: AU Post suburb names
- Language: Australian English

**Complexity**: Low (mostly prompt engineering)

---

## 🚧 Phase 3: GTM Integration (PENDING)

### 3.1 Client Dashboard (NOT STARTED)

**Planned**: `src/app/client/dashboard/market-intelligence/page.tsx`

**Features**:
- Pathway selector (geographic vs content)
- Suburb heat map
- Visual audit gallery (video + static)
- Opportunity dashboard

**API Routes** (to create):
- `GET /api/client/market-intelligence/overview`
- `POST /api/client/market-intelligence/scout`
- `GET /api/client/market-intelligence/audits/[id]`

**Complexity**: Medium (UI + API integration)

### 3.2 GBP Outreach Worker (NOT STARTED)

**Planned**: `src/lib/workers/gbp-outreach-worker.ts`

**Workflow**:
- Detect gap → Find prospect GBP → Generate message → Send DM → Track

**Uncertainty**: GBP Messaging API may not support DMs to other businesses (need research)

**Complexity**: Medium (API integration + messaging logic)

---

## Next Steps (Recommended)

### Option A: Continue Full Implementation (3-4 hours)
Implement remaining 6 components:
1. Auditor Agent (Gemini Computer Use + Playwright)
2. Suburb Mapping Worker
3. Visual Audit Worker (video + static page generation)
4. Reflector Agent
5. Client Dashboard UI
6. GBP Outreach Worker

**Timeline**: ~4 hours
**Risk**: Large scope, multiple unknowns (Computer Use API, FFmpeg, etc.)

### Option B: Test Phase 1 First (Recommended)
1. Apply migrations in Supabase Dashboard
2. Start MCP server: `cd .claude/mcp_servers/suburb-authority && npm start`
3. Test Scout Agent with sample data
4. Verify MCP tools work correctly
5. **Then** proceed with Phase 2

**Timeline**: 30-60 min validation, then continue
**Benefit**: Catch issues early, validate architecture

### Option C: Incremental Deployment
1. Deploy Phase 1 (Data + MCP + Scout)
2. Test in production with 1-2 pilot clients
3. Gather feedback
4. Build Phase 2 based on learnings

**Timeline**: 1-2 weeks
**Benefit**: Real-world validation, reduce risk

---

## Technical Debt / Known Issues

1. **Scout Agent**: Hardcoded workspace context (line 87) - needs proper workspace resolution
2. **Gemini Search**: Uses state centers for coordinates - should use geocoding API for accuracy
3. **MCP Server**: Not deployed to production yet (requires PM2 or Docker setup)
4. **Lint warnings**: 16 TypeScript warnings (any types in API integrations)
5. **Cost tracking**: Not integrated with existing `ai_usage_logs` table yet

---

## Deployment Checklist

**Before testing Phase 1**:
- [ ] Apply migrations in Supabase Dashboard (SQL Editor)
- [ ] Verify pgvector extension enabled
- [ ] Add sample client_jobs data
- [ ] Start MCP server locally
- [ ] Test MCP tools with Claude Code
- [ ] Verify Scout Agent can queue tasks via RabbitMQ

**Environment Variables Needed**:
- `GOOGLE_AI_API_KEY` or `GEMINI_API_KEY` (Search Grounding)
- `NEXT_PUBLIC_SUPABASE_URL` (existing)
- `SUPABASE_SERVICE_ROLE_KEY` (existing)
- `RABBITMQ_URL` (existing, default: amqp://localhost)

---

## Cost Analysis (Phase 1 Only)

**One-time setup**: $0 (migrations, code deployment)

**Per Scout session** (20 suburb queries):
- Gemini Search Grounding: $0.50
- Database queries: Negligible
- **Total**: ~$0.50 per diagnostic

**Expected monthly** (100 clients, weekly diagnostics):
- Scout sessions: 400 × $0.50 = $200/month
- MCP server: $0 (self-hosted)
- Storage: <$1/month (metadata only)

**Total Phase 1**: ~$200/month operational cost

---

## Files Changed

**New (21 files)**:
- 2 SQL migrations
- 13 MCP server files (TypeScript + config)
- 3 Scout/integration files
- 3 type definitions/utils

**Modified (1 file)**:
- `.claude/mcp.json` (added suburb-authority server)

**Total Lines Added**: ~5,400 lines

---

**Ready for**: Migration deployment + Phase 1 testing OR continue to Phase 2 implementation
