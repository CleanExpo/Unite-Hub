/**
 * Client Email Threads API
 *
 * GET /api/email-intel/client/[clientId]/threads
 * Returns paginated email threads for a given client.
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const sortBy = searchParams.get('sortBy') || 'last_message_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

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

    // Get threads for client
    const threads = await clientEmailIntelligenceService.getClientEmailThreads(
      workspaceId,
      clientId,
      {
        page,
        limit,
        sortBy: sortBy as 'last_message_at' | 'message_count' | 'subject',
        sortOrder: sortOrder as 'asc' | 'desc',
      }
    );

    // Get total count for pagination
    const { count } = await supabase
      .from('email_threads')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('client_id', clientId);

    return NextResponse.json({
      threads,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching client threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}
