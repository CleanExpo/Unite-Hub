import { NextRequest, NextResponse } from 'next/server';
import { createBusinessSnapshot } from '@/lib/founder/businessVaultService';

/**
 * POST /api/founder/business-vault/[businessKey]/snapshot
 * Create an AI snapshot for a business using Google Leak doctrine signals
 *
 * Body:
 * {
 *   snapshot_type: string (e.g., 'seo-audit', 'portfolio-synopsis', 'competitive-analysis')
 *   summary_markdown: string
 *   navboost_risk_score?: number (0-100, risk from NavBoost signals)
 *   q_star_proxy_score?: number (0-100, proxy for Google's Q* ranking quality)
 *   eeat_strength_score?: number (0-100, E-E-A-T strength assessment)
 *   sandbox_risk_score?: number (0-100, new domain/page sandbox risk)
 *   behaviour_signal_opportunity_score?: number (0-100, user behaviour signal opportunities)
 *   gap_opportunities?: object (structured gap analysis data)
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessKey: string }> }
) {
  try {
    const { businessKey } = await params;
    const body = await req.json();

    // Validate required fields
    if (!body.snapshot_type || !body.summary_markdown) {
      return NextResponse.json(
        { success: false, error: 'snapshot_type and summary_markdown are required' },
        { status: 400 }
      );
    }

    const snapshot = await createBusinessSnapshot(businessKey, {
      snapshot_type: body.snapshot_type,
      summary_markdown: body.summary_markdown,
      navboost_risk_score: body.navboost_risk_score,
      q_star_proxy_score: body.q_star_proxy_score,
      eeat_strength_score: body.eeat_strength_score,
      sandbox_risk_score: body.sandbox_risk_score,
      behaviour_signal_opportunity_score: body.behaviour_signal_opportunity_score,
      gap_opportunities: body.gap_opportunities
    });

    return NextResponse.json({ success: true, snapshot });
  } catch (error) {
    console.error('[business-vault/[businessKey]/snapshot] POST error:', error);

    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json(
          { success: false, error: 'Not authenticated' },
          { status: 401 }
        );
      }
      if (error.message === 'Business not found') {
        return NextResponse.json(
          { success: false, error: 'Business not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create snapshot' },
      { status: 500 }
    );
  }
}
