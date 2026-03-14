'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FlaskConical } from 'lucide-react'

interface Experiment {
  id: string
  title: string
  status: string
  statistical_significance?: number | null
}

export function ExperimentsDashboardWidget() {
  const [activeCount, setActiveCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [significantCount, setSignificantCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/experiments?status=active').then(r => r.json()).catch(() => []),
      fetch('/api/experiments?status=completed').then(r => r.json()).catch(() => []),
    ])
      .then(([activeData, completedData]: [Experiment[], Experiment[]]) => {
        const active = Array.isArray(activeData) ? activeData : []
        const completed = Array.isArray(completedData) ? completedData : []
        setActiveCount(active.length)
        setCompletedCount(completed.length)
        setSignificantCount(
          completed.filter(e => e.statistical_significance != null && e.statistical_significance >= 95).length
        )
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div
      className="rounded-sm p-4"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical size={16} strokeWidth={1.5} style={{ color: 'var(--color-text-disabled)' }} />
        <span className="text-[13px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Experiments
        </span>
      </div>

      {loading ? (
        <p className="text-[13px]" style={{ color: 'var(--color-text-disabled)' }}>Loading...</p>
      ) : (
        <div className="space-y-3">
          {/* Active */}
          <div className="flex items-center justify-between">
            <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>Active</span>
            <span className="text-[18px] font-semibold" style={{ color: '#00F5FF' }}>
              {activeCount}
            </span>
          </div>

          {/* Completed */}
          <div className="flex items-center justify-between">
            <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>Completed</span>
            <span className="text-[18px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {completedCount}
            </span>
          </div>

          {/* Significance highlight */}
          {significantCount > 0 && (
            <div
              className="rounded-sm px-3 py-2 mt-1"
              style={{ background: 'rgba(0, 245, 255, 0.06)', border: '1px solid rgba(0, 245, 255, 0.12)' }}
            >
              <p className="text-[11px] font-medium" style={{ color: '#00F5FF' }}>
                {significantCount} result{significantCount !== 1 ? 's' : ''} ready for review
              </p>
            </div>
          )}

          {/* Footer link */}
          <div className="border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <Link
              href="/founder/experiments"
              className="text-[11px] font-medium"
              style={{ color: '#00F5FF' }}
            >
              View Experiments →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
