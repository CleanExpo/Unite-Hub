// src/lib/integrations/microsoft-oauth.ts
// Microsoft OAuth token management and Graph sender lookup.

const PLACEHOLDER_MICROSOFT_CLIENT_PATTERNS = [
  /^your-production-client-id/i,
  /^your-microsoft-client-id/i,
  /^your-client-id/i,
]

const MICROSOFT_TOKEN_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/token'

export const MICROSOFT_OAUTH_SCOPES = [
  'openid',
  'offline_access',
  'email',
  'profile',
  'User.Read',
  'Mail.Read',
  'Mail.Send',
].join(' ')

export interface MicrosoftStoredTokens {
  access_token: string
  refresh_token: string | null
  expires_at: number
  scope: string
}

export interface MicrosoftSender {
  email: string
  displayName: string | null
}

export function isMicrosoftClientIdPlaceholder(clientId: string): boolean {
  const id = clientId.trim()
  if (!id) return true
  return PLACEHOLDER_MICROSOFT_CLIENT_PATTERNS.some((re) => re.test(id))
}

export function isMicrosoftConfigured(): boolean {
  const clientId = process.env.MICROSOFT_CLIENT_ID?.trim() ?? ''
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET?.trim() ?? ''
  return Boolean(clientId && clientSecret && !isMicrosoftClientIdPlaceholder(clientId))
}

async function refreshAccessToken(tokens: MicrosoftStoredTokens): Promise<string> {
  if (!tokens.refresh_token) throw new Error('No Microsoft refresh token available')

  const res = await fetch(MICROSOFT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!.trim(),
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!.trim(),
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
      scope: tokens.scope,
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    console.error('[Microsoft OAuth] Token refresh failed:', res.status, errBody)
    throw new Error(`Microsoft token refresh failed: ${res.status}`)
  }

  const refreshed = (await res.json()) as { access_token: string }
  return refreshed.access_token
}

export async function getValidMicrosoftToken(tokens: MicrosoftStoredTokens): Promise<string> {
  if (tokens.expires_at > Date.now() + 60_000) {
    return tokens.access_token
  }

  return refreshAccessToken(tokens)
}

export async function getMicrosoftAccessTokenForEmail(
  founderId: string,
  email: string,
): Promise<string> {
  const { createServiceClient } = await import('@/lib/supabase/service')
  const { decrypt } = await import('@/lib/vault')
  const supabase = createServiceClient()

  const { data: row } = await supabase
    .from('credentials_vault')
    .select('encrypted_value, iv, salt')
    .eq('founder_id', founderId)
    .eq('service', 'microsoft')
    .eq('notes', email)
    .single()

  if (!row) throw new Error(`No Microsoft credentials found for ${email}`)

  const tokens = JSON.parse(
    decrypt({ encryptedValue: row.encrypted_value, iv: row.iv, salt: row.salt }),
  ) as MicrosoftStoredTokens

  return getValidMicrosoftToken(tokens)
}

export async function fetchMicrosoftSender(accessToken: string): Promise<MicrosoftSender> {
  const res = await fetch(
    'https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    },
  )

  if (!res.ok) {
    throw new Error(`Microsoft Graph sender lookup failed: ${res.status}`)
  }

  const profile = (await res.json()) as {
    displayName?: string
    mail?: string
    userPrincipalName?: string
  }
  const email = profile.mail ?? profile.userPrincipalName

  if (!email) throw new Error('Microsoft Graph sender lookup returned no email')

  return {
    email,
    displayName: profile.displayName ?? null,
  }
}
