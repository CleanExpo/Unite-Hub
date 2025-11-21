// TCPQEL API - Plans, Quotas & Licensing
import { NextRequest, NextResponse } from 'next/server';
import { tcpqelEngine } from '@/lib/services/engines';
import { validateUserAndWorkspace } from '@/lib/workspace-validation';

export async function POST(req: NextRequest) {
  try {
    const { action, tenantId, ...params } = await req.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    await validateUserAndWorkspace(req, tenantId);

    switch (action) {
      case 'checkQuota':
        const quota = await tcpqelEngine.checkQuota(tenantId, params.engine, params.amount);
        return NextResponse.json(quota);

      case 'allocatePlan':
        await tcpqelEngine.allocatePlan(tenantId, params.planId);
        return NextResponse.json({ success: true });

      case 'chargeUsage':
        await tcpqelEngine.chargeUsage(tenantId, params.engine, params.amount);
        return NextResponse.json({ success: true });

      case 'checkLicense':
        const licensed = await tcpqelEngine.isEngineLicensed(tenantId, params.engineName);
        return NextResponse.json({ licensed });

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
    console.error('TCPQEL API error:', error);
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

    const stats = await tcpqelEngine.getUsageStats(tenantId);

    return NextResponse.json(stats);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    console.error('TCPQEL API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
