import { NextRequest, NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import {
  getGuardianRule,
  upsertGuardianRule,
  deleteGuardianRule,
} from '@/lib/guardian/ruleEditorService';

/**
 * Guardian Rule Detail API (G45)
 * GET: Fetch single rule (all Guardian roles)
 * PATCH: Update existing rule (admin only)
 * DELETE: Delete rule (admin only)
 */

const VIEW_ROLES = ['guardian_viewer', 'guardian_analyst', 'guardian_admin'];
const EDIT_ROLES = ['guardian_admin'];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, VIEW_ROLES as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();
    const { id } = await context.params;

    const rule = await getGuardianRule(tenantId, id);
    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    return NextResponse.json({ item: rule });
  } catch (error: unknown) {
    console.error('[Guardian G45] Failed to get rule:', error);
    return NextResponse.json({ error: 'Unable to fetch Guardian rule.' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, EDIT_ROLES as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();
    const { id } = await context.params;

    const body = await req.json().catch(() => ({}));
    const rule = await upsertGuardianRule(tenantId, { ...body, id });
    return NextResponse.json({ item: rule });
  } catch (error: unknown) {
    console.error('[Guardian G45] Failed to update rule:', error);
    return NextResponse.json({ error: 'Unable to update Guardian rule.' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, EDIT_ROLES as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();
    const { id } = await context.params;

    await deleteGuardianRule(tenantId, id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('[Guardian G45] Failed to delete rule:', error);
    return NextResponse.json({ error: 'Unable to delete Guardian rule.' }, { status: 400 });
  }
}
