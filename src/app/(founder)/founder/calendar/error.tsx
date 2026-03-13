'use client'

import { RouteErrorBoundary } from '@/components/founder/RouteErrorBoundary'

export default function CalendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      section="calendar"
      title="Calendar unavailable"
      description="The calendar failed to load. Check your Google Calendar connection."
    />
  )
}
