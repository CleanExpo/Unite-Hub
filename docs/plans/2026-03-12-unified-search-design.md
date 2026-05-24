# Unified Search — Design Document

**Date:** 12/03/2026
**Phase:** 5, Priority 5
**Status:** Approved

---

## Goal

Extend the existing `⌘K` CommandBar to search across contacts, pages, and approvals in real time. Search results appear inline alongside static navigation/action commands. No separate search page.

---

## Scope

**In scope:**
- New `GET /api/search?q=<term>` endpoint (3 parallel ILIKE queries)
- CommandBar extended with debounced search + dynamic result groups
- Entities: Contacts, Pages, Approvals

**Out of scope:**
- Vault search (content is AES-256-GCM encrypted — ciphertext not searchable)
- Social channels / connected projects (low value, few records)
- Dedicated search page
- Recent searches / recent items
- Full-text search indexes (PostgreSQL tsvector/GIN) — ILIKE sufficient for single-user scale

---

## Architecture

### API: `GET /api/search?q=<term>`

- Auth check via `getUser()` — 401 if not authenticated
- Validate: `q` must be ≥ 2 chars — 400 if not
- Fire 3 parallel Supabase queries via `Promise.allSettled`:

```
Contacts:  first_name ILIKE '%q%' OR last_name ILIKE '%q%' OR email ILIKE '%q%' OR company ILIKE '%q%'
Pages:     title ILIKE '%q%'
Approvals: title ILIKE '%q%' OR description ILIKE '%q%'
```

- Max 5 results per entity (15 total)
- Partial success: if one query fails, return the other two (allSettled semantics)
- Response shape:

```ts
type SearchContact  = { id: string; name: string; email: string; company: string | null }
type SearchPage     = { id: string; title: string }
type SearchApproval = { id: string; title: string; status: string }
type SearchResults  = { contacts: SearchContact[]; pages: SearchPage[]; approvals: SearchApproval[] }
```

### CommandBar Extension

**New local state** (no Zustand changes):
```ts
const [query, setQuery]     = useState('')
const [results, setResults] = useState<SearchResults | null>(null)
const [loading, setLoading] = useState(false)
```

**Search flow:**
1. User types in `CommandInput` → `onValueChange` → sets `query`
2. `useEffect` on `query`: if `query.length >= 2`, debounce 300ms → `fetch('/api/search?q=...')` → set results
3. If `query.length < 2`: clear results immediately (no debounce)
4. `useEffect` on `commandBarOpen`: when it becomes `false`, reset `query` + `results`

**Rendered structure** (below static groups):
```
[ Navigate group — always visible ]
[ Actions group  — always visible ]
[ Searching…     — while loading  ]
[ Contacts group — when results.contacts.length > 0 ]
[ Pages group    — when results.pages.length > 0    ]
[ Approvals group — when results.approvals.length > 0 ]
[ No results     — when all groups empty and query >= 2 ]
```

**Navigation on result select:**
- Contact → `/founder/contacts` (contacts list, no detail page yet)
- Page → `/founder/pages/<id>` (future route)
- Approval → `/founder/approvals`
- All close CommandBar (`toggleCommandBar()`)

---

## Files

| Action | File |
|--------|------|
| Create | `src/app/api/search/route.ts` |
| Create | `src/app/api/search/__tests__/route.test.ts` |
| Modify | `src/components/layout/CommandBar.tsx` |
| Modify | `src/components/layout/__tests__/CommandBar.test.tsx` |

---

## Testing

### `/api/search/route.test.ts` (5 tests)

1. Returns 401 when unauthenticated
2. Returns 400 when `q` is missing or < 2 chars
3. Returns grouped results when query matches across entities
4. Returns empty arrays when no matches (not an error — 200)
5. Partial success: one entity query throws, other two still return

### `CommandBar.test.tsx` additions (4 tests)

1. Shows "Searching…" while fetch in-flight
2. Renders Contacts/Pages/Approvals result groups when API returns data
3. Navigates to correct path and closes on result select
4. Clears results when query drops below 2 chars

**Mocking strategy:**
- `@/components/ui/command` — pass-through mocks (existing pattern)
- `global.fetch` — `vi.fn()` returning canned `SearchResults`

---

## Design System Compliance

- All new UI uses existing `CommandGroup` / `CommandItem` / `CommandEmpty` primitives
- No new CSS — inherits Scientific Luxury tokens from `command.tsx`
- `rounded-sm` only — enforced by existing cmdk wrapper
- Loading and empty states styled via `CommandEmpty` (existing component)
