/**
 * Founder Opportunity Backlog API
 *
 * GET: Return opportunities with filters
 * PATCH: Update opportunity status/priority
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  opportunityConsolidationService,
  type OpportunityStatus,
  type OpportunityCategory,
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
    const status = req.nextUrl.searchParams.get('status') as OpportunityStatus | null;
    const category = req.nextUrl.searchParams.get('category') as OpportunityCategory | null;
    const minScore = req.nextUrl.searchParams.get('minScore');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const opportunities = await opportunityConsolidationService.getOpportunities(
      userId,
      workspaceId,
      {
        status: status || undefined,
        category: category || undefined,
        minScore: minScore ? parseFloat(minScore) : undefined,
        limit,
      }
    );

    return NextResponse.json({
      success: true,
      opportunities: opportunities.map((o) => ({
        id: o.id,
        source: o.source,
        category: o.category,
        title: o.title,
        description: o.description,
        potentialValue: o.potentialValue,
        confidenceScore: o.confidenceScore,
        urgencyScore: o.urgencyScore,
        linkedContactIds: o.linkedContactIds,
        linkedPreClientIds: o.linkedPreClientIds,
        suggestedActions: o.suggestedActionsJson,
        status: o.status,
        detectedAt: o.detectedAt.toISOString(),
        expiresAt: o.expiresAt?.toISOString() || null,
      })),
      count: opportunities.length,
    });
  } catch (error) {
    console.error('[API] GET /api/founder/memory/opportunities error:', error);
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
    const { opportunityId, workspaceId, status, notes } = body;

    if (!opportunityId || !workspaceId) {
      return NextResponse.json(
        { error: 'opportunityId and workspaceId are required' },
        { status: 400 }
      );
    }

    const updated = await opportunityConsolidationService.updateOpportunityStatus(
      opportunityId,
      workspaceId,
      status,
      notes
    );

    if (!updated) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      opportunity: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] PATCH /api/founder/memory/opportunities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
