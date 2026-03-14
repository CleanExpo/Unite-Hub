// TEMPORARY diagnostic — remove after debugging
// GET /api/bookkeeper/debug-vault
// Shows what's in the vault without exposing encrypted values

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { loadXeroTokens } from '@/lib/integrations/xero/client'

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

  // Test the exact same function the bookkeeper uses
  let drTokens = null
  let drError = null
  let carsiTokens = null
  let carsiError = null
  try {
    drTokens = await loadXeroTokens(user.id, 'dr')
  } catch (e) {
    drError = e instanceof Error ? e.message : String(e)
  }
  try {
    carsiTokens = await loadXeroTokens(user.id, 'carsi')
  } catch (e) {
    carsiError = e instanceof Error ? e.message : String(e)
  }

  // Check if VAULT_ENCRYPTION_KEY has whitespace issues
  const rawKey = process.env.VAULT_ENCRYPTION_KEY ?? ''
  const keyDiag = {
    length: rawKey.length,
    trimmedLength: rawKey.trim().length,
    hasTrailingWhitespace: rawKey !== rawKey.trim(),
    endsWithNewline: rawKey.endsWith('\n'),
    endsWithCR: rawKey.endsWith('\r'),
  }

  return NextResponse.json({
    founderId: user.id,
    vaultEntries: data ?? [],
    error: error?.message ?? null,
    count: data?.length ?? 0,
    loadXeroTokensResult: {
      dr: drTokens ? 'FOUND' : 'NULL',
      drError,
      carsi: carsiTokens ? 'FOUND' : 'NULL',
      carsiError,
    },
    vaultKeyDiagnostic: keyDiag,
  })
}
