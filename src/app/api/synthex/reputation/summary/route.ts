/**
 * Synthex Reputation Summary API
 * GET: Get reputation summary for a tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReputationSummary } from '@/lib/synthex/reputationService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const result = await getReputationSummary(tenantId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      summary: result.data,
    });
  } catch (error) {
    console.error('[API /synthex/reputation/summary GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
