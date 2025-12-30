# Unite-Hub - AI-First Marketing CRM & Automation Platform
## Guide for AI Coding Agents

**Last Updated**: December 30, 2025
**Version**: 1.0.0
**Standard**: Agentic AI Foundation (AGENTS.md spec)

---

## Project Overview

**Purpose**: Multi-tenant CRM with 43 AI agents for marketing automation
**Products**: Unite-Hub (CRM) + Synthex.social (white-label platform)
**Tech Stack**: Next.js 16, React 19, Supabase PostgreSQL, Claude AI, RabbitMQ
**Port**: 3008 (not 3000)

**Architecture**: 3-layer system
```
┌─────────────────────────────────────┐
│ Next.js App Router (React 19)      │  ← Presentation Layer
├─────────────────────────────────────┤
│ 43 AI Agents (Claude-powered)      │  ← Intelligence Layer
│ + Project Vend Phase 2 Enhanced    │
├─────────────────────────────────────┤
│ Supabase PostgreSQL + RabbitMQ     │  ← Data & Messaging Layer
└─────────────────────────────────────┘
```

---

## For AI Coding Agents

### Core Principles

**1. Multi-Tenant Isolation** (MANDATORY)
```typescript
// EVERY database query MUST filter by workspace_id
const { data } = await supabase
  .from('contacts')
  .select('*')
  .eq('workspace_id', workspaceId); // ← REQUIRED
```

**2. Agent Communication**
- **Rule**: Agents are stateless, communicate via RabbitMQ
- **No peer-to-peer**: All coordination through orchestrator
- **State**: Persisted in Supabase tables + memory system

**3. Verification Required**
- **All agent outputs** must pass independent verification
- See: `src/lib/agents/independent-verifier.ts`
- Prevents self-attestation

**4. Budget & Governance**
- **Every agent** has budget limits (daily/monthly)
- **High-risk actions** escalate to approval queue
- See: `src/lib/agents/cost/budgetEnforcer.ts`

---

## Code Style & Standards

### TypeScript
- **Strict mode**: Required
- **Patterns**: Functional, immutable where possible
- **Async**: Use async/await, not callbacks
- **Types**: Explicit return types on functions
- **No any**: Use proper types or unknown

### Testing
- **Framework**: Vitest
- **Coverage**: 100% pass rate required
- **Tests**: Unit + Integration + E2E
- **Location**: `tests/` directory
- **Command**: `npm run test`

### Documentation
- **Update**: `.claude/CLAUDE.md` when changing architecture
- **Agents**: Document in `.claude/agent.md`
- **API**: Update `src/app/api/API-GUIDE.md` for new endpoints
- **Migrations**: Document in migration file comments

---

## Key Patterns

### Multi-Tenant (CRITICAL)

**Database Queries**:
```typescript
// ✅ CORRECT
const workspaceId = req.nextUrl.searchParams.get("workspaceId");
if (!workspaceId) throw new ValidationError("workspaceId required");
await validateUserAndWorkspace(req, workspaceId);

const { data } = await supabase
  .from("table_name")
  .select("*")
  .eq("workspace_id", workspaceId); // MANDATORY

// ❌ WRONG - Missing workspace filter
const { data } = await supabase
  .from("table_name")
  .select("*"); // DANGEROUS - exposes all workspaces
```

### Agent Tasks

**Queue via RabbitMQ**:
```typescript
// Agent task structure
interface AgentTask {
  id: string;
  workspace_id: string;  // MANDATORY
  task_type: string;
  agent_name: string;
  payload: Record<string, any>;
  priority: number; // 0-10
  retry_count: number;
  max_retries: number; // default: 3
}
```

**Execution**:
1. Task queued to RabbitMQ
2. BaseAgent picks up from queue
3. Budget check (budgetEnforcer)
4. Rules validation (rulesEngine)
5. Execute with Claude AI
6. Verify output (independent-verifier)
7. Record metrics (metricsCollector)
8. Update health (healthMonitor)

### API Endpoints

**Pattern** (from `.claude/rules/api-routes.md`):
```typescript
import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) return errorResponse("workspaceId required", 400);

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const { data } = await supabase
    .from("your_table")
    .select("*")
    .eq("workspace_id", workspaceId); // MANDATORY

  return successResponse(data);
});
```

### Database Migrations

**Idempotent** (from `.claude/rules/database-migrations.md`):
```sql
-- Tables
CREATE TABLE IF NOT EXISTS table_name (...);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column);

-- RLS Policies
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name FOR SELECT USING (...);

-- Functions
CREATE OR REPLACE FUNCTION function_name() RETURNS ...
```

---

## Agent Infrastructure

### Base Agent Class

**Location**: `src/lib/agents/base-agent.ts`

**Abstract Methods**:
```typescript
abstract class BaseAgent {
  protected abstract processTask(task: AgentTask): Promise<any>;

  // Provided by base class:
  // - RabbitMQ connection
  // - Supabase client
  // - Metrics recording
  // - Health monitoring
  // - Budget enforcement
  // - Rules validation
  // - Error handling with retries
}
```

### 43 Agents (Categories)

**Core Infrastructure** (7):
- base-agent, orchestrator-router, model-router, agentExecutor, agentPlanner, agentSafety

**Founder Intelligence** (8):
- aiPhillAgent, cognitiveTwinAgent, seoLeakAgent, socialInboxAgent, searchSuiteAgent, boostBumpAgent, preClientIdentityAgent, founderOsAgent

**Marketing & Content** (12):
- email-processor, content-personalization, contact-intelligence, competitor-analyzer, voc-research-agent, etc.

**Verification & Quality** (5):
- independent-verifier, shadow-observer, reflector-agent, evidence-collector, proof-generator

**Authority & Compliance** (2):
- scout-agent, auditor-agent

**Reliability & Cost** (9):
- agent-reliability, orchestrator-self-healing, budgetEnforcer, healthMonitor, metricsCollector, rulesEngine, escalationManager, verifier

**See**: `.claude/agents/registry.json` for complete manifest

---

## Model Selection

**From**: `.claude/rules/ai-agents.md`

| Model | Use Case | Budget | When |
|-------|----------|--------|------|
| `claude-opus-4-5-20251101` | Extended Thinking, complex reasoning | 5000-10000 tokens | Strategic decisions, novel problems |
| `claude-sonnet-4-5-20250929` | Standard operations | Default | Email processing, content generation |
| `claude-haiku-4-5-20251001` | Quick tasks | Minimal | Classification, routing, simple queries |

**Pattern**:
```typescript
import { getAnthropicClient } from '@/lib/anthropic/lazy-client';

const client = getAnthropicClient();
const model = 'claude-sonnet-4-5-20250929'; // or dynamically select

const response = await client.messages.create({
  model,
  max_tokens: 4096,
  messages: [{ role: 'user', content: prompt }]
});
```

---

## Project Structure

### Critical Directories

**Source Code**:
- `src/app/` - Next.js App Router pages & API routes
- `src/lib/` - Business logic, utilities, services
- `src/lib/agents/` - 43 agent implementations
- `src/lib/orchestrator/` - Workflow orchestration
- `src/lib/memory/` - Memory system (hybrid retrieval)
- `src/components/` - React components (shadcn/ui)

**Configuration**:
- `.claude/` - Agent system configuration
- `.claude/rules/` - Architectural patterns (auto-loaded)
- `.claude/commands/` - Agent operation guides
- `.claude/agents/` - Agent JSON configurations
- `.claude/skills/` - Agent skills (progressive disclosure)

**Database**:
- `supabase/migrations/` - SQL migrations (idempotent)
- `docs/guides/schema-reference.md` - Table documentation

**Testing**:
- `tests/` - Vitest test suites
- `tests/agents/` - Agent-specific tests

### Key Files

**Agent System**:
- `src/lib/agents/base-agent.ts` - Base class for all agents
- `src/lib/agents/orchestrator-router.ts` - Intent classification & routing
- `src/lib/orchestrator/orchestratorEngine.ts` - Workflow execution (1175 lines)
- `src/lib/agents/independent-verifier.ts` - Output verification

**Project Vend Phase 2**:
- `src/lib/agents/metrics/metricsCollector.ts` - Execution tracking
- `src/lib/agents/rules/rulesEngine.ts` - Business rules
- `src/lib/agents/escalation/escalationManager.ts` - Approval workflows
- `src/lib/agents/verification/verifier.ts` - Output verification
- `src/lib/agents/cost/budgetEnforcer.ts` - Budget limits

**Documentation**:
- `.claude/CLAUDE.md` - Main project guide (~1.2k tokens)
- `.claude/agent.md` - Canonical agent definitions
- `src/lib/agents/AGENT-GUIDE.md` - Implementation patterns

---

## Common Tasks

### Create New Agent

1. **Create agent file**: `src/lib/agents/my-agent.ts`
2. **Extend BaseAgent**:
   ```typescript
   import { BaseAgent, AgentTask, AgentConfig } from './base-agent';

   export class MyAgent extends BaseAgent {
     constructor() {
       super({
         name: 'MyAgent',
         queueName: 'my-agent-queue',
         concurrency: 1
       });
     }

     protected async processTask(task: AgentTask): Promise<any> {
       // Your logic here
       return { result: 'success' };
     }
   }
   ```
3. **Add to orchestrator**: Update `orchestrator-router.ts` AgentIntent enum
4. **Register**: Add to `.claude/agents/registry.json`
5. **Test**: Create tests in `tests/agents/my-agent.test.ts`

### Create API Endpoint

1. **Create route**: `src/app/api/my-endpoint/route.ts`
2. **Use pattern**:
   ```typescript
   export const GET = withErrorBoundary(async (req: NextRequest) => {
     const workspaceId = req.nextUrl.searchParams.get("workspaceId");
     if (!workspaceId) return errorResponse("workspaceId required", 400);

     await validateUserAndWorkspace(req, workspaceId);
     const supabase = getSupabaseServer();

     const { data } = await supabase
       .from("table")
       .select("*")
       .eq("workspace_id", workspaceId);

     return successResponse(data);
   });
   ```

### Create Database Migration

1. **File**: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. **Idempotent**: Use `IF NOT EXISTS`, `CREATE OR REPLACE`
3. **RLS**: Add Row Level Security policies
4. **Workspace isolation**: Filter by `workspace_id` in policies

---

## Important Constraints

### Security
- **RLS**: All tables have Row Level Security enabled
- **Validation**: Always validate user + workspace before queries
- **Secrets**: Never log API keys or sensitive data
- **Injection**: Use parameterized queries, never string concatenation

### Performance
- **Lazy clients**: Use lazy Anthropic client (60s TTL)
- **Rate limiting**: Use `callAnthropicWithRetry` in API routes
- **Indexes**: Add indexes for filtered/sorted columns
- **N+1**: Avoid N+1 queries (use joins or batch)

### Multi-Tenant
- **workspace_id**: Required on every table (except auth/system)
- **RLS policies**: Use `user_organizations` + `workspaces` join
- **Isolation**: Users can only see their workspace data

---

## Development Workflow

### Running Tests
```bash
npm run test              # All tests
npm run test tests/agents # Agent tests only
npm run typecheck         # TypeScript validation
```

### Starting Dev Server
```bash
npm run dev              # Starts on port 3008
```

### Database
```bash
# Migrations applied via Supabase Dashboard SQL Editor
# See: PHASE2-MIGRATION-GUIDE.md for instructions
```

---

## Agent Memory System

### Memory Storage

**Location**: `src/lib/memory/`

**Types**:
- `lesson` - Learned patterns
- `observation` - Detected signals
- `fact` - Verified information
- `decision` - Architectural choices
- `error` - Failure patterns
- `success` - Working solutions

**Usage**:
```typescript
import { MemoryStore } from '@/lib/memory/memoryStore';

const memory = new MemoryStore();
await memory.store({
  type: 'lesson',
  content: 'Always validate workspace_id before queries',
  tags: ['security', 'multi-tenant'],
  importance: 0.9
});
```

### Memory Retrieval

**Hybrid Ranking**: Recency + Relevance + Importance

```typescript
import { MemoryRetriever } from '@/lib/memory/memoryRetriever';

const retriever = new MemoryRetriever();
const relevant = await retriever.retrieve({
  query: 'How to create new agent',
  limit: 5,
  workspaceId
});
```

---

## Project Vend Phase 2 (Critical)

All agents enhanced with 5 optimization systems:

**1. Metrics & Observability**
- Track: execution time, cost, success rate
- Table: `agent_execution_metrics`
- Real-time dashboard: `/agents`

**2. Business Rules Engine**
- 18 predefined rules prevent naive decisions
- Table: `agent_business_rules`
- Violations logged to `agent_rule_violations`

**3. Verification Layer**
- 7 verification methods catch errors
- Table: `agent_verification_logs`
- Escalates if confidence < 0.7

**4. Smart Escalations**
- Approval workflows for critical decisions
- Table: `agent_escalations`
- Auto-resolution after 24h (non-critical)

**5. Cost Control**
- Daily/monthly/per-execution budgets
- Table: `agent_budgets`
- Auto-pause when exceeded

**Impact**: 99%+ agent reliability, $0.05/email cost, real-time processing

---

## Common Pitfalls (AI Agents: Avoid These)

### ❌ Don't Do This

**1. Missing workspace_id filter**
```typescript
// WRONG - Leaks data across workspaces
await supabase.from('contacts').select('*');
```

**2. Hardcoded values**
```typescript
// WRONG - Not configurable
const BUDGET_LIMIT = 100; // Should be in database
```

**3. Synchronous blocking**
```typescript
// WRONG - Blocks event loop
fs.readFileSync('file.txt'); // Use async version
```

**4. No error handling**
```typescript
// WRONG - Unhandled errors crash agent
const data = await supabase.from('table').select('*');
// Should check data.error
```

**5. Skipping verification**
```typescript
// WRONG - Trust agent output without verification
return agentOutput; // Should verify via independent-verifier
```

### ✅ Do This Instead

**1. Always filter by workspace**
```typescript
const { data, error } = await supabase
  .from('contacts')
  .select('*')
  .eq('workspace_id', workspaceId);

if (error) throw error;
```

**2. Configuration in database**
```typescript
const budget = await budgetEnforcer.getBudget(agentName, workspaceId);
const limit = budget?.daily_budget_usd || DEFAULT_BUDGET;
```

**3. Async everywhere**
```typescript
const content = await fs.promises.readFile('file.txt', 'utf-8');
```

**4. Handle all errors**
```typescript
try {
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
  return data;
} catch (err) {
  console.error('Query failed:', err);
  throw err;
}
```

**5. Always verify**
```typescript
const output = await agent.execute(task);
const verification = await verifier.verify(output);
if (!verification.passed) {
  await escalationManager.escalate('low_confidence', output);
}
```

---

## Quick Reference

### Commands
- `npm run dev` - Start dev server (port 3008)
- `npm run build` - Production build
- `npm run test` - Run all tests
- `npm run typecheck` - TypeScript validation
- `npm run integrity:check` - Founder OS health check

### Documentation Locations
- **Architecture**: `.claude/rules/core-architecture.md`
- **API Patterns**: `.claude/rules/api-routes.md`
- **Agents**: `.claude/rules/ai-agents.md`
- **Database**: `.claude/rules/database-migrations.md`
- **UI**: `.claude/rules/ui-components.md`
- **Testing**: `.claude/rules/testing.md`

### Help
- **Agent creation**: `.claude/commands/new-agent.md`
- **Troubleshooting**: `docs/guides/quick-fix-guide.md`
- **Schema reference**: `docs/guides/schema-reference.md`

---

## Agent Registry

**Location**: `.claude/agents/registry.json`

**All 43 agents** documented with:
- Capabilities
- Tools
- Models
- Governance settings
- Budget limits
- Verification requirements

---

## For AI Coding Agents: TL;DR

1. **Always** filter by `workspace_id`
2. **Always** use `withErrorBoundary` on API routes
3. **Always** validate user + workspace
4. **Always** verify agent outputs
5. **Always** check budgets before execution
6. **Always** handle errors
7. **Always** update docs when changing architecture
8. **Always** write tests (100% pass required)
9. **Never** skip workspace isolation
10. **Never** trust agent output without verification

---

**Standard**: 100% test pass rate, all systems operational, workspace isolation enforced

**Questions**: See `.claude/CLAUDE.md` or ask the orchestrator

---

*This file follows the Agentic AI Foundation AGENTS.md standard for AI coding agent guidance*
