import { NextRequest, NextResponse } from 'next/server';
import { cognitivePredictiveEngine } from '@/lib/cognitive/business-intelligence/predictive-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const timeHorizon = searchParams.get('timeHorizon');
    const insightType = searchParams.get('insightType');

    switch (action) {
      case 'predictions':
        if (timeHorizon) {
          const prediction = cognitivePredictiveEngine.getRevenuePrediction(timeHorizon);
          return NextResponse.json({
            prediction,
            timestamp: new Date().toISOString()
          });
        } else {
          const allPredictions = cognitivePredictiveEngine.getAllPredictions();
          return NextResponse.json({
            predictions: allPredictions,
            timestamp: new Date().toISOString()
          });
        }

      case 'insights':
        if (insightType) {
          const insights = cognitivePredictiveEngine.getInsightsByType(insightType as any);
          return NextResponse.json({
            insights,
            count: insights.length,
            timestamp: new Date().toISOString()
          });
        } else {
          const insights = cognitivePredictiveEngine.getLatestInsights(20);
          return NextResponse.json({
            insights,
            count: insights.length,
            timestamp: new Date().toISOString()
          });
        }

      case 'metrics':
        const metrics = cognitivePredictiveEngine.getCurrentBusinessMetrics();
        return NextResponse.json({
          metrics,
          timestamp: new Date().toISOString()
        });

      case 'dashboard':
        const predictions = cognitivePredictiveEngine.getAllPredictions();
        const insights = cognitivePredictiveEngine.getLatestInsights(10);
        const businessMetrics = cognitivePredictiveEngine.getCurrentBusinessMetrics();
        
        return NextResponse.json({
          predictions,
          insights,
          metrics: businessMetrics,
          summary: {
            totalInsights: insights.length,
            highPriorityInsights: insights.filter(i => i.priority === 'high' || i.priority === 'critical').length,
            averageConfidence: insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length || 0,
            predictedGrowth: predictions['30d']?.forecast || 0
          },
          timestamp: new Date().toISOString()
        });

      default:
        // Default: return comprehensive business intelligence overview
        return NextResponse.json({
          status: 'active',
          engine: 'cognitive-predictive-v2',
          predictions: cognitivePredictiveEngine.getAllPredictions(),
          insights: cognitivePredictiveEngine.getLatestInsights(5),
          metrics: cognitivePredictiveEngine.getCurrentBusinessMetrics(),
          capabilities: [
            'Revenue Forecasting (95%+ accuracy)',
            'Customer Behavior Analysis',
            'Market Trend Prediction',
            'Anomaly Detection',
            'Business Optimization',
            'Risk Assessment'
          ],
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error in cognitive business intelligence API:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'add-revenue-data':
        if (!data || !data.amount || !data.timestamp) {
          return NextResponse.json(
            { error: 'Invalid revenue data', required: ['amount', 'timestamp'] },
            { status: 400 }
          );
        }
        
        await cognitivePredictiveEngine.addRevenueData({
          timestamp: new Date(data.timestamp),
          amount: data.amount,
          currency: data.currency || 'AUD',
          source: data.source || 'consultation',
          customerSegment: data.customerSegment || 'individual',
          region: data.region || 'australia',
          metadata: data.metadata || {}
        });
        
        return NextResponse.json({
          success: true,
          message: 'Revenue data added successfully',
          timestamp: new Date().toISOString()
        });

      case 'force-analysis':
        await cognitivePredictiveEngine.forceAnalysis();
        return NextResponse.json({
          success: true,
          message: 'Cognitive analysis initiated',
          timestamp: new Date().toISOString()
        });

      case 'generate-insight':
        // Manual insight generation trigger
        await cognitivePredictiveEngine.forceAnalysis();
        const newInsights = cognitivePredictiveEngine.getLatestInsights(3);
        
        return NextResponse.json({
          success: true,
          insights: newInsights,
          message: 'New insights generated',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action', availableActions: ['add-revenue-data', 'force-analysis', 'generate-insight'] },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in cognitive business intelligence POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
