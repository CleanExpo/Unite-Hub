# Agent Development Guide

## IMPORTANT: Agent Architecture
All agents MUST follow patterns in `.claude/agent.md` (CANONICAL source).
Reference `.claude/AGENT_REFERENCE.md` for quick lookup.

## Exemplar Files
- `base-agent.ts` - Base class with queue, retry, workspace isolation
- `email-processor.ts` - Email processing with intent extraction
- `content-personalization.ts` - Content generation with Extended Thinking
- `model-router.ts` - Multi-model routing and selection

## Model Selection

| Task Type | Model | Budget | Use Case |
|-----------|-------|--------|----------|
| Complex reasoning | claude-opus-4-5-20251101 | 5000-10000 tokens | Strategic decisions, content generation |
| Standard ops | claude-sonnet-4-5-20250929 | Default | Email processing, classification |
| Quick tasks | claude-haiku-4-5-20251001 | Minimal | Quick classification, routing |

**Trigger extended thinking**: Use "think", "think hard", "think harder", or "ultrathink" in prompts.

## DO: Agent Implementation Pattern

```typescript
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import { createAuditLog } from '@/lib/audit/audit-logger';

interface AgentInput {
  workspaceId: string;
  // ... other fields
}

async function processWithAgent(input: AgentInput): Promise<AgentOutput> {
  // 1. Validate workspace isolation
  if (!input.workspaceId) {
    throw new Error('workspaceId required');
  }

  // 2. Call with retry and rate limiting
  const result = await callAnthropicWithRetry({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: 'Your prompt here' }
    ],
  });

  // 3. Audit log the action
  await createAuditLog({
    workspaceId: input.workspaceId,
    action: 'agent_action',
    details: { result },
  });

  return result;
}
```

## DO: BaseAgent Extension

```typescript
import { BaseAgent, AgentConfig, AgentTask } from './base-agent';

export class MyAgent extends BaseAgent {
  constructor() {
    super({
      name: 'my-agent',
      queueName: 'my-agent-queue',
      concurrency: 2,
      prefetchCount: 4,
      retryDelay: 5000,
    });
  }

  protected async processTask(task: AgentTask): Promise<void> {
    // Your task processing logic
    // workspace_id is available in task.workspace_id
  }
}
```

## DON'T: Anti-patterns

- **Direct API calls**: Using `anthropic.messages.create()` without retry wrapper
- **Missing workspace**: Agents processing without workspace_id validation
- **No audit trail**: Operations without audit logging
- **Wrong model**: Using Opus for simple classification (costly)
- **No rate limiting**: Overwhelming the API without `callAnthropicWithRetry`

## Key Imports

```typescript
// AI with retry
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

// Audit logging
import { createAuditLog } from '@/lib/audit/audit-logger';

// Base class
import { BaseAgent, AgentConfig, AgentTask } from './base-agent';

// Multi-model routing
import { routeToModel } from './model-router';
```

## Search Commands

```bash
rg "callAnthropicWithRetry" src/lib/agents/         # Rate-limited calls
rg "extends BaseAgent" src/lib/agents/              # Agent implementations
rg "workspace_id" src/lib/agents/ --type ts         # Workspace isolation
rg "createAuditLog" src/lib/agents/                 # Audit logging
rg "claude-opus" src/lib/agents/                    # Opus usage (expensive)
```

## Pre-PR Checklist

```bash
npm run test:agents && npm run lint
```

## Agent Registry

See `.claude/AGENT_REFERENCE.md` for complete list:
- Orchestrator, Email Agent, Content Agent
- Contact Intelligence, SEO Agent, AI Phill
- Cognitive Twin, Social Inbox, Search Suite
- Boost Bump, Pre-Client
