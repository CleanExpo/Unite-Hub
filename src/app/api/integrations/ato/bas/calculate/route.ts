/**
 * BAS Calculate API Route
 *
 * POST /api/integrations/ato/bas/calculate
 * Calculate BAS for a period without submitting
 *
 * Related to: UNI-177 [ATO] BAS Lodgement Automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateBAS, BASPeriodConfig } from '@/lib/integrations/ato/basAutomationService';

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

    // Calculate BAS
    const result = await calculateBAS(workspaceId, abn, businessName, config);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('BAS calculation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate BAS',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
