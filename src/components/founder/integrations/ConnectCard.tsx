"use client"

// src/components/founder/integrations/ConnectCard.tsx
// Reusable "Connect [Service]" card — used by all integration pages

interface ConnectCardProps {
  service: string
  description: string
  connectUrl: string
  icon: string
  comingSoon?: boolean
}

export function ConnectCard({
  service,
  description,
  connectUrl,
  icon,
  comingSoon,
}: ConnectCardProps) {
  return (
    <div className="border border-white/[0.10] p-8 rounded-sm max-w-md">
      <div className="text-4xl mb-4">{icon}</div>
      <h2 className="text-lg font-light text-white/90 mb-2">Connect {service}</h2>
      <p className="text-sm text-white/50 mb-6 leading-relaxed">{description}</p>
      {comingSoon ? (
        <div className="inline-flex items-center gap-2 px-4 py-2 border text-xs uppercase tracking-widest rounded-sm cursor-not-allowed" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
          Coming Soon
        </div>
      ) : (
        <a
          href={connectUrl}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF] text-[11px] uppercase tracking-[0.2em] hover:bg-[#00F5FF]/20 transition-colors rounded-sm"
        >
          Connect {service} →
        </a>
      )}
    </div>
  )
}
