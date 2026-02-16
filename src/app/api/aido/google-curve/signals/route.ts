import { NextRequest, NextResponse } from 'next/server';
import { getActiveChangeSignals } from '@/lib/aido/database/change-signals';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data, error } = await supabaseBrowser.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const clientId = req.nextUrl.searchParams.get('clientId');
    const severity = req.nextUrl.searchParams.get('severity');

    const signals = await getActiveChangeSignals(
      workspaceId,
      clientId || undefined,
      severity || undefined
    );

    // Calculate statistics
    const stats = {
      total: signals.length,
      bySeverity: {
        critical: signals.filter(s => s.severity === 'critical').length,
        major: signals.filter(s => s.severity === 'major').length,
        moderate: signals.filter(s => s.severity === 'moderate').length,
        minor: signals.filter(s => s.severity === 'minor').length
      },
      byType: signals.reduce((acc: any, s) => {
        acc[s.signalType] = (acc[s.signalType] || 0) + 1;
        return acc;
      }, {}),
      recentAlerts: signals.filter(s =>
        new Date(s.detectedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
      ).length
    };

    return NextResponse.json({
      success: true,
      signals,
      stats,
      count: signals.length
    });

  } catch (error: unknown) {
    console.error('Get change signals error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
