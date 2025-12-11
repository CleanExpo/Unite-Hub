import { NextResponse } from 'next/server';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import {
  getGuardianAlertSchedule,
  upsertGuardianAlertSchedule,
} from '@/lib/guardian/alertSchedulerService';

/**
 * Guardian Alert Schedule Configuration API (G37)
 * GET: Fetch current schedule configuration (admin only)
 * POST: Create or update schedule configuration (admin only)
 */

const ADMIN_ONLY = ['guardian_admin'];

export async function GET() {
  try {
    // Enforce admin-only access
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, ADMIN_ONLY as unknown as string[]);

    const { tenantId } = await getGuardianTenantContext();

    // Fetch schedule configuration
    const schedule = await getGuardianAlertSchedule(tenantId);

    // If no schedule exists, return default configuration
    if (!schedule) {
      return NextResponse.json({
        schedule: null,
        defaults: {
          interval_minutes: 5,
          debounce_minutes: 10,
        },
      });
    }

    return NextResponse.json({ schedule });
  } catch (error: unknown) {
    const message = String(error);
    const code = message.includes('FORBIDDEN')
      ? 403
      : message.includes('UNAUTHENTICATED')
      ? 401
      : 500;

    console.error('[Guardian G37] Failed to fetch alert schedule:', error);
    return NextResponse.json(
      { error: 'Unable to fetch alert schedule.' },
      { status: code }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Enforce admin-only access
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, ADMIN_ONLY as unknown as string[]);

    const { tenantId } = await getGuardianTenantContext();

    // Parse request body
    const body = await req.json().catch(() => ({}));

    const intervalMinutes = Number(body.intervalMinutes ?? body.interval_minutes ?? 5);
    const debounceMinutes = Number(body.debounceMinutes ?? body.debounce_minutes ?? 10);

    // Validate inputs
    if (intervalMinutes < 1 || intervalMinutes > 1440) {
      return NextResponse.json(
        { error: 'interval_minutes must be between 1 and 1440' },
        { status: 400 }
      );
    }
    if (debounceMinutes < 1 || debounceMinutes > 1440) {
      return NextResponse.json(
        { error: 'debounce_minutes must be between 1 and 1440' },
        { status: 400 }
      );
    }

    // Upsert schedule configuration
    const schedule = await upsertGuardianAlertSchedule({
      tenantId,
      intervalMinutes,
      debounceMinutes,
    });

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error: unknown) {
    const message = String(error);
    const code = message.includes('FORBIDDEN')
      ? 403
      : message.includes('UNAUTHENTICATED')
      ? 401
      : message.includes('must be between')
      ? 400
      : 500;

    console.error('[Guardian G37] Failed to update alert schedule:', error);
    return NextResponse.json(
      { error: 'Unable to update alert schedule.' },
      { status: code }
    );
  }
}
