# Agent Patterns & Guidance Implementation Plan

**Branch**: `feature/agent-patterns-guidance`
**Status**: Planning
**Based on**:
- Ray Fernando's hierarchical AGENTS.md blueprint
- Anthropic's official Claude Code Best Practices (Apr 2025)

---

## Executive Summary

Combine Ray Fernando's hierarchical documentation blueprint with Anthropic's official CLAUDE.md best practices to create a comprehensive agent guidance system for Unite-Hub.

**Core Strategy**: Use Anthropic's official **CLAUDE.md** naming convention with Ray Fernando's "nearest-wins" principle. Claude automatically pulls CLAUDE.md files into context based on proximity.

---

## Key Insights from Anthropic Best Practices

### 1. CLAUDE.md File Locations (Official)
- **Root**: `/CLAUDE.md` - checked into git, shared with team ✅ (we have this)
- **Parent directories**: Pulled automatically when running from child
- **Child directories**: Pulled on-demand when working with files in child dirs
- **Home folder**: `~/.claude/CLAUDE.md` - global settings
- **Local only**: `CLAUDE.local.md` - .gitignore for personal settings

### 2. CLAUDE.md Content (Anthropic Recommended)
- Common bash commands
- Core files and utility functions
- Code style guidelines
- Testing instructions
- Repository etiquette (branch naming, merge vs rebase)
- Developer environment setup
- Unexpected behaviors or warnings
- Keep **concise and human-readable**

### 3. Tuning CLAUDE.md Files
- Treat like prompts - iterate on effectiveness
- Use `#` key to add instructions that Claude incorporates automatically
- Add emphasis ("IMPORTANT", "YOU MUST") for better adherence
- Run through prompt improver occasionally

### 4. Custom Slash Commands
- Store in `.claude/commands/` folder
- Use `$ARGUMENTS` for parameters
- Check into git for team sharing

### 5. Recommended Workflows
- **Explore, plan, code, commit** - use "think" to trigger extended thinking
- **TDD**: Write tests, commit; code, iterate, commit
- **Visual**: Write code, screenshot result, iterate
- **Multi-Claude**: One writes, another verifies

---

## Phase 1: Repository Analysis (Complete)

### Current Structure
```
Unite-Hub/
├── CLAUDE.md                     # Root (exists - 147 lines) ✅
├── .claude/
│   ├── CLAUDE.md                 # Project instructions (exists - massive) ⚠️
│   ├── agent.md                  # Canonical agent definitions ✅
│   ├── AGENT_REFERENCE.md        # Quick lookup ✅
│   ├── agents/                   # 20+ agent definition files
│   ├── commands/                 # Custom slash commands (exists)
│   ├── skills/                   # Skill files
│   └── mcp_servers/              # MCP servers
├── src/
│   ├── app/api/                  # 200+ API routes (needs CLAUDE.md)
│   ├── lib/agents/               # 35+ agents (needs CLAUDE.md)
│   ├── lib/                      # 100+ modules (needs CLAUDE.md)
│   └── components/               # 300+ components (needs CLAUDE.md)
└── supabase/                     # 469+ migrations (needs CLAUDE.md)
```

### Files to Create/Update
| Location | Action | Purpose |
|----------|--------|---------|
| `/CLAUDE.md` | UPDATE | Tune for better instruction following |
| `src/app/api/CLAUDE.md` | CREATE | API route patterns |
| `src/lib/agents/CLAUDE.md` | CREATE | Agent development patterns |
| `src/lib/CLAUDE.md` | CREATE | Core library patterns |
| `src/components/CLAUDE.md` | CREATE | UI component patterns |
| `supabase/CLAUDE.md` | CREATE | Migration/RLS patterns |
| `.claude/commands/` | ADD | New workflow commands |

---

## Phase 2: Root CLAUDE.md Optimization

**Goal**: Tune existing `/CLAUDE.md` for better instruction following per Anthropic guidelines.

### Current Issues
- Too long for quick context loading
- Missing emphasis markers
- Some commands not copy-paste ready

### Proposed Updates

Add to `/CLAUDE.md`:

```markdown
# IMPORTANT RULES (YOU MUST FOLLOW)

## Workspace Isolation
YOU MUST always filter queries by workspaceId. NEVER query without workspace filter.
- API: `req.nextUrl.searchParams.get("workspaceId")`
- React: `const { currentOrganization } = useAuth()`

## Authentication
YOU MUST use correct Supabase client per context:
- Server components: `createClient()` from `@/lib/supabase/server`
- Client components: `createClient()` from `@/lib/supabase/client`
- API routes: `createRouteHandlerClient()`

## AI Model Selection
- Complex reasoning: Use "think" or "think harder" in prompts
- Standard ops: Sonnet 4.5 (default)
- Quick tasks: Haiku 4.5

## Before Any Database Migration
YOU MUST check `.claude/SCHEMA_REFERENCE.md` first.
Run `\i scripts/rls-diagnostics.sql` in Supabase SQL Editor.

## Design System
YOU MUST read `/DESIGN-SYSTEM.md` before generating UI.
NEVER use: `bg-white`, `text-gray-600`, raw shadcn cards.
```

---

## Phase 3: Sub-folder CLAUDE.md Files

### 3.1 API Routes (`src/app/api/CLAUDE.md`)

```markdown
# API Routes Guide

## IMPORTANT: All routes MUST have
1. Auth check (line ~10-15 in exemplars)
2. Workspace filter (line ~20 in exemplars)
3. Error boundary with proper status codes

## Exemplar Files
- `src/app/api/contacts/route.ts` - Contact CRUD
- `src/app/api/campaigns/route.ts` - Campaign management

## DO: Pattern to follow
```typescript
export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });

  // Your query with .eq('workspace_id', workspaceId)
}
```

## DON'T: Anti-patterns
- Missing workspace filter
- Using `createClient()` instead of `createRouteHandlerClient()`
- Returning `Response.json()` instead of `NextResponse.json()`

## Search Commands
rg "createRouteHandlerClient" src/app/api/ -l
rg "workspaceId" src/app/api/ --type ts

## Pre-PR Checklist
npm run lint && npm run build && npm run test:api
```

### 3.2 Agents (`src/lib/agents/CLAUDE.md`)

```markdown
# Agent Development Guide

## IMPORTANT: Agent Architecture
All agents MUST follow patterns in `.claude/agent.md` (CANONICAL source).

## Exemplar Files
- `base-agent.ts` - Base patterns (error handling, retry, audit)
- `email-processor.ts` - Email processing pipeline
- `content-personalization.ts` - Content generation with Extended Thinking

## Model Selection
| Task | Model | Budget |
|------|-------|--------|
| Complex reasoning | claude-opus-4-5 | 5000-10000 tokens |
| Standard ops | claude-sonnet-4-5 | Default |
| Quick classification | claude-haiku-4-5 | Minimal |

## DO: Pattern to follow
```typescript
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

async function processWithAgent(input: AgentInput): Promise<AgentOutput> {
  // 1. Validate workspace isolation
  if (!input.workspaceId) throw new Error('workspaceId required');

  // 2. Call with retry and rate limiting
  const result = await callAnthropicWithRetry({
    model: 'claude-sonnet-4-5-20250929',
    messages: [...],
  });

  // 3. Audit log the action
  await createAuditLog(input.workspaceId, 'agent_action', result);

  return result;
}
```

## DON'T: Anti-patterns
- Direct `anthropic.messages.create()` without retry wrapper
- Missing workspace isolation
- No audit trail

## Search Commands
rg "callAnthropicWithRetry" src/lib/agents/
rg "extends BaseAgent" src/lib/agents/
rg "workspaceId" src/lib/agents/ --type ts
```

### 3.3 Database (`supabase/CLAUDE.md`)

```markdown
# Database & Migrations Guide

## IMPORTANT: Before ANY migration
1. Check `.claude/SCHEMA_REFERENCE.md` for existing tables
2. Run `\i scripts/rls-diagnostics.sql` in Supabase SQL Editor
3. Use IF NOT EXISTS guards

## Exemplar Files
- `469_synthex_business_registry.sql` - Complete SQL Pre-Flight pattern
- `300_founder_tables.sql` - RLS policy patterns

## DO: Migration template
```sql
-- =============================================================================
-- Description: [What this migration does]
-- Prefix: [unique_prefix]_*
-- =============================================================================
-- SQL Pre-Flight Checklist:
-- ✅ Dependencies with IF NOT EXISTS
-- ✅ ENUMs with DO blocks and pg_type checks
-- ✅ Unique prefix to avoid conflicts
-- ✅ RLS with current_setting('app.tenant_id', true)::uuid
-- =============================================================================

-- ENUM with existence check
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'my_enum') THEN
    CREATE TYPE my_enum AS ENUM ('a', 'b', 'c');
  END IF;
END $$;

-- Table with IF NOT EXISTS
CREATE TABLE IF NOT EXISTS my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON my_table
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

## DON'T: Anti-patterns
- CREATE TYPE without pg_type check (will fail on re-run)
- RLS without tenant isolation
- Missing indexes on foreign keys

## Search Commands
rg "CREATE TABLE" supabase/migrations/ | tail -10
rg "CREATE POLICY" supabase/migrations/ -A 2
```

### 3.4 Components (`src/components/CLAUDE.md`)

```markdown
# UI Components Guide

## IMPORTANT: Design System Enforcement
YOU MUST read `/DESIGN-SYSTEM.md` before generating any UI.

## Forbidden Patterns (NEVER use)
- `bg-white` → use `bg-bg-card`
- `text-gray-600` → use `text-text-primary`
- `grid grid-cols-3 gap-4` → use responsive patterns
- Raw shadcn cards without customization

## Exemplar Files
- `src/components/ui/Modal.tsx` - Dialog patterns
- `src/components/ui/Toast.tsx` - Notification patterns
- `src/components/patterns/Card.tsx` - Card patterns

## Design Tokens
- Accent: `accent-500` (#ff6b35 orange)
- Background: `bg-bg-card`, `bg-bg-primary`
- Text: `text-text-primary`, `text-text-secondary`
- Animation: Framer Motion preferred

## DO: Component template
```tsx
import { motion } from 'framer-motion';

export function MyComponent({ children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-bg-card text-text-primary rounded-lg p-4"
    >
      {children}
    </motion.div>
  );
}
```

## Search Commands
rg "bg-bg-card" src/components/ | head -10
rg "motion\." src/components/ | head -10
```

### 3.5 Core Library (`src/lib/CLAUDE.md`)

```markdown
# Core Library Guide

## IMPORTANT: Supabase Client Selection
- Server: `import { createClient } from "@/lib/supabase/server"`
- Client: `import { createClient } from "@/lib/supabase/client"`
- API Routes: `import { createRouteHandlerClient } from "@supabase/ssr"`
- Admin: `import { supabaseAdmin } from "@/lib/supabase"`

NEVER mix contexts. Server clients cannot be used in client components.

## Exemplar Files
- `src/lib/supabase/server.ts` - Server client
- `src/lib/api-helpers.ts` - API utilities
- `src/lib/anthropic/rate-limiter.ts` - AI retry logic

## DO: Error handling pattern
```typescript
import { ApiError, createErrorResponse } from '@/lib/api-helpers';

export async function myFunction() {
  try {
    // Your logic
  } catch (error) {
    if (error instanceof ApiError) {
      return createErrorResponse(error.message, error.status);
    }
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
```

## Search Commands
rg "export function" src/lib/ --type ts | head -20
rg "createClient" src/lib/supabase/
```

---

## Phase 4: Custom Slash Commands

Create new workflow commands in `.claude/commands/`:

### 4.1 `/project:fix-api-route`
```markdown
# File: .claude/commands/fix-api-route.md

Fix the API route issue: $ARGUMENTS

Follow these steps:
1. Read the API route file
2. Check for workspace filtering (workspaceId)
3. Verify auth check is present
4. Ensure proper error handling
5. Run `npm run lint` and fix any errors
6. Run relevant tests
7. Create a commit with descriptive message
```

### 4.2 `/project:new-agent`
```markdown
# File: .claude/commands/new-agent.md

Create a new agent: $ARGUMENTS

Follow these steps:
1. Read `.claude/agent.md` for patterns
2. Read `src/lib/agents/base-agent.ts` for base class
3. Create new agent file in `src/lib/agents/`
4. Implement with workspace isolation, rate limiting, audit logging
5. Add API route in `src/app/api/agents/`
6. Run tests and lint
7. Update `.claude/AGENT_REFERENCE.md`
8. Create commit
```

### 4.3 `/project:migration`
```markdown
# File: .claude/commands/migration.md

Create database migration for: $ARGUMENTS

Follow these steps:
1. Check `.claude/SCHEMA_REFERENCE.md` for existing tables
2. Read `supabase/CLAUDE.md` for patterns
3. Create migration file with next sequence number
4. Include SQL Pre-Flight Checklist header
5. Use IF NOT EXISTS guards
6. Add RLS policies with tenant isolation
7. Output SQL for manual execution in Supabase SQL Editor
```

### 4.4 `/project:tdd`
```markdown
# File: .claude/commands/tdd.md

Implement feature using TDD: $ARGUMENTS

Follow Anthropic's TDD workflow:
1. Write tests based on expected input/output pairs
2. Run tests and confirm they FAIL
3. Commit tests
4. Write code to pass tests (DON'T modify tests)
5. Keep going until all tests pass
6. Verify implementation isn't overfitting to tests
7. Commit code
```

---

## Phase 5: Workflow Documentation

Create `.claude/WORKFLOWS.md` documenting recommended patterns:

```markdown
# Unite-Hub Development Workflows

## Workflow 1: Explore, Plan, Code, Commit
Best for complex features requiring research.

1. "Read the files related to [feature], don't write code yet"
2. "Think hard and create a plan for [feature]"
3. After approval: "Implement the plan"
4. "Commit the changes and create a PR"

## Workflow 2: TDD (Test-Driven Development)
Best for features with clear input/output.

Use `/project:tdd [feature description]`

## Workflow 3: API Route Development
Use `/project:fix-api-route [route path]`

## Workflow 4: Agent Development
Use `/project:new-agent [agent name and purpose]`

## Workflow 5: Database Migration
Use `/project:migration [description]`

## Multi-Claude Pattern
For complex tasks, use separate Claude sessions:
1. Session 1: Write code
2. Session 2: Review code
3. Session 3: Write tests
```

---

## Implementation Checklist

### Files to Create

| File | Lines | Priority |
|------|-------|----------|
| `src/app/api/CLAUDE.md` | ~60 | P0 |
| `src/lib/agents/CLAUDE.md` | ~70 | P0 |
| `supabase/CLAUDE.md` | ~70 | P0 |
| `src/components/CLAUDE.md` | ~50 | P1 |
| `src/lib/CLAUDE.md` | ~50 | P1 |
| `.claude/commands/fix-api-route.md` | ~15 | P1 |
| `.claude/commands/new-agent.md` | ~20 | P1 |
| `.claude/commands/migration.md` | ~15 | P1 |
| `.claude/commands/tdd.md` | ~15 | P1 |
| `.claude/WORKFLOWS.md` | ~60 | P2 |

### Root CLAUDE.md Updates
- [ ] Add "IMPORTANT RULES" section with emphasis markers
- [ ] Add "YOU MUST" instructions for critical patterns
- [ ] Ensure all commands are copy-paste ready

### Quality Gates

Before delivery, verify:
- [ ] All sub-files linked from root
- [ ] Every DO/DON'T backed by actual file references
- [ ] Commands are immediately executable
- [ ] Search patterns match the codebase (test with `rg`)
- [ ] Slash commands work with $ARGUMENTS

---

## Relationship to Existing Files

| Existing File | Status | Relationship |
|---------------|--------|--------------|
| `/CLAUDE.md` | UPDATE | Add emphasis markers, tune for adherence |
| `.claude/CLAUDE.md` | KEEP | Full system overview |
| `.claude/agent.md` | KEEP | Canonical agent definitions |
| `.claude/AGENT_REFERENCE.md` | KEEP | Quick lookup table |
| Sub-folder CLAUDE.md | NEW | Domain-specific JIT guidance |
| `.claude/commands/` | ADD | New workflow commands |

---

## Summary

This plan combines:
1. **Ray Fernando's hierarchy** - Nearest-wins CLAUDE.md files in subdirectories
2. **Anthropic's tuning** - Emphasis markers, copy-paste commands, iteration
3. **Custom slash commands** - Reusable workflows with $ARGUMENTS
4. **Unite-Hub specifics** - Workspace isolation, design system, RLS patterns

The result is a comprehensive agent guidance system that:
- Minimizes token consumption (load only what's needed)
- Improves instruction following (tuned prompts)
- Accelerates development (slash commands)
- Maintains consistency (real file references)
