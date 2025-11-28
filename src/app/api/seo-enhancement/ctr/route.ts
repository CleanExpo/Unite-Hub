/**
 * CTR Optimization API Route
 * POST - Create test, start test, analyze benchmark
 * GET - Get tests or benchmarks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { ctrOptimizationService } from '@/lib/seoEnhancement';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { action, workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Create A/B test
    if (action === 'createTest') {
      const { url, keyword, variantATitle, variantAMeta, variantBTitle, variantBMeta } = body;

      if (!url || !keyword || !variantATitle || !variantAMeta || !variantBTitle || !variantBMeta) {
        return NextResponse.json(
          { error: 'Missing required fields for test creation' },
          { status: 400 }
        );
      }

      const test = await ctrOptimizationService.createTest({
        workspaceId,
        url,
        keyword,
        variantATitle,
        variantAMeta,
        variantBTitle,
        variantBMeta,
      });

      return NextResponse.json({ test });
    }

    // Start test
    if (action === 'startTest') {
      const { testId } = body;
      if (!testId) {
        return NextResponse.json({ error: 'testId is required' }, { status: 400 });
      }

      const test = await ctrOptimizationService.startTest(testId);
      return NextResponse.json({ test });
    }

    // Complete test
    if (action === 'completeTest') {
      const { testId } = body;
      if (!testId) {
        return NextResponse.json({ error: 'testId is required' }, { status: 400 });
      }

      const test = await ctrOptimizationService.completeTest(testId);
      return NextResponse.json({ test });
    }

    // Analyze CTR benchmark
    if (action === 'analyzeBenchmark') {
      const { url, keyword, currentData } = body;

      if (!url || !keyword || !currentData) {
        return NextResponse.json(
          { error: 'url, keyword, and currentData are required' },
          { status: 400 }
        );
      }

      const benchmark = await ctrOptimizationService.analyzeCTRBenchmark(
        workspaceId,
        url,
        keyword,
        currentData
      );

      return NextResponse.json({ benchmark });
    }

    // Generate title variants
    if (action === 'generateTitles') {
      const { keyword, currentTitle, context } = body;

      if (!keyword || !currentTitle) {
        return NextResponse.json(
          { error: 'keyword and currentTitle are required' },
          { status: 400 }
        );
      }

      const variants = await ctrOptimizationService.generateTitleVariants(
        keyword,
        currentTitle,
        context
      );

      return NextResponse.json({ variants });
    }

    // Generate meta variants
    if (action === 'generateMetas') {
      const { keyword, currentMeta, context } = body;

      if (!keyword || !currentMeta) {
        return NextResponse.json(
          { error: 'keyword and currentMeta are required' },
          { status: 400 }
        );
      }

      const variants = await ctrOptimizationService.generateMetaVariants(
        keyword,
        currentMeta,
        context
      );

      return NextResponse.json({ variants });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[API] CTR POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const type = searchParams.get('type') || 'tests';
    const status = searchParams.get('status');
    const opportunityLevel = searchParams.get('opportunityLevel');
    const url = searchParams.get('url');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    if (type === 'benchmarks') {
      const benchmarks = await ctrOptimizationService.getCTRBenchmarks(workspaceId, {
        opportunityLevel: opportunityLevel || undefined,
        limit,
      });
      return NextResponse.json({ benchmarks });
    }

    const tests = await ctrOptimizationService.getTests(workspaceId, {
      status: status || undefined,
      url: url || undefined,
      limit,
    });

    return NextResponse.json({ tests });
  } catch (error) {
    console.error('[API] CTR GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
