/**
 * DEAL PIPELINE WORKFLOWS API
 * 
 * Handles automated deal progression and business rule execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { DealPipelineWorkflows, DealWorkflowSchema } from '@/lib/crm/business-logic/DealPipelineWorkflows';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Automation trigger schema
const AutomationTriggerSchema = z.object({
  dealId: z.string().uuid(),
  triggerType: z.enum(['time_based', 'value_based', 'activity_based', 'manual']),
  conditions: z.record(z.any()).optional(),
  userId: z.string().uuid(),
});

/**
 * POST /api/crm/deals/workflows - Execute automated workflow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different workflow types
    switch (body.action) {
      case 'auto_progress':
        return await handleAutoProgress(body);
      case 'trigger_automation':
        return await handleTriggerAutomation(body);
      case 'check_rules':
        return await handleCheckBusinessRules(body);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid workflow action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Workflow API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crm/deals/workflows - Get automation status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    
    if (!dealId) {
      return NextResponse.json(
        { success: false, error: 'Deal ID required' },
        { status: 400 }
      );
    }
    
    // Get deal automation status
    const automationStatus = await getDealAutomationStatus(dealId);
    
    return NextResponse.json({
      success: true,
      automation: automationStatus
    });
    
  } catch (error) {
    console.error('Workflow status API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle automatic deal progression based on business rules
 */
async function handleAutoProgress(body: any) {
  try {
    const { dealId, userId } = body;
    
    if (!dealId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Deal ID and User ID required' },
        { status: 400 }
      );
    }
    
    // Get current deal status
    const supabase = await createClient();
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();
    
    if (dealError || !deal) {
      return NextResponse.json(
        { success: false, error: 'Deal not found' },
        { status: 404 }
      );
    }
    
    // Check if deal should auto-progress
    const shouldProgress = await checkAutoProgressionRules(deal);
    
    if (shouldProgress.canProgress) {
      // Execute automatic progression
      const result = await DealPipelineWorkflows.moveDealsStatus({
        dealId,
        fromStatus: deal.status,
        toStatus: shouldProgress.nextStatus,
        notes: `Automated progression: ${shouldProgress.reason}`,
        userId
      });
      
      return NextResponse.json({
        success: true,
        progressed: true,
        deal: result.deal,
        reason: shouldProgress.reason
      });
    }
    
    return NextResponse.json({
      success: true,
      progressed: false,
      reason: 'No automation rules triggered'
    });
    
  } catch (error) {
    console.error('Auto progress error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute auto progression' },
      { status: 500 }
    );
  }
}

/**
 * Handle manual automation triggers
 */
async function handleTriggerAutomation(body: any) {
  try {
    const validated = AutomationTriggerSchema.parse(body);
    
    // Execute automation based on trigger type
    let result;
    
    switch (validated.triggerType) {
      case 'time_based':
        result = await executeTimeBasedAutomation(validated);
        break;
      case 'value_based':
        result = await executeValueBasedAutomation(validated);
        break;
      case 'activity_based':
        result = await executeActivityBasedAutomation(validated);
        break;
      case 'manual':
        result = await executeManualAutomation(validated);
        break;
      default:
        throw new Error('Invalid trigger type');
    }
    
    return NextResponse.json({
      success: true,
      automation: result
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Trigger automation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to trigger automation' },
      { status: 500 }
    );
  }
}

/**
 * Handle business rule checking
 */
async function handleCheckBusinessRules(body: any) {
  try {
    const { dealId } = body;
    
    if (!dealId) {
      return NextResponse.json(
        { success: false, error: 'Deal ID required' },
        { status: 400 }
      );
    }
    
    const businessRules = await checkBusinessRules(dealId);
    
    return NextResponse.json({
      success: true,
      rules: businessRules
    });
    
  } catch (error) {
    console.error('Business rules check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check business rules' },
      { status: 500 }
    );
  }
}

/**
 * Check if deal should automatically progress
 */
async function checkAutoProgressionRules(deal: any): Promise<{
  canProgress: boolean;
  nextStatus?: string;
  reason?: string;
}> {
  // Rule 1: Leads older than 7 days with no activity should be qualified
  if (deal.status === 'lead') {
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceCreated >= 7) {
      return {
        canProgress: true,
        nextStatus: 'qualified',
        reason: 'Lead is 7+ days old - auto-qualifying'
      };
    }
  }
  
  // Rule 2: High-value qualified deals should move to proposal
  if (deal.status === 'qualified' && deal.value >= 50000) {
    return {
      canProgress: true,
      nextStatus: 'proposal',
      reason: 'High-value deal - moving to proposal stage'
    };
  }
  
  // Rule 3: Proposals with 90%+ probability should move to negotiation
  if (deal.status === 'proposal' && deal.probability >= 90) {
    return {
      canProgress: true,
      nextStatus: 'negotiation',
      reason: 'High probability proposal - moving to negotiation'
    };
  }
  
  return { canProgress: false };
}

/**
 * Execute time-based automation
 */
async function executeTimeBasedAutomation(trigger: any) {
  // Check deal age and execute appropriate actions
  const supabase = await createClient();
  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', trigger.dealId)
    .single();
  
  if (!deal) throw new Error('Deal not found');
  
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return {
    type: 'time_based',
    dealAge: daysSinceCreated,
    actions: [`Deal is ${daysSinceCreated} days old`],
    executed: true
  };
}

/**
 * Execute value-based automation
 */
async function executeValueBasedAutomation(trigger: any) {
  const supabase = await createClient();
  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', trigger.dealId)
    .single();
  
  if (!deal) throw new Error('Deal not found');
  
  const actions = [];
  
  // High-value deal actions
  if (deal.value >= 100000) {
    actions.push('High-value deal flagged for senior review');
  }
  
  // Low-value deal actions
  if (deal.value < 5000) {
    actions.push('Low-value deal - consider automation');
  }
  
  return {
    type: 'value_based',
    dealValue: deal.value,
    actions,
    executed: true
  };
}

/**
 * Execute activity-based automation
 */
async function executeActivityBasedAutomation(trigger: any) {
  // Check recent activities and execute appropriate actions
  const supabase = await createClient();
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('related_id', trigger.dealId)
    .eq('related_to', 'deal')
    .order('timestamp', { ascending: false })
    .limit(5);
  
  const recentActivityCount = activities?.length || 0;
  
  return {
    type: 'activity_based',
    recentActivities: recentActivityCount,
    actions: [`${recentActivityCount} recent activities found`],
    executed: true
  };
}

/**
 * Execute manual automation
 */
async function executeManualAutomation(trigger: any) {
  return {
    type: 'manual',
    conditions: trigger.conditions,
    actions: ['Manual automation triggered'],
    executed: true
  };
}

/**
 * Check business rules for deal
 */
async function checkBusinessRules(dealId: string) {
  const supabase = await createClient();
  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single();
  
  if (!deal) throw new Error('Deal not found');
  
  const rules = [];
  
  // Rule checks
  if (deal.value > 100000 && deal.status !== 'negotiation') {
    rules.push({
      type: 'warning',
      message: 'High-value deal not in negotiation stage',
      action: 'Consider escalating to senior sales'
    });
  }
  
  if (deal.probability < 25 && deal.status === 'proposal') {
    rules.push({
      type: 'alert',
      message: 'Low probability proposal',
      action: 'Review deal qualification'
    });
  }
  
  return rules;
}

/**
 * Get deal automation status
 */
async function getDealAutomationStatus(dealId: string) {
  const supabase = await createClient();
  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single();
  
  if (!deal) throw new Error('Deal not found');
  
  // Check various automation conditions
  const autoProgress = await checkAutoProgressionRules(deal);
  const businessRules = await checkBusinessRules(dealId);
  
  return {
    dealId,
    status: deal.status,
    canAutoProgress: autoProgress.canProgress,
    nextStatus: autoProgress.nextStatus,
    progressReason: autoProgress.reason,
    businessRules,
    lastUpdated: deal.updated_at
  };
}
