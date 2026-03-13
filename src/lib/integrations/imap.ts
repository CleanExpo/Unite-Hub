// src/lib/integrations/imap.ts
// Fetches email threads from SiteGround IMAP accounts via stored credentials
// Returns GmailThread[] — same interface as google.ts so UI needs no changes

import { ImapFlow } from 'imapflow'
import { getCached, setCache } from '@/lib/cache'
import type { GmailThread, ConnectedAccount } from '@/lib/integrations/google'

const IMAP_CACHE_TTL_MS = 5 * 60 * 1_000

interface StoredImapCredentials {
  host: string
  port: number
  email: string
  username: string
  password: string
}

export async function getConnectedImapAccounts(founderId: string): Promise<ConnectedAccount[]> {
  const { createServiceClient } = await import('@/lib/supabase/service')
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('credentials_vault')
    .select('label, notes, metadata')
    .eq('founder_id', founderId)
    .eq('service', 'imap')

  return (data ?? []).map(row => ({
    email: row.notes ?? '',
    businessKey: (row.metadata as { businessKey?: string })?.businessKey ?? 'personal',
    label: row.label,
  }))
}

async function fetchThreadsForImapAccount(
  creds: StoredImapCredentials,
  email: string,
  businessKey: string
): Promise<GmailThread[]> {
  const client = new ImapFlow({
    host: creds.host,
    port: creds.port,
    secure: true,
    auth: { user: creds.username, pass: creds.password },
    logger: false,
    connectionTimeout: 10_000,
  })

  try {
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')

    const threads: GmailThread[] = []

    try {
      // Fetch last 50 messages by sequence number
      const mailbox = client.mailbox
      const total = mailbox ? mailbox.exists : 0
      if (total === 0) return []

      const start = Math.max(1, total - 49)
      const range = `${start}:${total}`

      for await (const msg of client.fetch(range, {
        envelope: true,
        flags: true,
      })) {
        const envelope = msg.envelope
        if (!envelope) continue

        const subject = envelope.subject ?? '(no subject)'
        const from = envelope.from?.[0]
          ? `${envelope.from[0].name ?? ''} <${envelope.from[0].address ?? ''}>`.trim()
          : 'unknown'
        const date = envelope.date?.toISOString() ?? new Date().toISOString()
        const unread = !msg.flags?.has('\\Seen')

        threads.push({
          id: String(msg.uid),
          subject,
          from,
          snippet: '',  // IMAP envelope doesn't include body preview — acceptable limitation
          date,
          unread,
          businessKey,
          email,
        })
      }
    } finally {
      lock.release()
    }

    await client.logout().catch(() => {})

    // Return newest first (IMAP fetch is oldest-first by default)
    return threads.reverse()
  } catch (err) {
    console.error('[IMAP] Fetch failed for', email, err)
    await client.logout().catch(() => {})
    return []
  }
}

export async function fetchImapThreads(founderId: string): Promise<GmailThread[]> {
  const cacheKey = `imap:${founderId}`
  const cached = getCached<GmailThread[]>(cacheKey)
  if (cached) return cached

  const { createServiceClient } = await import('@/lib/supabase/service')
  const { decrypt } = await import('@/lib/vault')

  const supabase = createServiceClient()
  const { data: vaultRows } = await supabase
    .from('credentials_vault')
    .select('encrypted_value, iv, salt, notes, metadata')
    .eq('founder_id', founderId)
    .eq('service', 'imap')

  if (!vaultRows?.length) return []

  const allThreads = await Promise.all(
    vaultRows.map(async (row) => {
      try {
        const creds: StoredImapCredentials = JSON.parse(
          decrypt({ encryptedValue: row.encrypted_value, iv: row.iv, salt: row.salt })
        )
        const email = row.notes ?? ''
        const businessKey = (row.metadata as { businessKey?: string })?.businessKey ?? 'personal'
        return fetchThreadsForImapAccount(creds, email, businessKey)
      } catch (err) {
        console.error('[IMAP] Decrypt/fetch failed for', row.notes, err)
        return []
      }
    })
  )

  const threads = allThreads
    .flat()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  setCache(cacheKey, threads, IMAP_CACHE_TTL_MS)
  return threads
}
