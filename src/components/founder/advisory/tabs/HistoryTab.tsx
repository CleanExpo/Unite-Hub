'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { AdvisoryCase } from '@/lib/advisory/types'
import { CaseCard } from '../shared/CaseCard'

export function HistoryTab() {
  const [cases, setCases] = useState<AdvisoryCase[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    async function fetchHistory() {
      try {
        // Fetch all non-draft cases
        const statuses = ['judged', 'pending_review', 'approved', 'rejected', 'executed', 'closed']
        const results = await Promise.all(
          statuses.map(s =>
            fetch(`/api/advisory/cases?status=${s}&pageSize=50`)
              .then(r => r.json())
              .catch(() => ({ cases: [] }))
          )
        )
        const all = results.flatMap(r => r.cases ?? [])
        all.sort((a: AdvisoryCase, b: AdvisoryCase) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        setCases(all)
      } catch (err) {
        console.error('[HistoryTab] fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>
          Loading history...
        </span>
      </div>
    )
  }

  if (cases.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>
          No completed cases yet.
        </span>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cases.map((c) => (
        <CaseCard
          key={c.id}
          case_={c}
          onClick={() => router.replace(pathname + '?tab=live&case=' + c.id, { scroll: false })}
        />
      ))}
    </div>
  )
}
