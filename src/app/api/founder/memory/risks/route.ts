/**
 * Founder Risk Register API
 *
 * GET: Return risks with filters
 * PATCH: Update risk mitigation status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  riskAnalysisService,
  type RiskCategory,
  type MitigationStatus,
} from '@/lib/founderMemory';

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
    const category = req.nextUrl.searchParams.get('category') as RiskCategory | null;
    const mitigationStatus = req.nextUrl.searchParams.get('mitigationStatus') as MitigationStatus | null;
    const minSeverity = req.nextUrl.searchParams.get('minSeverity');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const risks = await riskAnalysisService.getRisks(userId, workspaceId, {
      category: category || undefined,
      mitigationStatus: mitigationStatus || undefined,
      minSeverity: minSeverity ? parseInt(minSeverity) : undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      risks: risks.map((r) => ({
        id: r.id,
        sourceType: r.sourceType,
        category: r.category,
        title: r.title,
        description: r.description,
        severityScore: r.severityScore,
        likelihoodScore: r.likelihoodScore,
        riskScore: r.riskScore,
        linkedContactIds: r.linkedContactIds,
        linkedPreClientIds: r.linkedPreClientIds,
        mitigationStatus: r.mitigationStatus,
        mitigationPlan: r.mitigationPlanJson,
        detectedAt: r.detectedAt.toISOString(),
        reviewDueAt: r.reviewDueAt?.toISOString() || null,
      })),
      count: risks.length,
    });
  } catch (error) {
    console.error('[API] GET /api/founder/memory/risks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const { riskId, workspaceId, mitigationStatus, mitigationPlan, notes } = body;

    if (!riskId || !workspaceId) {
      return NextResponse.json(
        { error: 'riskId and workspaceId are required' },
        { status: 400 }
      );
    }

    const updated = await riskAnalysisService.updateRiskMitigation(
      riskId,
      workspaceId,
      mitigationStatus,
      mitigationPlan,
      notes
    );

    if (!updated) {
      return NextResponse.json({ error: 'Risk not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      risk: {
        id: updated.id,
        mitigationStatus: updated.mitigationStatus,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] PATCH /api/founder/memory/risks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
