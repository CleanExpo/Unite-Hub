/**
 * System Audit API Route
 * GET /api/verify/audit - Run quick health check
 * POST /api/verify/audit - Run full system audit
 *
 * Runs 70+ automated checks across 7 categories
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  runSystemAudit,
  runCategoryAudit,
  runQuickHealthCheck,
  formatAuditSummary,
} from '@/lib/verification';
import type { AuditCategory } from '@/lib/verification';

// GET - Quick health check
export async function GET() {
  try {
    const result = await runQuickHealthCheck();
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Health check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Full system audit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { categories, format, parallel, fail_fast, timeout_ms } = body;

    // Validate categories if provided
    const validCategories: AuditCategory[] = [
      'architecture',
      'backend',
      'frontend',
      'api_integrations',
      'data_integrity',
      'security',
      'compliance',
    ];

    if (categories && Array.isArray(categories)) {
      const invalidCategories = categories.filter((c: string) => !validCategories.includes(c as AuditCategory));
      if (invalidCategories.length > 0) {
        return NextResponse.json(
          { error: `Invalid categories: ${invalidCategories.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Run audit (full or category-specific)
    const result = categories
      ? await runCategoryAudit(categories, { parallel, fail_fast, timeout_ms })
      : await runSystemAudit({ parallel, fail_fast, timeout_ms });

    // Return formatted text if requested
    if (format === 'text' && result.data) {
      const summary = formatAuditSummary(result.data as never);
      return new NextResponse(summary, {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('System audit error:', error);
    return NextResponse.json(
      { error: 'System audit failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
