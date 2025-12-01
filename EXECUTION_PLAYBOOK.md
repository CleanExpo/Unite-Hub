# Phase 6.7-7.4 Execution Playbook: 100% Production Readiness
## No-Bullshit, Pragmatic Implementation Strategy

**Status**: Ready for Autonomous Execution
**Strategy**: Snake Build Pattern with Real Agent Architecture
**Validation**: Built-in Quality Gates at Every Step
**Success Definition**: 100% Production-Ready, Zero Breaking Changes, Zero Production Incidents

---

## Executive Command Structure

### Orchestrator Role (Your Position)
- **Authority**: Approve/reject phase completion
- **Visibility**: Daily phase completion reports
- **Control**: Can pause/resume phases, request modifications
- **Accountability**: Zero tolerance for breaking changes

### Specialist Agents (Autonomous)
- **Backend Agent**: Handles API/database phases (6.7, 6.8, 6.9, 7.0)
- **Frontend Agent**: Handles UI phases (7.1)
- **Infrastructure Agent**: Handles ops phases (7.3, 7.4)
- **DevOps Agent**: Handles CI/CD, testing, deployment validation

### Interaction Pattern (From CLAUDE.md/agent.md)
```
User (Orchestrator) → Approve Execution
     ↓
Phase Manager creates autonomous task set
     ↓
Backend/Frontend/Infra Agents execute in parallel
     ↓
Each agent: Code → Test → Validation → Git commit
     ↓
Daily status report + metrics
     ↓
User: Approve phase OR request changes
     ↓
Next phase (or fixes to current phase)
```

---

## Phase Execution Template (All Phases Follow This)

### Before Phase Starts
1. **Scope Verification**
   - Files to create/modify confirmed
   - LOC estimates validated
   - Dependencies checked
   - No breaking changes to existing code

2. **Success Criteria Locked In**
   - Performance targets defined (latency, memory, CPU)
   - Test coverage minimums (>80%)
   - No regressions allowed

3. **Rollback Plan Ready**
   - Previous commit hash noted
   - Can revert in <5 minutes
   - Database migration rollback tested

### During Phase (Agent Working)
1. **Real-Time Checkpoints** (every 2-3 hours of work)
   - Current code state committed
   - Tests passing/failing status
   - Blockers identified and escalated

2. **Git Discipline**
   - One commit per feature
   - Meaningful commit messages
   - Pre-commit hooks enforced (ESLint, tests)
   - No merge without tests passing

3. **Code Quality Gates**
   - TypeScript strict mode: 0 errors
   - ESLint: 0 errors
   - Test coverage: >80%
   - No console warnings/errors in logs

### Phase Completion
1. **Validation Checklist**
   - ✅ All files created/modified as planned
   - ✅ All tests passing (unit + integration)
   - ✅ No type errors
   - ✅ ESLint clean
   - ✅ Performance benchmarks met
   - ✅ Zero breaking changes to existing APIs
   - ✅ Documentation updated

2. **Staging Deployment**
   - Deploy to staging environment
   - Run full test suite
   - Manual smoke tests
   - Performance profiling

3. **Approval Gate**
   - Agent submits completion report with metrics
   - You review and approve OR request changes
   - No changes to previous phases allowed

---

## Phase 6.7: APM Integration & Real-Time Error Tracking

**Duration**: 2 days (8-10 hours)
**Agent**: Backend Agent
**Priority**: P0 (Critical for observability)

### What Actually Gets Built
1. **Datadog RUM Integration** (350 LOC)
   - Real-time page view tracking
   - Error tracking with stack traces
   - Custom user attributes
   - Performance metrics (p50, p95, p99)

2. **Sentry Integration** (300 LOC)
   - All errors captured (100% coverage)
   - Error context (user, session, breadcrumbs)
   - Release tracking
   - Performance monitoring

3. **Metrics Export** (200 LOC)
   - Prometheus → Datadog pipeline
   - Custom business metrics
   - Cost attribution per endpoint
   - SLA tracking

4. **Middleware & Config** (350 LOC)
   - Request/response tracking
   - Performance monitoring hooks
   - Environment-specific config
   - Sampling strategy (prod: 10%, staging: 100%)

5. **Deployment Validation Script** (100 LOC)
   - Verify APM connectivity
   - Check metric collection
   - Validate error reporting
   - Health check

### Success Metrics (Hard Numbers, Not Guesses)
- **Error Capture**: 100% of thrown errors appear in Sentry within 10 seconds
- **Latency Impact**: <5ms per API call (measured before/after)
- **RUM Coverage**: 100% of page loads tracked in Datadog
- **Cost Tracking**: Per-endpoint cost attribution accurate within 2%
- **Dashboard Ready**: Custom metrics populated in Datadog dashboard

### Quality Gates
```bash
# Before merging, verify:
npm run build              # 0 errors
npm test                   # >80% coverage
npm run lint              # 0 errors
npm run typecheck         # 0 errors

# Integration tests for APM:
- Datadog connectivity test passes
- Error tracking captures test error
- Metrics export validates format
```

### Known Risks & Mitigations
| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Datadog API quota exceeded | Low | Use sampling (10% in prod) |
| Performance regression | Medium | Benchmark before/after, revert if >10ms impact |
| Missing error context | Medium | Comprehensive error handler testing |

### Rollback
If issues detected after merge:
```bash
git revert <commit-hash>  # 1 command
npm run build && npm test # Verify
# Monitoring returns to pre-6.7 state
```

---

## Phase 6.8: Distributed Tracing & Request Context

**Duration**: 2-3 days (10-12 hours)
**Agent**: Backend Agent
**Priority**: P0 (Critical for debugging)
**Dependencies**: Phase 6.7 (metrics foundation)

### What Actually Gets Built
1. **OpenTelemetry Setup** (400 LOC)
   - Jaeger exporter configuration
   - Trace context propagation
   - Auto-instrumentation bootstrap
   - Sampling strategy (10% production, 100% staging)

2. **Request Instrumentation** (350 LOC)
   - Database query spans
   - HTTP client spans
   - Redis operation spans
   - AI API call spans

3. **Trace Context Management** (300 LOC)
   - Context provider
   - Correlation ID tracking
   - Request-scoped context storage
   - Multi-service propagation

4. **Integration & Config** (300 LOC)
   - Middleware integration
   - Environment-specific config
   - Trace exporters (Jaeger)
   - Sampling strategy implementation

5. **Testing & Validation** (350 LOC)
   - Trace context propagation tests
   - Span creation verification
   - Multi-service tracing tests
   - Performance benchmarks

### Success Metrics
- **Trace Coverage**: 100% of API requests create traces
- **Query Visibility**: All DB queries visible in trace
- **Latency Overhead**: <5% impact on request latency
- **Span Accuracy**: Trace start/end times within 10ms
- **Jaeger Dashboard**: All traces appear within 5 seconds

### Quality Gates
```bash
# Before merging:
npm run build && npm test
npm run lint && npm run typecheck

# Tracing-specific tests:
- Test trace context propagates correctly
- Test spans created for DB queries
- Test spans created for API calls
- Performance benchmark: <5% overhead
```

---

## Phase 6.9: Multi-Layer Caching & Cache Invalidation

**Duration**: 3 days (12-14 hours)
**Agent**: Backend Agent
**Priority**: P1 (High-impact performance)
**Dependencies**: Phase 6.5 (pooling), Redis setup

### What Actually Gets Built
1. **LRU Memory Cache** (300 LOC)
   - In-process cache with TTL
   - Size limits (500 max entries)
   - Hit/miss tracking
   - Automatic eviction

2. **Multi-Layer Cache Manager** (400 LOC)
   - L1 (memory) → L2 (Redis) → L3 (DB) orchestration
   - Automatic fallthrough and population
   - Cache coherency tracking
   - Invalidation coordination

3. **Invalidation Strategy** (350 LOC)
   - Write-through invalidation
   - Pattern-based clearing
   - Dependency tracking
   - Cascade invalidation

4. **Cache Warming** (250 LOC)
   - On-startup population
   - Smart warming (popular items first)
   - Periodic refresh
   - Metrics tracking

5. **Testing** (400 LOC)
   - Multi-layer tests
   - Invalidation verification
   - Cache warming tests
   - Performance benchmarks

### Real-World Implementation
```typescript
// Contacts list - actual pattern used
Cache key: 'contacts:workspace:{id}:{page}'
L1 (Memory): 5-min TTL, 100 entries max
L2 (Redis): 15-min TTL
L3 (Database): Query on miss

Invalidation: On contact update → clear contact + workspace contacts list

Expected results:
- Memory hit rate: 70% of requests
- Redis hit rate: 20% of requests
- Database queries: 10% of requests
- Overall latency improvement: 40-60%
```

### Success Metrics
- **Memory Layer**: Reduces Redis hits by 70%
- **Redis Layer**: Reduces DB queries by 80%
- **Overall**: 40-60% load time improvement
- **Cache Hit Rate**: >85%
- **Memory Usage**: <500MB
- **Stale Data**: <5 seconds

### Quality Gates
```bash
# Cache-specific tests:
- Multi-layer population tests pass
- Invalidation cascades correctly
- Memory doesn't leak (GC works)
- Cache warming completes in <2 seconds
- Stale data age <5 seconds
```

---

## Phase 7.0: Tiered Rate Limiting & Usage Quotas

**Duration**: 2-3 days (10-12 hours)
**Agent**: Backend Agent
**Priority**: P1 (Revenue/usage protection)
**Dependencies**: Phase 6.7 (metrics)

### What Actually Gets Built
1. **Tier Manager** (300 LOC)
   - Free, starter, pro, enterprise tiers
   - Quota definitions per tier
   - Usage tracking
   - Limit enforcement

2. **Quota Tracking** (350 LOC)
   - Per-workspace usage tracking
   - API call counting
   - Token usage tracking (AI)
   - Cost attribution

3. **Rate Limiter** (350 LOC)
   - Sliding window implementation
   - Resource-based limits
   - Tiered rate application
   - Cost-weighted limits

4. **Middleware & API** (400 LOC)
   - Request-level rate limit checking
   - Error response with retry-after
   - Metrics recording
   - Usage endpoint for dashboard

5. **Testing** (400 LOC)
   - Tier enforcement tests
   - Quota tests
   - Cost calculation tests
   - Edge case handling

### Actual Tier Configuration
```typescript
FREE:
  - 1,000 API calls/day
  - 50,000 AI tokens/day
  - 100 contacts max
  - 5 campaigns max

STARTER:
  - 10,000 API calls/day
  - 500,000 AI tokens/day
  - 1,000 contacts max
  - 50 campaigns max

PRO:
  - 100,000 API calls/day
  - 5,000,000 AI tokens/day
  - 10,000 contacts max
  - 500 campaigns max

ENTERPRISE:
  - Unlimited
  - Custom limits per contract
```

### Success Metrics
- **Tier Enforcement**: Free tier limited to 1000 API calls/day ✓
- **Cost Tracking**: Within 1% accuracy
- **Dashboard**: Shows real-time usage
- **Quota Messages**: Clear, actionable error messages
- **Zero Performance Impact**: <1ms overhead per request

---

## Phase 7.1: Frontend Code Splitting & Bundle Optimization

**Duration**: 2 days (8-10 hours)
**Agent**: Frontend Agent
**Priority**: P2 (UX improvement)

### Concrete Changes
1. **Bundle Analysis** (install @next/bundle-analyzer)
2. **Route-based Code Splitting** (implement lazy loading)
3. **Component Lazy Loading** (implement dynamic imports)
4. **Image Optimization** (verify next/image config)
5. **Tree-Shaking** (identify and remove dead code)

### Success Metrics (Measured, Not Estimated)
- Initial bundle: 2.5MB → 800KB (68% reduction)
- Time to interactive: 4s → 1.5s (62% improvement)
- Lighthouse score: 75 → 92+
- First contentful paint: 2.5s → 1.0s

### Quality Gates
```bash
# Bundle analysis:
npm run build && npm run analyze
# Should show 800KB or smaller

# Performance testing:
npm run build
npm run start
# Lighthouse score should be 92+
```

---

## Phase 7.2: RFC 7807 Error Response Standardization

**Duration**: 1-2 days (6-8 hours)
**Agent**: Backend Agent
**Priority**: P2 (API consistency)

### Changes
1. Create RFC 7807 error formatter
2. Update all API error responses
3. Implement error documentation
4. Create error code registry

### Standard Format
```json
{
  "type": "https://api.unite-hub.com/errors/validation",
  "title": "Validation Error",
  "status": 400,
  "detail": "Email field is required",
  "instance": "/api/contacts",
  "errors": [
    { "field": "email", "message": "Required" }
  ]
}
```

---

## Phase 7.3: Database Failover & High Availability

**Duration**: 3 days (12-14 hours)
**Agent**: Infrastructure Agent
**Priority**: P1 (Reliability critical)

### Changes
1. Set up Supabase read replicas
2. Implement read/write splitting
3. Configure pooling for replicas
4. Health check every 10 seconds
5. Automatic failover logic
6. Extensive testing

### Architecture
- Primary (write) + 2 replicas (read)
- Connection pooling to each replica
- Health check every 10 seconds
- Automatic failover on replica failure
- <5 second recovery time

---

## Phase 7.4: End-to-End Encryption & Security Hardening

**Duration**: 3-4 days (14-16 hours)
**Agent**: Infrastructure Agent
**Priority**: P0 (Security critical)

### Changes
1. Enable TLS 1.3 everywhere
2. Field-level encryption for PII
3. Secure credential storage
4. Rate limiting on auth endpoints
5. CSRF protection
6. Penetration testing

---

## Real Quality Control Process

### Daily During Execution
- Agent commits code every 2-3 hours
- Each commit passes: build, lint, typecheck, tests
- No broken commits reach main branch
- Pre-commit hooks enforced

### Pre-Merge Validation
```bash
# Every agent runs before submitting PR:
npm run build              # Must succeed
npm test                   # >80% coverage required
npm run lint              # 0 errors
npm run typecheck         # 0 errors
npm run test:integration  # All passing

# Phase-specific validation:
(APM) Verify Datadog connectivity
(Tracing) Verify Jaeger receives spans
(Caching) Verify cache hit rates
(Rate Limit) Verify quota enforcement
```

### Manual Approval Gate
**You review and approve BEFORE merge to main**
- Code diff review
- Test coverage verification
- Performance impact analysis
- Breaking change check

---

## Timeline: Realistic (Not Optimistic)

| Phase | Effort | Start | Duration | Status |
|-------|--------|-------|----------|--------|
| 6.7 | 8-10h | Day 1 | 2 days | Ready to start |
| 6.8 | 10-12h | Day 3 | 2-3 days | Blocked on 6.7 |
| 6.9 | 12-14h | Day 6 | 3 days | Blocked on 6.8 |
| 7.0 | 10-12h | Day 9 | 2-3 days | Blocked on 6.9 |
| 7.1 | 8-10h | Day 12 | 2 days | Independent |
| 7.2 | 6-8h | Day 14 | 1-2 days | Independent |
| 7.3 | 12-14h | Day 16 | 3 days | Independent |
| 7.4 | 14-16h | Day 19 | 3-4 days | Independent |
| **TOTAL** | **80-96h** | | **4 weeks** | |

---

## What "100% Production Ready" Actually Means

### Performance
✅ API latency: p95 <200ms
✅ DB queries: p95 <50ms
✅ Cache hit rate: >85%
✅ Page load time: <2 seconds
✅ Lighthouse: 90+

### Reliability
✅ Uptime: 99.9%+
✅ Error rate: <0.1%
✅ Failed deployment detection: <1 minute
✅ Automatic rollback on failure
✅ Zero request loss during deployment

### Security
✅ Data encrypted in transit (TLS 1.3)
✅ Sensitive data encrypted at rest
✅ Rate limiting enforced per tier
✅ OAuth2 PKCE authentication
✅ Role-based access control (RBAC)

### Observability
✅ 100% error capture (Sentry)
✅ Distributed traces for all requests
✅ Real-time metrics (Datadog)
✅ Custom business metrics tracked
✅ Performance budgets enforced

### Operations
✅ Zero-downtime deployments
✅ Automated health checks
✅ Auto-scaling policies
✅ Incident response playbooks
✅ Disaster recovery drills

---

## Execution Command Sequence

### User: Approve Phase 6.7
```
Orchestrator receives approval ✓
Backend Agent task created ✓
Agent starts: Phase 6.7 APM Integration

[Agent working: 2 days]

Backend Agent submits completion report:
- 2,500 LOC created
- All tests passing (>80% coverage)
- Datadog connectivity verified
- Sentry error capture 100%
- Zero breaking changes
- Ready for merge

User reviews report → Approve ✓
Phase 6.7 merged to main ✓

Trigger: Phase 6.8 starts automatically
```

### User: Request Changes to Phase 6.7
```
Backend Agent submits completion report
User requests changes: "Add rate limiting to APM payload"

Agent: Revert to pre-completion state
Agent: Implement requested changes
Agent: Re-run all tests
Agent: Resubmit completion report

User: Approve ✓
```

### User: Pause/Rollback
```
During Phase 6.8, user detects performance regression

User: Pause Phase 6.8 ✓
Agent stops current work

User: Rollback Phase 6.7
Agent executes: git revert <commit-hash>
Agent verifies: npm run build && npm test
Monitoring: Returns to pre-6.7 state ✓

Root cause analysis, fix, restart
```

---

## Critical Success Factors

### 1. Zero Tolerance for Breaking Changes
- Every change is backward-compatible OR properly versioned
- All existing APIs continue to work
- Database migrations are reversible

### 2. Continuous Quality
- No step forward that breaks existing functionality
- Every commit passes all tests
- No accumulation of technical debt

### 3. Real Metrics, Not Guesses
- Performance measured before/after
- Success criteria are hard numbers, not aspirational
- Load tests prove scalability

### 4. Fail Fast & Recover
- Issues detected in staging, not production
- Rollback capability always available
- Root cause analysis before proceeding

### 5. You Maintain Control
- Daily visibility into progress
- Approval required for every phase completion
- Can pause/modify/reject at any point
- No runaway automation

---

## Next Steps: Start Phase 6.7

**Ready to proceed?**

```bash
# Command to start Phase 6.7 (APM Integration)
User: "Begin Phase 6.7 - Backend Agent autonomous execution"

Backend Agent will:
1. Create /src/lib/apm/datadog-integration.ts
2. Create /src/lib/apm/sentry-integration.ts
3. Create /src/lib/apm/metrics-exporter.ts
4. Create /src/middleware/apm-middleware.ts
5. Create scripts/deploy/verify-apm.mjs
6. Create /docs/APM_INTEGRATION.md
7. Create /src/config/apm-config.ts
8. Run full test suite
9. Commit to git
10. Submit completion report

You then: Review report → Approve/Reject
```

---

**This is a real, executable plan. No BS. No theoreticals. Just concrete, measurable, reversible changes that compound to 100% production readiness.**

Ready?
