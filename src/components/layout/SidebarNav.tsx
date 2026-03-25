// src/components/layout/SidebarNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Columns2, Lock, FileText, ClipboardCheck, Scale, Share2, FlaskConical, Users, Settings, Receipt, Mail, CalendarDays, Brain, Sparkles, BarChart2, Megaphone, ScrollText } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/founder/dashboard',   label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/founder/bookkeeper', label: 'Bookkeeper', icon: BookOpen },
  { href: '/founder/xero',      label: 'Xero',       icon: Receipt },
  { href: '/founder/invoices',  label: 'Invoices',   icon: ScrollText },
  { href: '/founder/kanban',     label: 'Kanban',     icon: Columns2 },
  { href: '/founder/vault',     label: 'Vault',      icon: Lock },
  { href: '/founder/notes',     label: 'Notes',      icon: FileText },
  { href: '/founder/approvals', label: 'Approvals',  icon: ClipboardCheck },
  { href: '/founder/advisory',  label: 'Advisory',   icon: Scale },
  { href: '/founder/strategy',  label: 'Strategy',   icon: Brain },
  { href: '/founder/social',    label: 'Social',     icon: Share2 },
  { href: '/founder/analytics', label: 'Analytics',  icon: BarChart2 },
  { href: '/founder/campaigns', label: 'Campaigns',  icon: Megaphone },
  { href: '/founder/experiments', label: 'Experiments', icon: FlaskConical },
  { href: '/founder/contacts',  label: 'Contacts',   icon: Users },
  { href: '/founder/email',     label: 'Email',      icon: Mail },
  { href: '/founder/calendar',  label: 'Calendar',   icon: CalendarDays },
  { href: '/founder/skills',   label: 'Skills',     icon: Sparkles },
  { href: '/founder/settings',  label: 'Settings',   icon: Settings },
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
              'nav-item-hover relative flex items-center gap-2 px-2 h-8 rounded-sm text-[13px] font-medium transition-colors duration-100',
              active
                ? 'before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:bg-[var(--color-accent)] before:rounded-r-sm'
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
