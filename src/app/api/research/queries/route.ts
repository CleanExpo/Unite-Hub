/**
 * Research Queries API
 * Phase D03: Research Fabric v1
 *
 * GET - List research queries
 * POST - Execute a new research query
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listQueries,
  executeQuery,
  type QueryStatus,
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
    const status = searchParams.get('status') as QueryStatus | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const queries = await listQueries(tenantId, {
      projectId: projectId || undefined,
      status: status || undefined,
      limit,
    });

    return NextResponse.json({
      queries,
      count: queries.length,
    });
  } catch (error) {
    console.error('Error in research queries GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { tenantId, ...queryData } = body;

    if (!tenantId || !queryData.query) {
      return NextResponse.json(
        { error: 'tenantId and query are required' },
        { status: 400 }
      );
    }

    const result = await executeQuery(tenantId, queryData, user.id);

    return NextResponse.json({
      query: result,
      message: `Query completed with ${result.result_count} results`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in research queries POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
