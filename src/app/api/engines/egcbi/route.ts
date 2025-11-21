import { NextRequest, NextResponse } from 'next/server';
import { egcbiEngine } from '@/lib/services/engines';

export async function POST(req: NextRequest) {
  try {
    const { action, tenantId, domain, reportType, period, policyName, policyType, requirements } = await req.json();

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
    console.error('[EGCBI API] Error:', error);
    return NextResponse.json({ error: 'Engine failed' }, { status: 500 });
  }
}
