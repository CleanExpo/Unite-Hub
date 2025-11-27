/**
 * API Route: /api/convex/framework-publish
 *
 * Handles framework publishing operations:
 * - POST: Publish framework to public library
 * - POST: Update published framework
 * - GET: Get published frameworks
 * - DELETE: Unpublish framework
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { logger } from '@/lib/logging';

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const frameworkId = req.nextUrl.searchParams.get('frameworkId');
    const action = req.nextUrl.searchParams.get('action') || 'list';
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    if (action === 'list') {
      // List published frameworks by workspace
      const { data, error } = await supabase
        .from('convex_custom_frameworks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_public', true)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('[PUBLISH] List error:', error);
        return NextResponse.json(
          { error: 'Failed to list published frameworks' },
          { status: 500 }
        );
      }

      const { count } = await supabase
        .from('convex_custom_frameworks')
        .select('id', { count: 'exact' })
        .eq('workspace_id', workspaceId)
        .eq('is_public', true);

      return NextResponse.json({
        frameworks: data || [],
        total: count || 0,
        limit,
        offset,
      });
    }

    if (action === 'get' && frameworkId) {
      // Get specific published framework
      const { data, error } = await supabase
        .from('convex_custom_frameworks')
        .select('*')
        .eq('id', frameworkId)
        .eq('workspace_id', workspaceId)
        .eq('is_public', true)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Framework not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('[PUBLISH] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    }

    const body = await req.json();
    const {
      workspaceId,
      frameworkId,
      action,
      description,
      category,
      difficulty,
      industry,
      preview,
    } = body;

    if (!workspaceId || !frameworkId) {
      return NextResponse.json(
        { error: 'Missing workspaceId or frameworkId' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Check workspace access
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('org_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (orgError || !orgData || !['owner', 'editor'].includes(orgData.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (action === 'publish') {
      // Publish framework to public library
      // Get framework
      const { data: framework, error: fwError } = await supabase
        .from('convex_custom_frameworks')
        .select('*')
        .eq('id', frameworkId)
        .eq('workspace_id', workspaceId)
        .single();

      if (fwError || !framework) {
        return NextResponse.json(
          { error: 'Framework not found' },
          { status: 404 }
        );
      }

      // Update framework to public
      const { data: published, error: publishError } = await supabase
        .from('convex_custom_frameworks')
        .update({
          is_public: true,
          published_at: new Date().toISOString(),
          published_by: userId,
          publication_metadata: {
            category,
            difficulty,
            industry,
            preview,
            description: description || framework.description,
          },
        })
        .eq('id', frameworkId)
        .eq('workspace_id', workspaceId)
        .select()
        .single();

      if (publishError) {
        logger.error('[PUBLISH] Publish error:', publishError);
        return NextResponse.json(
          { error: 'Failed to publish framework' },
          { status: 500 }
        );
      }

      // Log to activity table if available
      await supabase.from('convex_strategy_activity').insert([
        {
          strategy_id: frameworkId,
          workspace_id: workspaceId,
          user_id: userId,
          action: 'published',
          metadata: {
            framework_name: framework.name,
            category,
            difficulty,
          },
        },
      ]).catch((e) => logger.error('[PUBLISH] Activity log error:', e));

      logger.info(`[PUBLISH] Framework published: ${frameworkId}`);
      return NextResponse.json(published, { status: 201 });
    }

    if (action === 'unpublish') {
      // Unpublish framework
      const { data: unpublished, error: unpublishError } = await supabase
        .from('convex_custom_frameworks')
        .update({
          is_public: false,
          published_at: null,
          published_by: null,
        })
        .eq('id', frameworkId)
        .eq('workspace_id', workspaceId)
        .select()
        .single();

      if (unpublishError) {
        logger.error('[PUBLISH] Unpublish error:', unpublishError);
        return NextResponse.json(
          { error: 'Failed to unpublish framework' },
          { status: 500 }
        );
      }

      logger.info(`[PUBLISH] Framework unpublished: ${frameworkId}`);
      return NextResponse.json(unpublished);
    }

    if (action === 'updateMetadata') {
      // Update published framework metadata
      const { data: updated, error: updateError } = await supabase
        .from('convex_custom_frameworks')
        .update({
          publication_metadata: {
            category,
            difficulty,
            industry,
            preview,
            description: description || undefined,
          },
        })
        .eq('id', frameworkId)
        .eq('workspace_id', workspaceId)
        .eq('is_public', true)
        .select()
        .single();

      if (updateError) {
        logger.error('[PUBLISH] Update metadata error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update metadata' },
          { status: 500 }
        );
      }

      logger.info(`[PUBLISH] Framework metadata updated: ${frameworkId}`);
      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('[PUBLISH] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    }

    const body = await req.json();
    const { workspaceId, frameworkId } = body;

    if (!workspaceId || !frameworkId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Check workspace access (owner only)
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('org_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (orgError || !orgData || orgData.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can delete frameworks' },
        { status: 403 }
      );
    }

    // Unpublish framework
    const { error } = await supabase
      .from('convex_custom_frameworks')
      .update({
        is_public: false,
        published_at: null,
      })
      .eq('id', frameworkId)
      .eq('workspace_id', workspaceId);

    if (error) {
      logger.error('[PUBLISH] Unpublish error:', error);
      return NextResponse.json(
        { error: 'Failed to unpublish framework' },
        { status: 500 }
      );
    }

    logger.info(`[PUBLISH] Framework unpublished: ${frameworkId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[PUBLISH] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
