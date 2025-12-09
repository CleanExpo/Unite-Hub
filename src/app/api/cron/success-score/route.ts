/**
 * Cron Job: Weekly Success Score Calculation
 * Phase 49: Calculate success scores for all active clients
 * Schedule: 0 7 * * 1 (Monday 7 AM)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { calculateSuccessScore } from '@/lib/services/clientSuccessService';
import { checkClientHealth } from '@/lib/services/clientHealthService';
import { validateCronRequest } from '@/lib/cron/auth';

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Validate cron request with timestamp protection
    const auth = validateCronRequest(req, { logPrefix: 'SuccessScore' });
    if (!auth.valid) {
      return auth.response;
    }

    const supabase = await getSupabaseServer();
    const results = {
      processed: 0,
      success: 0,
      failed: 0,
      alerts: 0,
      errors: [] as string[],
    };

    // Get all organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id');

    if (orgsError) {
throw orgsError;
}

    for (const org of orgs || []) {
      // Get all clients in the organization
      const { data: clients } = await supabase
        .from('user_organizations')
        .select('user_id')
        .eq('org_id', org.id)
        .eq('role', 'client');

      for (const client of clients || []) {
        results.processed++;

        try {
          // Calculate success score
          const scoreResult = await calculateSuccessScore(client.user_id, org.id);

          if (scoreResult.success) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push(`Score failed for ${client.user_id}: ${scoreResult.error}`);
          }

          // Check client health and generate alerts
          const healthResult = await checkClientHealth(client.user_id, org.id);

          if (healthResult.alerts) {
            results.alerts += healthResult.alerts.length;
          }
        } catch (err) {
          results.failed++;
          results.errors.push(
            `Error processing ${client.user_id}: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      }
    }

    // Log results
    console.log('[CRON] Success score calculation complete:', results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('[CRON] Success score calculation failed:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(req: NextRequest) {
  return GET(req);
}
