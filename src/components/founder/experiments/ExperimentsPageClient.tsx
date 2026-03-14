'use client'

import { useState, useMemo } from 'react'
import { FlaskConical } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { ExperimentCard } from './ExperimentCard'
import { SynthexGeneratorPanel } from './SynthexGeneratorPanel'
import { BUSINESSES } from '@/lib/businesses'
import type { BusinessKey } from '@/lib/businesses'
import type { Experiment, ExperimentStatus } from '@/lib/experiments/types'
import { EXPERIMENT_STATUSES } from '@/lib/experiments/types'

interface ExperimentWithCount extends Experiment {
  variantCount: number
}

interface Props {
  experiments: ExperimentWithCount[]
}

const STATUS_OPTIONS: readonly ExperimentStatus[] = EXPERIMENT_STATUSES

export function ExperimentsPageClient({ experiments }: Props) {
  const [businessFilter, setBusinessFilter] = useState<BusinessKey | ''>('')
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | ''>('')
  const [showGenerator, setShowGenerator] = useState(false)

  const filtered = useMemo(() => {
    return experiments.filter((e) => {
      if (businessFilter && e.businessKey !== businessFilter) return false
      if (statusFilter && e.status !== statusFilter) return false
      return true
    })
  }, [experiments, businessFilter, statusFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Experiments"
        subtitle="A/B testing powered by Synthex AI"
        actions={
          <button
            onClick={() => setShowGenerator(true)}
            className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#00F5FF] border border-[#00F5FF]/30 rounded-sm hover:bg-[#00F5FF]/5 transition-colors"
          >
            Generate Experiment
          </button>
        }
      />

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <select
          value={businessFilter}
          onChange={(e) => setBusinessFilter(e.target.value as BusinessKey | '')}
          className="text-[11px] px-3 py-1.5 rounded-sm border bg-transparent outline-none"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
            background: 'var(--surface-card)',
          }}
        >
          <option value="">All Businesses</option>
          {BUSINESSES.map((b) => (
            <option key={b.key} value={b.key}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ExperimentStatus | '')}
          className="text-[11px] px-3 py-1.5 rounded-sm border bg-transparent outline-none"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
            background: 'var(--surface-card)',
          }}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Experiment list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No experiments yet"
          description="Use Synthex AI to generate your first A/B test"
          action={{
            label: 'Generate Experiment',
            href: '#',
            onClick: () => setShowGenerator(true),
          }}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((exp) => (
            <ExperimentCard
              key={exp.id}
              experiment={exp}
              variantCount={exp.variantCount}
            />
          ))}
        </div>
      )}

      {/* Synthex generator panel */}
      {showGenerator && (
        <SynthexGeneratorPanel onClose={() => setShowGenerator(false)} />
      )}
    </div>
  )
}
