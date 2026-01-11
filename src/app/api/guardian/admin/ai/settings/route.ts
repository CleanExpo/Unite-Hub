import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { getGuardianAiSettings } from '@/lib/guardian/ai/aiConfig';
import { createClient } from '@/lib/supabase/server';

/**
 * Guardian AI Settings Admin API (H05)
 * GET: Fetch AI settings (admin only)
 * PATCH: Update AI settings (admin only)
 */

const ADMIN_ONLY = ['guardian_admin'];

export async function GET() {
  try {
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, ADMIN_ONLY as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    const settings = await getGuardianAiSettings(tenantId);

    return NextResponse.json({ settings });
  } catch (error: unknown) {
    const message = String(error);
    const code = message.includes('FORBIDDEN') ? 403 : 401;
    return NextResponse.json({ error: 'Access denied.' }, { status: code });
  }
}

export async function PATCH(req: Request) {
  try {
    const { role, userId } = await getGuardianAccessContext();
    assertGuardianRole(role, ADMIN_ONLY as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    const body = await req.json().catch(() => ({}));

    // Build update payload (only include provided fields)
    const updates: any = {
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    };

    if (typeof body.ai_enabled === 'boolean') {
      updates.ai_enabled = body.ai_enabled;
    }
    if (typeof body.rule_assistant_enabled === 'boolean') {
      updates.rule_assistant_enabled = body.rule_assistant_enabled;
    }
    if (typeof body.anomaly_detection_enabled === 'boolean') {
      updates.anomaly_detection_enabled = body.anomaly_detection_enabled;
    }
    if (typeof body.correlation_refinement_enabled === 'boolean') {
      updates.correlation_refinement_enabled = body.correlation_refinement_enabled;
    }
    if (typeof body.predictive_scoring_enabled === 'boolean') {
      updates.predictive_scoring_enabled = body.predictive_scoring_enabled;
    }
    if (typeof body.max_daily_ai_calls === 'number') {
      if (body.max_daily_ai_calls < 0 || body.max_daily_ai_calls > 10000) {
        return NextResponse.json(
          { error: 'max_daily_ai_calls must be between 0 and 10000' },
          { status: 400 }
        );
      }
      updates.max_daily_ai_calls = body.max_daily_ai_calls;
    }
    if (typeof body.soft_token_limit === 'number') {
      if (body.soft_token_limit < 0 || body.soft_token_limit > 10000000) {
        return NextResponse.json(
          { error: 'soft_token_limit must be between 0 and 10000000' },
          { status: 400 }
        );
      }
      updates.soft_token_limit = body.soft_token_limit;
    }

    const supabase = await createClient();

    // Upsert settings
    const { data, error } = await supabase
      .from('guardian_ai_settings')
      .upsert(updates, { onConflict: 'tenant_id' })
      .select('*')
      .single();

    if (error) {
      console.error('[Guardian H05] Failed to update AI settings:', error);
      throw error;
    }

    console.log('[Guardian H05] AI settings updated:', { tenantId, userId });

    return NextResponse.json({ settings: data });
  } catch (error: unknown) {
    const message = String(error);
    const code = message.includes('FORBIDDEN') ? 403 : message.includes('between') ? 400 : 500;
    return NextResponse.json(
      { error: 'Unable to update AI settings.', details: message.slice(0, 200) },
      { status: code }
    );
  }
}
