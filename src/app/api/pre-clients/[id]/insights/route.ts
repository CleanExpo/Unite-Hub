/**
 * Pre-Client Insights API
 *
 * Get and manage insights (opportunities, tasks, questions) for a pre-client.
 * Part of the Client Historical Email Identity Engine.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  opportunityDetectorService,
  type InsightCategory,
  type InsightPriority,
  type InsightStatus,
} from '@/lib/emailIngestion';

// GET /api/pre-clients/[id]/insights - Get insights
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: preClientId } = await params;
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
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Parse filters
    const categoriesParam = req.nextUrl.searchParams.get('categories');
    const prioritiesParam = req.nextUrl.searchParams.get('priorities');
    const statusesParam = req.nextUrl.searchParams.get('statuses');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    const categories = categoriesParam
      ? (categoriesParam.split(',') as InsightCategory[])
      : undefined;
    const priorities = prioritiesParam
      ? (prioritiesParam.split(',') as InsightPriority[])
      : undefined;
    const statuses = statusesParam
      ? (statusesParam.split(',') as InsightStatus[])
      : undefined;

    const insights = await opportunityDetectorService.getInsights(
      preClientId,
      workspaceId,
      {
        categories,
        priorities,
        statuses,
        limit,
        offset,
      }
    );

    return NextResponse.json({
      success: true,
      insights: insights.map((i) => ({
        id: i.id,
        category: i.category,
        subcategory: i.subcategory,
        title: i.title,
        detail: i.detail,
        sourceMessageId: i.sourceMessageId,
        sourceThreadId: i.sourceThreadId,
        detectedAt: i.detectedAt.toISOString(),
        dueDate: i.dueDate?.toISOString(),
        priority: i.priority,
        status: i.status,
        confidenceScore: i.confidenceScore,
      })),
      count: insights.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[API] GET /api/pre-clients/[id]/insights error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/pre-clients/[id]/insights - Process or analyze insights
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: preClientId } = await params;
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
    const { workspaceId, action } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'process': {
        // Process all messages and extract insights
        const insights = await opportunityDetectorService.processPreClient(
          preClientId,
          workspaceId
        );

        return NextResponse.json({
          success: true,
          insightsExtracted: insights.length,
          message: 'Insights extracted successfully',
        });
      }

      case 'analyze': {
        // Get full opportunity analysis
        const analysis = await opportunityDetectorService.generateAnalysis(
          preClientId,
          workspaceId
        );

        return NextResponse.json({
          success: true,
          analysis: {
            totalInsights: analysis.totalInsights,
            byCategory: analysis.byCategory,
            byPriority: analysis.byPriority,
            pendingTasks: analysis.pendingTasks.map((t) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              dueDate: t.dueDate?.toISOString(),
            })),
            openOpportunities: analysis.openOpportunities.map((o) => ({
              id: o.id,
              title: o.title,
              priority: o.priority,
              confidenceScore: o.confidenceScore,
            })),
            unresolvedQuestions: analysis.unresolvedQuestions.map((q) => ({
              id: q.id,
              title: q.title,
              priority: q.priority,
            })),
            activeCommitments: analysis.activeCommitments.map((c) => ({
              id: c.id,
              title: c.title,
              priority: c.priority,
              dueDate: c.dueDate?.toISOString(),
            })),
            risks: analysis.risks.map((r) => ({
              id: r.id,
              title: r.title,
              priority: r.priority,
            })),
          },
        });
      }

      case 'patterns': {
        // Identify cross-thread patterns
        const patterns = await opportunityDetectorService.identifyCrossThreadPatterns(
          preClientId,
          workspaceId
        );

        return NextResponse.json({
          success: true,
          patterns: patterns.patterns,
          recommendations: patterns.recommendations,
        });
      }

      case 'update': {
        // Update insight status
        const { insightId, status, convertedToTaskId } = body;

        if (!insightId || !status) {
          return NextResponse.json(
            { error: 'insightId and status are required' },
            { status: 400 }
          );
        }

        const success = await opportunityDetectorService.updateInsightStatus(
          insightId,
          workspaceId,
          status,
          convertedToTaskId
        );

        return NextResponse.json({
          success,
          message: success ? 'Insight updated' : 'Update failed',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "process", "analyze", "patterns", or "update"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] POST /api/pre-clients/[id]/insights error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
