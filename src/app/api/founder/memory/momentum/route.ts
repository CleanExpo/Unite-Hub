/**
 * Founder Momentum Scores API
 *
 * GET: Return latest momentum scores across domains
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { momentumScoringService } from '@/lib/founderMemory';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const includeHistory = req.nextUrl.searchParams.get('includeHistory') === 'true';
    const historyLimit = parseInt(req.nextUrl.searchParams.get('historyLimit') || '12');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const latest = await momentumScoringService.getLatestMomentum(userId, workspaceId);

    let history = null;
    if (includeHistory) {
      const historyData = await momentumScoringService.getMomentumHistory(userId, workspaceId, historyLimit);
      history = historyData.map((m) => ({
        periodStart: m.periodStart.toISOString(),
        periodEnd: m.periodEnd.toISOString(),
        overallScore: m.overallScore,
        marketingScore: m.marketingScore,
        salesScore: m.salesScore,
        deliveryScore: m.deliveryScore,
        productScore: m.productScore,
        clientsScore: m.clientsScore,
        engineeringScore: m.engineeringScore,
        financeScore: m.financeScore,
      }));
    }

    return NextResponse.json({
      success: true,
      momentum: latest
        ? {
            id: latest.id,
            periodStart: latest.periodStart.toISOString(),
            periodEnd: latest.periodEnd.toISOString(),
            overallScore: latest.overallScore,
            scores: {
              marketing: { score: latest.marketingScore, trend: latest.marketingTrend },
              sales: { score: latest.salesScore, trend: latest.salesTrend },
              delivery: { score: latest.deliveryScore, trend: latest.deliveryTrend },
              product: { score: latest.productScore, trend: latest.productTrend },
              clients: { score: latest.clientsScore, trend: latest.clientsTrend },
              engineering: { score: latest.engineeringScore, trend: latest.engineeringTrend },
              finance: { score: latest.financeScore, trend: latest.financeTrend },
            },
            notes: latest.notesJson,
          }
        : null,
      history,
    });
  } catch (error) {
    console.error('[API] GET /api/founder/memory/momentum error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
