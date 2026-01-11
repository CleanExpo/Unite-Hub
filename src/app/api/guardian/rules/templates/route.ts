import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { listGuardianRuleTemplates } from '@/lib/guardian/ruleEditorService';

/**
 * Guardian Rule Templates API (G45)
 * GET: List all rule templates (all Guardian roles)
 */

const LIST_ROLES = ['guardian_viewer', 'guardian_analyst', 'guardian_admin'];

export async function GET() {
  try {
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, LIST_ROLES as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    const templates = await listGuardianRuleTemplates(tenantId);
    return NextResponse.json({ items: templates });
  } catch (error: unknown) {
    console.error('[Guardian G45] Failed to list templates:', error);
    return NextResponse.json(
      { error: 'Unable to list Guardian rule templates.' },
      { status: 400 }
    );
  }
}
