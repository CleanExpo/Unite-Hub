// src/lib/integrations/google.ts
// Real Gmail + Calendar API integration via stored OAuth tokens in credentials_vault
// Falls back to mocks when Google is not configured or no accounts connected
// Results are cached in-memory for 5 minutes to reduce API call volume

import { getCached, setCache, invalidateCache } from '@/lib/cache'

/** Cache TTL for Gmail threads and Calendar events (5 minutes in ms) */
const GOOGLE_CACHE_TTL_MS = 5 * 60 * 1_000

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

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

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  businessKey: string
  colour: string
  email: string
}

// ─── Token helpers ──────────────────────────────────────────────────────────

interface StoredTokens {
  access_token: string
  refresh_token: string | null
  expires_at: number
  scope: string
}

async function refreshAccessToken(tokens: StoredTokens): Promise<string> {
  if (!tokens.refresh_token) throw new Error('No refresh token available')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) throw new Error('Token refresh failed')
  const refreshed = await res.json() as { access_token: string }
  return refreshed.access_token
}

async function getValidToken(tokens: StoredTokens): Promise<string> {
  // Refresh 60 seconds before expiry
  if (tokens.expires_at > Date.now() + 60_000) {
    return tokens.access_token
  }
  return refreshAccessToken(tokens)
}

// ─── Gmail ──────────────────────────────────────────────────────────────────

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

async function fetchThreadsForAccount(
  accessToken: string,
  email: string,
  businessKey: string
): Promise<GmailThread[]> {
  // List recent threads
  const listRes = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=10&q=in:inbox',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!listRes.ok) return []

  const listData = await listRes.json() as { threads?: Array<{ id: string }> }
  const threadIds = (listData.threads ?? []).slice(0, 10).map(t => t.id)

  // Fetch metadata for each thread in parallel
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

// ─── Calendar ───────────────────────────────────────────────────────────────

interface GoogleCalendarEvent {
  id: string
  summary?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
}

const BUSINESS_COLOURS: Record<string, string> = {
  dr:       '#EF4444',
  restore:  '#3B82F6',
  carsi:    '#F59E0B',
  ccw:      '#8B5CF6',
  synthex:  '#00F5FF',
  nrpg:     '#10B981',
  personal: '#6B7280',
}

async function fetchEventsForAccount(
  accessToken: string,
  email: string,
  businessKey: string
): Promise<CalendarEvent[]> {
  const timeMin = new Date().toISOString()
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=10&orderBy=startTime&singleEvents=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return []

  const data = await res.json() as { items?: GoogleCalendarEvent[] }
  return (data.items ?? []).map(e => ({
    id: e.id,
    title: e.summary ?? '(untitled)',
    start: e.start.dateTime ?? e.start.date ?? '',
    end: e.end.dateTime ?? e.end.date ?? '',
    businessKey,
    colour: BUSINESS_COLOURS[businessKey] ?? '#6B7280',
    email,
  }))
}

// ─── Vault-backed fetchers ───────────────────────────────────────────────────
// These are called server-side only (Server Components or API routes)

export interface ConnectedAccount {
  email: string
  businessKey: string
  label: string
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
      } catch {
        return []
      }
    })
  )

  const threads = allThreads.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  setCache(cacheKey, threads, GOOGLE_CACHE_TTL_MS)
  return threads
}

export async function fetchCalendarEvents(founderId: string): Promise<CalendarEvent[]> {
  if (!isGoogleConfigured()) return getMockEvents()

  const cacheKey = `calendar:${founderId}`
  const cached = getCached<CalendarEvent[]>(cacheKey)
  if (cached) return cached

  const { createServiceClient } = await import('@/lib/supabase/service')
  const { decrypt } = await import('@/lib/vault')

  const supabase = createServiceClient()
  const { data: vaultRows } = await supabase
    .from('credentials_vault')
    .select('encrypted_value, iv, salt, notes, metadata')
    .eq('founder_id', founderId)
    .eq('service', 'google')

  if (!vaultRows?.length) return getMockEvents()

  const allEvents = await Promise.all(
    vaultRows.map(async (row) => {
      try {
        const tokens: StoredTokens = JSON.parse(
          decrypt({ encryptedValue: row.encrypted_value, iv: row.iv, salt: row.salt })
        )
        const accessToken = await getValidToken(tokens)
        const email = row.notes ?? ''
        const businessKey = (row.metadata as { businessKey?: string })?.businessKey ?? 'personal'
        return fetchEventsForAccount(accessToken, email, businessKey)
      } catch {
        return []
      }
    })
  )

  const events = allEvents.flat().sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  setCache(cacheKey, events, GOOGLE_CACHE_TTL_MS)
  return events
}

/**
 * Manually invalidate cached Gmail + Calendar data for a founder.
 * Call this when the user clicks a "Refresh" button to force a re-fetch.
 */
export function invalidateGoogleCache(founderId: string): void {
  invalidateCache(founderId)
}

// ─── Mocks (dev / pre-connect fallback) ─────────────────────────────────────

export function getMockThreads(): GmailThread[] {
  return [
    { id: '1', subject: 'Q1 Review', from: 'client@example.com.au', snippet: 'Hi Phill, following up on the Q1 review…', date: new Date().toISOString(), unread: true, businessKey: 'synthex', email: 'support@synthex.social' },
    { id: '2', subject: 'Invoice #1042', from: 'accounts@supplier.com.au', snippet: 'Please find attached invoice #1042…', date: new Date().toISOString(), unread: false, businessKey: 'dr', email: 'phill@disasterrecovery.com.au' },
  ]
}

export function getMockEvents(): CalendarEvent[] {
  const now = new Date()
  return [
    { id: '1', title: 'Synthex Client Call', start: now.toISOString(), end: new Date(now.getTime() + 3600000).toISOString(), businessKey: 'synthex', colour: '#00F5FF', email: 'support@synthex.social' },
    { id: '2', title: 'CARSI Course Launch', start: new Date(now.getTime() + 86400000).toISOString(), end: new Date(now.getTime() + 90000000).toISOString(), businessKey: 'carsi', colour: '#F59E0B', email: 'support@carsi.com.au' },
  ]
}
