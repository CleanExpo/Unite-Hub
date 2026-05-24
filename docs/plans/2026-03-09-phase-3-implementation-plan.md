# Phase 3: Core UI Shell — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Nexus 2.0 UI shell with Linear-inspired Scientific Luxury design — sidebar, dashboard, kanban, vault, approvals, and block editor — with static placeholder data only (no Supabase queries).

**Architecture:** `(founder)` route group applies shared sidebar+topbar layout via Zustand. All state is client-side only (Zustand for sidebar/businesses, useState for vault/approvals). Surface elevation via lightness stack — no shadows anywhere.

**Tech Stack:** Next.js 16 App Router, React 19, Zustand 4.5.7, @dnd-kit/core 6.3.1 + @dnd-kit/sortable 10.0.0, Novel 1.0.2, Framer Motion 12.x, Lucide React 0.462.0, Tailwind CSS, Vitest + React Testing Library

**Design Reference:** `docs/plans/2026-03-09-phase-3-core-ui-shell-design.md`

**All deps already installed** — no `pnpm install` needed for any task.

---

### Task 1: Update Design System Tokens

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Read globals.css first**

Read the file, then add the Nexus 2.0 CSS variables. Add into the existing `:root` block, after the current shadcn vars. Also search for `box-shadow` and remove any `.bento-tile` or similar rules that use it — shadows are prohibited in Nexus 2.0.

**Step 2: Add these CSS variables to globals.css**

Inside the `:root` block, append:

```css
/* Nexus 2.0 — Surface Stack */
--surface-canvas:    #050505;
--surface-sidebar:   #0d0d0d;
--surface-card:      #111111;
--surface-elevated:  #161616;
--surface-overlay:   #1f1f1f;
--surface-selected:  #2a2a2a;

/* Colour Tokens */
--color-accent:         #00F5FF;
--color-accent-dim:     rgba(0, 245, 255, 0.08);
--color-accent-border:  rgba(0, 245, 255, 0.3);
--color-text-primary:   #f0f0f0;
--color-text-secondary: #999999;
--color-text-muted:     #555555;
--color-text-disabled:  #333333;
--color-border:         rgba(255, 255, 255, 0.06);
--color-border-strong:  rgba(255, 255, 255, 0.12);
--color-success:        #22c55e;
--color-danger:         #ef4444;
--color-warning:        #f97316;

/* Business Dot Colours */
--biz-dr:      #ef4444;
--biz-nrpg:    #f97316;
--biz-carsi:   #eab308;
--biz-restore: #22c55e;
--biz-synthex: #a855f7;
--biz-ato:     #3b82f6;
--biz-ccw:     #06b6d4;
```

**Step 3: Add global rules** (after the existing `@layer base` block):

```css
/* Focus ring — keyboard nav only */
:focus-visible {
  outline: 2px solid #00F5FF;
  outline-offset: 2px;
}

/* Thin scrollbars */
* {
  scrollbar-width: thin;
  scrollbar-color: #333 transparent;
}
*::-webkit-scrollbar { width: 2px; height: 2px; }
*::-webkit-scrollbar-thumb { background: #333; }
*::-webkit-scrollbar-track { background: transparent; }
```

**Step 4: Verify build**

Run: `pnpm turbo run type-check`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(design): add Nexus 2.0 surface stack, colour tokens, and scrollbar styles"
```

---

### Task 2: Business Config

**Files:**
- Create: `src/lib/businesses.ts`
- Create: `src/lib/__tests__/businesses.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/__tests__/businesses.test.ts
import { BUSINESSES } from '../businesses'

describe('BUSINESSES', () => {
  it('has 7 entries', () => {
    expect(BUSINESSES).toHaveLength(7)
  })

  it('each entry has key, name, color, status', () => {
    for (const biz of BUSINESSES) {
      expect(biz).toMatchObject({
        key: expect.any(String),
        name: expect.any(String),
        color: expect.stringMatching(/^#[0-9a-f]{6}$/i),
        status: expect.stringMatching(/^(active|planning)$/),
      })
    }
  })

  it('ATO has planning status', () => {
    const ato = BUSINESSES.find(b => b.key === 'ato')
    expect(ato?.status).toBe('planning')
  })

  it('all other businesses are active', () => {
    const others = BUSINESSES.filter(b => b.key !== 'ato')
    expect(others.every(b => b.status === 'active')).toBe(true)
  })
})
```

**Step 2: Run to verify fail**

Run: `pnpm vitest run src/lib/__tests__/businesses.test.ts`
Expected: FAIL — `Cannot find module '../businesses'`

**Step 3: Create businesses.ts**

```typescript
// src/lib/businesses.ts
export const BUSINESSES = [
  { key: 'dr',      name: 'Disaster Recovery',  color: '#ef4444', status: 'active'   },
  { key: 'nrpg',   name: 'NRPG',               color: '#f97316', status: 'active'   },
  { key: 'carsi',  name: 'CARSI',              color: '#eab308', status: 'active'   },
  { key: 'restore', name: 'RestoreAssist',      color: '#22c55e', status: 'active'   },
  { key: 'synthex', name: 'Synthex',            color: '#a855f7', status: 'active'   },
  { key: 'ato',    name: 'ATO Tax Optimizer',   color: '#3b82f6', status: 'planning' },
  { key: 'ccw',    name: 'CCW-ERP/CRM',         color: '#06b6d4', status: 'active'   },
] as const

export type BusinessKey = typeof BUSINESSES[number]['key']
export type Business = typeof BUSINESSES[number]
```

**Step 4: Run to verify pass**

Run: `pnpm vitest run src/lib/__tests__/businesses.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/lib/businesses.ts src/lib/__tests__/businesses.test.ts
git commit -m "feat(config): add BUSINESSES constant with 7 businesses and types"
```

---

### Task 3: Zustand UI Store

**Files:**
- Create: `src/store/ui.ts`
- Create: `src/store/__tests__/ui.test.ts`

**Step 1: Write the failing test**

```typescript
// src/store/__tests__/ui.test.ts
import { act, renderHook } from '@testing-library/react'
import { useUIStore } from '../ui'

beforeEach(() => {
  useUIStore.setState({ sidebarOpen: true, expandedBusinesses: [] })
})

describe('useUIStore', () => {
  it('initialises with sidebar open', () => {
    const { result } = renderHook(() => useUIStore())
    expect(result.current.sidebarOpen).toBe(true)
  })

  it('toggleSidebar flips sidebarOpen', () => {
    const { result } = renderHook(() => useUIStore())
    act(() => result.current.toggleSidebar())
    expect(result.current.sidebarOpen).toBe(false)
    act(() => result.current.toggleSidebar())
    expect(result.current.sidebarOpen).toBe(true)
  })

  it('toggleBusiness adds key when not expanded', () => {
    const { result } = renderHook(() => useUIStore())
    act(() => result.current.toggleBusiness('dr'))
    expect(result.current.expandedBusinesses).toContain('dr')
  })

  it('toggleBusiness removes key when already expanded', () => {
    useUIStore.setState({ sidebarOpen: true, expandedBusinesses: ['dr'] })
    const { result } = renderHook(() => useUIStore())
    act(() => result.current.toggleBusiness('dr'))
    expect(result.current.expandedBusinesses).not.toContain('dr')
  })
})
```

**Step 2: Run to verify fail**

Run: `pnpm vitest run src/store/__tests__/ui.test.ts`
Expected: FAIL — `Cannot find module '../ui'`

**Step 3: Create src/store/ui.ts**

```typescript
// src/store/ui.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  sidebarOpen: boolean
  expandedBusinesses: string[]
  toggleSidebar: () => void
  toggleBusiness: (key: string) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      expandedBusinesses: [],
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleBusiness: (key) =>
        set((s) => ({
          expandedBusinesses: s.expandedBusinesses.includes(key)
            ? s.expandedBusinesses.filter((k) => k !== key)
            : [...s.expandedBusinesses, key],
        })),
    }),
    { name: 'nexus-ui' }
  )
)
```

**Step 4: Run to verify pass**

Run: `pnpm vitest run src/store/__tests__/ui.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/store/ui.ts src/store/__tests__/ui.test.ts
git commit -m "feat(store): add Zustand UI store with sidebar and business toggle state"
```

---

### Task 4: (founder) Route Group Layout

**Files:**
- Create: `src/app/(founder)/layout.tsx`

**Step 1: Create the layout file**

```tsx
// src/app/(founder)/layout.tsx
'use client'

import { useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { useUIStore } from '@/store/ui'

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleSidebar])

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--surface-canvas)' }}
    >
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
```

**Step 2: Note on type errors**

At this point `pnpm turbo run type-check` will error on missing Sidebar/Topbar imports. That is expected — proceed to Task 5.

**Step 3: Commit**

```bash
git add "src/app/(founder)/layout.tsx"
git commit -m "feat(layout): add (founder) route group with Cmd+\\ toggle and mobile backdrop"
```

---

### Task 5: Sidebar Components

**Files:**
- Create: `src/components/layout/SidebarNav.tsx`
- Create: `src/components/layout/SidebarBusinessItem.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/__tests__/Sidebar.test.tsx`

**Step 1: Write the failing tests**

```tsx
// src/components/layout/__tests__/Sidebar.test.tsx
import { render, screen } from '@testing-library/react'
import { Sidebar } from '../Sidebar'

vi.mock('@/store/ui', () => ({
  useUIStore: vi.fn((selector?: (s: any) => any) => {
    const state = {
      sidebarOpen: true,
      expandedBusinesses: [],
      toggleSidebar: vi.fn(),
      toggleBusiness: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/founder/dashboard',
}))

describe('Sidebar', () => {
  it('renders NEXUS wordmark', () => {
    render(<Sidebar />)
    expect(screen.getByText('NEXUS')).toBeInTheDocument()
  })

  it('renders all global nav items', () => {
    render(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Kanban')).toBeInTheDocument()
    expect(screen.getByText('Vault')).toBeInTheDocument()
    expect(screen.getByText('Approvals')).toBeInTheDocument()
  })

  it('renders MY BUSINESSES section label', () => {
    render(<Sidebar />)
    expect(screen.getByText(/my businesses/i)).toBeInTheDocument()
  })

  it('renders all 7 business names', () => {
    render(<Sidebar />)
    expect(screen.getByText('Disaster Recovery')).toBeInTheDocument()
    expect(screen.getByText('Synthex')).toBeInTheDocument()
    expect(screen.getByText('ATO Tax Optimizer')).toBeInTheDocument()
  })
})
```

**Step 2: Run to verify fail**

Run: `pnpm vitest run src/components/layout/__tests__/Sidebar.test.tsx`
Expected: FAIL — `Cannot find module '../Sidebar'`

**Step 3: Create SidebarNav.tsx**

```tsx
// src/components/layout/SidebarNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Columns2, Lock, ClipboardCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/founder/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/founder/kanban',    label: 'Kanban',     icon: Columns2 },
  { href: '/founder/vault',     label: 'Vault',      icon: Lock },
  { href: '/founder/approvals', label: 'Approvals',  icon: ClipboardCheck },
] as const

interface SidebarNavProps { collapsed: boolean }

export function SidebarNav({ collapsed }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative flex items-center gap-2 px-2 h-8 rounded-sm text-[13px] font-medium transition-colors duration-100',
              active
                ? 'text-[#f0f0f0] bg-[#161616] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:bg-[#00F5FF] before:rounded-r-sm'
                : 'text-[#888] hover:bg-[#111] hover:text-[#ccc]'
            )}
          >
            <Icon size={16} strokeWidth={1.75} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
```

**Step 4: Create SidebarBusinessItem.tsx**

```tsx
// src/components/layout/SidebarBusinessItem.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { type Business } from '@/lib/businesses'
import { useUIStore } from '@/store/ui'

interface SidebarBusinessItemProps {
  business: Business
  collapsed: boolean
}

export function SidebarBusinessItem({ business, collapsed }: SidebarBusinessItemProps) {
  const pathname = usePathname()
  const expandedBusinesses = useUIStore((s) => s.expandedBusinesses)
  const toggleBusiness = useUIStore((s) => s.toggleBusiness)
  const isExpanded = expandedBusinesses.includes(business.key)
  const isActive = pathname.startsWith(`/founder/${business.key}`)

  return (
    <div>
      <button
        onClick={() => toggleBusiness(business.key)}
        className={cn(
          'w-full flex items-center gap-2 px-2 h-8 rounded-sm text-[13px] font-medium transition-colors duration-100',
          isActive
            ? 'text-[#f0f0f0] bg-[#161616]'
            : 'text-[#777] hover:bg-[#111] hover:text-[#bbb]'
        )}
      >
        <span
          className="shrink-0 rounded-full"
          style={{ width: 6, height: 6, background: business.color }}
        />
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{business.name}</span>
            {business.status === 'planning' && (
              <span className="text-[10px] font-medium tracking-widest text-[#555] uppercase">
                plan
              </span>
            )}
            <ChevronRight
              size={12}
              strokeWidth={2}
              className={cn(
                'shrink-0 text-[#555] transition-transform duration-150',
                isExpanded && 'rotate-90'
              )}
            />
          </>
        )}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pl-6 py-0.5 flex flex-col gap-0.5">
              <Link
                href={`/founder/${business.key}/page/new`}
                className="flex items-center gap-2 px-2 h-7 rounded-sm text-[12px] text-[#666] hover:text-[#aaa] hover:bg-[#111] transition-colors duration-100"
              >
                <FileText size={12} strokeWidth={1.75} />
                <span>New Page</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

**Step 5: Create Sidebar.tsx**

```tsx
// src/components/layout/Sidebar.tsx
'use client'

import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useUIStore } from '@/store/ui'
import { BUSINESSES } from '@/lib/businesses'
import { SidebarNav } from './SidebarNav'
import { SidebarBusinessItem } from './SidebarBusinessItem'

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 240 : 48 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative shrink-0 flex flex-col overflow-hidden border-r fixed md:relative inset-y-0 left-0 z-50 md:z-auto"
      style={{
        background: 'var(--surface-sidebar)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Workspace header */}
      <div
        className="flex items-center h-11 px-3 shrink-0 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span className="text-[15px] font-semibold select-none" style={{ color: '#00F5FF' }}>
          ◈
        </span>
        {sidebarOpen && (
          <span className="ml-2 text-[13px] font-semibold text-[#f0f0f0] tracking-widest">
            NEXUS
          </span>
        )}
        {sidebarOpen && (
          <span className="ml-auto text-[10px] text-[#333] font-mono">⌘\</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 flex flex-col gap-2">
        {/* Search trigger */}
        {sidebarOpen && (
          <div className="px-2">
            <button
              className="w-full flex items-center gap-2 px-2 h-7 rounded-sm text-[12px] text-[#555] transition-colors hover:bg-[#111] hover:text-[#888]"
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Search size={12} strokeWidth={1.75} />
              <span>Search...</span>
              <span className="ml-auto font-mono text-[10px]">⌘K</span>
            </button>
          </div>
        )}

        {/* Global nav */}
        <SidebarNav collapsed={!sidebarOpen} />

        {/* MY BUSINESSES */}
        <div className="flex flex-col gap-0.5">
          {sidebarOpen && (
            <span className="px-4 text-[10px] font-medium tracking-widest text-[#333] uppercase">
              My Businesses
            </span>
          )}
          <div className="px-2 flex flex-col gap-0.5">
            {BUSINESSES.map((biz) => (
              <SidebarBusinessItem key={biz.key} business={biz} collapsed={!sidebarOpen} />
            ))}
          </div>
        </div>
      </div>

      {/* Avatar footer */}
      <div
        className="h-11 flex items-center px-3 shrink-0 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div
          className="w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-semibold text-[#050505] shrink-0"
          style={{ background: '#00F5FF' }}
        >
          P
        </div>
        {sidebarOpen && (
          <span className="ml-2 text-[12px] text-[#666] truncate">Phill McGurk</span>
        )}
      </div>
    </motion.aside>
  )
}
```

**Step 6: Run tests**

Run: `pnpm vitest run src/components/layout/__tests__/Sidebar.test.tsx`
Expected: PASS (4 tests)

**Step 7: Run type-check**

Run: `pnpm turbo run type-check`
Expected: PASS (Sidebar + Topbar now exist — layout.tsx errors should clear after Task 6)

**Step 8: Commit**

```bash
git add src/components/layout/
git commit -m "feat(sidebar): add Sidebar, SidebarNav, SidebarBusinessItem with spring animation"
```

---

### Task 6: Topbar

**Files:**
- Create: `src/components/layout/Topbar.tsx`
- Create: `src/components/layout/__tests__/Topbar.test.tsx`

**Step 1: Write failing test**

```tsx
// src/components/layout/__tests__/Topbar.test.tsx
import { render, screen } from '@testing-library/react'
import { Topbar } from '../Topbar'

vi.mock('@/store/ui', () => ({
  useUIStore: vi.fn((selector?: (s: any) => any) => {
    const state = { toggleSidebar: vi.fn() }
    return selector ? selector(state) : state
  }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/founder/dashboard',
}))

describe('Topbar', () => {
  it('renders header element', () => {
    render(<Topbar />)
    expect(document.querySelector('header')).toBeInTheDocument()
  })

  it('shows Dashboard breadcrumb for /founder/dashboard', () => {
    render(<Topbar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
```

**Step 2: Run to verify fail**

Run: `pnpm vitest run src/components/layout/__tests__/Topbar.test.tsx`
Expected: FAIL — `Cannot find module '../Topbar'`

**Step 3: Create Topbar.tsx**

```tsx
// src/components/layout/Topbar.tsx
'use client'

import { Menu, HelpCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useUIStore } from '@/store/ui'

const BREADCRUMB_MAP: Record<string, string> = {
  '/founder/dashboard': 'Dashboard',
  '/founder/kanban':    'Kanban',
  '/founder/vault':     'Vault',
  '/founder/approvals': 'Approvals',
}

function getBreadcrumb(pathname: string): string {
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname]
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length >= 3) return parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ')
  return 'Nexus'
}

export function Topbar() {
  const pathname = usePathname()
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const breadcrumb = getBreadcrumb(pathname)

  return (
    <header
      className="h-12 flex items-center px-4 gap-3 shrink-0 border-b"
      style={{ background: 'var(--surface-canvas)', borderColor: 'var(--color-border)' }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="md:hidden text-[#555] hover:text-[#888] transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu size={16} strokeWidth={1.75} />
      </button>

      {/* Breadcrumb */}
      <span className="text-[13px] font-medium text-[#f0f0f0]">{breadcrumb}</span>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-3">
        <button
          className="flex items-center gap-2 px-3 h-7 rounded-sm text-[12px] text-[#555] border transition-colors hover:text-[#888]"
          style={{ borderColor: 'var(--color-border)', background: 'var(--surface-card)' }}
          aria-label="Command palette"
        >
          <span>Search</span>
          <span className="font-mono text-[10px]">⌘K</span>
        </button>
        <button className="text-[#555] hover:text-[#888] transition-colors" aria-label="Help">
          <HelpCircle size={16} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  )
}
```

**Step 4: Run tests**

Run: `pnpm vitest run src/components/layout/__tests__/Topbar.test.tsx`
Expected: PASS (2 tests)

**Step 5: Run full type-check (both Sidebar and Topbar now exist)**

Run: `pnpm turbo run type-check`
Expected: PASS — layout.tsx resolves cleanly

**Step 6: Commit**

```bash
git add src/components/layout/Topbar.tsx src/components/layout/__tests__/Topbar.test.tsx
git commit -m "feat(topbar): add Topbar with breadcrumb, search trigger, and mobile hamburger"
```

---

### Task 7: Dashboard — KPI Cards

**Files:**
- Create: `src/components/founder/dashboard/KPICard.tsx`
- Create: `src/components/founder/dashboard/KPIGrid.tsx`
- Create: `src/app/(founder)/founder/dashboard/page.tsx`
- Create: `src/components/founder/dashboard/__tests__/KPICard.test.tsx`

**Step 1: Write failing tests**

```tsx
// src/components/founder/dashboard/__tests__/KPICard.test.tsx
import { render, screen } from '@testing-library/react'
import { KPICard } from '../KPICard'
import { BUSINESSES } from '@/lib/businesses'

const DR = BUSINESSES.find(b => b.key === 'dr')!
const ATO = BUSINESSES.find(b => b.key === 'ato')!

const baseProps = {
  metric: '$24,750',
  metricLabel: 'Revenue MTD',
  trend: { value: '+12%', positive: true as const },
  secondary: '47 Claims · 3 Pending',
}

describe('KPICard', () => {
  it('renders business name', () => {
    render(<KPICard business={DR} {...baseProps} />)
    expect(screen.getByText('Disaster Recovery')).toBeInTheDocument()
  })

  it('renders primary metric', () => {
    render(<KPICard business={DR} {...baseProps} />)
    expect(screen.getByText('$24,750')).toBeInTheDocument()
  })

  it('shows not-yet-launched overlay for planning status', () => {
    render(<KPICard business={ATO} {...baseProps} metric="—" />)
    expect(screen.getByText(/not yet launched/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run to verify fail**

Run: `pnpm vitest run src/components/founder/dashboard/__tests__/KPICard.test.tsx`
Expected: FAIL

**Step 3: Create KPICard.tsx**

```tsx
// src/components/founder/dashboard/KPICard.tsx
'use client'

import { motion } from 'framer-motion'
import { type Business } from '@/lib/businesses'

interface KPICardProps {
  business: Business
  metric: string
  metricLabel: string
  trend: { value: string; positive: boolean }
  secondary: string
}

export function KPICard({ business, metric, metricLabel, trend, secondary }: KPICardProps) {
  const isPlanning = business.status === 'planning'

  return (
    <motion.div
      whileHover={!isPlanning ? { y: -2 } : undefined}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="relative rounded-sm border p-5 flex flex-col gap-3"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--color-border)',
        opacity: isPlanning ? 0.5 : 1,
      }}
    >
      {/* Business header */}
      <div className="flex items-center gap-2">
        <span
          className="rounded-full shrink-0"
          style={{ width: 8, height: 8, background: business.color }}
        />
        <span className="text-[13px] font-medium text-[#ccc]">{business.name}</span>
        {business.status === 'planning' && (
          <span className="ml-auto text-[10px] font-medium tracking-widest uppercase text-[#555]">
            Planning
          </span>
        )}
      </div>

      {/* Primary metric */}
      <div>
        <div className="text-[30px] font-semibold text-[#f0f0f0] leading-none tracking-tight">
          {metric}
        </div>
        <div className="mt-1 text-[11px] text-[#555]">{metricLabel}</div>
      </div>

      {/* Trend */}
      <div
        className="text-[12px] font-medium"
        style={{ color: trend.positive ? 'var(--color-success)' : 'var(--color-danger)' }}
      >
        {trend.positive ? '▲' : '▼'} {trend.value}
      </div>

      {/* Divider + secondary */}
      <div className="border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <span className="text-[11px] text-[#555]">{secondary}</span>
      </div>

      {/* Planning overlay */}
      {isPlanning && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-sm">
          <span className="text-[24px] text-[#333]">⬡</span>
          <span className="text-[12px] text-[#555] mt-1">Not yet launched</span>
        </div>
      )}
    </motion.div>
  )
}
```

**Step 4: Create KPIGrid.tsx**

```tsx
// src/components/founder/dashboard/KPIGrid.tsx
import { KPICard } from './KPICard'
import { BUSINESSES } from '@/lib/businesses'

const DASHBOARD_DATA = [
  { key: 'dr',      metric: '$24,750', metricLabel: 'Revenue MTD', trend: { value: '+12%', positive: true  }, secondary: '47 Claims · 3 Pending'       },
  { key: 'nrpg',   metric: '$8,400',  metricLabel: 'Revenue MTD', trend: { value: '+5%',  positive: true  }, secondary: '210 Members · 12 New'         },
  { key: 'carsi',  metric: '$12,200', metricLabel: 'Revenue MTD', trend: { value: '-3%',  positive: false }, secondary: '8 Courses · 3 Active'          },
  { key: 'restore',metric: '$6,930',  metricLabel: 'MRR',         trend: { value: '+18%', positive: true  }, secondary: '140 Subscribers'               },
  { key: 'synthex',metric: '$19,600', metricLabel: 'MRR',         trend: { value: '+22%', positive: true  }, secondary: '32 Clients · 4 Enterprise'     },
  { key: 'ato',    metric: '—',       metricLabel: 'Revenue MTD', trend: { value: '—',    positive: true  }, secondary: 'Not yet launched'              },
  { key: 'ccw',    metric: '$31,500', metricLabel: 'Revenue MTD', trend: { value: '+8%',  positive: true  }, secondary: '15 Orders · 3 Pending'         },
] as const

export function KPIGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {DASHBOARD_DATA.map((data) => {
        const business = BUSINESSES.find(b => b.key === data.key)!
        return (
          <KPICard
            key={data.key}
            business={business}
            metric={data.metric}
            metricLabel={data.metricLabel}
            trend={data.trend}
            secondary={data.secondary}
          />
        )
      })}
    </div>
  )
}
```

**Step 5: Create dashboard/page.tsx**

```tsx
// src/app/(founder)/founder/dashboard/page.tsx
import { KPIGrid } from '@/components/founder/dashboard/KPIGrid'

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-[24px] font-semibold text-[#f0f0f0] tracking-tight mb-6">
        Dashboard
      </h1>
      <KPIGrid />
    </div>
  )
}
```

**Step 6: Run tests**

Run: `pnpm vitest run src/components/founder/dashboard/__tests__/KPICard.test.tsx`
Expected: PASS (3 tests)

**Step 7: Commit**

```bash
git add src/components/founder/dashboard/ "src/app/(founder)/founder/dashboard/"
git commit -m "feat(dashboard): add KPICard, KPIGrid, and dashboard page with 7 static business metrics"
```

---

### Task 8: Kanban Board

**Files:**
- Create: `src/components/founder/kanban/KanbanCard.tsx`
- Create: `src/components/founder/kanban/KanbanColumn.tsx`
- Create: `src/components/founder/kanban/KanbanBoard.tsx`
- Create: `src/app/(founder)/founder/kanban/page.tsx`
- Create: `src/components/founder/kanban/__tests__/KanbanBoard.test.tsx`

**Step 1: Write failing test**

```tsx
// src/components/founder/kanban/__tests__/KanbanBoard.test.tsx
import { render, screen } from '@testing-library/react'
import { KanbanBoard } from '../KanbanBoard'

describe('KanbanBoard', () => {
  it('renders all 5 column headers', () => {
    render(<KanbanBoard />)
    expect(screen.getByText('TODAY')).toBeInTheDocument()
    expect(screen.getByText('HOT')).toBeInTheDocument()
    expect(screen.getByText('PIPELINE')).toBeInTheDocument()
    expect(screen.getByText('SOMEDAY')).toBeInTheDocument()
    expect(screen.getByText('DONE')).toBeInTheDocument()
  })
})
```

**Step 2: Run to verify fail**

Run: `pnpm vitest run src/components/founder/kanban/__tests__/KanbanBoard.test.tsx`
Expected: FAIL

**Step 3: Create KanbanCard.tsx**

Note: Use plain `div` with dnd-kit — do NOT mix Framer Motion `whileHover` with `CSS.Transform.toString()` as they fight over the `transform` property. Use Tailwind hover classes instead.

```tsx
// src/components/founder/kanban/KanbanCard.tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'

interface KanbanCardProps {
  id: string
  title: string
  businessColor: string
  isDone?: boolean
}

export function KanbanCard({ id, title, businessColor, isDone }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-sm border p-3 cursor-grab active:cursor-grabbing',
        'hover:-translate-y-px transition-transform duration-100',
        isDone && 'opacity-50'
      )}
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--color-border)',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1 shrink-0 rounded-full"
          style={{ width: 6, height: 6, background: businessColor }}
        />
        <span className={cn('text-[13px] text-[#ccc] leading-snug', isDone && 'line-through text-[#555]')}>
          {title}
        </span>
      </div>
    </div>
  )
}
```

Note: The double `style` prop above is a typo in the plan — remove the `className` hover classes or the `style` override. During implementation: use only `style` (not `className`) for transform, and a separate wrapper div for hover effect if needed. Simplest correct version:

```tsx
// Corrected KanbanCard.tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'

interface KanbanCardProps {
  id: string
  title: string
  businessColor: string
  isDone?: boolean
}

export function KanbanCard({ id, title, businessColor, isDone }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        background: 'var(--surface-card)',
        borderColor: 'var(--color-border)',
      }}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-sm border p-3 cursor-grab active:cursor-grabbing select-none',
        'hover:bg-[#161616] transition-colors duration-100',
        isDone && 'opacity-50'
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1 shrink-0 rounded-full"
          style={{ width: 6, height: 6, background: businessColor }}
        />
        <span className={cn('text-[13px] text-[#ccc] leading-snug', isDone && 'line-through text-[#555]')}>
          {title}
        </span>
      </div>
    </div>
  )
}
```

**Step 4: Create KanbanColumn.tsx**

```tsx
// src/components/founder/kanban/KanbanColumn.tsx
'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './KanbanCard'

interface CardData { id: string; title: string; businessColor: string }

interface KanbanColumnProps {
  id: string
  title: string
  cards: CardData[]
  isDone?: boolean
}

export function KanbanColumn({ id, title, cards, isDone }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      className="shrink-0 flex flex-col rounded-sm border"
      style={{
        width: 240,
        background: isOver ? 'var(--color-accent-dim)' : 'var(--surface-sidebar)',
        borderColor: isOver ? 'var(--color-accent-border)' : 'var(--color-border)',
      }}
    >
      {/* Column header */}
      <div
        className="px-3 py-2 flex items-center gap-2 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span className="text-[10px] font-medium tracking-widest text-[#555] uppercase">
          {title}
        </span>
        <span className="ml-auto text-[10px] font-mono text-[#333]">{cards.length}</span>
      </div>

      {/* Cards */}
      <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex flex-col gap-2 p-2 min-h-[120px]">
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              id={card.id}
              title={card.title}
              businessColor={card.businessColor}
              isDone={isDone}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
```

**Step 5: Create KanbanBoard.tsx**

```tsx
// src/components/founder/kanban/KanbanBoard.tsx
'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { BUSINESSES } from '@/lib/businesses'

type CardData = { id: string; title: string; businessKey: string; businessColor: string }
type Column = { id: string; title: string; cards: CardData[] }

const bizColor = (key: string) => BUSINESSES.find(b => b.key === key)?.color ?? '#555555'

const INITIAL_COLUMNS: Column[] = [
  {
    id: 'today', title: 'TODAY', cards: [
      { id: 'c1', title: 'Review DR claims report',        businessKey: 'dr',      businessColor: bizColor('dr') },
      { id: 'c2', title: 'Post Synthex content brief',     businessKey: 'synthex', businessColor: bizColor('synthex') },
    ],
  },
  {
    id: 'hot', title: 'HOT', cards: [
      { id: 'c3', title: 'CCW quarterly invoice run',      businessKey: 'ccw',     businessColor: bizColor('ccw') },
    ],
  },
  {
    id: 'pipeline', title: 'PIPELINE', cards: [
      { id: 'c4', title: 'NRPG member portal update',      businessKey: 'nrpg',    businessColor: bizColor('nrpg') },
      { id: 'c5', title: 'CARSI course module 3',          businessKey: 'carsi',   businessColor: bizColor('carsi') },
    ],
  },
  {
    id: 'someday', title: 'SOMEDAY', cards: [
      { id: 'c6', title: 'ATO entity structure review',    businessKey: 'ato',     businessColor: bizColor('ato') },
    ],
  },
  {
    id: 'done', title: 'DONE', cards: [
      { id: 'c7', title: 'RestoreAssist pricing update',   businessKey: 'restore', businessColor: bizColor('restore') },
    ],
  },
]

export function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS)
  const [activeCard, setActiveCard] = useState<CardData | null>(null)

  function findColumnByCardId(cardId: string) {
    return columns.find(col => col.cards.some(c => c.id === cardId))
  }

  function handleDragStart({ active }: DragStartEvent) {
    const col = findColumnByCardId(active.id as string)
    setActiveCard(col?.cards.find(c => c.id === active.id) ?? null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveCard(null)
    if (!over) return

    const srcColIdx = columns.findIndex(col => col.cards.some(c => c.id === active.id))
    const dstColIdx = columns.findIndex(
      col => col.id === over.id || col.cards.some(c => c.id === over.id)
    )
    if (srcColIdx === -1 || dstColIdx === -1) return

    setColumns(prev => {
      const next = prev.map(col => ({ ...col, cards: [...col.cards] }))
      const srcCards = next[srcColIdx].cards
      const cardIdx = srcCards.findIndex(c => c.id === active.id)
      const [card] = srcCards.splice(cardIdx, 1)

      const overCardIdx = next[dstColIdx].cards.findIndex(c => c.id === over.id)
      if (overCardIdx !== -1) {
        next[dstColIdx].cards.splice(overCardIdx, 0, card)
      } else {
        next[dstColIdx].cards.push(card)
      }
      return next
    })
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 pb-4">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            cards={col.cards}
            isDone={col.id === 'done'}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard && (
          <div
            className="rounded-sm border p-3"
            style={{
              width: 216,
              background: 'var(--surface-card)',
              borderColor: 'var(--color-border)',
            }}
          >
            <span className="text-[13px] text-[#ccc]">{activeCard.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
```

**Step 6: Create kanban/page.tsx**

```tsx
// src/app/(founder)/founder/kanban/page.tsx
import { KanbanBoard } from '@/components/founder/kanban/KanbanBoard'

export default function KanbanPage() {
  return (
    <div className="p-6">
      <h1 className="text-[24px] font-semibold text-[#f0f0f0] tracking-tight mb-6">Kanban</h1>
      <div className="overflow-x-auto">
        <KanbanBoard />
      </div>
    </div>
  )
}
```

**Step 7: Run tests**

Run: `pnpm vitest run src/components/founder/kanban/__tests__/KanbanBoard.test.tsx`
Expected: PASS (1 test)

**Step 8: Commit**

```bash
git add src/components/founder/kanban/ "src/app/(founder)/founder/kanban/"
git commit -m "feat(kanban): add drag-and-drop Kanban board with dnd-kit across 5 columns"
```

---

### Task 9: Vault

**Files:**
- Create: `src/components/founder/vault/VaultLock.tsx`
- Create: `src/components/founder/vault/VaultEntry.tsx`
- Create: `src/components/founder/vault/VaultGrid.tsx`
- Create: `src/app/(founder)/founder/vault/page.tsx`
- Create: `src/components/founder/vault/__tests__/VaultLock.test.tsx`

**Step 1: Write failing tests**

```tsx
// src/components/founder/vault/__tests__/VaultLock.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { VaultLock } from '../VaultLock'

describe('VaultLock', () => {
  it('renders password input', () => {
    render(<VaultLock onUnlock={vi.fn()} />)
    expect(screen.getByPlaceholderText(/master password/i)).toBeInTheDocument()
  })

  it('calls onUnlock with correct password', () => {
    const onUnlock = vi.fn()
    render(<VaultLock onUnlock={onUnlock} />)
    const input = screen.getByPlaceholderText(/master password/i)
    fireEvent.change(input, { target: { value: 'nexus2026' } })
    fireEvent.submit(input.closest('form')!)
    expect(onUnlock).toHaveBeenCalled()
  })

  it('shows error with wrong password', () => {
    render(<VaultLock onUnlock={vi.fn()} />)
    const input = screen.getByPlaceholderText(/master password/i)
    fireEvent.change(input, { target: { value: 'wrongpassword' } })
    fireEvent.submit(input.closest('form')!)
    expect(screen.getByText(/incorrect password/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run to verify fail**

Run: `pnpm vitest run src/components/founder/vault/__tests__/VaultLock.test.tsx`
Expected: FAIL

**Step 3: Create VaultLock.tsx**

```tsx
// src/components/founder/vault/VaultLock.tsx
'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'

const MASTER_PASSWORD = 'nexus2026' // Phase 3: local only

interface VaultLockProps { onUnlock: () => void }

export function VaultLock({ onUnlock }: VaultLockProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value === MASTER_PASSWORD) {
      setError(false)
      onUnlock()
    } else {
      setError(true)
      setValue('')
    }
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-10"
      style={{ background: 'var(--surface-sidebar)' }}
    >
      <div className="flex flex-col items-center gap-6 w-full max-w-xs px-4">
        <div className="flex flex-col items-center gap-3">
          <Lock size={32} strokeWidth={1.5} style={{ color: '#00F5FF' }} />
          <p className="text-[14px] text-[#888] text-center">
            Enter your master password to access the Vault
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false) }}
            placeholder="Master password"
            autoFocus
            className="w-full px-3 h-9 rounded-sm border text-[13px] text-[#f0f0f0] outline-none transition-colors bg-transparent"
            style={{
              background: 'var(--surface-card)',
              borderColor: error ? 'var(--color-danger)' : 'var(--color-border)',
            }}
          />
          {error && (
            <p className="text-[12px] text-center" style={{ color: 'var(--color-danger)' }}>
              Incorrect password
            </p>
          )}
          <button
            type="submit"
            className="h-9 rounded-sm text-[13px] font-medium transition-opacity hover:opacity-90"
            style={{ background: '#00F5FF', color: '#050505' }}
          >
            Unlock Vault
          </button>
        </form>
      </div>
    </div>
  )
}
```

**Step 4: Create VaultEntry.tsx**

```tsx
// src/components/founder/vault/VaultEntry.tsx
'use client'

import { useState } from 'react'
import { Eye, EyeOff, Copy } from 'lucide-react'

interface VaultEntryProps {
  label: string
  username: string
  secret: string
  businessColor: string
}

export function VaultEntry({ label, username, secret, businessColor }: VaultEntryProps) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 800)
  }

  return (
    <div
      className="group flex items-center gap-3 h-8 px-3 border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <span className="shrink-0 rounded-full" style={{ width: 6, height: 6, background: businessColor }} />
      <span className="text-[13px] text-[#ccc] w-40 truncate">{label}</span>
      <span className="text-[12px] text-[#555] w-32 truncate">{username}</span>
      <span className="flex-1 font-mono text-[12px] text-[#777]">
        {revealed ? secret : '··········'}
      </span>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setRevealed(!revealed)}
          className="text-[#555] hover:text-[#888] transition-colors"
          aria-label={revealed ? 'Hide' : 'Show'}
        >
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          onClick={handleCopy}
          className="transition-colors"
          style={{ color: copied ? '#00F5FF' : '#555555' }}
          aria-label="Copy"
        >
          <Copy size={14} />
        </button>
      </div>
    </div>
  )
}
```

**Step 5: Create VaultGrid.tsx**

```tsx
// src/components/founder/vault/VaultGrid.tsx
import { VaultEntry } from './VaultEntry'
import { BUSINESSES } from '@/lib/businesses'

const CREDENTIALS = [
  { id: '1', businessKey: 'dr',      label: 'Supabase API Key',   username: 'admin@dr.com.au',        secret: 'sbp_prod_placeholder_dr' },
  { id: '2', businessKey: 'dr',      label: 'Stripe Secret Key',  username: 'stripe_dr',              secret: 'sk_live_placeholder_dr' },
  { id: '3', businessKey: 'synthex', label: 'Stripe Secret Key',  username: 'stripe_synthex',         secret: 'sk_live_placeholder_synthex' },
  { id: '4', businessKey: 'synthex', label: 'OpenAI API Key',     username: 'synthex_ai',             secret: 'sk-placeholder-synthex' },
  { id: '5', businessKey: 'restore', label: 'Stripe Secret Key',  username: 'stripe_restore',         secret: 'sk_live_placeholder_restore' },
  { id: '6', businessKey: 'ccw',     label: 'Shopify Admin API',  username: 'admin@ccwonline.com.au', secret: 'shpat_placeholder_ccw' },
  { id: '7', businessKey: 'nrpg',    label: 'Mailgun API Key',    username: 'noreply@nrpg.com.au',    secret: 'key-placeholder-nrpg' },
] as const

const GROUPED = BUSINESSES.map(biz => ({
  business: biz,
  credentials: CREDENTIALS.filter(c => c.businessKey === biz.key),
})).filter(g => g.credentials.length > 0)

export function VaultGrid() {
  return (
    <div className="flex flex-col gap-6">
      {GROUPED.map(({ business, credentials }) => (
        <div key={business.key}>
          <div className="px-3 py-1 flex items-center gap-2">
            <span className="rounded-full" style={{ width: 6, height: 6, background: business.color }} />
            <span className="text-[10px] font-medium tracking-widest text-[#555] uppercase">
              {business.name}
            </span>
          </div>
          <div
            className="rounded-sm border overflow-hidden"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {credentials.map(cred => (
              <VaultEntry
                key={cred.id}
                label={cred.label}
                username={cred.username}
                secret={cred.secret}
                businessColor={business.color}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Step 6: Create vault/page.tsx**

```tsx
// src/app/(founder)/founder/vault/page.tsx
'use client'

import { useState } from 'react'
import { VaultLock } from '@/components/founder/vault/VaultLock'
import { VaultGrid } from '@/components/founder/vault/VaultGrid'

export default function VaultPage() {
  const [unlocked, setUnlocked] = useState(false)

  return (
    <div className="relative p-6">
      <h1 className="text-[24px] font-semibold text-[#f0f0f0] tracking-tight mb-6">Vault</h1>
      <VaultGrid />
      {!unlocked && <VaultLock onUnlock={() => setUnlocked(true)} />}
    </div>
  )
}
```

**Step 7: Run tests**

Run: `pnpm vitest run src/components/founder/vault/__tests__/VaultLock.test.tsx`
Expected: PASS (3 tests)

**Step 8: Commit**

```bash
git add src/components/founder/vault/ "src/app/(founder)/founder/vault/"
git commit -m "feat(vault): add credential vault with master password lock and reveal/copy actions"
```

---

### Task 10: Approvals

**Files:**
- Create: `src/components/founder/approvals/ApprovalItem.tsx`
- Create: `src/components/founder/approvals/ApprovalQueue.tsx`
- Create: `src/app/(founder)/founder/approvals/page.tsx`
- Create: `src/components/founder/approvals/__tests__/ApprovalItem.test.tsx`

**Step 1: Write failing tests**

```tsx
// src/components/founder/approvals/__tests__/ApprovalItem.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ApprovalItem } from '../ApprovalItem'

const mockProps = {
  id: '1',
  businessColor: '#a855f7',
  action: 'Post to LinkedIn',
  detail: 'Monthly performance update',
  requestedBy: 'Bron AI',
  requestedAt: '09/03/2026 09:00',
  onApprove: vi.fn(),
  onReject: vi.fn(),
}

describe('ApprovalItem', () => {
  it('renders action text', () => {
    render(<ApprovalItem {...mockProps} />)
    expect(screen.getByText('Post to LinkedIn')).toBeInTheDocument()
  })

  it('calls onApprove with id when Approve clicked', () => {
    const onApprove = vi.fn()
    render(<ApprovalItem {...mockProps} onApprove={onApprove} />)
    fireEvent.click(screen.getByText('Approve'))
    expect(onApprove).toHaveBeenCalledWith('1')
  })

  it('calls onReject with id when Reject clicked', () => {
    const onReject = vi.fn()
    render(<ApprovalItem {...mockProps} onReject={onReject} />)
    fireEvent.click(screen.getByText('Reject'))
    expect(onReject).toHaveBeenCalledWith('1')
  })
})
```

**Step 2: Run to verify fail**

Run: `pnpm vitest run src/components/founder/approvals/__tests__/ApprovalItem.test.tsx`
Expected: FAIL

**Step 3: Create ApprovalItem.tsx**

```tsx
// src/components/founder/approvals/ApprovalItem.tsx
'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface ApprovalItemProps {
  id: string
  businessColor: string
  action: string
  detail: string
  requestedBy: string
  requestedAt: string
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export function ApprovalItem({
  id, businessColor, action, detail, requestedBy, requestedAt, onApprove, onReject,
}: ApprovalItemProps) {
  const [exiting, setExiting] = useState<'approve' | 'reject' | null>(null)

  function handleApprove() {
    setExiting('approve')
    setTimeout(() => onApprove(id), 200)
  }

  function handleReject() {
    setExiting('reject')
    setTimeout(() => onReject(id), 200)
  }

  return (
    <motion.div
      animate={
        exiting === 'approve' ? { opacity: 0, x: 16 } :
        exiting === 'reject'  ? { opacity: 0, x: -16 } :
        { opacity: 1, x: 0 }
      }
      transition={{ duration: 0.2 }}
      className="flex items-center gap-4 px-4 py-4 border-b"
      style={{
        background: 'var(--surface-sidebar)',
        borderColor: 'var(--color-border)',
      }}
    >
      <span className="shrink-0 rounded-full mt-1" style={{ width: 6, height: 6, background: businessColor }} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[#e0e0e0]">{action}</p>
        <p className="text-[12px] text-[#555] mt-0.5">{detail}</p>
        <p className="text-[11px] text-[#444] mt-1">Requested by {requestedBy} · {requestedAt}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleReject}
          className="h-7 px-3 rounded-sm text-[12px] font-medium border transition-colors hover:bg-[rgba(239,68,68,0.08)]"
          style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
        >
          Reject
        </button>
        <button
          onClick={handleApprove}
          className="h-7 px-3 rounded-sm text-[12px] font-medium border transition-colors hover:bg-[rgba(34,197,94,0.08)]"
          style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)' }}
        >
          Approve
        </button>
      </div>
    </motion.div>
  )
}
```

**Step 4: Create ApprovalQueue.tsx**

```tsx
// src/components/founder/approvals/ApprovalQueue.tsx
'use client'

import { useState } from 'react'
import { ApprovalItem } from './ApprovalItem'
import { BUSINESSES } from '@/lib/businesses'

const bizColor = (key: string) => BUSINESSES.find(b => b.key === key)?.color ?? '#555555'

const INITIAL_QUEUE = [
  { id: '1', businessKey: 'synthex', action: 'Post to LinkedIn',       detail: 'Monthly performance update — 847 words',    requestedBy: 'Bron AI', requestedAt: '09/03/2026 09:00' },
  { id: '2', businessKey: 'dr',      action: 'Send claim update email', detail: 'To 12 pending claimants — batch send',    requestedBy: 'Bron AI', requestedAt: '09/03/2026 08:30' },
  { id: '3', businessKey: 'nrpg',   action: 'Post to Facebook',        detail: 'NRPG member spotlight — Sarah T.',        requestedBy: 'Bron AI', requestedAt: '09/03/2026 08:00' },
  { id: '4', businessKey: 'restore', action: 'Create Linear issue',     detail: 'Bug: login timeout on mobile — P2',       requestedBy: 'Bron AI', requestedAt: '08/03/2026 17:00' },
]

export function ApprovalQueue() {
  const [queue, setQueue] = useState(INITIAL_QUEUE)
  const [approvedCount, setApprovedCount] = useState(0)

  function handleApprove(id: string) {
    setApprovedCount(n => n + 1)
    setQueue(prev => prev.filter(item => item.id !== id))
  }

  function handleReject(id: string) {
    setQueue(prev => prev.filter(item => item.id !== id))
  }

  return (
    <div>
      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="text-[24px] text-[#333]">✓</span>
          <p className="text-[13px] text-[#555]">All caught up</p>
        </div>
      ) : (
        <div className="rounded-sm border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          {queue.map((item) => (
            <ApprovalItem
              key={item.id}
              id={item.id}
              businessColor={bizColor(item.businessKey)}
              action={item.action}
              detail={item.detail}
              requestedBy={item.requestedBy}
              requestedAt={item.requestedAt}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {approvedCount > 0 && (
        <div className="mt-6 opacity-50">
          <p className="text-[10px] font-medium tracking-widest text-[#444] uppercase mb-2">
            Approved ({approvedCount})
          </p>
        </div>
      )}
    </div>
  )
}
```

**Step 5: Create approvals/page.tsx**

```tsx
// src/app/(founder)/founder/approvals/page.tsx
import { ApprovalQueue } from '@/components/founder/approvals/ApprovalQueue'

export default function ApprovalsPage() {
  return (
    <div className="p-6">
      <h1 className="text-[24px] font-semibold text-[#f0f0f0] tracking-tight mb-6">Approvals</h1>
      <ApprovalQueue />
    </div>
  )
}
```

**Step 6: Run tests**

Run: `pnpm vitest run src/components/founder/approvals/__tests__/ApprovalItem.test.tsx`
Expected: PASS (3 tests)

**Step 7: Commit**

```bash
git add src/components/founder/approvals/ "src/app/(founder)/founder/approvals/"
git commit -m "feat(approvals): add approval queue with approve/reject slide animations"
```

---

### Task 11: Block Editor

**Files:**
- Create: `src/components/founder/editor/NovelEditor.tsx`
- Create: `src/app/(founder)/founder/[businessKey]/page/[id]/page.tsx`

**Step 1: Check Novel's actual export**

Before writing, verify the API:

```bash
cat node_modules/novel/dist/index.d.ts | head -30
```

If `Editor` is not the default export, adjust the import accordingly. Novel 1.0.x typically exports `{ Editor }`.

**Step 2: Create NovelEditor.tsx**

```tsx
// src/components/founder/editor/NovelEditor.tsx
'use client'

import { Editor } from 'novel'

interface NovelEditorProps {
  businessKey: string
  pageId: string
}

export function NovelEditor({ businessKey, pageId }: NovelEditorProps) {
  return (
    <div
      className="min-h-[calc(100vh-112px)]"
      style={{ background: 'var(--surface-canvas)' }}
    >
      <Editor
        className="novel-editor"
        defaultValue={{
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'Untitled' }],
            },
          ],
        }}
      />
    </div>
  )
}
```

If Novel's `Editor` component has a different API signature (check the `.d.ts`), adapt the props accordingly. The key requirement is: editor renders, `/` slash menu opens.

**Step 3: Add Novel prose styles to globals.css**

```css
/* Novel block editor */
.novel-editor .ProseMirror {
  outline: none;
  font-family: var(--font-geist-sans, system-ui, sans-serif);
  color: #c4c4c4;
  font-size: 15px;
  line-height: 1.7;
}
.novel-editor .ProseMirror h1 {
  font-size: 30px;
  font-weight: 600;
  color: #f0f0f0;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}
.novel-editor .ProseMirror h2 {
  font-size: 22px;
  font-weight: 600;
  color: #e0e0e0;
  letter-spacing: -0.02em;
  margin: 24px 0 8px;
}
.novel-editor .ProseMirror p {
  margin: 0 0 4px;
}
.novel-editor .ProseMirror .is-empty::before {
  color: #555;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
```

**Step 4: Create [businessKey]/page/[id]/page.tsx**

```tsx
// src/app/(founder)/founder/[businessKey]/page/[id]/page.tsx
import { NovelEditor } from '@/components/founder/editor/NovelEditor'

interface Props {
  params: { businessKey: string; id: string }
}

export default function PageEditorPage({ params }: Props) {
  return (
    <div>
      {/* Toolbar */}
      <div
        className="h-12 border-b flex items-center px-6"
        style={{ background: 'var(--surface-sidebar)', borderColor: 'var(--color-border)' }}
      >
        <span className="text-[12px] text-[#555] capitalize">
          {params.businessKey} / Page
        </span>
      </div>

      {/* Editor — centred prose width */}
      <div className="max-w-[720px] mx-auto px-6 pt-12">
        <NovelEditor businessKey={params.businessKey} pageId={params.id} />
      </div>
    </div>
  )
}
```

**Step 5: Run type-check**

Run: `pnpm turbo run type-check`
Expected: PASS — fix any Novel API type errors by checking `node_modules/novel/dist/index.d.ts`

**Step 6: Commit**

```bash
git add src/components/founder/editor/ "src/app/(founder)/founder/[businessKey]/" src/app/globals.css
git commit -m "feat(editor): add Novel block editor for per-business pages"
```

---

### Task 12: Final Verification

**Step 1: Run all tests**

Run: `pnpm vitest run`
Expected: All tests PASS — fix any failures before continuing

**Step 2: Type-check**

Run: `pnpm turbo run type-check`
Expected: PASS — zero errors

**Step 3: Lint**

Run: `pnpm turbo run lint`
Expected: PASS — fix any ESLint errors

**Step 4: Dev server smoke test**

Run: `pnpm dev`

Manually verify in browser at `http://localhost:3000`:

- [ ] `/founder/dashboard` — 7 KPI cards visible, Disaster Recovery card loads
- [ ] Sidebar collapses with `Cmd+\` — width springs to 48px
- [ ] Reload page — sidebar persists collapsed state (localStorage check)
- [ ] `Synthex` business tree item — click chevron, "New Page" link appears
- [ ] `/founder/kanban` — 5 columns visible, drag card between TODAY and HOT
- [ ] `/founder/vault` — lock screen shows, enter `nexus2026`, vault unlocks
- [ ] `/founder/approvals` — approve an item, slides right and disappears
- [ ] `/founder/dr/page/new` — Novel editor loads, type `/` to open slash menu
- [ ] Mobile at 375px — hamburger appears in topbar, tap to open sidebar overlay
- [ ] Sidebar collapsed — icon-only rail, business dots visible

**Step 5: Final commit and push**

```bash
pnpm turbo run type-check lint
git add -A
git commit -m "chore(phase3): all routes render, tests pass, type-check and lint clean"
git push origin rebuild/nexus-2.0
```

---

## Exit Criteria

- [ ] All 5 routes render without console errors
- [ ] Sidebar collapses/expands via `Cmd+\` and persists state to localStorage
- [ ] Business tree expands/collapses per business with spring animation
- [ ] Dashboard shows 7 KPI cards with static data, ATO card at 50% opacity
- [ ] Kanban supports drag-and-drop between all 5 columns
- [ ] Vault locks/unlocks with master password (local state only in Phase 3)
- [ ] Approvals queue renders with working approve/reject slide animations
- [ ] Block editor loads Novel, `/` slash menu works
- [ ] Responsive: mobile (375px) hamburger works, tablet 2-col grid
- [ ] `pnpm turbo run type-check lint` passes clean
