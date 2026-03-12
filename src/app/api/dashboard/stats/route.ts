import { NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()

  // Fire all count queries in parallel
  const [
    contactsResult,
    vaultResult,
    approvalsResult,
    casesResult,
    bookkeeperResult,
  ] = await Promise.all([
    // Total contacts
    supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('founder_id', user.id),

    // Total vault entries
    supabase
      .from('credentials_vault')
      .select('*', { count: 'exact', head: true })
      .eq('founder_id', user.id),

    // Pending approvals
    supabase
      .from('approval_queue')
      .select('*', { count: 'exact', head: true })
      .eq('founder_id', user.id)
      .eq('status', 'pending'),

    // Active advisory cases
    supabase
      .from('advisory_cases')
      .select('*', { count: 'exact', head: true })
      .eq('founder_id', user.id)
      .eq('status', 'active'),

    // Last bookkeeper run
    supabase
      .from('bookkeeper_runs')
      .select('status, created_at')
      .eq('founder_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  return NextResponse.json({
    contacts: contactsResult.count ?? 0,
    vaultEntries: vaultResult.count ?? 0,
    pendingApprovals: approvalsResult.count ?? 0,
    activeCases: casesResult.count ?? 0,
    lastBookkeeperRun: bookkeeperResult.data
      ? {
          status: bookkeeperResult.data.status,
          createdAt: bookkeeperResult.data.created_at,
        }
      : null,
  })
}
