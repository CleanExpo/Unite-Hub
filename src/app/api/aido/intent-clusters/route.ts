import { NextRequest, NextResponse } from 'next/server';
import { getIntentClusters, updateIntentCluster } from '@/lib/aido/database/intent-clusters';

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

    const topicId = req.nextUrl.searchParams.get('topicId');
    const clientId = req.nextUrl.searchParams.get('clientId');
    const minBusinessImpact = req.nextUrl.searchParams.get('minBusinessImpact');

    const allClusters = await getIntentClusters(workspaceId, {
      topicId: topicId || undefined,
      clientId: clientId || undefined
    });

    // Filter by minBusinessImpact if provided
    const clusters = minBusinessImpact
      ? allClusters.filter(c => c.business_impact_score >= parseFloat(minBusinessImpact))
      : allClusters;

    return NextResponse.json({
      success: true,
      clusters,
      count: clusters.length
    });

  } catch (error: any) {
    console.error('Get intent clusters error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const updated = await updateIntentCluster(id, workspaceId, updates);

    return NextResponse.json({
      success: true,
      intentCluster: updated
    });

  } catch (error: any) {
    console.error('Update intent cluster error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
