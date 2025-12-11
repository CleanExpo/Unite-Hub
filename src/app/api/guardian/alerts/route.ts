import { NextResponse } from 'next/server';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import {
  listGuardianAlertRules,
  listGuardianAlertEvents,
  createGuardianAlertRule,
  type GuardianAlertSeverity,
  type GuardianAlertSource,
  type GuardianAlertChannel,
} from '@/lib/guardian/alertRulesService';

// Guardian Alerts API (G35)
// GET: list rules + recent events (all Guardian roles)
// POST: create rule (guardian_admin only)

const ALL_ROLES = ['guardian_viewer', 'guardian_analyst', 'guardian_admin'];
const ADMIN_ONLY = ['guardian_admin'];

export async function GET() {
  try {
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, ALL_ROLES as unknown as string[]);

    const { tenantId } = await getGuardianTenantContext();

    const [rules, events] = await Promise.all([
      listGuardianAlertRules(tenantId),
      listGuardianAlertEvents(tenantId, { limit: 100 }),
    ]);

    return NextResponse.json({ rules, events });
  } catch (error: unknown) {
    const message = String(error);
    const code = message.includes('UNAUTHENTICATED')
      ? 401
      : message.includes('FORBIDDEN')
      ? 403
      : 500;

    console.error('Guardian Alerts GET access denied:', error);
    return NextResponse.json(
      { error: 'Guardian alerts unavailable.', code },
      { status: code }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { role, userId } = await getGuardianAccessContext();
    assertGuardianRole(role, ADMIN_ONLY as unknown as string[]);

    const { tenantId } = await getGuardianTenantContext();

    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      description?: string;
      severity?: GuardianAlertSeverity;
      source?: GuardianAlertSource;
      channel?: GuardianAlertChannel;
      condition?: unknown;
    };

    const { name, description, severity, source, channel, condition } = body;

    if (!name || !severity || !source || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields: name, severity, source, channel.' },
        { status: 400 }
      );
    }

    const rule = await createGuardianAlertRule({
      tenantId,
      name,
      description,
      severity,
      source,
      channel,
      condition,
      createdBy: userId,
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error: unknown) {
    const message = String(error);
    const code = message.includes('UNAUTHENTICATED')
      ? 401
      : message.includes('FORBIDDEN')
      ? 403
      : 500;

    console.error('Guardian Alerts POST access denied:', error);
    return NextResponse.json(
      { error: 'Unable to create Guardian alert rule.', code },
      { status: code }
    );
  }
}
