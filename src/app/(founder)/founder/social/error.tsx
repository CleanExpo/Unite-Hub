'use client'

import { RouteErrorBoundary } from '@/components/founder/RouteErrorBoundary'

export default function SocialError({
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
      section="social"
      title="Social hub unavailable"
      description="Social media connections failed to load. Check your platform integrations."
    />
  )
}
