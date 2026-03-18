'use client'

interface Props {
  email: string
}

export function ReauthBanner({ email }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 border border-amber-500/30 bg-amber-500/5 px-4 py-3 rounded-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-amber-400 text-sm flex-shrink-0">⚠</span>
        <p className="text-sm text-amber-300 truncate">
          <span className="font-medium">{email}</span> needs re-authorisation for full email access
        </p>
      </div>
      <a
        href={`/api/auth/google/authorize?email=${encodeURIComponent(email)}&force=true`}
        className="text-[11px] uppercase tracking-wider text-amber-400 hover:text-amber-200 transition-colors flex-shrink-0 border border-amber-500/40 px-3 py-1 rounded-sm"
      >
        Reconnect →
      </a>
    </div>
  )
}
