/**
 * Synthex Project Drafts API
 *
 * POST /api/synthex/projects/:projectId/drafts
 * Creates a new draft run and moves project into client_review.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantAccess, hasTenantRole } from '@/lib/synthex/tenantAccess';
import { generateDraftRun } from '@/lib/synthex/projectsService';

export async function POST(
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

  const { tenantId } = body as { tenantId?: string };
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  const access = await getTenantAccess(user.id, tenantId);
  if (!access) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  if (!hasTenantRole(access, ['owner', 'admin', 'editor'])) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { projectId } = await ctx.params;
  const result = await generateDraftRun({ tenantId, projectId, userId: user.id });

  if (result.error || !result.run) {
    return NextResponse.json({ error: result.error ?? 'Failed to generate drafts' }, { status: 500 });
  }

  return NextResponse.json({ status: 'ok', run: result.run }, { status: 200 });
}

