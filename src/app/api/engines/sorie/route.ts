import { NextRequest, NextResponse } from 'next/server';
import { sorieEngine } from '@/lib/services/engines';

export async function POST(req: NextRequest) {
  try {
    const { action, tenantId, objectiveId, title, description, targetDate, priority } = await req.json();

    switch (action) {
      case 'create':
        const objective = await sorieEngine.createObjective(tenantId, title, description, targetDate, priority);
        return NextResponse.json({ success: true, objective });

      case 'list':
        const objectives = await sorieEngine.getObjectives(tenantId);
        return NextResponse.json({ success: true, objectives });

      case 'roadmap':
        const roadmap = await sorieEngine.generateRoadmap(tenantId);
        return NextResponse.json({ success: true, roadmap });

      case 'progress':
        const progress = await sorieEngine.trackProgress(objectiveId);
        return NextResponse.json({ success: true, progress });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[SORIE API] Error:', error);
    return NextResponse.json({ error: 'Engine failed' }, { status: 500 });
  }
}
