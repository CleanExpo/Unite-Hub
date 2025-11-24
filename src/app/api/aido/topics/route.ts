import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createTopic, getTopics } from '@/lib/aido/database/topics';
import { checkTierRateLimit } from '@/lib/rate-limit-tiers';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data, error } = await supabaseBrowser.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await checkTierRateLimit(req, data.user.id, 'api');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const body = await req.json();
    const {
      clientId,
      pillarId,
      name,
      slug,
      problemStatement,
      audienceSegment,
      priorityLevel,
      status
    } = body;

    if (!clientId || !pillarId || !name || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, pillarId, name, slug' },
        { status: 400 }
      );
    }

    const topic = await createTopic({
      clientId,
      workspaceId,
      pillarId,
      name,
      slug,
      problemStatement,
      audienceSegment,
      priorityLevel: priorityLevel || 5,
      status: status || 'active'
    });

    return NextResponse.json({
      success: true,
      topic
    });

  } catch (error: any) {
    console.error('Create topic error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data, error } = await supabaseBrowser.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const clientId = req.nextUrl.searchParams.get('clientId');
    const status = req.nextUrl.searchParams.get('status');

    const topics = await getTopics(workspaceId, clientId || undefined, status || undefined);

    return NextResponse.json({
      success: true,
      topics,
      count: topics.length
    });

  } catch (error: any) {
    console.error('Get topics error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
