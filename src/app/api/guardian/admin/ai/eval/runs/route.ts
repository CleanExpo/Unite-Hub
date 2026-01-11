import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { createClient } from '@/lib/supabase/server';

/**
 * Guardian AI Evaluation Runs API (H06)
 * GET /api/guardian/admin/ai/eval/runs
 *
 * Returns evaluation run history.
 * Access: guardian_admin only
 */

const ADMIN_ONLY = ['guardian_admin'];

export async function GET(req: Request) {
  try {
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, ADMIN_ONLY as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    const url = new URL(req.url);
    const feature = url.searchParams.get('feature') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const limit = Number(url.searchParams.get('limit') || '100');

    const supabase = await createClient();

    let query = supabase
      .from('guardian_ai_eval_runs')
      .select('*')
      .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
      .order('started_at', { ascending: false })
      .limit(Math.min(limit, 500));

    if (feature) {
      query = query.eq('feature', feature);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ runs: data ?? [] });
  } catch (error: unknown) {
    console.error('[Guardian H06] Failed to fetch eval runs:', error);
    return NextResponse.json({ error: 'Unable to fetch evaluation runs.' }, { status: 500 });
  }
}
