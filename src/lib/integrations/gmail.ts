// src/lib/integrations/gmail.ts
// Gmail API integration — fetch, read, write, and send operations

import { getCached, setCache, invalidateCache } from '@/lib/cache'
import {
  isGoogleConfigured,
  getValidToken,
  getAccessTokenForEmail,
  type StoredTokens,
} from './google-oauth'

const GOOGLE_CACHE_TTL_MS = 5 * 60 * 1_000

// ─── Public types ────────────────────────────────────────────────────────────

export interface GmailThread {
  id: string
  subject: string
  from: string
  snippet: string
  date: string
  unread: boolean
  businessKey: string
  email: string
}

export interface FullMessage {
  id: string
  from: string
  to: string
  date: string
  bodyHtml: string | null
  bodyText: string | null
  attachments: { filename: string; mimeType: string; size: number }[]
  unread: boolean
  labelIds: string[]
}

export interface FullThread {
  id: string
  subject: string
  messages: FullMessage[]
}

export interface ThreadPage {
  threads: GmailThread[]
  nextPageToken?: string
}

// ─── Internal types ──────────────────────────────────────────────────────────

interface GmailApiThread {
  id: string
  snippet: string
  messages?: Array<{
    id: string
    labelIds?: string[]
    payload?: {
      headers?: Array<{ name: string; value: string }>
    }
  }>
}

interface GmailMessagePayload {
  mimeType?: string
  headers?: Array<{ name: string; value: string }>
  body?: { data?: string; size?: number; attachmentId?: string }
  parts?: GmailMessagePayload[]
  filename?: string
}

interface GmailFullMessage {
  id: string
  threadId: string
  labelIds?: string[]
  payload: GmailMessagePayload
}

interface GmailFullThreadResponse {
  id: string
  messages?: GmailFullMessage[]
}

// ─── Body decode helpers ─────────────────────────────────────────────────────

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

function extractBody(payload: GmailMessagePayload): { html: string | null; text: string | null } {
  const mime = payload.mimeType ?? ''

  if (mime === 'text/html' && payload.body?.data) {
    return { html: decodeBase64Url(payload.body.data), text: null }
  }
  if (mime === 'text/plain' && payload.body?.data) {
    return { html: null, text: decodeBase64Url(payload.body.data) }
  }
  if (payload.parts) {
    let html: string | null = null
    let text: string | null = null
    for (const part of payload.parts) {
      const result = extractBody(part)
      if (result.html) html = result.html
      if (!result.html && result.text) text = result.text
    }
    return { html, text }
  }
  return { html: null, text: null }
}

function extractAttachments(
  payload: GmailMessagePayload
): { filename: string; mimeType: string; size: number }[] {
  const attachments: { filename: string; mimeType: string; size: number }[] = []
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType ?? 'application/octet-stream',
          size: part.body.size ?? 0,
        })
      }
      attachments.push(...extractAttachments(part))
    }
  }
  return attachments
}

// ─── Private fetchers ────────────────────────────────────────────────────────

async function fetchThreadsForAccount(
  accessToken: string,
  email: string,
  businessKey: string
): Promise<GmailThread[]> {
  const listRes = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=10&q=in:inbox',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!listRes.ok) return []

  const listData = await listRes.json() as { threads?: Array<{ id: string }> }
  const threadIds = (listData.threads ?? []).slice(0, 10).map(t => t.id)

  const threads = await Promise.all(
    threadIds.map(async (id) => {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!res.ok) return null
      return res.json() as Promise<GmailApiThread>
    })
  )

  return threads
    .filter((t): t is GmailApiThread => t !== null)
    .map((t) => {
      const firstMsg = t.messages?.[0]
      const headers = firstMsg?.payload?.headers ?? []
      const get = (name: string) => headers.find(h => h.name === name)?.value ?? ''
      const unread = firstMsg?.labelIds?.includes('UNREAD') ?? false

      return {
        id: t.id,
        subject: get('Subject') || '(no subject)',
        from: get('From'),
        snippet: t.snippet,
        date: get('Date'),
        unread,
        businessKey,
        email,
      }
    })
}

// ─── Public fetchers ─────────────────────────────────────────────────────────

export async function fetchGmailThreads(founderId: string): Promise<GmailThread[]> {
  if (!isGoogleConfigured()) return getMockThreads()

  const cacheKey = `gmail:${founderId}`
  const cached = getCached<GmailThread[]>(cacheKey)
  if (cached) return cached

  const { createServiceClient } = await import('@/lib/supabase/service')
  const { decrypt } = await import('@/lib/vault')

  const supabase = createServiceClient()
  const { data: vaultRows } = await supabase
    .from('credentials_vault')
    .select('encrypted_value, iv, salt, notes, metadata')
    .eq('founder_id', founderId)
    .eq('service', 'google')

  if (!vaultRows?.length) return getMockThreads()

  const allThreads = await Promise.all(
    vaultRows.map(async (row) => {
      try {
        const tokens: StoredTokens = JSON.parse(
          decrypt({ encryptedValue: row.encrypted_value, iv: row.iv, salt: row.salt })
        )
        const accessToken = await getValidToken(tokens)
        const email = row.notes ?? ''
        const businessKey = (row.metadata as { businessKey?: string })?.businessKey ?? 'personal'
        return fetchThreadsForAccount(accessToken, email, businessKey)
      } catch (err) {
        console.error('[Google] Gmail fetch failed for', row.notes, err)
        return []
      }
    })
  )

  const threads = allThreads.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  setCache(cacheKey, threads, GOOGLE_CACHE_TTL_MS)
  return threads
}

export async function fetchFullThread(
  founderId: string,
  email: string,
  threadId: string
): Promise<FullThread> {
  const accessToken = await getAccessTokenForEmail(founderId, email)

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`Gmail threads.get failed: ${res.status}`)

  const data = await res.json() as GmailFullThreadResponse
  const messages = (data.messages ?? []).map((msg): FullMessage => {
    const headers = msg.payload.headers ?? []
    const get = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
    const { html, text } = extractBody(msg.payload)
    return {
      id: msg.id,
      from: get('From'),
      to: get('To'),
      date: get('Date'),
      bodyHtml: html,
      bodyText: text,
      attachments: extractAttachments(msg.payload),
      unread: msg.labelIds?.includes('UNREAD') ?? false,
      labelIds: msg.labelIds ?? [],
    }
  })

  const firstHeaders = data.messages?.[0]?.payload.headers ?? []
  const subject = firstHeaders.find(h => h.name.toLowerCase() === 'subject')?.value ?? '(no subject)'

  return { id: data.id, subject, messages }
}

export async function fetchThreadsPaginated(
  founderId: string,
  email: string,
  options: { pageToken?: string; query?: string; maxResults?: number } = {}
): Promise<ThreadPage> {
  const accessToken = await getAccessTokenForEmail(founderId, email)
  const businessKey = 'personal'

  const params = new URLSearchParams({
    maxResults: String(options.maxResults ?? 25),
    q: options.query ?? 'in:inbox',
  })
  if (options.pageToken) params.set('pageToken', options.pageToken)

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!listRes.ok) throw new Error(`Gmail threads.list failed: ${listRes.status}`)

  const listData = await listRes.json() as {
    threads?: Array<{ id: string }>
    nextPageToken?: string
  }

  const threadIds = (listData.threads ?? []).map(t => t.id)

  const threads = await Promise.all(
    threadIds.map(async (id) => {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!res.ok) return null
      return res.json() as Promise<GmailApiThread>
    })
  )

  const gmailThreads = threads
    .filter((t): t is GmailApiThread => t !== null)
    .map((t): GmailThread => {
      const firstMsg = t.messages?.[0]
      const headers = firstMsg?.payload?.headers ?? []
      const get = (name: string) => headers.find(h => h.name === name)?.value ?? ''
      const unread = firstMsg?.labelIds?.includes('UNREAD') ?? false
      return {
        id: t.id,
        subject: get('Subject') || '(no subject)',
        from: get('From'),
        snippet: t.snippet,
        date: get('Date'),
        unread,
        businessKey,
        email,
      }
    })

  return { threads: gmailThreads, nextPageToken: listData.nextPageToken }
}

// ─── Write operations (require gmail.modify scope) ───────────────────────────

export async function archiveThread(
  founderId: string,
  email: string,
  threadId: string
): Promise<void> {
  const accessToken = await getAccessTokenForEmail(founderId, email)
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/modify`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeLabelIds: ['INBOX'] }),
    }
  )
  if (!res.ok) throw new Error(`Archive thread failed: ${res.status}`)
  invalidateCache(`gmail:${founderId}`)
}

export async function deleteThread(
  founderId: string,
  email: string,
  threadId: string
): Promise<void> {
  const accessToken = await getAccessTokenForEmail(founderId, email)
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}/trash`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )
  if (!res.ok) throw new Error(`Trash thread failed: ${res.status}`)
  invalidateCache(`gmail:${founderId}`)
}

export async function markAsRead(
  founderId: string,
  email: string,
  messageId: string
): Promise<void> {
  const accessToken = await getAccessTokenForEmail(founderId, email)
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
    }
  )
  if (!res.ok) throw new Error(`Mark as read failed: ${res.status}`)
}

export async function markAsUnread(
  founderId: string,
  email: string,
  messageId: string
): Promise<void> {
  const accessToken = await getAccessTokenForEmail(founderId, email)
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ addLabelIds: ['UNREAD'] }),
    }
  )
  if (!res.ok) throw new Error(`Mark as unread failed: ${res.status}`)
}

export async function applyGmailLabel(
  founderId: string,
  email: string,
  messageId: string,
  labelName: string
): Promise<void> {
  const accessToken = await getAccessTokenForEmail(founderId, email)
  const labelsRes = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/labels',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!labelsRes.ok) throw new Error(`Labels list failed: ${labelsRes.status}`)
  const labelsData = await labelsRes.json() as { labels: Array<{ id: string; name: string }> }
  const label = labelsData.labels.find(l => l.name === labelName)
  if (!label) throw new Error(`Label not found: ${labelName}`)

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ addLabelIds: [label.id] }),
    }
  )
  if (!res.ok) throw new Error(`Apply label failed: ${res.status}`)
}

export async function batchModify(
  founderId: string,
  email: string,
  threadIds: string[],
  options: { addLabels?: string[]; removeLabels?: string[] }
): Promise<void> {
  const accessToken = await getAccessTokenForEmail(founderId, email)
  await Promise.allSettled(
    threadIds.map(id =>
      fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${id}/modify`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addLabelIds: options.addLabels ?? [],
            removeLabelIds: options.removeLabels ?? [],
          }),
        }
      )
    )
  )
  invalidateCache(`gmail:${founderId}`)
}

export async function sendReply(
  founderId: string,
  email: string,
  threadId: string,
  opts: { to: string; subject: string; body: string; inReplyToMessageId?: string }
): Promise<{ messageId: string }> {
  const accessToken = await getAccessTokenForEmail(founderId, email)

  // Strip CR/LF to prevent email header injection
  const cleanTo = opts.to.replace(/[\r\n]/g, '')
  const cleanSubject = opts.subject.replace(/[\r\n]/g, ' ')
  const replyTo = opts.inReplyToMessageId ? `\r\nIn-Reply-To: <${opts.inReplyToMessageId}>\r\nReferences: <${opts.inReplyToMessageId}>` : ''
  const mime = [
    `From: ${email}`,
    `To: ${cleanTo}`,
    `Subject: ${cleanSubject}${replyTo}`,
    'Content-Type: text/html; charset=UTF-8',
    '',
    opts.body,
  ].join('\r\n')

  const raw = Buffer.from(mime)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw, threadId }),
    }
  )
  if (!res.ok) throw new Error(`Send reply failed: ${res.status}`)
  const sent = await res.json() as { id: string }
  return { messageId: sent.id }
}

export function invalidateGoogleCache(founderId: string): void {
  invalidateCache(founderId)
}

// ─── Mocks ───────────────────────────────────────────────────────────────────

export function getMockThreads(): GmailThread[] {
  return [
    { id: '1', subject: 'Q1 Review', from: 'client@example.com.au', snippet: 'Hi Phill, following up on the Q1 review…', date: new Date().toISOString(), unread: true, businessKey: 'synthex', email: 'support@synthex.social' },
    { id: '2', subject: 'Invoice #1042', from: 'accounts@supplier.com.au', snippet: 'Please find attached invoice #1042…', date: new Date().toISOString(), unread: false, businessKey: 'dr', email: 'phill@disasterrecovery.com.au' },
  ]
}
