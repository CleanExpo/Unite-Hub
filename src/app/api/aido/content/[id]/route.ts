import { NextRequest, NextResponse } from 'next/server';
import { getContentAsset, updateContentAsset } from '@/lib/aido/database/content-assets';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const asset = await getContentAsset(params.id, workspaceId);

    if (!asset) {
      return NextResponse.json({ error: 'Content asset not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      asset
    });

  } catch (error: any) {
    console.error('Get content asset error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const updates = { ...body };
    delete updates.id; // Don't allow ID modification

    // If status is being changed to published, set publishedAt
    if (updates.status === 'published' && !updates.publishedAt) {
      updates.publishedAt = new Date().toISOString();
    }

    // If content is being edited, update lastReviewedAt
    if (updates.bodyMarkdown || updates.qaBlocks) {
      updates.lastReviewedAt = new Date().toISOString();
    }

    const updated = await updateContentAsset(params.id, workspaceId, updates);

    return NextResponse.json({
      success: true,
      asset: updated,
      message: updates.status === 'published' ? 'Content published successfully' : 'Content updated successfully'
    });

  } catch (error: any) {
    console.error('Update content asset error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
