/**
 * Synthex Admin Tenant Actions API
 * POST /api/synthex/admin/tenants/[tenantId]/actions - Execute safe admin actions
 * Phase B25: Global Admin & Cross-Tenant Reporting
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeAdminAction, AdminAction } from '@/lib/synthex/adminService';

interface RouteParams {
  params: Promise<{
    tenantId: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Await params to get tenantId
    const { tenantId } = await params;

    // Parse request body
    const body = await request.json();
    const { action, params: actionParams } = body;

    // Validate action
    const validActions = ['RUN_HEALTH_CHECK', 'FLAG_STATUS', 'SEND_NOTIFICATION'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Execute action
    const adminAction: AdminAction = {
      action,
      tenant_id: tenantId,
      params: actionParams,
    };

    const result = await executeAdminAction(user.id, adminAction);

    if (!result.success) {
      // Check if it's an authorization error
      if (result.message.includes('does not have access')) {
        return NextResponse.json(
          { error: result.message },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    });

  } catch (error) {
    console.error('[Admin Tenant Actions API] Error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute action' },
      { status: 500 }
    );
  }
}
