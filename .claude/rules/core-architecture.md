# Core Architecture Patterns

## Multi-Tenant Isolation (MANDATORY)

**EVERY database query MUST filter by tenant/workspace:**

```typescript
// API Routes - Get from query params
const workspaceId = req.nextUrl.searchParams.get("workspaceId");
if (!workspaceId) throw new ValidationError("workspaceId required");
await validateUserAndWorkspace(req, workspaceId);

// Queries - ALWAYS add workspace filter
const { data } = await supabase
  .from("contacts")
  .select("*")
  .eq("workspace_id", workspaceId);  // ← MANDATORY
```

**Table Prefixes**:
- Unite-Hub core: No prefix (`contacts`, `campaigns`, `emails`)
- Synthex: `synthex_*` (`synthex_fin_accounts`, `synthex_exp_experiments`)
- Founder tools: `founder_*` or specific (`ai_phill_journal`, `cognitive_twin_domains`)

## Supabase Client Selection (Context-Specific)

**NEVER mix contexts** — server clients fail in browser, browser clients lack auth in server components:

| Context | Import | Usage |
|---------|--------|-------|
| **Server Components** | `import { createClient } from "@/lib/supabase/server"` | RSC, layouts |
| **Client Components** | `import { createClient } from "@/lib/supabase/client"` | Hooks, useState |
| **API Routes** | `import { getSupabaseServer } from "@/lib/supabase"` | Route handlers |
| **Admin Ops** | `import { supabaseAdmin } from "@/lib/supabase"` | Bypass RLS |

## Next.js 15+ Route Context (Async Params)

**All dynamic routes receive `params` as a Promise:**

```typescript
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;  // ← MUST await
  // ...
}
```

## Lazy Anthropic Client (AI Services)

**Pattern for services** (60-second TTL singleton):

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

**Model Selection**:
- `claude-opus-4-5-20251101` — Extended Thinking (complex reasoning, budget: 5000-10000 tokens)
- `claude-sonnet-4-5-20250929` — Standard operations (default)
- `claude-haiku-4-5-20251001` — Quick tasks

**In API routes**: Use rate limiter — `import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter'`
