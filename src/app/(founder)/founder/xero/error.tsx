'use client'

import { RouteErrorBoundary } from '@/components/founder/RouteErrorBoundary'

export default function XeroError({
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
      section="xero"
      title="Xero unavailable"
      description="Xero integration failed to load. Check your Xero connection."
    />
  )
}
