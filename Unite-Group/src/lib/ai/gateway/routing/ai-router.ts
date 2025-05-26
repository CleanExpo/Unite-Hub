/**
 * AI Router Implementation
 * Unite Group AI Gateway - Intelligent Request Routing
 */

import {
  AIRequest,
  AIProvider,
  AIRoutingRule,
  AIRoutingCondition,
  AIRoutingAction
} from '../types';

export class AIRouter {
  private rules: AIRoutingRule[] = [];
  private defaultProvider: AIProvider = 'openai';

  constructor(rules: AIRoutingRule[] = []) {
    this.rules = rules.sort((a, b) => b.priority - a.priority); // Higher priority first
  }

  /**
   * Select the best provider for a request
   */
  async selectProvider(request: AIRequest): Promise<AIProvider> {
    // Apply routing rules in priority order
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      if (await this.matchesCondition(request, rule.condition)) {
        return this.applyAction(request, rule.action);
      }
    }

    // Return default provider if no rules match
    return request.provider || this.defaultProvider;
  }

  /**
   * Check if request matches routing condition
   */
  private async matchesCondition(request: AIRequest, condition: AIRoutingCondition): Promise<boolean> {
    // Check request type
    if (condition.requestType && !condition.requestType.includes(request.type)) {
      return false;
    }

    // Check provider
    if (condition.provider && !condition.provider.includes(request.provider)) {
      return false;
    }

    // Check content length
    if (condition.contentLength) {
      const contentLength = request.prompt.length;
      if (condition.contentLength.min && contentLength < condition.contentLength.min) {
        return false;
      }
      if (condition.contentLength.max && contentLength > condition.contentLength.max) {
        return false;
      }
    }

    // Check time of day
    if (condition.timeOfDay) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (currentTime < condition.timeOfDay.start || currentTime > condition.timeOfDay.end) {
        return false;
      }
    }

    // Check user tier (if provided)
    if (condition.userTier && request.userId) {
      // This would typically check user's subscription tier from database
      // For now, we'll assume all users are 'basic'
      const userTier = await this.getUserTier(request.userId);
      if (!condition.userTier.includes(userTier)) {
        return false;
      }
    }

    // Check geography (if provided)
    if (condition.geography) {
      // This would check user's geographic location
      // For now, we'll skip this check
    }

    // Check cost threshold
    if (condition.costThreshold) {
      const estimatedCost = this.estimateRequestCost(request);
      if (estimatedCost > condition.costThreshold) {
        return false;
      }
    }

    return true;
  }

  /**
   * Apply routing action to determine target provider
   */
  private applyAction(request: AIRequest, action: AIRoutingAction): AIProvider {
    // Apply request modifications if specified
    if (action.modifyRequest) {
      action.modifyRequest(request);
    }

    return action.targetProvider;
  }

  /**
   * Add a new routing rule
   */
  addRule(rule: AIRoutingRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove a routing rule
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(rule => rule.id === ruleId);
    if (index > -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update a routing rule
   */
  updateRule(ruleId: string, updates: Partial<AIRoutingRule>): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
      this.rules.sort((a, b) => b.priority - a.priority);
      return true;
    }
    return false;
  }

  /**
   * Get all routing rules
   */
  getRules(): AIRoutingRule[] {
    return [...this.rules];
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): AIRoutingRule | undefined {
    return this.rules.find(rule => rule.id === ruleId);
  }

  /**
   * Enable or disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Get routing statistics
   */
  getStats(): {
    totalRules: number;
    enabledRules: number;
    disabledRules: number;
    rulesByPriority: Array<{ priority: number; count: number }>;
  } {
    const enabled = this.rules.filter(r => r.enabled).length;
    const disabled = this.rules.length - enabled;

    // Group rules by priority
    const priorityGroups = new Map<number, number>();
    for (const rule of this.rules) {
      const count = priorityGroups.get(rule.priority) || 0;
      priorityGroups.set(rule.priority, count + 1);
    }

    const rulesByPriority = Array.from(priorityGroups.entries())
      .map(([priority, count]) => ({ priority, count }))
      .sort((a, b) => b.priority - a.priority);

    return {
      totalRules: this.rules.length,
      enabledRules: enabled,
      disabledRules: disabled,
      rulesByPriority
    };
  }

  /**
   * Set default provider
   */
  setDefaultProvider(provider: AIProvider): void {
    this.defaultProvider = provider;
  }

  /**
   * Get default provider
   */
  getDefaultProvider(): AIProvider {
    return this.defaultProvider;
  }

  /**
   * Test routing for a request without actually routing
   */
  async testRouting(request: AIRequest): Promise<{
    selectedProvider: AIProvider;
    matchedRule?: AIRoutingRule;
    evaluationDetails: Array<{
      ruleId: string;
      ruleName: string;
      matched: boolean;
      reason?: string;
    }>;
  }> {
    const evaluationDetails: Array<{
      ruleId: string;
      ruleName: string;
      matched: boolean;
      reason?: string;
    }> = [];

    let selectedProvider = request.provider || this.defaultProvider;
    let matchedRule: AIRoutingRule | undefined;

    for (const rule of this.rules) {
      if (!rule.enabled) {
        evaluationDetails.push({
          ruleId: rule.id,
          ruleName: rule.name,
          matched: false,
          reason: 'Rule is disabled'
        });
        continue;
      }

      const matches = await this.matchesCondition(request, rule.condition);
      evaluationDetails.push({
        ruleId: rule.id,
        ruleName: rule.name,
        matched: matches,
        reason: matches ? 'Condition matched' : 'Condition not matched'
      });

      if (matches && !matchedRule) {
        matchedRule = rule;
        selectedProvider = rule.action.targetProvider;
      }
    }

    return {
      selectedProvider,
      matchedRule,
      evaluationDetails
    };
  }

  /**
   * Create common routing rules
   */
  static createCommonRules(): AIRoutingRule[] {
    return [
      // Route image analysis to Google
      {
        id: 'image_to_google',
        name: 'Route Image Analysis to Google',
        condition: {
          requestType: ['image_analysis', 'image_generation']
        },
        action: {
          targetProvider: 'google',
          fallbackProviders: ['openai']
        },
        priority: 100,
        enabled: true
      },

      // Route code generation to OpenAI
      {
        id: 'code_to_openai',
        name: 'Route Code Generation to OpenAI',
        condition: {
          requestType: ['code_generation']
        },
        action: {
          targetProvider: 'openai',
          fallbackProviders: ['claude']
        },
        priority: 90,
        enabled: true
      },

      // Route long content to Claude
      {
        id: 'long_content_to_claude',
        name: 'Route Long Content to Claude',
        condition: {
          contentLength: { min: 5000 }
        },
        action: {
          targetProvider: 'claude',
          fallbackProviders: ['openai']
        },
        priority: 80,
        enabled: true
      },

      // Route cheap requests to Azure
      {
        id: 'cheap_to_azure',
        name: 'Route Low-Cost Requests to Azure',
        condition: {
          costThreshold: 0.01
        },
        action: {
          targetProvider: 'azure',
          fallbackProviders: ['openai']
        },
        priority: 70,
        enabled: true
      },

      // Night hours to cheaper providers
      {
        id: 'night_to_azure',
        name: 'Route Night Requests to Azure',
        condition: {
          timeOfDay: { start: '22:00', end: '06:00' }
        },
        action: {
          targetProvider: 'azure',
          fallbackProviders: ['openai']
        },
        priority: 60,
        enabled: true
      }
    ];
  }

  /**
   * Load common routing rules
   */
  loadCommonRules(): void {
    const commonRules = AIRouter.createCommonRules();
    for (const rule of commonRules) {
      this.addRule(rule);
    }
  }

  /**
   * Estimate request cost (simplified calculation)
   */
  private estimateRequestCost(request: AIRequest): number {
    const promptTokens = Math.ceil(request.prompt.length / 4); // Rough token estimation
    const maxTokens = request.options?.maxTokens || 2000;
    
    // Simplified cost calculation based on provider
    const costPer1K = {
      openai: 0.03,
      claude: 0.015,
      google: 0.001,
      azure: 0.02,
      local: 0
    };

    const providerCost = costPer1K[request.provider] || costPer1K.openai;
    return ((promptTokens + maxTokens) / 1000) * providerCost;
  }

  /**
   * Get user tier (mock implementation)
   */
  private async getUserTier(userId: string): Promise<string> {
    // This would typically query the database for user's subscription tier
    // For now, return a default tier
    return 'basic';
  }

  /**
   * Optimize routing rules based on performance data
   */
  async optimizeRules(performanceData: Array<{
    provider: AIProvider;
    responseTime: number;
    errorRate: number;
    cost: number;
  }>): Promise<void> {
    // This would use performance data to automatically adjust routing rules
    // For now, just log the optimization intent
    console.log('Optimizing routing rules based on performance data:', performanceData);
    
    // Example optimization: disable providers with high error rates
    for (const data of performanceData) {
      if (data.errorRate > 0.1) { // 10% error rate threshold
        // Find rules targeting this provider and reduce their priority
        for (const rule of this.rules) {
          if (rule.action.targetProvider === data.provider) {
            rule.priority = Math.max(1, rule.priority - 10);
          }
        }
      }
    }
    
    // Re-sort rules by priority
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Export routing configuration
   */
  exportConfig(): {
    rules: AIRoutingRule[];
    defaultProvider: AIProvider;
    metadata: {
      version: string;
      exportedAt: string;
      totalRules: number;
    };
  } {
    return {
      rules: this.rules,
      defaultProvider: this.defaultProvider,
      metadata: {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        totalRules: this.rules.length
      }
    };
  }

  /**
   * Import routing configuration
   */
  importConfig(config: {
    rules: AIRoutingRule[];
    defaultProvider?: AIProvider;
  }): void {
    this.rules = config.rules.sort((a, b) => b.priority - a.priority);
    if (config.defaultProvider) {
      this.defaultProvider = config.defaultProvider;
    }
  }
}

export default AIRouter;
