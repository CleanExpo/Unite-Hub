// GET /api/campaigns/[id]/export?format=json|markdown
// Exports a campaign as a JSON download or a human-readable markdown document.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Campaign, CampaignAsset } from '@/lib/campaigns/types'

export const dynamic = 'force-dynamic'

function mapCampaignRow(row: Record<string, unknown>): Campaign {
  return {
    id: row['id'] as string,
    founderId: row['founder_id'] as string,
    brandProfileId: row['brand_profile_id'] as string,
    theme: row['theme'] as string,
    objective: row['objective'] as Campaign['objective'],
    platforms: (row['platforms'] as string[]) as Campaign['platforms'],
    postCount: row['post_count'] as number,
    dateRangeStart: row['date_range_start'] as string | null,
    dateRangeEnd: row['date_range_end'] as string | null,
    status: row['status'] as Campaign['status'],
    metadata: (row['metadata'] as Record<string, unknown>) ?? {},
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  }
}

function mapAssetRow(row: Record<string, unknown>): CampaignAsset {
  return {
    id: row['id'] as string,
    campaignId: row['campaign_id'] as string,
    founderId: row['founder_id'] as string,
    platform: row['platform'] as CampaignAsset['platform'],
    copy: row['copy'] as string,
    headline: row['headline'] as string | null,
    cta: row['cta'] as string | null,
    hashtags: (row['hashtags'] as string[]) ?? [],
    imageUrl: row['image_url'] as string | null,
    imagePrompt: row['image_prompt'] as string,
    width: row['width'] as number,
    height: row['height'] as number,
    variant: row['variant'] as number,
    socialPostId: row['social_post_id'] as string | null,
    status: row['status'] as CampaignAsset['status'],
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  }
}

/** Format an ISO date string as DD/MM/YYYY (en-AU). */
function formatDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = d.getUTCFullYear()
  return `${dd}/${mm}/${yyyy}`
}

/** Slugify a string for use in a filename: lowercase, spaces → hyphens. */
function toFilenameSlug(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function buildMarkdown(campaign: Campaign, assets: CampaignAsset[]): string {
  const lines: string[] = [
    `# Campaign: ${campaign.theme}`,
    '',
    `**Objective:** ${campaign.objective}`,
    `**Platforms:** ${campaign.platforms.join(', ')}`,
    `**Generated:** ${formatDate(campaign.createdAt)}`,
    '',
    '---',
    '',
    '## Assets',
  ]

  for (const asset of assets) {
    lines.push(
      '',
      `### ${asset.platform} — Variant ${asset.variant}`,
      '',
      `**Headline:** ${asset.headline ?? 'N/A'}`,
      '',
      '**Copy:**',
      asset.copy,
      '',
      `**CTA:** ${asset.cta ?? 'N/A'}`,
      '',
      `**Hashtags:** ${asset.hashtags.length > 0 ? asset.hashtags.join(' ') : 'None'}`,
      '',
      `**Image:** ${asset.imageUrl ?? 'Pending'}`,
      '',
      `**Dimensions:** ${asset.width}×${asset.height}px`,
      '',
      '---',
    )
  }

  return lines.join('\n')
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') ?? 'json'

  if (format !== 'json' && format !== 'markdown') {
    return NextResponse.json(
      { error: 'Unsupported format. Use "json" or "markdown".' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  const { data: campaignRow, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (error || !campaignRow) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  const campaign = mapCampaignRow(campaignRow as Record<string, unknown>)

  const { data: assetRows } = await supabase
    .from('campaign_assets')
    .select('*')
    .eq('campaign_id', id)
    .order('platform')
    .order('variant')

  const assets = (assetRows ?? []).map(a => mapAssetRow(a as Record<string, unknown>))

  const themeSlug = toFilenameSlug(campaign.theme)
  const dateSlug = formatDate(campaign.createdAt).replace(/\//g, '-')

  if (format === 'markdown') {
    const filename = `campaign-${themeSlug}-${dateSlug}.md`
    const body = buildMarkdown(campaign, assets)

    return new Response(body, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  // Default: JSON
  const filename = `campaign-${themeSlug}-${dateSlug}.json`
  const exportedAt = new Date().toISOString()
  const body = JSON.stringify({ campaign, assets, exportedAt }, null, 2)

  return new Response(body, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
