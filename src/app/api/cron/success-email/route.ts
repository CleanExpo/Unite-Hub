/**
 * Cron Job: Weekly Success Emails
 * Phase 49: Send weekly success emails to all active clients
 * Schedule: 0 8 * * 1 (Monday 8 AM)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { getClientSuccessScore, getEngagementHistory } from '@/lib/services/clientSuccessService';
import { getClientInsights } from '@/lib/services/clientInsightsService';
import { generateWeeklySuccessEmail } from '@/lib/templates/weeklySuccessEmail';
import { sendEmail } from '@/lib/email/email-service';
import { validateCronRequest } from '@/lib/cron/auth';

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Validate cron request with timestamp protection
    const auth = validateCronRequest(req, { logPrefix: 'SuccessEmail' });
    if (!auth.valid) {
      return auth.response;
    }

    const supabase = await getSupabaseServer();
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
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
        .select(`
          user_id,
          user_profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('org_id', org.id)
        .eq('role', 'client');

      for (const client of clients || []) {
        results.processed++;

        const profile = (client as any).user_profiles;
        if (!profile?.email) {
          results.skipped++;
          continue;
        }

        try {
          // Get client data
          const [scoreResult, insightsResult, historyResult] = await Promise.all([
            getClientSuccessScore(client.user_id),
            getClientInsights(client.user_id, { limit: 5 }),
            getEngagementHistory(client.user_id, 7),
          ]);

          if (!scoreResult.score) {
            results.skipped++;
            continue;
          }

          // Calculate stats
          const activeDays = new Set(
            historyResult.history?.map(h => h.date) || []
          ).size;

          const tasksCompleted = insightsResult.insights?.filter(
            i => i.insight_type === 'milestone'
          ).length || 0;

          const contentGenerated = insightsResult.insights?.filter(
            i => i.insight_type === 'achievement'
          ).length || 0;

          // Get business name from launch kit
          const { data: launchKit } = await supabase
            .from('client_launch_kits')
            .select('business_name')
            .eq('client_id', client.user_id)
            .single();

          // Generate email content
          const emailContent = generateWeeklySuccessEmail({
            clientName: profile.full_name || 'Valued Client',
            businessName: launchKit?.business_name,
            overallScore: scoreResult.score.overall_score,
            scoreChange: scoreResult.score.score_change,
            trend: scoreResult.score.trend,
            activeDays,
            tasksCompleted,
            contentGenerated,
            insights: (insightsResult.insights || []).slice(0, 3).map(i => ({
              type: i.insight_type,
              title: i.title,
              message: i.message,
            })),
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://unite-hub.com'}/client/dashboard/success`,
          });

          // Send email
          const emailResult = await sendEmail({
            to: profile.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          });

          if (emailResult.success) {
            results.sent++;

            // Record email sent
            await supabase.from('client_success_emails').insert({
              client_id: client.user_id,
              organization_id: org.id,
              email_type: 'weekly_insights',
              subject: emailContent.subject,
              content_html: emailContent.html,
              content_text: emailContent.text,
              sent_at: new Date().toISOString(),
              insights_included: (insightsResult.insights || []).slice(0, 3).map(i => i.id),
              score_at_send: scoreResult.score.overall_score,
            });
          } else {
            results.failed++;
            results.errors.push(`Email failed for ${client.user_id}: ${emailResult.error}`);
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
    console.log('[CRON] Weekly success emails complete:', results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('[CRON] Weekly success emails failed:', error);
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
