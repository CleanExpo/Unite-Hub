# Light Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a manually-toggled light mode (cool platinum palette, `#00F5FF` accent unchanged) persisted in Zustand, applied via a `.light` class on `<html>`.

**Architecture:** CSS custom property tokens in `globals.css` are overridden by a `.light` class block. A `ThemeProvider` client component applies/removes that class reactively. Hardcoded hex values in 4 layout components are converted to CSS variable references so they respond automatically. Toggle button (Sun/Moon) lives in the Topbar.

**Tech Stack:** Next.js 16, Tailwind CSS arbitrary values (`text-[var(--token)]`), Zustand persist, Framer Motion (no changes), Vitest + RTL for tests.

**Design doc:** `docs/plans/2026-03-10-light-mode-design.md`

---

## Task 1: Extend Zustand store with theme state

**Files:**
- Modify: `src/store/ui.ts`
- Modify: `src/store/__tests__/ui.test.ts`

### Step 1: Write failing tests

Add to `src/store/__tests__/ui.test.ts` — insert after existing tests, and update `beforeEach` to also reset `theme`:

```ts
// Update beforeEach to include theme reset:
beforeEach(() => {
  useUIStore.setState({ sidebarOpen: true, expandedBusinesses: [], theme: 'dark' })
})

// Add new describe block:
describe('theme', () => {
  it('defaults to dark', () => {
    const { result } = renderHook(() => useUIStore())
    expect(result.current.theme).toBe('dark')
  })

  it('toggleTheme switches dark → light', () => {
    const { result } = renderHook(() => useUIStore())
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
  })

  it('toggleTheme switches light → dark', () => {
    useUIStore.setState({ sidebarOpen: true, expandedBusinesses: [], theme: 'light' })
    const { result } = renderHook(() => useUIStore())
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark')
  })
})
```

### Step 2: Run tests to verify they fail

```bash
pnpm vitest run src/store/__tests__/ui.test.ts
```

Expected: FAIL — `theme` not defined, `toggleTheme` not defined.

### Step 3: Implement in store

Replace `src/store/ui.ts` with:

```ts
// src/store/ui.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  sidebarOpen: boolean
  expandedBusinesses: string[]
  theme: 'dark' | 'light'
  toggleSidebar: () => void
  toggleBusiness: (key: string) => void
  toggleTheme: () => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      expandedBusinesses: [],
      theme: 'dark',
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleBusiness: (key) =>
        set((s) => ({
          expandedBusinesses: s.expandedBusinesses.includes(key)
            ? s.expandedBusinesses.filter((k) => k !== key)
            : [...s.expandedBusinesses, key],
        })),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'nexus-ui' }
  )
)
```

### Step 4: Run tests to verify they pass

```bash
pnpm vitest run src/store/__tests__/ui.test.ts
```

Expected: All 7 tests PASS.

### Step 5: Commit

```bash
git add src/store/ui.ts src/store/__tests__/ui.test.ts
git commit -m "feat(theme): add theme state + toggleTheme to UI store"
```

---

## Task 2: Add `.light` CSS token block + fix hardcoded body styles

**Files:**
- Modify: `src/app/globals.css`

No unit tests for CSS — verified visually after ThemeProvider is wired up.

### Step 1: Update body styles (lines 123–127)

Change:
```css
body {
  background-color: #050505;
  color: #f0f0f0;
  font-feature-settings: "rlig" 1, "calt" 1;
}
```

To:
```css
body {
  background-color: var(--surface-canvas);
  color: var(--color-text-primary);
  font-feature-settings: "rlig" 1, "calt" 1;
}
```

### Step 2: Add `.light` block

Insert after the closing `}` of the `.dark` block (after line 117), before the `* { border-color: ... }` rule:

```css
/* Light Mode — Cool Platinum */
.light {
  color-scheme: light;

  /* Surface stack */
  --surface-canvas:   #FAFAFA;
  --surface-sidebar:  #F4F4F5;
  --surface-card:     #FFFFFF;
  --surface-elevated: #FFFFFF;
  --surface-overlay:  #E4E4E7;
  --surface-selected: #D4D4D8;

  /* Text */
  --color-text-primary:   #0A0A0A;
  --color-text-secondary: #52525B;
  --color-text-muted:     #71717A;
  --color-text-disabled:  #A1A1AA;

  /* Borders */
  --color-border:        rgba(0, 0, 0, 0.08);
  --color-border-strong: rgba(0, 0, 0, 0.15);

  /* Accent #00F5FF and business dot colours are intentionally unchanged */
}
```

### Step 3: Verify build compiles

```bash
pnpm run type-check
```

Expected: No errors.

### Step 4: Commit

```bash
git add src/app/globals.css
git commit -m "feat(theme): add .light CSS token block + tokenise body bg/color"
```

---

## Task 3: Create ThemeProvider + wire into root layout

**Files:**
- Create: `src/components/layout/ThemeProvider.tsx`
- Modify: `src/app/layout.tsx`

### Step 1: Write failing test

Create `src/components/layout/__tests__/ThemeProvider.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { useUIStore } from '@/store/ui'
import { ThemeProvider } from '../ThemeProvider'

beforeEach(() => {
  useUIStore.setState({ sidebarOpen: true, expandedBusinesses: [], theme: 'dark' })
  document.documentElement.classList.remove('light')
})

describe('ThemeProvider', () => {
  it('does not add .light class when theme is dark', () => {
    render(<ThemeProvider><div /></ThemeProvider>)
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('adds .light class to <html> when theme is light', () => {
    useUIStore.setState({ sidebarOpen: true, expandedBusinesses: [], theme: 'light' })
    render(<ThemeProvider><div /></ThemeProvider>)
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })
})
```

### Step 2: Run test to verify it fails

```bash
pnpm vitest run src/components/layout/__tests__/ThemeProvider.test.tsx
```

Expected: FAIL — `ThemeProvider` not found.

### Step 3: Create ThemeProvider

Create `src/components/layout/ThemeProvider.tsx`:

```tsx
// src/components/layout/ThemeProvider.tsx
'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/store/ui'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  return <>{children}</>
}
```

### Step 4: Run test to verify it passes

```bash
pnpm vitest run src/components/layout/__tests__/ThemeProvider.test.tsx
```

Expected: 2 tests PASS.

### Step 5: Wire ThemeProvider into root layout

Update `src/app/layout.tsx` — `suppressHydrationWarning` is already present, just add the import and wrapper:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexus — Unite Group",
  description: "Private founder CRM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

### Step 6: Commit

```bash
git add src/components/layout/ThemeProvider.tsx src/components/layout/__tests__/ThemeProvider.test.tsx src/app/layout.tsx
git commit -m "feat(theme): ThemeProvider applies .light class to <html>"
```

---

## Task 4: Add Sun/Moon toggle to Topbar + convert Topbar hex values

**Files:**
- Modify: `src/components/layout/Topbar.tsx`
- Modify: `src/components/layout/__tests__/Topbar.test.tsx`

### Step 1: Read the existing Topbar test

Check `src/components/layout/__tests__/Topbar.test.tsx` before editing to understand what's already there and avoid breaking existing tests.

### Step 2: Add toggle tests

Add to the existing Topbar test file:

```tsx
import { useUIStore } from '@/store/ui'

// In beforeEach (add to existing or create):
beforeEach(() => {
  useUIStore.setState({ sidebarOpen: true, expandedBusinesses: [], theme: 'dark' })
})

it('renders Sun icon when theme is dark', () => {
  render(<Topbar />)
  expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument()
})

it('renders Moon icon when theme is light', () => {
  useUIStore.setState({ sidebarOpen: true, expandedBusinesses: [], theme: 'light' })
  render(<Topbar />)
  expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument()
})

it('calls toggleTheme when toggle button is clicked', async () => {
  const user = userEvent.setup()
  render(<Topbar />)
  await user.click(screen.getByLabelText('Switch to light mode'))
  expect(useUIStore.getState().theme).toBe('light')
})
```

### Step 3: Run tests to verify they fail

```bash
pnpm vitest run src/components/layout/__tests__/Topbar.test.tsx
```

Expected: FAIL — toggle button not found.

### Step 4: Update Topbar

Replace `src/components/layout/Topbar.tsx` with:

```tsx
// src/components/layout/Topbar.tsx
'use client'

import { Menu, HelpCircle, Sun, Moon } from 'lucide-react'
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
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const breadcrumb = getBreadcrumb(pathname)

  return (
    <header
      className="h-12 flex items-center px-4 gap-3 shrink-0 border-b"
      style={{ background: 'var(--surface-canvas)', borderColor: 'var(--color-border)' }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="md:hidden transition-colors"
        style={{ color: 'var(--color-text-disabled)' }}
        aria-label="Toggle sidebar"
      >
        <Menu size={16} strokeWidth={1.75} />
      </button>

      {/* Breadcrumb */}
      <span
        className="text-[13px] font-medium"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {breadcrumb}
      </span>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-3">
        <button
          className="flex items-center gap-2 px-3 h-7 rounded-sm text-[12px] border transition-colors"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--surface-card)',
            color: 'var(--color-text-disabled)',
          }}
          aria-label="Command palette"
        >
          <span>Search</span>
          <span className="font-mono text-[10px]">⌘K</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="transition-colors"
          style={{ color: 'var(--color-text-disabled)' }}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark'
            ? <Sun size={16} strokeWidth={1.75} />
            : <Moon size={16} strokeWidth={1.75} />
          }
        </button>

        <button
          className="transition-colors"
          style={{ color: 'var(--color-text-disabled)' }}
          aria-label="Help"
        >
          <HelpCircle size={16} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  )
}
```

### Step 5: Run tests to verify they pass

```bash
pnpm vitest run src/components/layout/__tests__/Topbar.test.tsx
```

Expected: All tests PASS.

### Step 6: Commit

```bash
git add src/components/layout/Topbar.tsx src/components/layout/__tests__/Topbar.test.tsx
git commit -m "feat(theme): Sun/Moon toggle in Topbar; convert hardcoded hex to CSS vars"
```

---

## Task 5: Convert hardcoded hex in Sidebar.tsx

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

No new unit tests — this is a visual token substitution. Verify the build compiles.

### Step 1: Replace hardcoded values

Replace `src/components/layout/Sidebar.tsx` with:

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
          <span
            className="ml-2 text-[13px] font-semibold tracking-widest"
            style={{ color: 'var(--color-text-primary)' }}
          >
            NEXUS
          </span>
        )}
        {sidebarOpen && (
          <span
            className="ml-auto font-mono text-[10px]"
            style={{ color: 'var(--color-text-disabled)' }}
          >
            ⌘\
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 flex flex-col gap-2">
        {/* Search trigger */}
        {sidebarOpen && (
          <div className="px-2">
            <button
              className="w-full flex items-center gap-2 px-2 h-7 rounded-sm text-[12px] transition-colors"
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-disabled)',
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
            <span
              className="px-4 text-[10px] font-medium tracking-widest uppercase"
              style={{ color: 'var(--color-text-disabled)' }}
            >
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
          className="w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-semibold shrink-0"
          style={{ background: '#00F5FF', color: '#050505' }}
        >
          P
        </div>
        {sidebarOpen && (
          <span
            className="ml-2 text-[12px] truncate"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Phill McGurk
          </span>
        )}
      </div>
    </motion.aside>
  )
}
```

### Step 2: Verify build

```bash
pnpm run type-check
```

Expected: No errors.

### Step 3: Commit

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "refactor(theme): Sidebar — replace hardcoded hex with CSS var tokens"
```

---

## Task 6: Convert hardcoded hex in SidebarNav.tsx

**Files:**
- Modify: `src/components/layout/SidebarNav.tsx`

### Step 1: Replace hardcoded values

Replace `src/components/layout/SidebarNav.tsx` with:

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
                ? 'before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:bg-[#00F5FF] before:rounded-r-sm'
                : ''
            )}
            style={active
              ? { color: 'var(--color-text-primary)', background: 'var(--surface-elevated)' }
              : { color: 'var(--color-text-muted)' }
            }
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

**Note:** Hover state (`hover:bg-[#111]`, `hover:text-[#ccc]`) cannot use inline styles. Use a `group` pattern or accept that hover uses `var(--surface-card)` via a data attribute, OR keep the active/inactive purely via `style={}` and add a CSS class for hover. Simplest approach: add a `.nav-item` utility in `globals.css`:

```css
/* Add to @layer utilities in globals.css */
.nav-item-hover:hover {
  background: var(--surface-card);
  color: var(--color-text-secondary);
}
```

Then add `nav-item-hover` to the inactive link's className.

### Step 2: Verify build

```bash
pnpm run type-check
```

Expected: No errors.

### Step 3: Commit

```bash
git add src/components/layout/SidebarNav.tsx src/app/globals.css
git commit -m "refactor(theme): SidebarNav — replace hardcoded hex with CSS var tokens"
```

---

## Task 7: Convert hardcoded hex in SidebarBusinessItem.tsx

**Files:**
- Modify: `src/components/layout/SidebarBusinessItem.tsx`

### Step 1: Add hover utility to globals.css (if not done in Task 6)

Add to `@layer utilities` in `globals.css`:

```css
.nav-item-hover:hover {
  background: var(--surface-card);
  color: var(--color-text-secondary);
}
```

### Step 2: Replace hardcoded values

Replace `src/components/layout/SidebarBusinessItem.tsx` with:

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
        aria-expanded={isExpanded}
        className={cn(
          'nav-item-hover w-full flex items-center gap-2 px-2 h-8 rounded-sm text-[13px] font-medium transition-colors duration-100',
        )}
        style={isActive
          ? { color: 'var(--color-text-primary)', background: 'var(--surface-elevated)' }
          : { color: 'var(--color-text-muted)' }
        }
      >
        <span
          className="shrink-0 rounded-full"
          style={{ width: 6, height: 6, background: business.color }}
        />
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{business.name}</span>
            {business.status === 'planning' && (
              <span
                className="text-[10px] font-medium tracking-widest uppercase"
                style={{ color: 'var(--color-text-disabled)' }}
              >
                plan
              </span>
            )}
            <ChevronRight
              size={12}
              strokeWidth={2}
              className={cn('shrink-0 transition-transform duration-150', isExpanded && 'rotate-90')}
              style={{ color: 'var(--color-text-disabled)' }}
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
                className="nav-item-hover flex items-center gap-2 px-2 h-7 rounded-sm text-[12px] transition-colors duration-100"
                style={{ color: 'var(--color-text-muted)' }}
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

### Step 3: Verify build

```bash
pnpm run type-check
```

Expected: No errors.

### Step 4: Commit

```bash
git add src/components/layout/SidebarBusinessItem.tsx src/app/globals.css
git commit -m "refactor(theme): SidebarBusinessItem — replace hardcoded hex with CSS var tokens"
```

---

## Task 8: Full test run + visual smoke test

### Step 1: Run all tests

```bash
pnpm vitest run
```

Expected: All tests PASS. No regressions.

### Step 2: Start dev server and verify visually

```bash
pnpm dev --port 3003
```

Navigate to `http://localhost:3003/founder/dashboard`.

**Check dark mode (default):**
- Background is OLED black `#050505`
- Sidebar is `#0d0d0d`
- Cyan `#00F5FF` accent visible

**Click the Sun icon in the Topbar to switch to light mode:**
- Background becomes `#FAFAFA`
- Sidebar becomes `#F4F4F5`
- Text switches to near-black
- Cyan `#00F5FF` accent still visible
- Moon icon now shows in Topbar

**Reload the page:**
- Light mode persists (Zustand localStorage)

**Click Moon icon to return to dark:**
- OLED black returns

### Step 3: Final commit (if any cleanup needed)

```bash
git add -A
git commit -m "feat(theme): light mode complete — cool platinum palette, manual toggle"
```

---

## Summary of files changed

| File | Change |
|------|--------|
| `src/store/ui.ts` | Add `theme`, `toggleTheme` |
| `src/store/__tests__/ui.test.ts` | Add theme tests |
| `src/app/globals.css` | Add `.light {}` block, tokenise body, add `.nav-item-hover` utility |
| `src/components/layout/ThemeProvider.tsx` | **New** — applies `.light` class to `<html>` |
| `src/components/layout/__tests__/ThemeProvider.test.tsx` | **New** — ThemeProvider tests |
| `src/app/layout.tsx` | Wrap body with `<ThemeProvider>` |
| `src/components/layout/Topbar.tsx` | Sun/Moon toggle + hex → CSS var |
| `src/components/layout/Sidebar.tsx` | hex → CSS var |
| `src/components/layout/SidebarNav.tsx` | hex → CSS var |
| `src/components/layout/SidebarBusinessItem.tsx` | hex → CSS var |
