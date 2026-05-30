# Founder-Scoping Defence-in-Depth (Phase 0.3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add explicit `.eq('founder_id', user.id)` scoping to the 8 founder-partitioned queries across 7 API routes that currently lean on RLS alone, closing gap G4 from the path-to-100 spec.

**Architecture:** Each route already authenticates (`getUser()` → 401 if null) and already has `user.id` in scope. The fix is per-query: add a `.eq('founder_id', user.id)` filter to every `select`/`update`/`delete` on a founder-partitioned table. For `[id]` mutation routes the founder filter must be part of the WHERE clause (chained `.eq`), so a cross-founder `id` cannot be mutated even if an RLS policy later drifts. No schema changes, no new dependencies — the `founder_id` column already exists on all five tables (`board_meetings`, `team_members`, `ceo_decisions`, `strategy_insights`, `video_assets`).

**Tech Stack:** Next.js 16 App Router (`src/app/api/**/route.ts`), TypeScript, Supabase JS client (server: `@/lib/supabase/server`; service: `@/lib/supabase/service`), Vitest (`vitest run`).

**Test command:** `pnpm vitest run <path>` (single file) — config at `vitest.config.mts`, env `node`, alias `@` → `./src`.

**Founder-scope assertion pattern (established in repo):** `src/app/api/contacts/__tests__/route.test.ts` asserts `expect(mockEq).toHaveBeenCalledWith('founder_id', 'user-123')`. Every test below uses this exact assertion.

**Reusable chainable mock:** Supabase query builders are chainable AND awaitable. Each test file defines this helper once (DRY within a file):

```typescript
// Chainable + thenable Supabase builder mock. Every chain method returns the
// same object; `then` makes `await query` resolve; `single` returns a promise.
function makeChain(result: { data?: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.limit = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.single = vi.fn(() => Promise.resolve(result))
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain as Record<string, ReturnType<typeof vi.fn>> & { then: unknown }
}
```

> **Note on `board_meeting_notes`:** the meetings `[id]` GET also fetches `board_meeting_notes` by `meeting_id`. That table is NOT in the G4 violation list and is gated by the now-founder-scoped parent meeting fetch, so it is intentionally left unchanged here. Step "Task 9" re-runs the route scan; if it flags `board_meeting_notes`, handle it in a follow-up — do not expand this plan's scope.

---

## File Structure

All changes are surgical edits to existing route files plus one new colocated test file per route (the repo convention is `__tests__/route.test.ts` beside the route).

| Route file (modify) | Test file (create) | Tables touched |
|---|---|---|
| `src/app/api/boardroom/meetings/route.ts` | `src/app/api/boardroom/meetings/__tests__/route.test.ts` | `board_meetings` |
| `src/app/api/boardroom/meetings/[id]/route.ts` | `src/app/api/boardroom/meetings/[id]/__tests__/route.test.ts` | `board_meetings` |
| `src/app/api/boardroom/team/route.ts` | `src/app/api/boardroom/team/__tests__/route.test.ts` | `team_members` |
| `src/app/api/boardroom/team/[id]/route.ts` | `src/app/api/boardroom/team/[id]/__tests__/route.test.ts` | `team_members` |
| `src/app/api/boardroom/decisions/[id]/route.ts` | `src/app/api/boardroom/decisions/[id]/__tests__/route.test.ts` | `ceo_decisions` |
| `src/app/api/strategy/insights/route.ts` | `src/app/api/strategy/insights/__tests__/route.test.ts` | `strategy_insights` |
| `src/app/api/strategy/insights/[id]/route.ts` | `src/app/api/strategy/insights/[id]/__tests__/route.test.ts` | `strategy_insights` |
| `src/app/api/video/[id]/status/route.ts` | `src/app/api/video/[id]/status/__tests__/route.test.ts` | `video_assets` |

---

## Task 1: boardroom/meetings GET — scope `board_meetings` list

**Files:**
- Modify: `src/app/api/boardroom/meetings/route.ts`
- Create: `src/app/api/boardroom/meetings/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/boardroom/meetings/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
}))

import { getUser, createClient } from '@/lib/supabase/server'
import { GET } from '../route'

function makeChain(result: { data?: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.limit = vi.fn(() => chain)
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain as Record<string, ReturnType<typeof vi.fn>> & { then: unknown }
}

describe('GET /api/boardroom/meetings', () => {
  let chain: ReturnType<typeof makeChain>
  beforeEach(() => {
    vi.clearAllMocks()
    chain = makeChain({ data: [], error: null })
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never)
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getUser).mockResolvedValue(null)
    const res = await GET(new Request('https://app.test/api/boardroom/meetings'))
    expect(res.status).toBe(401)
  })

  it('scopes the board_meetings query to the founder', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
    const res = await GET(new Request('https://app.test/api/boardroom/meetings'))
    expect(res.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/api/boardroom/meetings/__tests__/route.test.ts`
Expected: the `scopes the board_meetings query to the founder` test FAILS — `chain.eq` was never called with `('founder_id', 'user-123')` (only `status` is conditionally filtered, and no status is passed). The 401 test passes.

- [ ] **Step 3: Write minimal implementation**

In `src/app/api/boardroom/meetings/route.ts`, add the founder filter to the base query (after `.select(...)`, before `.order(...)`):

```typescript
  const supabase = await createClient()
  let query = supabase
    .from('board_meetings')
    .select('id, meeting_date, status, agenda, brief_md, metrics, created_at')
    .eq('founder_id', user.id)
    .order('meeting_date', { ascending: false })
    .limit(limit)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/api/boardroom/meetings/__tests__/route.test.ts`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/boardroom/meetings/route.ts src/app/api/boardroom/meetings/__tests__/route.test.ts
git commit -m "fix(boardroom): founder-scope board_meetings list query [G4]"
```

---

## Task 2: boardroom/meetings/[id] GET + PATCH — scope by founder

**Files:**
- Modify: `src/app/api/boardroom/meetings/[id]/route.ts`
- Create: `src/app/api/boardroom/meetings/[id]/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/boardroom/meetings/[id]/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
}))

import { getUser, createClient } from '@/lib/supabase/server'
import { GET, PATCH } from '../route'

function makeChain(result: { data?: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.single = vi.fn(() => Promise.resolve(result))
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain as Record<string, ReturnType<typeof vi.fn>> & { then: unknown }
}

const ctx = { params: Promise.resolve({ id: 'm1' }) }

describe('GET /api/boardroom/meetings/[id]', () => {
  let chain: ReturnType<typeof makeChain>
  beforeEach(() => {
    vi.clearAllMocks()
    chain = makeChain({ data: { id: 'm1' }, error: null })
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never)
  })

  it('scopes the meeting fetch to the founder', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
    const res = await GET(new Request('https://app.test/x'), ctx)
    expect(res.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })
})

describe('PATCH /api/boardroom/meetings/[id]', () => {
  let chain: ReturnType<typeof makeChain>
  beforeEach(() => {
    vi.clearAllMocks()
    chain = makeChain({ data: { id: 'm1', status: 'reviewed' }, error: null })
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never)
  })

  it('scopes the meeting update to the founder', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
    const req = new Request('https://app.test/x', { method: 'PATCH', body: JSON.stringify({ status: 'reviewed' }) })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run "src/app/api/boardroom/meetings/[id]/__tests__/route.test.ts"`
Expected: both `scopes ...` tests FAIL — `chain.eq` is only called with `('id', 'm1')`.

- [ ] **Step 3: Write minimal implementation**

In `src/app/api/boardroom/meetings/[id]/route.ts`:

GET — add the founder filter to the meeting fetch (first entry of the `Promise.all`):

```typescript
  const [meetingRes, notesRes] = await Promise.all([
    supabase.from('board_meetings').select('*').eq('id', id).eq('founder_id', user.id).single(),
    supabase
      .from('board_meeting_notes')
      .select('*')
      .eq('meeting_id', id)
      .order('created_at', { ascending: true }),
  ])
```

PATCH — add the founder filter to the update WHERE clause:

```typescript
  const { data, error } = await supabase
    .from('board_meetings')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('founder_id', user.id)
    .select()
    .single()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run "src/app/api/boardroom/meetings/[id]/__tests__/route.test.ts"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/boardroom/meetings/[id]/route.ts" "src/app/api/boardroom/meetings/[id]/__tests__/route.test.ts"
git commit -m "fix(boardroom): founder-scope meeting fetch + update by id [G4]"
```

---

## Task 3: boardroom/team GET — scope `team_members` list

**Files:**
- Modify: `src/app/api/boardroom/team/route.ts`
- Create: `src/app/api/boardroom/team/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/boardroom/team/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
}))

import { getUser, createClient } from '@/lib/supabase/server'
import { GET } from '../route'

function makeChain(result: { data?: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain as Record<string, ReturnType<typeof vi.fn>> & { then: unknown }
}

describe('GET /api/boardroom/team', () => {
  let chain: ReturnType<typeof makeChain>
  beforeEach(() => {
    vi.clearAllMocks()
    // Non-empty data so the seed branch is skipped.
    chain = makeChain({ data: [{ id: 't1', active: true }], error: null })
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never)
  })

  it('scopes the team_members query to the founder', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
    const res = await GET()
    expect(res.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/api/boardroom/team/__tests__/route.test.ts`
Expected: FAIL — `chain.eq` only called with `('active', true)`.

- [ ] **Step 3: Write minimal implementation**

In `src/app/api/boardroom/team/route.ts`, GET — add the founder filter:

```typescript
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('founder_id', user.id)
    .eq('active', true)
    .order('created_at', { ascending: true })
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/api/boardroom/team/__tests__/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/boardroom/team/route.ts src/app/api/boardroom/team/__tests__/route.test.ts
git commit -m "fix(boardroom): founder-scope team_members list query [G4]"
```

---

## Task 4: boardroom/team/[id] PATCH + DELETE — scope by founder

**Files:**
- Modify: `src/app/api/boardroom/team/[id]/route.ts`
- Create: `src/app/api/boardroom/team/[id]/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/boardroom/team/[id]/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
}))

import { getUser, createClient } from '@/lib/supabase/server'
import { PATCH, DELETE } from '../route'

function makeChain(result: { data?: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.single = vi.fn(() => Promise.resolve(result))
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain as Record<string, ReturnType<typeof vi.fn>> & { then: unknown }
}

const ctx = { params: Promise.resolve({ id: 't1' }) }

describe('PATCH /api/boardroom/team/[id]', () => {
  let chain: ReturnType<typeof makeChain>
  beforeEach(() => {
    vi.clearAllMocks()
    chain = makeChain({ data: { id: 't1' }, error: null })
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never)
  })

  it('scopes the team_members update to the founder', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
    const req = new Request('https://app.test/x', { method: 'PATCH', body: JSON.stringify({ name: 'New' }) })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })
})

describe('DELETE /api/boardroom/team/[id]', () => {
  let chain: ReturnType<typeof makeChain>
  beforeEach(() => {
    vi.clearAllMocks()
    chain = makeChain({ data: null, error: null })
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never)
  })

  it('scopes the team_members soft-delete to the founder', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
    const res = await DELETE(new Request('https://app.test/x'), ctx)
    expect(res.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run "src/app/api/boardroom/team/[id]/__tests__/route.test.ts"`
Expected: both FAIL — `chain.eq` only called with `('id', 't1')`.

- [ ] **Step 3: Write minimal implementation**

In `src/app/api/boardroom/team/[id]/route.ts`:

PATCH:

```typescript
  const { data, error } = await supabase
    .from('team_members')
    .update(body)
    .eq('id', id)
    .eq('founder_id', user.id)
    .select()
    .single()
```

DELETE:

```typescript
  const { error } = await supabase.from('team_members').update({ active: false }).eq('id', id).eq('founder_id', user.id)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run "src/app/api/boardroom/team/[id]/__tests__/route.test.ts"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/boardroom/team/[id]/route.ts" "src/app/api/boardroom/team/[id]/__tests__/route.test.ts"
git commit -m "fix(boardroom): founder-scope team_members update + delete by id [G4]"
```

---

## Task 5: boardroom/decisions/[id] PATCH + DELETE — scope by founder

**Files:**
- Modify: `src/app/api/boardroom/decisions/[id]/route.ts`
- Create: `src/app/api/boardroom/decisions/[id]/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/boardroom/decisions/[id]/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
}))

import { getUser, createClient } from '@/lib/supabase/server'
import { PATCH, DELETE } from '../route'

function makeChain(result: { data?: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.single = vi.fn(() => Promise.resolve(result))
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain as Record<string, ReturnType<typeof vi.fn>> & { then: unknown }
}

const ctx = { params: Promise.resolve({ id: 'd1' }) }

describe('PATCH /api/boardroom/decisions/[id]', () => {
  let chain: ReturnType<typeof makeChain>
  beforeEach(() => {
    vi.clearAllMocks()
    chain = makeChain({ data: { id: 'd1' }, error: null })
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never)
  })

  it('scopes the ceo_decisions update to the founder', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
    const req = new Request('https://app.test/x', { method: 'PATCH', body: JSON.stringify({ status: 'approved' }) })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })
})

describe('DELETE /api/boardroom/decisions/[id]', () => {
  let chain: ReturnType<typeof makeChain>
  beforeEach(() => {
    vi.clearAllMocks()
    chain = makeChain({ data: null, error: null })
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never)
  })

  it('scopes the ceo_decisions cancel to the founder', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
    const res = await DELETE(new Request('https://app.test/x'), ctx)
    expect(res.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run "src/app/api/boardroom/decisions/[id]/__tests__/route.test.ts"`
Expected: both FAIL — `chain.eq` only called with `('id', 'd1')`.

- [ ] **Step 3: Write minimal implementation**

In `src/app/api/boardroom/decisions/[id]/route.ts`:

PATCH:

```typescript
  const { data, error } = await supabase
    .from('ceo_decisions')
    .update(patch)
    .eq('id', id)
    .eq('founder_id', user.id)
    .select()
    .single()
```

DELETE:

```typescript
  const { error } = await supabase.from('ceo_decisions').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id).eq('founder_id', user.id)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run "src/app/api/boardroom/decisions/[id]/__tests__/route.test.ts"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/boardroom/decisions/[id]/route.ts" "src/app/api/boardroom/decisions/[id]/__tests__/route.test.ts"
git commit -m "fix(boardroom): founder-scope ceo_decisions update + cancel by id [G4]"
```

---

## Task 6: strategy/insights GET — scope `strategy_insights` list

**Files:**
- Modify: `src/app/api/strategy/insights/route.ts`
- Create: `src/app/api/strategy/insights/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/strategy/insights/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
}))

import { getUser, createClient } from '@/lib/supabase/server'
import { GET } from '../route'

function makeChain(result: { data?: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain as Record<string, ReturnType<typeof vi.fn>> & { then: unknown }
}

describe('GET /api/strategy/insights', () => {
  let chain: ReturnType<typeof makeChain>
  beforeEach(() => {
    vi.clearAllMocks()
    chain = makeChain({ data: [], error: null })
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never)
  })

  it('scopes the strategy_insights query to the founder', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
    const res = await GET(new Request('https://app.test/api/strategy/insights'))
    expect(res.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/api/strategy/insights/__tests__/route.test.ts`
Expected: FAIL — with no `business`/`status`/`date` params, `chain.eq` is never called at all.

- [ ] **Step 3: Write minimal implementation**

In `src/app/api/strategy/insights/route.ts`, GET — add the founder filter to the base query:

```typescript
  const supabase = await createClient()
  let query = supabase
    .from('strategy_insights')
    .select('*')
    .eq('founder_id', user.id)
    .order('created_at', { ascending: false })
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/api/strategy/insights/__tests__/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/strategy/insights/route.ts src/app/api/strategy/insights/__tests__/route.test.ts
git commit -m "fix(strategy): founder-scope strategy_insights list query [G4]"
```

---

## Task 7: strategy/insights/[id] PATCH + DELETE — scope by founder

**Files:**
- Modify: `src/app/api/strategy/insights/[id]/route.ts`
- Create: `src/app/api/strategy/insights/[id]/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/strategy/insights/[id]/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
}))

import { getUser, createClient } from '@/lib/supabase/server'
import { PATCH, DELETE } from '../route'

function makeChain(result: { data?: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.single = vi.fn(() => Promise.resolve(result))
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result)
  return chain as Record<string, ReturnType<typeof vi.fn>> & { then: unknown }
}

const ctx = { params: Promise.resolve({ id: 'i1' }) }

describe('PATCH /api/strategy/insights/[id]', () => {
  let chain: ReturnType<typeof makeChain>
  beforeEach(() => {
    vi.clearAllMocks()
    chain = makeChain({ data: { id: 'i1' }, error: null })
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never)
  })

  it('scopes the strategy_insights update to the founder', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
    const req = new Request('https://app.test/x', { method: 'PATCH', body: JSON.stringify({ status: 'done' }) })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })
})

describe('DELETE /api/strategy/insights/[id]', () => {
  let chain: ReturnType<typeof makeChain>
  beforeEach(() => {
    vi.clearAllMocks()
    chain = makeChain({ data: null, error: null })
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never)
  })

  it('scopes the strategy_insights soft-delete to the founder', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
    const res = await DELETE(new Request('https://app.test/x'), ctx)
    expect(res.status).toBe(200)
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run "src/app/api/strategy/insights/[id]/__tests__/route.test.ts"`
Expected: both FAIL — `chain.eq` only called with `('id', 'i1')`.

- [ ] **Step 3: Write minimal implementation**

In `src/app/api/strategy/insights/[id]/route.ts`:

PATCH:

```typescript
  const { data, error } = await supabase
    .from('strategy_insights')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('founder_id', user.id)
    .select()
    .single()
```

DELETE:

```typescript
  const { error } = await supabase
    .from('strategy_insights')
    .update({ status: 'done', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('founder_id', user.id)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run "src/app/api/strategy/insights/[id]/__tests__/route.test.ts"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/strategy/insights/[id]/route.ts" "src/app/api/strategy/insights/[id]/__tests__/route.test.ts"
git commit -m "fix(strategy): founder-scope strategy_insights update + delete by id [G4]"
```

---

## Task 8: video/[id]/status — scope the two `video_assets` UPDATE chains

**Files:**
- Modify: `src/app/api/video/[id]/status/route.ts`
- Create: `src/app/api/video/[id]/status/__tests__/route.test.ts`

> This route uses `createServiceClient` from `@/lib/supabase/service` (NOT the server client) and polls HeyGen via `getVideoStatus` from `@/lib/integrations/heygen`. The fetch is already founder-scoped (`.eq('id', id).eq('founder_id', user.id)`); only the two `.update(...)` chains (completed-path and failed-path) miss the founder filter. The test drives the completed path: a `generating` asset with an `external_job_id`, with HeyGen returning `completed`.

- [ ] **Step 1: Write the failing test**

Create `src/app/api/video/[id]/status/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ getUser: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }))
vi.mock('@/lib/integrations/heygen', () => ({ getVideoStatus: vi.fn() }))

import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getVideoStatus } from '@/lib/integrations/heygen'
import { GET } from '../route'

// Builder where every method returns the builder; `single` resolves with the
// queued result so the fetch then update can return distinct rows.
function makeChain(results: Array<{ data?: unknown; error: unknown }>) {
  const queue = [...results]
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.single = vi.fn(() => Promise.resolve(queue.shift()))
  return chain as Record<string, ReturnType<typeof vi.fn>>
}

const ctx = { params: Promise.resolve({ id: 'v1' }) }

describe('GET /api/video/[id]/status', () => {
  let chain: ReturnType<typeof makeChain>
  beforeEach(() => {
    vi.clearAllMocks()
    chain = makeChain([
      { data: { id: 'v1', status: 'generating', external_job_id: 'job-1' }, error: null }, // fetch
      { data: { id: 'v1', status: 'ready' }, error: null },                                 // update
    ])
    vi.mocked(createServiceClient).mockReturnValue({ from: vi.fn(() => chain) } as never)
    vi.mocked(getVideoStatus).mockResolvedValue({
      status: 'completed', videoUrl: 'u', thumbnailUrl: 't', duration: 12,
    } as never)
  })

  it('scopes the completed-path video_assets update to the founder', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'user-123' } as never)
    const res = await GET(new Request('https://app.test/x'), ctx)
    expect(res.status).toBe(200)
    // Both the fetch and the update must filter on founder_id.
    expect(chain.eq).toHaveBeenCalledWith('founder_id', 'user-123')
    // The update chain calls .update() then .eq('id') then .eq('founder_id').
    const founderCalls = chain.eq.mock.calls.filter((c) => c[0] === 'founder_id')
    expect(founderCalls.length).toBeGreaterThanOrEqual(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run "src/app/api/video/[id]/status/__tests__/route.test.ts"`
Expected: FAIL on `expect(founderCalls.length).toBeGreaterThanOrEqual(2)` — currently only the fetch scopes by `founder_id` (1 call); the update does not.

- [ ] **Step 3: Write minimal implementation**

In `src/app/api/video/[id]/status/route.ts`, add `.eq('founder_id', user.id)` to BOTH update chains (the `completed` branch and the `failed` branch):

Completed branch:

```typescript
        const { data: updated } = await supabase
          .from('video_assets')
          .update({
            status: 'ready',
            video_url: heygenStatus.videoUrl,
            thumbnail_url: heygenStatus.thumbnailUrl,
            duration_seconds: heygenStatus.duration,
          })
          .eq('id', id)
          .eq('founder_id', user.id)
          .select('*')
          .single()
```

Failed branch:

```typescript
        const { data: updated } = await supabase
          .from('video_assets')
          .update({
            status: 'failed',
            error_message: heygenStatus.error ?? 'Video generation failed on HeyGen',
          })
          .eq('id', id)
          .eq('founder_id', user.id)
          .select('*')
          .single()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run "src/app/api/video/[id]/status/__tests__/route.test.ts"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/video/[id]/status/route.ts" "src/app/api/video/[id]/status/__tests__/route.test.ts"
git commit -m "fix(video): founder-scope video_assets status updates [G4]"
```

---

## Task 9: Full verification gate + re-scan

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `pnpm vitest run`
Expected: all tests pass — the prior baseline plus the 13 new scoping tests added here (no regressions).

- [ ] **Step 2: Type-check and lint**

Run: `pnpm run type-check && pnpm run lint`
Expected: both exit 0.

- [ ] **Step 3: Re-scan for any remaining VIOLATION-bucket routes**

Search every route for founder-partitioned table queries still missing a founder filter. Manual grep aid:

Run: `pnpm vitest run` is the gate; for the structural re-scan, inspect each route under `src/app/api/boardroom`, `src/app/api/strategy`, and `src/app/api/video` and confirm every `.from('board_meetings'|'team_members'|'ceo_decisions'|'strategy_insights'|'video_assets')` query chains a `.eq('founder_id', ...)`.
Expected: zero remaining VIOLATION-bucket routes among the 8 files. If `board_meeting_notes` (the one deferred table) surfaces as founder-partitioned, log it as a follow-up — do NOT fix here.

- [ ] **Step 4: Update the spec's G4 + Phase 0.3 status to DONE**

In `docs/superpowers/specs/2026-05-30-unite-hub-path-to-100-design.md`, mark Phase 0.3 acceptance met (route scan returns 0 VIOLATION routes) and note G4 closed. Leave 0.4 (the 46 service-role routes) open.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-05-30-unite-hub-path-to-100-design.md
git commit -m "docs(spec): mark Phase 0.3 / G4 founder-scoping closed [G4]"
```

---

## Out of scope (do NOT do in this plan)

- **G4.4 — the 46 service-role routes.** Separate audit (Phase 0.4 in the spec). Service role bypasses RLS, so it needs the same explicit-founder_id treatment, but it is a distinct, larger body of work, sized and planned separately.
- **`board_meeting_notes` founder-scoping.** Deferred; gated by the now-scoped parent meeting fetch. Only act if Task 9 Step 3 flags it.
- **Phases 1–3** (integrations activation, approvals vertical, polish). Each gets its own plan.
