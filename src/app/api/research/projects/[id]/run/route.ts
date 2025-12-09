/**
 * Research Project Run API
 * Phase D03: Research Fabric v1
 *
 * POST - Run research workflow for a project
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runProjectResearch } from '@/lib/research/researchFabricService';

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
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const result = await runProjectResearch(tenantId, id, user.id);

    return NextResponse.json({
      run: result.run,
      queriesExecuted: result.queriesExecuted,
      findingsCreated: result.findingsCreated,
      message: `Research completed: ${result.queriesExecuted} queries, ${result.findingsCreated} findings`,
    });
  } catch (error) {
    console.error('Error in research project run POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
