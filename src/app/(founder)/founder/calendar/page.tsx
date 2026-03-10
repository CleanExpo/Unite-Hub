export const dynamic = 'force-dynamic'

import { getUser } from '@/lib/supabase/server'
import {
  isGoogleConfigured,
  fetchCalendarEvents,
  getConnectedGoogleAccounts,
} from '@/lib/integrations/google'

export default async function CalendarPage() {
  const user = await getUser()
  const configured = isGoogleConfigured()

  const connectedAccounts = user ? await getConnectedGoogleAccounts(user.id) : []

  // Fetch real calendar events when accounts are connected; falls back to mocks
  const events = user ? await fetchCalendarEvents(user.id) : []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-light text-white/90">Calendar</h1>
        <p className="text-sm text-white/40 mt-1">Events · colour-coded by business</p>
      </div>

      {!configured && (
        <div className="border border-white/10 px-4 py-3 rounded-sm text-sm text-white/40">
          Google OAuth not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
        </div>
      )}

      {configured && connectedAccounts.length === 0 && (
        <div className="border border-white/10 px-4 py-3 rounded-sm text-sm text-white/40">
          No Google accounts connected — visit{' '}
          <a href="/founder/email" className="text-[#00F5FF] hover:underline">
            Email settings
          </a>{' '}
          to connect.
        </div>
      )}

      {events.length > 0 ? (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="border border-white/[0.10] px-4 py-3 rounded-sm flex items-center gap-4 hover:border-white/[0.18] transition-colors"
            >
              {/* Business colour stripe */}
              <div
                className="w-1 h-10 rounded-full flex-shrink-0"
                style={{ backgroundColor: event.colour }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white/90 truncate">{event.title}</p>
                <p className="text-xs text-white/40 mt-0.5">
                  {new Date(event.start).toLocaleString('en-AU', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wider text-white/30">
                  {event.businessKey}
                </span>
                <p className="text-[10px] text-white/20 mt-0.5">
                  {event.email.split('@')[1]}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        configured && connectedAccounts.length > 0 && (
          <p className="text-sm text-white/30 text-center py-8">
            No upcoming events across your connected calendars.
          </p>
        )
      )}
    </div>
  )
}
