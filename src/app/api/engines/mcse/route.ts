// MCSE API - Cognitive Validation
import { NextRequest, NextResponse } from 'next/server';
import { mcseEngine } from '@/lib/services/engines';
import { validateUserAndWorkspace } from '@/lib/workspace-validation';

export async function POST(req: NextRequest) {
  try {
    const { tenantId, agentId, reasoning, output } = await req.json();

    if (!tenantId || !agentId || !reasoning || !output) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await validateUserAndWorkspace(req, tenantId);

    const result = await mcseEngine.validateReasoning(tenantId, agentId, reasoning, output);

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
    console.error('MCSE API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
