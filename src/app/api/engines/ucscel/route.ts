// UCSCEL API - Compliance & Contract Enforcement
import { NextRequest, NextResponse } from 'next/server';
import { ucscelEngine } from '@/lib/services/engines';
import { validateUserAndWorkspace } from '@/lib/workspace-validation';

export async function POST(req: NextRequest) {
  try {
    const { action, tenantId, ...params } = await req.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    await validateUserAndWorkspace(req, tenantId);

    switch (action) {
      case 'checkCompliance':
        const compliance = await ucscelEngine.checkContractCompliance(tenantId, params.action);
        return NextResponse.json(compliance);

      case 'checkSLA':
        const sla = await ucscelEngine.checkSLAAdherence(tenantId, params.metric, params.value);
        return NextResponse.json(sla);

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
    console.error('UCSCEL API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    await validateUserAndWorkspace(req, tenantId);

    const type = req.nextUrl.searchParams.get('type') || 'contract';

    if (type === 'history') {
      const history = await ucscelEngine.getEnforcementHistory(tenantId);
      return NextResponse.json({ history });
    }

    const contract = await ucscelEngine.getActiveContract(tenantId);
    return NextResponse.json({ contract });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    console.error('UCSCEL API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
