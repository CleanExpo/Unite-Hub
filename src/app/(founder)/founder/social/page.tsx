// src/app/(founder)/founder/social/page.tsx
// Social Platform Management — Founder view
// Route: /founder/social
// Lists all platforms, shows config status, provides Connect buttons

export const dynamic = 'force-dynamic'

import { getUser } from '@/lib/supabase/server'
import { SOCIAL_PLATFORMS, isPlatformConfigured, loadPlatformTokens } from '@/lib/integrations/social'
import { PageHeader } from '@/components/ui/PageHeader'

async function getPlatformStatus(founderId: string) {
  return Promise.all(
    SOCIAL_PLATFORMS.map(async (platform) => {
      const configured = isPlatformConfigured(platform.key)
      const tokens = await loadPlatformTokens(founderId, platform.key)
      return {
        ...platform,
        configured,
        connected: !!tokens,
        connectedAt: tokens?.connectedAt ?? null,
      }
    })
  )
}

export default async function SocialPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string; platform?: string }>
}) {
  const params = await searchParams
  const user = await getUser()

  if (!user) {
    return (
      <div className="p-6">
        <PageHeader title="Social Platforms" subtitle="Authentication required" />
        <p className="text-sm text-muted mt-4">Please log in to manage social connections.</p>
      </div>
    )
  }

  const platforms = await getPlatformStatus(user.id)
  const configuredCount = platforms.filter(p => p.configured).length
  const connectedCount = platforms.filter(p => p.connected).length

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Social Platforms"
        subtitle="Connect your social media accounts for automated publishing"
      />

      {params.connected && (
        <div className="text-xs text-[#00F5FF]/80 border border-[#00F5FF]/20 bg-[#00F5FF]/5 px-4 py-2.5 rounded-sm">
          {params.connected} connected successfully
        </div>
      )}

      {params.error && (
        <div className="text-xs text-red-400/80 border border-red-400/20 bg-red-400/5 px-4 py-2.5 rounded-sm">
          Connection error: {params.error}
          {params.platform && ` (${params.platform})`}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm">
        <div className="border border-white/[0.08] px-4 py-2 rounded-sm" style={{ background: 'var(--surface-card)' }}>
          <span className="text-muted">Configured:</span>{' '}
          <span className="text-[#00F5FF]">{configuredCount}/{platforms.length}</span>
        </div>
        <div className="border border-white/[0.08] px-4 py-2 rounded-sm" style={{ background: 'var(--surface-card)' }}>
          <span className="text-muted">Connected:</span>{' '}
          <span className="text-[#00F5FF]">{connectedCount}/{platforms.length}</span>
        </div>
      </div>

      <div className="space-y-3 max-w-3xl">
        {platforms.map((platform) => (
          <div
            key={platform.key}
            className="flex items-center justify-between border border-white/[0.08] px-5 py-4 rounded-sm"
            style={{ background: 'var(--surface-card)' }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-sm flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  background: platform.connected
                    ? 'rgba(0, 245, 255, 0.1)'
                    : 'rgba(255, 255, 255, 0.05)',
                  color: platform.connected ? '#00F5FF' : 'var(--color-text-muted)',
                  border: `1px solid ${platform.connected ? 'rgba(0, 245, 255, 0.2)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {platform.icon}
              </div>
              <div>
                <p className="text-sm font-light" style={{ color: 'var(--color-text-primary)' }}>
                  {platform.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {platform.description}
                </p>
                {platform.connected && platform.connectedAt && (
                  <p className="text-[10px] mt-1 text-[#00F5FF]/70">
                    Connected {new Date(platform.connectedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!platform.configured ? (
                <a
                  href={platform.setupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] uppercase tracking-widest text-muted border border-white/[0.08] px-3 py-1.5 rounded-sm hover:border-white/20 transition-colors"
                >
                  Setup
                </a>
              ) : platform.connected ? (
                <span className="text-[10px] uppercase tracking-widest text-[#00F5FF]/80 border border-[#00F5FF]/30 px-2.5 py-1 rounded-sm">
                  Live
                </span>
              ) : (
                <a
                  href={`/api/social/${platform.key}/connect`}
                  className="text-[10px] uppercase tracking-widest text-white border border-white/20 bg-white/[0.03] px-3 py-1.5 rounded-sm hover:bg-white/[0.06] transition-colors"
                >
                  Connect
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border border-white/[0.08] px-5 py-4 rounded-sm max-w-3xl" style={{ background: 'var(--surface-card)' }}>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted mb-3">Setup Checklist</p>
        <div className="space-y-2">
          {platforms.map((platform) => (
            <div key={platform.key} className="flex items-center gap-2 text-xs">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  background: platform.connected
                    ? '#00F5FF'
                    : platform.configured
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'rgba(255, 255, 255, 0.1)',
                }}
              />
              <span style={{ color: platform.connected ? '#00F5FF' : 'var(--color-text-muted)' }}>
                {platform.name}
              </span>
              <span className="text-[10px] ml-auto" style={{ color: 'var(--color-text-muted)' }}>
                {platform.connected ? 'Ready' : platform.configured ? 'Needs connection' : 'Needs app setup'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 text-xs text-muted">
        <p>After creating apps on each platform, add their credentials to your environment variables.</p>
        <p className="mt-1">Then click Connect to authorize access. Tokens are stored encrypted in the vault.</p>
      </div>
    </div>
  )
}
