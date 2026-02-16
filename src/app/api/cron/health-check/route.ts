/**
 * Automated Health Check Cron Job
 * GET /api/cron/health-check
 *
 * Runs every 5 minutes via Vercel Cron
 * Stores results in database and sends alerts if needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logHealthCheck, logUptimeCheck } from '@/lib/monitoring/autonomous-monitor';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max

// Initialize clients lazily to avoid build-time errors
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret (Vercel Cron sends this)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const checks: Record<string, { status: string; details: string }> = {};
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = 0;
    let warningsCount = 0;

    // Helper function to log check result
    function logCheck(name: string, status: 'pass' | 'fail' | 'warn', details: string) {
      checks[name] = { status, details };
      totalChecks++;
      if (status === 'pass') passedChecks++;
      else if (status === 'fail') {
        failedChecks++;
        criticalIssues.push(`${name}: ${details}`);
      } else {
        warningsCount++;
        warnings.push(`${name}: ${details}`);
      }
    }

    // ── CRITICAL CHECKS (failures → 'critical' status → email alerts) ──

    // 1. Database connectivity
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('count')
        .limit(1);

      if (error) {
        logCheck('Database Connection', 'fail', error.message);
      } else {
        logCheck('Database Connection', 'pass', 'Connected');
      }
    } catch (error: unknown) {
      logCheck('Database Connection', 'fail', error instanceof Error ? error.message : String(error));
    }

    // 2. Core tables (only tables essential for app operation)
    const coreTables = ['organizations', 'user_profiles', 'workspaces', 'contacts'];

    for (const table of coreTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          logCheck(`Table: ${table}`, 'fail', error.message);
        } else {
          logCheck(`Table: ${table}`, 'pass', 'Accessible');
        }
      } catch (error: unknown) {
        logCheck(`Table: ${table}`, 'fail', error instanceof Error ? error.message : String(error));
      }
    }

    // 3. Site uptime
    try {
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3008';
      const uptimeStart = Date.now();
      const response = await fetch(`${siteUrl}/api/health`, {
        method: 'GET',
        headers: { 'User-Agent': 'Unite-Hub-Health-Check' },
        signal: AbortSignal.timeout(10000),
      });
      const responseTime = Date.now() - uptimeStart;

      await logUptimeCheck({
        endpoint: `${siteUrl}/api/health`,
        method: 'GET',
        expectedStatus: 200,
        actualStatus: response.status,
        responseTimeMs: responseTime,
      });

      if (response.status === 200) {
        logCheck('Site Uptime', 'pass', `Response: ${responseTime}ms`);
      } else {
        logCheck('Site Uptime', 'fail', `Status ${response.status}`);
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logCheck('Site Uptime', 'fail', errMsg);
      await logUptimeCheck({
        endpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/health`,
        method: 'GET',
        expectedStatus: 200,
        actualStatus: 0,
        responseTimeMs: 0,
        errorMessage: errMsg,
      });
    }

    // ── NON-CRITICAL CHECKS (failures → 'warn' only, no email alerts) ──

    // 4. Anthropic API (config check only — no API call)
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        logCheck('Anthropic API', 'warn', 'ANTHROPIC_API_KEY not configured');
      } else if (!apiKey.startsWith('sk-ant-')) {
        logCheck('Anthropic API', 'warn', 'API key has unexpected format');
      } else {
        logCheck('Anthropic API', 'pass', 'API key configured');
      }
    } catch (error: unknown) {
      logCheck('Anthropic API', 'warn', error instanceof Error ? error.message : String(error));
    }

    // 5. Stripe API (config check only — no live API call)
    try {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        logCheck('Stripe API', 'warn', 'STRIPE_SECRET_KEY not configured');
      } else if (!stripeKey.startsWith('sk_')) {
        logCheck('Stripe API', 'warn', 'Stripe key has unexpected format');
      } else {
        logCheck('Stripe API', 'pass', 'Stripe key configured');
      }
    } catch (error: unknown) {
      logCheck('Stripe API', 'warn', error instanceof Error ? error.message : String(error));
    }

    // 6. Optional tables (warn if missing, not critical)
    const optionalTables = ['subscriptions'];
    for (const table of optionalTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          logCheck(`Table: ${table}`, 'warn', error.message);
        } else {
          logCheck(`Table: ${table}`, 'pass', 'Accessible');
        }
      } catch (error: unknown) {
        logCheck(`Table: ${table}`, 'warn', error instanceof Error ? error.message : String(error));
      }
    }

    // ── DETERMINE OVERALL STATUS ──
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (failedChecks > 0) {
      overallStatus = 'critical';
    } else if (warningsCount > 0) {
      overallStatus = 'degraded';
    }

    // Log health check to database (errors logged to console, won't trigger alerts)
    const executionTime = Date.now() - startTime;
    await logHealthCheck({
      overallStatus,
      checks,
      totalChecks,
      passedChecks,
      failedChecks,
      warnings: warningsCount,
      criticalIssues,
      warningsList: warnings,
      executionTimeMs: executionTime,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      overallStatus,
      checks: {
        total: totalChecks,
        passed: passedChecks,
        failed: failedChecks,
        warnings: warningsCount,
      },
      details: checks,
      executionTimeMs: executionTime,
    });
  } catch (error) {
    console.error('Health check cron error:', error);
    return NextResponse.json(
      {
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
