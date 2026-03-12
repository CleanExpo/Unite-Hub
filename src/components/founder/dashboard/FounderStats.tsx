'use client'

import { useState, useEffect } from 'react'
import { Users, Lock, ClipboardCheck, Scale, BookOpen } from 'lucide-react'

interface DashboardStats {
  contacts: number
  vaultEntries: number
  pendingApprovals: number
  activeCases: number
  lastBookkeeperRun: {
    status: string
    createdAt: string
  } | null
}

const HIGHLIGHT_COLOUR = '#f97316'

const STAT_ITEMS = [
  { key: 'contacts',         label: 'Contacts', icon: Users,          field: 'contacts' as const },
  { key: 'vault',            label: 'Vault',    icon: Lock,           field: 'vaultEntries' as const },
  { key: 'pendingApprovals', label: 'Pending',  icon: ClipboardCheck, field: 'pendingApprovals' as const },
  { key: 'activeCases',      label: 'Cases',    icon: Scale,          field: 'activeCases' as const },
]

export function FounderStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((res) => {
        if (!res.ok) throw new Error('Failed')
        return res.json() as Promise<DashboardStats>
      })
      .then(setStats)
      .catch(() => {
        setStats({
          contacts: 0,
          vaultEntries: 0,
          pendingApprovals: 0,
          activeCases: 0,
          lastBookkeeperRun: null,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const bookkeeperLabel = stats?.lastBookkeeperRun
    ? `Last run: ${new Date(stats.lastBookkeeperRun.createdAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })}`
    : 'No runs yet'

  return (
    <div
      className="rounded-sm p-4"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-x-6 gap-y-3 flex-wrap">
        {/* Section label */}
        <span
          className="text-[11px] font-medium tracking-widest uppercase mr-1"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Founder Overview
        </span>

        {/* Stat pills */}
        {STAT_ITEMS.map(({ key, label, icon: Icon, field }) => {
          const value = loading ? null : (stats?.[field] ?? 0)
          const highlight = field === 'pendingApprovals' && (value ?? 0) > 0

          return (
            <div key={key} className="flex items-center gap-2">
              <Icon
                size={14}
                strokeWidth={1.5}
                style={{ color: highlight ? HIGHLIGHT_COLOUR : 'var(--color-text-disabled)' }}
              />
              <span
                className="text-[18px] font-semibold tabular-nums"
                style={{ color: highlight ? HIGHLIGHT_COLOUR : 'var(--color-text-primary)' }}
              >
                {value !== null ? value : '\u2014'}
              </span>
              <span
                className="text-[11px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {label}
              </span>
            </div>
          )
        })}

        {/* Bookkeeper status */}
        <div className="flex items-center gap-2 ml-auto">
          <BookOpen
            size={14}
            strokeWidth={1.5}
            style={{ color: 'var(--color-text-disabled)' }}
          />
          <span
            className="text-[11px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {loading ? '\u2014' : bookkeeperLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
