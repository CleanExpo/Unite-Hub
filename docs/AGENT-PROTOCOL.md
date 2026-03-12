# Agent Protocol

> AI agent calling conventions for Unite-Group Nexus.

## Model Selection

| Use Case | Model | Reasoning |
|----------|-------|-----------|
| Daily coach briefs | `claude-haiku-4-20250414` | Cost-efficient for short summaries |
| Advisory debates (MACAS firms) | `claude-sonnet-4-20250514` | Needs analytical depth |
| Advisory judge | `claude-opus-4-20250514` | Impartial scoring requires strongest model |
| General AI features | `claude-sonnet-4-20250514` | Default for interactive features |

## Anthropic API Pattern

All AI calls go through the centralised client at `src/lib/ai/client.ts`:

```typescript
import { getAIClient } from '@/lib/ai/client'

const client = getAIClient()
const response = await client.messages.create({
  model: 'claude-haiku-4-20250414',
  max_tokens: 1500,
  temperature: 0.3,
  system: systemPrompt,
  messages: [{ role: 'user', content: userMessage }],
})
```

## Temperature Guidelines

| Temperature | Use Case |
|------------|----------|
| 0.0–0.2 | Structured data extraction, code generation |
| 0.2–0.4 | Analytical reports, financial summaries |
| 0.4–0.6 | Creative content suggestions, marketing |
| 0.6–0.8 | Brainstorming, varied responses |

## Error Handling

1. **Wrap all AI calls in try/catch** — never let an API error crash the endpoint
2. **Record failures in the database** — status `failed` with `error_message`
3. **Do NOT retry on Zod/JSON parse errors** — the model won't improve on retry
4. **Exponential backoff for rate limits** — 1s → 2s → 4s, max 3 retries
5. **Timeout: 60s for coaches** — configured via `maxDuration` in `vercel.json`

## Token Budget Management

- Set `max_tokens` per use case (see `COACH_CONFIGS` in `types.ts`)
- Track `input_tokens` and `output_tokens` from response.usage
- Store in database for cost monitoring
- Cost tracker at `src/lib/ai/cost-monitor.ts`

## Prompt Engineering Patterns

### System Prompts
- Define the agent's role and expertise
- Specify the output format (Markdown sections)
- Include locale requirements (Australian English, AUD, AEST)
- Keep under 500 tokens

### User Messages
- Structured data presentation (not raw JSON)
- Include date context
- Limit to relevant data — don't dump everything
- Format numbers for readability

### Output Format
- Markdown with emoji headings for visual scanning
- Bullet points for actionable items
- Bold for emphasis on key figures
- Keep total output under 1500 tokens

## Service Client vs Auth Client

| Context | Client | RLS |
|---------|--------|-----|
| Cron jobs (no user session) | `createServiceClient()` | Bypassed |
| API routes (authenticated) | `createClient()` | Enforced |
| Debate engine (server-side) | `createServiceClient()` | Bypassed — `founder_id` set explicitly |

When using the service client, always write `founder_id` explicitly to maintain data isolation.
