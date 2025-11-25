/**
 * Automated Health Check Cron Job
 * GET /api/cron/health-check
 *
 * Runs every 5 minutes via Vercel Cron
 * Stores results in database and sends alerts if needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import { logHealthCheck, logUptimeCheck } from '@/lib/monitoring/autonomous-monitor';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret (Vercel Cron sends this)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checks: Record<string, { status: string; details: string }> = {};
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = 0;
    let warningsCount = 0;

    // Helper function to log check
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
    } catch (error: any) {
      logCheck('Database Connection', 'fail', error.message);
    }

    // 2. Anthropic API
    try {
      const message = await anthropic.messages.create({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      logCheck('Anthropic API', 'pass', 'API key valid');
    } catch (error: any) {
      logCheck('Anthropic API', 'fail', error.message);
    }

    // 3. Stripe API
    try {
      const balance = await stripe.balance.retrieve();
      logCheck('Stripe API', 'pass', `Balance retrieved`);
    } catch (error: any) {
      logCheck('Stripe API', 'fail', error.message);
    }

    // 4. Critical tables
    const criticalTables = [
      'organizations',
      'user_profiles',
      'workspaces',
      'contacts',
      'subscriptions',
    ];

    for (const table of criticalTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          logCheck(`Table: ${table}`, 'fail', error.message);
        } else {
          logCheck(`Table: ${table}`, 'pass', 'Table exists');
        }
      } catch (error: any) {
        logCheck(`Table: ${table}`, 'fail', error.message);
      }
    }

    // 5. Uptime check for main site
    try {
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3008';
      const uptimeStart = Date.now();
      const response = await fetch(`${siteUrl}/api/health`, {
        method: 'GET',
        headers: { 'User-Agent': 'Unite-Hub-Health-Check' },
      });
      const uptimeEnd = Date.now();
      const responseTime = uptimeEnd - uptimeStart;

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
    } catch (error: any) {
      logCheck('Site Uptime', 'fail', error.message);
      await logUptimeCheck({
        endpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/health`,
        method: 'GET',
        expectedStatus: 200,
        actualStatus: 0,
        responseTimeMs: 0,
        errorMessage: error.message,
      });
    }

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (failedChecks > 0) {
      overallStatus = 'critical';
    } else if (warningsCount > 0) {
      overallStatus = 'degraded';
    }

    // Log health check to database
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
