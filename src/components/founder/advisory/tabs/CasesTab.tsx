'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Scale } from 'lucide-react'
import type { AdvisoryCase } from '@/lib/advisory/types'
import { CaseCard } from '../shared/CaseCard'
import { EmptyState } from '@/components/ui/EmptyState'

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
      <EmptyState
        icon={Scale}
        title="No advisory cases yet"
        description="Create your first case to get competing analysis from 4 AI accounting firms, scored by a judge."
        action={{
          label: 'Create your first case',
          href: '#',
          onClick: () => router.replace(pathname + '?tab=new', { scroll: false }),
        }}
      />
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
