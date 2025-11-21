import { NextRequest, NextResponse } from 'next/server';
import { aireEngine } from '@/lib/services/engines';

export async function POST(req: NextRequest) {
  try {
    const { action, tenantId, incidentId, incidentType, severity, description } = await req.json();

    switch (action) {
      case 'create':
        const incident = await aireEngine.createIncident(tenantId, incidentType, severity, description);
        return NextResponse.json({ success: true, incident });

      case 'resolve':
        const resolved = await aireEngine.resolveIncident(incidentId, 'Resolved via API');
        return NextResponse.json({ success: true, resolved });

      case 'list':
        const incidents = await aireEngine.getActiveIncidents(tenantId);
        return NextResponse.json({ success: true, incidents });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[AIRE API] Error:', error);
    return NextResponse.json({ error: 'Engine failed' }, { status: 500 });
  }
}
