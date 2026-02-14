/**
 * API Route: /api/campaigns/blueprints/[id]
 * GET: Fetch single blueprint with full details
 * PATCH: Update blueprint (approval status, channel content, scoring)
 * DELETE: Delete blueprint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/api/campaigns/blueprints/[id]' });

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId || !id) {
      return NextResponse.json({ error: 'Missing workspaceId or id' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify founder role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, workspace_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'founder' || profile.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Forbidden - Founder role required' }, { status: 403 });
    }

    // Get blueprint
    const { data: blueprint, error } = await supabase
      .from('campaign_blueprints')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
      }
      throw error;
    }

    // Get revision history
    const { data: revisions } = await supabase
      .from('campaign_blueprint_revisions')
      .select('*')
      .eq('blueprint_id', id)
      .order('revision_number', { ascending: false })
      .limit(10);

    logger.info('Blueprint retrieved', { blueprintId: id, workspaceId });

    return NextResponse.json({
      success: true,
      blueprint,
      revisions: revisions || [],
    });
  } catch (error) {
    logger.error('Failed to get blueprint', { error, blueprintId: id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId || !id) {
      return NextResponse.json({ error: 'Missing workspaceId or id' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify founder role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, workspace_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'founder' || profile.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Forbidden - Founder role required' }, { status: 403 });
    }

    // Parse update data
    const updates = await req.json();

    // Handle channel-specific approval
    if (updates.approve_channel) {
      const { channel } = updates.approve_channel;

      const { error: approveError } = await supabase.rpc('approve_blueprint_channel', {
        p_blueprint_id: id,
        p_channel: channel,
        p_approved_by: user.id,
      });

      if (approveError) throw approveError;

      logger.info('Channel approved', { blueprintId: id, channel, userId: user.id });

      // Get updated blueprint
      const { data: updatedBlueprint } = await supabase
        .from('campaign_blueprints')
        .select('*')
        .eq('id', id)
        .single();

      return NextResponse.json({
        success: true,
        blueprint: updatedBlueprint,
        message: `Channel ${channel} approved`,
      });
    }

    // Handle full approval status change
    if (updates.approval_status) {
      const allowedStatuses = ['draft', 'pending_review', 'approved', 'rejected', 'archived'];

      if (!allowedStatuses.includes(updates.approval_status)) {
        return NextResponse.json({ error: 'Invalid approval status' }, { status: 400 });
      }

      const updateData: any = {
        approval_status: updates.approval_status,
        updated_by: user.id,
      };

      if (updates.approval_status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user.id;
      }

      if (updates.approval_status === 'rejected' && updates.rejected_reason) {
        updateData.rejected_reason = updates.rejected_reason;
      }

      const { data: updatedBlueprint, error: updateError } = await supabase
        .from('campaign_blueprints')
        .update(updateData)
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .select()
        .single();

      if (updateError) throw updateError;

      logger.info('Blueprint approval status updated', {
        blueprintId: id,
        status: updates.approval_status,
        userId: user.id,
      });

      return NextResponse.json({
        success: true,
        blueprint: updatedBlueprint,
      });
    }

    // Handle content updates
    const allowedUpdates: any = {};

    if (updates.blueprint_title) allowedUpdates.blueprint_title = updates.blueprint_title;
    if (updates.website_content) allowedUpdates.website_content = updates.website_content;
    if (updates.blog_content) allowedUpdates.blog_content = updates.blog_content;
    if (updates.social_content) allowedUpdates.social_content = updates.social_content;
    if (updates.email_content) allowedUpdates.email_content = updates.email_content;
    if (updates.video_content) allowedUpdates.video_content = updates.video_content;
    if (updates.visual_concepts) allowedUpdates.visual_concepts = updates.visual_concepts;
    if (updates.difficulty_score) allowedUpdates.difficulty_score = updates.difficulty_score;
    if (updates.impact_score) allowedUpdates.impact_score = updates.impact_score;
    if (updates.effort_score) allowedUpdates.effort_score = updates.effort_score;

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    allowedUpdates.updated_by = user.id;

    const { data: updatedBlueprint, error: updateError } = await supabase
      .from('campaign_blueprints')
      .update(allowedUpdates)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (updateError) throw updateError;

    logger.info('Blueprint updated', { blueprintId: id, updates: Object.keys(allowedUpdates) });

    return NextResponse.json({
      success: true,
      blueprint: updatedBlueprint,
    });
  } catch (error) {
    logger.error('Failed to update blueprint', { error, blueprintId: id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId || !id) {
      return NextResponse.json({ error: 'Missing workspaceId or id' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify founder role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, workspace_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'founder' || profile.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Forbidden - Founder role required' }, { status: 403 });
    }

    // Soft delete by archiving
    const { error: archiveError } = await supabase
      .from('campaign_blueprints')
      .update({
        approval_status: 'archived',
        updated_by: user.id,
      })
      .eq('id', id)
      .eq('workspace_id', workspaceId);

    if (archiveError) throw archiveError;

    logger.info('Blueprint archived', { blueprintId: id, userId: user.id });

    return NextResponse.json({
      success: true,
      message: 'Blueprint archived successfully',
    });
  } catch (error) {
    logger.error('Failed to delete blueprint', { error, blueprintId: id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
