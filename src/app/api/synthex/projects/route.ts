/**
 * Synthex Projects API (Kanban)
 *
 * GET  /api/synthex/projects?tenantId=...
 * POST /api/synthex/projects
 *
 * Client-facing marketing projects that are approval-gated before scheduling/publishing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantAccess, hasTenantRole } from '@/lib/synthex/tenantAccess';
import { createProject, listProjects } from '@/lib/synthex/projectsService';

export async function GET(req: NextRequest) {
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

  const result = await listProjects(tenantId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ status: 'ok', projects: result.projects }, { status: 200 });
}

export async function POST(req: NextRequest) {
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

  const { tenantId, name, goal, brandId, channels } = body as {
    tenantId?: string;
    name?: string;
    goal?: string | null;
    brandId?: string | null;
    channels?: string[] | null;
  };

  if (!tenantId || !name) {
    return NextResponse.json({ error: 'Missing required fields: tenantId, name' }, { status: 400 });
  }

  const access = await getTenantAccess(user.id, tenantId);
  if (!access) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  if (!hasTenantRole(access, ['owner', 'admin', 'editor'])) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const result = await createProject({
    tenantId,
    userId: user.id,
    name,
    goal: goal ?? null,
    brandId: brandId ?? null,
    channels: channels ?? [],
  });

  if (result.error || !result.project) {
    return NextResponse.json({ error: result.error ?? 'Failed to create project' }, { status: 500 });
  }

  return NextResponse.json({ status: 'ok', project: result.project }, { status: 201 });
}

