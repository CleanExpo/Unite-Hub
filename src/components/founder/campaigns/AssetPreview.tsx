'use client'

import { useState } from 'react'
import type { CampaignAsset, VisualType } from '@/lib/campaigns/types'
import type { SocialPlatform } from '@/lib/integrations/social/types'

interface AssetPreviewProps {
  asset: CampaignAsset
  onPublished?: (postId: string) => void
  onRegenerateImage?: (assetId: string) => void
  onApprove?: (assetId: string) => void
}

const PLATFORM_BADGE: Record<SocialPlatform, string> = {
  instagram: 'bg-pink-500/20 text-pink-400',
  facebook:  'bg-blue-500/20 text-blue-400',
  linkedin:  'bg-sky-600/20 text-sky-400',
  tiktok:    'bg-white/10 text-white/70',
  youtube:   'bg-red-500/20 text-red-400',
}

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  facebook:  'Facebook',
  linkedin:  'LinkedIn',
  tiktok:    'TikTok',
  youtube:   'YouTube',
}

const STATUS_BADGE: Record<CampaignAsset['status'], string> = {
  pending_image:    'bg-amber-500/20 text-amber-400',
  generating_image: 'bg-cyan-500/20 text-cyan-400 animate-pulse',
  ready:            'bg-green-500/20 text-green-400',
  review:           'bg-amber-500/20 text-amber-400',
  published:        'bg-blue-500/20 text-blue-400',
}

const STATUS_LABEL: Record<CampaignAsset['status'], string> = {
  pending_image:    'Pending Image',
  generating_image: 'Generating',
  ready:            'Ready',
  review:           'Needs Review',
  published:        'Published',
}

const VISUAL_TYPE_BADGE: Record<VisualType, string> = {
  photo:        'bg-white/5 text-white/50',
  infographic:  'bg-violet-500/20 text-violet-400',
  diagram:      'bg-emerald-500/20 text-emerald-400',
  data_viz:     'bg-sky-500/20 text-sky-400',
  process_flow: 'bg-amber-500/20 text-amber-400',
}

const VISUAL_TYPE_LABEL: Record<VisualType, string> = {
  photo:        'Photo',
  infographic:  'Infographic',
  diagram:      'Diagram',
  data_viz:     'Data Viz',
  process_flow: 'Process Flow',
}

function QualityScorePill({ score }: { score: number }) {
  const colour = score >= 70
    ? 'bg-green-500/20 text-green-400'
    : 'bg-amber-500/20 text-amber-400'
  return (
    <span className={`text-xs font-mono px-1.5 py-0.5 rounded-sm ${colour}`}>
      Q:{score}
    </span>
  )
}

export function AssetPreview({ asset, onPublished, onRegenerateImage, onApprove }: AssetPreviewProps) {
  const [expanded, setExpanded] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [approving, setApproving] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  const copyTruncated = asset.copy.length > 150 && !expanded
    ? asset.copy.slice(0, 150) + '…'
    : asset.copy

  async function handlePublish() {
    setPublishing(true)
    setPublishError(null)
    try {
      const mediaUrls: string[] = asset.imageUrl ? [asset.imageUrl] : []
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessKey: 'synthex',
          content: asset.copy,
          mediaUrls,
          platforms: [asset.platform],
          title: asset.headline ?? undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const body = await res.json() as { post: { id: string } }
      onPublished?.(body.post.id)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Failed to publish')
    } finally {
      setPublishing(false)
    }
  }

  async function handleApprove() {
    if (!onApprove) return
    setApproving(true)
    onApprove(asset.id)
    setApproving(false)
  }

  return (
    <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm p-4 flex flex-col gap-3">
      {/* Header row — platform + visual type + status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-sm ${PLATFORM_BADGE[asset.platform]}`}>
          {PLATFORM_LABEL[asset.platform]}
        </span>
        {asset.visualType !== 'photo' && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-sm ${VISUAL_TYPE_BADGE[asset.visualType]}`}>
            {VISUAL_TYPE_LABEL[asset.visualType]}
          </span>
        )}
        {asset.imageEngine === 'paper_banana' && asset.qualityScore !== null && (
          <QualityScorePill score={asset.qualityScore} />
        )}
        <span className={`text-xs font-medium px-2 py-0.5 rounded-sm ml-auto ${STATUS_BADGE[asset.status]}`}>
          {STATUS_LABEL[asset.status]}
        </span>
      </div>

      {/* Image area */}
      {asset.imageUrl ? (
        <img
          src={asset.imageUrl}
          alt={asset.headline ?? 'Campaign asset'}
          className="w-full aspect-square object-cover rounded-sm"
        />
      ) : (
        <div className="w-full aspect-square bg-white/[0.03] border border-white/[0.06] rounded-sm flex items-center justify-center">
          <span className="text-white/30 text-sm">
            {asset.status === 'generating_image' ? 'Image generating…' : 'No image'}
          </span>
        </div>
      )}

      {/* Headline */}
      {asset.headline && (
        <p className="text-white text-sm font-semibold leading-snug">
          {asset.headline}
        </p>
      )}

      {/* Copy text */}
      <div className="flex flex-col gap-1">
        <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
          {copyTruncated}
        </p>
        {asset.copy.length > 150 && (
          <button
            onClick={() => setExpanded(prev => !prev)}
            className="text-xs text-white/40 hover:text-white/60 transition-colors text-left"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* CTA */}
      {asset.cta && (
        <p className="text-[#00F5FF] text-xs font-medium">
          {asset.cta}
        </p>
      )}

      {/* Hashtags */}
      {asset.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {asset.hashtags.map(tag => (
            <span
              key={tag}
              className="bg-white/5 text-white/60 text-xs px-2 py-0.5 rounded-sm"
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      )}

      {/* Dimensions + engine */}
      <p className="font-mono text-white/30 text-xs">
        {asset.width}×{asset.height}
        {asset.imageEngine && ` · ${asset.imageEngine === 'paper_banana' ? 'PaperBanana' : 'Gemini'}`}
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        {(asset.status === 'pending_image' || asset.status === 'review') && onRegenerateImage && (
          <button
            onClick={() => onRegenerateImage(asset.id)}
            className="border border-white/10 text-white/60 hover:border-white/20 hover:text-white/80 text-xs px-3 py-1.5 rounded-sm transition-colors"
          >
            Regenerate
          </button>
        )}

        {asset.status === 'review' && onApprove && (
          <button
            onClick={handleApprove}
            disabled={approving}
            className="bg-green-600 text-white text-xs font-medium rounded-sm px-3 py-1.5 hover:bg-green-500 disabled:opacity-50 transition-colors"
          >
            {approving ? 'Approving…' : 'Approve'}
          </button>
        )}

        {asset.status === 'ready' && (
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="bg-[#00F5FF] text-black text-sm font-medium rounded-sm px-3 py-1.5 hover:bg-[#00F5FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {publishing ? 'Publishing…' : 'Promote →'}
          </button>
        )}
      </div>

      {/* Publish error */}
      {publishError && (
        <p className="text-red-400 text-xs">
          {publishError}
        </p>
      )}
    </div>
  )
}
