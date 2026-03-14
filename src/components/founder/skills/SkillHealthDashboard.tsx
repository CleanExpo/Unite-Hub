'use client'

import { useEffect, useState } from 'react'

interface SkillHealthRecord {
  id: string
  founder_id: string
  skill_name: string
  eval_count: number
  pass_count: number
  pass_rate: number
  run_at: string
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function passRateColour(rate: number): string {
  if (rate >= 80) return '#22c55e'
  if (rate >= 60) return '#f59e0b'
  return '#ef4444'
}

export function SkillHealthDashboard() {
  const [records, setRecords] = useState<SkillHealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch('/api/skills/health')
        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error || 'Failed to fetch skill health')
        }
        const data: SkillHealthRecord[] = await res.json()
        setRecords(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchHealth()
  }, [])

  if (loading) {
    return (
      <div
        className="rounded-sm p-8 flex items-center justify-center"
        style={{ background: 'var(--surface-elevated)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-sm animate-pulse"
            style={{ background: '#00F5FF', opacity: 0.6 }}
          />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Loading skill evaluations...
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="rounded-sm p-6"
        style={{ background: 'var(--surface-elevated)' }}
      >
        <p className="text-sm" style={{ color: '#ef4444' }}>
          Error: {error}
        </p>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div
        className="rounded-sm p-8 text-center"
        style={{ background: 'var(--surface-elevated)' }}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No skill evaluations recorded yet. Run{' '}
          <code
            className="rounded-sm px-1.5 py-0.5 text-xs"
            style={{ background: 'rgba(0, 245, 255, 0.1)', color: '#00F5FF' }}
          >
            node scripts/skill-eval-runner.mjs --all
          </code>{' '}
          to get started.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-sm overflow-hidden"
      style={{ background: 'var(--surface-elevated)' }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            className="border-b"
            style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
          >
            <th
              className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Skill Name
            </th>
            <th
              className="text-right px-4 py-3 font-medium text-xs uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Evals
            </th>
            <th
              className="text-right px-4 py-3 font-medium text-xs uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Passed
            </th>
            <th
              className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Pass Rate
            </th>
            <th
              className="text-right px-4 py-3 font-medium text-xs uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Last Run
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const colour = passRateColour(record.pass_rate)
            return (
              <tr
                key={record.id}
                className="border-b last:border-b-0 transition-colors duration-100"
                style={{ borderColor: 'rgba(255, 255, 255, 0.04)' }}
              >
                <td
                  className="px-4 py-3 font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {record.skill_name}
                </td>
                <td
                  className="px-4 py-3 text-right tabular-nums"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {record.eval_count}
                </td>
                <td
                  className="px-4 py-3 text-right tabular-nums"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {record.pass_count}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-1.5 rounded-sm"
                      style={{
                        width: `${Math.max(record.pass_rate, 4)}%`,
                        maxWidth: '80px',
                        background: colour,
                        opacity: 0.8,
                      }}
                    />
                    <span
                      className="text-xs tabular-nums font-medium"
                      style={{ color: colour }}
                    >
                      {record.pass_rate.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td
                  className="px-4 py-3 text-right tabular-nums text-xs"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {formatDate(record.run_at)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
