/**
 * Founder Twin Context API
 * Phase D01: Founder Cognitive Twin Kernel
 *
 * GET - Get full founder context for AI injection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getFounderContextForAI,
  getFullFounderContext,
} from '@/lib/founder/founderTwinService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const format = searchParams.get('format') || 'text'; // 'text' or 'full'

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    if (format === 'full') {
      // Return full structured data
      const context = await getFullFounderContext(tenantId);
      return NextResponse.json({ context });
    } else {
      // Return text summary for AI context injection
      const contextText = await getFounderContextForAI(tenantId);
      return NextResponse.json({ context: contextText });
    }
  } catch (error) {
    console.error('Error in founder context GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
