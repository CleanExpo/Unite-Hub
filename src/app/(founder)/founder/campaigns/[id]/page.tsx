'use client'

// src/app/(founder)/founder/campaigns/[id]/page.tsx
// Campaign detail view — loads campaign + assets, renders AssetPreview for each.

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react'
import { AssetPreview } from '@/components/founder/campaigns/AssetPreview'
import type { Campaign, CampaignAsset } from '@/lib/campaigns/types'

const PLATFORM_LABEL: Record<string, string> = {
  instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn',
  tiktok: 'TikTok', youtube: 'YouTube',
}

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  draft:      { label: 'Draft',      color: 'var(--color-text-disabled)' },
  generating: { label: 'Generating', color: '#00F5FF' },
  ready:      { label: 'Ready',      color: '#22c55e' },
  published:  { label: 'Published',  color: '#3b82f6' },
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [assets, setAssets] = useState<CampaignAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaigns/${id}`)
      if (res.status === 404) { setError('Campaign not found.'); return }
      if (!res.ok) { setError('Failed to load campaign.'); return }
      const data = await res.json() as { campaign: Campaign; assets: CampaignAsset[] }
      setCampaign(data.campaign)
      setAssets(data.assets ?? [])
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void load() }, [load])

  async function handleDelete() {
    if (!confirm('Delete this campaign and all its assets? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      if (res.ok) router.push('/founder/campaigns')
    } finally {
      setDeleting(false)
    }
  }

  function handlePublished(assetId: string, postId: string) {
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, socialPostId: postId, status: 'published' } : a))
  }

  function handleRegenerateImage(assetId: string) {
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'generating_image' } : a))
    // Reload after a short delay to pick up the new image
    setTimeout(() => void load(), 5000)
  }

  function handleApprove(assetId: string) {
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'ready' } : a))
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm" style={{ background: 'var(--surface-elevated)' }} />
          <div className="h-5 w-48 rounded-sm" style={{ background: 'var(--surface-elevated)' }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-sm border" style={{ borderColor: 'var(--color-border)', background: 'var(--surface-card)' }} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-[14px]" style={{ color: 'var(--color-text-muted)' }}>{error ?? 'Campaign not found.'}</p>
        <Link href="/founder/campaigns" className="text-[12px]" style={{ color: '#00F5FF' }}>
          ← Back to campaigns
        </Link>
      </div>
    )
  }

  const statusStyle = STATUS_STYLES[campaign.status] ?? STATUS_STYLES.draft
  const platforms = campaign.platforms.map(p => PLATFORM_LABEL[p] ?? p).join(' · ')
  const published = assets.filter(a => a.status === 'published').length
  const ready = assets.filter(a => a.status === 'ready').length

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/founder/campaigns"
          className="mt-1 p-1.5 rounded-sm border transition-colors flex-shrink-0"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          aria-label="Back to campaigns"
        >
          <ArrowLeft size={14} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[20px] font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              {campaign.theme}
            </h1>
            <span
              className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-sm border"
              style={{ color: statusStyle.color, borderColor: `${statusStyle.color}40` }}
            >
              {statusStyle.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>
            {platforms && <span>{platforms}</span>}
            <span>{assets.length} assets</span>
            {ready > 0 && <span style={{ color: '#22c55e' }}>{ready} ready</span>}
            {published > 0 && <span style={{ color: '#3b82f6' }}>{published} published</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="p-1.5 rounded-sm border transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            aria-label="Refresh"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="p-1.5 rounded-sm border transition-colors disabled:opacity-40"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            aria-label="Delete campaign"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Asset grid */}
      {assets.length === 0 ? (
        <div className="rounded-sm border py-16 flex flex-col items-center gap-3" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-[13px]" style={{ color: 'var(--color-text-disabled)' }}>
            {campaign.status === 'generating' ? 'Assets are being generated…' : 'No assets yet.'}
          </p>
          {campaign.status === 'generating' && (
            <button onClick={() => void load()} className="text-[11px]" style={{ color: '#00F5FF' }}>
              Refresh
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <AssetPreview
              key={asset.id}
              asset={asset}
              onPublished={(postId) => handlePublished(asset.id, postId)}
              onRegenerateImage={() => handleRegenerateImage(asset.id)}
              onApprove={() => handleApprove(asset.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
