---
paths: src/lib/agents/**/*.ts
---

# AI Agents & Services

## Agent Architecture

```
User Request → Orchestrator → Specialist Agents
                    ↓
           ┌────────┼────────┐
           ▼        ▼        ▼
      Email    Content   Frontend
      Agent     Agent     Agent
```

**Communication**: Stateless agents, state in database + `aiMemory` table. Orchestrator coordinates, no peer-to-peer calls.

## Lazy Anthropic Client Pattern

```typescript
let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}
```

## Model Selection

- `claude-opus-4-5-20251101` — Extended Thinking (complex reasoning, 5000-10000 tokens)
- `claude-sonnet-4-5-20250929` — Standard operations (default)
- `claude-haiku-4-5-20251001` — Quick tasks

## Rate Limiting

**In API routes**: Use `import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter'`

## Agent Definitions

**Canonical source**: `.claude/agent.md` — Agent definitions  
**Implementations**: `src/lib/agents/` — Agent code  
**CLI runners**: `scripts/run-*.mjs` — Agent execution  

## Founder Intelligence OS

8 specialized agents:
- **AI Phill** — Strategic advisor with journal entries
- **Cognitive Twin** — Business health monitoring (13 domains)
- **SEO Leak** — Competitive SEO intelligence
- **Social Inbox** — Multi-platform social monitoring
- **Search Suite** — Keyword tracking
- **Boost Bump** — Job queue for background tasks
- **Pre-Client** — Lead clustering and opportunity detection
- **Founder OS** — Business portfolio management

**Tables**: `founder_*`, `ai_phill_*`, `cognitive_twin_*`, `seo_leak_*`  
**Health check**: `npm run integrity:check`
