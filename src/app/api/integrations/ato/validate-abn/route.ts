/**
 * ATO ABN Validation API Route
 *
 * POST /api/integrations/ato/validate-abn
 * Validate ABN with ATO/ABR API
 *
 * Related to: UNI-179 [ATO] ABN/TFN Verification Service
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

    // Get workspace and ABN from request body
    const { workspaceId, abn } = await req.json();

    if (!workspaceId || !abn) {
      return NextResponse.json(
        { error: 'workspaceId and abn required' },
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

    // Check cache first
    const { data: cached } = await supabase
      .from('abn_lookups')
      .select('*')
      .eq('abn', abn)
      .single();

    // If cached and verified within last 7 days, return cached
    if (cached) {
      const lastVerified = new Date(cached.last_verified_at);
      const daysSinceVerification =
        (Date.now() - lastVerified.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceVerification < 7) {
        return NextResponse.json({
          success: true,
          cached: true,
          result: {
            abn: cached.abn,
            entityName: cached.entity_name,
            entityType: cached.entity_type,
            status: cached.status,
            gstRegistered: cached.gst_registered,
            registeredDate: cached.registered_date,
            statusEffectiveFrom: cached.status_effective_from,
          },
          lastVerified: cached.last_verified_at,
        });
      }
    }

    // Initialize ATO client and validate
    const atoClient = createATOClient();
    await atoClient.initialize(workspaceId);

    const result = await atoClient.validateABN(abn);

    return NextResponse.json({
      success: true,
      cached: false,
      result,
      lastVerified: new Date().toISOString(),
    });
  } catch (error) {
    console.error('ABN validation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to validate ABN',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
