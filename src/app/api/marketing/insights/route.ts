/**
 * Marketing Insights API
 * Phase 59: Get lead and activation insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLeadProfile, getFunnelSummary } from '@/lib/marketing/leadScoreEngine';
import { getActivationInsights } from '@/lib/marketing/activationInsightsEngine';
import { getRemarketingSummary } from '@/lib/marketing/remarketingListener';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    // Session validation
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    switch (type) {
      case 'lead':
        if (!id) {
          return NextResponse.json(
            { error: 'Lead ID required' },
            { status: 400 }
          );
        }
        const leadProfile = await getLeadProfile(id);
        if (!leadProfile) {
          return NextResponse.json(
            { error: 'Lead not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({ data: leadProfile });

      case 'activation':
        if (!id) {
          return NextResponse.json(
            { error: 'Client ID required' },
            { status: 400 }
          );
        }
        const activationInsights = await getActivationInsights(id);
        return NextResponse.json({ data: activationInsights });

      case 'funnel':
        const funnelSummary = await getFunnelSummary();
        return NextResponse.json({ data: funnelSummary });

      case 'remarketing':
        const remarketingSummary = await getRemarketingSummary();
        return NextResponse.json({ data: remarketingSummary });

      default:
        // Return overview of all insights
        const [funnel, remarketing] = await Promise.all([
          getFunnelSummary(),
          getRemarketingSummary(),
        ]);

        return NextResponse.json({
          data: {
            funnel_summary: funnel,
            remarketing_summary: remarketing,
          },
          available_types: ['lead', 'activation', 'funnel', 'remarketing'],
        });
    }
  } catch (error) {
    console.error('Marketing insights API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
