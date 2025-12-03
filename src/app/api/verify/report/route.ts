/**
 * Report Verification API Route
 * POST /api/verify/report
 *
 * Verifies AI-generated reports for accuracy and hallucinations
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyReport, quickCheckReport } from '@/lib/verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { report, source_data, options, quick } = body;

    if (!report || !report.full_text) {
      return NextResponse.json(
        { error: 'Missing required field: report.full_text' },
        { status: 400 }
      );
    }

    // Quick check (basic validation)
    if (quick) {
      const result = quickCheckReport(report);
      return NextResponse.json(result);
    }

    // Full verification requires source data
    if (!source_data) {
      return NextResponse.json(
        { error: 'Missing required field: source_data (required for full verification)' },
        { status: 400 }
      );
    }

    const result = await verifyReport(report, source_data, options || {});
    return NextResponse.json(result);
  } catch (error) {
    console.error('Report verification error:', error);
    return NextResponse.json(
      { error: 'Report verification failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
