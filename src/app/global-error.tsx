/**
 * Global Error Boundary
 *
 * Catches unhandled errors at the root level of the application
 * Must be a Client Component
 */

'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // Capture error in Sentry
    Sentry.captureException(error, {
      level: 'fatal',
      tags: {
        errorBoundary: 'global',
      },
      contexts: {
        react: {
          componentStack: error.digest,
        },
      },
    });
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#111827',
          color: '#f9fafb',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
        }}>
          <div style={{
            maxWidth: '500px',
            textAlign: 'center',
          }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#ef4444',
            }}>
              Something went wrong!
            </h1>
            <p style={{
              fontSize: '1.125rem',
              marginBottom: '2rem',
              color: '#9ca3af',
            }}>
              We're sorry, but an unexpected error occurred. Our team has been notified and will look into it.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: '500',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
            >
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
