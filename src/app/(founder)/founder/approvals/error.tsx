'use client'

import { RouteErrorBoundary } from '@/components/founder/RouteErrorBoundary'

export default function ApprovalsError({
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
      section="approvals"
      title="Approvals unavailable"
      description="The approval queue failed to load. Please try again."
    />
  )
}
