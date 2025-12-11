/**
 * GET /api/guardian/admin/drills — List drills
 * POST /api/guardian/admin/drills — Create drill from simulation
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { buildDrillTemplateFromSimulation, createDrillFromTemplate } from '@/lib/guardian/simulation/drillBuilder';
import { getSupabaseServer } from '@/lib/supabase';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  const isActive = req.nextUrl.searchParams.get('isActive');
  const difficulty = req.nextUrl.searchParams.get('difficulty');
  const sourceType = req.nextUrl.searchParams.get('sourceType');

  const supabase = getSupabaseServer();

  let query = supabase
    .from('guardian_incident_drills')
    .select('*')
    .eq('tenant_id', workspaceId)
    .order('created_at', { ascending: false });

  if (isActive === 'true') {
    query = query.eq('is_active', true);
  }

  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }

  if (sourceType) {
    query = query.eq('source_type', sourceType);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(`Failed to list drills: ${error.message}`, 500);
  }

  return successResponse({ data: data || [] });
});

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON in request body', 400);
  }

  const { name, description, difficulty, source } = body;

  if (!source || !source.type || !source.id) {
    return errorResponse('source with type and id required', 400);
  }

  try {
    // Build template from simulation
    const template = await buildDrillTemplateFromSimulation(workspaceId, source);

    // Override name/description/difficulty if provided
    const finalTemplate = {
      ...template,
      name: name || template.name,
      description: description || template.description,
      difficulty: difficulty || template.difficulty,
    };

    // Create drill from template
    const drillId = await createDrillFromTemplate(workspaceId, finalTemplate, source);

    return successResponse({ drillId }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create drill from simulation';
    return errorResponse(message, 500);
  }
});
