import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { listGuardianRules, upsertGuardianRule } from '@/lib/guardian/ruleEditorService';

/**
 * Guardian Rules API (G45)
 * GET: List all rules (all Guardian roles)
 * POST: Create new rule (admin only)
 */

const LIST_ROLES = ['guardian_viewer', 'guardian_analyst', 'guardian_admin'];
const EDIT_ROLES = ['guardian_admin'];

export async function GET() {
  try {
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, LIST_ROLES as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    const rules = await listGuardianRules(tenantId);
    return NextResponse.json({ items: rules });
  } catch (error: unknown) {
    const message = String(error);
    const code = message.includes('FORBIDDEN')
      ? 403
      : message.includes('UNAUTHENTICATED')
      ? 401
      : 500;
    return NextResponse.json({ error: 'Unable to list Guardian rules.', code }, { status: code });
  }
}

export async function POST(req: Request) {
  try {
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, EDIT_ROLES as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    const body = await req.json().catch(() => ({}));
    const rule = await upsertGuardianRule(tenantId, body);
    return NextResponse.json({ item: rule }, { status: 201 });
  } catch (error: unknown) {
    console.error('[Guardian G45] Failed to create rule:', error);
    return NextResponse.json({ error: 'Unable to create Guardian rule.' }, { status: 400 });
  }
}
