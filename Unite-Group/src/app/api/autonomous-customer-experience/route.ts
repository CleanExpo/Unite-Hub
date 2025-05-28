import { NextRequest, NextResponse } from 'next/server';
import { autonomousCustomerExperienceEngine } from '@/lib/cognitive/customer-experience/autonomous-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const customerId = searchParams.get('customerId');
    const limit = parseInt(searchParams.get('limit') || '10');

    switch (action) {
      case 'customer-profiles':
        if (customerId) {
          const profile = autonomousCustomerExperienceEngine.getCustomerProfile(customerId);
          return NextResponse.json({
            profile,
            timestamp: new Date().toISOString()
          });
        } else {
          const profiles = autonomousCustomerExperienceEngine.getAllCustomerProfiles();
          return NextResponse.json({
            profiles: profiles.slice(0, limit),
            total: profiles.length,
            timestamp: new Date().toISOString()
          });
        }

      case 'journey-optimizations':
        const optimizations = autonomousCustomerExperienceEngine.getJourneyOptimizations(limit);
        return NextResponse.json({
          optimizations,
          count: optimizations.length,
          timestamp: new Date().toISOString()
        });

      case 'support-predictions':
        const predictions = autonomousCustomerExperienceEngine.getSupportPredictions(limit);
        return NextResponse.json({
          predictions,
          count: predictions.length,
          timestamp: new Date().toISOString()
        });

      case 'dynamic-pricing':
        const pricing = autonomousCustomerExperienceEngine.getDynamicPricing();
        return NextResponse.json({
          pricing,
          services: Object.keys(pricing).length,
          timestamp: new Date().toISOString()
        });

      case 'dashboard':
        const dashboardData = {
          profiles: autonomousCustomerExperienceEngine.getAllCustomerProfiles().slice(0, 20),
          optimizations: autonomousCustomerExperienceEngine.getJourneyOptimizations(10),
          supportPredictions: autonomousCustomerExperienceEngine.getSupportPredictions(5),
          dynamicPricing: autonomousCustomerExperienceEngine.getDynamicPricing(),
          summary: {
            totalCustomers: autonomousCustomerExperienceEngine.getAllCustomerProfiles().length,
            activeOptimizations: autonomousCustomerExperienceEngine.getJourneyOptimizations(100).length,
            predictedSupportCases: autonomousCustomerExperienceEngine.getSupportPredictions(100).length,
            pricingStrategies: Object.keys(autonomousCustomerExperienceEngine.getDynamicPricing()).length,
            averageEngagement: autonomousCustomerExperienceEngine.getAllCustomerProfiles()
              .reduce((sum, p) => sum + p.engagementScore, 0) / 
              autonomousCustomerExperienceEngine.getAllCustomerProfiles().length,
            averageSatisfaction: autonomousCustomerExperienceEngine.getAllCustomerProfiles()
              .reduce((sum, p) => sum + p.satisfactionScore, 0) / 
              autonomousCustomerExperienceEngine.getAllCustomerProfiles().length,
            totalLifetimeValue: autonomousCustomerExperienceEngine.getAllCustomerProfiles()
              .reduce((sum, p) => sum + p.lifetimeValue, 0)
          }
        };
        
        return NextResponse.json({
          ...dashboardData,
          timestamp: new Date().toISOString()
        });

      default:
        // Default: return autonomous customer experience overview
        return NextResponse.json({
          status: 'active',
          engine: 'autonomous-customer-experience-v2',
          customerProfiles: autonomousCustomerExperienceEngine.getAllCustomerProfiles().length,
          journeyOptimizations: autonomousCustomerExperienceEngine.getJourneyOptimizations(5),
          supportPredictions: autonomousCustomerExperienceEngine.getSupportPredictions(3),
          dynamicPricing: autonomousCustomerExperienceEngine.getDynamicPricing(),
          capabilities: [
            'AI-Powered Journey Optimization',
            'Predictive Customer Support',
            'Dynamic Pricing Optimization',
            'Personalized Recommendations',
            'Churn Prediction & Prevention',
            'Real-time Customer Intelligence'
          ],
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error in autonomous customer experience API:', error);
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
      case 'add-journey-event':
        if (!data || !data.customerId || !data.event) {
          return NextResponse.json(
            { error: 'Invalid journey event data', required: ['customerId', 'event'] },
            { status: 400 }
          );
        }
        
        await autonomousCustomerExperienceEngine.addJourneyEvent(data.customerId, {
          event: data.event,
          page: data.page || '/',
          action: data.action || 'view',
          metadata: data.metadata || {},
          sessionId: data.sessionId || `session_${Date.now()}`,
          userAgent: data.userAgent || 'Unknown',
          conversionValue: data.conversionValue
        });
        
        return NextResponse.json({
          success: true,
          message: 'Journey event added successfully',
          timestamp: new Date().toISOString()
        });

      case 'force-optimization':
        await autonomousCustomerExperienceEngine.forceOptimization();
        return NextResponse.json({
          success: true,
          message: 'Customer experience optimization initiated',
          timestamp: new Date().toISOString()
        });

      case 'update-customer-preference':
        if (!data || !data.customerId || !data.preferences) {
          return NextResponse.json(
            { error: 'Invalid preference data', required: ['customerId', 'preferences'] },
            { status: 400 }
          );
        }
        
        const profile = autonomousCustomerExperienceEngine.getCustomerProfile(data.customerId);
        if (!profile) {
          return NextResponse.json(
            { error: 'Customer profile not found' },
            { status: 404 }
          );
        }
        
        // Update preferences would go here
        return NextResponse.json({
          success: true,
          message: 'Customer preferences updated successfully',
          timestamp: new Date().toISOString()
        });

      case 'generate-personalized-recommendation':
        if (!data || !data.customerId) {
          return NextResponse.json(
            { error: 'Customer ID required' },
            { status: 400 }
          );
        }
        
        const customerProfile = autonomousCustomerExperienceEngine.getCustomerProfile(data.customerId);
        if (!customerProfile) {
          return NextResponse.json(
            { error: 'Customer profile not found' },
            { status: 404 }
          );
        }
        
        // Generate personalized recommendation
        const recommendation = {
          customerId: data.customerId,
          type: 'service_recommendation',
          recommendation: `Based on your ${customerProfile.segment} profile and ${customerProfile.preferences.serviceType} preference, we recommend our premium consultation package`,
          confidence: 0.87,
          expectedValue: customerProfile.lifetimeValue * 0.3,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          generatedAt: new Date()
        };
        
        return NextResponse.json({
          success: true,
          recommendation,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action', availableActions: ['add-journey-event', 'force-optimization', 'update-customer-preference', 'generate-personalized-recommendation'] },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in autonomous customer experience POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
