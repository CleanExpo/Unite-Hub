/**
 * Claim Data Validation API Route
 * POST /api/verify/claim
 *
 * Validates claim information with Australian-specific rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateClaimData, quickValidateClaim, formatClaimData } from '@/lib/verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { claim_data, options, quick, format_only } = body;

    if (!claim_data) {
      return NextResponse.json(
        { error: 'Missing required field: claim_data' },
        { status: 400 }
      );
    }

    // Format only (no validation)
    if (format_only) {
      const formatted = formatClaimData(claim_data);
      return NextResponse.json({ formatted });
    }

    // Quick validation (required fields only)
    if (quick) {
      const result = quickValidateClaim(claim_data);
      return NextResponse.json(result);
    }

    // Full validation
    const result = validateClaimData(claim_data, options || {});
    return NextResponse.json(result);
  } catch (error) {
    console.error('Claim validation error:', error);
    return NextResponse.json(
      { error: 'Claim validation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
