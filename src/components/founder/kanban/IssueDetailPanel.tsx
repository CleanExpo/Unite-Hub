'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BUSINESSES } from '@/lib/businesses'

interface IssueDetail {
  id: string
  identifier: string
  title: string
  description: string | null
  priority: number
  url: string
  createdAt: string
  updatedAt: string
  team: { id: string; key: string; name: string }
  state: { id: string; name: string; type: string }
  labels: { nodes: { id: string; name: string; color: string }[] }
  businessKey: string
  businessColor: string
}

interface IssueDetailPanelProps {
  issueId: string
  onClose: () => void
}

const PRIORITY_CONFIG: Record<number, { label: string; colour: string }> = {
  1: { label: 'Urgent', colour: '#ef4444' },
  2: { label: 'High', colour: '#f97316' },
  3: { label: 'Normal', colour: '#3b82f6' },
  4: { label: 'Low', colour: '#6b7280' },
  0: { label: 'None', colour: '#6b7280' },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function IssueDetailPanel({ issueId, onClose }: IssueDetailPanelProps) {
  const [issue, setIssue] = useState<IssueDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/linear/issues/${issueId}`)
        if (!res.ok) throw new Error(`${res.status}`)
        const data = await res.json()
        if (!cancelled) setIssue(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load issue')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [issueId])

  const priority = PRIORITY_CONFIG[issue?.priority ?? 0] ?? PRIORITY_CONFIG[0]
  const business = BUSINESSES.find((b) => b.key === issue?.businessKey)

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        key="panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 h-full w-96 z-50 overflow-y-auto"
        style={{
          background: 'var(--surface-card)',
          borderLeft: '1px solid var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-sm transition-colors duration-150 hover:bg-[#1a1a1a]"
          style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}
          aria-label="Close panel"
        >
          ✕
        </button>

        <div className="p-5 pt-10 flex flex-col gap-4">
          {loading && (
            <div className="flex flex-col gap-3">
              <div className="h-4 w-24 rounded-sm animate-pulse" style={{ background: 'var(--surface-elevated)' }} />
              <div className="h-6 w-full rounded-sm animate-pulse" style={{ background: 'var(--surface-elevated)' }} />
              <div className="h-4 w-32 rounded-sm animate-pulse" style={{ background: 'var(--surface-elevated)' }} />
              <div className="h-20 w-full rounded-sm animate-pulse" style={{ background: 'var(--surface-elevated)' }} />
            </div>
          )}

          {error && (
            <p className="text-[13px]" style={{ color: '#ef4444' }}>
              Failed to load issue: {error}
            </p>
          )}

          {issue && !loading && (
            <>
              {/* Identifier + Title */}
              <div>
                <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                  {issue.identifier}
                </span>
                <h2 className="text-[13px] font-medium mt-1" style={{ color: 'var(--color-text-primary)' }}>
                  {issue.title}
                </h2>
              </div>

              {/* Priority + State + Business */}
              <div className="flex flex-wrap gap-2">
                {/* Priority badge */}
                <span
                  className="text-[10px] px-2 py-0.5 rounded-sm font-medium"
                  style={{ background: `${priority.colour}20`, color: priority.colour, border: `1px solid ${priority.colour}40` }}
                >
                  {priority.label}
                </span>

                {/* State badge */}
                <span
                  className="text-[10px] px-2 py-0.5 rounded-sm"
                  style={{ background: 'var(--surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                >
                  {issue.state.name}
                </span>

                {/* Business badge */}
                {business && (
                  <span
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-sm"
                    style={{ background: 'var(--surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: issue.businessColor }}
                    />
                    {business.name}
                  </span>
                )}
              </div>

              {/* Description */}
              {issue.description && (
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    Description
                  </h3>
                  <p
                    className="text-[11px] whitespace-pre-wrap leading-relaxed"
                    style={{ color: 'var(--color-text-secondary, #a0a0a0)' }}
                  >
                    {issue.description}
                  </p>
                </div>
              )}

              {/* Labels */}
              {issue.labels.nodes.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    Labels
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {issue.labels.nodes.map((label) => (
                      <span
                        key={label.id}
                        className="text-[10px] px-2 py-0.5 rounded-sm"
                        style={{
                          background: `${label.color}20`,
                          color: label.color,
                          border: `1px solid ${label.color}40`,
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="flex gap-6 mt-1">
                <div>
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    Created
                  </span>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                    {formatDate(issue.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    Updated
                  </span>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                    {formatDate(issue.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Open in Linear */}
              <a
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] mt-2 transition-opacity duration-150 hover:opacity-80"
                style={{ color: '#00F5FF' }}
              >
                Open in Linear
                <span style={{ fontSize: '10px' }}>↗</span>
              </a>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
