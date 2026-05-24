'use client'

import { RouteErrorBoundary } from '@/components/founder/RouteErrorBoundary'

export default function AdvisoryError({
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
      section="advisory"
      title="Advisory unavailable"
      description="The advisory board failed to load. This may be a temporary issue."
    />
  )
}
