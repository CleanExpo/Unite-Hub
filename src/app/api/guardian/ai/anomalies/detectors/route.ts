/**
 * GET/POST /api/guardian/ai/anomalies/detectors
 * List detectors and create new detectors (admin-only)
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');
  await validateUserAndWorkspace(req, workspaceId);

  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_anomaly_detectors')
    .select('*')
    .eq('tenant_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return successResponse({
    detectors: (data || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      metricKey: d.metric_key,
      granularity: d.granularity,
      windowSize: d.window_size,
      method: d.method,
      threshold: d.threshold,
      isActive: d.is_active,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    })),
  });
});

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');
  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });

  const body = await req.json();
  const {
    name,
    description,
    metricKey,
    granularity,
    windowSize,
    baselineLookback,
    method,
    threshold,
    minCount,
    config,
  } = body;

  if (!name || !metricKey) throw new Error('name and metricKey required');

  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_anomaly_detectors')
    .insert({
      tenant_id: workspaceId,
      name,
      description: description || '',
      metric_key: metricKey,
      granularity: granularity || 'hour',
      window_size: windowSize || 24,
      baseline_lookback: baselineLookback || 168,
      method: method || 'zscore',
      threshold: threshold || 3.0,
      min_count: minCount || 0,
      config: config || {},
      created_by: 'api-admin',
    })
    .select('id, name, metric_key, is_active')
    .single();

  if (error) throw error;

  return successResponse({
    detector: {
      id: data.id,
      name: data.name,
      metricKey: data.metric_key,
      isActive: data.is_active,
    },
  });
});
