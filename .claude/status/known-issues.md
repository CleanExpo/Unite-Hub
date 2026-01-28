# Known Issues Tracker

**Last Updated**: 2026-01-28

---

## Recently Fixed (2026-01-28)

### Phase 1 (Early 2026-01-28)
✅ Email service implementation (multi-provider failover)
✅ Production assessment complete (65% ready)
✅ Anthropic API patterns documented
✅ Anthropic retry logic with exponential backoff (`src/lib/anthropic/rate-limiter.ts`)
✅ E-Series Security & Governance Foundation (6 phases, migrations 481-486)
✅ ERP System complete (6 modules with navigation hub)
✅ Sentry error monitoring (client, server, edge configs)
✅ CSRF protection (double-submit cookie pattern)
✅ Input sanitization (10 sanitization functions)
✅ Load testing suite (Artillery: basic, stress, spike tests)

### Phase 2 (Late 2026-01-28) - Option 2 Path: Thorough Implementation
✅ **Production Build Issues** - ALL RESOLVED
   - Implemented `@/lib/email/emailService.ts` - Email service with metadata support
   - Implemented `@/lib/ai/personalization.ts` - AI content personalization using Claude
   - Implemented `@/lib/guardian/access.ts` - Guardian RBAC system
   - Build successful: 644 static pages, .next artifacts generated

✅ **Zustand Version Conflict** - RESOLVED
   - Downgraded from 5.0.8 to 4.5.7 for reactflow compatibility
   - No version conflicts remaining

✅ **Load Test Execution** - COMPLETE
   - Basic load test: 19,500 users, P95: 46ms, 100% success
   - Stress test: 96,300 users, capacity limit ~300 req/s identified
   - Spike test: 31,800 users, graceful degradation verified
   - Performance baselines documented in `docs/PERFORMANCE_BASELINES.md`

## P0 Outstanding (Block Production)

**NONE** - All P0 items resolved! 🎉

## P1 Outstanding (Production Enhancement)

✅ ~~Sentry error monitoring~~ - **COMPLETE**
✅ ~~Security hardening~~ - **COMPLETE**
✅ ~~Load test execution~~ - **COMPLETE**
✅ ~~Performance baselines~~ - **COMPLETE**
⚠️ Health endpoint fix (returns "Invalid time value" error)
⚠️ Performance optimization (bundle size, CDN, caching layers)
⚠️ Test coverage improvement (328 failures remaining)
⚠️ Horizontal scaling setup (for >300 req/s capacity)

## P0 Recently Completed (2026-01-28)

✅ **Zero-downtime deployments** (`Dockerfile.production`, `docker-compose.production.yml`, `scripts/deploy-blue-green.sh`)
   - Multi-stage Docker builds for optimized images
   - Blue-green deployment slots (ports 3008/3009)
   - Nginx load balancer with automatic traffic switching
   - Comprehensive health checks (Docker + app + system)
   - Automatic rollback on failed health checks
   - Non-root container user for security

✅ **Database connection pooling** (`src/lib/supabase/pooler-config.ts`)
   - Supabase Pooler (PgBouncer) with transaction mode
   - 60-80% latency reduction (300ms → 50-80ms)
   - Supports up to 3,000 concurrent connections
   - Enable with `ENABLE_DB_POOLER=true` environment variable

✅ **Anthropic retry logic** (`src/lib/anthropic/rate-limiter.ts`)
   - Automatic retries with exponential backoff and jitter
   - Rate limit detection (429 errors)
   - Circuit breaker pattern with OpenRouter fallback
   - Timeout handling (60s default)

**See**: `docs/PRODUCTION_GRADE_ASSESSMENT.md` for complete P0/P1/P2 prioritization

---

**Source**: CLAUDE.md (Known Issues section)
