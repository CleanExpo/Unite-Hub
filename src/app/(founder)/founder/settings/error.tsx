'use client'

import { RouteErrorBoundary } from '@/components/founder/RouteErrorBoundary'

export default function SettingsError({
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
      section="settings"
      title="Settings unavailable"
      description="Settings failed to load. Please try again."
    />
  )
}
