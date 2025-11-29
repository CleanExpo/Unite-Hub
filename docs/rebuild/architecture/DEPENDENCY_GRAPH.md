# Dependency Graph & Build Order

**Phase 2 Task 2.4**: Create dependency graph with build order for reconstruction
**Date**: 2025-11-29
**Status**: APPROVED FOR IMPLEMENTATION

---

## Overview

This document defines the dependency relationships between all modules and the optimal build order for the Unite-Hub/Synthex rebuild.

---

## Dependency Graph (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 3: FOUNDATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐                                                        │
│  │  src/core/auth/  │                                                        │
│  │  - middleware.ts │◄───┐                                                   │
│  │  - guards.ts     │    │                                                   │
│  │  - session.ts    │    │                                                   │
│  └────────┬─────────┘    │                                                   │
│           │              │                                                   │
│           ▼              │                                                   │
│  ┌──────────────────┐    │  ┌─────────────────────┐                         │
│  │ src/core/database│    │  │ src/core/security/  │                         │
│  │ - client.ts      │────┤  │ - rate-limiter.ts   │                         │
│  │ - workspace.ts   │    └──│ - audit-logger.ts   │                         │
│  │ - rls-helpers.ts │       └─────────────────────┘                         │
│  └────────┬─────────┘                                                        │
│           │                                                                  │
└───────────┼──────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 4: DATA LAYER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     Supabase Migrations (400-series)                  │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │  400 → 401 → 402 → 403 → 404 → 405                                   │   │
│  │  Fix    Pool   RLS    RLS    Tier   Audit                            │   │
│  │  Dups   Enable Funcs  Policy Tables Enhance                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 5: API LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │              src/app/api/_middleware/                                │    │
│  │              - stack.ts (composes all middleware)                    │    │
│  │              - auth.ts                                               │    │
│  │              - workspace.ts                                          │    │
│  │              - rate-limit.ts                                         │    │
│  └───────────────────────────┬─────────────────────────────────────────┘    │
│                              │                                               │
│             ┌────────────────┼────────────────┐                             │
│             ▼                ▼                ▼                             │
│  ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐                 │
│  │ /api/v1/unite-hub│ │ /api/v1/     │ │ /api/webhooks/   │                 │
│  │ (Staff routes)   │ │ synthex/     │ │ (Public + sig)   │                 │
│  │ - contacts       │ │ (Client      │ │ - stripe         │                 │
│  │ - campaigns      │ │  routes)     │ │ - gmail          │                 │
│  │ - founder-os     │ │ - dashboard  │ │ - whatsapp       │                 │
│  │ - agents         │ │ - seo        │ └──────────────────┘                 │
│  └──────────────────┘ │ - marketing  │                                      │
│                       └──────────────┘                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 6: EXTERNAL INTEGRATIONS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Gmail OAuth     │  │ Stripe          │  │ Anthropic API   │              │
│  │ - sync          │  │ - subscriptions │  │ - rate limiter  │              │
│  │ - push webhooks │  │ - tier mgmt     │  │ - prompt cache  │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ DataForSEO      │  │ OpenRouter      │  │ Perplexity      │              │
│  │ - SEO data      │  │ - multi-model   │  │ - research      │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 7: AGENT SYSTEM VERIFICATION                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                src/lib/agents/ (26 PRESERVED files)                   │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  Infrastructure Agents (verify integration with new core/)            │   │
│  │  ├── base-agent.ts                                                    │   │
│  │  ├── agentExecutor.ts                                                 │   │
│  │  ├── model-router.ts                                                  │   │
│  │  └── orchestrator-router.ts                                           │   │
│  │                                                                       │   │
│  │  Founder OS Agents (verify workspace scoping)                         │   │
│  │  ├── aiPhillAgent.ts                                                  │   │
│  │  ├── cognitiveTwinAgent.ts                                            │   │
│  │  └── founderOsAgent.ts                                                │   │
│  │                                                                       │   │
│  │  Intelligence Agents (verify API integration)                         │   │
│  │  ├── contact-intelligence.ts                                          │   │
│  │  ├── email-processor.ts                                               │   │
│  │  └── content-personalization.ts                                       │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │              .claude/skills/ (19 PRESERVED SKILL.md files)            │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │  - Verify orchestrator → specialist delegation                        │   │
│  │  - Verify Extended Thinking integration                               │   │
│  │  - Verify workspace isolation in all operations                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 8: FRONTEND & LANDING PAGE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Route Groups                                       │   │
│  ├────────────────────┬─────────────────────────────────────────────────┤   │
│  │  (unite-hub)       │  (synthex)                                      │   │
│  │  Staff CRM         │  Client Portal                                  │   │
│  │  ├── dashboard     │  ├── client-dashboard                           │   │
│  │  ├── contacts      │  ├── marketing                                  │   │
│  │  ├── campaigns     │  └── seo-reports                                │   │
│  │  └── founder-os    │                                                 │   │
│  └────────────────────┴─────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Landing Pages                                      │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │  unite-group.in (Staff CRM login)                                     │   │
│  │  synthex.ai (Client portal + pricing)                                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 9: SECURITY & COMPLIANCE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Australian      │  │ Data Retention  │  │ Penetration     │              │
│  │ Privacy Act     │  │ Policies        │  │ Testing         │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Auth Audit      │  │ RLS Verification│  │ Rate Limit      │              │
│  │ (174 routes)    │  │ (all tables)    │  │ Testing         │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 10: FINAL VERIFICATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ E2E Tests       │  │ Load Testing    │  │ Documentation   │              │
│  │ (all flows)     │  │ (1000+ users)   │  │ Update          │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                                   │
│  │ Performance     │  │ Deployment      │                                   │
│  │ Benchmarks      │  │ Checklist       │                                   │
│  └─────────────────┘  └─────────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Build Order (Sequential)

### Phase 3: Foundation Layer (Total: 8-12 hours)

| Order | File | Dependencies | Est. Time |
|-------|------|--------------|-----------|
| 3.1 | `src/core/auth/session.ts` | None | 1 hour |
| 3.2 | `src/core/auth/middleware.ts` | 3.1 | 2 hours |
| 3.3 | `src/core/auth/guards.ts` | 3.1, 3.2 | 1 hour |
| 3.4 | `src/core/database/client.ts` | None | 2 hours |
| 3.5 | `src/core/database/workspace-scope.ts` | 3.4 | 1 hour |
| 3.6 | `src/core/database/rls-helpers.ts` | 3.4, 3.5 | 1 hour |
| 3.7 | `src/core/security/rate-limiter.ts` | None | 1 hour |
| 3.8 | `src/core/security/audit-logger.ts` | 3.4 | 1 hour |

### Phase 4: Data Layer (Total: 4-6 hours)

| Order | Migration | Dependencies | Est. Time |
|-------|-----------|--------------|-----------|
| 4.1 | 400_fix_migration_duplicates | Manual review | 2 hours |
| 4.2 | 401_enable_connection_pooler | Dashboard | 10 mins |
| 4.3 | 402_rls_helper_functions | None | 10 mins |
| 4.4 | 403_extended_table_rls | 4.3 | 30 mins |
| 4.5 | 404_synthex_tier_tables | 4.3 | 10 mins |
| 4.6 | 405_audit_log_enhancement | None | 10 mins |
| 4.7 | Verification queries | 4.1-4.6 | 30 mins |

### Phase 5: API Layer (Total: 24-32 hours)

| Order | Component | Dependencies | Est. Time |
|-------|-----------|--------------|-----------|
| 5.1 | `src/app/api/_middleware/stack.ts` | Phase 3 | 2 hours |
| 5.2 | Critical routes (P0 security) | 5.1 | 16-24 hours |
| 5.3 | Unite-Hub routes | 5.1, 5.2 | 4 hours |
| 5.4 | Synthex routes | 5.1, 5.2 | 4 hours |
| 5.5 | Webhook routes | 5.1 | 2 hours |

### Phase 6: External Integrations (Total: 8-12 hours)

| Order | Integration | Dependencies | Est. Time |
|-------|-------------|--------------|-----------|
| 6.1 | Gmail OAuth + webhooks | Phase 5 | 2 hours |
| 6.2 | Stripe subscriptions | Phase 5 | 3 hours |
| 6.3 | Anthropic rate limiter | Phase 3 | 2 hours |
| 6.4 | SEO integrations | Phase 5 | 2 hours |
| 6.5 | OpenRouter + Perplexity | Phase 5 | 2 hours |

### Phase 7: Agent Verification (Total: 4-8 hours)

| Order | Task | Dependencies | Est. Time |
|-------|------|--------------|-----------|
| 7.1 | Infrastructure agent tests | Phase 3-6 | 2 hours |
| 7.2 | Founder OS agent tests | 7.1 | 2 hours |
| 7.3 | Intelligence agent tests | 7.1 | 2 hours |
| 7.4 | Skill file verification | None | 1 hour |

### Phase 8: Frontend (Total: 16-24 hours)

| Order | Task | Dependencies | Est. Time |
|-------|------|--------------|-----------|
| 8.1 | Route group structure | Phase 5 | 2 hours |
| 8.2 | Unite-Hub dashboard | 8.1 | 6 hours |
| 8.3 | Synthex portal | 8.1 | 6 hours |
| 8.4 | Landing pages | None | 4 hours |

### Phase 9: Security Compliance (Total: 8-12 hours)

| Order | Task | Dependencies | Est. Time |
|-------|------|--------------|-----------|
| 9.1 | Auth audit verification | Phase 5 | 4 hours |
| 9.2 | RLS verification | Phase 4 | 2 hours |
| 9.3 | Rate limit testing | Phase 3 | 2 hours |
| 9.4 | Privacy compliance check | All | 2 hours |

### Phase 10: Final Verification (Total: 8-16 hours)

| Order | Task | Dependencies | Est. Time |
|-------|------|--------------|-----------|
| 10.1 | E2E test suite | All | 4 hours |
| 10.2 | Load testing | All | 4 hours |
| 10.3 | Documentation update | All | 4 hours |
| 10.4 | Deployment checklist | All | 2 hours |

---

## Critical Path

The critical path determines the minimum time to completion:

```
Phase 3 (3.1-3.6)  →  Phase 4 (4.1-4.7)  →  Phase 5 (5.1-5.2)  →  Phase 9 (9.1-9.2)
     8 hours            4 hours              18 hours              6 hours

Total Critical Path: ~36 hours (minimum)
```

With parallel work on non-blocking tasks:
- Phase 6-7-8 can proceed in parallel after Phase 5.1 is complete
- Phase 9-10 require all prior phases

---

## Parallel Work Streams

### Stream A: Core Infrastructure
- Lead: Backend Agent
- Phase 3.1-3.8 → Phase 4.1-4.7 → Phase 5.1

### Stream B: API Routes
- Lead: Backend Agent
- Phase 5.2-5.5 (after Stream A completes 5.1)

### Stream C: Integrations
- Lead: Backend Agent
- Phase 6.1-6.5 (after Stream A completes Phase 5.1)

### Stream D: Agent Verification
- Lead: Orchestrator Agent
- Phase 7.1-7.4 (after Streams A-C complete)

### Stream E: Frontend
- Lead: Frontend Agent
- Phase 8.1-8.4 (after Stream B completes)

### Stream F: Documentation
- Lead: Docs Agent
- Can proceed throughout, finalize in Phase 10

---

## Risk Dependencies

| Risk | Mitigation |
|------|------------|
| Database migration conflicts | Run in staging first |
| RLS policy breaks existing queries | Test with sample data |
| Agent integration failures | Keep original files as backup |
| Performance regression | Benchmark before/after each phase |

---

**Document Status**: COMPLETE
**Date**: 2025-11-29
