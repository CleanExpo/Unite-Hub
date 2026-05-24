'use client'

// Shared error boundary component for founder route segments.
// Usage: re-export from each route's error.tsx with a section-specific tag.

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'

interface RouteErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
  section: string
  title?: string
  description?: string
  backHref?: string
  backLabel?: string
}

export function RouteErrorBoundary({
  error,
  reset,
  section,
  title = 'Something went wrong',
  description,
  backHref = '/founder/dashboard',
  backLabel = 'Back to dashboard',
}: RouteErrorBoundaryProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      level: 'error',
      tags: { errorBoundary: section },
    })
  }, [error, section])

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
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
          {description ?? error.message ?? 'An unexpected error occurred in this section.'}
        </p>
        {error.digest && (
          <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
            ref: {error.digest}
          </p>
        )}
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
          href={backHref}
          className="px-4 py-2 rounded-sm text-sm font-medium transition-colors duration-150"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {backLabel}
        </Link>
      </div>
    </div>
  )
}
