import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { generateExplanation } from '@/lib/guardian/ai/explainabilityHub';
import { createClient } from '@/lib/supabase/server';

const ALLOWED = ['guardian_analyst', 'guardian_admin'];

export async function POST(req: Request) {
  try {
    const { role, userId } = await getGuardianAccessContext();
    assertGuardianRole(role, ALLOWED as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Guardian explainability is not configured.', code: 'AI_NOT_CONFIGURED' },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const entityType = body.entityType as string;
    const entityId = body.entityId as string;
    const reuseExisting = body.reuseExisting ?? false;

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId required' }, { status: 400 });
    }

    const validTypes = ['alert', 'incident', 'correlation_cluster', 'anomaly_score', 'predictive_score', 'risk_snapshot'];
    if (!validTypes.includes(entityType)) {
      return NextResponse.json({ error: 'Invalid entityType' }, { status: 400 });
    }

    // Check for existing explanation (last 24h)
    if (reuseExisting) {
      const supabase = await createClient();
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: existing } = await supabase
        .from('guardian_ai_explanations')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ explanation: existing, meta: { cached: true } });
      }
    }

    const result = await generateExplanation({
      tenantId,
      entityType: entityType as any,
      entityId,
      contextWindowHours: body.contextWindowHours,
      createdBy: userId,
    });

    return NextResponse.json({
      explanation: result,
      meta: { cached: false, generatedAt: new Date().toISOString() },
    });
  } catch (error: unknown) {
    const message = String(error);

    if (message.includes('FEATURE_DISABLED')) {
      return NextResponse.json(
        { error: 'Explainability is disabled.', code: 'FEATURE_DISABLED' },
        { status: 403 }
      );
    }

    if (message.includes('QUOTA_EXCEEDED')) {
      return NextResponse.json({ error: 'AI quota exceeded.', code: 'QUOTA_EXCEEDED' }, { status: 429 });
    }

    console.error('[Guardian H09] Explain API failed:', error);
    return NextResponse.json({ error: 'Explanation failed.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, ALLOWED as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    const url = new URL(req.url);
    const entityType = url.searchParams.get('entityType') || undefined;
    const limit = Number(url.searchParams.get('limit') || '50');

    const supabase = await createClient();

    let query = supabase
      .from('guardian_ai_explanations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 200));

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ explanations: data ?? [] });
  } catch (error) {
    console.error('[Guardian H09] List explanations failed:', error);
    return NextResponse.json({ error: 'Unable to fetch explanations.' }, { status: 500 });
  }
}
