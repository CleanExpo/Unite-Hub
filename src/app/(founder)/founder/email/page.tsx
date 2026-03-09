export const dynamic = 'force-dynamic'

import { isGoogleConfigured, getMockThreads } from '@/lib/integrations/google'
import { ConnectCard } from '@/components/founder/integrations/ConnectCard'

export default function EmailPage() {
  const configured = isGoogleConfigured()
  const threads = getMockThreads()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-light text-white/90">Email</h1>
        <p className="text-sm text-white/40 mt-1">Business threads · grouped by portfolio company</p>
      </div>

      {!configured ? (
        <ConnectCard
          service="Google"
          description="Connect your Google account to read and manage emails grouped by business across your portfolio."
          connectUrl="/api/google/connect"
          icon="✉️"
        />
      ) : (
        <div className="space-y-2">
          {threads.map(thread => (
            <div key={thread.id} className="border border-white/[0.10] px-4 py-3 rounded-sm flex items-start gap-4 hover:border-white/[0.18] transition-colors">
              <div className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: thread.unread ? '#00F5FF' : 'transparent', border: thread.unread ? 'none' : '1px solid rgba(255,255,255,0.2)' }} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${thread.unread ? 'text-white/90 font-medium' : 'text-white/60'} truncate`}>{thread.subject}</p>
                <p className="text-xs text-white/40 truncate mt-0.5">{thread.from} · {thread.snippet}</p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-white/30 flex-shrink-0">{thread.businessKey}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
