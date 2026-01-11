import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

/**
 * GET /api/guardian/ai/anomalies/detectors/[id]
 * Retrieve a specific anomaly detector configuration
 */
export const GET = withErrorBoundary(async (req: NextRequest, context) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const { id } = await context.params;

  // Get detector with RLS isolation
  const { data, error } = await supabase
    .from('guardian_anomaly_detectors')
    .select(
      `
      id,
      name,
      description,
      is_active,
      metric_key,
      granularity,
      window_size,
      baseline_lookback,
      method,
      threshold,
      min_count,
      config,
      created_by,
      created_at,
      updated_at,
      metadata
      `
    )
    .eq('id', id)
    .eq('tenant_id', workspaceId)
    .single();

  if (error || !data) {
    return errorResponse('Detector not found', 404);
  }

  return successResponse(data);
});

/**
 * PATCH /api/guardian/ai/anomalies/detectors/[id]
 * Update detector configuration (admin-only)
 */
export const PATCH = withErrorBoundary(async (req: NextRequest, context) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  const user = await validateUserAndWorkspace(req, workspaceId);
  if (!user.isAdmin) {
    return errorResponse('Admin access required', 403);
  }

  const supabase = getSupabaseServer();
  const { id } = await context.params;

  const body = await req.json();

  // Validate immutable fields
  if (body.id || body.tenant_id || body.metric_key) {
    return errorResponse('Cannot update immutable fields', 400);
  }

  // Update allowed fields
  const updateData: Record<string, unknown> = {};
  const allowedFields = [
    'name',
    'description',
    'is_active',
    'granularity',
    'window_size',
    'baseline_lookback',
    'method',
    'threshold',
    'min_count',
    'config',
  ];

  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  // Validate field constraints if provided
  if ('threshold' in updateData && typeof updateData.threshold === 'number') {
    if (updateData.threshold <= 0) {
      return errorResponse('threshold must be > 0', 400);
    }
  }

  if ('min_count' in updateData && typeof updateData.min_count === 'number') {
    if (updateData.min_count < 0) {
      return errorResponse('min_count must be >= 0', 400);
    }
  }

  if ('window_size' in updateData && typeof updateData.window_size === 'number') {
    if (updateData.window_size <= 0) {
      return errorResponse('window_size must be > 0', 400);
    }
  }

  if ('baseline_lookback' in updateData && typeof updateData.baseline_lookback === 'number') {
    if (updateData.baseline_lookback <= 0) {
      return errorResponse('baseline_lookback must be > 0', 400);
    }
  }

  if ('method' in updateData) {
    const validMethods = ['zscore', 'ewma', 'iqr'];
    if (!validMethods.includes(updateData.method as string)) {
      return errorResponse('Invalid method', 400);
    }
  }

  if ('granularity' in updateData) {
    const validGranularities = ['hour', 'day'];
    if (!validGranularities.includes(updateData.granularity as string)) {
      return errorResponse('Invalid granularity', 400);
    }
  }

  updateData.updated_at = new Date().toISOString();

  // Ensure tenant isolation in update
  const { data, error } = await supabase
    .from('guardian_anomaly_detectors')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', workspaceId)
    .select()
    .single();

  if (error || !data) {
    return errorResponse('Failed to update detector', 500);
  }

  return successResponse(data);
});

/**
 * DELETE /api/guardian/ai/anomalies/detectors/[id]
 * Archive a detector (soft delete, admin-only)
 */
export const DELETE = withErrorBoundary(async (req: NextRequest, context) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  const user = await validateUserAndWorkspace(req, workspaceId);
  if (!user.isAdmin) {
    return errorResponse('Admin access required', 403);
  }

  const supabase = getSupabaseServer();
  const { id } = await context.params;

  // Soft delete: set is_active = false
  const { data, error } = await supabase
    .from('guardian_anomaly_detectors')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', workspaceId)
    .select()
    .single();

  if (error || !data) {
    return errorResponse('Failed to delete detector', 500);
  }

  return successResponse({ id: data.id, status: 'archived' });
});
