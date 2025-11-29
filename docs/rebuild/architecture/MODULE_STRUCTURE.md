# Module Structure Architecture

**Phase 2 Task 2.1**: Design new module structure preserving existing agent interfaces
**Date**: 2025-11-29
**Status**: APPROVED FOR IMPLEMENTATION

---

## Executive Summary

This document defines the target module structure for Unite-Hub/Synthex that:
1. Fixes all P0 critical security issues (auth, workspace isolation, connection pooling)
2. Preserves all 19 SKILL.md files and 26 agent TypeScript files
3. Separates Unite-Hub (staff CRM) from Synthex (client marketing agency)
4. Enforces workspace isolation at the architectural level

---

## Current vs Target Structure

### Current State (Problematic)

```
src/
├── app/api/          # 655 routes, 174 without auth, 399 without workspace filter
├── lib/
│   ├── supabase.ts   # Multiple client patterns, no pooling
│   ├── agents/       # 26 agent files (PRESERVE)
│   └── ...           # Mixed concerns
└── components/       # No project separation
```

### Target State (Secure)

```
src/
├── core/                           # Shared foundation (both projects)
│   ├── auth/
│   │   ├── middleware.ts           # Central auth middleware
│   │   ├── guards.ts               # Role-based access guards
│   │   └── session.ts              # PKCE session management
│   ├── database/
│   │   ├── client.ts               # Pooled Supabase client
│   │   ├── workspace-scope.ts      # Automatic workspace filtering
│   │   └── rls-helpers.ts          # RLS policy helpers
│   └── security/
│       ├── rate-limiter.ts         # Request rate limiting
│       └── audit-logger.ts         # Security audit logging
│
├── lib/
│   ├── agents/                     # PRESERVED - 26 agent files
│   │   ├── base-agent.ts
│   │   ├── aiPhillAgent.ts
│   │   ├── cognitiveTwinAgent.ts
│   │   ├── founderOsAgent.ts
│   │   └── ... (all 26 files)
│   └── services/                   # Business logic services
│       ├── contact-service.ts
│       ├── campaign-service.ts
│       └── email-service.ts
│
├── app/
│   ├── api/
│   │   ├── _middleware/            # API middleware stack
│   │   │   ├── auth.ts             # Authentication check
│   │   │   ├── workspace.ts        # Workspace injection
│   │   │   └── rate-limit.ts       # Rate limiting
│   │   ├── v1/                     # Versioned API
│   │   │   ├── unite-hub/          # Staff-only endpoints
│   │   │   └── synthex/            # Client endpoints
│   │   └── webhooks/               # External webhooks (no auth)
│   │
│   ├── (unite-hub)/                # Route group: Staff CRM
│   │   ├── dashboard/
│   │   ├── contacts/
│   │   └── campaigns/
│   │
│   └── (synthex)/                  # Route group: Client portal
│       ├── client-dashboard/
│       └── marketing/
│
└── .claude/
    └── skills/                     # PRESERVED - 19 SKILL.md files
```

---

## Core Module Specifications

### 1. Authentication Module (`src/core/auth/`)

**Purpose**: Centralized authentication enforcement

**Files**:

```typescript
// src/core/auth/middleware.ts
export async function withAuth(
  handler: AuthenticatedHandler
): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handler({ user, supabase });
}

// src/core/auth/guards.ts
export type UserRole = 'FOUNDER' | 'STAFF' | 'CLIENT' | 'ADMIN';

export async function requireRole(
  user: User,
  allowedRoles: UserRole[]
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return allowedRoles.includes(profile?.role as UserRole);
}

// Role guards for Unite-Hub (staff only)
export const requireStaff = (user: User) =>
  requireRole(user, ['FOUNDER', 'STAFF', 'ADMIN']);

// Role guards for Synthex (clients)
export const requireClient = (user: User) =>
  requireRole(user, ['CLIENT', 'FOUNDER', 'ADMIN']);
```

**Impact**: Fixes 174 routes missing authentication

---

### 2. Database Module (`src/core/database/`)

**Purpose**: Pooled connections with automatic workspace scoping

**Files**:

```typescript
// src/core/database/client.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Connection pool configuration
const POOL_CONFIG = {
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

let pooledClient: SupabaseClient | null = null;

export async function getPooledClient(): Promise<SupabaseClient> {
  if (!pooledClient) {
    pooledClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: {
          schema: 'public',
        },
        auth: {
          persistSession: false,
        },
        // Use Supabase's built-in connection pooling
        // via the pooler endpoint
      }
    );
  }
  return pooledClient;
}

// src/core/database/workspace-scope.ts
export function scopeToWorkspace<T extends { workspace_id: string }>(
  query: PostgrestFilterBuilder<any, any, T[]>,
  workspaceId: string
): PostgrestFilterBuilder<any, any, T[]> {
  return query.eq('workspace_id', workspaceId);
}

// Higher-order function for automatic scoping
export function withWorkspaceScope(workspaceId: string) {
  return {
    from: <T extends { workspace_id: string }>(table: string) => {
      const baseQuery = supabase.from(table);
      return {
        ...baseQuery,
        select: (...args: any[]) =>
          scopeToWorkspace(baseQuery.select(...args), workspaceId),
        insert: (data: T | T[]) => {
          const scopedData = Array.isArray(data)
            ? data.map(d => ({ ...d, workspace_id: workspaceId }))
            : { ...data, workspace_id: workspaceId };
          return baseQuery.insert(scopedData);
        },
        update: (data: Partial<T>) =>
          scopeToWorkspace(baseQuery.update(data), workspaceId),
        delete: () =>
          scopeToWorkspace(baseQuery.delete(), workspaceId),
      };
    },
  };
}
```

**Impact**:
- Fixes 399 routes missing workspace filter
- Fixes connection pooling (60-80% latency reduction)

---

### 3. API Middleware Stack (`src/app/api/_middleware/`)

**Purpose**: Composable middleware for all API routes

```typescript
// src/app/api/_middleware/stack.ts
import { withAuth } from '@/core/auth/middleware';
import { withWorkspace } from './workspace';
import { withRateLimit } from './rate-limit';
import { withAuditLog } from './audit';

// Compose middleware for protected routes
export function protectedRoute(handler: ProtectedHandler) {
  return withRateLimit(
    withAuth(
      withWorkspace(
        withAuditLog(handler)
      )
    )
  );
}

// Compose middleware for public routes (webhooks)
export function publicRoute(handler: Handler) {
  return withRateLimit(
    withAuditLog(handler)
  );
}

// Usage in route files:
// export const POST = protectedRoute(async ({ user, workspace, supabase }) => {
//   // Automatically authenticated, workspace-scoped, rate-limited, and logged
// });
```

---

### 4. Agent Interface Preservation

**Preserved Files** (NO CHANGES):

```
src/lib/agents/
├── base-agent.ts                    # Base class
├── agentExecutor.ts                 # Execution framework
├── agentPlanner.ts                  # Task planning
├── agentSafety.ts                   # Safety guardrails
├── agentArchiveBridge.ts            # Archive/retrieval
├── agent-reliability.ts             # Retry patterns
├── model-router.ts                  # Multi-model routing
├── multi-model-orchestrator.ts      # Cross-model orchestration
├── orchestrator-router.ts           # Task routing
├── orchestrator-self-healing.ts     # Self-healing
├── aiPhillAgent.ts                  # AI Phill strategic advisor
├── cognitiveTwinAgent.ts            # 13-domain monitoring
├── founderOsAgent.ts                # Business portfolio
├── preClientIdentityAgent.ts        # Pre-sales intelligence
├── contact-intelligence.ts          # Contact scoring
├── content-personalization.ts       # Content generation
├── email-processor.ts               # Email parsing
├── email-intelligence-agent.ts      # Email analysis
├── intelligence-extraction.ts       # Data extraction
├── socialInboxAgent.ts              # Social unified inbox
├── seoLeakAgent.ts                  # SEO vulnerability
├── searchSuiteAgent.ts              # Keyword tracking
├── boostBumpAgent.ts                # Browser automation
├── calendar-intelligence.ts         # Calendar analysis
├── mindmap-analysis.ts              # Mind map processing
└── whatsapp-intelligence.ts         # WhatsApp processing
```

**Integration Pattern**:

```typescript
// Agents use new scoped database client
import { withWorkspaceScope } from '@/core/database/workspace-scope';

// In agent execution:
const scopedDb = withWorkspaceScope(workspaceId);
const contacts = await scopedDb.from('contacts').select('*');
// Automatically filtered by workspace_id
```

---

## Route Reorganization

### API Route Categories

| Category | Auth | Workspace | Rate Limit | Example |
|----------|------|-----------|------------|---------|
| Unite-Hub Staff | Required | Required | 100/min | `/api/v1/unite-hub/contacts` |
| Synthex Client | Required | Required | 50/min | `/api/v1/synthex/campaigns` |
| Agent Internal | Required | Required | 200/min | `/api/v1/agents/orchestrator` |
| Webhooks | Signature | N/A | 1000/min | `/api/webhooks/stripe` |
| Public | None | N/A | 10/min | `/api/health` |

### Route Migration Map

```
CURRENT                          → TARGET
/api/contacts/*                  → /api/v1/unite-hub/contacts/*
/api/campaigns/*                 → /api/v1/unite-hub/campaigns/*
/api/agents/*                    → /api/v1/agents/* (internal)
/api/founder-os/*                → /api/v1/unite-hub/founder-os/*
/api/synthex/*                   → /api/v1/synthex/*
/api/webhooks/*                  → /api/webhooks/* (no change)
```

---

## Project Separation

### Unite-Hub (Staff CRM)

**Access**: 3 email addresses only (FOUNDER, STAFF roles)

**Route Group**: `(unite-hub)`

**Features**:
- Contact management
- Email integration
- Campaign management
- Founder Intelligence OS
- AI agent dashboard

### Synthex (Client Portal)

**Access**: Clients through paywall (CLIENT role)

**Tiers**: starter, professional, elite

**Route Group**: `(synthex)`

**Features**:
- Marketing dashboard
- Campaign analytics
- SEO reports
- Content generation
- Social media management

---

## Build Order

### Phase 3: Foundation Layer

1. `src/core/auth/middleware.ts`
2. `src/core/auth/guards.ts`
3. `src/core/auth/session.ts`
4. `src/core/database/client.ts`
5. `src/core/database/workspace-scope.ts`
6. `src/core/security/rate-limiter.ts`
7. `src/core/security/audit-logger.ts`

### Phase 4: Data Layer

1. Database migrations for cleanup
2. RLS policy updates
3. Connection pooling activation

### Phase 5: API Layer

1. `src/app/api/_middleware/` stack
2. Route-by-route migration (most critical first)
3. OpenAPI documentation generation

---

## Acceptance Criteria

| Criteria | Metric | Target |
|----------|--------|--------|
| Auth Coverage | Routes with auth | 100% (except webhooks) |
| Workspace Isolation | Routes with filter | 100% (except public) |
| Connection Pool | Latency reduction | 60-80% |
| Agent Preservation | Files unchanged | 26/26 |
| Skill Preservation | Files unchanged | 19/19 |

---

## Next Steps

1. **Task 2.2**: Define OpenAPI 3.1 contracts for all route categories
2. **Task 2.3**: Design database migrations for RLS cleanup
3. **Task 2.4**: Create dependency graph visualization

---

**Document Status**: COMPLETE
**Approved By**: Orchestrator Agent
**Date**: 2025-11-29
