/**
 * Content Safety API Route
 * POST /api/verify/safety
 *
 * Checks content for PII, inappropriate content, and tone issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkContentSafety, quickPIICheck, redactAllPII } from '@/lib/verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, options, quick, redact_only } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Missing required field: content' },
        { status: 400 }
      );
    }

    // Redact only (no other checks)
    if (redact_only) {
      const redacted = redactAllPII(content);
      return NextResponse.json({ redacted });
    }

    // Quick PII check
    if (quick) {
      const result = quickPIICheck(content);
      return NextResponse.json(result);
    }

    // Full safety check
    const result = await checkContentSafety(content, options || {});
    return NextResponse.json(result);
  } catch (error) {
    console.error('Content safety check error:', error);
    return NextResponse.json(
      { error: 'Content safety check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
