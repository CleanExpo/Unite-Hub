/**
 * BUSINESS RULE ENGINE API
 * 
 * Handles business rule management and execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { BusinessRuleEngine, BusinessRuleSchema, RuleExecutionSchema } from '@/lib/crm/business-logic/BusinessRuleEngine';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * POST /api/crm/business-rules - Create rule or execute rules
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different rule operations
    switch (body.action) {
      case 'create_rule':
        return await handleCreateRule(body);
      case 'execute_rules':
        return await handleExecuteRules(body);
      case 'test_rule':
        return await handleTestRule(body);
      case 'bulk_execute':
        return await handleBulkExecute(body);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: create_rule, execute_rules, test_rule, bulk_execute' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Business rules API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crm/business-rules - Get rules with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const ruleType = searchParams.get('ruleType');
    const isActive = searchParams.get('isActive');
    const userId = searchParams.get('userId');
    const ruleId = searchParams.get('ruleId');
    
    // Handle specific rule retrieval
    if (ruleId) {
      const rule = await getSingleRule(ruleId);
      return NextResponse.json({ success: true, rule });
    }
    
    // Build filters
    const filters: any = {};
    if (entityType) filters.entityType = entityType;
    if (ruleType) filters.ruleType = ruleType;
    if (isActive !== null) filters.isActive = isActive === 'true';
    if (userId) filters.userId = userId;
    
    // Get rules with analytics
    const result = await BusinessRuleEngine.getRules(filters);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Get business rules error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/crm/business-rules - Update rule
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleId, updates, userId } = body;
    
    if (!ruleId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Rule ID and User ID are required' },
        { status: 400 }
      );
    }
    
    const result = await BusinessRuleEngine.updateRule(ruleId, updates, userId);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Update business rule error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crm/business-rules - Delete rule
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');
    const userId = searchParams.get('userId');
    
    if (!ruleId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Rule ID and User ID are required' },
        { status: 400 }
      );
    }
    
    const result = await BusinessRuleEngine.deleteRule(ruleId, userId);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Delete business rule error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle rule creation
 */
async function handleCreateRule(body: any) {
  try {
    // Validate rule data
    const ruleData = BusinessRuleSchema.parse(body.rule);
    
    // Create the rule
    const result = await BusinessRuleEngine.createRule(ruleData);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        rule: result.rule,
        message: 'Business rule created successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Create rule error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create business rule' },
      { status: 500 }
    );
  }
}

/**
 * Handle rule execution
 */
async function handleExecuteRules(body: any) {
  try {
    // Validate execution data
    const executionData = RuleExecutionSchema.parse(body.execution);
    
    // Execute rules
    const result = await BusinessRuleEngine.executeRules(executionData);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        results: result.results,
        summary: {
          totalRules: result.results?.length || 0,
          executedRules: result.results?.filter(r => r.executed).length || 0,
          successfulRules: result.results?.filter(r => r.success).length || 0,
          failedRules: result.results?.filter(r => !r.success).length || 0,
          totalExecutionTime: result.results?.reduce((sum, r) => sum + r.executionTime, 0) || 0
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Execute rules error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute business rules' },
      { status: 500 }
    );
  }
}

/**
 * Handle rule testing (dry run)
 */
async function handleTestRule(body: any) {
  try {
    const { ruleId, entityId, entityType, context, userId } = body;
    
    if (!ruleId || !entityId || !entityType || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields for rule testing' },
        { status: 400 }
      );
    }
    
    // Get the specific rule
    const rule = await getSingleRule(ruleId);
    if (!rule) {
      return NextResponse.json(
        { success: false, error: 'Rule not found' },
        { status: 404 }
      );
    }
    
    // Execute in test mode (this would be a dry-run implementation)
    const testResult = await testRuleExecution(rule, entityId, entityType, context, userId);
    
    return NextResponse.json({
      success: true,
      testResult,
      message: 'Rule test completed (dry run)'
    });
    
  } catch (error) {
    console.error('Test rule error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test business rule' },
      { status: 500 }
    );
  }
}

/**
 * Handle bulk rule execution
 */
async function handleBulkExecute(body: any) {
  try {
    const { entityType, triggerEvent, entityIds, userId } = body;
    
    if (!entityType || !triggerEvent || !entityIds || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields for bulk execution' },
        { status: 400 }
      );
    }
    
    const bulkResults = [];
    let successCount = 0;
    let errorCount = 0;
    
    // Execute rules for each entity
    for (const entityId of entityIds) {
      try {
        const result = await BusinessRuleEngine.executeRules({
          ruleId: '', // Not used in bulk execution
          entityId,
          entityType,
          triggerEvent,
          userId
        });
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        bulkResults.push({
          entityId,
          success: result.success,
          results: result.results,
          error: result.error
        });
        
      } catch (entityError) {
        errorCount++;
        bulkResults.push({
          entityId,
          success: false,
          error: `Execution failed: ${entityError}`
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      bulkResults,
      summary: {
        totalEntities: entityIds.length,
        successfulExecutions: successCount,
        failedExecutions: errorCount,
        successRate: ((successCount / entityIds.length) * 100).toFixed(2) + '%'
      }
    });
    
  } catch (error) {
    console.error('Bulk execute error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute bulk rule processing' },
      { status: 500 }
    );
  }
}

/**
 * Get a single rule by ID
 */
async function getSingleRule(ruleId: string) {
  const supabase = await createClient();
  
  const { data: rule, error } = await supabase
    .from('business_rules')
    .select('*')
    .eq('id', ruleId)
    .single();
  
  if (error) {
    console.error('Error fetching rule:', error);
    return null;
  }
  
  return rule;
}

/**
 * Test rule execution (dry run)
 */
async function testRuleExecution(
  rule: any,
  entityId: string,
  entityType: string,
  context: any,
  userId: string
) {
  try {
    // Get entity data
    const supabase = await createClient();
    const tableMap: Record<string, string> = {
      deal: 'deals',
      task: 'tasks',
      client: 'clients',
      invoice: 'invoices',
      activity: 'activities',
      user: 'profiles'
    };
    
    const tableName = tableMap[entityType];
    if (!tableName) {
      throw new Error('Invalid entity type');
    }
    
    const { data: entityData, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', entityId)
      .single();
    
    if (error || !entityData) {
      throw new Error('Entity not found');
    }
    
    // Simulate condition evaluation
    const conditionsResult = evaluateTestConditions(rule.conditions, entityData, context);
    
    // Simulate action planning (what would happen)
    const plannedActions = rule.actions.map((action: any) => ({
      type: action.type,
      target: action.target,
      value: action.value,
      wouldExecute: conditionsResult.met,
      parameters: action.parameters
    }));
    
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      entityId,
      entityType,
      conditionsEvaluated: conditionsResult,
      plannedActions,
      wouldExecute: conditionsResult.met,
      estimatedImpact: calculateEstimatedImpact(plannedActions, conditionsResult.met)
    };
    
  } catch (error) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      entityId,
      entityType,
      error: `Test failed: ${error}`,
      wouldExecute: false
    };
  }
}

/**
 * Evaluate conditions for testing
 */
function evaluateTestConditions(conditions: any[], entityData: any, context: any) {
  const evaluatedConditions = conditions.map(condition => {
    const fieldValue = getFieldValue(condition.field, entityData, context);
    const result = evaluateSingleCondition(condition, fieldValue);
    
    return {
      field: condition.field,
      operator: condition.operator,
      expectedValue: condition.value,
      actualValue: fieldValue,
      result,
      explanation: generateConditionExplanation(condition, fieldValue, result)
    };
  });
  
  // Calculate overall result (simplified AND logic)
  const overallResult = evaluatedConditions.every(c => c.result);
  
  return {
    met: overallResult,
    details: evaluatedConditions,
    summary: `${evaluatedConditions.filter(c => c.result).length}/${evaluatedConditions.length} conditions met`
  };
}

/**
 * Get field value for testing
 */
function getFieldValue(field: string, entityData: any, context: any): any {
  const fieldParts = field.split('.');
  
  // Try entity data first
  let value = entityData;
  for (const part of fieldParts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      value = undefined;
      break;
    }
  }
  
  // If not found in entity data, try context
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

/**
 * Evaluate single condition for testing
 */
function evaluateSingleCondition(condition: any, fieldValue: any): boolean {
  const conditionValue = condition.value;
  
  switch (condition.operator) {
    case 'equals':
      return fieldValue === conditionValue;
    case 'not_equals':
      return fieldValue !== conditionValue;
    case 'greater_than':
      return Number(fieldValue) > Number(conditionValue);
    case 'less_than':
      return Number(fieldValue) < Number(conditionValue);
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
    case 'exists':
      return fieldValue !== null && fieldValue !== undefined;
    default:
      return false;
  }
}

/**
 * Generate condition explanation
 */
function generateConditionExplanation(condition: any, fieldValue: any, result: boolean): string {
  const status = result ? 'âœ“' : 'âœ—';
  return `${status} ${condition.field} ${condition.operator} ${condition.value} (actual: ${fieldValue})`;
}

/**
 * Calculate estimated impact of actions
 */
function calculateEstimatedImpact(plannedActions: any[], wouldExecute: boolean) {
  if (!wouldExecute) {
    return {
      wouldExecute: false,
      message: 'No actions would execute - conditions not met'
    };
  }
  
  const impact = {
    fieldUpdates: plannedActions.filter(a => a.type === 'update_field').length,
    tasksCreated: plannedActions.filter(a => a.type === 'create_task').length,
    notifications: plannedActions.filter(a => a.type === 'send_notification').length,
    statusChanges: plannedActions.filter(a => a.type === 'change_status').length,
    totalActions: plannedActions.length
  };
  
  return {
    wouldExecute: true,
    impact,
    message: `Would execute ${impact.totalActions} actions`
  };
}
