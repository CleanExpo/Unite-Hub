import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getBenchmarkBands, getTenantBenchmarks } from '@/lib/crossTenant/benchmarks';

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
    const metricName = req.nextUrl.searchParams.get('metricName');

    if (tenantId) {
      const report = await getTenantBenchmarks(tenantId);
      return NextResponse.json({
        report,
        confidence: 0.8,
        uncertaintyNotes: 'Benchmarks show percentile bands only. No absolute numbers exposed.'
      });
    }

    if (!metricName) {
      return NextResponse.json({ error: 'metricName query parameter is required' }, { status: 400 });
    }

    const bands = await getBenchmarkBands(metricName);
    return NextResponse.json({
      bands,
      confidence: 0.85,
      uncertaintyNotes: 'Percentile bands calculated from cohort data. Disabled when cohort too small.'
    });
  } catch (error) {
    console.error('Benchmark API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
