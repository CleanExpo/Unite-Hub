import { NextRequest, NextResponse } from 'next/server';
import { upeweEngine } from '@/lib/services/engines';

export async function POST(req: NextRequest) {
  try {
    const { action, tenantId, window } = await req.json();

    switch (action) {
      case 'forecast':
        const forecast = await upeweEngine.generateForecast(tenantId, window || '24h');
        return NextResponse.json({ success: true, forecast });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[UPEWE API] Error:', error);
    return NextResponse.json({ error: 'Engine failed' }, { status: 500 });
  }
}
