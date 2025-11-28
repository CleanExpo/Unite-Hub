/**
 * Client Email Intelligence API
 *
 * GET - Get email intelligence for a specific client
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getClientEmailIntelligenceService } from '@/lib/crm/clientEmailIntelligenceService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;

    // Authenticate
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const includeInsights = req.nextUrl.searchParams.get('includeInsights') === 'true';
    const includeTimeline = req.nextUrl.searchParams.get('includeTimeline') === 'true';
    const includeThreads = req.nextUrl.searchParams.get('includeThreads') === 'true';

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const service = getClientEmailIntelligenceService();

    // Get summary
    const summary = await service.getClientEmailSummary(workspaceId, clientId);

    if (!summary) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const response: Record<string, unknown> = {
      success: true,
      summary,
    };

    // Optionally include AI insights
    if (includeInsights) {
      const insights = await service.generateCommunicationInsights(
        workspaceId,
        clientId
      );
      response.insights = insights;
    }

    // Optionally include timeline
    if (includeTimeline) {
      const timeline = await service.getClientTimeline(workspaceId, clientId, {
        limit: 30,
      });
      response.timeline = timeline;
    }

    // Optionally include threads
    if (includeThreads) {
      const { threads, total } = await service.getClientEmailThreads(
        workspaceId,
        clientId,
        { limit: 10, includeIdeas: true }
      );
      response.threads = threads;
      response.totalThreads = total;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] GET /api/email-intel/client/[clientId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
