/**
 * BUSINESS RULE ENGINE - CONFIGURABLE RULE SYSTEM
 * 
 * Implements a flexible business rule engine that can execute
 * configurable rules across all CRM components with real database integration.
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Rule system types
export type RuleType = 'validation' | 'automation' | 'notification' | 'calculation' | 'workflow';
export type EntityType = 'deal' | 'task' | 'client' | 'invoice' | 'activity' | 'user';
export type ConditionOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 
                                'greater_equal' | 'less_equal' | 'contains' | 'not_contains' | 
                                'starts_with' | 'ends_with' | 'in' | 'not_in' | 'exists' | 'not_exists';
export type ActionType = 'update_field' | 'create_task' | 'send_notification' | 'trigger_workflow' | 
                         'calculate_value' | 'assign_user' | 'change_status' | 'create_invoice';

// Validation schemas
export const RuleConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 
                   'less_equal', 'contains', 'not_contains', 'starts_with', 'ends_with', 
                   'in', 'not_in', 'exists', 'not_exists']),
  value: z.any(),
  logicalOperator: z.enum(['AND', 'OR']).optional(),
});

export const RuleActionSchema = z.object({
  type: z.enum(['update_field', 'create_task', 'send_notification', 'trigger_workflow', 
               'calculate_value', 'assign_user', 'change_status', 'create_invoice']),
  target: z.string(),
  value: z.any(),
  parameters: z.record(z.any()).optional(),
});

export const BusinessRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  description: z.string().optional(),
  entityType: z.enum(['deal', 'task', 'client', 'invoice', 'activity', 'user']),
  ruleType: z.enum(['validation', 'automation', 'notification', 'calculation', 'workflow']),
  priority: z.number().min(1).max(100).default(50),
  isActive: z.boolean().default(true),
  conditions: z.array(RuleConditionSchema),
  actions: z.array(RuleActionSchema),
  triggerEvents: z.array(z.string()).optional(),
  userId: z.string().uuid(),
});

export const RuleExecutionSchema = z.object({
  ruleId: z.string().uuid(),
  entityId: z.string().uuid(),
  entityType: z.enum(['deal', 'task', 'client', 'invoice', 'activity', 'user']),
  triggerEvent: z.string(),
  context: z.record(z.any()).optional(),
  userId: z.string().uuid(),
});

export type RuleCondition = z.infer<typeof RuleConditionSchema>;
export type RuleAction = z.infer<typeof RuleActionSchema>;
export type BusinessRule = z.infer<typeof BusinessRuleSchema>;
export type RuleExecutionInput = z.infer<typeof RuleExecutionSchema>;

// Business rule execution result
export interface RuleExecutionResult {
  success: boolean;
  ruleId: string;
  executed: boolean;
  conditionsMet: boolean;
  actionsExecuted: number;
  results: any[];
  errors: string[];
  executionTime: number;
}

// Business Rule Engine
export class BusinessRuleEngine {
  
  /**
   * Create a new business rule
   */
  static async createRule(input: BusinessRule): Promise<{ success: boolean; rule?: any; error?: string }> {
    try {
      // Validate input
      const validated = BusinessRuleSchema.parse(input);
      
      // Get server client
      const supabase = await createClient();
      
      // Create rule record
      const { data: rule, error: ruleError } = await supabase
        .from('business_rules')
        .insert({
          name: validated.name,
          description: validated.description,
          entity_type: validated.entityType,
          rule_type: validated.ruleType,
          priority: validated.priority,
          is_active: validated.isActive,
          conditions: validated.conditions,
          actions: validated.actions,
          trigger_events: validated.triggerEvents || [],
          created_by: validated.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (ruleError) {
        return { success: false, error: ruleError.message };
      }
      
      // Log rule creation
      await this.logRuleActivity(
        rule.id,
        'rule_created',
        `Business rule "${validated.name}" created for ${validated.entityType}`,
        validated.userId
      );
      
      return { success: true, rule };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      return { success: false, error: 'Failed to create business rule' };
    }
  }
  
  /**
   * Execute rules for a specific entity and event
   */
  static async executeRules(input: RuleExecutionInput): Promise<{
    success: boolean;
    results?: RuleExecutionResult[];
    error?: string;
  }> {
    try {
      // Validate input
      const validated = RuleExecutionSchema.parse(input);
      
      // Get applicable rules
      const applicableRules = await this.getApplicableRules(
        validated.entityType,
        validated.triggerEvent
      );
      
      if (applicableRules.length === 0) {
        return {
          success: true,
          results: []
        };
      }
      
      // Get entity data
      const entityData = await this.getEntityData(validated.entityType, validated.entityId);
      if (!entityData) {
        return { success: false, error: 'Entity not found' };
      }
      
      // Execute rules in priority order
      const results: RuleExecutionResult[] = [];
      
      for (const rule of applicableRules) {
        const startTime = Date.now();
        
        try {
          // Check if conditions are met
          const conditionsMet = await this.evaluateConditions(
            rule.conditions,
            entityData,
            validated.context
          );
          
          let actionsExecuted = 0;
          const actionResults: any[] = [];
          const errors: string[] = [];
          
          if (conditionsMet) {
            // Execute actions
            for (const action of rule.actions) {
              try {
                const actionResult = await this.executeAction(
                  action,
                  entityData,
                  validated.entityId,
                  validated.userId
                );
                actionResults.push(actionResult);
                actionsExecuted++;
              } catch (actionError) {
                errors.push(`Action failed: ${actionError}`);
              }
            }
          }
          
          const executionTime = Date.now() - startTime;
          
          const result: RuleExecutionResult = {
            success: errors.length === 0,
            ruleId: rule.id,
            executed: conditionsMet,
            conditionsMet,
            actionsExecuted,
            results: actionResults,
            errors,
            executionTime
          };
          
          results.push(result);
          
          // Log rule execution
          await this.logRuleExecution(rule.id, validated.entityId, result, validated.userId);
          
        } catch (ruleError) {
          results.push({
            success: false,
            ruleId: rule.id,
            executed: false,
            conditionsMet: false,
            actionsExecuted: 0,
            results: [],
            errors: [`Rule execution failed: ${ruleError}`],
            executionTime: Date.now() - startTime
          });
        }
      }
      
      return { success: true, results };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      return { success: false, error: 'Failed to execute business rules' };
    }
  }
  
  /**
   * Get all business rules with filtering
   */
  static async getRules(filters?: {
    entityType?: EntityType;
    ruleType?: RuleType;
    isActive?: boolean;
    userId?: string;
  }): Promise<{
    success: boolean;
    rules?: any[];
    analytics?: {
      totalRules: number;
      activeRules: number;
      rulesByType: Record<RuleType, number>;
      rulesByEntity: Record<EntityType, number>;
    };
    error?: string;
  }> {
    try {
      // Get server client
      const supabase = await createClient();
      
      let query = supabase
        .from('business_rules')
        .select('*')
        .order('priority', { ascending: false });
      
      // Apply filters
      if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }
      if (filters?.ruleType) {
        query = query.eq('rule_type', filters.ruleType);
      }
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters?.userId) {
        query = query.eq('created_by', filters.userId);
      }
      
      const { data: rules, error } = await query;
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Calculate analytics
      const analytics = this.calculateRuleAnalytics(rules || []);
      
      return { success: true, rules: rules || [], analytics };
      
    } catch (error) {
      return { success: false, error: 'Failed to fetch business rules' };
    }
  }
  
  /**
   * Update an existing business rule
   */
  static async updateRule(
    ruleId: string, 
    updates: Partial<BusinessRule>,
    userId: string
  ): Promise<{ success: boolean; rule?: any; error?: string }> {
    try {
      // Get server client
      const supabase = await createClient();
      
      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.conditions) updateData.conditions = updates.conditions;
      if (updates.actions) updateData.actions = updates.actions;
      if (updates.triggerEvents) updateData.trigger_events = updates.triggerEvents;
      
      // Update rule
      const { data: updatedRule, error: updateError } = await supabase
        .from('business_rules')
        .update(updateData)
        .eq('id', ruleId)
        .select()
        .single();
      
      if (updateError) {
        return { success: false, error: updateError.message };
      }
      
      // Log rule update
      await this.logRuleActivity(
        ruleId,
        'rule_updated',
        `Business rule "${updatedRule.name}" updated`,
        userId
      );
      
      return { success: true, rule: updatedRule };
      
    } catch (error) {
      return { success: false, error: 'Failed to update business rule' };
    }
  }
  
  /**
   * Delete a business rule
   */
  static async deleteRule(ruleId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get server client
      const supabase = await createClient();
      
      // Get rule details before deletion
      const { data: rule } = await supabase
        .from('business_rules')
        .select('name')
        .eq('id', ruleId)
        .single();
      
      // Delete rule
      const { error: deleteError } = await supabase
        .from('business_rules')
        .delete()
        .eq('id', ruleId);
      
      if (deleteError) {
        return { success: false, error: deleteError.message };
      }
      
      // Log rule deletion
      await this.logRuleActivity(
        ruleId,
        'rule_deleted',
        `Business rule "${rule?.name || 'Unknown'}" deleted`,
        userId
      );
      
      return { success: true };
      
    } catch (error) {
      return { success: false, error: 'Failed to delete business rule' };
    }
  }
  
  /**
   * Get applicable rules for entity type and trigger event
   */
  private static async getApplicableRules(entityType: EntityType, triggerEvent: string): Promise<any[]> {
    const supabase = await createClient();
    
    const { data: rules, error } = await supabase
      .from('business_rules')
      .select('*')
      .eq('entity_type', entityType)
      .eq('is_active', true)
      .order('priority', { ascending: false });
    
    if (error || !rules) return [];
    
    // Filter by trigger event
    return rules.filter(rule => 
      !rule.trigger_events || 
      rule.trigger_events.length === 0 || 
      rule.trigger_events.includes(triggerEvent)
    );
  }
  
  /**
   * Get entity data for rule evaluation
   */
  private static async getEntityData(entityType: EntityType, entityId: string): Promise<any> {
    const supabase = await createClient();
    
    const tableMap: Record<EntityType, string> = {
      deal: 'deals',
      task: 'tasks',
      client: 'clients',
      invoice: 'invoices',
      activity: 'activities',
      user: 'profiles'
    };
    
    const tableName = tableMap[entityType];
    if (!tableName) return null;
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', entityId)
      .single();
    
    return error ? null : data;
  }
  
  /**
   * Evaluate rule conditions
   */
  private static async evaluateConditions(
    conditions: RuleCondition[],
    entityData: any,
    context?: any
  ): Promise<boolean> {
    if (conditions.length === 0) return true;
    
    let result = true;
    let currentOperator: 'AND' | 'OR' = 'AND';
    
    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(condition, entityData, context);
      
      if (i === 0) {
        result = conditionResult;
      } else {
        if (currentOperator === 'AND') {
          result = result && conditionResult;
        } else {
          result = result || conditionResult;
        }
      }
      
      // Set operator for next iteration
      if (condition.logicalOperator) {
        currentOperator = condition.logicalOperator;
      }
    }
    
    return result;
  }
  
  /**
   * Evaluate a single condition
   */
  private static evaluateCondition(condition: RuleCondition, entityData: any, context?: any): boolean {
    const fieldValue = this.getFieldValue(condition.field, entityData, context);
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
      case 'greater_equal':
        return Number(fieldValue) >= Number(conditionValue);
      case 'less_equal':
        return Number(fieldValue) <= Number(conditionValue);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'starts_with':
        return String(fieldValue).toLowerCase().startsWith(String(conditionValue).toLowerCase());
      case 'ends_with':
        return String(fieldValue).toLowerCase().endsWith(String(conditionValue).toLowerCase());
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      case 'exists':
        return fieldValue !== null && fieldValue !== undefined;
      case 'not_exists':
        return fieldValue === null || fieldValue === undefined;
      default:
        return false;
    }
  }
  
  /**
   * Get field value from entity data or context
   */
  private static getFieldValue(field: string, entityData: any, context?: any): any {
    // Support nested field access with dot notation
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
   * Execute a rule action
   */
  private static async executeAction(
    action: RuleAction,
    entityData: any,
    entityId: string,
    userId: string
  ): Promise<any> {
    const supabase = await createClient();
    
    switch (action.type) {
      case 'update_field':
        // Update a field in the entity
        const tableName = this.getTableName(entityData);
        if (!tableName) throw new Error('Unknown entity type');
        
        const updateData = { [action.target]: action.value };
        const { data, error } = await supabase
          .from(tableName)
          .update(updateData)
          .eq('id', entityId)
          .select()
          .single();
        
        if (error) throw error;
        return { type: 'field_updated', field: action.target, value: action.value };
        
      case 'create_task':
        // Create a new task
        const { data: newTask, error: taskError } = await supabase
          .from('tasks')
          .insert({
            title: action.value,
            description: action.parameters?.description || '',
            priority: action.parameters?.priority || 'medium',
            assigned_to: action.parameters?.assigned_to || userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (taskError) throw taskError;
        return { type: 'task_created', task: newTask };
        
      case 'send_notification':
        // Send a notification (placeholder implementation)
        return { 
          type: 'notification_sent', 
          recipient: action.target, 
          message: action.value 
        };
        
      case 'change_status':
        // Change entity status
        const statusTableName = this.getTableName(entityData);
        if (!statusTableName) throw new Error('Unknown entity type');
        
        const { data: statusData, error: statusError } = await supabase
          .from(statusTableName)
          .update({ status: action.value })
          .eq('id', entityId)
          .select()
          .single();
        
        if (statusError) throw statusError;
        return { type: 'status_changed', status: action.value };
        
      default:
        return { type: 'action_not_implemented', action: action.type };
    }
  }
  
  /**
   * Get table name for entity
   */
  private static getTableName(entityData: any): string | null {
    // This is a simplified implementation
    // In a real system, you'd have better entity type detection
    if ('deal_id' in entityData || 'value' in entityData) return 'deals';
    if ('title' in entityData && 'priority' in entityData) return 'tasks';
    if ('invoice_number' in entityData) return 'invoices';
    if ('name' in entityData && 'email' in entityData) return 'clients';
    return null;
  }
  
  /**
   * Calculate rule analytics
   */
  private static calculateRuleAnalytics(rules: any[]): {
    totalRules: number;
    activeRules: number;
    rulesByType: Record<RuleType, number>;
    rulesByEntity: Record<EntityType, number>;
  } {
    const totalRules = rules.length;
    const activeRules = rules.filter(rule => rule.is_active).length;
    
    const rulesByType = rules.reduce((acc, rule) => {
      acc[rule.rule_type as RuleType] = (acc[rule.rule_type as RuleType] || 0) + 1;
      return acc;
    }, {} as Record<RuleType, number>);
    
    const rulesByEntity = rules.reduce((acc, rule) => {
      acc[rule.entity_type as EntityType] = (acc[rule.entity_type as EntityType] || 0) + 1;
      return acc;
    }, {} as Record<EntityType, number>);
    
    return {
      totalRules,
      activeRules,
      rulesByType,
      rulesByEntity,
    };
  }
  
  /**
   * Log rule activity
   */
  private static async logRuleActivity(
    ruleId: string,
    activityType: string,
    description: string,
    userId: string
  ): Promise<void> {
    try {
      const supabase = await createClient();
      
      await supabase
        .from('activities')
        .insert({
          type: activityType,
          description,
          related_to: 'business_rule',
          related_id: ruleId,
          user_id: userId,
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to log rule activity:', error);
    }
  }
  
  /**
   * Log rule execution
   */
  private static async logRuleExecution(
    ruleId: string,
    entityId: string,
    result: RuleExecutionResult,
    userId: string
  ): Promise<void> {
    try {
      const supabase = await createClient();
      
      await supabase
        .from('rule_executions')
        .insert({
          rule_id: ruleId,
          entity_id: entityId,
          executed: result.executed,
          conditions_met: result.conditionsMet,
          actions_executed: result.actionsExecuted,
          execution_time: result.executionTime,
          errors: result.errors,
          result: result.results,
          executed_by: userId,
          executed_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to log rule execution:', error);
    }
  }
}

// Export business rule engine functions for API routes
export const businessRuleEngine = {
  createRule: BusinessRuleEngine.createRule.bind(BusinessRuleEngine),
  executeRules: BusinessRuleEngine.executeRules.bind(BusinessRuleEngine),
  getRules: BusinessRuleEngine.getRules.bind(BusinessRuleEngine),
  updateRule: BusinessRuleEngine.updateRule.bind(BusinessRuleEngine),
  deleteRule: BusinessRuleEngine.deleteRule.bind(BusinessRuleEngine),
};
