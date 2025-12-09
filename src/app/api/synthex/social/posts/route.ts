/**
 * Synthex Social Posts API
 * Phase B31: Social Media Scheduling
 *
 * GET   - List posts
 * POST  - Create/schedule a post
 * PATCH - Update a post
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getPosts,
  schedulePost,
  updatePost,
  rewriteForPlatform,
  optimizeHashtags,
  getTemplates,
  createFromTemplate,
  type PostStatus,
  type SocialProvider,
} from '@/lib/synthex/socialService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status') as PostStatus | null;
    const accountId = searchParams.get('accountId');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Get templates
    if (action === 'templates') {
      const templates = await getTemplates(tenantId);
      return NextResponse.json({ templates, count: templates.length });
    }

    // List posts
    const posts = await getPosts(tenantId, {
      status: status || undefined,
      account_id: accountId || undefined,
      limit,
    });

    return NextResponse.json({ posts, count: posts.length });
  } catch (error) {
    console.error('Error in social/posts GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenant_id, action, ...params } = body;

    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
    }

    // AI rewrite for platform
    if (action === 'rewrite') {
      const { content, platform, tone, include_hashtags } = params;
      if (!content || !platform) {
        return NextResponse.json(
          { error: 'content and platform are required' },
          { status: 400 }
        );
      }
      const result = await rewriteForPlatform(content, platform as SocialProvider, {
        tone,
        includeHashtags: include_hashtags,
      });
      return NextResponse.json({ result });
    }

    // Optimize hashtags
    if (action === 'optimize_hashtags') {
      const { content, platform, existing_hashtags } = params;
      if (!content || !platform) {
        return NextResponse.json(
          { error: 'content and platform are required' },
          { status: 400 }
        );
      }
      const hashtags = await optimizeHashtags(content, platform as SocialProvider, existing_hashtags);
      return NextResponse.json({ hashtags });
    }

    // Create from template
    if (action === 'from_template') {
      const { template_id, account_id, variables } = params;
      if (!template_id || !account_id) {
        return NextResponse.json(
          { error: 'template_id and account_id are required' },
          { status: 400 }
        );
      }
      const post = await createFromTemplate(tenant_id, template_id, account_id, variables || {});
      return NextResponse.json({ post }, { status: 201 });
    }

    // Create/schedule new post
    const { account_id, content_type, text_content, hashtags, mentions, media_urls, link_url, scheduled_for, campaign_id } = body;

    if (!account_id || !text_content) {
      return NextResponse.json(
        { error: 'account_id and text_content are required' },
        { status: 400 }
      );
    }

    const post = await schedulePost({
      tenant_id,
      account_id,
      content_type,
      text_content,
      hashtags,
      mentions,
      media_urls,
      link_url,
      scheduled_for,
      campaign_id,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error in social/posts POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenant_id, post_id, text_content, hashtags, scheduled_for, status, media_urls } = body;

    if (!tenant_id || !post_id) {
      return NextResponse.json(
        { error: 'tenant_id and post_id are required' },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (text_content !== undefined) {
updates.text_content = text_content;
}
    if (hashtags !== undefined) {
updates.hashtags = hashtags;
}
    if (scheduled_for !== undefined) {
updates.scheduled_for = scheduled_for;
}
    if (status !== undefined) {
updates.status = status;
}
    if (media_urls !== undefined) {
updates.media_urls = media_urls;
}

    const post = await updatePost(tenant_id, post_id, updates);

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error in social/posts PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
