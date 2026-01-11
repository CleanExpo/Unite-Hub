/**
 * Synthex Project Detail API
 *
 * GET   /api/synthex/projects/:projectId?tenantId=...
 * PATCH /api/synthex/projects/:projectId
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantAccess, hasTenantRole } from '@/lib/synthex/tenantAccess';
import { getProjectDetail } from '@/lib/synthex/projectsService';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  const access = await getTenantAccess(user.id, tenantId);
  if (!access) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { projectId } = await ctx.params;

  const result = await getProjectDetail({ tenantId, projectId });
  if (result.error || !result.project) {
    return NextResponse.json({ error: result.error ?? 'Not found' }, { status: 404 });
  }

  return NextResponse.json(
    { status: 'ok', project: result.project, latestRun: result.latestRun ?? null },
    { status: 200 }
  );
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await req.json();
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { tenantId, stage } = body as { tenantId?: string; stage?: string };
  if (!tenantId || !stage) {
    return NextResponse.json({ error: 'Missing required fields: tenantId, stage' }, { status: 400 });
  }

  const access = await getTenantAccess(user.id, tenantId);
  if (!access) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  if (!hasTenantRole(access, ['owner', 'admin', 'editor'])) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Keep PATCH intentionally restrictive to avoid bypassing approval gating.
  // Currently only supports archiving/unarchiving by admins/editors.
  if (!['archived', 'brief'].includes(stage)) {
    return NextResponse.json({ error: 'Unsupported stage transition' }, { status: 400 });
  }

  const { projectId } = await ctx.params;
  const nowIso = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('synthex_projects')
    .update({ stage, updated_at: nowIso })
    .eq('tenant_id', tenantId)
    .eq('id', projectId)
    .select('*')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ status: 'ok', project: data }, { status: 200 });
}

