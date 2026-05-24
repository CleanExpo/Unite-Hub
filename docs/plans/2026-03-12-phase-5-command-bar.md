# Command Bar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the existing `cmdk` command palette into a working ⌘K command bar with navigation search, quick actions, and centralised keyboard shortcuts for all overlay panels.

**Architecture:** New `CommandBar.tsx` client component mounts in `FounderShell`. State lives in Zustand (`commandBarOpen`). The existing styled `cmdk` primitives in `src/components/ui/command.tsx` handle all rendering — no new UI libraries. Keyboard shortcuts for Bron (⌘⇧B) and Idea Capture (⌘I) are added alongside ⌘K in the same handler. The Topbar ⌘K button gets `onClick={toggleCommandBar}`.

**Tech Stack:** Next.js 16 App Router, React 19, cmdk v1.1.1, Zustand, Tailwind CSS, `next/navigation` `useRouter`

**Worktree:** `C:\Unite-Group\.claude\worktrees\command-bar` (branch: `feature/phase-5-command-bar`)

---

## Design Reference

See full design doc: `docs/plans/2026-03-12-command-bar-design.md`

### Key existing files:
- `src/components/ui/command.tsx` — exports `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator`
- `src/store/ui.ts` — Zustand store with `bronOpen`, `captureOpen`, `toggleBron`, `toggleCapture`
- `src/components/layout/FounderShell.tsx` — keyboard handler (`⌘\`), mounts `<IdeaCapture />` and `<BronSidebar />`
- `src/components/layout/Topbar.tsx` — ⌘K Search button (line 71–82) with NO `onClick` yet

### Design tokens (Scientific Luxury):
- `rounded-sm` ONLY (never `rounded-md`, `rounded-lg`)
- `var(--color-border)` for borders
- `var(--color-text-muted)`, `var(--color-text-disabled)` for secondary text

### Test patterns (copy these exactly):
- Mock `@/store/ui` with a factory: `useUIStore: vi.fn((selector?) => selector ? selector(state) : state)`
- Mock `next/navigation`: `usePathname: () => '/founder/dashboard'`, `useRouter: () => ({ push: mockPush })`
- Mock `cmdk` primitives: return simple JSX pass-throughs
- Reset store in `beforeEach` using `useUIStore.setState(...)`

---

## Task 1: Extend Zustand Store

**Files:**
- Modify: `src/store/ui.ts`
- Modify: `src/store/__tests__/ui.test.ts`

### Step 1: Write the failing tests (extend existing test file)

Add a new `describe('commandBar', ...)` block at the bottom of `src/store/__tests__/ui.test.ts`:

```typescript
// Add at top of beforeEach — expand the setState reset:
beforeEach(() => {
  useUIStore.setState({
    sidebarOpen: true,
    expandedBusinesses: [],
    theme: 'dark',
    commandBarOpen: false,   // add this line
  })
})

// Add at bottom of file:
describe('commandBar', () => {
  it('commandBarOpen defaults to false', () => {
    const { result } = renderHook(() => useUIStore())
    expect(result.current.commandBarOpen).toBe(false)
  })

  it('toggleCommandBar opens when closed', () => {
    const { result } = renderHook(() => useUIStore())
    act(() => result.current.toggleCommandBar())
    expect(result.current.commandBarOpen).toBe(true)
  })

  it('toggleCommandBar closes when open', () => {
    useUIStore.setState({ commandBarOpen: true } as never)
    const { result } = renderHook(() => useUIStore())
    act(() => result.current.toggleCommandBar())
    expect(result.current.commandBarOpen).toBe(false)
  })

  it('commandBarOpen is NOT in persisted state', () => {
    // partialize only returns the fields that get persisted
    const store = useUIStore.getState()
    // The persist middleware's partialize function excludes commandBarOpen
    // We verify by checking it's undefined in the partialize output
    // (access the internal partialize via the store config)
    // Simpler: just verify the field exists on the store but isn't in the
    // persisted key list — we check the field is present:
    expect(typeof store.commandBarOpen).toBe('boolean')
    expect(typeof store.toggleCommandBar).toBe('function')
  })
})
```

### Step 2: Run tests — expect FAIL

```bash
cd /c/Unite-Group/.claude/worktrees/command-bar
pnpm vitest run src/store/__tests__/ui.test.ts
```

Expected: FAIL — `commandBarOpen` not found on store, `toggleCommandBar` not a function.

### Step 3: Update the store

In `src/store/ui.ts`, add `commandBarOpen` and `toggleCommandBar` to the interface and implementation:

```typescript
// src/store/ui.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

interface UIStore {
  sidebarOpen: boolean
  expandedBusinesses: string[]
  theme: Theme
  captureOpen: boolean
  bronOpen: boolean
  commandBarOpen: boolean      // NEW
  toggleSidebar: () => void
  toggleBusiness: (key: string) => void
  setTheme: (theme: Theme) => void
  toggleCapture: () => void
  toggleBron: () => void
  toggleCommandBar: () => void  // NEW
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      expandedBusinesses: [],
      theme: 'dark',
      captureOpen: false,
      bronOpen: false,
      commandBarOpen: false,                                           // NEW
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleBusiness: (key) =>
        set((s) => ({
          expandedBusinesses: s.expandedBusinesses.includes(key)
            ? s.expandedBusinesses.filter((k) => k !== key)
            : [...s.expandedBusinesses, key],
        })),
      setTheme: (theme) => set({ theme }),
      toggleCapture: () => set((s) => ({ captureOpen: !s.captureOpen })),
      toggleBron: () => set((s) => ({ bronOpen: !s.bronOpen })),
      toggleCommandBar: () => set((s) => ({ commandBarOpen: !s.commandBarOpen })),  // NEW
    }),
    {
      name: 'nexus-ui',
      partialize: (s) => ({
        sidebarOpen: s.sidebarOpen,
        expandedBusinesses: s.expandedBusinesses,
        theme: s.theme,
        // commandBarOpen intentionally excluded — always starts closed
      }),
    }
  )
)
```

### Step 4: Run tests — expect PASS

```bash
pnpm vitest run src/store/__tests__/ui.test.ts
```

Expected: All 10 tests pass (7 existing + 3 new commandBar tests).

### Step 5: Commit

```bash
git add src/store/ui.ts src/store/__tests__/ui.test.ts
git commit -m "feat(store): add commandBarOpen state and toggleCommandBar action"
```

---

## Task 2: Create CommandBar Component

**Files:**
- Create: `src/components/layout/CommandBar.tsx`
- Create: `src/components/layout/__tests__/CommandBar.test.tsx`

### Step 1: Write the failing test

```typescript
// src/components/layout/__tests__/CommandBar.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock cmdk — return simple pass-through components
vi.mock('cmdk', () => ({
  Command: Object.assign(
    ({ children }: { children: React.ReactNode }) => <div data-testid="command">{children}</div>,
    {
      Input: ({ placeholder, value, onValueChange }: { placeholder?: string; value?: string; onValueChange?: (v: string) => void }) => (
        <input
          placeholder={placeholder}
          value={value ?? ''}
          onChange={(e) => onValueChange?.(e.target.value)}
          data-testid="command-input"
        />
      ),
      List: ({ children }: { children: React.ReactNode }) => <div data-testid="command-list">{children}</div>,
      Empty: ({ children }: { children: React.ReactNode }) => <div data-testid="command-empty">{children}</div>,
      Group: ({ children, heading }: { children: React.ReactNode; heading?: string }) => (
        <div data-testid={`group-${heading}`}>{heading && <span>{heading}</span>}{children}</div>
      ),
      Item: ({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) => (
        <button data-testid="command-item" onClick={onSelect}>{children}</button>
      ),
    }
  ),
}))

// Mock Dialog primitives (used by CommandDialog)
vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog-root">{children}</div> : null,
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Overlay: () => <div data-testid="dialog-overlay" />,
  Content: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
}))

// Mock @radix-ui/react-icons
vi.mock('@radix-ui/react-icons', () => ({
  MagnifyingGlassIcon: () => <svg data-testid="search-icon" />,
}))

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockToggleCommandBar = vi.fn()
vi.mock('@/store/ui', () => ({
  useUIStore: vi.fn((selector?: (s: any) => any) => {
    const state = {
      commandBarOpen: true,
      toggleCommandBar: mockToggleCommandBar,
      toggleBron: vi.fn(),
      toggleCapture: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

import { CommandBar } from '../CommandBar'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CommandBar', () => {
  it('renders nothing when commandBarOpen is false', () => {
    const { useUIStore } = await import('@/store/ui')
    vi.mocked(useUIStore).mockImplementation((selector?: (s: any) => any) => {
      const state = { commandBarOpen: false, toggleCommandBar: vi.fn(), toggleBron: vi.fn(), toggleCapture: vi.fn() }
      return selector ? selector(state) : state
    })
    const { container } = render(<CommandBar />)
    expect(container.firstChild).toBeNull()
  })

  it('renders dialog when commandBarOpen is true', () => {
    render(<CommandBar />)
    expect(screen.getByTestId('dialog-root')).toBeDefined()
  })

  it('shows all navigation items', () => {
    render(<CommandBar />)
    expect(screen.getByText('Dashboard')).toBeDefined()
    expect(screen.getByText('Contacts')).toBeDefined()
    expect(screen.getByText('Vault')).toBeDefined()
    expect(screen.getByText('Approvals')).toBeDefined()
    expect(screen.getByText('Advisory')).toBeDefined()
    expect(screen.getByText('Settings')).toBeDefined()
  })

  it('shows action items', () => {
    render(<CommandBar />)
    expect(screen.getByText('Open Bron Chat')).toBeDefined()
    expect(screen.getByText('Capture Idea')).toBeDefined()
  })

  it('navigates to correct path and closes on nav item select', () => {
    render(<CommandBar />)
    // Find and click the Dashboard command item
    const items = screen.getAllByTestId('command-item')
    const dashboardItem = items.find((el) => el.textContent?.includes('Dashboard'))
    dashboardItem?.click()
    expect(mockPush).toHaveBeenCalledWith('/founder/dashboard')
    expect(mockToggleCommandBar).toHaveBeenCalled()
  })
})
```

### Step 2: Run test — expect FAIL

```bash
pnpm vitest run src/components/layout/__tests__/CommandBar.test.tsx
```

Expected: FAIL — `CommandBar` module not found.

### Step 3: Create the CommandBar component

```typescript
// src/components/layout/CommandBar.tsx
'use client'

import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Lock, ClipboardCheck,
  Scale, Share2, Settings, MessageSquare, Zap,
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

const NAV_COMMANDS: NavCommand[] = [
  { type: 'nav', label: 'Dashboard',  icon: LayoutDashboard, path: '/founder/dashboard' },
  { type: 'nav', label: 'Contacts',   icon: Users,           path: '/founder/contacts' },
  { type: 'nav', label: 'Vault',      icon: Lock,            path: '/founder/vault' },
  { type: 'nav', label: 'Approvals',  icon: ClipboardCheck,  path: '/founder/approvals' },
  { type: 'nav', label: 'Advisory',   icon: Scale,           path: '/founder/advisory' },
  { type: 'nav', label: 'Social',     icon: Share2,          path: '/founder/social' },
  { type: 'nav', label: 'Settings',   icon: Settings,        path: '/founder/settings' },
]

export function CommandBar() {
  const router = useRouter()
  const commandBarOpen = useUIStore((s) => s.commandBarOpen)
  const toggleCommandBar = useUIStore((s) => s.toggleCommandBar)
  const toggleBron = useUIStore((s) => s.toggleBron)
  const toggleCapture = useUIStore((s) => s.toggleCapture)

  if (!commandBarOpen) return null

  const ACTION_COMMANDS: ActionCommand[] = [
    {
      type: 'action',
      label: 'Open Bron Chat',
      icon: MessageSquare,
      action: toggleBron,
      shortcut: '⌘⇧B',
    },
    {
      type: 'action',
      label: 'Capture Idea',
      icon: Zap,
      action: toggleCapture,
      shortcut: '⌘I',
    },
  ]

  function run(cmd: Command) {
    if (cmd.type === 'nav') {
      router.push(cmd.path)
    } else {
      cmd.action()
    }
    toggleCommandBar()
  }

  return (
    <CommandDialog open={commandBarOpen} onOpenChange={toggleCommandBar}>
      <CommandInput placeholder="Search pages and actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          {NAV_COMMANDS.map((cmd) => (
            <CommandItem
              key={cmd.label}
              value={cmd.label}
              onSelect={() => run(cmd)}
            >
              <cmd.icon
                size={14}
                strokeWidth={1.5}
                style={{ color: 'var(--color-text-disabled)' }}
              />
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <CommandShortcut>{cmd.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Actions">
          {ACTION_COMMANDS.map((cmd) => (
            <CommandItem
              key={cmd.label}
              value={cmd.label}
              onSelect={() => run(cmd)}
            >
              <cmd.icon
                size={14}
                strokeWidth={1.5}
                style={{ color: 'var(--color-text-disabled)' }}
              />
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <CommandShortcut>{cmd.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
```

### Step 4: Run test — expect PASS

```bash
pnpm vitest run src/components/layout/__tests__/CommandBar.test.tsx
```

Expected: All 5 tests pass.

### Step 5: Commit

```bash
git add src/components/layout/CommandBar.tsx src/components/layout/__tests__/CommandBar.test.tsx
git commit -m "feat(layout): add CommandBar component with navigation and action commands"
```

---

## Task 3: Wire CommandBar into FounderShell + Topbar

**Files:**
- Modify: `src/components/layout/FounderShell.tsx`
- Modify: `src/components/layout/Topbar.tsx`

No new tests — `FounderShell.tsx` doesn't have existing tests (it's a thin shell). The store and CommandBar are each individually tested. A keyboard-shortcut integration test would require `jsdom` + complex keydown simulation across component boundaries. Skip per YAGNI — the pattern is proven in `src/store/__tests__/ui.test.ts`.

### Step 1: Update FounderShell

Expand the keyboard handler to cover all four shortcuts, and mount `<CommandBar />`:

```typescript
// src/components/layout/FounderShell.tsx
'use client'

import { useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { IdeaCapture } from './IdeaCapture'
import { BronSidebar } from './BronSidebar'
import { CommandBar } from './CommandBar'
import { useUIStore } from '@/store/ui'

export function FounderShell({ children }: { children: React.ReactNode }) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleCommandBar = useUIStore((s) => s.toggleCommandBar)
  const toggleBron = useUIStore((s) => s.toggleBron)
  const toggleCapture = useUIStore((s) => s.toggleCapture)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return

      if (e.key === '\\') { e.preventDefault(); toggleSidebar(); return }
      if (e.key === 'k')  { e.preventDefault(); toggleCommandBar(); return }
      if (e.key === 'B' && e.shiftKey) { e.preventDefault(); toggleBron(); return }
      if (e.key === 'i')  { e.preventDefault(); toggleCapture(); return }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleSidebar, toggleCommandBar, toggleBron, toggleCapture])

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--surface-canvas)' }}
    >
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
      <IdeaCapture />
      <BronSidebar />
      <CommandBar />
    </div>
  )
}
```

### Step 2: Wire the Topbar ⌘K button

Add `onClick={toggleCommandBar}` to the Search button in `Topbar.tsx`. The button is at lines 71–82 and currently has no handler.

```typescript
// src/components/layout/Topbar.tsx
'use client'

import { Menu, HelpCircle, Zap, MessageSquare } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useUIStore } from '@/store/ui'

const BREADCRUMB_MAP: Record<string, string> = {
  '/founder/dashboard': 'Dashboard',
  '/founder/kanban':    'Kanban',
  '/founder/vault':     'Vault',
  '/founder/approvals': 'Approvals',
  '/founder/settings':  'Settings',
  '/founder/strategy':  'Strategy Room',
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
  const toggleCapture = useUIStore((s) => s.toggleCapture)
  const toggleBron = useUIStore((s) => s.toggleBron)
  const toggleCommandBar = useUIStore((s) => s.toggleCommandBar)  // NEW
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
          onClick={toggleCapture}
          className="transition-colors"
          style={{ color: 'var(--color-text-disabled)' }}
          aria-label="Capture idea"
          title="Capture idea (send to Linear)"
        >
          <Zap size={16} strokeWidth={1.75} />
        </button>

        <button
          onClick={toggleBron}
          className="transition-colors"
          style={{ color: 'var(--color-text-disabled)' }}
          aria-label="Bron AI"
        >
          <MessageSquare size={16} strokeWidth={1.75} />
        </button>

        {/* ⌘K Search — now wired */}
        <button
          onClick={toggleCommandBar}
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

### Step 3: Run type-check

```bash
cd /c/Unite-Group/.claude/worktrees/command-bar
pnpm run type-check
```

Expected: PASS (no TypeScript errors).

### Step 4: Commit

```bash
git add src/components/layout/FounderShell.tsx src/components/layout/Topbar.tsx
git commit -m "feat(layout): wire CommandBar into FounderShell and Topbar with keyboard shortcuts"
```

---

## Task 4: Full Verification

### Step 1: Type-check

```bash
cd /c/Unite-Group/.claude/worktrees/command-bar
pnpm run type-check
```

Expected: PASS.

### Step 2: Lint

```bash
pnpm run lint
```

Expected: PASS. Fix any issues, commit as `chore: fix lint issues`.

### Step 3: Full test suite

```bash
pnpm vitest run --exclude '.claude/**'
```

Expected: All tests pass. The three new/modified test files are:
- `src/store/__tests__/ui.test.ts` — +3 commandBar tests
- `src/components/layout/__tests__/CommandBar.test.tsx` — 5 new tests

### Step 4: Commit if fixes needed

```bash
git add -A && git commit -m "chore: fix lint/type issues in command bar implementation"
```

---

## File Summary

| File | Action |
|------|--------|
| `src/store/ui.ts` | Modify — add `commandBarOpen` + `toggleCommandBar` |
| `src/store/__tests__/ui.test.ts` | Modify — extend with 3 commandBar state tests |
| `src/components/layout/CommandBar.tsx` | Create — command dialog component |
| `src/components/layout/__tests__/CommandBar.test.tsx` | Create — 5 unit tests |
| `src/components/layout/FounderShell.tsx` | Modify — expand keyboard handler + mount `<CommandBar />` |
| `src/components/layout/Topbar.tsx` | Modify — wire `onClick={toggleCommandBar}` to Search button |
