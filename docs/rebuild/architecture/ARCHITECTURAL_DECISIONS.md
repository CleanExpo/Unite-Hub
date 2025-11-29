# Architectural Decision Records (ADRs)

**Phase 2 Task 2.6**: Document all architectural decisions with rationale
**Date**: 2025-11-29
**Status**: APPROVED FOR IMPLEMENTATION

---

## ADR Index

| ID | Decision | Status |
|----|----------|--------|
| ADR-001 | Centralized Auth Middleware | Accepted |
| ADR-002 | Automatic Workspace Scoping | Accepted |
| ADR-003 | Connection Pooling via Supabase | Accepted |
| ADR-004 | Project Separation via Route Groups | Accepted |
| ADR-005 | Preserve Agent Architecture | Accepted |
| ADR-006 | Tier-Gated Features for Synthex | Accepted |
| ADR-007 | Human-Governed Mode for All Agents | Accepted |
| ADR-008 | Versioned API Paths | Accepted |

---

## ADR-001: Centralized Auth Middleware

### Status
Accepted

### Context
The audit revealed 174 API routes (27%) missing authentication. Each route implemented auth differently or not at all, leading to security vulnerabilities and inconsistent behavior.

### Decision
Implement centralized authentication middleware in `src/core/auth/middleware.ts` that:
1. Validates PKCE tokens via Supabase `getUser()`
2. Returns 401 for invalid/missing tokens
3. Injects authenticated user into request context
4. Provides composable higher-order functions

### Rationale
- **Single point of enforcement**: Auth logic in one place
- **Consistent behavior**: All routes behave identically
- **Easier auditing**: Only need to verify middleware
- **Reduced boilerplate**: Routes don't repeat auth code

### Consequences
- All existing routes must be migrated to use middleware
- Testing requires mock auth context
- Slightly more complex route structure

### Alternatives Considered
1. **Per-route auth checks**: Current approach, error-prone
2. **Next.js middleware only**: Loses granular control
3. **Supabase RLS only**: Doesn't provide 401 responses

---

## ADR-002: Automatic Workspace Scoping

### Status
Accepted

### Context
The audit revealed 399 API routes (61%) missing workspace filtering. This causes cross-workspace data leakage and violates data isolation requirements.

### Decision
Implement automatic workspace scoping in `src/core/database/workspace-scope.ts`:
1. All queries automatically include `workspace_id` filter
2. All inserts automatically add `workspace_id`
3. Higher-order function `withWorkspaceScope(workspaceId)` returns scoped client
4. Cannot bypass without explicit override (for admin operations)

### Rationale
- **Impossible to forget**: Workspace filter is automatic
- **Defense in depth**: Works alongside RLS policies
- **Code simplicity**: Developers don't manage filters
- **Consistent isolation**: All data operations are scoped

### Consequences
- All database access must go through scoped client
- Admin operations need explicit unscoped client
- Slightly more complex query composition

### Alternatives Considered
1. **RLS only**: Requires valid JWT in every query
2. **Manual filters**: Current approach, error-prone
3. **View-based isolation**: Complex to maintain

---

## ADR-003: Connection Pooling via Supabase

### Status
Accepted

### Context
The audit identified connection pooling as a P0 critical issue. Current approach creates new connections per request, causing:
- 300ms+ connection times
- "Too many connections" errors at ~50 users
- High latency under load

### Decision
Enable Supabase's built-in PgBouncer connection pooling:
1. Use pooler endpoint for all connections
2. Configure transaction-level pooling
3. Set pool size to 15 default, max 200
4. Cache pooled client instance

### Rationale
- **No infrastructure change**: Supabase provides this
- **80% latency reduction**: 300ms → 50-80ms
- **10x capacity**: 50 → 500+ concurrent users
- **Minimal code change**: Just change connection string

### Consequences
- Must use Supabase Dashboard to enable
- Transaction mode limits some PostgreSQL features
- Need to update connection string in env

### Alternatives Considered
1. **PgBouncer self-hosted**: Operational overhead
2. **Prisma connection pooling**: Different ORM
3. **Application-level pooling**: Complex to implement

---

## ADR-004: Project Separation via Route Groups

### Status
Accepted

### Context
Unite-Hub serves two distinct user types:
1. **Staff (Unite-Hub)**: 3 internal email addresses, full CRM access
2. **Clients (Synthex)**: Paying customers, marketing features only

These need different:
- Authentication requirements
- Feature access
- UI/UX patterns
- Rate limits

### Decision
Use Next.js route groups to separate projects:
```
src/app/
├── (unite-hub)/    # Staff CRM
│   ├── dashboard/
│   └── contacts/
└── (synthex)/      # Client portal
    ├── client-dashboard/
    └── marketing/
```

### Rationale
- **Clear separation**: No accidental feature leakage
- **Different layouts**: Each project has own layout
- **Easy routing**: Path structure matches project
- **Shared components**: Can still share via imports

### Consequences
- Duplicate layout files
- Must be careful about shared state
- Navigation must know which project

### Alternatives Considered
1. **Subdomain separation**: More infrastructure
2. **Single app with role checks**: Messy mixing
3. **Separate repositories**: Loses code sharing

---

## ADR-005: Preserve Agent Architecture

### Status
Accepted

### Context
The existing agent system includes:
- 26 TypeScript agent files in `src/lib/agents/`
- 19 SKILL.md files in `.claude/skills/`
- Hierarchical orchestrator → specialist pattern
- Extended Thinking integration

These represent significant investment and working functionality.

### Decision
Preserve all agent files unchanged:
1. Do not modify any of the 26 agent TypeScript files
2. Do not modify any of the 19 SKILL.md files
3. Integrate new auth/database patterns via dependency injection
4. Agents receive scoped clients from calling context

### Rationale
- **Proven functionality**: Agents work correctly
- **Risk reduction**: No regression in agent behavior
- **Faster implementation**: Less code to review
- **Maintained knowledge**: SKILL.md files document behavior

### Consequences
- Must adapt new patterns to agent interfaces
- Some technical debt may remain
- Integration testing required

### Alternatives Considered
1. **Rewrite agents**: High risk, time-consuming
2. **Gradual migration**: Inconsistent patterns
3. **Fork and modify**: Maintenance burden

---

## ADR-006: Tier-Gated Features for Synthex

### Status
Accepted

### Context
Synthex clients pay for different service tiers:
- **Starter**: Basic features, limited usage
- **Professional**: Full features, higher limits
- **Elite**: Unlimited, priority support

Features must be gated by subscription tier.

### Decision
Implement tier gating via:
1. `synthex_subscriptions` table tracks active tier
2. `synthex_tier_limits` table defines feature limits
3. `check_tier_access(workspace_id, required_tier)` function
4. API routes check tier before returning data

### Rationale
- **Database-level enforcement**: Can't bypass via API
- **Configurable limits**: Change without code deploy
- **Clear upgrade path**: Show what tier unlocks feature
- **Stripe integration ready**: Links to subscription

### Consequences
- Every Synthex route needs tier check
- Need graceful handling of missing subscription
- Must sync with Stripe subscription changes

### Alternatives Considered
1. **Application-level only**: Bypassable
2. **Feature flags**: Doesn't tie to payment
3. **Separate deployments**: Operational complexity

---

## ADR-007: Human-Governed Mode for All Agents

### Status
Accepted

### Context
The business requirement states:
> "HUMAN_GOVERNED mode throughout - advisory only, present options, no automatic business changes"

Agents must propose, not execute.

### Decision
All agents operate in Human-Governed mode:
1. **Present options**: Show alternatives with pros/cons
2. **Recommend**: Highlight preferred choice
3. **Wait for approval**: No automatic execution
4. **Log decisions**: Record what was proposed and decided

### Rationale
- **Risk mitigation**: No unintended changes
- **Transparency**: User sees reasoning
- **Learning**: User can correct agent
- **Compliance**: Audit trail of decisions

### Consequences
- More steps in workflows
- Need approval UI components
- Queue management for pending approvals

### Alternatives Considered
1. **Fully autonomous**: High risk for mistakes
2. **Confirm-only**: Less transparency
3. **Hybrid**: Complexity of deciding which mode

---

## ADR-008: Versioned API Paths

### Status
Accepted

### Context
The API will evolve over time. Breaking changes need to be managed without disrupting existing clients.

### Decision
Use versioned API paths:
```
/api/v1/unite-hub/contacts
/api/v1/synthex/dashboard
/api/v1/agents/orchestrator
```

### Rationale
- **Clear versioning**: Path indicates version
- **Parallel deployment**: Multiple versions can coexist
- **Deprecation path**: Old versions can be deprecated
- **Client compatibility**: Clients pin to version

### Consequences
- More route files to maintain
- Documentation per version
- Must plan deprecation strategy

### Alternatives Considered
1. **Header-based versioning**: Less discoverable
2. **Query parameter**: Not RESTful
3. **No versioning**: Breaking changes break clients

---

## Decision Summary

| Decision | Impact | Risk | Effort |
|----------|--------|------|--------|
| ADR-001: Central Auth | High | Low | Medium |
| ADR-002: Auto Workspace | High | Low | Medium |
| ADR-003: Connection Pool | High | Low | Low |
| ADR-004: Route Groups | Medium | Low | Low |
| ADR-005: Preserve Agents | Medium | Low | None |
| ADR-006: Tier Gating | Medium | Medium | Medium |
| ADR-007: Human-Governed | High | Low | Low |
| ADR-008: Versioned API | Medium | Low | Medium |

---

## Implementation Priority

1. **Immediate (P0)**: ADR-001, ADR-002, ADR-003
   - Fixes critical security issues
   - Must complete before production

2. **Next (P1)**: ADR-004, ADR-006, ADR-008
   - Enables project separation
   - Enables monetization

3. **Continuous**: ADR-005, ADR-007
   - Already in place
   - Maintain throughout

---

**Document Status**: COMPLETE
**Date**: 2025-11-29
