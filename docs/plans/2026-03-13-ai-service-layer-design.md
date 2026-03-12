# AI Service Layer — Design Document

> Date: 13/03/2026
> Author: Claude Opus 4.6
> Status: Approved
> Linear: UNI-1499–1510 (12 issues)

---

## Summary

Build a shared AI service layer (`src/lib/ai/`) that sits between Next.js API routes and the Anthropic API. Every AI interaction flows through a unified router with a capability registry. Each INTEGRATION feature (adaptive thinking, web search, citations, etc.) plugs in as a feature flag on the capability config — not as a separate route.

## Architecture

```
[Route] → aiRouter.execute(capability, input) → [Service Layer] → [Anthropic API]
                                                       ↑
                                              Feature flags:
                                              - thinking (adaptive)
                                              - citations
                                              - web_search
                                              - structured_output
                                              - batch mode
```

### Capability Registry

Each AI feature declares its config:

```typescript
type ModelId = 'claude-opus-4-6' | 'claude-sonnet-4-6' | 'claude-haiku-3'

interface AICapability {
  id: string
  model: ModelId
  maxTokens: number
  features: {
    thinking?: { budgetTokens: number }
    citations?: boolean
    webSearch?: boolean
    structuredOutput?: ZodSchema
  }
  systemPrompt: string | ((ctx: RequestContext) => string)
}
```

### File Structure

```
src/lib/ai/
  client.ts           ← Anthropic singleton (replaces 4 inline new Anthropic())
  router.ts           ← Capability registry + execute() dispatcher
  capabilities/
    chat.ts           ← Bron chat config
    analyze.ts        ← Strategy analysis config (Opus + thinking)
    debate.ts         ← MACAS firm/judge configs (re-export)
    ideas.ts          ← Idea capture config
  features/
    thinking.ts       ← Adaptive thinking param builder (UNI-1499)
    citations.ts      ← Citation extraction + formatting (UNI-1505)
    web-search.ts     ← Web search tool config (UNI-1503)
    structured.ts     ← Zod → tool_use structured output (UNI-1506)
    batch.ts          ← Batch API queue + polling (UNI-1504)
    files.ts          ← Files API upload + reference (UNI-1501)
    memory.ts         ← Memory tool config (UNI-1502)
    sandbox.ts        ← Code execution tool (UNI-1507)
  cost-tracker.ts     ← Token counting, per-business attribution
  types.ts            ← Shared AI types
```

## Existing Route Refactoring

| Route | Current Pattern | New Pattern |
|-------|----------------|-------------|
| `/api/bron/chat` | Inline `new Anthropic()` + `messages.create()` | `aiRouter.execute('chat', { messages, pageContext })` |
| `/api/strategy/analyze` | Inline client + thinking config | `aiRouter.execute('analyze', { prompt, businessContext })` |
| `/api/ideas/capture` | Inline client + system prompt | `aiRouter.execute('ideas', { messages, rawIdea })` |
| `/api/advisory/...` | `getClient()` singleton in agents.ts | `aiClient` import from `src/lib/ai/client.ts` |

MACAS keeps its own debate engine. Only the Anthropic client singleton is extracted.

## Feature → Issue Mapping

| Issue | Feature Module | What It Does | Capabilities Affected |
|-------|---------------|-------------|----------------------|
| UNI-1499 | `features/thinking.ts` | Adaptive `budget_tokens` based on query complexity | `analyze`, `debate` |
| UNI-1500 | `src/lib/mcp/` | MCP client connecting to veritas-kanban + future servers | Router as tool provider |
| UNI-1501 | `features/files.ts` | Upload docs to Files API, reference in messages | `analyze`, `chat` |
| UNI-1502 | `features/memory.ts` | Cross-session memory via Anthropic memory tool | `chat` |
| UNI-1503 | `features/web-search.ts` | `web_search` + `web_fetch` tool definitions | `chat`, `analyze` |
| UNI-1504 | `features/batch.ts` | Queue requests → Batch API → poll → resolve | `debate` (4 firms) |
| UNI-1505 | `features/citations.ts` | Extract citations from response, format for UI | `analyze`, `chat` |
| UNI-1506 | `features/structured.ts` | Zod schema → forced JSON via tool_use | All capabilities |
| UNI-1507 | `features/sandbox.ts` | Code execution tool for data analysis | `analyze` |
| UNI-1508 | `router.ts` + `client.ts` | The backbone itself | Everything |
| UNI-1509 | `deployment/` | Vercel deploy hooks + health checks | Infrastructure |
| UNI-1510 | `coaches/` | Per-business AI coaches (macro oversight) | New capability type |

## Implementation Phases

### Phase A: Backbone (UNI-1508)
1. `src/lib/ai/client.ts` — Anthropic singleton with env validation
2. `src/lib/ai/types.ts` — Shared types (ModelId, RequestContext, AIResponse, AICapability)
3. `src/lib/ai/router.ts` — Capability registry, execute() dispatcher, error handling
4. `src/lib/ai/capabilities/` — 4 configs (chat, analyze, ideas, debate)
5. Refactor 4 existing routes to use `aiRouter.execute()`
6. Tests: router unit tests + verify existing routes still work

### Phase B: Core Features (UNI-1499, 1503, 1505, 1506)
7. Adaptive thinking (UNI-1499) — dynamic budget based on prompt complexity
8. Web search (UNI-1503) — `web_search` tool definition + response parsing
9. Citations (UNI-1505) — source extraction + UI-ready formatting
10. Structured outputs (UNI-1506) — Zod → tool_use forced JSON pattern

### Phase C: Infrastructure Features (UNI-1500, 1501, 1502, 1504)
11. MCP connector (UNI-1500) — wire veritas-kanban, typed client layer
12. Files API (UNI-1501) — upload, reference in messages, cache management
13. Memory tool (UNI-1502) — cross-session persistence config
14. Batch API (UNI-1504) — queue management, polling, result resolution

### Phase D: Orchestration (UNI-1507, 1509, 1510)
15. Code sandbox (UNI-1507) — execution tool definition + result parsing
16. Deployment pipeline (UNI-1509) — Vercel deploy hooks
17. Macro coaches (UNI-1510) — per-business AI coaches as new capabilities

## Testing Strategy

- **Unit tests** per feature module (Vitest, mock Anthropic client)
- **Integration tests** for `router.execute()` with mock responses
- **Existing route tests** updated after refactor
- **Mock pattern**: `vi.mock('@/lib/ai/client', () => ({ aiClient: mockClient }))`

## Design Decisions

- **Why a capability registry, not a single god-route?** — Keeps routes RESTful and independently deployable while sharing infrastructure.
- **Why feature flags, not separate routes per feature?** — Web search, citations, thinking are orthogonal to the capability being executed. A chat can have citations AND web search. They compose as flags.
- **Why extract the Anthropic singleton?** — 4 routes currently create their own `new Anthropic()`. Centralising enables global cost tracking and connection pooling.
- **Why keep MACAS debate engine separate?** — It has its own complex orchestration (5 rounds, 4 firms, judge). Only the client is shared.
