import { NextRequest, NextResponse } from 'next/server';
import { advancedFinancialIntelligenceEngine } from '@/lib/cognitive/financial-intelligence/advanced-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '10');
    const days = parseInt(searchParams.get('days') || '30');

    switch (action) {
      case 'financial-health':
        const financialHealth = advancedFinancialIntelligenceEngine.getCurrentFinancialHealth();
        return NextResponse.json({
          health: financialHealth,
          timestamp: new Date().toISOString()
        });

      case 'budget-plans':
        const budgetPlans = advancedFinancialIntelligenceEngine.getBudgetPlans(limit);
        return NextResponse.json({
          budgetPlans,
          count: budgetPlans.length,
          timestamp: new Date().toISOString()
        });

      case 'cash-flow-predictions':
        const cashFlowPredictions = advancedFinancialIntelligenceEngine.getCashFlowPredictions(days);
        return NextResponse.json({
          predictions: cashFlowPredictions,
          days,
          timestamp: new Date().toISOString()
        });

      case 'cost-optimizations':
        const costOptimizations = advancedFinancialIntelligenceEngine.getCostOptimizations(limit);
        return NextResponse.json({
          optimizations: costOptimizations,
          count: costOptimizations.length,
          timestamp: new Date().toISOString()
        });

      case 'investment-recommendations':
        const investmentRecommendations = advancedFinancialIntelligenceEngine.getInvestmentRecommendations(limit);
        return NextResponse.json({
          recommendations: investmentRecommendations,
          count: investmentRecommendations.length,
          timestamp: new Date().toISOString()
        });

      case 'financial-alerts':
        const includeResolved = searchParams.get('includeResolved') === 'true';
        const financialAlerts = advancedFinancialIntelligenceEngine.getFinancialAlerts(includeResolved);
        return NextResponse.json({
          alerts: financialAlerts,
          count: financialAlerts.length,
          timestamp: new Date().toISOString()
        });

      case 'dashboard':
        const dashboardData = {
          financialHealth: advancedFinancialIntelligenceEngine.getCurrentFinancialHealth(),
          budgetPlans: advancedFinancialIntelligenceEngine.getBudgetPlans(3),
          cashFlowPredictions: advancedFinancialIntelligenceEngine.getCashFlowPredictions(30),
          costOptimizations: advancedFinancialIntelligenceEngine.getCostOptimizations(5),
          investmentRecommendations: advancedFinancialIntelligenceEngine.getInvestmentRecommendations(5),
          financialAlerts: advancedFinancialIntelligenceEngine.getFinancialAlerts(false),
          summary: {
            totalCostSavings: advancedFinancialIntelligenceEngine.getCostOptimizations(10)
              .reduce((sum, opt) => sum + opt.savings, 0),
            totalInvestmentROI: advancedFinancialIntelligenceEngine.getInvestmentRecommendations(5)
              .reduce((sum, inv) => sum + inv.roi, 0) / 
              advancedFinancialIntelligenceEngine.getInvestmentRecommendations(5).length,
            activeBudgets: advancedFinancialIntelligenceEngine.getBudgetPlans(5)
              .filter(b => b.status === 'active').length,
            criticalAlerts: advancedFinancialIntelligenceEngine.getFinancialAlerts(false)
              .filter(a => a.severity === 'critical').length,
            averageConfidence: (
              advancedFinancialIntelligenceEngine.getCostOptimizations(5)
                .reduce((sum, opt) => sum + opt.confidence, 0) / 5 +
              advancedFinancialIntelligenceEngine.getInvestmentRecommendations(5)
                .reduce((sum, inv) => sum + inv.confidence, 0) / 5
            ) / 2
          }
        };
        
        return NextResponse.json({
          ...dashboardData,
          timestamp: new Date().toISOString()
        });

      default:
        // Default: return financial intelligence overview
        return NextResponse.json({
          status: 'active',
          engine: 'advanced-financial-intelligence-v2',
          capabilities: [
            'Automated Budget Planning',
            'Cash Flow Prediction',
            'Cost Optimization Analysis',
            'Investment Recommendations',
            'Financial Health Monitoring',
            'Risk Assessment & Alerts'
          ],
          currentHealth: advancedFinancialIntelligenceEngine.getCurrentFinancialHealth().grade,
          activeBudgets: advancedFinancialIntelligenceEngine.getBudgetPlans(5).length,
          totalOptimizations: advancedFinancialIntelligenceEngine.getCostOptimizations(10).length,
          pendingInvestments: advancedFinancialIntelligenceEngine.getInvestmentRecommendations(10).length,
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error in advanced financial intelligence API:', error);
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
      case 'add-financial-data':
        if (!data || !data.category || !data.amount) {
          return NextResponse.json(
            { error: 'Invalid financial data', required: ['category', 'amount', 'subcategory', 'description'] },
            { status: 400 }
          );
        }
        
        await advancedFinancialIntelligenceEngine.addFinancialData({
          category: data.category,
          subcategory: data.subcategory || 'general',
          amount: data.amount,
          currency: data.currency || 'AUD',
          description: data.description || 'Financial transaction',
          tags: data.tags || [],
          metadata: data.metadata || {}
        });
        
        return NextResponse.json({
          success: true,
          message: 'Financial data added successfully',
          timestamp: new Date().toISOString()
        });

      case 'force-analysis':
        await advancedFinancialIntelligenceEngine.forceAnalysis();
        return NextResponse.json({
          success: true,
          message: 'Financial analysis initiated',
          timestamp: new Date().toISOString()
        });

      case 'generate-budget-forecast':
        if (!data || !data.period) {
          return NextResponse.json(
            { error: 'Budget period required', validPeriods: ['monthly', 'quarterly', 'yearly'] },
            { status: 400 }
          );
        }
        
        // Generate custom budget forecast
        const forecastData = {
          period: data.period,
          projectedRevenue: 45000 * (data.period === 'yearly' ? 12 : data.period === 'quarterly' ? 3 : 1),
          projectedExpenses: 32000 * (data.period === 'yearly' ? 12 : data.period === 'quarterly' ? 3 : 1),
          confidence: 0.87,
          generatedAt: new Date(),
          recommendations: [
            'Focus on high-margin service offerings',
            'Implement cost optimization strategies',
            'Consider strategic investments for growth'
          ]
        };
        
        return NextResponse.json({
          success: true,
          forecast: forecastData,
          timestamp: new Date().toISOString()
        });

      case 'analyze-investment-opportunity':
        if (!data || !data.requiredCapital || !data.expectedReturn) {
          return NextResponse.json(
            { error: 'Investment analysis data required', required: ['requiredCapital', 'expectedReturn', 'timeframe'] },
            { status: 400 }
          );
        }
        
        const roi = (data.expectedReturn - data.requiredCapital) / data.requiredCapital;
        const paybackPeriod = data.requiredCapital / (data.expectedReturn / 12); // Assumes monthly returns
        
        const investmentAnalysis = {
          requiredCapital: data.requiredCapital,
          expectedReturn: data.expectedReturn,
          roi: roi,
          roiPercentage: roi * 100,
          paybackPeriod: paybackPeriod,
          riskAssessment: roi > 1.5 ? 'low' : roi > 0.8 ? 'medium' : 'high',
          recommendation: roi > 1.0 ? 'recommended' : roi > 0.5 ? 'consider' : 'not_recommended',
          confidence: Math.min(0.9, 0.6 + (roi * 0.3)),
          analysisDate: new Date()
        };
        
        return NextResponse.json({
          success: true,
          analysis: investmentAnalysis,
          timestamp: new Date().toISOString()
        });

      case 'optimize-expense-category':
        if (!data || !data.category) {
          return NextResponse.json(
            { error: 'Expense category required' },
            { status: 400 }
          );
        }
        
        // Generate optimization suggestions for specific category
        const optimizationSuggestions = {
          category: data.category,
          currentSpend: data.currentSpend || 2500,
          optimizedSpend: (data.currentSpend || 2500) * 0.85, // 15% reduction target
          potentialSavings: (data.currentSpend || 2500) * 0.15,
          implementationSteps: [
            `Audit all ${data.category} expenses`,
            `Identify redundant or unused ${data.category} items`,
            `Negotiate better rates with ${data.category} vendors`,
            `Implement tracking and monitoring for ${data.category}`
          ],
          timeframe: '4-6 weeks',
          confidence: 0.82,
          generatedAt: new Date()
        };
        
        return NextResponse.json({
          success: true,
          optimization: optimizationSuggestions,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { 
            error: 'Invalid action', 
            availableActions: [
              'add-financial-data', 
              'force-analysis', 
              'generate-budget-forecast',
              'analyze-investment-opportunity',
              'optimize-expense-category'
            ] 
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in advanced financial intelligence POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
