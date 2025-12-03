/**
 * CSP Violation Report Endpoint
 *
 * Browsers send POST requests to this endpoint when CSP violations occur.
 * This helps us monitor and debug CSP issues in production.
 *
 * SECURITY: This endpoint is public (no auth) because browsers send reports
 * before page loads complete. However, we validate the report structure to
 * prevent abuse.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CSPViolationReport } from '@/lib/security/csp';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Parse CSP violation report
    const report: CSPViolationReport = await request.json();

    // Validate report structure
    if (!report['csp-report']) {
      return NextResponse.json(
        { error: 'Invalid CSP report format' },
        { status: 400 }
      );
    }

    const violation = report['csp-report'];

    // Log violation with context
    logger.warn('CSP Violation Detected', {
      documentUri: violation['document-uri'],
      violatedDirective: violation['violated-directive'],
      effectiveDirective: violation['effective-directive'],
      blockedUri: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
      columnNumber: violation['column-number'],
      scriptSample: violation['script-sample'],
      disposition: violation['disposition'],
      statusCode: violation['status-code'],
      referrer: violation['referrer'],
    });

    // In production, you might want to:
    // 1. Store violations in database for analysis
    // 2. Alert on high violation rates
    // 3. Group similar violations
    // 4. Filter out known false positives

    // Example: Store in database (implement as needed)
    // await supabase.from('csp_violations').insert({
    //   document_uri: violation['document-uri'],
    //   violated_directive: violation['violated-directive'],
    //   blocked_uri: violation['blocked-uri'],
    //   source_file: violation['source-file'],
    //   line_number: violation['line-number'],
    //   created_at: new Date().toISOString(),
    // });

    return NextResponse.json({ status: 'reported' }, { status: 204 });
  } catch (error) {
    logger.error('Failed to process CSP report', { error });
    return NextResponse.json(
      { error: 'Failed to process report' },
      { status: 500 }
    );
  }
}

// Browser sends reports as application/csp-report or application/json
// Note: Using Node.js runtime because logger has Node.js dependencies
