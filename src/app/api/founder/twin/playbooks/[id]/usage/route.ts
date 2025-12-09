/**
 * Founder Twin Playbook Usage API
 * Phase D01: Founder Cognitive Twin Kernel
 *
 * POST - Record playbook usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordPlaybookUsage } from '@/lib/founder/founderTwinService';

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
    const { successScore } = body;

    await recordPlaybookUsage(id, successScore);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in playbook usage POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
