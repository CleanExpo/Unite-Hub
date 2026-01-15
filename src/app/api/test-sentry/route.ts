/**
 * Test Sentry Integration
 *
 * This endpoint throws an error to test Sentry error tracking
 * DELETE THIS FILE after confirming Sentry works
 */

import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Throw a test error
    throw new Error('🧪 Test Sentry Integration - This is a deliberate error to verify error tracking works');
  } catch (error) {
    // Capture in Sentry with context
    Sentry.captureException(error, {
      tags: {
        test: true,
        endpoint: '/api/test-sentry',
      },
      extra: {
        message: 'This is a test error to verify Sentry integration',
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Test error thrown and captured by Sentry',
        note: 'Check your Sentry dashboard to see if the error was logged',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}
