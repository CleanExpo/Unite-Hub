'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { AdvisoryCase } from '@/lib/advisory/types'
import { CaseCard } from '../shared/CaseCard'

export function CasesTab() {
  const [cases, setCases] = useState<AdvisoryCase[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    async function fetchCases() {
      try {
        const res = await fetch('/api/advisory/cases')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setCases(data.cases ?? [])
      } catch (err) {
        console.error('[CasesTab] fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCases()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>
          Loading cases...
        </span>
      </div>
    )
  }

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
          No advisory cases yet
        </span>
        <button
          onClick={() => router.replace(pathname + '?tab=new', { scroll: false })}
          className="text-[12px] font-medium px-3 py-1.5 rounded-sm transition-colors"
          style={{ background: '#00F5FF18', color: '#00F5FF', border: '1px solid #00F5FF30' }}
        >
          Create your first case
        </button>
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
