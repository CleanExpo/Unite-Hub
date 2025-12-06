/**
 * Synthex Social Run API
 * Phase B31: Execute Social Posts
 *
 * POST - Publish a post or process due posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  publishPost,
  processDuePosts,
  getPostAnalytics,
} from '@/lib/synthex/socialService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenant_id, action, post_id } = body;

    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
    }

    // Process all due posts (scheduler action)
    if (action === 'process_due') {
      const result = await processDuePosts();
      return NextResponse.json({ result });
    }

    // Publish single post
    if (action === 'publish') {
      if (!post_id) {
        return NextResponse.json({ error: 'post_id is required for publish action' }, { status: 400 });
      }
      const post = await publishPost(tenant_id, post_id);
      return NextResponse.json({ post });
    }

    // Get analytics for a post
    if (action === 'get_analytics') {
      if (!post_id) {
        return NextResponse.json({ error: 'post_id is required for analytics' }, { status: 400 });
      }
      const analytics = await getPostAnalytics(tenant_id, post_id);
      return NextResponse.json({ analytics });
    }

    return NextResponse.json(
      { error: 'action is required (process_due, publish, get_analytics)' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in social/run POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for checking post status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const postId = searchParams.get('postId');

    if (!tenantId || !postId) {
      return NextResponse.json(
        { error: 'tenantId and postId are required' },
        { status: 400 }
      );
    }

    const analytics = await getPostAnalytics(tenantId, postId);

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error in social/run GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
