// src/app/(founder)/founder/experiments/page.tsx
export const dynamic = 'force-dynamic'

import { getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { ExperimentsPageClient } from '@/components/founder/experiments/ExperimentsPageClient'
import type { Experiment } from '@/lib/experiments/types'

interface ExperimentRow {
  id: string
  founder_id: string
  business_key: string
  title: string
  hypothesis: string
  experiment_type: string
  status: string
  generated_by: string | null
  ai_rationale: string | null
  metric_primary: string
  metric_secondary: string | null
  sample_size_target: number | null
  confidence_level: number
  started_at: string | null
  ended_at: string | null
  winner_variant_id: string | null
  conclusion: string | null
  approval_queue_id: string | null
  created_at: string
  updated_at: string
  variant_count?: number
}

function mapRow(row: ExperimentRow): Experiment & { variantCount: number } {
  return {
    id: row.id,
    founderId: row.founder_id,
    businessKey: row.business_key as Experiment['businessKey'],
    title: row.title,
    hypothesis: row.hypothesis,
    experimentType: row.experiment_type as Experiment['experimentType'],
    status: row.status as Experiment['status'],
    generatedBy: row.generated_by as Experiment['generatedBy'],
    aiRationale: row.ai_rationale,
    metricPrimary: row.metric_primary as Experiment['metricPrimary'],
    metricSecondary: row.metric_secondary,
    sampleSizeTarget: row.sample_size_target,
    confidenceLevel: row.confidence_level,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    winnerVariantId: row.winner_variant_id,
    conclusion: row.conclusion,
    approvalQueueId: row.approval_queue_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    variantCount: row.variant_count ?? 0,
  }
}

export default async function ExperimentsPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const supabase = createServiceClient()

  // Fetch experiments ordered by most recent first
  const { data: rows, error } = await supabase
    .from('experiments')
    .select('*')
    .eq('founder_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[experiments] Failed to load experiments:', error)
  }

  const experimentRows = (rows ?? []) as ExperimentRow[]

  // Fetch variant counts per experiment
  const experimentIds = experimentRows.map(r => r.id)
  const variantCounts: Record<string, number> = {}

  if (experimentIds.length > 0) {
    const { data: variants } = await supabase
      .from('experiment_variants')
      .select('experiment_id')
      .in('experiment_id', experimentIds)

    if (variants) {
      for (const v of variants) {
        const eid = (v as { experiment_id: string }).experiment_id
        variantCounts[eid] = (variantCounts[eid] ?? 0) + 1
      }
    }
  }

  const experiments = experimentRows.map(r => mapRow({ ...r, variant_count: variantCounts[r.id] ?? 0 }))

  return (
    <ExperimentsPageClient experiments={experiments} />
  )
}
