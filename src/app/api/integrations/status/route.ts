// GET /api/integrations/status
// Founder-scoped per-provider connection state for the dashboard Integrations panel.
// Three connection sources:
//   vault  — a credentials_vault row exists for the founder under `service`
//   social — a social_channels row exists for the founder under `platform` (is_connected)
//   env    — required env keys present (no per-founder token; e.g. Linear API key)

import { NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Source = 'vault' | 'social' | 'env'

interface ProviderDef {
  id: string
  label: string
  category: 'accounting' | 'email' | 'calendar' | 'storage' | 'social' | 'project' | 'dev'
  source: Source
  vaultService?: string   // source 'vault'
  socialPlatform?: string // source 'social'
  envKeys: string[]       // all must be present for `configured`
}

// Each row is one honest provider. Multiple display rows may share a vault
// service (Gmail / Calendar / Drive all ride the single `google` OAuth token).
const PROVIDERS: ProviderDef[] = [
  { id: 'xero',      label: 'Xero',            category: 'accounting', source: 'vault',  vaultService: 'xero',   envKeys: ['XERO_CLIENT_ID', 'XERO_CLIENT_SECRET'] },
  { id: 'gmail',     label: 'Gmail',           category: 'email',      source: 'vault',  vaultService: 'google', envKeys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] },
  { id: 'calendar',  label: 'Google Calendar', category: 'calendar',   source: 'vault',  vaultService: 'google', envKeys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] },
  { id: 'drive',     label: 'Google Drive',    category: 'storage',    source: 'vault',  vaultService: 'google', envKeys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] },
  { id: 'imap',      label: 'IMAP Email',      category: 'email',      source: 'vault',  vaultService: 'imap',   envKeys: [] },
  { id: 'facebook',  label: 'Facebook',        category: 'social',     source: 'social', socialPlatform: 'facebook',  envKeys: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'] },
  { id: 'instagram', label: 'Instagram',       category: 'social',     source: 'social', socialPlatform: 'instagram', envKeys: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'] },
  { id: 'linkedin',  label: 'LinkedIn',        category: 'social',     source: 'social', socialPlatform: 'linkedin',  envKeys: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'] },
  { id: 'tiktok',    label: 'TikTok',          category: 'social',     source: 'social', socialPlatform: 'tiktok',    envKeys: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'] },
  { id: 'youtube',   label: 'YouTube',         category: 'social',     source: 'social', socialPlatform: 'youtube',   envKeys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] },
  { id: 'linear',    label: 'Linear',          category: 'project',    source: 'env',    envKeys: ['LINEAR_API_KEY'] },
  { id: 'sendgrid',  label: 'SendGrid',        category: 'email',      source: 'env',    envKeys: ['SENDGRID_API_KEY'] },
  { id: 'reddit',    label: 'Reddit',          category: 'social',     source: 'env',    envKeys: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'] },
  { id: 'github',    label: 'GitHub',          category: 'dev',        source: 'env',    envKeys: ['GITHUB_TOKEN'] },
]

function latest(values: Array<string | null | undefined>): string | null {
  const present = values.filter((v): v is string => !!v)
  if (!present.length) return null
  return present.sort().at(-1) ?? null // ISO 8601 sorts lexicographically
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()

  const [vaultRes, socialRes] = await Promise.all([
    supabase
      .from('credentials_vault')
      .select('service, created_at, updated_at, last_accessed_at')
      .eq('founder_id', user.id),
    supabase
      // social_channels is single-tenant via legacy `owner_id` (holds the founder uuid),
      // not `founder_id`; columns are `connected` / `last_post_at`.
      .from('social_channels')
      .select('platform, connected, last_post_at, updated_at')
      .eq('owner_id', user.id),
  ])

  if (vaultRes.error || socialRes.error) {
    console.error('[integrations/status] load error:', vaultRes.error?.message ?? socialRes.error?.message)
    return NextResponse.json({ error: 'Failed to load integration status' }, { status: 500 })
  }

  const vaultRows = (vaultRes.data ?? []) as Array<{ service: string; created_at: string; updated_at: string; last_accessed_at: string | null }>
  const socialRows = (socialRes.data ?? []) as Array<{ platform: string; connected: boolean; last_post_at: string | null; updated_at: string }>

  const providers = PROVIDERS.map((p) => {
    const configured = p.envKeys.every((k) => !!process.env[k]?.trim())

    let connected = false
    let tokenCount = 0
    let lastSync: string | null = null

    if (p.source === 'vault') {
      const rows = vaultRows.filter((r) => r.service === p.vaultService)
      tokenCount = rows.length
      connected = rows.length > 0
      lastSync = latest(rows.map((r) => r.last_accessed_at ?? r.updated_at ?? r.created_at))
    } else if (p.source === 'social') {
      const rows = socialRows.filter((r) => r.platform === p.socialPlatform && r.connected)
      tokenCount = rows.length
      connected = rows.length > 0
      lastSync = latest(rows.map((r) => r.last_post_at ?? r.updated_at))
    } else {
      // env source: env-key presence IS the connection (no per-founder token)
      connected = configured
    }

    return {
      id: p.id,
      label: p.label,
      category: p.category,
      source: p.source,
      configured,
      connected,
      tokenCount,
      lastSync,
    }
  })

  return NextResponse.json({
    providers,
    summary: {
      connected: providers.filter((p) => p.connected).length,
      total: providers.length,
    },
  })
}
