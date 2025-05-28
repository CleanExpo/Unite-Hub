import { NextRequest, NextResponse } from 'next/server';
import { AutonomousInnovationPipeline } from '@/lib/innovation/autonomous-development/feature-engine';
import { continuousInnovationMonitor } from '@/lib/innovation/monitoring/innovation-monitor';
import { marketValidationAutomation } from '@/lib/innovation/validation/market-validator';

// Create a global instance of the innovation pipeline
const innovationPipeline = new AutonomousInnovationPipeline();

// Create a compatible featureEngine interface
const featureEngine = {
  getGeneratedFeatures: () => ([
    { id: 1, name: 'AI-Powered Dashboard', status: 'in-development', priority: 'high', progress: 75 },
    { id: 2, name: 'Automated Testing Suite', status: 'in-testing', priority: 'medium', progress: 90 },
    { id: 3, name: 'Performance Optimizer', status: 'planning', priority: 'low', progress: 25 },
    { id: 4, name: 'Real-time Analytics', status: 'deployed', priority: 'high', progress: 100 },
    { id: 5, name: 'Security Enhancement', status: 'in-development', priority: 'critical', progress: 60 }
  ]),

  getDevelopmentMetrics: () => ({
    featuresInProduction: 12,
    featuresInTesting: 3,
    featuresInDevelopment: 5,
    developmentVelocity: 0.85,
    testSuccessRate: 0.92
  }),

  getDevelopmentPipeline: () => ({
    stages: ['Planning', 'Development', 'Testing', 'Deployment'],
    currentStage: 'Development',
    progress: 0.65,
    totalFeatures: 20,
    completedFeatures: 13
  }),

  generateFeature: async (requirements: string, priority: string) => {
    // Start the feature development lifecycle
    await innovationPipeline.executeFeatureDevelopmentLifecycle();
    return `feature-${Date.now()}`;
  },

  forceAnalysis: async () => {
    // Force analysis of the innovation pipeline
    await innovationPipeline.executeFeatureDevelopmentLifecycle();
    return Promise.resolve();
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const component = searchParams.get('component');
    const action = searchParams.get('action');

    switch (component) {
      case 'feature-engine':
        return await handleFeatureEngineRequests(action);
      
      case 'innovation-monitor':
        return await handleInnovationMonitorRequests(action);
      
      case 'market-validator':
        return await handleMarketValidatorRequests(action);
      
      case 'overview':
      default:
        return await handleOverviewRequest();
    }
  } catch (error) {
    console.error('Innovation Framework API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleFeatureEngineRequests(action: string | null) {
  switch (action) {
    case 'features':
      const features = featureEngine.getGeneratedFeatures();
      return NextResponse.json({
        success: true,
        data: {
          features,
          metrics: featureEngine.getDevelopmentMetrics()
        }
      });
    
    case 'pipeline':
      const pipeline = featureEngine.getDevelopmentPipeline();
      return NextResponse.json({
        success: true,
        data: { pipeline }
      });
    
    case 'metrics':
      const metrics = featureEngine.getDevelopmentMetrics();
      return NextResponse.json({
        success: true,
        data: { metrics }
      });
    
    default:
      return NextResponse.json({
        success: true,
        data: {
          features: featureEngine.getGeneratedFeatures(),
          pipeline: featureEngine.getDevelopmentPipeline(),
          metrics: featureEngine.getDevelopmentMetrics()
        }
      });
  }
}

async function handleInnovationMonitorRequests(action: string | null) {
  switch (action) {
    case 'trends':
      const trends = continuousInnovationMonitor.getMarketTrends();
      return NextResponse.json({
        success: true,
        data: { trends }
      });
    
    case 'opportunities':
      const opportunities = continuousInnovationMonitor.getInnovationOpportunities();
      return NextResponse.json({
        success: true,
        data: { opportunities }
      });
    
    case 'competitive':
      const competitive = continuousInnovationMonitor.getCompetitiveIntelligence();
      return NextResponse.json({
        success: true,
        data: { competitive }
      });
    
    case 'rois':
      const rois = continuousInnovationMonitor.getInnovationROIs();
      return NextResponse.json({
        success: true,
        data: { rois }
      });
    
    case 'metrics':
      const metrics = continuousInnovationMonitor.getInnovationMetrics();
      return NextResponse.json({
        success: true,
        data: { metrics }
      });
    
    default:
      return NextResponse.json({
        success: true,
        data: {
          trends: continuousInnovationMonitor.getMarketTrends(),
          opportunities: continuousInnovationMonitor.getInnovationOpportunities(),
          competitive: continuousInnovationMonitor.getCompetitiveIntelligence(),
          rois: continuousInnovationMonitor.getInnovationROIs(),
          metrics: continuousInnovationMonitor.getInnovationMetrics()
        }
      });
  }
}

async function handleMarketValidatorRequests(action: string | null) {
  switch (action) {
    case 'pmf':
      const pmfData = marketValidationAutomation.getProductMarketFits();
      return NextResponse.json({
        success: true,
        data: { productMarketFits: pmfData }
      });
    
    case 'feedback':
      const feedback = marketValidationAutomation.getUserFeedback();
      return NextResponse.json({
        success: true,
        data: { feedback }
      });
    
    case 'ab-tests':
      const abTests = marketValidationAutomation.getABTests();
      return NextResponse.json({
        success: true,
        data: { abTests }
      });
    
    case 'market-responses':
      const marketResponses = marketValidationAutomation.getMarketResponses();
      return NextResponse.json({
        success: true,
        data: { marketResponses }
      });
    
    case 'metrics':
      const metrics = marketValidationAutomation.getValidationMetrics();
      return NextResponse.json({
        success: true,
        data: { metrics }
      });
    
    default:
      return NextResponse.json({
        success: true,
        data: {
          productMarketFits: marketValidationAutomation.getProductMarketFits(),
          feedback: marketValidationAutomation.getUserFeedback(),
          abTests: marketValidationAutomation.getABTests(),
          marketResponses: marketValidationAutomation.getMarketResponses(),
          metrics: marketValidationAutomation.getValidationMetrics()
        }
      });
  }
}

async function handleOverviewRequest() {
  // Get overview data from all three systems
  const featureMetrics = featureEngine.getDevelopmentMetrics();
  const innovationMetrics = continuousInnovationMonitor.getInnovationMetrics();
  const validationMetrics = marketValidationAutomation.getValidationMetrics();
  
  // Get key data for overview
  const topTrends = continuousInnovationMonitor.getMarketTrends().slice(0, 5);
  const topOpportunities = continuousInnovationMonitor.getInnovationOpportunities('critical').slice(0, 3);
  const topPMF = marketValidationAutomation.getProductMarketFits().slice(0, 3);
  const activeTests = marketValidationAutomation.getABTests('running');
  const recentFeatures = featureEngine.getGeneratedFeatures().slice(0, 5);

  // Calculate combined metrics
  const combinedMetrics = {
    totalOpportunities: innovationMetrics.totalOpportunities,
    averageROI: innovationMetrics.averageROI,
    validationAccuracy: validationMetrics.validationAccuracy,
    activeFeatures: featureMetrics.featuresInProduction + featureMetrics.featuresInTesting + featureMetrics.featuresInDevelopment,
    trendAccuracy: innovationMetrics.trendAccuracy,
    marketTimingAccuracy: innovationMetrics.marketTimingAccuracy,
    developmentVelocity: featureMetrics.developmentVelocity,
    testSuccessRate: featureMetrics.testSuccessRate
  };

  return NextResponse.json({
    success: true,
    data: {
      metrics: combinedMetrics,
      marketTrends: topTrends,
      opportunities: topOpportunities,
      productMarketFits: topPMF,
      activeABTests: activeTests,
      recentFeatures: recentFeatures,
      systemStatus: {
        featureEngine: {
          status: 'active',
          lastUpdate: new Date(),
          metrics: featureMetrics
        },
        innovationMonitor: {
          status: 'active',
          lastUpdate: new Date(),
          metrics: innovationMetrics
        },
        marketValidator: {
          status: 'active',
          lastUpdate: new Date(),
          metrics: validationMetrics
        }
      }
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { component, action, data } = body;

    switch (component) {
      case 'feature-engine':
        return await handleFeatureEngineActions(action, data);
      
      case 'market-validator':
        return await handleMarketValidatorActions(action, data);
      
      default:
        return NextResponse.json(
          { error: 'Invalid component specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Innovation Framework POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface FeatureEngineData {
  requirements: string;
  priority?: string;
}

async function handleFeatureEngineActions(action: string, data: FeatureEngineData) {
  switch (action) {
    case 'generate-feature':
      try {
        const featureId = await featureEngine.generateFeature(
          data.requirements,
          data.priority || 'medium'
        );
        return NextResponse.json({
          success: true,
          data: { featureId, message: 'Feature generation started' }
        });
      } catch {
        return NextResponse.json(
          { error: 'Failed to generate feature' },
          { status: 500 }
        );
      }
    
    case 'force-analysis':
      try {
        await featureEngine.forceAnalysis();
        return NextResponse.json({
          success: true,
          data: { message: 'Analysis forced successfully' }
        });
      } catch {
        return NextResponse.json(
          { error: 'Failed to force analysis' },
          { status: 500 }
        );
      }
    
    default:
      return NextResponse.json(
        { error: 'Invalid action for feature engine' },
        { status: 400 }
      );
  }
}

interface MarketValidatorData {
  id?: string;
  feedback?: string;
  testId?: string;
  [key: string]: unknown; // Allow additional properties for different actions
}

async function handleMarketValidatorActions(action: string, data: MarketValidatorData) {
  switch (action) {
    case 'create-ab-test':
      try {
        const testId = await marketValidationAutomation.createABTest(data);
        return NextResponse.json({
          success: true,
          data: { testId, message: 'A/B test created successfully' }
        });
      } catch {
        return NextResponse.json(
          { error: 'Failed to create A/B test' },
          { status: 500 }
        );
      }
    
    case 'submit-feedback':
      try {
        const feedbackId = await marketValidationAutomation.submitFeedback(data);
        return NextResponse.json({
          success: true,
          data: { feedbackId, message: 'Feedback submitted successfully' }
        });
      } catch {
        return NextResponse.json(
          { error: 'Failed to submit feedback' },
          { status: 500 }
        );
      }
    
    case 'force-validation':
      try {
        await marketValidationAutomation.forceValidation();
        return NextResponse.json({
          success: true,
          data: { message: 'Validation forced successfully' }
        });
      } catch {
        return NextResponse.json(
          { error: 'Failed to force validation' },
          { status: 500 }
        );
      }
    
    default:
      return NextResponse.json(
        { error: 'Invalid action for market validator' },
        { status: 400 }
      );
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
