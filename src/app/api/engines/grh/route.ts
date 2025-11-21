import { NextRequest, NextResponse } from 'next/server';
import { grhEngine } from '@/lib/services/engines';

export async function POST(req: NextRequest) {
  try {
    const { action, tenantId, region, sourceRegion, targetRegion, regulationName, regulationType, requirements, effectiveDate } = await req.json();

    switch (action) {
      case 'regulations':
        const regulations = await grhEngine.getRegionalRegulations(tenantId, region);
        return NextResponse.json({ success: true, regulations });

      case 'harmonisation':
        const harmonisation = await grhEngine.checkHarmonisation(tenantId, sourceRegion, targetRegion);
        return NextResponse.json({ success: true, harmonisation });

      case 'create':
        const regulation = await grhEngine.createRegulation(tenantId, region, regulationName, regulationType, requirements, effectiveDate);
        return NextResponse.json({ success: true, regulation });

      case 'mapping':
        const mapping = await grhEngine.generatePolicyMapping(tenantId, sourceRegion, targetRegion);
        return NextResponse.json({ success: true, mapping });

      case 'regions':
        const regions = await grhEngine.getActiveRegions(tenantId);
        return NextResponse.json({ success: true, regions });

      case 'compliance':
        const compliance = await grhEngine.checkRegionalCompliance(tenantId, region);
        return NextResponse.json({ success: true, compliance });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[GRH API] Error:', error);
    return NextResponse.json({ error: 'Engine failed' }, { status: 500 });
  }
}
