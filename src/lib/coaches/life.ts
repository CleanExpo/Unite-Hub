// src/lib/coaches/life.ts
// Life Coach data fetcher — calendar events + Gmail threads for today

import type { CoachContext, CoachDataFetcher } from './types'
import {
  fetchCalendarEvents,
  fetchGmailThreads,
  isGoogleConfigured,
  getMockEvents,
  getMockThreads,
} from '@/lib/integrations/google'

export const fetchLifeData: CoachDataFetcher = async (founderId: string): Promise<CoachContext> => {
  const today = new Date()
  const reportDate = today.toISOString().split('T')[0]

  let events
  let threads

  if (isGoogleConfigured()) {
    try {
      ;[events, threads] = await Promise.all([
        fetchCalendarEvents(founderId),
        fetchGmailThreads(founderId),
      ])
    } catch (err) {
      console.warn('[Life Coach] Google API error, falling back to mocks:', err)
      events = getMockEvents()
      threads = getMockThreads()
    }
  } else {
    events = getMockEvents()
    threads = getMockThreads()
  }

  // Filter to today's events
  const todayStr = reportDate
  const todayEvents = events.filter((e) => e.start.startsWith(todayStr))

  return {
    coachType: 'life',
    reportDate,
    data: {
      events: todayEvents.map((e) => ({
        title: e.title,
        start: e.start,
        end: e.end,
        businessKey: e.businessKey,
      })),
      threads: threads.map((t) => ({
        subject: t.subject,
        from: t.from,
        snippet: t.snippet,
        unread: t.unread,
        businessKey: t.businessKey,
      })),
      totalEvents: todayEvents.length,
      totalThreads: threads.length,
      unreadThreads: threads.filter((t) => t.unread).length,
    },
  }
}
