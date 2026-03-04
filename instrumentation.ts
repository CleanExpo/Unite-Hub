/**
 * Next.js Instrumentation Hook
 * Automatically loaded by Next.js when instrumentationHook is enabled
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation only
    await import('./src/lib/telemetry/instrumentation');
  }
}
