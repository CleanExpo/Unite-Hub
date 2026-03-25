// src/components/layout/Topbar.tsx
'use client'

import { Menu, HelpCircle, Zap } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useUIStore } from '@/store/ui'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

const BREADCRUMB_MAP: Record<string, string> = {
  '/founder/dashboard':   'Dashboard',
  '/founder/bookkeeper':  'Bookkeeper',
  '/founder/xero':        'Xero',
  '/founder/invoices':    'Invoices',
  '/founder/kanban':      'Kanban',
  '/founder/vault':       'Vault',
  '/founder/notes':       'Notes',
  '/founder/approvals':   'Approvals',
  '/founder/advisory':    'Advisory',
  '/founder/strategy':    'Strategy Room',
  '/founder/social':      'Social',
  '/founder/analytics':   'Analytics',
  '/founder/campaigns':   'Campaigns',
  '/founder/experiments': 'Experiments',
  '/founder/contacts':    'Contacts',
  '/founder/email':       'Email',
  '/founder/calendar':    'Calendar',
  '/founder/skills':      'Skills',
  '/founder/settings':    'Settings',
}

function getBreadcrumb(pathname: string): string {
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname]
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'founder' && parts.length >= 2) {
    const seg = parts[1]
    const sub = parts[2]
    const label = seg.charAt(0).toUpperCase() + seg.slice(1)
    return sub ? `${label} / ${sub.charAt(0).toUpperCase() + sub.slice(1)}` : label
  }
  return 'Nexus'
}

export function Topbar() {
  const pathname = usePathname()
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const toggleCapture = useUIStore((s) => s.toggleCapture)
  const toggleCommandBar = useUIStore((s) => s.toggleCommandBar)
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

        <Popover>
          <PopoverTrigger asChild>
            <button
              className="transition-colors"
              style={{ color: 'var(--color-text-disabled)' }}
              aria-label="Help"
            >
              <HelpCircle size={16} strokeWidth={1.75} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-56 rounded-sm p-3"
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p
              className="text-[10px] font-medium tracking-widest uppercase mb-2"
              style={{ color: 'var(--color-text-disabled)' }}
            >
              Keyboard Shortcuts
            </p>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'Command Bar',    keys: '⌘K' },
                { label: 'Capture Idea',   keys: '⌘I' },
                { label: 'Toggle Sidebar', keys: '⌘\\' },
              ].map((s) => (
                <div key={s.keys} className="flex items-center justify-between text-[12px]">
                  <span style={{ color: 'var(--color-text-muted)' }}>{s.label}</span>
                  <kbd
                    className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm"
                    style={{
                      background: 'var(--surface-card)',
                      color: 'var(--color-text-disabled)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
