// src/app/api/auth/imap/connect/route.ts
// POST /api/auth/imap/connect
// Validates IMAP credentials, encrypts, stores in credentials_vault

import { NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { encrypt } from '@/lib/vault'
import { accountByEmail } from '@/lib/email-accounts'

// SiteGround IMAP config per domain
const IMAP_CONFIG: Record<string, { host: string; port: number }> = {
  'carsi.com.au': { host: 'mail.carsi.com.au', port: 993 },
}

function getImapConfig(email: string) {
  const domain = email.split('@')[1]
  return IMAP_CONFIG[domain] ?? null
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let email: string, password: string
  try {
    const body = await request.json() as { email?: string; password?: string }
    email = body.email?.trim() ?? ''
    password = body.password ?? ''
    if (!email || !password) throw new Error('missing fields')
  } catch {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }

  const imapCfg = getImapConfig(email)
  if (!imapCfg) {
    return NextResponse.json({ error: `No IMAP config for domain: ${email.split('@')[1]}` }, { status: 400 })
  }

  // Validate credentials by attempting a real connection
  const client = new ImapFlow({
    host: imapCfg.host,
    port: imapCfg.port,
    secure: true,
    auth: { user: email, pass: password },
    logger: false,
    connectionTimeout: 10_000,
  })

  try {
    await client.connect()
    await client.logout()
  } catch (err) {
    console.error('[IMAP] Connection validation failed:', err)
    return NextResponse.json({ error: 'Invalid credentials or server unreachable' }, { status: 401 })
  }

  // Encrypt and store
  const payload = encrypt(JSON.stringify({
    host: imapCfg.host,
    port: imapCfg.port,
    email,
    username: email,
    password,
  }))

  const account = accountByEmail(email)
  const businessKey = account?.businessKey ?? 'personal'
  const label = account?.label ?? email

  const supabase = createServiceClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('founder_id', user.id)
    .eq('slug', businessKey)
    .maybeSingle()

  await supabase.from('credentials_vault').upsert(
    {
      founder_id: user.id,
      business_id: business?.id ?? null,
      service: 'imap',
      label,
      encrypted_value: payload.encryptedValue,
      iv: payload.iv,
      salt: payload.salt,
      notes: email,
      metadata: { email, businessKey },
      last_accessed_at: new Date().toISOString(),
    },
    { onConflict: 'founder_id,service,label' }
  )

  return NextResponse.json({ ok: true })
}
