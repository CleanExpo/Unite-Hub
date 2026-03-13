'use client'

import { RouteErrorBoundary } from '@/components/founder/RouteErrorBoundary'

export default function GraphError({
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
      section="graph"
      title="Graph unavailable"
      description="The relationship graph failed to load. Please try again."
    />
  )
}
