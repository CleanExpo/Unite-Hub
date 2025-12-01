/**
 * API Route: /api/campaigns/blueprints/[id]
 * GET: Fetch single blueprint with full details
 * PATCH: Update blueprint (approval status, channel content, scoring)
 * DELETE: Delete blueprint
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from 'next/server';
import { withErrorBoundary, AuthenticationError, AuthorizationError, ValidationError, DatabaseError, NotFoundError, successResponse } from '@/lib/errors/boundaries';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/api/campaigns/blueprints/[id]' });

// Helper: Verify founder role access
async function verifyFounderAccess(supabase: any, userId: string, workspaceId: string) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, workspace_id')
    .eq('id', userId)
    .single();

  if (!profile || profile.role !== 'founder' || profile.workspace_id !== workspaceId) {
    throw new AuthorizationError('Founder role required to access this resource');
  }
  return profile;
}

export const GET = withErrorBoundary(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const { id } = params;

  if (!workspaceId || !id) {
    throw new ValidationError('Missing required parameters', { workspaceId: 'Required', id: 'Required' });
  }

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  // Verify founder role
  await verifyFounderAccess(supabase, user.id, workspaceId);

  // Get blueprint
  const { data: blueprint, error } = await supabase
    .from('campaign_blueprints')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError(`Blueprint ${id} not found`);
    }
    throw new DatabaseError('Failed to fetch blueprint');
  }

  // Get revision history
  const { data: revisions } = await supabase
    .from('campaign_blueprint_revisions')
    .select('*')
    .eq('blueprint_id', id)
    .order('revision_number', { ascending: false })
    .limit(10);

  logger.info('Blueprint retrieved', { blueprintId: id, workspaceId });

  return successResponse({
    success: true,
    blueprint,
    revisions: revisions || [],
  }, undefined, undefined, 200);
});

export const PATCH = withErrorBoundary(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const { id } = params;

  if (!workspaceId || !id) {
    throw new ValidationError('Missing required parameters', { workspaceId: 'Required', id: 'Required' });
  }

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  // Verify founder role
  await verifyFounderAccess(supabase, user.id, workspaceId);

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

    if (approveError) {
throw new DatabaseError('Failed to approve channel');
}

    logger.info('Channel approved', { blueprintId: id, channel, userId: user.id });

    // Get updated blueprint
    const { data: updatedBlueprint } = await supabase
      .from('campaign_blueprints')
      .select('*')
      .eq('id', id)
      .single();

    return successResponse({
      success: true,
      blueprint: updatedBlueprint,
      message: `Channel ${channel} approved`,
    }, undefined, undefined, 200);
  }

  // Handle full approval status change
  if (updates.approval_status) {
    const allowedStatuses = ['draft', 'pending_review', 'approved', 'rejected', 'archived'];

    if (!allowedStatuses.includes(updates.approval_status)) {
      throw new ValidationError('Invalid approval status', { approval_status: `Must be one of: ${allowedStatuses.join(', ')}` });
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

    if (updateError) {
throw new DatabaseError('Failed to update blueprint approval status');
}

    logger.info('Blueprint approval status updated', {
      blueprintId: id,
      status: updates.approval_status,
      userId: user.id,
    });

    return successResponse({
      success: true,
      blueprint: updatedBlueprint,
    }, undefined, undefined, 200);
  }

  // Handle content updates
  const allowedUpdates: any = {};

  if (updates.blueprint_title) {
allowedUpdates.blueprint_title = updates.blueprint_title;
}
  if (updates.website_content) {
allowedUpdates.website_content = updates.website_content;
}
  if (updates.blog_content) {
allowedUpdates.blog_content = updates.blog_content;
}
  if (updates.social_content) {
allowedUpdates.social_content = updates.social_content;
}
  if (updates.email_content) {
allowedUpdates.email_content = updates.email_content;
}
  if (updates.video_content) {
allowedUpdates.video_content = updates.video_content;
}
  if (updates.visual_concepts) {
allowedUpdates.visual_concepts = updates.visual_concepts;
}
  if (updates.difficulty_score) {
allowedUpdates.difficulty_score = updates.difficulty_score;
}
  if (updates.impact_score) {
allowedUpdates.impact_score = updates.impact_score;
}
  if (updates.effort_score) {
allowedUpdates.effort_score = updates.effort_score;
}

  if (Object.keys(allowedUpdates).length === 0) {
    throw new ValidationError('No valid updates provided', { updates: 'At least one field required' });
  }

  allowedUpdates.updated_by = user.id;

  const { data: updatedBlueprint, error: updateError } = await supabase
    .from('campaign_blueprints')
    .update(allowedUpdates)
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (updateError) {
throw new DatabaseError('Failed to update blueprint');
}

  logger.info('Blueprint updated', { blueprintId: id, updates: Object.keys(allowedUpdates) });

  return successResponse({
    success: true,
    blueprint: updatedBlueprint,
  }, undefined, undefined, 200);
});

export const DELETE = withErrorBoundary(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const { id } = params;

  if (!workspaceId || !id) {
    throw new ValidationError('Missing required parameters', { workspaceId: 'Required', id: 'Required' });
  }

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  // Verify founder role
  await verifyFounderAccess(supabase, user.id, workspaceId);

  // Soft delete by archiving
  const { error: archiveError } = await supabase
    .from('campaign_blueprints')
    .update({
      approval_status: 'archived',
      updated_by: user.id,
    })
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (archiveError) {
throw new DatabaseError('Failed to archive blueprint');
}

  logger.info('Blueprint archived', { blueprintId: id, userId: user.id });

  return successResponse({
    success: true,
    message: 'Blueprint archived successfully',
  }, undefined, undefined, 200);
});
