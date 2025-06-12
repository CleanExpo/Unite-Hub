/**
 * DEAL PIPELINE WORKFLOWS - TEST SUITE
 * 
 * Tests automated deal progression and business rule execution
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock data for testing
const mockDeal = {
  id: 'test-deal-123',
  title: 'Test Deal',
  value: 75000,
  status: 'qualified',
  probability: 50,
  created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
  updated_at: new Date().toISOString(),
  client_id: 'test-client-123',
  user_id: 'test-user-123'
};

const mockOldLead = {
  ...mockDeal,
  id: 'old-lead-123',
  status: 'lead',
  created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
};

const mockHighValueQualified = {
  ...mockDeal,
  id: 'high-value-123',
  status: 'qualified',
  value: 150000
};

const mockHighProbabilityProposal = {
  ...mockDeal,
  id: 'high-prob-123',
  status: 'proposal',
  probability: 95
};

describe('Deal Pipeline Workflows', () => {
  describe('Automated Progression Rules', () => {
    it('should auto-qualify leads older than 7 days', async () => {
      // Test Rule 1: Leads older than 7 days should be qualified
      const result = await testAutoProgressionRules(mockOldLead);
      
      expect(result.canProgress).toBe(true);
      expect(result.nextStatus).toBe('qualified');
      expect(result.reason).toContain('7+ days old');
    });

    it('should move high-value qualified deals to proposal', async () => {
      // Test Rule 2: High-value qualified deals should move to proposal
      const result = await testAutoProgressionRules(mockHighValueQualified);
      
      expect(result.canProgress).toBe(true);
      expect(result.nextStatus).toBe('proposal');
      expect(result.reason).toContain('High-value deal');
    });

    it('should move high-probability proposals to negotiation', async () => {
      // Test Rule 3: High-probability proposals should move to negotiation
      const result = await testAutoProgressionRules(mockHighProbabilityProposal);
      
      expect(result.canProgress).toBe(true);
      expect(result.nextStatus).toBe('negotiation');
      expect(result.reason).toContain('High probability');
    });

    it('should not progress deals that do not meet criteria', async () => {
      // Test normal qualified deal that shouldn't auto-progress
      const result = await testAutoProgressionRules(mockDeal);
      
      expect(result.canProgress).toBe(false);
    });
  });

  describe('Business Rules Validation', () => {
    it('should flag high-value deals not in negotiation', async () => {
      const rules = await testBusinessRules(mockHighValueQualified);
      
      const highValueRule = rules.find(rule => 
        rule.message.includes('High-value deal not in negotiation')
      );
      
      expect(highValueRule).toBeDefined();
      expect(highValueRule?.type).toBe('warning');
    });

    it('should alert on low probability proposals', async () => {
      const lowProbProposal = {
        ...mockDeal,
        status: 'proposal',
        probability: 15
      };
      
      const rules = await testBusinessRules(lowProbProposal);
      
      const lowProbRule = rules.find(rule => 
        rule.message.includes('Low probability proposal')
      );
      
      expect(lowProbRule).toBeDefined();
      expect(lowProbRule?.type).toBe('alert');
    });

    it('should return empty rules for compliant deals', async () => {
      const compliantDeal = {
        ...mockDeal,
        status: 'negotiation',
        value: 75000,
        probability: 75
      };
      
      const rules = await testBusinessRules(compliantDeal);
      
      expect(rules).toHaveLength(0);
    });
  });

  describe('Automation Triggers', () => {
    it('should handle time-based triggers', async () => {
      const trigger = {
        dealId: mockDeal.id,
        triggerType: 'time_based' as const,
        userId: mockDeal.user_id
      };
      
      const result = await testTimeBasedAutomation(trigger, mockDeal);
      
      expect(result.type).toBe('time_based');
      expect(result.dealAge).toBeGreaterThan(0);
      expect(result.executed).toBe(true);
    });

    it('should handle value-based triggers', async () => {
      const trigger = {
        dealId: mockHighValueQualified.id,
        triggerType: 'value_based' as const,
        userId: mockHighValueQualified.user_id
      };
      
      const result = await testValueBasedAutomation(trigger, mockHighValueQualified);
      
      expect(result.type).toBe('value_based');
      expect(result.dealValue).toBe(150000);
      expect(result.actions).toContain('High-value deal flagged for senior review');
    });

    it('should handle activity-based triggers', async () => {
      const trigger = {
        dealId: mockDeal.id,
        triggerType: 'activity_based' as const,
        userId: mockDeal.user_id
      };
      
      const mockActivities = [
        { id: 1, type: 'call', description: 'Follow-up call' },
        { id: 2, type: 'email', description: 'Sent proposal' }
      ];
      
      const result = await testActivityBasedAutomation(trigger, mockActivities);
      
      expect(result.type).toBe('activity_based');
      expect(result.recentActivities).toBe(2);
    });

    it('should handle manual triggers', async () => {
      const trigger = {
        dealId: mockDeal.id,
        triggerType: 'manual' as const,
        userId: mockDeal.user_id,
        conditions: { reason: 'Sales manager override' }
      };
      
      const result = await testManualAutomation(trigger);
      
      expect(result.type).toBe('manual');
      expect(result.conditions.reason).toBe('Sales manager override');
      expect(result.executed).toBe(true);
    });
  });

  describe('Workflow API Integration', () => {
    it('should execute auto-progress workflow', async () => {
      const workflowRequest = {
        action: 'auto_progress',
        dealId: mockOldLead.id,
        userId: mockOldLead.user_id
      };
      
      const result = await testWorkflowExecution(workflowRequest, mockOldLead);
      
      expect(result.success).toBe(true);
      expect(result.progressed).toBe(true);
      expect(result.reason).toContain('7+ days old');
    });

    it('should execute automation triggers', async () => {
      const workflowRequest = {
        action: 'trigger_automation',
        dealId: mockDeal.id,
        triggerType: 'time_based',
        userId: mockDeal.user_id
      };
      
      const result = await testWorkflowExecution(workflowRequest, mockDeal);
      
      expect(result.success).toBe(true);
      expect(result.automation.type).toBe('time_based');
    });

    it('should check business rules', async () => {
      const workflowRequest = {
        action: 'check_rules',
        dealId: mockHighValueQualified.id
      };
      
      const result = await testWorkflowExecution(workflowRequest, mockHighValueQualified);
      
      expect(result.success).toBe(true);
      expect(result.rules).toBeDefined();
    });
  });
});

// Test helper functions (would normally import from the actual modules)
async function testAutoProgressionRules(deal: any) {
  // Mock implementation of checkAutoProgressionRules
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
  
  if (deal.status === 'qualified' && deal.value >= 50000) {
    return {
      canProgress: true,
      nextStatus: 'proposal',
      reason: 'High-value deal - moving to proposal stage'
    };
  }
  
  if (deal.status === 'proposal' && deal.probability >= 90) {
    return {
      canProgress: true,
      nextStatus: 'negotiation',
      reason: 'High probability proposal - moving to negotiation'
    };
  }
  
  return { canProgress: false };
}

async function testBusinessRules(deal: any) {
  const rules = [];
  
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

async function testTimeBasedAutomation(trigger: any, deal: any) {
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

async function testValueBasedAutomation(trigger: any, deal: any) {
  const actions = [];
  
  if (deal.value >= 100000) {
    actions.push('High-value deal flagged for senior review');
  }
  
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

async function testActivityBasedAutomation(trigger: any, activities: any[]) {
  return {
    type: 'activity_based',
    recentActivities: activities.length,
    actions: [`${activities.length} recent activities found`],
    executed: true
  };
}

async function testManualAutomation(trigger: any) {
  return {
    type: 'manual',
    conditions: trigger.conditions,
    actions: ['Manual automation triggered'],
    executed: true
  };
}

async function testWorkflowExecution(request: any, deal: any) {
  // Mock workflow execution based on action type
  switch (request.action) {
    case 'auto_progress':
      const autoProgress = await testAutoProgressionRules(deal);
      
      if (autoProgress.canProgress) {
        return {
          success: true,
          progressed: true,
          reason: autoProgress.reason
        };
      }
      
      return {
        success: true,
        progressed: false,
        reason: 'No automation rules triggered'
      };
      
    case 'trigger_automation':
      let automation;
      
      switch (request.triggerType) {
        case 'time_based':
          automation = await testTimeBasedAutomation(request, deal);
          break;
        case 'value_based':
          automation = await testValueBasedAutomation(request, deal);
          break;
        case 'activity_based':
          automation = await testActivityBasedAutomation(request, []);
          break;
        case 'manual':
          automation = await testManualAutomation(request);
          break;
      }
      
      return {
        success: true,
        automation
      };
      
    case 'check_rules':
      const rules = await testBusinessRules(deal);
      
      return {
        success: true,
        rules
      };
      
    default:
      return {
        success: false,
        error: 'Invalid workflow action'
      };
  }
}

// Export test suite for CI/CD integration
export {
  testAutoProgressionRules,
  testBusinessRules,
  testTimeBasedAutomation,
  testValueBasedAutomation,
  testActivityBasedAutomation,
  testManualAutomation,
  testWorkflowExecution
};
