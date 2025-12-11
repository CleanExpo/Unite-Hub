import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { generateOptimizationSuggestions } from '@/lib/guardian/ai/optimizationAssistant';

const ADMIN_ONLY = ['guardian_admin'];

export async function POST(req: Request) {
  try {
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, ADMIN_ONLY as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI not configured.', code: 'AI_NOT_CONFIGURED' }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const suggestions = await generateOptimizationSuggestions({
      tenantId,
      analysisWindowHours: body.analysisWindowHours,
      maxSuggestions: body.maxSuggestions,
    });

    return NextResponse.json({ suggestions, meta: { generatedAt: new Date().toISOString() } });
  } catch (error: unknown) {
    const message = String(error);
    if (message.includes('FEATURE_DISABLED')) {
      return NextResponse.json({ error: 'Optimization disabled.', code: 'FEATURE_DISABLED' }, { status: 403 });
    }
    if (message.includes('QUOTA_EXCEEDED')) {
      return NextResponse.json({ error: 'Quota exceeded.', code: 'QUOTA_EXCEEDED' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Optimization failed.' }, { status: 500 });
  }
}
