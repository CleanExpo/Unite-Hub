/**
 * Pending Email Actions API
 *
 * GET - Get clients with most pending action items
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
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
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10', 10);

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const service = getClientEmailIntelligenceService();
    const clients = await service.getClientsWithPendingActions(workspaceId, limit);

    return NextResponse.json({
      success: true,
      clients,
    });
  } catch (error) {
    console.error('[API] GET /api/email-intel/pending-actions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
