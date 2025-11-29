# Acceptance Criteria & Test Definitions

**Phase 2 Task 2.5**: Define acceptance criteria and tests for each module BEFORE implementation
**Date**: 2025-11-29
**Status**: APPROVED FOR IMPLEMENTATION

---

## Overview

This document defines the acceptance criteria and test specifications for each phase of the rebuild. Tests MUST pass before proceeding to the next phase.

---

## Phase 3: Foundation Layer

### 3.1 Authentication Module (`src/core/auth/`)

#### Acceptance Criteria

| ID | Criteria | Metric |
|----|----------|--------|
| AC-3.1.1 | All protected routes return 401 without valid token | 100% routes |
| AC-3.1.2 | Valid PKCE tokens authenticate successfully | <100ms latency |
| AC-3.1.3 | Expired tokens are rejected | 0 false positives |
| AC-3.1.4 | Role guards enforce FOUNDER/STAFF/CLIENT/ADMIN | 100% accuracy |
| AC-3.1.5 | Session refresh works before expiry | No user interruption |

#### Test Specifications

```typescript
// tests/core/auth/middleware.test.ts

describe('Authentication Middleware', () => {
  describe('withAuth', () => {
    it('should return 401 when no Authorization header present', async () => {
      const request = new NextRequest('http://localhost/api/test');
      const response = await withAuth(mockHandler)(request);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when token is invalid', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      const response = await withAuth(mockHandler)(request);
      expect(response.status).toBe(401);
    });

    it('should return 401 when token is expired', async () => {
      const expiredToken = generateExpiredToken();
      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: `Bearer ${expiredToken}` }
      });
      const response = await withAuth(mockHandler)(request);
      expect(response.status).toBe(401);
    });

    it('should call handler with user when token is valid', async () => {
      const validToken = await generateValidToken();
      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: `Bearer ${validToken}` }
      });
      const response = await withAuth(mockHandler)(request);
      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({ user: expect.any(Object) })
      );
    });

    it('should complete auth check in under 100ms', async () => {
      const validToken = await generateValidToken();
      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: `Bearer ${validToken}` }
      });
      const start = performance.now();
      await withAuth(mockHandler)(request);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});

// tests/core/auth/guards.test.ts

describe('Role Guards', () => {
  describe('requireRole', () => {
    it('should allow FOUNDER to access staff routes', async () => {
      const founderUser = await createTestUser('FOUNDER');
      const hasAccess = await requireRole(founderUser, ['FOUNDER', 'STAFF', 'ADMIN']);
      expect(hasAccess).toBe(true);
    });

    it('should allow STAFF to access staff routes', async () => {
      const staffUser = await createTestUser('STAFF');
      const hasAccess = await requireRole(staffUser, ['FOUNDER', 'STAFF', 'ADMIN']);
      expect(hasAccess).toBe(true);
    });

    it('should deny CLIENT access to staff routes', async () => {
      const clientUser = await createTestUser('CLIENT');
      const hasAccess = await requireRole(clientUser, ['FOUNDER', 'STAFF', 'ADMIN']);
      expect(hasAccess).toBe(false);
    });

    it('should allow CLIENT to access client routes', async () => {
      const clientUser = await createTestUser('CLIENT');
      const hasAccess = await requireRole(clientUser, ['CLIENT', 'FOUNDER', 'ADMIN']);
      expect(hasAccess).toBe(true);
    });
  });

  describe('requireStaff', () => {
    it('should return true for FOUNDER', async () => {
      const user = await createTestUser('FOUNDER');
      expect(await requireStaff(user)).toBe(true);
    });

    it('should return true for STAFF', async () => {
      const user = await createTestUser('STAFF');
      expect(await requireStaff(user)).toBe(true);
    });

    it('should return true for ADMIN', async () => {
      const user = await createTestUser('ADMIN');
      expect(await requireStaff(user)).toBe(true);
    });

    it('should return false for CLIENT', async () => {
      const user = await createTestUser('CLIENT');
      expect(await requireStaff(user)).toBe(false);
    });
  });
});
```

---

### 3.2 Database Module (`src/core/database/`)

#### Acceptance Criteria

| ID | Criteria | Metric |
|----|----------|--------|
| AC-3.2.1 | Connection pool reuses connections | <50ms avg connect time |
| AC-3.2.2 | Workspace scoping applies to all queries | 100% queries filtered |
| AC-3.2.3 | Cross-workspace access is blocked | 0 data leakage |
| AC-3.2.4 | RLS helpers return correct results | 100% accuracy |
| AC-3.2.5 | Pool handles 500+ concurrent connections | No "too many connections" |

#### Test Specifications

```typescript
// tests/core/database/client.test.ts

describe('Database Client', () => {
  describe('getPooledClient', () => {
    it('should return same client instance on multiple calls', async () => {
      const client1 = await getPooledClient();
      const client2 = await getPooledClient();
      expect(client1).toBe(client2);
    });

    it('should connect in under 50ms on average', async () => {
      const times: number[] = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        await getPooledClient();
        times.push(performance.now() - start);
      }
      const avg = times.reduce((a, b) => a + b) / times.length;
      expect(avg).toBeLessThan(50);
    });

    it('should handle 500 concurrent connection requests', async () => {
      const requests = Array.from({ length: 500 }, () => getPooledClient());
      const results = await Promise.allSettled(requests);
      const failures = results.filter(r => r.status === 'rejected');
      expect(failures.length).toBe(0);
    });
  });
});

// tests/core/database/workspace-scope.test.ts

describe('Workspace Scoping', () => {
  const workspaceA = 'workspace-a-uuid';
  const workspaceB = 'workspace-b-uuid';

  beforeAll(async () => {
    // Seed test data in both workspaces
    await seedTestContacts(workspaceA, 10);
    await seedTestContacts(workspaceB, 5);
  });

  describe('scopeToWorkspace', () => {
    it('should only return records from specified workspace', async () => {
      const scopedDb = withWorkspaceScope(workspaceA);
      const { data } = await scopedDb.from('contacts').select('*');

      expect(data.length).toBe(10);
      expect(data.every(c => c.workspace_id === workspaceA)).toBe(true);
    });

    it('should not return records from other workspaces', async () => {
      const scopedDb = withWorkspaceScope(workspaceA);
      const { data } = await scopedDb.from('contacts').select('*');

      expect(data.every(c => c.workspace_id !== workspaceB)).toBe(true);
    });

    it('should add workspace_id to inserts automatically', async () => {
      const scopedDb = withWorkspaceScope(workspaceA);
      const { data } = await scopedDb.from('contacts').insert({
        email: 'test@example.com',
        full_name: 'Test User'
      }).select().single();

      expect(data.workspace_id).toBe(workspaceA);
    });

    it('should scope updates to workspace', async () => {
      const scopedDb = withWorkspaceScope(workspaceA);
      await scopedDb.from('contacts')
        .update({ status: 'updated' })
        .eq('id', 'some-contact-id');

      // Verify workspace B contacts are unchanged
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('workspace_id', workspaceB);

      expect(data.every(c => c.status !== 'updated')).toBe(true);
    });

    it('should scope deletes to workspace', async () => {
      const scopedDb = withWorkspaceScope(workspaceA);
      await scopedDb.from('contacts')
        .delete()
        .eq('status', 'test');

      // Verify workspace B contacts are not deleted
      const { count } = await supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('workspace_id', workspaceB);

      expect(count).toBe(5);
    });
  });
});
```

---

### 3.3 Security Module (`src/core/security/`)

#### Acceptance Criteria

| ID | Criteria | Metric |
|----|----------|--------|
| AC-3.3.1 | Rate limiter enforces per-route limits | 100% enforcement |
| AC-3.3.2 | Rate limit headers included in responses | All responses |
| AC-3.3.3 | 429 returned when limit exceeded | Consistent |
| AC-3.3.4 | Audit logs capture all API access | 100% coverage |
| AC-3.3.5 | Audit logs include IP, user agent, request ID | All required fields |

#### Test Specifications

```typescript
// tests/core/security/rate-limiter.test.ts

describe('Rate Limiter', () => {
  describe('withRateLimit', () => {
    it('should allow requests under limit', async () => {
      const request = createTestRequest();
      for (let i = 0; i < 99; i++) {
        const response = await withRateLimit(100, '1m')(mockHandler)(request);
        expect(response.status).not.toBe(429);
      }
    });

    it('should return 429 when limit exceeded', async () => {
      const request = createTestRequest();
      for (let i = 0; i < 100; i++) {
        await withRateLimit(100, '1m')(mockHandler)(request);
      }
      const response = await withRateLimit(100, '1m')(mockHandler)(request);
      expect(response.status).toBe(429);
    });

    it('should include rate limit headers', async () => {
      const request = createTestRequest();
      const response = await withRateLimit(100, '1m')(mockHandler)(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should reset limit after window expires', async () => {
      jest.useFakeTimers();
      const request = createTestRequest();

      // Exhaust limit
      for (let i = 0; i < 100; i++) {
        await withRateLimit(100, '1m')(mockHandler)(request);
      }

      // Advance time past window
      jest.advanceTimersByTime(61000);

      // Should allow requests again
      const response = await withRateLimit(100, '1m')(mockHandler)(request);
      expect(response.status).not.toBe(429);

      jest.useRealTimers();
    });
  });
});

// tests/core/security/audit-logger.test.ts

describe('Audit Logger', () => {
  describe('logApiAccess', () => {
    it('should log all required fields', async () => {
      const logId = await logApiAccess({
        workspaceId: 'test-workspace',
        action: 'contacts.read',
        resourceType: 'contact',
        resourceId: 'contact-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Test Agent'
      });

      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('id', logId)
        .single();

      expect(data.workspace_id).toBe('test-workspace');
      expect(data.action).toBe('contacts.read');
      expect(data.resource_type).toBe('contact');
      expect(data.resource_id).toBe('contact-123');
      expect(data.ip_address).toBe('192.168.1.1');
      expect(data.user_agent).toBe('Test Agent');
    });

    it('should log user_id from auth context', async () => {
      // Simulate authenticated request
      const logId = await logApiAccess({
        workspaceId: 'test-workspace',
        action: 'contacts.create',
        resourceType: 'contact',
        resourceId: 'new-contact'
      });

      const { data } = await supabase
        .from('audit_logs')
        .select('user_id')
        .eq('id', logId)
        .single();

      expect(data.user_id).toBeDefined();
    });
  });
});
```

---

## Phase 4: Data Layer

### Migration Acceptance Criteria

| ID | Criteria | Metric |
|----|----------|--------|
| AC-4.1 | All migrations apply without errors | 0 failures |
| AC-4.2 | Connection pooler shows reduced latency | 60-80% reduction |
| AC-4.3 | RLS helper functions exist and work | All 5 functions |
| AC-4.4 | Extended tables have RLS enabled | 15 tables protected |
| AC-4.5 | Synthex tier tables created | 2 tables + function |
| AC-4.6 | Audit logs enhanced | 3 new columns |

#### Verification Queries

```sql
-- AC-4.3: Verify RLS helper functions
SELECT proname FROM pg_proc
WHERE proname IN ('is_workspace_member', 'is_workspace_admin', 'has_role', 'is_staff', 'is_client');
-- Expected: 5 rows

-- AC-4.4: Verify RLS on extended tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN (
  'founder_businesses', 'founder_business_vault_secrets', 'ai_phill_insights',
  'cognitive_twin_scores', 'seo_leak_signal_profiles', 'social_inbox_accounts'
)
AND schemaname = 'public';
-- Expected: All rows have rowsecurity = true

-- AC-4.5: Verify Synthex tables
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('synthex_subscriptions', 'synthex_tier_limits')
AND table_schema = 'public';
-- Expected: 2 rows

-- AC-4.6: Verify audit log enhancement
SELECT column_name FROM information_schema.columns
WHERE table_name = 'audit_logs'
AND column_name IN ('ip_address', 'user_agent', 'request_id');
-- Expected: 3 rows
```

---

## Phase 5: API Layer

### Route Acceptance Criteria

| ID | Criteria | Metric |
|----|----------|--------|
| AC-5.1 | All 655 routes have auth check | 100% coverage |
| AC-5.2 | All data routes have workspace filter | 100% coverage |
| AC-5.3 | Rate limits enforced on all routes | Per category |
| AC-5.4 | Webhook routes verify signatures | 100% verification |
| AC-5.5 | API responses follow OpenAPI spec | 100% compliance |

#### Integration Tests

```typescript
// tests/api/integration/auth-coverage.test.ts

describe('API Authentication Coverage', () => {
  const protectedRoutes = getAllProtectedRoutes();

  it.each(protectedRoutes)('route %s should require authentication', async (route) => {
    const response = await fetch(`http://localhost:3008${route}`, {
      method: getMethodForRoute(route)
    });
    expect(response.status).toBe(401);
  });

  const publicRoutes = ['/api/health', '/api/webhooks/stripe'];

  it.each(publicRoutes)('route %s should be accessible without auth', async (route) => {
    const response = await fetch(`http://localhost:3008${route}`, {
      method: 'GET'
    });
    expect(response.status).not.toBe(401);
  });
});

// tests/api/integration/workspace-isolation.test.ts

describe('Workspace Isolation', () => {
  let userA: TestUser;
  let userB: TestUser;
  let workspaceA: string;
  let workspaceB: string;

  beforeAll(async () => {
    userA = await createTestUser('STAFF', workspaceA);
    userB = await createTestUser('STAFF', workspaceB);
    await seedTestData(workspaceA);
    await seedTestData(workspaceB);
  });

  it('user A should only see workspace A data', async () => {
    const response = await authenticatedFetch(userA, '/api/v1/unite-hub/contacts');
    const data = await response.json();

    expect(data.data.every((c: any) => c.workspace_id === workspaceA)).toBe(true);
  });

  it('user A should not see workspace B data', async () => {
    const response = await authenticatedFetch(userA, '/api/v1/unite-hub/contacts');
    const data = await response.json();

    expect(data.data.every((c: any) => c.workspace_id !== workspaceB)).toBe(true);
  });

  it('user A cannot access workspace B contact by ID', async () => {
    const workspaceBContact = await getFirstContact(workspaceB);
    const response = await authenticatedFetch(
      userA,
      `/api/v1/unite-hub/contacts/${workspaceBContact.id}`
    );

    expect(response.status).toBe(404);
  });
});
```

---

## Phase 7: Agent Verification

### Agent Acceptance Criteria

| ID | Criteria | Metric |
|----|----------|--------|
| AC-7.1 | All 26 agent files compile without errors | 0 TS errors |
| AC-7.2 | Agents use workspace-scoped database | 100% queries |
| AC-7.3 | Agent orchestration works end-to-end | Full pipeline test |
| AC-7.4 | Extended Thinking enabled for complex tasks | Opus 4.5 calls |
| AC-7.5 | All 19 SKILL.md files valid and referenced | 100% coverage |

#### Agent Tests

```typescript
// tests/agents/integration/orchestrator.test.ts

describe('Orchestrator Agent', () => {
  it('should coordinate email pipeline', async () => {
    const result = await executeWorkflow({
      workflow: 'email-pipeline',
      workspaceId: testWorkspaceId,
      targets: [testContactId]
    });

    expect(result.status).toBe('completed');
    expect(result.steps).toContain('email-processor');
    expect(result.steps).toContain('contact-intelligence');
  });

  it('should use workspace-scoped queries', async () => {
    const querySpy = jest.spyOn(database, 'from');

    await executeWorkflow({
      workflow: 'contact-scoring',
      workspaceId: testWorkspaceId,
      targets: [testContactId]
    });

    // Verify all queries include workspace filter
    querySpy.mock.calls.forEach(call => {
      expect(call[0].includes('workspace_id')).toBe(true);
    });
  });

  it('should enable Extended Thinking for content generation', async () => {
    const anthropicSpy = jest.spyOn(anthropic.messages, 'create');

    await executeWorkflow({
      workflow: 'content-generation',
      workspaceId: testWorkspaceId,
      targets: [testContactId]
    });

    expect(anthropicSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-opus-4-5-20251101',
        thinking: expect.objectContaining({ type: 'enabled' })
      })
    );
  });
});

// tests/agents/unit/skill-files.test.ts

describe('SKILL.md Files', () => {
  const skillFiles = getAllSkillFiles();

  it('should have all 19 skill files present', () => {
    expect(skillFiles.length).toBe(19);
  });

  it.each(skillFiles)('skill file %s should have valid structure', (skillFile) => {
    const content = readSkillFile(skillFile);

    expect(content).toContain('## Purpose');
    expect(content).toContain('## Capabilities');
    expect(content).toContain('## Model');
  });
});
```

---

## Phase 9: Security Compliance

### Security Acceptance Criteria

| ID | Criteria | Metric |
|----|----------|--------|
| AC-9.1 | No routes expose unauthenticated data | 0 violations |
| AC-9.2 | No cross-workspace data leakage | 0 violations |
| AC-9.3 | Rate limiting prevents abuse | 100% coverage |
| AC-9.4 | Audit logs capture security events | All events |
| AC-9.5 | Privacy Act compliance verified | Checklist complete |

#### Security Audit Checklist

```markdown
## Authentication Audit
- [ ] All 655 routes checked for auth
- [ ] No disabled auth in production code
- [ ] Token expiry enforced
- [ ] Session refresh working

## Authorization Audit
- [ ] Role-based access enforced
- [ ] Staff routes block clients
- [ ] Client routes check tier
- [ ] Admin routes require ADMIN role

## Data Isolation Audit
- [ ] All queries include workspace_id
- [ ] RLS policies on all tables
- [ ] Cross-workspace access blocked
- [ ] Foreign key integrity maintained

## Rate Limiting Audit
- [ ] Per-route limits configured
- [ ] Headers returned correctly
- [ ] 429 responses on excess

## Privacy Compliance
- [ ] Data minimization implemented
- [ ] Consent tracking in place
- [ ] Data export capability
- [ ] Data deletion capability
- [ ] Retention policies defined
```

---

## Test Execution Commands

```bash
# Run all acceptance tests
npm run test:acceptance

# Run specific phase tests
npm run test:phase3
npm run test:phase4
npm run test:phase5
npm run test:phase7
npm run test:phase9

# Run security audit
npm run security:audit

# Run performance benchmarks
npm run benchmark:all
```

---

**Document Status**: COMPLETE
**Date**: 2025-11-29
