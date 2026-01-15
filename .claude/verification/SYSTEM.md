# Verification-First System

**Version**: 2.0.0
**Last Updated**: 2026-01-15
**Status**: Operational
**Principle**: No agent verifies their own work

---

## Core Principle

**CRITICAL RULE**: Agents NEVER verify their own work. All verification must be performed by:
1. Independent verification agent
2. Orchestrator with independent tooling
3. Pre-flight automated checks
4. User acceptance

This prevents confirmation bias and ensures quality.

---

## 4-Tier Verification Hierarchy

### Tier 1: Pre-Flight Checks (Before Execution)

**Purpose**: Validate system state and prerequisites before starting work

**Checks**:
- Environment variables present and valid
- Database connection and RLS helper functions exist
- Agent definitions are valid
- Anthropic API key configured
- Critical files present

**Implementation**: `scripts/pre-flight-checks.mjs`

**When**: Run automatically before:
- RLS migrations
- Production deployments
- Critical agent tasks
- Database schema changes

**Example**:
```bash
# Before RLS migration
npm run preflight:db

# Result
✅ RLS Helper Functions: get_user_workspaces (PASS)
✅ RLS Helper Functions: user_has_role_in_org_simple (PASS)
✅ Database Connection: Successfully connected (PASS)

# Safe to proceed with migration
```

**Exit Codes**:
- `0` - All checks passed, safe to proceed
- `1` - Critical failures, DO NOT proceed
- `2` - Warnings present, review before proceeding

---

### Tier 2: Input Validation (During Execution)

**Purpose**: Validate inputs, parameters, and data before processing

**Checks**:
- Required fields present
- Data types correct
- Values within acceptable ranges
- Foreign keys valid
- Workspace isolation enforced

**Implementation**: TypeScript validation, environment-validator.ts

**When**: At function/API entry points

**Example**:
```typescript
// API route input validation
export async function POST(req: Request) {
  const body = await req.json();

  // Validate workspace_id present
  if (!body.workspace_id) {
    return NextResponse.json(
      { error: 'workspace_id required' },
      { status: 400 }
    );
  }

  // Validate workspace_id is UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(body.workspace_id)) {
    return NextResponse.json(
      { error: 'workspace_id must be valid UUID' },
      { status: 400 }
    );
  }

  // Validate user has access to workspace
  const hasAccess = await verifyWorkspaceAccess(user.id, body.workspace_id);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied to workspace' },
      { status: 403 }
    );
  }

  // Inputs validated, proceed
}
```

**Validation Types**:
- **Type Validation**: String, number, boolean, UUID, email, URL
- **Range Validation**: Min/max values, string length
- **Business Rule Validation**: Workspace access, RLS enforcement
- **Format Validation**: Date formats, currency, phone numbers

---

### Tier 3: Output Verification (After Execution)

**Purpose**: Verify work completed correctly before returning to user

**Checks**:
- Expected outputs present
- Data integrity maintained
- Side effects occurred correctly
- Workspace isolation not violated
- Cost/usage within limits

**Implementation**: Verification functions, test suites

**When**: After agent completes work, before returning result

**Example**:
```typescript
// Agent output verification
async function verifyAgentOutput(
  agent: AgentDefinition,
  task: Task,
  result: AgentResult
): Promise<VerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check expected outputs present
  if (!result.content) {
    errors.push('Agent returned no content');
  }

  // 2. Check workspace isolation
  if (result.data && !result.data.workspace_id) {
    errors.push('Result missing workspace_id (isolation violation)');
  }

  // 3. Check token usage reasonable
  if (result.usage?.totalTokens > 100000) {
    warnings.push(`High token usage: ${result.usage.totalTokens} tokens`);
  }

  // 4. Check cost reasonable
  if (result.estimatedCost > 1.0) {
    warnings.push(`High cost: $${result.estimatedCost.toFixed(2)}`);
  }

  // 5. Check for common errors
  if (result.content.includes('Error:') || result.content.includes('failed')) {
    warnings.push('Result may contain error messages');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    agent: agent.name,
    task: task.description,
  };
}
```

**Verification Checklist**:
- ✅ Output matches expected schema
- ✅ Data relationships preserved
- ✅ No data corruption
- ✅ Workspace isolation maintained
- ✅ Performance metrics acceptable
- ✅ Cost metrics acceptable

---

### Tier 4: Independent Verification (Final Check)

**Purpose**: Independent review by separate agent/tool before delivery

**Who Performs**:
- Verification Agent (separate from work agent)
- Orchestrator with independent tools
- Automated test suite
- User acceptance testing

**Implementation**: Independent verification agent, test automation

**When**: Before final delivery to user

**Example**:
```typescript
// Independent verification by separate agent
async function independentVerify(
  result: IntegratedResult
): Promise<VerifiedResult> {
  console.log('🔍 Independent verification starting...');

  // Route to verification agent (NOT the agent that did the work)
  const verificationAgent = getAgent('verification-agent');

  const verification = await verificationAgent.verify({
    originalTask: result.task,
    workPerformed: result.work,
    outputs: result.outputs,
    claimedSuccess: result.success,
  });

  // Verification agent checks:
  // - Code compiles/runs
  // - Tests pass
  // - No security vulnerabilities
  // - Meets requirements
  // - Documentation updated

  if (!verification.passed) {
    console.log('❌ Independent verification failed:');
    verification.failures.forEach((f) => console.log(`  - ${f}`));

    // DO NOT return unverified work
    throw new Error('Verification failed. Work does not meet quality standards.');
  }

  console.log('✅ Independent verification passed');

  return {
    ...result,
    verified: true,
    verifier: verificationAgent.name,
    verificationTimestamp: new Date().toISOString(),
  };
}
```

**Independent Verification Includes**:
- **Code Review**: Syntax, logic, best practices
- **Testing**: Unit tests pass, integration tests pass
- **Security**: No SQL injection, XSS, auth bypasses
- **Performance**: No N+1 queries, reasonable response times
- **Documentation**: Comments added, README updated
- **Compliance**: Meets requirements, no scope creep

---

## Verification Workflows

### Workflow 1: Simple Feature Implementation

```
1. User: "Add logout button"
   ↓
2. Orchestrator → Frontend Specialist
   ├─→ [Tier 1] Pre-flight checks (environment valid)
   ├─→ [Tier 2] Input validation (task description valid)
   ↓
3. Frontend Specialist implements button
   ├─→ Creates component
   ├─→ Adds to layout
   ├─→ Returns result
   ↓
4. Orchestrator verifies output
   ├─→ [Tier 3] Output verification (component exists, no errors)
   ├─→ [Tier 4] Independent verification (code compiles, renders correctly)
   ↓
5. Return verified result to user
```

### Workflow 2: RLS Migration (High Risk)

```
1. User: "Add RLS policies to contacts table"
   ↓
2. Orchestrator → Pre-Flight Checks (MANDATORY)
   ├─→ [Tier 1] npm run preflight:db
   ├─→ Verify RLS helper functions exist
   ├─→ Verify database connection
   ↓
3. Backend Specialist creates migration
   ├─→ [Tier 2] Input validation (helper functions exist)
   ├─→ Creates migration file with RLS policies
   ├─→ Returns SQL
   ↓
4. Orchestrator verifies migration
   ├─→ [Tier 3] Output verification (SQL syntax valid)
   ├─→ [Tier 4] Independent verification (dry-run on test DB)
   ├─→ Check policies use correct helpers
   ├─→ Check no breaking changes
   ↓
5. Apply migration with monitoring
   ├─→ Backup database
   ├─→ Apply migration
   ├─→ Verify policies active
   ├─→ Test with real queries
   ↓
6. Return verified result to user
```

### Workflow 3: Complex Multi-Agent Task

```
1. User: "Implement user authentication"
   ↓
2. Orchestrator → Pattern 1 (Plan → Parallelize → Integrate)
   ├─→ [Tier 1] Pre-flight checks (all systems operational)
   ↓
3. Parallel execution (3 agents)
   ├─→ Frontend Specialist (login UI)
   │   ├─→ [Tier 2] Input validation
   │   ├─→ Creates login form component
   │   └─→ [Tier 3] Output verification (component renders)
   ├─→ Backend Specialist (auth API)
   │   ├─→ [Tier 2] Input validation
   │   ├─→ Creates /api/auth/login endpoint
   │   └─→ [Tier 3] Output verification (API returns JWT)
   └─→ Backend Specialist (database schema)
       ├─→ [Tier 2] Input validation
       ├─→ Creates users table with RLS
       └─→ [Tier 3] Output verification (table created)
   ↓
4. Orchestrator integrates results
   ├─→ Connects UI to API
   ├─→ Verifies end-to-end flow
   ↓
5. Independent verification (CRITICAL)
   ├─→ [Tier 4] Verification agent tests:
   ├─→ Login with valid credentials → Success
   ├─→ Login with invalid credentials → Fail
   ├─→ Protected route without token → 401
   ├─→ Protected route with valid token → Success
   ├─→ Token expiration → 401 after expiry
   ↓
6. Return verified system to user
```

---

## Verification Evidence Collection

### What to Collect

For every verification tier, collect evidence:

```typescript
interface VerificationEvidence {
  tier: 1 | 2 | 3 | 4;
  timestamp: string;
  verifier: string; // Agent or tool name
  checks: {
    name: string;
    passed: boolean;
    evidence: string; // Log output, test result, etc.
  }[];
  summary: string;
}
```

### Example Evidence

**Tier 1 (Pre-Flight)**:
```json
{
  "tier": 1,
  "timestamp": "2026-01-15T02:30:00Z",
  "verifier": "pre-flight-checks",
  "checks": [
    {
      "name": "Environment Validation",
      "passed": true,
      "evidence": "All 8 required variables present and valid"
    },
    {
      "name": "Database Connection",
      "passed": true,
      "evidence": "Connected to PostgreSQL 15.3"
    }
  ],
  "summary": "All pre-flight checks passed"
}
```

**Tier 4 (Independent Verification)**:
```json
{
  "tier": 4,
  "timestamp": "2026-01-15T02:35:00Z",
  "verifier": "verification-agent",
  "checks": [
    {
      "name": "Code Compilation",
      "passed": true,
      "evidence": "TypeScript compiled with 0 errors"
    },
    {
      "name": "Unit Tests",
      "passed": true,
      "evidence": "12/12 tests passed in 245ms"
    },
    {
      "name": "Integration Tests",
      "passed": true,
      "evidence": "3/3 E2E scenarios passed"
    }
  ],
  "summary": "Independent verification passed. Safe to deploy."
}
```

---

## Failure Handling

### When Verification Fails

1. **DO NOT proceed** with unverified work
2. **Collect evidence** of failure
3. **Provide feedback** to agent for retry
4. **Reduce scope** if necessary
5. **Alert user** if critical

**Example Failure Handling**:
```typescript
async function handleVerificationFailure(
  verification: VerificationResult,
  agent: AgentDefinition,
  task: Task
): Promise<AgentResult> {
  console.log(`❌ Verification failed for ${agent.name}`);
  console.log(`Errors: ${verification.errors.join(', ')}`);

  // Provide feedback for retry
  const feedback = {
    failures: verification.errors,
    suggestions: generateSuggestions(verification.errors),
    reducedScope: reduceTaskScope(task),
  };

  // Retry with feedback (max 2 retries)
  if (task.retryCount < 2) {
    console.log(`🔄 Retry ${task.retryCount + 1}/2 with feedback...`);
    return await agent.execute({
      ...task,
      feedback,
      retryCount: task.retryCount + 1,
    });
  }

  // Max retries exhausted
  console.log(`⚠️ Max retries exhausted. Alerting user.`);
  throw new Error(
    `Agent ${agent.name} failed verification after 2 retries. User intervention required.`
  );
}
```

---

## Verification Metrics

Track verification performance:

| Metric | Description | Target |
|--------|-------------|--------|
| Pre-flight Pass Rate | % of pre-flight checks that pass | >95% |
| Input Validation Catch Rate | % of bad inputs caught | >99% |
| Output Verification Pass Rate | % of agent outputs that pass | >90% |
| Independent Verification Pass Rate | % of integrated work that passes | >95% |
| False Negative Rate | % of bad work that passes verification | <1% |
| False Positive Rate | % of good work rejected | <5% |

---

## Best Practices

### 1. ✅ Always Run Pre-Flight Before Critical Operations

```bash
# Before RLS migration
npm run preflight:db

# Before deployment
npm run preflight

# Before agent task (if critical)
npm run preflight:agents
```

### 2. ✅ Validate Inputs at Entry Points

```typescript
// Every API route
if (!workspaceId || !isValidUUID(workspaceId)) {
  return error400('Invalid workspace_id');
}
```

### 3. ✅ Verify Outputs Before Returning

```typescript
// After agent completes
const verification = await verifyAgentOutput(agent, task, result);
if (!verification.valid) {
  return await handleVerificationFailure(verification, agent, task);
}
```

### 4. ✅ Use Independent Verification for Critical Work

```typescript
// Database migrations, authentication changes, payment processing
const verified = await independentVerify(result);
if (!verified.passed) {
  throw new Error('Independent verification failed');
}
```

### 5. ✅ Collect Verification Evidence

```typescript
// Store evidence for auditing
await saveVerificationEvidence({
  tier: 4,
  verifier: 'verification-agent',
  checks: verification.checks,
  result: verification.passed ? 'PASS' : 'FAIL',
});
```

---

## Integration with Stage 2 Components

### Pre-Flight Checks Integration

```typescript
import { validateEnvironmentOrThrow } from '@/lib/config/environment-validator';

// Before any critical operation
try {
  validateEnvironmentOrThrow();
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}
```

### Agent Registry Integration

```typescript
import { routeTask, getRecommendedAgent } from '@/lib/agents/unified-registry';

// Smart routing with verification
const recommendation = getRecommendedAgent(task.description);
if (recommendation.confidence < 0.5) {
  // Low confidence = manual verification required
  console.log('⚠️ Low confidence. Requesting user confirmation...');
}
```

### Enhanced AI Service Caller Integration

```typescript
import { callAIService } from '@/lib/ai/enhanced-service-caller';

// AI calls with automatic retry = built-in verification
const result = await callAIService({
  model: 'sonnet',
  systemPrompt: prompt,
  userMessage: task,
  options: { maxRetries: 3 }, // Automatic retry on failure
});
```

---

**Verification-First System ensures quality through independent checks at every stage.**
**Version**: 2.0.0 | **Status**: Operational
