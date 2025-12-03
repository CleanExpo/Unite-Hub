/**
 * Cron Job: Weekly Insights Generation
 * Phase 49: Generate insights for all active clients
 * Schedule: 0 7 * * 1 (Monday 7 AM)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { generateWeeklyInsights } from '@/lib/services/clientInsightsService';
import { validateCronRequest } from '@/lib/cron/auth';

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Validate cron request with timestamp protection
    const auth = validateCronRequest(req, { logPrefix: 'SuccessInsights' });
    if (!auth.valid) {
      return auth.response;
    }

    const supabase = await getSupabaseServer();
    const results = {
      processed: 0,
      insightsGenerated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Get all organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id');

    if (orgsError) throw orgsError;

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
          const insightsResult = await generateWeeklyInsights(client.user_id, org.id);

          if (insightsResult.success) {
            results.insightsGenerated += insightsResult.insights?.length || 0;
          } else {
            results.failed++;
            results.errors.push(`Insights failed for ${client.user_id}: ${insightsResult.error}`);
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
    console.log('[CRON] Insights generation complete:', results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('[CRON] Insights generation failed:', error);
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
