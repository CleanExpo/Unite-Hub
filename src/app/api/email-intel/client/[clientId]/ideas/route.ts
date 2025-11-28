/**
 * Client Email Ideas API
 *
 * GET /api/email-intel/client/[clientId]/ideas
 * Returns extracted ideas for a client, optionally filtered by category or recency.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { clientEmailIntelligenceService } from '@/lib/crm/clientEmailIntelligenceService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const category = searchParams.get('category'); // action_item, meeting_request, deadline, etc.
    const status = searchParams.get('status'); // pending, in_progress, completed, dismissed
    const priority = searchParams.get('priority'); // urgent, high, medium, low
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const sinceDays = searchParams.get('sinceDays'); // Filter by recency

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId parameter' },
        { status: 400 }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify workspace access
    const supabase = await getSupabaseServer();
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('org_id', workspaceId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build filters
    const filters: {
      type?: string;
      status?: string;
      priority?: string;
      limit: number;
      sinceDays?: number;
    } = { limit };

    if (category) filters.type = category;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (sinceDays) filters.sinceDays = parseInt(sinceDays, 10);

    // Get ideas for client
    const ideas = await clientEmailIntelligenceService.getClientIdeas(
      workspaceId,
      clientId,
      filters
    );

    // Group by category for convenience
    const grouped = ideas.reduce((acc, idea) => {
      const key = idea.type || 'other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(idea);
      return acc;
    }, {} as Record<string, typeof ideas>);

    // Calculate stats
    const stats = {
      total: ideas.length,
      pending: ideas.filter((i) => i.status === 'pending').length,
      inProgress: ideas.filter((i) => i.status === 'in_progress').length,
      completed: ideas.filter((i) => i.status === 'completed').length,
      urgent: ideas.filter((i) => i.priority === 'urgent').length,
      high: ideas.filter((i) => i.priority === 'high').length,
      overdue: ideas.filter((i) => {
        if (!i.dueDate) return false;
        return new Date(i.dueDate) < new Date() && i.status !== 'completed';
      }).length,
    };

    return NextResponse.json({
      ideas,
      grouped,
      stats,
    });
  } catch (error) {
    console.error('Error fetching client ideas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const body = await req.json();
    const { workspaceId, ideaId, status, priority, notes } = body;

    if (!workspaceId || !ideaId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update idea
    const supabase = await getSupabaseServer();

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;

    const { data: updated, error } = await supabase
      .from('email_ideas')
      .update(updateData)
      .eq('id', ideaId)
      .eq('workspace_id', workspaceId)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ idea: updated });
  } catch (error) {
    console.error('Error updating idea:', error);
    return NextResponse.json(
      { error: 'Failed to update idea' },
      { status: 500 }
    );
  }
}
