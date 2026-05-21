'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { InsightCard, type Insight, type InsightStatus } from './InsightCard'
import { BusinessFilter } from '@/components/founder/kanban/BusinessFilter'

const COLUMNS: { status: InsightStatus; label: string }[] = [
  { status: 'new',       label: 'NEW' },
  { status: 'reviewing', label: 'REVIEWING' },
  { status: 'acting',    label: 'ACTING' },
  { status: 'done',      label: 'DONE' },
]

export function InsightsBoard() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [businessFilter, setBusinessFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (businessFilter) params.set('business', businessFilter)
      const res = await fetch(`/api/strategy/insights?${params}`)
      const d = await res.json() as { insights: Insight[] }
      setInsights(d.insights ?? [])
      setLastRefresh(new Date())
    } catch {
      // Silently fail — board shows stale data
    } finally {
      setLoading(false)
    }
  }, [businessFilter])

  // Initial load + filter change
  useEffect(() => {
    void fetchInsights()
  }, [fetchInsights])

  // Poll every 60s for new cron-generated insights
  useEffect(() => {
    const id = setInterval(() => void fetchInsights(), 60_000)
    return () => clearInterval(id)
  }, [fetchInsights])

  function handleStatusChange(id: string, status: InsightStatus) {
    setInsights((prev) => prev.map((ins) => ins.id === id ? { ...ins, status } : ins))
  }

  const byStatus = (status: InsightStatus) =>
    insights.filter((ins) => ins.status === status)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <BusinessFilter activeFilter={businessFilter} onFilterChange={setBusinessFilter} />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>
            {lastRefresh.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={() => void fetchInsights()}
            disabled={loading}
            className="p-1.5 rounded-sm border transition-colors disabled:opacity-40"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-disabled)' }}
            aria-label="Refresh insights"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(({ status, label }) => {
          const cards = byStatus(status)
          return (
            <div key={status} className="space-y-2">
              {/* Column header */}
              <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'var(--color-text-disabled)' }}>
                  {label}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-sm"
                  style={{ background: 'var(--surface-canvas)', color: 'var(--color-text-disabled)' }}
                >
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              {cards.length === 0 ? (
                <p className="text-[11px] py-4 text-center" style={{ color: 'var(--color-text-disabled)' }}>
                  {status === 'new' && !loading ? 'Insights arrive at 02:00 AEST' : '—'}
                </p>
              ) : (
                cards.map((ins) => (
                  <InsightCard
                    key={ins.id}
                    insight={ins}
                    onStatusChange={handleStatusChange}
                  />
                ))
              )}
            </div>
          )
        })}
      </div>

      {loading && insights.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <span className="text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>Loading insights…</span>
        </div>
      )}
    </div>
  )
}
