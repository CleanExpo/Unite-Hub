// ASRS API - Safety & Risk Evaluation
import { NextRequest, NextResponse } from 'next/server';
import { asrsEngine } from '@/lib/services/engines';
import { validateUserAndWorkspace } from '@/lib/workspace-validation';

export async function POST(req: NextRequest) {
  try {
    const { action, context, tenantId } = await req.json();

    if (!action || !tenantId) {
      return NextResponse.json({ error: 'Missing action or tenantId' }, { status: 400 });
    }

    // Validate auth and workspace access (tenantId = workspaceId)
    await validateUserAndWorkspace(req, tenantId);

    const result = await asrsEngine.evaluateRisk(tenantId, action, context || {});

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    console.error('ASRS API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    // Validate auth and workspace access
    await validateUserAndWorkspace(req, tenantId);

    const blockLog = await asrsEngine.getBlockLog(tenantId);

    return NextResponse.json({ blockLog });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    console.error('ASRS API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
