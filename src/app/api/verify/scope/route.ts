/**
 * Scope of Work Validation API Route
 * POST /api/verify/scope
 *
 * Validates scope of work documents for completeness and accuracy
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateScope, quickCheckScope } from '@/lib/verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scope_text, context, quick } = body;

    if (!scope_text) {
      return NextResponse.json(
        { error: 'Missing required field: scope_text' },
        { status: 400 }
      );
    }

    // Quick check (basic validation)
    if (quick) {
      const result = quickCheckScope(scope_text);
      return NextResponse.json(result);
    }

    // Full validation requires context
    if (!context || !context.damage_type) {
      return NextResponse.json(
        { error: 'Missing required field: context.damage_type' },
        { status: 400 }
      );
    }

    const result = await validateScope(scope_text, context);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Scope validation error:', error);
    return NextResponse.json(
      { error: 'Scope validation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
