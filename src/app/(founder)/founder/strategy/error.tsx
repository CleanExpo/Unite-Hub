'use client'

import { RouteErrorBoundary } from '@/components/founder/RouteErrorBoundary'

export default function StrategyError({
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
      section="strategy"
      title="Strategy unavailable"
      description="The strategy board failed to load. Please try again."
    />
  )
}
