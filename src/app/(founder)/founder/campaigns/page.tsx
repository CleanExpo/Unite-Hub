// src/app/(founder)/founder/campaigns/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Campaign, CampaignObjective, CampaignStatus } from '@/lib/campaigns/types'

// ─── DB Row ──────────────────────────────────────────────────────────────────

interface CampaignRow {
  id: string
  theme: string
  objective: string
  platforms: string[]
  post_count: number
  status: string
  created_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapRow(row: CampaignRow): Pick<Campaign, 'id' | 'theme' | 'objective' | 'platforms' | 'postCount' | 'status' | 'createdAt'> {
  return {
    id: row.id,
    theme: row.theme,
    objective: row.objective as CampaignObjective,
    platforms: row.platforms as Campaign['platforms'],
    postCount: row.post_count,
    status: row.status as CampaignStatus,
    createdAt: row.created_at,
  }
}

const STATUS_STYLES: Record<CampaignStatus, { label: string; className: string }> = {
  draft:      { label: 'Draft',      className: 'text-white/40 bg-white/[0.06] border border-white/10' },
  generating: { label: 'Generating', className: 'text-[#00F5FF] bg-[#00F5FF]/10 border border-[#00F5FF]/20 animate-pulse' },
  ready:      { label: 'Ready',      className: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' },
  published:  { label: 'Published',  className: 'text-blue-400 bg-blue-400/10 border border-blue-400/20' },
}

const OBJECTIVE_STYLES: Record<CampaignObjective, { label: string; className: string }> = {
  awareness:  { label: 'Awareness',  className: 'text-purple-400 bg-purple-400/10 border border-purple-400/20' },
  engagement: { label: 'Engagement', className: 'text-amber-400 bg-amber-400/10 border border-amber-400/20' },
  conversion: { label: 'Conversion', className: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' },
  retention:  { label: 'Retention',  className: 'text-blue-400 bg-blue-400/10 border border-blue-400/20' },
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'IG',
  facebook:  'FB',
  linkedin:  'LI',
  tiktok:    'TT',
  youtube:   'YT',
}

function formatPlatforms(platforms: string[]): string {
  return platforms
    .map(p => PLATFORM_LABELS[p] ?? p.toUpperCase().slice(0, 2))
    .join(' · ')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

interface CampaignCardProps {
  campaign: ReturnType<typeof mapRow>
}

function CampaignCard({ campaign }: CampaignCardProps) {
  const status = STATUS_STYLES[campaign.status] ?? STATUS_STYLES.draft
  const objective = OBJECTIVE_STYLES[campaign.objective] ?? OBJECTIVE_STYLES.awareness

  return (
    <Link
      href={`/founder/campaigns/${campaign.id}`}
      className="block group"
    >
      <div
        className="rounded-sm border border-white/[0.06] bg-[#0a0a0a] p-5 flex flex-col gap-3 transition-colors duration-150 hover:border-[#00F5FF]/30 hover:bg-[#00F5FF]/[0.02]"
      >
        {/* Theme + status row */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-[14px] font-medium text-white leading-snug line-clamp-2 flex-1">
            {campaign.theme}
          </p>
          <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-sm ${status.className}`}>
            {status.label}
          </span>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-sm ${objective.className}`}>
            {objective.label}
          </span>

          {campaign.platforms.length > 0 && (
            <span className="text-[11px] font-mono text-white/40">
              {formatPlatforms(campaign.platforms)}
            </span>
          )}

          <span className="text-[11px] font-mono text-white/25">
            {campaign.postCount} post{campaign.postCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/25 font-mono">
            {formatDate(campaign.createdAt)}
          </span>
          <span
            className="text-[11px] text-[#00F5FF]/0 group-hover:text-[#00F5FF]/60 transition-colors duration-150"
          >
            View →
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="rounded-sm py-20 flex flex-col items-center justify-center text-center gap-4"
      style={{ border: '1px dashed rgba(0,245,255,0.15)' }}
    >
      <div className="w-10 h-10 rounded-sm bg-[#00F5FF]/[0.06] border border-[#00F5FF]/20 flex items-center justify-center">
        <span className="text-[#00F5FF] text-lg">⚡</span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-medium text-white/60">No campaigns yet</p>
        <p className="text-[12px] text-white/25 max-w-xs">
          Scan a website to get started — the engine will extract Brand DNA and generate a full campaign.
        </p>
      </div>
      <Link
        href="/founder/campaigns/new"
        className="mt-2 text-[12px] font-medium text-[#00F5FF] hover:text-[#00F5FF]/80 transition-colors duration-150"
      >
        Scan your first website →
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CampaignsPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const supabase = createServiceClient()

  const { data: rows, error } = await supabase
    .from('campaigns')
    .select('id, theme, objective, platforms, post_count, status, created_at')
    .eq('founder_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[campaigns] Failed to load campaigns:', error)
  }

  const campaigns = (rows ?? []).map(r => mapRow(r as CampaignRow))

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[22px] font-semibold text-white tracking-tight">
            Campaigns
          </h1>
          <p className="text-[12px] text-white/30">
            Synthex AI-generated multi-platform campaigns
          </p>
        </div>
        <Link
          href="/founder/campaigns/new"
          className="shrink-0 bg-[#00F5FF] text-black text-[12px] font-semibold rounded-sm px-4 py-2 hover:bg-[#00F5FF]/90 transition-colors duration-150"
        >
          New Campaign
        </Link>
      </div>

      {/* Campaign grid or empty state */}
      {campaigns.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {campaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  )
}
