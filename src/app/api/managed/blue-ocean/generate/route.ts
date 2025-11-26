/**
 * POST /api/managed/blue-ocean/generate
 *
 * Generate comprehensive Blue Ocean Strategy for SaaS clients
 * Creates uncontested market space through category creation and narrative control
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import {
  generateBlueOceanStrategy,
  saveBlueOceanStrategy,
  BlueOceanInput,
  BlueOceanStrategy
} from '@/lib/managed/BlueOceanStrategyEngine';

const logger = createApiLogger({ route: '/api/managed/blue-ocean/generate' });

interface BlueOceanRequest {
  projectId: string;
  businessName: string;
  industry: string;
  targetAudience: string;
  currentChallenges: string[];
  existingCompetitors: string[];
  desiredOutcome: string;
  budgetRange?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body: BlueOceanRequest = await req.json();
    const {
      projectId,
      businessName,
      industry,
      targetAudience,
      currentChallenges,
      existingCompetitors,
      desiredOutcome,
      budgetRange
    } = body;

    // Validate required fields
    if (!projectId || !businessName || !industry || !targetAudience ||
        !currentChallenges || !existingCompetitors || !desiredOutcome) {
      return NextResponse.json(
        {
          error: 'Missing required fields: projectId, businessName, industry, targetAudience, currentChallenges, existingCompetitors, desiredOutcome'
        },
        { status: 400 }
      );
    }

    // Validate array fields
    if (!Array.isArray(currentChallenges) || currentChallenges.length === 0) {
      return NextResponse.json(
        { error: 'currentChallenges must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!Array.isArray(existingCompetitors) || existingCompetitors.length === 0) {
      return NextResponse.json(
        { error: 'existingCompetitors must be a non-empty array' },
        { status: 400 }
      );
    }

    logger.info('🌊 Starting Blue Ocean Strategy generation', {
      projectId,
      businessName,
      industry,
      targetAudience,
      challenges: currentChallenges.length,
      competitors: existingCompetitors.length,
      userId: user.id,
    });

    // Prepare input for engine
    const input: BlueOceanInput = {
      businessName,
      industry,
      targetAudience,
      currentChallenges,
      existingCompetitors,
      desiredOutcome,
      budgetRange
    };

    // Generate the strategy
    const result = await generateBlueOceanStrategy(input);

    if (!result.success || !result.strategy) {
      logger.error('❌ Blue Ocean strategy generation failed', {
        projectId,
        error: result.error,
      });
      return NextResponse.json(
        { error: result.error || 'Strategy generation failed' },
        { status: 500 }
      );
    }

    // Attach projectId to strategy for database persistence
    const strategyWithProject = {
      ...result.strategy,
      projectId
    };

    // Save strategy to database
    const saveResult = await saveBlueOceanStrategy(strategyWithProject as BlueOceanStrategy);

    if (!saveResult.success) {
      logger.error('❌ Failed to save Blue Ocean strategy', {
        projectId,
        error: saveResult.error,
      });
      return NextResponse.json(
        { error: 'Failed to save strategy' },
        { status: 500 }
      );
    }

    logger.info('✅ Blue Ocean strategy generated and saved', {
      projectId,
      strategyId: saveResult.strategyId,
      categoryName: result.strategy.newCategoryName,
      defensibilityScore: result.strategy.defensibilityScore,
      executionPhases: result.strategy.executionSteps.length,
    });

    return NextResponse.json({
      success: true,
      strategyId: saveResult.strategyId,
      projectId,
      strategy: {
        businessName: result.strategy.businessName,
        industry: result.strategy.industry,
        generatedAt: result.strategy.generatedAt,

        // Blue Ocean Positioning
        blueOceanPositioning: result.strategy.blueOceanPositioning,
        newCategoryName: result.strategy.newCategoryName,
        categoryDescription: result.strategy.categoryDescription,

        // Narrative & Identity
        narrativeFramework: result.strategy.narrativeFramework,
        narrativeStrategy: result.strategy.narrativeStrategy,

        // Competitive Analysis
        redOceanAnalysis: result.strategy.redOceanAnalysis,

        // Strategic Advantages
        strategicAdvantages: result.strategy.strategicAdvantages,
        defensibleDifferences: result.strategy.defensibleDifferences,
        defensibilityScore: result.strategy.defensibilityScore,

        // Execution
        executionSteps: result.strategy.executionSteps,

        // Sub-Agent Routing
        subAgentRouting: result.strategy.subAgentRouting,

        // Visual Identity
        visualIdentityDirection: result.strategy.visualIdentityDirection,

        // Market Opportunity
        marketOpportunitySizeEstimate: result.strategy.marketOpportunitySizeEstimate,

        // Strategy Mutations
        strategyMutations: result.strategy.strategyMutations,

        // Market Shifts
        marketShiftIndicators: result.strategy.marketShiftIndicators,

        // Competitive Forecast
        predictedCompetitiveOutcome: result.strategy.predictedCompetitiveOutcome,
      },
      message: 'Blue Ocean Strategy generated successfully',
    });

  } catch (error) {
    logger.error('❌ Error generating Blue Ocean strategy', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/managed/blue-ocean/generate?projectId=<id>&strategyId=<id>
 * Retrieve saved Blue Ocean strategy
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = req.nextUrl.searchParams.get('projectId');
    const strategyId = req.nextUrl.searchParams.get('strategyId');

    if (!projectId && !strategyId) {
      return NextResponse.json(
        { error: 'Missing projectId or strategyId parameter' },
        { status: 400 }
      );
    }

    logger.info('📋 Fetching Blue Ocean strategy', { projectId, strategyId });

    // Fetch strategy from database
    let query = supabase
      .from('managed_service_strategies')
      .select('*')
      .eq('strategy_type', 'blue_ocean');

    if (strategyId) {
      query = query.eq('id', strategyId);
    } else if (projectId) {
      query = query
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);
    }

    const { data: strategies, error } = await query;

    if (error) {
      logger.error('❌ Failed to fetch Blue Ocean strategy', { error });
      return NextResponse.json(
        { error: 'Failed to fetch strategy' },
        { status: 500 }
      );
    }

    if (!strategies || strategies.length === 0) {
      return NextResponse.json(
        { error: 'Blue Ocean strategy not found' },
        { status: 404 }
      );
    }

    const strategy = strategies[0];

    return NextResponse.json({
      success: true,
      strategy: {
        id: strategy.id,
        projectId: strategy.project_id,
        businessName: strategy.business_name,
        industry: strategy.industry,
        categoryName: strategy.category_name,
        defensibilityScore: strategy.defensibility_score,
        createdAt: strategy.created_at,
        content: strategy.full_strategy,
      },
    });

  } catch (error) {
    logger.error('❌ Error fetching Blue Ocean strategy', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
