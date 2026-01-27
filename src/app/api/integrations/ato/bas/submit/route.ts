/**
 * BAS Submit API Route
 *
 * POST /api/integrations/ato/bas/submit
 * Calculate and submit BAS to ATO
 *
 * Related to: UNI-177 [ATO] BAS Lodgement Automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { autoSubmitBAS, BASPeriodConfig } from '@/lib/integrations/ato/basAutomationService';

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

    // Get request body
    const {
      workspaceId,
      abn,
      businessName,
      config,
    }: {
      workspaceId: string;
      abn: string;
      businessName: string;
      config: BASPeriodConfig;
    } = await req.json();

    if (!workspaceId || !abn || !businessName || !config) {
      return NextResponse.json(
        { error: 'workspaceId, abn, businessName, and config required' },
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

    // Only admins/owners can submit BAS
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Admin role required to submit BAS' },
        { status: 403 }
      );
    }

    // Submit BAS
    const result = await autoSubmitBAS(workspaceId, abn, businessName, config);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Submission failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submissionReference: result.submissionReference,
      receiptId: result.receiptId,
      lodgedAt: result.lodgedAt,
    });
  } catch (error) {
    console.error('BAS submission error:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit BAS',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
