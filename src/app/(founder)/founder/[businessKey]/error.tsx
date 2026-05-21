'use client'

import { RouteErrorBoundary } from '@/components/founder/RouteErrorBoundary'

export default function BusinessPageError({
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
      section="business-page"
      title="Business page unavailable"
      description="This business page failed to load. This may be a temporary issue."
    />
  )
}
