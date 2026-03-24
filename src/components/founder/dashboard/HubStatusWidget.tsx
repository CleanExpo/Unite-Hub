'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BUSINESSES } from '@/lib/businesses'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HubSatellite {
  id: string
  business_key: string
  business_name: string
  health_status: 'green' | 'yellow' | 'red' | 'unknown'
  open_linear_issues: number
  last_macas_verdict_date: string | null
  last_bookkeeper_run_date: string | null
  last_swept_at: string | null
  repo_url: string | null
  stack: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HEALTH_COLOURS: Record<string, string> = {
  green:   '#22c55e',
  yellow:  '#f59e0b',
  red:     '#ef4444',
  unknown: '#6b7280',
}

const HEALTH_LABELS: Record<string, string> = {
  green:   'Healthy',
  yellow:  'Needs attention',
  red:     'Critical',
  unknown: 'Not swept',
}

function formatRelative(isoDate: string | null): string {
  if (!isoDate) return 'Never'
  const date = new Date(isoDate)
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function getBusinessColour(key: string): string {
  return BUSINESSES.find(b => b.key === key)?.color ?? '#6b7280'
}

// ---------------------------------------------------------------------------
// Satellite Card
// ---------------------------------------------------------------------------

function SatelliteCard({ satellite }: { satellite: HubSatellite }) {
  const healthColor = HEALTH_COLOURS[satellite.health_status] ?? '#6b7280'
  const bizColor = getBusinessColour(satellite.business_key)

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      className="rounded-sm border p-4 flex flex-col gap-3"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Header: business dot + name + health chip */}
      <div className="flex items-center gap-2">
        <span
          className="rounded-full shrink-0"
          style={{ width: 8, height: 8, background: bizColor }}
        />
        <span
          className="text-[13px] font-medium flex-1 min-w-0 truncate"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {satellite.business_name}
        </span>
        <span
          className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
          style={{
            background: `${healthColor}18`,
            color: healthColor,
            border: `1px solid ${healthColor}30`,
          }}
        >
          {HEALTH_LABELS[satellite.health_status] ?? satellite.health_status}
        </span>
      </div>

      {/* Stack badge */}
      {satellite.stack && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-sm self-start"
          style={{
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--color-text-muted)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {satellite.stack}
        </span>
      )}

      {/* Metrics row */}
      <div className="flex flex-col gap-1.5 border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Linear issues</span>
          <span
            className="text-[10px] font-medium"
            style={{ color: satellite.open_linear_issues > 0 ? '#f59e0b' : 'var(--color-text-muted)' }}
          >
            {satellite.open_linear_issues}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Last MACAS</span>
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            {formatRelative(satellite.last_macas_verdict_date)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Bookkeeper</span>
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            {formatRelative(satellite.last_bookkeeper_run_date)}
          </span>
        </div>
      </div>

      {/* Last swept */}
      <div className="text-[10px]" style={{ color: 'var(--color-text-disabled)' }}>
        Swept: {formatRelative(satellite.last_swept_at)}
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Empty / not-seeded state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div
      className="rounded-sm border p-8 text-center"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--color-border)',
        borderStyle: 'dashed',
      }}
    >
      <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
        Hub satellites not yet initialised.
      </p>
      <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-disabled)' }}>
        Run the nightly hub sweep to populate satellite data.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

export function HubStatusWidget() {
  const [satellites, setSatellites] = useState<HubSatellite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/connected-projects')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<{ satellites: HubSatellite[] }>
      })
      .then(({ satellites: data }) => {
        setSatellites(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('[HubStatusWidget] Fetch error:', err)
        setError('Failed to load hub status')
        setLoading(false)
      })
  }, [])

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[16px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Hub Status
          </h2>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Owned satellites — live data from nightly sweep
          </p>
        </div>
        {!loading && satellites.length > 0 && (
          <span className="text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>
            {satellites.length} satellite{satellites.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div
          className="rounded-sm border p-6 text-center"
          style={{ background: 'var(--surface-card)', borderColor: 'var(--color-border)' }}
        >
          <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
            Loading satellites…
          </span>
        </div>
      ) : error ? (
        <div
          className="rounded-sm border p-6 text-center"
          style={{ background: 'var(--surface-card)', borderColor: 'var(--color-border)' }}
        >
          <span className="text-[12px]" style={{ color: '#ef4444' }}>{error}</span>
        </div>
      ) : satellites.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {satellites.map(satellite => (
            <SatelliteCard key={satellite.id} satellite={satellite} />
          ))}
        </div>
      )}
    </section>
  )
}
