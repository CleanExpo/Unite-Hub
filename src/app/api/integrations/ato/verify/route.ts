/**
 * ATO Verification API Route
 *
 * POST /api/integrations/ato/verify
 * Verify ABN or TFN
 *
 * Related to: UNI-179 [ATO] ABN/TFN Verification Service
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verificationService, VerificationRequest } from '@/lib/integrations/ato/verificationService';

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
    const body = await req.json();
    const {
      identifier,
      type = 'auto',
      workspaceId,
      useCache = true,
    }: VerificationRequest = body;

    if (!identifier) {
      return NextResponse.json(
        { error: 'identifier required' },
        { status: 400 }
      );
    }

    // If workspace provided, verify user has access
    if (workspaceId) {
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
    }

    // Perform verification
    const result = await verificationService.verify({
      identifier,
      type,
      workspaceId,
      useCache,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      {
        error: 'Verification failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
