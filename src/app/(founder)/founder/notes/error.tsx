'use client'

import { RouteErrorBoundary } from '@/components/founder/RouteErrorBoundary'

export default function NotesError({
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
      section="notes"
      title="Notes unavailable"
      description="Notes failed to load. Check your Google Drive connection."
    />
  )
}
