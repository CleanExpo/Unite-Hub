/**
 * Founder Next Actions API
 *
 * GET: Get recommended next actions
 * POST: Generate fresh recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  nextActionRecommenderService,
  type ActionCategory,
  type ActionUrgency,
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
    const category = req.nextUrl.searchParams.get('category') as ActionCategory | null;
    const urgency = req.nextUrl.searchParams.get('urgency') as ActionUrgency | null;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const actions = await nextActionRecommenderService.getNextActions(userId, workspaceId, {
      category: category || undefined,
      urgency: urgency || undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      actions: actions.map((a) => ({
        id: a.id,
        category: a.category,
        urgency: a.urgency,
        title: a.title,
        description: a.description,
        reasoning: a.reasoning,
        estimatedImpact: a.estimatedImpact,
        estimatedEffort: a.estimatedEffort,
        linkedOpportunityId: a.linkedOpportunityId,
        linkedRiskId: a.linkedRiskId,
        linkedContactIds: a.linkedContactIds,
        linkedPreClientIds: a.linkedPreClientIds,
        suggestedDueDate: a.suggestedDueDate?.toISOString() || null,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
      })),
      count: actions.length,
    });
  } catch (error) {
    console.error('[API] GET /api/founder/memory/next-actions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
    const { workspaceId, maxActions = 10, focusCategories } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const result = await nextActionRecommenderService.generateRecommendations({
      founderId: userId,
      workspaceId,
      maxActions,
      focusCategories,
    });

    return NextResponse.json({
      success: true,
      actions: result.actions.map((a) => ({
        id: a.id,
        category: a.category,
        urgency: a.urgency,
        title: a.title,
        description: a.description,
        reasoning: a.reasoning,
        estimatedImpact: a.estimatedImpact,
        estimatedEffort: a.estimatedEffort,
        linkedOpportunityId: a.linkedOpportunityId,
        linkedRiskId: a.linkedRiskId,
        linkedContactIds: a.linkedContactIds,
        linkedPreClientIds: a.linkedPreClientIds,
        suggestedDueDate: a.suggestedDueDate?.toISOString() || null,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
      })),
      summary: result.summary,
      overloadWarning: result.overloadWarning,
      count: result.actions.length,
    });
  } catch (error) {
    console.error('[API] POST /api/founder/memory/next-actions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
