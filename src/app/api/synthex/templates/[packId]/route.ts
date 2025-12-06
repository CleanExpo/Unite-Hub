/**
 * Synthex Template Pack Detail API
 * GET /api/synthex/templates/[packId] - Get pack details
 * Phase B24: Template Packs & Cross-Business Playbooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPackById } from '@/lib/synthex/templatePackService';

/**
 * GET /api/synthex/templates/[packId]
 * Get a single template pack by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
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

    const { packId } = await params;

    if (!packId) {
      return NextResponse.json(
        { error: 'packId is required' },
        { status: 400 }
      );
    }

    const pack = await getPackById(packId);

    if (!pack) {
      return NextResponse.json(
        { error: 'Pack not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pack,
    });

  } catch (error) {
    console.error('[Template Pack Detail API] GET Error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch template pack' },
      { status: 500 }
    );
  }
}
