/**
 * Research Findings API
 * Phase D03: Research Fabric v1
 *
 * GET - List research findings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listFindings,
  type FindingType,
} from '@/lib/research/researchFabricService';

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
    const projectId = searchParams.get('projectId');
    const findingType = searchParams.get('findingType') as FindingType | null;
    const starredOnly = searchParams.get('starredOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const findings = await listFindings(tenantId, {
      projectId: projectId || undefined,
      findingType: findingType || undefined,
      starredOnly,
      limit,
    });

    return NextResponse.json({
      findings,
      count: findings.length,
    });
  } catch (error) {
    console.error('Error in research findings GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
