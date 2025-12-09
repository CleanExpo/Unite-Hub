/**
 * Research Finding by ID API
 * Phase D03: Research Fabric v1
 *
 * PUT - Update finding (star, review, actionable)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateFinding } from '@/lib/research/researchFabricService';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { is_starred, is_reviewed, is_actionable } = body;

    const finding = await updateFinding(id, {
      is_starred,
      is_reviewed,
      is_actionable,
    });

    return NextResponse.json({ finding });
  } catch (error) {
    console.error('Error in research finding PUT:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
