/**
 * Synthex Template Duplicate API
 * Phase D04: Template Library
 *
 * POST - Duplicate a template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { duplicateTemplate } from '@/lib/synthex/templateService';

export async function POST(
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
    const { title } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'title is required for duplicate' },
        { status: 400 }
      );
    }

    const template = await duplicateTemplate(id, title, user.id);

    return NextResponse.json({
      success: true,
      template,
    }, { status: 201 });
  } catch (error) {
    console.error('[Template Duplicate API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to duplicate template' },
      { status: 500 }
    );
  }
}
