import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getActiveCharter, getCharterVersions, checkCompliance, getTenantComplianceStatus } from '@/lib/governance/charter';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = req.nextUrl.searchParams.get('tenantId');
    const getVersions = req.nextUrl.searchParams.get('versions') === 'true';

    if (tenantId) {
      const status = await getTenantComplianceStatus(tenantId);
      return NextResponse.json({
        complianceStatus: status,
        confidence: 0.9,
        uncertaintyNotes: 'Compliance checks based on active charter version'
      });
    }

    if (getVersions) {
      const versions = await getCharterVersions();
      return NextResponse.json({
        versions,
        confidence: 0.95,
        uncertaintyNotes: 'Charter versions with full audit trail'
      });
    }

    const charter = await getActiveCharter();
    return NextResponse.json({
      charter,
      confidence: 0.95,
      uncertaintyNotes: 'Active governance charter. Only humans may modify.'
    });
  } catch (error) {
    console.error('Charter API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, agentName } = await req.json();

    const result = await checkCompliance(tenantId, agentName);

    return NextResponse.json({
      result,
      confidence: 0.85,
      uncertaintyNotes: 'Compliance check against active charter'
    });
  } catch (error) {
    console.error('Compliance check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
