/**
 * POST /api/synthex/segments/generate
 *
 * Generate AI-powered segments from audience data.
 *
 * Body:
 * {
 *   tenantId: string (required)
 *   audienceId: string (required)
 *   save?: boolean (default: true) - Save generated segments to database
 * }
 *
 * Phase: B10 - Synthex Audience Intelligence
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateSegments, saveSegments, getAudience } from '@/lib/synthex/audienceService';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, audienceId, save = true } = body;

    if (!tenantId || !audienceId) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, audienceId' },
        { status: 400 }
      );
    }

    // Validate tenant access
    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Validate audience exists
    const audienceResult = await getAudience(audienceId);
    if (!audienceResult.data) {
      return NextResponse.json({ error: 'Audience not found' }, { status: 404 });
    }

    if (audienceResult.data.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Audience does not belong to tenant' }, { status: 403 });
    }

    // Generate segments using AI
    const generateResult = await generateSegments(tenantId, audienceId);

    if (generateResult.error) {
      throw generateResult.error;
    }

    if (!generateResult.data || generateResult.data.length === 0) {
      return NextResponse.json(
        { error: 'Could not generate segments - insufficient data' },
        { status: 400 }
      );
    }

    // Optionally save to database
    let savedSegments = null;
    if (save) {
      const saveResult = await saveSegments(tenantId, audienceId, generateResult.data);
      if (saveResult.error) {
        console.error('[segments/generate] Save error:', saveResult.error);
        // Don't fail - still return generated segments
      } else {
        savedSegments = saveResult.data;
      }
    }

    return NextResponse.json({
      status: 'ok',
      generatedSegments: generateResult.data,
      savedSegments: savedSegments,
      saved: save && savedSegments !== null,
    }, { status: 201 });
  } catch (error) {
    console.error('[segments/generate POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
