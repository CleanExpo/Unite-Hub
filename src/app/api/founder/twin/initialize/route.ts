/**
 * Founder Twin Initialize API
 * Phase D01: Founder Cognitive Twin Kernel
 *
 * POST - Initialize founder twin for a new tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initializeFounderTwin } from '@/lib/founder/founderTwinService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, companyName } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const result = await initializeFounderTwin(tenantId, user.id, companyName);

    return NextResponse.json({
      profile: result.profile,
      settings: result.settings,
      message: 'Founder twin initialized successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error in founder twin initialize POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
