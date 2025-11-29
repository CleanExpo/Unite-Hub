import { NextRequest, NextResponse } from "next/server";
import { AbacusAnalyzer } from "@/lib/ai/abacus-analyzer";
import { createClient } from '@/lib/supabase/server';

/**
 * Analyze dashboard requirements using Abacus AI
 * Returns structured plan for making the dashboard fully functional
 * ADMIN ONLY - Exposes system internals
 */
export async function GET(req: NextRequest) {
  // Require admin authentication
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized - authentication required' }, { status: 401 });
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role || 'CLIENT';
  if (!['ADMIN', 'FOUNDER'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 });
  }

  try {
    const analyzer = new AbacusAnalyzer();
    const analysis = await analyzer.analyzeDashboardRequirements();

    // Generate migrations and API stubs
    const migrations = analyzer.generateMigrations(analysis);
    const apiStubs = analyzer.generateAPIStubs(analysis);

    return NextResponse.json({
      success: true,
      analysis,
      migrations,
      apiStubCount: apiStubs.size,
      summary: {
        missingEndpoints: analysis.missingEndpoints.length,
        databaseTables: analysis.databaseTables.length,
        uiConnections: analysis.uiConnections.filter(c => c.status !== 'connected').length,
        priorityActions: analysis.priorityActions.length,
        estimatedTotalEffort: '20-30 hours',
      }
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({
      error: "Analysis failed",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
