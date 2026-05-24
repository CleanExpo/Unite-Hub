export const dynamic = 'force-dynamic'

import { getUser } from '@/lib/supabase/server'
import {
  isGoogleConfigured,
  getConnectedGoogleAccountsWithScopeStatus,
} from '@/lib/integrations/google'
import { EmailWorkbench } from '@/components/founder/email/EmailWorkbench'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function EmailPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>
}) {
  const params = await searchParams
  const user = await getUser()
  const configured = isGoogleConfigured()

  const accounts = user ? await getConnectedGoogleAccountsWithScopeStatus(user.id) : []

  return (
    <div className="p-6 space-y-4 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      <PageHeader
        title="Email"
        subtitle="Gmail workbench — read, act, and triage across all connected accounts"
      />

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
        <div className="border px-4 py-3 rounded-sm text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
          Google OAuth not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
        </div>
      )}

      {configured && accounts.length === 0 && (
        <div className="border border-white/[0.06] px-4 py-8 rounded-sm text-center">
          <p className="text-sm text-white/30 mb-3">No Gmail accounts connected</p>
          <p className="text-xs text-white/20">
            Connect accounts via Settings → Integrations → Google
          </p>
        </div>
      )}

      {configured && accounts.length > 0 && (
        <div className="flex-1 min-h-0">
          <EmailWorkbench accounts={accounts} />
        </div>
      )}
    </div>
  )
}
