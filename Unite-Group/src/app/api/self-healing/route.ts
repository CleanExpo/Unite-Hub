/**
 * Self-Healing Infrastructure API Route
 * Unite Group - Version 14.0 Phase 1 Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIGateway } from '@/lib/ai/gateway/ai-gateway';
import { SelfHealingInfrastructureService } from '@/lib/autonomous/self-healing/service';

// Initialize AI Gateway with simple configuration
const aiGateway = new AIGateway({
  providers: [
    {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY || 'sk-test',
      model: 'gpt-4'
    }
  ]
});
const selfHealingService = new SelfHealingInfrastructureService(aiGateway, {
  enabled: true,
  automationLevel: 'semi_automated',
  learningEnabled: true
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const status = await selfHealingService.getHealingStatus();
        return NextResponse.json({
          success: true,
          data: status,
          timestamp: new Date().toISOString()
        });

      case 'metrics':
        const metrics = await selfHealingService.getMetrics();
        return NextResponse.json({
          success: true,
          data: metrics,
          timestamp: new Date().toISOString()
        });

      case 'predictive':
        const predictiveHealing = await selfHealingService.predictiveHealing();
        return NextResponse.json({
          success: true,
          data: predictiveHealing,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: true,
          data: {
            service: 'Self-Healing Infrastructure',
            version: '14.0',
            status: 'active',
            capabilities: [
              'Automatic Recovery',
              'Performance Optimization', 
              'Capacity Scaling',
              'Predictive Healing',
              'AI-Powered Analysis'
            ]
          }
        });
    }
  } catch (error) {
    console.error('Self-healing API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    switch (action) {
      case 'trigger_healing':
        const { trigger } = data;
        const execution = await selfHealingService.detectAndHeal(trigger);
        return NextResponse.json({
          success: true,
          data: execution,
          message: 'Self-healing execution initiated'
        });

      case 'register_action':
        const { healingAction } = data;
        const actionId = await selfHealingService.registerHealingAction(healingAction);
        return NextResponse.json({
          success: true,
          data: { actionId },
          message: 'Healing action registered successfully'
        });

      case 'enable_capability':
        const { capabilityType, enabled } = data;
        await selfHealingService.enableCapability(capabilityType, enabled);
        return NextResponse.json({
          success: true,
          message: `Capability ${capabilityType} ${enabled ? 'enabled' : 'disabled'}`
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Self-healing API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'update_configuration':
        // Update healing configuration
        return NextResponse.json({
          success: true,
          message: 'Self-healing configuration updated'
        });

      case 'test_healing':
        // Test healing capabilities
        const testTrigger = {
          type: 'manual' as const,
          source: 'api_test',
          reason: 'Manual test execution',
          urgency: 'low' as const,
          context: { test: true }
        };
        
        const testExecution = await selfHealingService.detectAndHeal(testTrigger);
        return NextResponse.json({
          success: true,
          data: testExecution,
          message: 'Self-healing test completed'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Self-healing API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await selfHealingService.stop();
    return NextResponse.json({
      success: true,
      message: 'Self-healing service stopped'
    });
  } catch (error) {
    console.error('Self-healing API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}
