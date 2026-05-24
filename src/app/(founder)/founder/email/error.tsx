'use client'

// src/app/(founder)/founder/email/error.tsx
// Route-level error boundary for the email inbox

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

export default function EmailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      level: 'error',
      tags: { errorBoundary: 'email' },
    })
  }, [error])

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] gap-6 px-6"
      style={{ color: 'var(--color-text-primary)' }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div
          className="w-12 h-12 rounded-sm flex items-center justify-center mb-2"
          style={{ background: '#1a0505', border: '1px solid #ef4444' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">Email inbox unavailable</h2>
        <p className="text-sm max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
          Gmail connection may have expired — reconnect your Google account to restore inbox access.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-sm text-sm font-medium transition-colors duration-150"
          style={{ background: 'var(--color-accent)', color: '#050505' }}
        >
          Try again
        </button>
        <Link
          href="/founder/vault"
          className="px-4 py-2 rounded-sm text-sm font-medium transition-colors duration-150"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Reconnect Google
        </Link>
      </div>
    </div>
  )
}
