/**
 * Template AI Generation API
 *
 * Phase: D57 - Multi-Brand Template Library & Provisioning
 *
 * Routes:
 * - POST /api/unite/templates/generate - AI-generate template structure
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiGenerateTemplate } from '@/lib/unite/templateService';

// =============================================================================
// POST - AI-generate template
// =============================================================================

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
    const { description, category, channel } = body;

    if (!description || !category || !channel) {
      return NextResponse.json(
        { error: 'description, category, and channel are required' },
        { status: 400 }
      );
    }

    const generated = await aiGenerateTemplate(description, category, channel);

    return NextResponse.json({ generated });
  } catch (error: unknown) {
    console.error('POST /api/unite/templates/generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate template' },
      { status: 500 }
    );
  }
}
