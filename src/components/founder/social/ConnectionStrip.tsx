'use client'

import { useState } from 'react'
import { BUSINESSES } from '@/lib/businesses'
import type { SocialChannel, SocialPlatform } from '@/lib/integrations/social/types'

async function disconnectChannel(channelId: string): Promise<void> {
  const res = await fetch(`/api/social/channels/${channelId}`, { method: 'DELETE' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
}

const PLATFORM_META: Record<SocialPlatform, { label: string; colour: string; icon: string }> = {
  facebook:  { label: 'Facebook',  colour: '#1877F2', icon: 'f' },
  instagram: { label: 'Instagram', colour: '#E1306C', icon: '◈' },
  linkedin:  { label: 'LinkedIn',  colour: '#0A66C2', icon: 'in' },
  tiktok:    { label: 'TikTok',    colour: '#FE2C55', icon: '♪' },
  youtube:   { label: 'YouTube',   colour: '#FF0000', icon: '▶' },
}

const ALL_PLATFORMS: SocialPlatform[] = ['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube']

/** Map platform to OAuth provider path */
function authPath(platform: SocialPlatform): string {
  return platform === 'facebook' || platform === 'instagram' ? 'meta' : platform
}

interface Props {
  channels: SocialChannel[]
}

export function ConnectionStrip({ channels: initialChannels }: Props) {
  // Default to Synthex — social/AI content lives there
  const [selectedBusiness, setSelectedBusiness] = useState('synthex')
  const [channels, setChannels] = useState<SocialChannel[]>(initialChannels)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  async function handleDisconnect(channel: SocialChannel) {
    setDisconnecting(channel.id)
    try {
      await disconnectChannel(channel.id)
      setChannels(prev => prev.filter(c => c.id !== channel.id))
    } catch (err) {
      console.error('[ConnectionStrip] Disconnect failed:', err)
    } finally {
      setDisconnecting(null)
    }
  }

  // Build a map: platform → connected channel for the selected business
  const connectedByPlatform = new Map(
    channels
      .filter(c => c.isConnected && c.businessKey === selectedBusiness)
      .map(c => [c.platform, c])
  )

  return (
    <div className="space-y-2">
      {/* Business selector */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-disabled)' }}>
          Connecting for
        </span>
        <select
          value={selectedBusiness}
          onChange={e => setSelectedBusiness(e.target.value)}
          className="rounded-sm border px-2 py-1 text-[11px] bg-transparent outline-none"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          {BUSINESSES.map(biz => (
            <option key={biz.key} value={biz.key}>
              {biz.name}
            </option>
          ))}
        </select>
      </div>

      {/* Platform connection pills */}
      <div className="flex flex-wrap gap-2">
        {ALL_PLATFORMS.map(platform => {
          const meta = PLATFORM_META[platform]
          const channel = connectedByPlatform.get(platform)

          return channel ? (
            <div
              key={platform}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px]"
              style={{ backgroundColor: `${meta.colour}15`, border: `1px solid ${meta.colour}40` }}
            >
              <span style={{ color: meta.colour }}>{meta.icon}</span>
              <span style={{ color: meta.colour }}>{meta.label}</span>
              {channel.channelName && (
                <span style={{ color: meta.colour, opacity: 0.7 }}>· {channel.channelName}</span>
              )}
              <button
                onClick={() => handleDisconnect(channel)}
                disabled={disconnecting === channel.id}
                title={`Disconnect ${meta.label}`}
                className="ml-1 leading-none hover:opacity-100 disabled:cursor-not-allowed transition-opacity"
                style={{ color: meta.colour, opacity: disconnecting === channel.id ? 0.4 : 0.6 }}
              >
                {disconnecting === channel.id ? '…' : '×'}
              </button>
            </div>
          ) : (
            <a
              key={platform}
              href={`/api/auth/${authPath(platform)}/authorize?business=${selectedBusiness}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] border border-[rgba(255,255,255,0.06)] text-[#888888] hover:border-[rgba(255,255,255,0.12)] hover:text-[#999999] transition-colors"
            >
              <span>{meta.icon}</span>
              <span>Connect {meta.label}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
