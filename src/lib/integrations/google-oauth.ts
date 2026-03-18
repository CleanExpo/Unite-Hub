// src/lib/integrations/google-oauth.ts
// Google OAuth token management and account listing

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim())
}

export interface StoredTokens {
  access_token: string
  refresh_token: string | null
  expires_at: number
  scope: string
}

export interface ConnectedAccount {
  email: string
  businessKey: string
  label: string
}

export interface ConnectedAccountWithScope extends ConnectedAccount {
  needsReauth: boolean
}

async function refreshAccessToken(tokens: StoredTokens): Promise<string> {
  if (!tokens.refresh_token) throw new Error('No refresh token available')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    console.error('[Google] Token refresh failed:', res.status, errBody)
    throw new Error(`Token refresh failed: ${res.status}`)
  }
  const refreshed = await res.json() as { access_token: string }
  return refreshed.access_token
}

export async function getValidToken(tokens: StoredTokens): Promise<string> {
  if (tokens.expires_at > Date.now() + 60_000) {
    return tokens.access_token
  }
  return refreshAccessToken(tokens)
}

export async function getConnectedGoogleAccounts(founderId: string): Promise<ConnectedAccount[]> {
  const { createServiceClient } = await import('@/lib/supabase/service')
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('credentials_vault')
    .select('label, notes, metadata')
    .eq('founder_id', founderId)
    .eq('service', 'google')

  return (data ?? []).map(row => ({
    email: row.notes ?? '',
    businessKey: (row.metadata as { businessKey?: string })?.businessKey ?? 'personal',
    label: row.label,
  }))
}

export async function getConnectedGoogleAccountsWithScopeStatus(
  founderId: string
): Promise<ConnectedAccountWithScope[]> {
  const { createServiceClient } = await import('@/lib/supabase/service')
  const { decrypt } = await import('@/lib/vault')
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('credentials_vault')
    .select('label, notes, metadata, encrypted_value, iv, salt')
    .eq('founder_id', founderId)
    .eq('service', 'google')

  return (data ?? []).map(row => {
    let needsReauth = true
    try {
      const tokens: StoredTokens = JSON.parse(
        decrypt({ encryptedValue: row.encrypted_value, iv: row.iv, salt: row.salt })
      )
      needsReauth = !tokens.scope?.includes('gmail.modify')
    } catch {
      needsReauth = true
    }
    return {
      email: row.notes ?? '',
      businessKey: (row.metadata as { businessKey?: string })?.businessKey ?? 'personal',
      label: row.label,
      needsReauth,
    }
  })
}

export async function getAccessTokenForEmail(founderId: string, email: string): Promise<string> {
  const { createServiceClient } = await import('@/lib/supabase/service')
  const { decrypt } = await import('@/lib/vault')
  const supabase = createServiceClient()

  const { data: row } = await supabase
    .from('credentials_vault')
    .select('encrypted_value, iv, salt')
    .eq('founder_id', founderId)
    .eq('service', 'google')
    .eq('notes', email)
    .single()

  if (!row) throw new Error(`No Google credentials found for ${email}`)

  const tokens: StoredTokens = JSON.parse(
    decrypt({ encryptedValue: row.encrypted_value, iv: row.iv, salt: row.salt })
  )
  return getValidToken(tokens)
}
