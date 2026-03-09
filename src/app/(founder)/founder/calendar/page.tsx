export const dynamic = 'force-dynamic'

import { isGoogleConfigured, getMockEvents } from '@/lib/integrations/google'
import { ConnectCard } from '@/components/founder/integrations/ConnectCard'

export default function CalendarPage() {
  const configured = isGoogleConfigured()
  const events = getMockEvents()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-light text-white/90">Calendar</h1>
        <p className="text-sm text-white/40 mt-1">Events · colour-coded by business</p>
      </div>

      {!configured ? (
        <ConnectCard
          service="Google Calendar"
          description="Connect Google Calendar to view and manage events colour-coded across all your businesses."
          connectUrl="/api/google/connect"
          icon="📅"
        />
      ) : (
        <div className="space-y-2">
          {events.map(event => (
            <div key={event.id} className="border border-white/[0.10] px-4 py-3 rounded-sm flex items-center gap-4 hover:border-white/[0.18] transition-colors">
              <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: event.colour }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white/90 truncate">{event.title}</p>
                <p className="text-xs text-white/40 mt-0.5">{new Date(event.start).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}</p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-white/30 flex-shrink-0">{event.businessKey}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
