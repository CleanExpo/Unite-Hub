# Founder Intelligence OS - Integrity Check

**Script**: `scripts/run-integrity-check.mjs`

## Purpose

Verifies complete installation of the Founder Intelligence OS by checking:

- **Database Tables** (15 tables)
- **Service Files** (9 core services)
- **API Routes** (23 endpoints)
- **Agent Files** (8 AI agents)
- **Environment Variables** (3 required)

## Usage

```bash
# Run integrity check
npm run integrity:check

# Alternative command
npm run founder:check

# Direct execution
node scripts/run-integrity-check.mjs
```

## Expected Output

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║       FOUNDER INTELLIGENCE OS - INTEGRITY CHECK              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

============================================================
1. DATABASE TABLES
============================================================

✓ founder_businesses: PASS - Present
✓ founder_business_vault_secrets: PASS - Present
✓ founder_business_signals: PASS - Present
✓ founder_os_snapshots: PASS - Present
✓ ai_phill_insights: PASS - Present
✓ ai_phill_journal_entries: PASS - Present
✓ cognitive_twin_scores: PASS - Present (RLS active)
✓ cognitive_twin_digests: PASS - Present (RLS active)
✓ cognitive_twin_decisions: PASS - Present (RLS active)
✓ seo_leak_signal_profiles: PASS - Present (RLS active)
✓ social_inbox_accounts: PASS - Present (RLS active)
✓ social_messages: PASS - Present
✓ search_keywords: PASS - Present
✓ boost_jobs: PASS - Present
✓ pre_clients: PASS - Present

============================================================
2. SERVICE FILES
============================================================

✓ founderOps/founderOpsEngine.ts: PASS
✓ founderOps/founderOpsQueue.ts: PASS
✓ founderOps/founderOpsScheduler.ts: PASS
✓ founderOps/founderOpsTaskLibrary.ts: PASS
✓ founderOps/founderOpsArchiveBridge.ts: PASS
✓ founderOps/founderOpsBrandBinding.ts: PASS
✓ founder/oversightService.ts: PASS
✓ billing/trialService.ts: PASS
✓ platform/platformMode.ts: PASS

============================================================
3. API ROUTES
============================================================

✓ assistant/route.ts: PASS
✓ awareness/route.ts: PASS
✓ cognitive-map/route.ts: PASS
✓ flight-deck/layout/route.ts: PASS
✓ ops/brand-workload/route.ts: PASS
✓ ops/overview/route.ts: PASS
✓ ops/queue/daily/route.ts: PASS
✓ ops/queue/pause/route.ts: PASS
✓ ops/queue/resume/route.ts: PASS
✓ ops/queue/weekly/route.ts: PASS
✓ ops/tasks/route.ts: PASS
✓ ops/tasks/[taskId]/route.ts: PASS
✓ settings/platform-mode/route.ts: PASS
✓ memory/snapshot/route.ts: PASS
✓ memory/patterns/route.ts: PASS
✓ memory/momentum/route.ts: PASS
✓ memory/opportunities/route.ts: PASS
✓ memory/risks/route.ts: PASS
✓ memory/forecast/route.ts: PASS
✓ memory/decision-scenarios/route.ts: PASS
✓ memory/weekly-digest/route.ts: PASS
✓ memory/next-actions/route.ts: PASS
✓ memory/overload/route.ts: PASS

============================================================
4. AGENT FILES
============================================================

✓ founderOsAgent.ts: PASS - Valid exports found
✓ aiPhillAgent.ts: PASS - Valid exports found
✓ seoLeakAgent.ts: PASS - Valid exports found
✓ boostBumpAgent.ts: PASS - Valid exports found
✓ searchSuiteAgent.ts: PASS - Valid exports found
✓ socialInboxAgent.ts: PASS - Valid exports found
✓ preClientIdentityAgent.ts: PASS - Valid exports found
✓ cognitiveTwinAgent.ts: PASS - Valid exports found

============================================================
5. ENVIRONMENT VARIABLES
============================================================

✓ ANTHROPIC_API_KEY: PASS - sk-ant-api...ITAAA
✓ NEXT_PUBLIC_SUPABASE_URL: PASS - https://lk...se.co
✓ SUPABASE_SERVICE_ROLE_KEY: PASS - eyJhbGciOi...diN7Q

============================================================
INTEGRITY CHECK SUMMARY
============================================================

✓ Database Tables: 15/15 present (100%)
✓ Services: 9/9 present (100%)
✓ API Routes: 23/23 present (100%)
✓ Agents: 8/8 present (100%)
✓ Environment: 3/3 present (100%)

============================================================
OVERALL STATUS: ✓ PASS (100%)
============================================================

All checks passed! Founder Intelligence OS is fully installed.
```

## Exit Codes

- **0**: All checks passed (100%)
- **1**: One or more checks failed (<100%)

## Component Details

### 1. Database Tables (15)

**Founder Intelligence Core**:
- `founder_businesses` - Business/brand records linked to founder
- `founder_business_vault_secrets` - Encrypted credentials (Stripe, analytics, social)
- `founder_business_signals` - Real-time health signals (traffic, revenue, engagement)
- `founder_os_snapshots` - Daily intelligence snapshots

**AI Phill (Personal Assistant)**:
- `ai_phill_insights` - AI-generated insights and analysis
- `ai_phill_journal_entries` - Journal entries and reflections

**Cognitive Twin Engine**:
- `cognitive_twin_scores` - Decision momentum tracking
- `cognitive_twin_digests` - Weekly strategic digests
- `cognitive_twin_decisions` - Decision scenarios and outcomes

**SEO Leak Engine**:
- `seo_leak_signal_profiles` - SEO vulnerability detection

**Social Inbox**:
- `social_inbox_accounts` - Connected social accounts
- `social_messages` - Unified inbox messages

**Search Suite**:
- `search_keywords` - Keyword tracking and ranking

**Boost Bump Engine**:
- `boost_jobs` - Browser automation jobs

**Pre-Client Identity**:
- `pre_clients` - Email-derived contact profiles

### 2. Service Files (9)

**Founder Ops Core** (`src/lib/founderOps/`):
- `founderOpsEngine.ts` - Main orchestration engine
- `founderOpsQueue.ts` - Task queue management
- `founderOpsScheduler.ts` - Cron job scheduler
- `founderOpsTaskLibrary.ts` - Reusable task definitions
- `founderOpsArchiveBridge.ts` - Historical email analysis
- `founderOpsBrandBinding.ts` - Multi-brand context management

**Founder Services** (`src/lib/`):
- `founder/oversightService.ts` - Founder oversight and approval workflows
- `billing/trialService.ts` - Trial management and conversion
- `platform/platformMode.ts` - Platform mode detection (Founder vs Staff vs Client)

### 3. API Routes (23)

All routes under `/api/founder/`:

**Assistant**:
- `assistant/route.ts` - AI Phill conversational interface

**Awareness**:
- `awareness/route.ts` - Situational awareness dashboard

**Cognitive Map**:
- `cognitive-map/route.ts` - Decision momentum visualization

**Flight Deck**:
- `flight-deck/layout/route.ts` - Layout configuration

**Ops**:
- `ops/brand-workload/route.ts` - Brand workload distribution
- `ops/overview/route.ts` - Task overview
- `ops/queue/daily/route.ts` - Daily task generation
- `ops/queue/pause/route.ts` - Pause queue processing
- `ops/queue/resume/route.ts` - Resume queue processing
- `ops/queue/weekly/route.ts` - Weekly task generation
- `ops/tasks/route.ts` - Task CRUD operations
- `ops/tasks/[taskId]/route.ts` - Individual task operations

**Settings**:
- `settings/platform-mode/route.ts` - Platform mode configuration

**Memory (Cognitive Twin)**:
- `memory/snapshot/route.ts` - Generate memory snapshot
- `memory/patterns/route.ts` - Identify patterns
- `memory/momentum/route.ts` - Calculate momentum scores
- `memory/opportunities/route.ts` - Detect opportunities
- `memory/risks/route.ts` - Identify risks
- `memory/forecast/route.ts` - Generate forecasts
- `memory/decision-scenarios/route.ts` - Decision scenario analysis
- `memory/weekly-digest/route.ts` - Weekly digest generation
- `memory/next-actions/route.ts` - Recommend next actions
- `memory/overload/route.ts` - Cognitive load detection

### 4. Agent Files (8)

All agents in `src/lib/agents/`:

- `founderOsAgent.ts` - Main Founder Intelligence orchestrator
- `aiPhillAgent.ts` - Personal assistant agent
- `seoLeakAgent.ts` - SEO vulnerability detection agent
- `boostBumpAgent.ts` - Browser automation agent
- `searchSuiteAgent.ts` - Search ranking monitoring agent
- `socialInboxAgent.ts` - Social media inbox management agent
- `preClientIdentityAgent.ts` - Email-to-contact identity resolution agent
- `cognitiveTwinAgent.ts` - Cognitive twin / deep memory agent

### 5. Environment Variables (3)

Required for basic functionality:

- `ANTHROPIC_API_KEY` - Claude API access
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Admin-level database access

## Troubleshooting

### Database Tables Missing

**Error**: `✗ table_name: FAIL - Table not found`

**Solution**:
```bash
# Apply Founder Intelligence OS migrations
# In Supabase SQL Editor, run migrations in order:

300_founder_intelligence_os_core.sql
301_seo_leak_engine_core.sql
302_boost_bump_engine.sql
303_multi_channel_autonomy.sql
304_email_identity_engine.sql
305_cognitive_twin_engine.sql
```

### Service Files Missing

**Error**: `✗ service_file.ts: FAIL - File not found`

**Solution**: Ensure Founder Intelligence OS code is fully deployed. Check:
```bash
ls -la src/lib/founderOps/
ls -la src/lib/founder/
ls -la src/lib/billing/
ls -la src/lib/platform/
```

### API Routes Missing

**Error**: `✗ route.ts: FAIL - File not found`

**Solution**: Verify API routes exist:
```bash
ls -la src/app/api/founder/
```

### Agent Files Missing

**Error**: `✗ agentName.ts: FAIL - File not found`

**Solution**: Check agent files:
```bash
ls -la src/lib/agents/
```

### Environment Variables Missing

**Error**: `✗ VAR_NAME: FAIL - Not configured`

**Solution**: Add to `.env.local`:
```bash
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## CI/CD Integration

Add to GitHub Actions workflow:

```yaml
- name: Founder Intelligence OS Integrity Check
  run: npm run integrity:check
```

## Exit Status Examples

### All Pass (100%)
```
OVERALL STATUS: ✓ PASS (100%)
Exit Code: 0
```

### Partial Pass (80-99%)
```
OVERALL STATUS: ⚠ WARN (85%)
Exit Code: 1
```

### Fail (<80%)
```
OVERALL STATUS: ✗ FAIL (45%)
Exit Code: 1
```

## Related Commands

```bash
# Check database schema
npm run check:db

# Validate environment variables
npm run validate:env

# Test monitoring system
npm run test:monitoring

# Run full test suite
npm test
```

## Maintenance

Update expected tables/files when adding new components:

1. Edit `scripts/run-integrity-check.mjs`
2. Add to appropriate array (`expectedTables`, `expectedServices`, etc.)
3. Run check to verify

## Support

For issues or questions:
- Check migration files in `supabase/migrations/`
- Review `.claude/agent.md` for agent documentation
- Consult `CLAUDE.md` for system architecture
