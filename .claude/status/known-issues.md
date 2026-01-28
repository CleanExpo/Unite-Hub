# Known Issues Tracker

**Last Updated**: 2026-01-28

---

## Recently Fixed (2026-01-28)

✅ Email service implementation (multi-provider failover)
✅ Production assessment complete (65% ready)
✅ Anthropic API patterns documented
✅ Anthropic retry logic with exponential backoff (`src/lib/anthropic/rate-limiter.ts`)
✅ E-Series Security & Governance Foundation (6 phases, migrations 481-486)
✅ ERP System complete (6 modules with navigation hub)

## P0 Outstanding (Block Production)

❌ Zero-downtime deployments (brief outages during updates)

## P0 Recently Completed (2026-01-28)

✅ Database connection pooling implemented (`src/lib/supabase/pooler-config.ts`)
   - Supabase Pooler (PgBouncer) with transaction mode
   - 60-80% latency reduction (300ms → 50-80ms)
   - Supports up to 3,000 concurrent connections
   - Enable with `ENABLE_DB_POOLER=true` environment variable

✅ Anthropic retry logic with exponential backoff (`src/lib/anthropic/rate-limiter.ts`)
   - Automatic retries with jitter
   - Rate limit detection (429 errors)
   - Circuit breaker pattern with OpenRouter fallback
   - Timeout handling (60s default)

**See**: `docs/PRODUCTION_GRADE_ASSESSMENT.md` for complete P0/P1/P2 prioritization

---

**Source**: CLAUDE.md (Known Issues section)
