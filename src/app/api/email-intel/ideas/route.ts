/**
 * Email Ideas API
 *
 * GET - List extracted ideas
 * PATCH - Update idea status
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getEmailIngestionService } from '@/lib/emailIngestion';
import { getClientEmailIntelligenceService } from '@/lib/crm/clientEmailIntelligenceService';

export async function GET(req: NextRequest) {
  try {
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
    const clientId = req.nextUrl.searchParams.get('clientId') || undefined;
    const ideaType = req.nextUrl.searchParams.get('ideaType') || undefined;
    const priority = req.nextUrl.searchParams.get('priority') || undefined;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50', 10);

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const service = getEmailIngestionService();
    const ideas = await service.getPendingIdeas(workspaceId, {
      clientId,
      ideaType,
      priority,
      limit,
    });

    return NextResponse.json({
      success: true,
      ideas,
    });
  } catch (error) {
    console.error('[API] GET /api/email-intel/ideas error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
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

    const body = await req.json();
    const { workspaceId, ideaId, status } = body as {
      workspaceId: string;
      ideaId: string;
      status: string;
    };

    if (!workspaceId || !ideaId || !status) {
      return NextResponse.json(
        { error: 'workspaceId, ideaId, and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['new', 'acknowledged', 'in_progress', 'completed', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const service = getClientEmailIntelligenceService();
    const success = await service.updateIdeaStatus(
      workspaceId,
      ideaId,
      status,
      authData.user.id
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update idea status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Idea status updated',
    });
  } catch (error) {
    console.error('[API] PATCH /api/email-intel/ideas error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
