/**
 * Director Insights API
 * Phase 60: Get AI Director insights and briefings
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIDirectorEngine } from '@/lib/director/aiDirectorEngine';
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
    const clientId = searchParams.get('client_id');

    const director = new AIDirectorEngine();

    switch (type) {
      case 'briefing':
        // Daily founder briefing
        const briefing = await director.generateDailyBriefing();
        return NextResponse.json({ data: briefing });

      case 'client':
        // Insights for specific client
        if (!clientId) {
          return NextResponse.json(
            { error: 'client_id required for client insights' },
            { status: 400 }
          );
        }
        const clientInsights = await director.getClientInsights(clientId);
        return NextResponse.json({ data: clientInsights });

      case 'overview':
        // Founder overview of all clients
        const overview = await director.getFounderOverview();
        return NextResponse.json({ data: overview });

      default:
        // Return general insights summary
        const [dailyBriefing, founderOverview] = await Promise.all([
          director.generateDailyBriefing(),
          director.getFounderOverview(),
        ]);

        return NextResponse.json({
          data: {
            briefing: dailyBriefing,
            overview: founderOverview,
          },
          available_types: ['briefing', 'client', 'overview'],
        });
    }
  } catch (error) {
    console.error('Director insights API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
