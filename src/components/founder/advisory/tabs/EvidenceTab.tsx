'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { AdvisoryEvidence } from '@/lib/advisory/types'

const TYPE_COLOURS: Record<string, string> = {
  ato_ruling: '#3b82f6',
  legislation: '#22c55e',
  case_law: '#a855f7',
  ato_guidance: '#f59e0b',
  industry_standard: '#6b7280',
}

export function EvidenceTab() {
  const searchParams = useSearchParams()
  const caseId = searchParams.get('case')
  const [evidence, setEvidence] = useState<AdvisoryEvidence[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!caseId) return
    setLoading(true)
    fetch(`/api/advisory/cases/${caseId}/evidence?pageSize=100`)
      .then(r => r.json())
      .then(d => setEvidence(d.evidence ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [caseId])

  if (!caseId) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>
          Select a case to view its evidence ledger.
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>Loading evidence...</span>
      </div>
    )
  }

  if (evidence.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>
          No evidence citations yet. Start a debate to generate evidence.
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {evidence.length} citations
        </span>
      </div>

      <div className="grid gap-2">
        {evidence.map((e) => {
          const typeColour = TYPE_COLOURS[e.citation_type] ?? '#6b7280'

          return (
            <div
              key={e.id}
              className="p-3 rounded-sm flex items-start gap-3"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)' }}
            >
              <span
                className="shrink-0 text-[9px] font-medium uppercase px-1.5 py-0.5 rounded-sm tracking-wider"
                style={{
                  background: `${typeColour}18`,
                  color: typeColour,
                  border: `1px solid ${typeColour}30`,
                }}
              >
                {e.citation_type.replace('_', ' ')}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {e.reference_id}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    {e.reference_title}
                  </span>
                </div>
                {e.excerpt && (
                  <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-disabled)' }}>
                    {e.excerpt}
                  </p>
                )}
                {e.url && (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] mt-0.5 inline-block"
                    style={{ color: '#00F5FF' }}
                  >
                    View on ATO
                  </a>
                )}
              </div>
              {e.relevance_score != null && (
                <span className="shrink-0 text-[10px] font-mono ml-auto" style={{ color: 'var(--color-text-disabled)' }}>
                  {Number(e.relevance_score).toFixed(1)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
