/**
 * Mesh Overview API
 * Phase 94: Get global mesh insights and aggregates
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import {
  globalMeshOverview,
  getMeshHealth,
  getTopWeightedNodes,
  getStrongestEdges,
  generateFounderInsights,
} from '@/lib/intelligenceMesh';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const includeInsights = req.nextUrl.searchParams.get('includeInsights') === 'true';
    const includeTopNodes = req.nextUrl.searchParams.get('includeTopNodes') === 'true';

    // Get mesh overview
    const [overview, health] = await Promise.all([
      globalMeshOverview(),
      getMeshHealth(),
    ]);

    // Optional: top nodes and edges
    let topNodes = null;
    let strongestEdges = null;

    if (includeTopNodes) {
      [topNodes, strongestEdges] = await Promise.all([
        getTopWeightedNodes(10),
        getStrongestEdges(10),
      ]);
    }

    // Optional: insights
    let insights = null;
    let insightSummary = null;

    if (includeInsights) {
      const result = await generateFounderInsights();
      insights = result.insights;
      insightSummary = result.summary;
    }

    return NextResponse.json({
      success: true,
      overview,
      health,
      topNodes,
      strongestEdges,
      insights,
      insightSummary,
    });
  } catch (error) {
    console.error('Failed to get mesh overview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
