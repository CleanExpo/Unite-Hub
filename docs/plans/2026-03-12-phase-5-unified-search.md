# Unified Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the ⌘K CommandBar to search contacts, pages, and approvals in real time via a new `/api/search` endpoint with PostgreSQL ILIKE queries.

**Architecture:** A new `GET /api/search?q=<term>` route runs 3 parallel Supabase ILIKE queries and returns grouped results. The CommandBar gains local `query`/`results`/`loading` state; when `query.length >= 2`, it switches from cmdk's built-in client-side filtering to API-driven search results. `CommandDialog` in `command.tsx` is extended to accept a `shouldFilter` prop so we can toggle cmdk's internal filtering on/off.

**Tech Stack:** Next.js 15 App Router, Supabase (ILIKE queries), cmdk v1.1.1, Zustand, Vitest + React Testing Library

---

## Context

**Worktree:** `C:\Unite-Group\.claude\worktrees\unified-search`
**Branch:** `feature/phase-5-unified-search`
**Design doc:** `docs/plans/2026-03-12-unified-search-design.md`

**Key existing files to understand before starting:**
- `src/components/ui/command.tsx` — cmdk wrapper; `CommandDialog` needs extending
- `src/components/layout/CommandBar.tsx` — existing 131-line component to extend
- `src/app/api/contacts/route.ts` — follow this pattern for auth + Supabase queries
- `src/components/layout/__tests__/CommandBar.test.tsx` — existing 6 tests to extend

**Auth pattern** (copy from contacts route):
```ts
import { getUser, createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
// in handler:
const user = await getUser()
if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
const supabase = await createClient()
```

**Run tests with:** `pnpm vitest run --exclude '.claude/**'`
**Type-check:** `pnpm run type-check`
**Lint:** `pnpm run lint`

---

## Task 1: Extend CommandDialog to accept shouldFilter prop

**Why:** `CommandDialog` in `command.tsx` wraps `Command` (the cmdk root). When we switch to API search mode, we set `shouldFilter={false}` to stop cmdk auto-filtering our API results. Currently `CommandDialog` only accepts `DialogProps` and doesn't forward `shouldFilter` to the inner `Command`.

**Files:**
- Modify: `src/components/ui/command.tsx` (lines 25–35 — the `CommandDialog` component)

**Step 1: Read the current CommandDialog implementation**

Open `src/components/ui/command.tsx` and find lines 25–35:
```tsx
const CommandDialog = ({ children, ...props }: DialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:px-2 ...">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Replace CommandDialog with the extended version**

Replace the entire `CommandDialog` block (lines 25–35) with:

```tsx
interface CommandDialogProps extends DialogProps {
  shouldFilter?: boolean
}

const CommandDialog = ({ children, shouldFilter, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        <Command
          shouldFilter={shouldFilter}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-white/50 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}
```

The only changes are:
1. New `interface CommandDialogProps extends DialogProps { shouldFilter?: boolean }`
2. Destructure `shouldFilter` out of props before spreading to `Dialog`
3. Pass `shouldFilter={shouldFilter}` to `Command`

**Step 3: Run type-check to verify**

```bash
pnpm run type-check
```

Expected: no errors (Command's `shouldFilter` prop is `boolean | undefined`, matching our optional type).

**Step 4: Run tests to confirm nothing broke**

```bash
pnpm vitest run src/components/layout/__tests__/CommandBar.test.tsx --exclude '.claude/**'
```

Expected: 6 tests pass (the mock already handles `CommandDialog` as a pass-through, so this change is transparent to existing tests).

**Step 5: Commit**

```bash
git add src/components/ui/command.tsx
git commit -m "feat(ui): extend CommandDialog to accept shouldFilter prop"
```

---

## Task 2: Search API endpoint

**Files:**
- Create: `src/app/api/search/route.ts`
- Create: `src/app/api/search/__tests__/route.test.ts`

### Step 1: Write the failing tests

Create `src/app/api/search/__tests__/route.test.ts`:

```typescript
// src/app/api/search/__tests__/route.test.ts
import { NextRequest } from 'next/server'
import { GET } from '../route'

// --- Mocks ---
const mockGetUser = vi.fn()
const mockContactsQuery = { data: null, error: null }
const mockPagesQuery    = { data: null, error: null }
const mockApprovalsQuery = { data: null, error: null }

// Chainable query builder factory
function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    or:     vi.fn().mockReturnThis(),
    ilike:  vi.fn().mockReturnThis(),
    limit:  vi.fn().mockResolvedValue(result),
  }
  return builder
}

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  getUser:      () => mockGetUser(),
  createClient: vi.fn(() =>
    Promise.resolve({ from: mockFrom })
  ),
}))

function makeRequest(q?: string): NextRequest {
  const url = q !== undefined
    ? `http://localhost/api/search?q=${encodeURIComponent(q)}`
    : 'http://localhost/api/search'
  return new NextRequest(url)
}

// --- Tests ---

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ id: 'founder-uuid' })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'contacts')      return makeQueryBuilder(mockContactsQuery)
      if (table === 'nexus_pages')   return makeQueryBuilder(mockPagesQuery)
      if (table === 'approval_queue') return makeQueryBuilder(mockApprovalsQuery)
      return makeQueryBuilder({ data: [], error: null })
    })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue(null)
    const res = await GET(makeRequest('test'))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorised')
  })

  it('returns 400 when q is missing', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/at least 2/)
  })

  it('returns 400 when q is 1 character', async () => {
    const res = await GET(makeRequest('a'))
    expect(res.status).toBe(400)
  })

  it('returns grouped results when query matches', async () => {
    mockContactsQuery.data = [
      { id: 'c1', first_name: 'Alice', last_name: 'Smith', email: 'alice@test.com', company: 'Acme' },
    ] as never
    mockPagesQuery.data = [
      { id: 'p1', title: 'Alice strategy doc' },
    ] as never
    mockApprovalsQuery.data = [
      { id: 'a1', title: 'Alice budget approval', status: 'pending' },
    ] as never

    const res = await GET(makeRequest('alice'))
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.contacts).toHaveLength(1)
    expect(body.contacts[0]).toEqual({ id: 'c1', name: 'Alice Smith', email: 'alice@test.com', company: 'Acme' })

    expect(body.pages).toHaveLength(1)
    expect(body.pages[0]).toEqual({ id: 'p1', title: 'Alice strategy doc' })

    expect(body.approvals).toHaveLength(1)
    expect(body.approvals[0]).toEqual({ id: 'a1', title: 'Alice budget approval', status: 'pending' })
  })

  it('returns empty arrays when no matches (200, not an error)', async () => {
    mockContactsQuery.data = [] as never
    mockPagesQuery.data    = [] as never
    mockApprovalsQuery.data = [] as never

    const res = await GET(makeRequest('zzznomatch'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.contacts).toEqual([])
    expect(body.pages).toEqual([])
    expect(body.approvals).toEqual([])
  })

  it('returns partial results when one entity query rejects', async () => {
    // contacts throws, pages + approvals succeed
    mockFrom.mockImplementation((table: string) => {
      if (table === 'contacts') {
        // Return a builder whose limit() rejects
        return {
          select: vi.fn().mockReturnThis(),
          eq:     vi.fn().mockReturnThis(),
          or:     vi.fn().mockReturnThis(),
          limit:  vi.fn().mockRejectedValue(new Error('DB timeout')),
        }
      }
      if (table === 'nexus_pages') {
        return makeQueryBuilder({ data: [{ id: 'p1', title: 'Found page' }], error: null })
      }
      return makeQueryBuilder({ data: [{ id: 'a1', title: 'Found approval', status: 'pending' }], error: null })
    })

    const res = await GET(makeRequest('found'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.contacts).toEqual([])     // failed → empty fallback
    expect(body.pages).toHaveLength(1)
    expect(body.approvals).toHaveLength(1)
  })
})
```

### Step 2: Run to confirm tests fail

```bash
pnpm vitest run src/app/api/search/__tests__/route.test.ts --exclude '.claude/**'
```

Expected: FAIL — "Cannot find module '../route'"

### Step 3: Create the search API route

Create `src/app/api/search/route.ts`:

```typescript
// src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export type SearchContact = {
  id: string
  name: string
  email: string
  company: string | null
}

export type SearchPage = {
  id: string
  title: string
}

export type SearchApproval = {
  id: string
  title: string
  status: string
}

export type SearchResults = {
  contacts: SearchContact[]
  pages: SearchPage[]
  approvals: SearchApproval[]
}

export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const pattern = `%${q}%`

  const [contactsResult, pagesResult, approvalsResult] = await Promise.allSettled([
    supabase
      .from('contacts')
      .select('id, first_name, last_name, email, company')
      .eq('founder_id', user.id)
      .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},company.ilike.${pattern}`)
      .limit(5),

    supabase
      .from('nexus_pages')
      .select('id, title')
      .eq('founder_id', user.id)
      .ilike('title', pattern)
      .limit(5),

    supabase
      .from('approval_queue')
      .select('id, title, status')
      .eq('founder_id', user.id)
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .limit(5),
  ])

  const contacts: SearchContact[] =
    contactsResult.status === 'fulfilled' && contactsResult.value.data
      ? contactsResult.value.data.map((c) => ({
          id: c.id as string,
          name: [c.first_name, c.last_name].filter(Boolean).join(' '),
          email: (c.email as string) ?? '',
          company: (c.company as string | null) ?? null,
        }))
      : []

  const pages: SearchPage[] =
    pagesResult.status === 'fulfilled' && pagesResult.value.data
      ? pagesResult.value.data.map((p) => ({
          id: p.id as string,
          title: p.title as string,
        }))
      : []

  const approvals: SearchApproval[] =
    approvalsResult.status === 'fulfilled' && approvalsResult.value.data
      ? approvalsResult.value.data.map((a) => ({
          id: a.id as string,
          title: a.title as string,
          status: a.status as string,
        }))
      : []

  return NextResponse.json({ contacts, pages, approvals } satisfies SearchResults)
}
```

### Step 4: Run tests to confirm they pass

```bash
pnpm vitest run src/app/api/search/__tests__/route.test.ts --exclude '.claude/**'
```

Expected: 5 tests pass

### Step 5: Commit

```bash
git add src/app/api/search/route.ts src/app/api/search/__tests__/route.test.ts
git commit -m "feat(api): add /api/search endpoint with ILIKE across contacts, pages, approvals"
```

---

## Task 3: CommandBar search extension

**Files:**
- Modify: `src/components/layout/CommandBar.tsx`
- Modify: `src/components/layout/__tests__/CommandBar.test.tsx`

### Step 1: Add 4 new failing tests to CommandBar.test.tsx

Open `src/components/layout/__tests__/CommandBar.test.tsx`. At the **bottom** of the file, inside the existing `describe('CommandBar', ...)` block, add these 4 tests.

First, add a mock for `global.fetch` at the top of the file (after the existing mocks, before `describe`):

```typescript
// Add after line 43 (after the useUIStore mock):
const mockFetch = vi.fn()
global.fetch = mockFetch

function makeFetchResult(results: { contacts?: unknown[]; pages?: unknown[]; approvals?: unknown[] }) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      contacts: results.contacts ?? [],
      pages:    results.pages    ?? [],
      approvals: results.approvals ?? [],
    }),
  } as Response)
}
```

Then in `beforeEach`, add `mockFetch.mockClear()` to the existing list.

Then add these 4 tests at the bottom of the `describe` block:

```typescript
  it('shows "Searching…" while fetch is in-flight', async () => {
    // Never resolves — keeps loading state active
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<CommandBar />)
    // Type a 2-char query to trigger search mode
    const input = screen.getByTestId('command-input')
    await userEvent.setup().type(input, 'al')
    // loading state shown (after 300ms debounce — use fake timers)
    // Note: test uses a simpler approach: check fetch was called
    expect(mockFetch).not.toHaveBeenCalled() // debounce not elapsed yet
  })

  it('renders search result groups when API returns data', async () => {
    vi.useFakeTimers()
    mockFetch.mockReturnValue(
      makeFetchResult({
        contacts:  [{ id: 'c1', name: 'Alice Smith', email: 'alice@test.com', company: 'Acme' }],
        pages:     [{ id: 'p1', title: 'Alice strategy' }],
        approvals: [{ id: 'a1', title: 'Alice budget', status: 'pending' }],
      })
    )
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<CommandBar />)
    const input = screen.getByTestId('command-input')
    await user.type(input, 'al')
    await vi.advanceTimersByTimeAsync(300) // fire debounce
    await vi.runAllTimersAsync()

    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Alice strategy')).toBeInTheDocument()
    expect(screen.getByText('Alice budget')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('navigates to contacts and closes on contact result select', async () => {
    vi.useFakeTimers()
    mockFetch.mockReturnValue(
      makeFetchResult({
        contacts: [{ id: 'c1', name: 'Bob Jones', email: 'bob@test.com', company: null }],
      })
    )
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<CommandBar />)
    const input = screen.getByTestId('command-input')
    await user.type(input, 'bo')
    await vi.advanceTimersByTimeAsync(300)
    await vi.runAllTimersAsync()

    const contactItem = screen.getByText('Bob Jones').closest('[data-testid="command-item"]')!
    await user.click(contactItem)
    expect(mockPush).toHaveBeenCalledWith('/founder/contacts')
    expect(mockToggleCommandBar).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('does not show search groups when query is fewer than 2 characters', async () => {
    mockFetch.mockReturnValue(makeFetchResult({ contacts: [{ id: 'c1', name: 'Test', email: '', company: null }] }))
    render(<CommandBar />)
    // With query < 2, fetch should NOT be called and nav/action items still visible
    expect(mockFetch).not.toHaveBeenCalled()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Open Bron Chat')).toBeInTheDocument()
  })
```

### Step 2: Run to confirm new tests fail

```bash
pnpm vitest run src/components/layout/__tests__/CommandBar.test.tsx --exclude '.claude/**'
```

Expected: existing 6 pass, 4 new fail (CommandBar doesn't have search yet).

### Step 3: Rewrite CommandBar.tsx with search capability

Replace the entire contents of `src/components/layout/CommandBar.tsx` with:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Lock, ClipboardCheck,
  Scale, Share2, Settings, MessageSquare, Zap,
  User, FileText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command'
import { useUIStore } from '@/store/ui'
import type { SearchResults } from '@/app/api/search/route'

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavCommand {
  type: 'nav'
  label: string
  icon: LucideIcon
  path: string
  shortcut?: string
}

interface ActionCommand {
  type: 'action'
  label: string
  icon: LucideIcon
  action: () => void
  shortcut?: string
}

type Command = NavCommand | ActionCommand

// ─── Static command definitions (module scope — stable references) ────────────

const NAV_COMMANDS: NavCommand[] = [
  { type: 'nav', label: 'Dashboard', icon: LayoutDashboard, path: '/founder/dashboard' },
  { type: 'nav', label: 'Contacts',  icon: Users,           path: '/founder/contacts' },
  { type: 'nav', label: 'Vault',     icon: Lock,            path: '/founder/vault' },
  { type: 'nav', label: 'Approvals', icon: ClipboardCheck,  path: '/founder/approvals' },
  { type: 'nav', label: 'Advisory',  icon: Scale,           path: '/founder/advisory' },
  { type: 'nav', label: 'Social',    icon: Share2,          path: '/founder/social' },
  { type: 'nav', label: 'Settings',  icon: Settings,        path: '/founder/settings' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function CommandBar() {
  const router = useRouter()
  const commandBarOpen   = useUIStore((s) => s.commandBarOpen)
  const toggleCommandBar = useUIStore((s) => s.toggleCommandBar)
  const toggleBron       = useUIStore((s) => s.toggleBron)
  const toggleCapture    = useUIStore((s) => s.toggleCapture)

  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)

  // Reset state when the bar closes
  useEffect(() => {
    if (!commandBarOpen) {
      setQuery('')
      setResults(null)
      setLoading(false)
    }
  }, [commandBarOpen])

  // Debounced search — fires 300ms after the user stops typing (if query >= 2)
  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data: SearchResults = await res.json()
          setResults(data)
        }
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  if (!commandBarOpen) return null

  // Action commands capture hook values — defined inside component
  const ACTION_COMMANDS: ActionCommand[] = [
    { type: 'action', label: 'Open Bron Chat', icon: MessageSquare, action: toggleBron,    shortcut: '⌘⇧B' },
    { type: 'action', label: 'Capture Idea',   icon: Zap,           action: toggleCapture, shortcut: '⌘I'  },
  ]

  function run(cmd: Command) {
    if (cmd.type === 'nav') router.push(cmd.path)
    else cmd.action()
    toggleCommandBar()
  }

  function navigate(path: string) {
    router.push(path)
    toggleCommandBar()
  }

  const isSearchMode = query.length >= 2
  const hasResults   = results && (
    results.contacts.length > 0 ||
    results.pages.length    > 0 ||
    results.approvals.length > 0
  )

  return (
    <CommandDialog
      open={commandBarOpen}
      onOpenChange={toggleCommandBar}
      shouldFilter={!isSearchMode}
    >
      <CommandInput
        placeholder="Search or navigate…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>

        {/* ── Navigation mode (query < 2 chars) ── */}
        {!isSearchMode && (
          <>
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup heading="Navigate">
              {NAV_COMMANDS.map((cmd) => (
                <CommandItem key={cmd.label} value={cmd.label} onSelect={() => run(cmd)}>
                  <cmd.icon size={14} strokeWidth={1.5} style={{ color: 'var(--color-text-disabled)' }} />
                  <span>{cmd.label}</span>
                  {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Actions">
              {ACTION_COMMANDS.map((cmd) => (
                <CommandItem key={cmd.label} value={cmd.label} onSelect={() => run(cmd)}>
                  <cmd.icon size={14} strokeWidth={1.5} style={{ color: 'var(--color-text-disabled)' }} />
                  <span>{cmd.label}</span>
                  {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* ── Search mode (query >= 2 chars) ── */}
        {isSearchMode && loading && (
          <CommandEmpty>Searching…</CommandEmpty>
        )}

        {isSearchMode && !loading && !hasResults && (
          <CommandEmpty>No results for &ldquo;{query}&rdquo;.</CommandEmpty>
        )}

        {isSearchMode && results && results.contacts.length > 0 && (
          <CommandGroup heading="Contacts">
            {results.contacts.map((c) => (
              <CommandItem key={c.id} value={c.id} onSelect={() => navigate('/founder/contacts')}>
                <User size={14} strokeWidth={1.5} style={{ color: 'var(--color-text-disabled)' }} />
                <span>{c.name}</span>
                {c.company && (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{c.company}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {isSearchMode && results && results.pages.length > 0 && (
          <CommandGroup heading="Pages">
            {results.pages.map((p) => (
              <CommandItem key={p.id} value={p.id} onSelect={() => navigate(`/founder/pages/${p.id}`)}>
                <FileText size={14} strokeWidth={1.5} style={{ color: 'var(--color-text-disabled)' }} />
                <span>{p.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {isSearchMode && results && results.approvals.length > 0 && (
          <CommandGroup heading="Approvals">
            {results.approvals.map((a) => (
              <CommandItem key={a.id} value={a.id} onSelect={() => navigate('/founder/approvals')}>
                <ClipboardCheck size={14} strokeWidth={1.5} style={{ color: 'var(--color-text-disabled)' }} />
                <span>{a.title}</span>
                <CommandShortcut style={{ color: 'var(--color-text-muted)' }}>{a.status}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

      </CommandList>
    </CommandDialog>
  )
}
```

### Step 4: Run CommandBar tests

```bash
pnpm vitest run src/components/layout/__tests__/CommandBar.test.tsx --exclude '.claude/**'
```

Expected: 10 tests pass (6 existing + 4 new).

If tests fail, common issues:
- **Timer tests flake**: ensure `vi.useRealTimers()` is in every timer test's cleanup
- **`mockFetch` not called**: check debounce logic — `query.length < 2` test expects NO fetch call (correct)
- **`onValueChange` not wired**: `CommandInput` must receive `value={query}` and `onValueChange={setQuery}`

### Step 5: Commit

```bash
git add src/components/layout/CommandBar.tsx src/components/layout/__tests__/CommandBar.test.tsx
git commit -m "feat(search): extend CommandBar with debounced API search across contacts, pages, approvals"
```

---

## Task 4: Full Verification

**Step 1: Type-check**

```bash
pnpm run type-check
```

Expected: 0 errors. Common issues if it fails:
- `SearchResults` import from `@/app/api/search/route` — ensure the type is exported with `export type`
- `shouldFilter` prop on `CommandDialog` — ensure `CommandDialogProps` extends `DialogProps`

**Step 2: Lint**

```bash
pnpm run lint
```

Expected: 0 errors, 0 warnings. If warnings appear:
- `aria-*` warnings on mock elements in test: add required aria attributes

**Step 3: Full test suite**

```bash
pnpm vitest run --exclude '.claude/**'
```

Expected: all tests pass (previously 1716 + 9 new = 1725 tests).

**Step 4: Fix any failures, commit fixes**

If any tests fail, fix and commit:
```bash
git add -p   # stage only changed files
git commit -m "fix(search): address verification issues"
```

**Step 5: Confirm final state**

```bash
git log --oneline -5
```

Expected output (approximately):
```
<sha> fix(search): address verification issues  (if any)
<sha> feat(search): extend CommandBar with debounced API search across contacts, pages, approvals
<sha> feat(api): add /api/search endpoint with ILIKE across contacts, pages, approvals
<sha> feat(ui): extend CommandDialog to accept shouldFilter prop
<sha> docs: add unified search design document
```
