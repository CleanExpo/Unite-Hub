// src/app/(founder)/founder/experiments/[id]/page.tsx
export const dynamic = 'force-dynamic'

import { getUser } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { ExperimentDetailClient } from '@/components/founder/experiments/ExperimentDetailClient'
import type {
  Experiment,
  ExperimentVariant,
  ExperimentResult,
  VariantWithTotals,
  VariantAggregatedTotals,
  SignificanceData,
} from '@/lib/experiments/types'
import type { BusinessKey } from '@/lib/businesses'

// ── snake_case DB row types ──────────────────────────────────────────────

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
}

interface VariantRow {
  id: string
  experiment_id: string
  founder_id: string
  variant_key: string
  label: string
  description: string | null
  content: string | null
  media_urls: string[]
  cta_text: string | null
  scheduled_time: string | null
  platforms: string[]
  is_control: boolean
  weight: number
  created_at: string
  updated_at: string
}

interface ResultRow {
  id: string
  variant_id: string
  experiment_id: string
  founder_id: string
  period_date: string
  impressions: number
  reach: number
  clicks: number
  likes: number
  comments: number
  shares: number
  saves: number
  conversions: number
  conversion_value_cents: number
  platform_data: Record<string, unknown>
  source: string
  created_at: string
}

function mapExperiment(r: ExperimentRow): Experiment {
  return {
    id: r.id,
    founderId: r.founder_id,
    businessKey: r.business_key as BusinessKey,
    title: r.title,
    hypothesis: r.hypothesis,
    experimentType: r.experiment_type as Experiment['experimentType'],
    status: r.status as Experiment['status'],
    generatedBy: r.generated_by as Experiment['generatedBy'],
    aiRationale: r.ai_rationale,
    metricPrimary: r.metric_primary as Experiment['metricPrimary'],
    metricSecondary: r.metric_secondary,
    sampleSizeTarget: r.sample_size_target,
    confidenceLevel: r.confidence_level,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    winnerVariantId: r.winner_variant_id,
    conclusion: r.conclusion,
    approvalQueueId: r.approval_queue_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function mapVariant(r: VariantRow): ExperimentVariant {
  return {
    id: r.id,
    experimentId: r.experiment_id,
    founderId: r.founder_id,
    variantKey: r.variant_key,
    label: r.label,
    description: r.description,
    content: r.content,
    mediaUrls: r.media_urls ?? [],
    ctaText: r.cta_text,
    scheduledTime: r.scheduled_time,
    platforms: r.platforms ?? [],
    isControl: r.is_control,
    weight: r.weight,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function mapResult(r: ResultRow): ExperimentResult {
  return {
    id: r.id,
    variantId: r.variant_id,
    experimentId: r.experiment_id,
    founderId: r.founder_id,
    periodDate: r.period_date,
    impressions: r.impressions,
    reach: r.reach,
    clicks: r.clicks,
    likes: r.likes,
    comments: r.comments,
    shares: r.shares,
    saves: r.saves,
    conversions: r.conversions,
    conversionValueCents: r.conversion_value_cents,
    platformData: r.platform_data ?? {},
    source: r.source as ExperimentResult['source'],
    createdAt: r.created_at,
  }
}

function aggregateTotals(results: ExperimentResult[]): VariantAggregatedTotals {
  const t: VariantAggregatedTotals = {
    totalImpressions: 0,
    totalReach: 0,
    totalClicks: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalSaves: 0,
    totalConversions: 0,
    totalConversionValueCents: 0,
    engagementRate: 0,
    clickThroughRate: 0,
    conversionRate: 0,
  }

  for (const r of results) {
    t.totalImpressions += r.impressions
    t.totalReach += r.reach
    t.totalClicks += r.clicks
    t.totalLikes += r.likes
    t.totalComments += r.comments
    t.totalShares += r.shares
    t.totalSaves += r.saves
    t.totalConversions += r.conversions
    t.totalConversionValueCents += r.conversionValueCents
  }

  const engagements = t.totalLikes + t.totalComments + t.totalShares + t.totalSaves
  t.engagementRate = t.totalImpressions > 0 ? (engagements / t.totalImpressions) * 100 : 0
  t.clickThroughRate = t.totalImpressions > 0 ? (t.totalClicks / t.totalImpressions) * 100 : 0
  t.conversionRate = t.totalClicks > 0 ? (t.totalConversions / t.totalClicks) * 100 : 0

  return t
}

function computeSignificance(
  control: VariantAggregatedTotals,
  treatment: VariantAggregatedTotals,
  confidenceLevel: number,
): SignificanceData | null {
  const nControl = control.totalImpressions
  const nTreatment = treatment.totalImpressions
  if (nControl < 30 || nTreatment < 30) return null

  const pControl = control.engagementRate / 100
  const pTreatment = treatment.engagementRate / 100
  const pooled = (pControl * nControl + pTreatment * nTreatment) / (nControl + nTreatment)
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / nControl + 1 / nTreatment))

  if (se === 0) return null

  const zScore = (pTreatment - pControl) / se
  // Approximate two-tailed p-value
  const absZ = Math.abs(zScore)
  const pValue = Math.exp(-0.5 * absZ * absZ) / Math.sqrt(2 * Math.PI) * 2

  const threshold = 1 - confidenceLevel / 100
  const lift = pControl > 0 ? ((pTreatment - pControl) / pControl) * 100 : 0

  return {
    zScore,
    pValue,
    isSignificant: pValue < threshold,
    controlRate: pControl * 100,
    treatmentRate: pTreatment * 100,
    lift,
  }
}

export default async function ExperimentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const supabase = createServiceClient()

  // Fetch experiment, variants, and results in parallel
  const [expRes, varRes, resRes] = await Promise.allSettled([
    supabase
      .from('experiments')
      .select('*')
      .eq('id', id)
      .eq('founder_id', user.id)
      .single(),
    supabase
      .from('experiment_variants')
      .select('*')
      .eq('experiment_id', id)
      .order('variant_key', { ascending: true }),
    supabase
      .from('experiment_results')
      .select('*')
      .eq('experiment_id', id)
      .order('period_date', { ascending: true }),
  ])

  if (expRes.status === 'rejected' || !expRes.value.data) {
    notFound()
  }

  const experiment = mapExperiment(expRes.value.data as ExperimentRow)
  const variants = (
    varRes.status === 'fulfilled' ? (varRes.value.data ?? []) : []
  ).map((r) => mapVariant(r as VariantRow))
  const results = (
    resRes.status === 'fulfilled' ? (resRes.value.data ?? []) : []
  ).map((r) => mapResult(r as ResultRow))

  // Aggregate metrics per variant
  const resultsByVariant: Record<string, ExperimentResult[]> = {}
  for (const r of results) {
    if (!resultsByVariant[r.variantId]) resultsByVariant[r.variantId] = []
    resultsByVariant[r.variantId].push(r)
  }

  const variantsWithTotals: VariantWithTotals[] = variants.map((v) => ({
    ...v,
    totals: aggregateTotals(resultsByVariant[v.id] ?? []),
  }))

  // Compute statistical significance for treatment variants against control
  const controlVariant = variantsWithTotals.find((v) => v.isControl)
  const significance: Record<string, SignificanceData | null> = {}

  for (const v of variantsWithTotals) {
    if (v.isControl) {
      significance[v.id] = null
    } else if (controlVariant) {
      significance[v.id] = computeSignificance(
        controlVariant.totals,
        v.totals,
        experiment.confidenceLevel,
      )
    } else {
      significance[v.id] = null
    }
  }

  return (
    <ExperimentDetailClient
      experiment={experiment}
      variants={variantsWithTotals}
      results={results}
      significance={significance}
    />
  )
}
