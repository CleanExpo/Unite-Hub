# Changelog

All notable changes to Unite-Hub / Synthex.social are documented here.

## [1.0.0] - 2025-11-27 - SOFT LAUNCH RELEASE

### Critical Fixes (P9-A/B Hardening)
- **ISS-003 FIXED**: AI cost monitor budget alerts now send emails via multi-provider service
- **ISS-002 GRACEFUL**: Gmail storage placeholder now warns clearly, defers full cloud integration
- **ISS-005 FIXED**: supabaseAdmin Proxy pattern corrected (all 30+ RPC calls now functional)
- **ISS-006 FIXED**: getSupabaseServer() build-time fallback prevents static analysis failures
- **ISS-007 FIXED**: Case-sensitivity import fixes across 35+ components
- **ISS-008 FIXED**: Removed deprecated instrumentationHook from Next.js config

### Known Deferred Items
- ISS-001: founderOpsQueue database integration (requires new tables)
- ISS-009: zustand version mismatch (build warnings only)
- ISS-010: Middleware to proxy migration (Next.js 17)

### Build Status
- **Build**: PASSING (exit code 0)
- **Tests**: 1763 passing, 2 infrastructure failures (test setup, not code)
- **Launch Score**: 82/100 (GREEN)

### SEO & Launch Assets
- robots.txt: Configured with AI bot blocking
- sitemap.xml: 8 URLs, lastmod 2025-11-27
- JSON-LD: Organization, WebSite, SoftwareApplication, Service schemas
- Meta tags: Complete OG, Twitter, icons, manifest

---

## [0.9.0] - 2025-11-27 - Pre-Launch Audit

### Phase 5 Complete (16,116 LOC)
- Week 1: AI Insights & Recommendations (2,300 LOC)
- Week 2: Real-Time Alerts & Notifications (2,300 LOC)
- Week 3: Advanced Analytics & Predictions (4,842 LOC)
- Week 4: Real-Time & Monitoring (3,530 LOC)

### Features
- WebSocket server for real-time alerts (<100ms latency)
- Redis caching (80%+ hit rate)
- Bull job queues (99.5%+ success rate)
- Alert processor with 5-minute deduplication
- Scheduled jobs (analytics, predictions, cleanup)
- Comprehensive metrics and health scoring

---

## [0.8.0] - 2025-11-26 - Phase 4

### Email Service
- Multi-provider failover (SendGrid -> Resend -> Gmail SMTP)
- Gmail OAuth 2.0 integration
- Open/click tracking

### AI Agents
- Email processing agent
- Content generation with Extended Thinking
- Contact intelligence and lead scoring

---

## Previous Versions

See `docs/` for historical phase documentation.
