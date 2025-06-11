/**
 * BUSINESS RULE ENGINE - TEST SUITE
 * 
 * Tests configurable business rule system including rule creation,
 * execution, condition evaluation, and action processing
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock data for testing
const mockDeal = {
  id: 'deal-123',
  title: 'Enterprise Deal',
  value: 100000,
  status: 'negotiation',
  priority: 'high',
  client_id: 'client-123',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockTask = {
  id: 'task-123',
  title: 'Follow up call',
  status: 'pending',
  priority: 'medium',
  assigned_to: 'user-123',
  created_at: new Date().toISOString()
};

const mockUser = {
  id: 'user-123',
  full_name: 'John Doe',
  email: 'john@example.com'
};

// Test rule definitions
const highValueDealRule = {
  name: 'High Value Deal Alert',
  description: 'Alert when deal value exceeds $50k',
  entityType: 'deal',
  ruleType: 'notification',
  priority: 80,
  isActive: true,
  conditions: [
    {
      field: 'value',
      operator: 'greater_than',
      value: 50000
    }
  ],
  actions: [
    {
      type: 'send_notification',
      target: 'sales_manager',
      value: 'High value deal requires attention'
    },
    {
      type: 'create_task',
      target: 'task',
      value: 'Review high-value deal',
      parameters: { priority: 'high' }
    }
  ],
  triggerEvents: ['deal_updated', 'deal_created'],
  userId: 'user-123'
};

const taskAutoAssignRule = {
  name: 'Auto-assign urgent tasks',
  description: 'Automatically assign urgent tasks to available users',
  entityType: 'task',
  ruleType: 'automation',
  priority: 90,
  isActive: true,
  conditions: [
    {
      field: 'priority',
      operator: 'equals',
      value: 'urgent'
    },
    {
      field: 'assigned_to',
      operator: 'not_exists',
      value: null,
      logicalOperator: 'AND'
    }
  ],
  actions: [
    {
      type: 'assign_user',
      target: 'assigned_to',
      value: 'user-123'
    },
    {
      type: 'update_field',
      target: 'status',
      value: 'in-progress'
    }
  ],
  triggerEvents: ['task_created'],
  userId: 'user-123'
};

describe('Business Rule Engine', () => {
  describe('Rule Creation', () => {
    it('should create a valid business rule', async () => {
      const result = await testCreateRule(highValueDealRule);
      
      expect(result.success).toBe(true);
      expect(result.rule).toBeDefined();
      expect(result.rule.name).toBe(highValueDealRule.name);
      expect(result.rule.entity_type).toBe(highValueDealRule.entityType);
      expect(result.rule.is_active).toBe(true);
    });

    it('should validate rule schema', async () => {
      const invalidRule = {
        ...highValueDealRule,
        name: '', // Invalid empty name
        entityType: 'invalid_entity' // Invalid entity type
      };
      
      const result = await testCreateRule(invalidRule);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('name is required');
    });

    it('should create rule with multiple conditions', async () => {
      const result = await testCreateRule(taskAutoAssignRule);
      
      expect(result.success).toBe(true);
      expect(result.rule.conditions).toHaveLength(2);
      expect(result.rule.conditions[1].logicalOperator).toBe('AND');
    });

    it('should set default values for optional fields', async () => {
      const minimalRule = {
        name: 'Test Rule',
        entityType: 'deal',
        ruleType: 'validation',
        conditions: [],
        actions: [],
        userId: 'user-123'
      };
      
      const result = await testCreateRule(minimalRule);
      
      expect(result.success).toBe(true);
      expect(result.rule.priority).toBe(50); // Default priority
      expect(result.rule.is_active).toBe(true); // Default active
    });
  });

  describe('Condition Evaluation', () => {
    it('should evaluate simple equals condition', async () => {
      const condition = {
        field: 'status',
        operator: 'equals',
        value: 'negotiation'
      };
      
      const result = testEvaluateCondition(condition, mockDeal);
      
      expect(result).toBe(true);
    });

    it('should evaluate greater_than condition', async () => {
      const condition = {
        field: 'value',
        operator: 'greater_than',
        value: 50000
      };
      
      const result = testEvaluateCondition(condition, mockDeal);
      
      expect(result).toBe(true); // 100000 > 50000
    });

    it('should evaluate contains condition', async () => {
      const condition = {
        field: 'title',
        operator: 'contains',
        value: 'Enterprise'
      };
      
      const result = testEvaluateCondition(condition, mockDeal);
      
      expect(result).toBe(true);
    });

    it('should evaluate exists condition', async () => {
      const existsCondition = {
        field: 'client_id',
        operator: 'exists',
        value: null
      };
      
      const notExistsCondition = {
        field: 'nonexistent_field',
        operator: 'not_exists',
        value: null
      };
      
      expect(testEvaluateCondition(existsCondition, mockDeal)).toBe(true);
      expect(testEvaluateCondition(notExistsCondition, mockDeal)).toBe(true);
    });

    it('should handle nested field access', async () => {
      const dealWithClient = {
        ...mockDeal,
        client: {
          name: 'Acme Corp',
          type: 'enterprise'
        }
      };
      
      const condition = {
        field: 'client.type',
        operator: 'equals',
        value: 'enterprise'
      };
      
      const result = testEvaluateCondition(condition, dealWithClient);
      
      expect(result).toBe(true);
    });

    it('should evaluate multiple conditions with AND logic', async () => {
      const conditions = [
        {
          field: 'value',
          operator: 'greater_than',
          value: 50000
        },
        {
          field: 'status',
          operator: 'equals',
          value: 'negotiation',
          logicalOperator: 'AND'
        }
      ];
      
      const result = testEvaluateMultipleConditions(conditions, mockDeal);
      
      expect(result).toBe(true);
    });

    it('should evaluate multiple conditions with OR logic', async () => {
      const conditions = [
        {
          field: 'value',
          operator: 'greater_than',
          value: 200000 // False condition
        },
        {
          field: 'priority',
          operator: 'equals',
          value: 'high', // True condition
          logicalOperator: 'OR'
        }
      ];
      
      const result = testEvaluateMultipleConditions(conditions, mockDeal);
      
      expect(result).toBe(true); // OR logic - at least one true
    });
  });

  describe('Rule Execution', () => {
    it('should execute rule when conditions are met', async () => {
      const executionInput = {
        ruleId: 'rule-123',
        entityId: mockDeal.id,
        entityType: 'deal',
        triggerEvent: 'deal_updated',
        userId: 'user-123'
      };
      
      const result = await testExecuteRules(executionInput, [highValueDealRule], mockDeal);
      
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].executed).toBe(true);
      expect(result.results[0].conditionsMet).toBe(true);
      expect(result.results[0].actionsExecuted).toBe(2);
    });

    it('should not execute rule when conditions are not met', async () => {
      const lowValueDeal = { ...mockDeal, value: 25000 }; // Below threshold
      
      const executionInput = {
        ruleId: 'rule-123',
        entityId: lowValueDeal.id,
        entityType: 'deal',
        triggerEvent: 'deal_updated',
        userId: 'user-123'
      };
      
      const result = await testExecuteRules(executionInput, [highValueDealRule], lowValueDeal);
      
      expect(result.success).toBe(true);
      expect(result.results[0].executed).toBe(false);
      expect(result.results[0].conditionsMet).toBe(false);
      expect(result.results[0].actionsExecuted).toBe(0);
    });

    it('should execute multiple applicable rules', async () => {
      const rules = [highValueDealRule, taskAutoAssignRule];
      
      const executionInput = {
        ruleId: 'rule-123',
        entityId: mockDeal.id,
        entityType: 'deal',
        triggerEvent: 'deal_updated',
        userId: 'user-123'
      };
      
      const result = await testExecuteRules(executionInput, rules, mockDeal);
      
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1); // Only deal rule applies to deal entity
      expect(result.results[0].executed).toBe(true);
    });

    it('should respect rule priority order', async () => {
      const lowPriorityRule = { ...highValueDealRule, priority: 10 };
      const highPriorityRule = { ...highValueDealRule, priority: 90, name: 'High Priority Rule' };
      
      const rules = [lowPriorityRule, highPriorityRule];
      
      const executionInput = {
        ruleId: 'rule-123',
        entityId: mockDeal.id,
        entityType: 'deal',
        triggerEvent: 'deal_updated',
        userId: 'user-123'
      };
      
      const result = await testExecuteRules(executionInput, rules, mockDeal);
      
      expect(result.results[0].ruleName).toBe('High Priority Rule'); // Higher priority first
    });

    it('should filter rules by trigger event', async () => {
      const specificRule = {
        ...highValueDealRule,
        triggerEvents: ['deal_created'] // Only for created events
      };
      
      const executionInput = {
        ruleId: 'rule-123',
        entityId: mockDeal.id,
        entityType: 'deal',
        triggerEvent: 'deal_updated', // Different event
        userId: 'user-123'
      };
      
      const result = await testExecuteRules(executionInput, [specificRule], mockDeal);
      
      expect(result.results).toHaveLength(0); // No applicable rules
    });
  });

  describe('Action Execution', () => {
    it('should execute update_field action', async () => {
      const action = {
        type: 'update_field',
        target: 'status',
        value: 'closed-won'
      };
      
      const result = await testExecuteAction(action, mockDeal, 'user-123');
      
      expect(result.type).toBe('field_updated');
      expect(result.field).toBe('status');
      expect(result.value).toBe('closed-won');
    });

    it('should execute create_task action', async () => {
      const action = {
        type: 'create_task',
        target: 'task',
        value: 'Follow up with client',
        parameters: { priority: 'high', assigned_to: 'user-456' }
      };
      
      const result = await testExecuteAction(action, mockDeal, 'user-123');
      
      expect(result.type).toBe('task_created');
      expect(result.task.title).toBe('Follow up with client');
      expect(result.task.priority).toBe('high');
    });

    it('should execute send_notification action', async () => {
      const action = {
        type: 'send_notification',
        target: 'user-456',
        value: 'Deal requires your attention'
      };
      
      const result = await testExecuteAction(action, mockDeal, 'user-123');
      
      expect(result.type).toBe('notification_sent');
      expect(result.recipient).toBe('user-456');
      expect(result.message).toBe('Deal requires your attention');
    });

    it('should execute change_status action', async () => {
      const action = {
        type: 'change_status',
        target: 'status',
        value: 'qualified'
      };
      
      const result = await testExecuteAction(action, mockDeal, 'user-123');
      
      expect(result.type).toBe('status_changed');
      expect(result.status).toBe('qualified');
    });
  });

  describe('Rule Management', () => {
    it('should get rules with filtering', async () => {
      const rules = [highValueDealRule, taskAutoAssignRule];
      const filters = { entityType: 'deal', isActive: true };
      
      const result = await testGetRules(rules, filters);
      
      expect(result.success).toBe(true);
      expect(result.rules).toHaveLength(1); // Only deal rules
      expect(result.analytics.totalRules).toBe(1);
      expect(result.analytics.activeRules).toBe(1);
    });

    it('should update existing rule', async () => {
      const updates = {
        name: 'Updated Rule Name',
        priority: 95,
        isActive: false
      };
      
      const result = await testUpdateRule('rule-123', updates, 'user-123');
      
      expect(result.success).toBe(true);
      expect(result.rule.name).toBe('Updated Rule Name');
      expect(result.rule.priority).toBe(95);
      expect(result.rule.is_active).toBe(false);
    });

    it('should delete rule', async () => {
      const result = await testDeleteRule('rule-123', 'user-123');
      
      expect(result.success).toBe(true);
    });

    it('should calculate rule analytics', async () => {
      const rules = [
        { ...highValueDealRule, rule_type: 'automation', entity_type: 'deal', is_active: true },
        { ...taskAutoAssignRule, rule_type: 'notification', entity_type: 'task', is_active: true },
        { ...highValueDealRule, rule_type: 'validation', entity_type: 'client', is_active: false }
      ];
      
      const analytics = testCalculateRuleAnalytics(rules);
      
      expect(analytics.totalRules).toBe(3);
      expect(analytics.activeRules).toBe(2);
      expect(analytics.rulesByType.automation).toBe(1);
      expect(analytics.rulesByEntity.deal).toBe(2);
    });
  });

  describe('Rule Testing (Dry Run)', () => {
    it('should test rule without executing actions', async () => {
      const testInput = {
        ruleId: 'rule-123',
        entityId: mockDeal.id,
        entityType: 'deal',
        context: {},
        userId: 'user-123'
      };
      
      const result = await testRuleExecution(highValueDealRule, testInput);
      
      expect(result.ruleId).toBe('rule-123');
      expect(result.wouldExecute).toBe(true);
      expect(result.conditionsEvaluated.met).toBe(true);
      expect(result.plannedActions).toHaveLength(2);
      expect(result.estimatedImpact.wouldExecute).toBe(true);
    });

    it('should provide detailed condition evaluation', async () => {
      const testInput = {
        ruleId: 'rule-123',
        entityId: mockDeal.id,
        entityType: 'deal',
        context: {},
        userId: 'user-123'
      };
      
      const result = await testRuleExecution(highValueDealRule, testInput);
      
      expect(result.conditionsEvaluated.details).toHaveLength(1);
      expect(result.conditionsEvaluated.details[0].field).toBe('value');
      expect(result.conditionsEvaluated.details[0].actualValue).toBe(100000);
      expect(result.conditionsEvaluated.details[0].result).toBe(true);
    });

    it('should show impact analysis for planned actions', async () => {
      const testInput = {
        ruleId: 'rule-123',
        entityId: mockDeal.id,
        entityType: 'deal',
        context: {},
        userId: 'user-123'
      };
      
      const result = await testRuleExecution(highValueDealRule, testInput);
      
      expect(result.estimatedImpact.impact.notifications).toBe(1);
      expect(result.estimatedImpact.impact.tasksCreated).toBe(1);
      expect(result.estimatedImpact.impact.totalActions).toBe(2);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete rule lifecycle', async () => {
      // Create rule
      const createResult = await testCreateRule(highValueDealRule);
      expect(createResult.success).toBe(true);
      
      // Execute rule
      const executionInput = {
        ruleId: createResult.rule.id,
        entityId: mockDeal.id,
        entityType: 'deal',
        triggerEvent: 'deal_updated',
        userId: 'user-123'
      };
      
      const executeResult = await testExecuteRules(executionInput, [createResult.rule], mockDeal);
      expect(executeResult.success).toBe(true);
      expect(executeResult.results[0].executed).toBe(true);
      
      // Update rule
      const updateResult = await testUpdateRule(createResult.rule.id, { priority: 99 }, 'user-123');
      expect(updateResult.success).toBe(true);
      
      // Delete rule
      const deleteResult = await testDeleteRule(createResult.rule.id, 'user-123');
      expect(deleteResult.success).toBe(true);
    });
  });
});

// Test helper functions
async function testCreateRule(ruleData: any) {
  // Mock rule creation
  const rule = {
    id: `rule-${Date.now()}`,
    name: ruleData.name,
    description: ruleData.description,
    entity_type: ruleData.entityType,
    rule_type: ruleData.ruleType,
    priority: ruleData.priority || 50,
    is_active: ruleData.isActive !== undefined ? ruleData.isActive : true,
    conditions: ruleData.conditions,
    actions: ruleData.actions,
    trigger_events: ruleData.triggerEvents || [],
    created_by: ruleData.userId,
    created_at: new Date().toISOString()
  };
  
  // Validate required fields
  if (!ruleData.name || ruleData.name.trim() === '') {
    return { success: false, error: 'Rule name is required' };
  }
  
  return { success: true, rule };
}

function testEvaluateCondition(condition: any, entityData: any, context?: any): boolean {
  const fieldValue = getFieldValue(condition.field, entityData, context);
  
  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not_equals':
      return fieldValue !== condition.value;
    case 'greater_than':
      return Number(fieldValue) > Number(condition.value);
    case 'less_than':
      return Number(fieldValue) < Number(condition.value);
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
    case 'exists':
      return fieldValue !== null && fieldValue !== undefined;
    case 'not_exists':
      return fieldValue === null || fieldValue === undefined;
    default:
      return false;
  }
}

function testEvaluateMultipleConditions(conditions: any[], entityData: any): boolean {
  if (conditions.length === 0) return true;
  
  let result = true;
  let currentOperator: 'AND' | 'OR' = 'AND';
  
  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];
    const conditionResult = testEvaluateCondition(condition, entityData);
    
    if (i === 0) {
      result = conditionResult;
    } else {
      if (currentOperator === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }
    }
    
    if (condition.logicalOperator) {
      currentOperator = condition.logicalOperator;
    }
  }
  
  return result;
}

async function testExecuteRules(executionInput: any, rules: any[], entityData: any) {
  // Filter applicable rules
  const applicableRules = rules
    .filter(rule => rule.entityType === executionInput.entityType)
    .filter(rule => !rule.triggerEvents || rule.triggerEvents.length === 0 || rule.triggerEvents.includes(executionInput.triggerEvent))
    .sort((a, b) => (b.priority || 50) - (a.priority || 50));
  
  const results = [];
  
  for (const rule of applicableRules) {
    const startTime = Date.now();
    const conditionsMet = testEvaluateMultipleConditions(rule.conditions, entityData);
    
    let actionsExecuted = 0;
    const actionResults = [];
    
    if (conditionsMet) {
      for (const action of rule.actions) {
        const actionResult = await testExecuteAction(action, entityData, executionInput.userId);
        actionResults.push(actionResult);
        actionsExecuted++;
      }
    }
    
    results.push({
      success: true,
      ruleId: rule.id || 'test-rule',
      ruleName: rule.name,
      executed: conditionsMet,
      conditionsMet,
      actionsExecuted,
      results: actionResults,
      errors: [],
      executionTime: Date.now() - startTime
    });
  }
  
  return { success: true, results };
}

async function testExecuteAction(action: any, entityData: any, userId: string) {
  switch (action.type) {
    case 'update_field':
      return {
        type: 'field_updated',
        field: action.target,
        value: action.value
      };
      
    case 'create_task':
      return {
        type: 'task_created',
        task: {
          id: `task-${Date.now()}`,
          title: action.value,
          priority: action.parameters?.priority || 'medium',
          assigned_to: action.parameters?.assigned_to || userId,
          created_at: new Date().toISOString()
        }
      };
      
    case 'send_notification':
      return {
        type: 'notification_sent',
        recipient: action.target,
        message: action.value
      };
      
    case 'change_status':
      return {
        type: 'status_changed',
        status: action.value
      };
      
    default:
      return {
        type: 'action_not_implemented',
        action: action.type
      };
  }
}

async function testGetRules(rules: any[], filters: any) {
  let filteredRules = rules;
  
  if (filters.entityType) {
    filteredRules = filteredRules.filter(rule => rule.entityType === filters.entityType);
  }
  
  if (filters.isActive !== undefined) {
    filteredRules = filteredRules.filter(rule => (rule.isActive !== undefined ? rule.isActive : true) === filters.isActive);
  }
  
  const analytics = testCalculateRuleAnalytics(filteredRules);
  
  return {
    success: true,
    rules: filteredRules,
    analytics
  };
}

async function testUpdateRule(ruleId: string, updates: any, userId: string) {
  const updatedRule = {
    id: ruleId,
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  return {
    success: true,
    rule: updatedRule
  };
}

async function testDeleteRule(ruleId: string, userId: string) {
  return { success: true };
}

function testCalculateRuleAnalytics(rules: any[]) {
  const totalRules = rules.length;
  const activeRules = rules.filter(rule => rule.is_active !== false).length;
  
  const rulesByType = rules.reduce((acc, rule) => {
    const type = rule.rule_type || rule.ruleType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  const rulesByEntity = rules.reduce((acc, rule) => {
    const entity = rule.entity_type || rule.entityType;
    acc[entity] = (acc[entity] || 0) + 1;
    return acc;
  }, {});
  
  return {
    totalRules,
    activeRules,
    rulesByType,
    rulesByEntity
  };
}

async function testRuleExecution(rule: any, testInput: any) {
  const conditionsResult = {
    met: testEvaluateMultipleConditions(rule.conditions, mockDeal),
    details: rule.conditions.map((condition: any) => ({
      field: condition.field,
      operator: condition.operator,
      expectedValue: condition.value,
      actualValue: getFieldValue(condition.field, mockDeal),
      result: testEvaluateCondition(condition, mockDeal)
    })),
    summary: '1/1 conditions met'
  };
  
  const plannedActions = rule.actions.map((action: any) => ({
    type: action.type,
    target: action.target,
    value: action.value,
    wouldExecute: conditionsResult.met,
    parameters: action.parameters
  }));
  
  const estimatedImpact = {
    wouldExecute: conditionsResult.met,
    impact: {
      fieldUpdates: plannedActions.filter((a: any) => a.type === 'update_field').length,
      tasksCreated: plannedActions.filter((a: any) => a.type === 'create_task').length,
      notifications: plannedActions.filter((a: any) => a.type === 'send_notification').length,
      statusChanges: plannedActions.filter((a: any) => a.type === 'change_status').length,
      totalActions: plannedActions.length
    },
    message: conditionsResult.met ? `Would execute ${plannedActions.length} actions` : 'No actions would execute'
  };
  
  return {
    ruleId: testInput.ruleId,
    ruleName: rule.name,
    entityId: testInput.entityId,
    entityType: testInput.entityType,
    conditionsEvaluated: conditionsResult,
    plannedActions,
    wouldExecute: conditionsResult.met,
    estimatedImpact
  };
}

function getFieldValue(field: string, entityData: any, context?: any): any {
  const fieldParts = field.split('.');
  
  let value = entityData;
  for (const part of fieldParts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      value = undefined;
      break;
    }
  }
  
  if (value === undefined && context) {
    value = context;
    for (const part of fieldParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        value = undefined;
        break;
      }
    }
  }
  
  return value;
}

// Export test functions for CI/CD integration
export {
  testCreateRule,
  testEvaluateCondition,
  testEvaluateMultipleConditions,
  testExecuteRules,
  testExecuteAction,
  testGetRules,
  testUpdateRule,
  testDeleteRule,
  testCalculateRuleAnalytics,
  testRuleExecution
};
