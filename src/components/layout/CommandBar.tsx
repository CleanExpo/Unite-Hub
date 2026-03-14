'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Lock, ClipboardCheck,
  Scale, Share2, Settings, MessageSquare, Zap,
  BookOpen, Receipt, Columns2, FileText, Mail,
  CalendarDays, Brain,
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
  { type: 'nav', label: 'Bookkeeper', icon: BookOpen,        path: '/founder/bookkeeper' },
  { type: 'nav', label: 'Xero',       icon: Receipt,         path: '/founder/xero' },
  { type: 'nav', label: 'Kanban',     icon: Columns2,        path: '/founder/kanban' },
  { type: 'nav', label: 'Vault',      icon: Lock,            path: '/founder/vault' },
  { type: 'nav', label: 'Notes',      icon: FileText,        path: '/founder/notes' },
  { type: 'nav', label: 'Approvals',  icon: ClipboardCheck,  path: '/founder/approvals' },
  { type: 'nav', label: 'Advisory',   icon: Scale,           path: '/founder/advisory' },
  { type: 'nav', label: 'Strategy',   icon: Brain,           path: '/founder/strategy' },
  { type: 'nav', label: 'Social',     icon: Share2,          path: '/founder/social' },
  { type: 'nav', label: 'Contacts',   icon: Users,           path: '/founder/contacts' },
  { type: 'nav', label: 'Email',      icon: Mail,            path: '/founder/email' },
  { type: 'nav', label: 'Calendar',   icon: CalendarDays,    path: '/founder/calendar' },
  { type: 'nav', label: 'Settings',   icon: Settings,        path: '/founder/settings' },
]

export function CommandBar() {
  const router = useRouter()
  const commandBarOpen = useUIStore((s) => s.commandBarOpen)
  const toggleCommandBar = useUIStore((s) => s.toggleCommandBar)
  const toggleBron = useUIStore((s) => s.toggleBron)
  const toggleCapture = useUIStore((s) => s.toggleCapture)

  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)

  // Memoised to avoid re-creating the array on every render — only rebuilds when toggle fns change
  const ACTION_COMMANDS: ActionCommand[] = useMemo(() => [
    {
      type: 'action',
      label: 'Open Bron Chat',
      icon: MessageSquare,
      action: toggleBron,
      shortcut: '\u2318\u21E7B',
    },
    {
      type: 'action',
      label: 'Capture Idea',
      icon: Zap,
      action: toggleCapture,
      shortcut: '\u2318I',
    },
  ], [toggleBron, toggleCapture])

  // Debounced search effect
  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const controller = new AbortController()

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        if (!res.ok) {
          setResults(null)
          setLoading(false)
          return
        }
        const data: SearchResults = await res.json()
        setResults(data)
        setLoading(false)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setResults(null)
        setLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  // Reset all search state when the dialog closes
  useEffect(() => {
    if (!commandBarOpen) {
      setQuery('')
      setResults(null)
      setLoading(false)
    }
  }, [commandBarOpen])

  if (!commandBarOpen) return null

  function run(cmd: Command) {
    if (cmd.type === 'nav') {
      router.push(cmd.path)
    } else {
      cmd.action()
    }
    toggleCommandBar()
  }

  const isSearchMode = query.length >= 2

  return (
    <CommandDialog open={commandBarOpen} onOpenChange={toggleCommandBar} shouldFilter={!isSearchMode}>
      <CommandInput
        placeholder="Search pages and actions\u2026"
        onValueChange={setQuery}
        value={query}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Nav + Actions — only visible in non-search mode (cmdk filters them) */}
        {!isSearchMode && (
          <>
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
          </>
        )}

        {/* Loading state */}
        {isSearchMode && loading && (
          <CommandEmpty>{'Searching\u2026'}</CommandEmpty>
        )}

        {/* Search results */}
        {isSearchMode && !loading && results && (
          <>
            {results.contacts.length > 0 && (
              <CommandGroup heading="Contacts">
                {results.contacts.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.id}
                    onSelect={() => { router.push('/founder/contacts'); toggleCommandBar() }}
                  >
                    <span>{c.name}</span>
                    {c.company && (
                      <span style={{ color: 'var(--color-text-disabled)' }}>{c.company}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.pages.length > 0 && (
              <CommandGroup heading="Pages">
                {results.pages.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.id}
                    onSelect={() => { router.push(`/founder/notes`); toggleCommandBar() }}
                  >
                    <span>{p.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.approvals.length > 0 && (
              <CommandGroup heading="Approvals">
                {results.approvals.map((a) => (
                  <CommandItem
                    key={a.id}
                    value={a.id}
                    onSelect={() => { router.push('/founder/approvals'); toggleCommandBar() }}
                  >
                    <span>{a.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
