export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getUser } from '@/lib/supabase/server'
import {
  isGoogleConfigured,
  fetchCalendarEvents,
  getConnectedGoogleAccounts,
} from '@/lib/integrations/google'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function CalendarPage() {
  const user = await getUser()
  const configured = isGoogleConfigured()

  const connectedAccounts = user ? await getConnectedGoogleAccounts(user.id) : []

  // Fetch real calendar events when accounts are connected; falls back to mocks
  const events = user ? await fetchCalendarEvents(user.id) : []

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Calendar"
        subtitle="Events from connected Google Calendars"
        tip="Connect a Google account via Email settings to see events here"
      />

      {!configured && (
        <div className="border px-4 py-3 rounded-sm text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
          Google OAuth not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
        </div>
      )}

      {configured && connectedAccounts.length === 0 && (
        <div className="border px-4 py-3 rounded-sm text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
          No Google accounts connected — visit{' '}
          <Link href="/founder/email" className="text-[#00F5FF] hover:underline">
            Email settings
          </Link>{' '}
          to connect.
        </div>
      )}

      {events.length > 0 ? (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="border px-4 py-3 rounded-sm flex items-center gap-4 hover:border-white/[0.18] transition-colors"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {/* Business colour stripe */}
              <div
                className="w-1 h-10 rounded-full flex-shrink-0"
                style={{ backgroundColor: event.colour }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white/90 truncate">{event.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {new Date(event.start).toLocaleString('en-AU', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  {event.businessKey}
                </span>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {event.email.split('@')[1]}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        configured && connectedAccounts.length > 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
            No upcoming events across your connected calendars.
          </p>
        )
      )}
    </div>
  )
}
