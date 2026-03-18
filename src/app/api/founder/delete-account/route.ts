import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/founder/delete-account
 * Privacy Act APP 11 — right to erasure.
 *
 * Requires body: { confirm: "DELETE MY ACCOUNT" }
 *
 * Explicit deletes run before auth.users deletion for tables that may
 * not yet have CASCADE configured. auth.users deletion cascades the rest.
 */
export async function DELETE(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  if (body?.confirm !== 'DELETE MY ACCOUNT') {
    return NextResponse.json(
      { error: 'Confirmation required. Send { "confirm": "DELETE MY ACCOUNT" }' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()
  const founderId = user.id

  // Explicit deletes for tables that may lack CASCADE from auth.users
  const tables = [
    'contacts',
    'nexus_pages',
    'nexus_rows',
    'credentials_vault',
    'approval_queue',
    'social_channels',
    'brand_identities',
    'generated_content',
    'video_assets',
    'social_engagements',
    'email_campaigns',
    'platform_analytics',
    'advisory_cases',
    'bookkeeper_transactions',
    'email_triage_results',
  ] as const

  for (const table of tables) {
    await supabase.from(table).delete().eq('founder_id', founderId)
  }

  // Delete the auth user — cascades FK-linked tables (experiments, nexus_databases, etc.)
  const { error } = await supabase.auth.admin.deleteUser(founderId)
  if (error) {
    console.error('[delete-account] auth.admin.deleteUser failed:', error.message)
    return NextResponse.json({ error: 'Account deletion failed' }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
