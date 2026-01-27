/**
 * ATO Connect API Route
 *
 * POST /api/integrations/ato/connect
 * Initialize M2M OAuth connection to ATO
 *
 * Related to: UNI-176 [ATO] ATO API Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createATOClient } from '@/lib/integrations/ato/ato-client';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workspace from request body
    const { workspaceId } = await req.json();

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId required' },
        { status: 400 }
      );
    }

    // Verify user has access to workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied to workspace' },
        { status: 403 }
      );
    }

    // Only admins/owners can connect integrations
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Admin role required' },
        { status: 403 }
      );
    }

    // Initialize ATO client
    const atoClient = createATOClient();
    await atoClient.initialize(workspaceId);

    // Fetch initial token (M2M - no user interaction needed)
    const token = await atoClient.getAccessToken();

    return NextResponse.json({
      success: true,
      message: 'ATO connection established',
      connected: true,
      tokenExpiresIn: 3600, // Standard OAuth token expiry
    });
  } catch (error) {
    console.error('ATO connect error:', error);
    return NextResponse.json(
      {
        error: 'Failed to connect to ATO',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
