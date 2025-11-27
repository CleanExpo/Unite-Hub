/**
 * API Route: /api/convex/collaborate
 *
 * Handles strategy collaboration:
 * - GET: Fetch sharing, comments, and activity
 * - POST: Share strategy, add comments
 * - PATCH: Update access level, resolve comments
 * - DELETE: Revoke access, delete comments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { logger } from '@/lib/logging';

export async function GET(req: NextRequest) {
  try {
    const strategyId = req.nextUrl.searchParams.get('strategyId');
    const type = req.nextUrl.searchParams.get('type'); // 'sharing' | 'comments' | 'activity'

    if (!strategyId) {
      return NextResponse.json(
        { error: 'Missing strategyId' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    if (type === 'sharing') {
      const { data, error } = await supabase
        .from('convex_strategy_shares')
        .select('*')
        .eq('strategy_id', strategyId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('[COLLABORATE] Sharing fetch error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch sharing' },
          { status: 500 }
        );
      }

      return NextResponse.json(data || []);
    }

    if (type === 'comments') {
      const version = req.nextUrl.searchParams.get('version');
      let query = supabase
        .from('convex_strategy_comments')
        .select('*')
        .eq('strategy_id', strategyId);

      if (version) {
        query = query.eq('version', parseInt(version));
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        logger.error('[COLLABORATE] Comments fetch error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch comments' },
          { status: 500 }
        );
      }

      return NextResponse.json(data || []);
    }

    if (type === 'activity') {
      const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

      const { data, error } = await supabase
        .from('convex_strategy_activity')
        .select('*')
        .eq('strategy_id', strategyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('[COLLABORATE] Activity fetch error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch activity' },
          { status: 500 }
        );
      }

      return NextResponse.json(data || []);
    }

    // Get all collaboration data
    const [sharing, comments, activity] = await Promise.all([
      supabase
        .from('convex_strategy_shares')
        .select('*')
        .eq('strategy_id', strategyId),
      supabase
        .from('convex_strategy_comments')
        .select('*')
        .eq('strategy_id', strategyId),
      supabase
        .from('convex_strategy_activity')
        .select('*')
        .eq('strategy_id', strategyId),
    ]);

    return NextResponse.json({
      sharing: sharing.data || [],
      comments: comments.data || [],
      activity: activity.data || [],
    });
  } catch (error) {
    logger.error('[COLLABORATE] GET error:', error);
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
    const { strategyId, action, userEmail, accessLevel, content, version } = body;

    if (!strategyId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    if (action === 'share') {
      if (!userEmail || !accessLevel) {
        return NextResponse.json(
          { error: 'Missing userEmail or accessLevel' },
          { status: 400 }
        );
      }

      // Get shared-with user ID (simplified - would need user lookup)
      // For now, using a placeholder
      const sharedWithUserId = `user_${userEmail.split('@')[0]}`;

      const { data, error } = await supabase
        .from('convex_strategy_shares')
        .insert([
          {
            strategy_id: strategyId,
            shared_with_user_id: sharedWithUserId,
            shared_by_user_id: userId,
            access_level: accessLevel,
          },
        ])
        .select()
        .single();

      if (error) {
        logger.error('[COLLABORATE] Share error:', error);
        return NextResponse.json(
          { error: 'Failed to share strategy' },
          { status: 500 }
        );
      }

      // Log activity
      await supabase
        .from('convex_strategy_activity')
        .insert([
          {
            strategy_id: strategyId,
            activity_type: 'shared',
            user_id: userId,
            user_name: 'User',
            description: `Shared with ${userEmail} as ${accessLevel}`,
            metadata: { sharedWith: userEmail, accessLevel },
          },
        ]);

      logger.info(`[COLLABORATE] Strategy shared with ${userEmail}`);
      return NextResponse.json(data, { status: 201 });
    }

    if (action === 'comment') {
      if (!content) {
        return NextResponse.json(
          { error: 'Missing comment content' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('convex_strategy_comments')
        .insert([
          {
            strategy_id: strategyId,
            version: version ? parseInt(version) : null,
            author_id: userId,
            author_name: 'User',
            content,
            resolved: false,
          },
        ])
        .select()
        .single();

      if (error) {
        logger.error('[COLLABORATE] Comment error:', error);
        return NextResponse.json(
          { error: 'Failed to add comment' },
          { status: 500 }
        );
      }

      // Log activity
      await supabase
        .from('convex_strategy_activity')
        .insert([
          {
            strategy_id: strategyId,
            activity_type: 'commented',
            user_id: userId,
            user_name: 'User',
            description: `Added comment: ${content.substring(0, 50)}...`,
            metadata: { commentLength: content.length },
          },
        ]);

      logger.info(`[COLLABORATE] Comment added to strategy ${strategyId}`);
      return NextResponse.json(data, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('[COLLABORATE] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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
    const { action, shareId, commentId, newAccessLevel } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    if (action === 'updateAccess') {
      if (!shareId || !newAccessLevel) {
        return NextResponse.json(
          { error: 'Missing shareId or newAccessLevel' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('convex_strategy_shares')
        .update({ access_level: newAccessLevel })
        .eq('id', shareId)
        .select()
        .single();

      if (error) {
        logger.error('[COLLABORATE] Update access error:', error);
        return NextResponse.json(
          { error: 'Failed to update access level' },
          { status: 500 }
        );
      }

      logger.info(`[COLLABORATE] Access level updated for share ${shareId}`);
      return NextResponse.json(data);
    }

    if (action === 'resolveComment') {
      if (!commentId) {
        return NextResponse.json(
          { error: 'Missing commentId' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('convex_strategy_comments')
        .update({ resolved: true, resolved_by: userId, resolved_at: new Date().toISOString() })
        .eq('id', commentId);

      if (error) {
        logger.error('[COLLABORATE] Resolve comment error:', error);
        return NextResponse.json(
          { error: 'Failed to resolve comment' },
          { status: 500 }
        );
      }

      logger.info(`[COLLABORATE] Comment ${commentId} resolved`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('[COLLABORATE] PATCH error:', error);
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
    const { action, shareId, commentId } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    if (action === 'revokeAccess') {
      if (!shareId) {
        return NextResponse.json(
          { error: 'Missing shareId' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('convex_strategy_shares')
        .delete()
        .eq('id', shareId);

      if (error) {
        logger.error('[COLLABORATE] Revoke access error:', error);
        return NextResponse.json(
          { error: 'Failed to revoke access' },
          { status: 500 }
        );
      }

      logger.info(`[COLLABORATE] Access revoked for share ${shareId}`);
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteComment') {
      if (!commentId) {
        return NextResponse.json(
          { error: 'Missing commentId' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('convex_strategy_comments')
        .delete()
        .eq('id', commentId)
        .eq('author_id', userId);

      if (error) {
        logger.error('[COLLABORATE] Delete comment error:', error);
        return NextResponse.json(
          { error: 'Failed to delete comment' },
          { status: 500 }
        );
      }

      logger.info(`[COLLABORATE] Comment ${commentId} deleted`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('[COLLABORATE] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
