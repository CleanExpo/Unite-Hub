// TEMPORARY diagnostic — remove after debugging
// GET /api/bookkeeper/debug-vault
// Shows what's in the vault without exposing encrypted values

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('credentials_vault')
    .select('service, label, notes, metadata, created_at, last_accessed_at')
    .eq('founder_id', user.id)
    .order('service')

  return NextResponse.json({
    founderId: user.id,
    vaultEntries: data ?? [],
    error: error?.message ?? null,
    count: data?.length ?? 0,
  })
}
