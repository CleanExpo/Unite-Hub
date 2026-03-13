'use client'

import { RouteErrorBoundary } from '@/components/founder/RouteErrorBoundary'

export default function VaultError({
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
      section="vault"
      title="Vault unavailable"
      description="The credentials vault failed to load. Please try again."
    />
  )
}
