// src/app/(founder)/founder/social/page.tsx
import { getConnections } from '@/lib/integrations/social'

const PLATFORM_META = {
  facebook:  { icon: 'f',  label: 'Facebook',  colour: '#1877F2' },
  instagram: { icon: '◈',  label: 'Instagram', colour: '#E1306C' },
  linkedin:  { icon: 'in', label: 'LinkedIn',  colour: '#0A66C2' },
  tiktok:    { icon: '♪',  label: 'TikTok',   colour: '#FE2C55' },
  youtube:   { icon: '▶',  label: 'YouTube',  colour: '#FF0000' },
} as const

export default function SocialPage() {
  const connections = getConnections('all')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-light text-white/90">Social</h1>
        <p className="text-sm text-white/40 mt-1">Connect your social platforms to manage content across all businesses</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {connections.map(conn => {
          const meta = PLATFORM_META[conn.platform]
          return (
            <div
              key={conn.platform}
              className="border border-white/[0.10] p-5 rounded-sm space-y-3 hover:border-white/[0.18] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-sm flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: meta.colour + '20', color: meta.colour }}
                >
                  {meta.icon}
                </div>
                <span className="text-sm text-white/80 font-medium">{meta.label}</span>
                <span className="ml-auto text-[10px] text-white/30 uppercase tracking-wider">
                  {conn.connected ? 'Connected' : 'Not connected'}
                </span>
              </div>
              {!conn.connected && (
                <a
                  href={`/api/social/${conn.platform}/connect`}
                  className="block w-full text-center py-2 text-[10px] uppercase tracking-[0.15em] text-[#00F5FF]/60 border border-[#00F5FF]/20 rounded-sm hover:bg-[#00F5FF]/5 transition-colors"
                >
                  Connect
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
