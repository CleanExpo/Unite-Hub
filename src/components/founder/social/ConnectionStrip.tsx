'use client'

import type { SocialChannel, SocialPlatform } from '@/lib/integrations/social/types'

const PLATFORM_META: Record<SocialPlatform, { label: string; colour: string; icon: string }> = {
  facebook:  { label: 'Facebook',  colour: '#1877F2', icon: 'f' },
  instagram: { label: 'Instagram', colour: '#E1306C', icon: '◈' },
  linkedin:  { label: 'LinkedIn',  colour: '#0A66C2', icon: 'in' },
  tiktok:    { label: 'TikTok',    colour: '#FE2C55', icon: '♪' },
  youtube:   { label: 'YouTube',   colour: '#FF0000', icon: '▶' },
}

const ALL_PLATFORMS: SocialPlatform[] = ['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube']

interface Props {
  channels: SocialChannel[]
}

export function ConnectionStrip({ channels }: Props) {
  const connectedPlatforms = new Set(
    channels.filter(c => c.isConnected).map(c => c.platform)
  )

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_PLATFORMS.map(platform => {
        const meta = PLATFORM_META[platform]
        const connected = connectedPlatforms.has(platform)

        return connected ? (
          <div
            key={platform}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px]"
            style={{ backgroundColor: `${meta.colour}15`, border: `1px solid ${meta.colour}40` }}
          >
            <span style={{ color: meta.colour }}>{meta.icon}</span>
            <span style={{ color: meta.colour }}>{meta.label}</span>
          </div>
        ) : (
          <a
            key={platform}
            href={`/api/auth/${platform === 'facebook' || platform === 'instagram' ? 'meta' : platform}/authorize?business=dr`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] border border-white/10 text-white/30 hover:border-white/20 hover:text-white/50 transition-colors"
          >
            <span>{meta.icon}</span>
            <span>Connect {meta.label}</span>
          </a>
        )
      })}
    </div>
  )
}
