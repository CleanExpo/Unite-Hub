import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getFairnessReports, getBiasFlags, createAuditReport } from '@/lib/crossTenant/fairness';

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

    const auditType = req.nextUrl.searchParams.get('auditType') || undefined;
    const getBias = req.nextUrl.searchParams.get('biasFlags') === 'true';

    if (getBias) {
      const flags = await getBiasFlags();
      return NextResponse.json({
        flags,
        confidence: 0.8,
        uncertaintyNotes: 'Bias flags based on detected patterns'
      });
    }

    const reports = await getFairnessReports(auditType);
    return NextResponse.json({
      reports,
      confidence: 0.85,
      uncertaintyNotes: 'Fairness audits based on available aggregated data'
    });
  } catch (error) {
    console.error('Fairness API error:', error);
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

    const { auditType, auditScope, findings } = await req.json();

    const report = await createAuditReport(auditType, auditScope, findings);

    return NextResponse.json({
      report,
      confidence: 0.75,
      uncertaintyNotes: 'Fairness analysis based on available aggregated data'
    });
  } catch (error) {
    console.error('Create audit report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
