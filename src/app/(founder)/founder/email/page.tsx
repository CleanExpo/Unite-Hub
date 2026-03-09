export const dynamic = 'force-dynamic'

import { getUser } from '@/lib/supabase/server'
import {
  isGoogleConfigured,
  fetchGmailThreads,
  getConnectedGoogleAccounts,
} from '@/lib/integrations/google'
import { EMAIL_ACCOUNTS } from '@/lib/email-accounts'

export default async function EmailPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>
}) {
  const params = await searchParams
  const user = await getUser()
  const configured = isGoogleConfigured()

  const connectedAccounts = user ? await getConnectedGoogleAccounts(user.id) : []
  const connectedEmails = new Set(connectedAccounts.map(a => a.email))

  const threads = user && connectedAccounts.length > 0
    ? await fetchGmailThreads(user.id)
    : []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-light text-white/90">Email</h1>
        <p className="text-sm text-white/40 mt-1">Business threads · grouped by portfolio company</p>
      </div>

      {params.connected && (
        <div className="border border-[#00F5FF]/30 bg-[#00F5FF]/5 px-4 py-3 rounded-sm text-sm text-[#00F5FF]">
          ✓ Connected {decodeURIComponent(params.connected)}
        </div>
      )}

      {params.error && (
        <div className="border border-red-500/30 bg-red-500/5 px-4 py-3 rounded-sm text-sm text-red-400">
          Connection failed: {params.error}
        </div>
      )}

      {!configured && (
        <div className="border border-white/10 px-4 py-3 rounded-sm text-sm text-white/40">
          Google OAuth not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
        </div>
      )}

      {/* Account grid */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-white/30 mb-3">Email Accounts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EMAIL_ACCOUNTS.map(account => {
            const isConnected = connectedEmails.has(account.email)
            return (
              <div
                key={account.email}
                className="border border-white/[0.08] px-4 py-3 rounded-sm flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white/80 truncate">{account.email}</p>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mt-0.5">
                    {account.label} · {account.businessKey}
                  </p>
                </div>
                {isConnected ? (
                  <span className="text-[10px] uppercase tracking-wider text-[#00F5FF] flex-shrink-0">
                    Connected
                  </span>
                ) : configured ? (
                  <a
                    href={`/api/auth/google/authorize?email=${encodeURIComponent(account.email)}`}
                    className="text-[10px] uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
                  >
                    Connect →
                  </a>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider text-white/20 flex-shrink-0">
                    Not available
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Thread list */}
      {threads.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-widest text-white/30 mb-3">Recent Threads</h2>
          <div className="space-y-1">
            {threads.map(thread => (
              <div
                key={`${thread.email}-${thread.id}`}
                className="border border-white/[0.08] px-4 py-3 rounded-sm flex items-start gap-4 hover:border-white/[0.15] transition-colors"
              >
                <div
                  className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: thread.unread ? '#00F5FF' : 'transparent',
                    border: thread.unread ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${thread.unread ? 'text-white/90 font-medium' : 'text-white/60'}`}>
                    {thread.subject}
                  </p>
                  <p className="text-xs text-white/40 truncate mt-0.5">
                    {thread.from} · {thread.snippet}
                  </p>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-white/25 flex-shrink-0">
                  {thread.businessKey}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {connectedAccounts.length === 0 && configured && (
        <p className="text-sm text-white/30 text-center py-8">
          Connect an account above to see your threads here.
        </p>
      )}
    </div>
  )
}
