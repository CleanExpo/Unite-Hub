// src/lib/integrations/calendar.ts
// Google Calendar API integration

import { getCached, setCache } from '@/lib/cache'
import { isGoogleConfigured, getValidToken, type StoredTokens } from './google-oauth'

const GOOGLE_CACHE_TTL_MS = 5 * 60 * 1_000

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  businessKey: string
  colour: string
  email: string
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

interface GoogleCalendarEvent {
  id: string
  summary?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
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
      } catch (err) {
        console.error('[Google] Calendar fetch failed for', row.notes, err)
        return []
      }
    })
  )

  const events = allEvents.flat().sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  setCache(cacheKey, events, GOOGLE_CACHE_TTL_MS)
  return events
}

export function getMockEvents(): CalendarEvent[] {
  const now = new Date()
  return [
    { id: '1', title: 'Synthex Client Call', start: now.toISOString(), end: new Date(now.getTime() + 3600000).toISOString(), businessKey: 'synthex', colour: '#00F5FF', email: 'support@synthex.social' },
    { id: '2', title: 'CARSI Course Launch', start: new Date(now.getTime() + 86400000).toISOString(), end: new Date(now.getTime() + 90000000).toISOString(), businessKey: 'carsi', colour: '#F59E0B', email: 'support@carsi.com.au' },
  ]
}
