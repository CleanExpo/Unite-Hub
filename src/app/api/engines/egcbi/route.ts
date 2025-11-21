import { NextRequest, NextResponse } from 'next/server';
import { egcbiEngine } from '@/lib/services/engines';
import { validateUserAndWorkspace } from '@/lib/workspace-validation';

export async function POST(req: NextRequest) {
  try {
    const { action, tenantId, domain, reportType, period, policyName, policyType, requirements } = await req.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    await validateUserAndWorkspace(req, tenantId);

    switch (action) {
      case 'compliance':
        const compliance = await egcbiEngine.checkCompliance(tenantId, domain);
        return NextResponse.json({ success: true, compliance });

      case 'policies':
        const policies = await egcbiEngine.getPolicies(tenantId, policyType);
        return NextResponse.json({ success: true, policies });

      case 'create_policy':
        const policy = await egcbiEngine.createPolicy(tenantId, policyName, policyType, requirements);
        return NextResponse.json({ success: true, policy });

      case 'board_report':
        const report = await egcbiEngine.generateBoardReport(tenantId, reportType, period);
        return NextResponse.json({ success: true, report });

      case 'audit':
        const audit = await egcbiEngine.runAudit(tenantId, domain);
        return NextResponse.json({ success: true, audit });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    console.error('[EGCBI API] Error:', error);
    return NextResponse.json({ error: 'Engine failed' }, { status: 500 });
  }
}
