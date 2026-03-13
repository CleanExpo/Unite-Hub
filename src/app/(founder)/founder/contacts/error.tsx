'use client'

import { RouteErrorBoundary } from '@/components/founder/RouteErrorBoundary'

export default function ContactsError({
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
      section="contacts"
      title="Contacts unavailable"
      description="The contacts directory failed to load. Please try again."
    />
  )
}
