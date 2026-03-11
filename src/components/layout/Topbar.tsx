// src/components/layout/Topbar.tsx
'use client'

import { Menu, HelpCircle, Zap } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useUIStore } from '@/store/ui'

const BREADCRUMB_MAP: Record<string, string> = {
  '/founder/dashboard': 'Dashboard',
  '/founder/kanban':    'Kanban',
  '/founder/vault':     'Vault',
  '/founder/approvals': 'Approvals',
  '/founder/settings':  'Settings',
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
