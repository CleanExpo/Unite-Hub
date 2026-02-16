/**
 * Automated Health Check Cron Job
 * GET /api/cron/health-check
 *
 * Runs every 5 minutes via Vercel Cron
 * Stores results in database and sends alerts if needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { anthropic } from '@/lib/anthropic/client';
import { ANTHROPIC_MODELS } from '@/lib/anthropic/models';
import Stripe from 'stripe';
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

function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-11-20.acacia',
  });
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
    } catch (error: unknown) {
      logCheck('Database Connection', 'fail', error instanceof Error ? error.message : String(error));
    }

    // 2. Anthropic API (lightweight check — validate key exists and format)
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey || !apiKey.startsWith('sk-ant-')) {
        logCheck('Anthropic API', 'fail', 'API key missing or invalid format');
      } else {
        // Use cheapest model with minimal tokens to verify connectivity
        await anthropic.messages.create({
          model: ANTHROPIC_MODELS.HAIKU_3,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        });
        logCheck('Anthropic API', 'pass', 'API key valid');
      }
    } catch (error: unknown) {
      logCheck('Anthropic API', 'fail', error instanceof Error ? error.message : String(error));
    }

    // 3. Stripe API
    try {
      const stripe = getStripeClient();
      const balance = await stripe.balance.retrieve();
      logCheck('Stripe API', 'pass', `Balance retrieved`);
    } catch (error: unknown) {
      logCheck('Stripe API', 'fail', error instanceof Error ? error.message : String(error));
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
      } catch (error: unknown) {
        logCheck(`Table: ${table}`, 'fail', error instanceof Error ? error.message : String(error));
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
