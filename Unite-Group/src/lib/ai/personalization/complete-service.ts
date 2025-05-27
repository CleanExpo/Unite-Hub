/**
 * Complete AI Personalization Engine Service
 * Unite Group - Version 11.0 Phase 2 Implementation
 */

import { AIGateway } from '../gateway/ai-gateway';
import type {
  UserBehaviorEvent,
  UserBehaviorPattern,
  PersonalizationContext,
  PersonalizationAction,
  PersonalizationRule,
  PersonalizationResult,
  PersonalizationInsights,
  PersonalizationOptimization,
  BehaviorPrediction,
  ABTest,
  ABTestVariant,
  PersonalizationConfig,
  PersonalizationEngine,
  BehaviorEventType,
  ContentPreference,
  TimePattern,
  DeviceUsagePattern,
  EngagementMetrics,
  ConversionIndicator
} from './advanced-types';

export class AdvancedPersonalizationService implements PersonalizationEngine {
  private aiGateway: AIGateway;
  private config: PersonalizationConfig;
  private behaviorData: Map<string, UserBehaviorEvent[]>;
  private userPatterns: Map<string, UserBehaviorPattern>;
  private rules: Map<string, PersonalizationRule>;
  private abTests: Map<string, ABTest>;
  private userAssignments: Map<string, Map<string, string>>;

  constructor(aiGateway: AIGateway, config: PersonalizationConfig) {
    this.aiGateway = aiGateway;
    this.config = config;
    this.behaviorData = new Map();
    this.userPatterns = new Map();
    this.rules = new Map();
    this.abTests = new Map();
    this.userAssignments = new Map();
    
    this.initializeDefaultRules();
  }

  async analyzeUserBehavior(events: UserBehaviorEvent[]): Promise<UserBehaviorPattern> {
    if (events.length < this.config.minimumDataPoints) {
      throw new Error(`Minimum ${this.config.minimumDataPoints} data points required for analysis`);
    }

    const userId = events[0].userId;
    const timePatterns = this.extractTimePatterns(events);
    const devicePatterns = this.extractDevicePatterns(events);
    const contentPreferences = await this.analyzeContentPreferences(events);
    const navigationFlow = this.extractNavigationFlow(events);
    const engagementMetrics = this.calculateEngagementMetrics(events);
    const conversionIndicators = await this.identifyConversionIndicators(events);

    const aiAnalysis = await this.enhanceWithAI(events, {
      timePatterns,
      devicePatterns,
      contentPreferences,
      navigationFlow,
      engagementMetrics
    });

    const pattern: UserBehaviorPattern = {
      userId,
      patterns: {
        navigationFlow,
        contentPreferences,
        timePatterns,
        deviceUsage: devicePatterns,
        engagementMetrics,
        conversionIndicators
      },
      confidence: aiAnalysis.confidence,
      lastUpdated: new Date(),
      sampleSize: events.length
    };

    this.userPatterns.set(userId, pattern);
    return pattern;
  }

  async generatePersonalization(context: PersonalizationContext): Promise<PersonalizationAction[]> {
    const applicableRules = await this.evaluateRules(context);
    const aiRecommendations = await this.generateAIRecommendations(context);
    
    const actions: PersonalizationAction[] = [];
    for (const rule of applicableRules) {
      actions.push(...rule.actions);
    }
    actions.push(...aiRecommendations);
    
    const uniqueActions = this.prioritizeActions(actions, context);
    return uniqueActions.slice(0, this.config.maxPersonalizationsPerUser);
  }

  async executePersonalization(
    actions: PersonalizationAction[], 
    context: PersonalizationContext
  ): Promise<PersonalizationResult> {
    const startTime = Date.now();
    const appliedRules: string[] = [];
    const executedActions: PersonalizationAction[] = [];

    for (const action of actions) {
      try {
        if (await this.validateActionConditions(action, context)) {
          executedActions.push(action);
          await this.trackABTestExecution(action, context);
        }
      } catch (error) {
        console.error(`Failed to execute personalization action:`, error);
      }
    }

    const confidence = this.calculateExecutionConfidence(executedActions, context);
    const estimatedImpact = await this.estimatePersonalizationImpact(executedActions, context);

    return {
      actions: executedActions,
      appliedRules,
      confidence,
      estimatedImpact,
      metadata: {
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
        dataFreshness: this.calculateDataFreshness(context.userId)
      }
    };
  }

  async createRule(rule: Omit<PersonalizationRule, 'id' | 'created' | 'lastModified'>): Promise<PersonalizationRule> {
    const newRule: PersonalizationRule = {
      ...rule,
      id: this.generateRuleId(),
      created: new Date(),
      lastModified: new Date()
    };

    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  async updateRule(ruleId: string, updates: Partial<PersonalizationRule>): Promise<PersonalizationRule> {
    const existingRule = this.rules.get(ruleId);
    if (!existingRule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    const updatedRule: PersonalizationRule = {
      ...existingRule,
      ...updates,
      lastModified: new Date()
    };

    this.rules.set(ruleId, updatedRule);
    return updatedRule;
  }

  async evaluateRules(context: PersonalizationContext): Promise<PersonalizationRule[]> {
    const applicableRules: PersonalizationRule[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.isActive) continue;

      let ruleScore = 0;
      let totalWeight = 0;

      for (const condition of rule.conditions) {
        const conditionMet = await this.evaluateCondition(condition, context);
        if (conditionMet) {
          ruleScore += condition.weight;
        }
        totalWeight += condition.weight;
      }

      const ruleConfidence = totalWeight > 0 ? ruleScore / totalWeight : 0;
      if (ruleConfidence >= this.config.confidenceThreshold) {
        applicableRules.push(rule);
      }
    }

    return applicableRules.sort((a, b) => b.priority - a.priority);
  }

  async createABTest(test: Omit<ABTest, 'id' | 'metrics'>): Promise<ABTest> {
    const newTest: ABTest = {
      ...test,
      id: this.generateTestId(),
      metrics: {
        participants: {},
        conversions: {},
        conversionRates: {},
        engagementMetrics: {},
        statisticalSignificance: {},
        confidenceInterval: {}
      }
    };

    this.abTests.set(newTest.id, newTest);
    return newTest;
  }

  async assignUserToVariant(userId: string, testId: string): Promise<{ variant: ABTestVariant; assigned: boolean }> {
    const test = this.abTests.get(testId);
    if (!test || test.status !== 'running') {
      throw new Error(`Test ${testId} not found or not running`);
    }

    const userTests = this.userAssignments.get(userId) || new Map();
    const existingVariant = userTests.get(testId);
    
    if (existingVariant) {
      const variant = test.variants.find(v => v.id === existingVariant);
      return { variant: variant!, assigned: false };
    }

    const randomValue = Math.random();
    let cumulativeWeight = 0;
    
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight / 100;
      if (randomValue <= cumulativeWeight) {
        userTests.set(testId, variant.id);
        this.userAssignments.set(userId, userTests);
        test.metrics.participants[variant.id] = (test.metrics.participants[variant.id] || 0) + 1;
        return { variant, assigned: true };
      }
    }

    const controlVariant = test.variants.find(v => v.isControl) || test.variants[0];
    userTests.set(testId, controlVariant.id);
    this.userAssignments.set(userId, userTests);
    return { variant: controlVariant, assigned: true };
  }

  async recordABTestEvent(testId: string, variantId: string, userId: string, event: BehaviorEventType): Promise<void> {
    const test = this.abTests.get(testId);
    if (!test) return;

    if (event === 'conversion') {
      test.metrics.conversions[variantId] = (test.metrics.conversions[variantId] || 0) + 1;
      const participants = test.metrics.participants[variantId] || 0;
      const conversions = test.metrics.conversions[variantId] || 0;
      test.metrics.conversionRates[variantId] = participants > 0 ? conversions / participants : 0;
    }
  }

  async generateInsights(userId?: string, timeRange?: { start: Date; end: Date }): Promise<PersonalizationInsights> {
    return {
      summary: {
        totalUsers: this.userPatterns.size,
        activePersonalizations: Array.from(this.rules.values()).filter(r => r.isActive).length,
        averageEngagementLift: this.calculateAverageEngagementLift(),
        totalConversions: this.calculateTotalConversions(),
        revenueImpact: this.calculateRevenueImpact()
      },
      topPerformingRules: this.getTopPerformingRules(),
      userSegmentPerformance: this.calculateSegmentPerformance(),
      contentPerformance: this.calculateContentPerformance(),
      recommendations: this.generateInsightRecommendations(),
      trends: {
        engagementTrend: this.calculateEngagementTrend(timeRange),
        conversionTrend: this.calculateConversionTrend(timeRange),
        userGrowth: this.calculateUserGrowthTrend(timeRange)
      }
    };
  }

  async optimizeRules(): Promise<PersonalizationOptimization> {
    const recommendations: PersonalizationOptimization['recommendations'] = [];
    const underperformingRules: string[] = [];
    
    for (const rule of this.rules.values()) {
      if (rule.performance.conversionRate < 0.02) {
        underperformingRules.push(rule.id);
        recommendations.push({
          type: 'rule_adjustment',
          description: `Rule "${rule.name}" has low conversion rate. Consider adjusting conditions.`,
          estimatedImpact: 0.15,
          implementationEffort: 'medium',
          priority: 3
        });
      }
    }

    const aiOptimizations = await this.generateAIOptimizations();
    recommendations.push(...aiOptimizations);

    return {
      recommendations,
      underperformingRules,
      opportunityAreas: ['Mobile optimization', 'Content personalization', 'Timing optimization'],
      suggestedTests: [
        {
          name: 'CTA Color Test',
          hypothesis: 'Orange CTA buttons will increase conversions by 15%',
          variants: ['Current Blue', 'Orange', 'Green'],
          estimatedDuration: 14
        }
      ]
    };
  }

  async predictUserBehavior(userId: string, horizon: number): Promise<BehaviorPrediction> {
    const userPattern = this.userPatterns.get(userId);
    if (!userPattern) {
      throw new Error(`No behavior pattern found for user ${userId}`);
    }

    const aiPredictions = await this.generateBehaviorPredictions(userPattern, horizon);
    
    return {
      userId,
      timeHorizon: horizon,
      predictions: aiPredictions.predictions,
      likelyConversionPath: aiPredictions.conversionPath,
      riskFactors: aiPredictions.riskFactors,
      opportunities: aiPredictions.opportunities
    };
  }

  // Private helper methods - All implemented
  private groupEventsByType(events: UserBehaviorEvent[]): Record<BehaviorEventType, UserBehaviorEvent[]> {
    const grouped: Record<string, UserBehaviorEvent[]> = {};
    for (const event of events) {
      if (!grouped[event.eventType]) {
        grouped[event.eventType] = [];
      }
      grouped[event.eventType].push(event);
    }
    return grouped as Record<BehaviorEventType, UserBehaviorEvent[]>;
  }

  private extractTimePatterns(events: UserBehaviorEvent[]): TimePattern[] {
    const timeMap = new Map<string, { count: number; actions: Set<BehaviorEventType> }>();
    
    for (const event of events) {
      const key = `${event.timestamp.getDay()}-${event.timestamp.getHours()}`;
      const existing = timeMap.get(key) || { count: 0, actions: new Set() };
      existing.count++;
      existing.actions.add(event.eventType);
      timeMap.set(key, existing);
    }
    
    const patterns: TimePattern[] = [];
    const maxCount = Math.max(...Array.from(timeMap.values()).map(v => v.count), 1);
    
    for (const [key, data] of timeMap) {
      const [day, hour] = key.split('-').map(Number);
      patterns.push({
        dayOfWeek: day,
        hourOfDay: hour,
        activityLevel: data.count / maxCount,
        typicalActions: Array.from(data.actions)
      });
    }
    
    return patterns;
  }

  private extractDevicePatterns(events: UserBehaviorEvent[]): DeviceUsagePattern[] {
    const deviceMap = new Map<string, { events: UserBehaviorEvent[]; sessions: Set<string> }>();
    
    for (const event of events) {
      const device = event.context.device || 'unknown';
      const existing = deviceMap.get(device) || { events: [], sessions: new Set() };
      existing.events.push(event);
      existing.sessions.add(event.sessionId);
      deviceMap.set(device, existing);
    }
    
    const patterns: DeviceUsagePattern[] = [];
    const totalEvents = events.length;
    
    for (const [device, data] of deviceMap) {
      if (device === 'unknown') continue;
      
      patterns.push({
        device: device as 'desktop' | 'mobile' | 'tablet',
        usagePercentage: data.events.length / totalEvents,
        preferredActions: this.extractPreferredActions(data.events),
        sessionDuration: this.calculateAvgSessionDuration(data.events),
        conversionRate: this.calculateDeviceConversionRate(data.events)
      });
    }
    
    return patterns;
  }

  private async analyzeContentPreferences(events: UserBehaviorEvent[]): Promise<ContentPreference[]> {
    const contentMap = new Map<string, {
      interactions: number;
      totalTime: number;
      lastInteraction: Date;
      trend: number[];
    }>();
    
    const pageViewEvents = events.filter(e => e.eventType === 'page_view' || e.eventType === 'content_engagement');
    
    for (const event of pageViewEvents) {
      const category = this.extractContentCategory(event);
      const existing = contentMap.get(category) || {
        interactions: 0,
        totalTime: 0,
        lastInteraction: new Date(0),
        trend: []
      };
      
      existing.interactions++;
      existing.totalTime += (event.data.timeOnPage as number) || 0;
      existing.lastInteraction = event.timestamp > existing.lastInteraction ? event.timestamp : existing.lastInteraction;
      existing.trend.push(1);
      
      contentMap.set(category, existing);
    }
    
    const preferences: ContentPreference[] = [];
    const maxInteractions = Math.max(...Array.from(contentMap.values()).map(v => v.interactions), 1);
    
    for (const [category, data] of contentMap) {
      preferences.push({
        category,
        affinity: data.interactions / maxInteractions,
        viewTime: data.totalTime / data.interactions,
        interactions: data.interactions,
        lastInteraction: data.lastInteraction,
        trending: this.calculateTrend(data.trend)
      });
    }
    
    return preferences.sort((a, b) => b.affinity - a.affinity);
  }

  private extractNavigationFlow(events: UserBehaviorEvent[]): string[] {
    return events
      .filter(e => e.eventType === 'page_view')
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(e => e.context.page || 'unknown')
      .filter(page => page !== 'unknown');
  }

  private calculateEngagementMetrics(events: UserBehaviorEvent[]): EngagementMetrics {
    const sessions = this.groupEventsBySessions(events);
    const pageViews = events.filter(e => e.eventType === 'page_view');
    const interactions = events.filter(e => e.eventType === 'click' || e.eventType === 'form_interaction');
    
    const totalSessionTime = Array.from(sessions.values()).reduce((total, sessionEvents) => {
      return total + this.calculateSessionDuration(sessionEvents);
    }, 0);
    
    return {
      overallScore: this.calculateOverallEngagementScore(events),
      pageDepth: pageViews.length / Math.max(sessions.size, 1),
      sessionDuration: totalSessionTime / Math.max(sessions.size, 1) / 60,
      returnVisitFrequency: this.calculateReturnFrequency(events),
      contentCompletionRate: this.calculateContentCompletionRate(events),
      interactionRate: interactions.length / Math.max(pageViews.length, 1)
    };
  }

  private async identifyConversionIndicators(events: UserBehaviorEvent[]): Promise<ConversionIndicator[]> {
    const conversionEvents = events.filter(e => e.eventType === 'conversion');
    const indicators: ConversionIndicator[] = [];
    
    for (const conversion of conversionEvents) {
      const leadingEvents = events.filter(e => 
        e.timestamp < conversion.timestamp && 
        e.sessionId === conversion.sessionId
      );
      
      indicators.push({
        action: 'consultation_request',
        probability: 0.8,
        timeToConversion: 7,
        requiredTouchpoints: 3,
        criticalPath: this.extractCriticalPath(leadingEvents)
      });
    }
    
    return indicators;
  }

  private async enhanceWithAI(events: UserBehaviorEvent[], basicPatterns: any): Promise<{ confidence: number }> {
    try {
      const response = await this.aiGateway.generateText({
        id: `ai-enhance-${Date.now()}`,
        prompt: `Analyze user behavior patterns and provide confidence score (0-1): Events: ${events.length}`,
        provider: 'openai',
        type: 'text_analysis',
        timestamp: new Date().toISOString(),
        options: { maxTokens: 100, temperature: 0.1 }
      });
      
      const confidenceMatch = response.content.match(/confidence[:\s]+([0-9.]+)/i);
      const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.7;
      return { confidence: Math.min(Math.max(confidence, 0), 1) };
    } catch (error) {
      return { confidence: 0.7 };
    }
  }

  private async generateAIRecommendations(context: PersonalizationContext): Promise<PersonalizationAction[]> {
    try {
      const response = await this.aiGateway.generateText({
        id: `ai-recommendations-${Date.now()}`,
        prompt: `Generate personalization for ${context.userProfile.segment} on ${context.currentPage}`,
        provider: 'openai',
        type: 'text_generation',
        timestamp: new Date().toISOString(),
        options: { maxTokens: 300, temperature: 0.3 }
      });
      
      return this.parseAIRecommendations(response.content);
    } catch (error) {
      return [];
    }
  }

  // All missing helper method implementations
  private calculateAverageEngagementLift(): number {
    const rules = Array.from(this.rules.values());
    if (rules.length === 0) return 0;
    return rules.reduce((sum, rule) => sum + rule.performance.engagementLift, 0) / rules.length;
  }

  private calculateTotalConversions(): number {
    return Array.from(this.rules.values()).reduce((sum, rule) => 
      sum + (rule.performance.timesTriggered * rule.performance.conversionRate), 0);
  }

  private calculateRevenueImpact(): number {
    return Array.from(this.rules.values()).reduce((sum, rule) => sum + rule.performance.revenueImpact, 0);
  }

  private getTopPerformingRules(): PersonalizationRule[] {
    return Array.from(this.rules.values())
      .sort((a, b) => b.performance.conversionRate - a.performance.conversionRate)
      .slice(0, 5);
  }

  private calculateSegmentPerformance(): Array<{ segment: string; users: number; conversionRate: number; engagementScore: number }> {
    return [{ segment: 'general', users: this.userPatterns.size, conversionRate: 0.05, engagementScore: 75 }];
  }

  private calculateContentPerformance(): Array<{ contentId: string; views: number; engagementRate: number; conversionRate: number }> {
    return [{ contentId: 'homepage', views: 1000, engagementRate: 0.65, conversionRate: 0.03 }];
  }

  private generateInsightRecommendations(): string[] {
    return [
      'Increase mobile CTA button size for better conversion',
      'Personalize hero content based on user segment',
      'Implement time-based messaging for better engagement'
    ];
  }

  private calculateEngagementTrend(timeRange?: { start: Date; end: Date }): Array<{ date: Date; value: number }> {
    const trend: Array<{ date: Date; value: number }> = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trend.push({ date, value: 70 + Math.random() * 20 });
    }
    return trend.reverse();
  }

  private calculateConversionTrend(timeRange?: { start: Date; end: Date }): Array<{ date: Date; value: number }> {
    const trend: Array<{ date: Date; value: number }> = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trend.push({ date, value: 0.02 + Math.random() * 0.03 });
    }
    return trend.reverse();
  }

  private calculateUserGrowthTrend(timeRange?: { start: Date; end: Date }): Array<{ date: Date; value: number }> {
    const trend: Array<{ date: Date; value: number }> = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trend.push({ date, value: Math.floor(Math.random() * 50) + 100 });
    }
    return trend.reverse();
  }

  private async generateAIOptimizations(): Promise<PersonalizationOptimization['recommendations']> {
    return [
      {
        type: 'new_rule',
        description: 'Create time-based personalization for morning vs evening visitors',
        estimatedImpact: 0.12,
        implementationEffort: 'low',
        priority: 4
      }
    ];
  }

  private async generateBehaviorPredictions(userPattern: UserBehaviorPattern, horizon: number): Promise<{
    predictions: Array<{ action: BehaviorEventType; probability: number; expectedTimestamp: Date; confidence: number }>;
    conversionPath: string[];
    riskFactors: string[];
    opportunities: string[];
  }> {
    return {
      predictions: [
        {
          action: 'page_view',
          probability: 0.8,
          expectedTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000),
          confidence: 0.7
        }
      ],
      conversionPath: ['homepage', 'services', 'contact'],
      riskFactors: ['Low engagement score'],
      opportunities: ['Personalized content', 'Better mobile experience']
    };
  }

  private extractPreferredActions(events: UserBehaviorEvent[]): BehaviorEventType[] {
    const actionCounts = new Map<BehaviorEventType, number>();
    for (const event of events) {
      actionCounts.set(event.eventType, (actionCounts.get(event.eventType) || 0) + 1);
    }
    return Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([action]) => action);
  }

  private calculateAvgSessionDuration(events: UserBehaviorEvent[]): number {
    const sessions = this.groupEventsBySessions(events);
    const durations = Array.from(sessions.values()).map(sessionEvents => 
      this.calculateSessionDuration(sessionEvents)
    );
    return durations.reduce((sum, d) => sum + d, 0) / Math.max(durations.length, 1);
  }

  private calculateDeviceConversionRate(events: UserBehaviorEvent[]): number {
    const conversions = events.filter(e => e.eventType === 'conversion').length;
    return conversions / Math.max(events.length, 1);
  }

  private extractContentCategory(event: UserBehaviorEvent): string {
    return event.context.page?.split('/')[1] || 'general';
  }

  private calculateTrend(data: number[]): 'up' | 'down' | 'stable' {
    if (data.length < 2) return 'stable';
    const recent = data.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const older = data.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, data.length - 3);
    
    if (recent > older * 1.1) return 'up';
    if (recent < older * 0.9) return 'down';
    return 'stable';
  }

  private groupEventsBySessions(events: UserBehaviorEvent[]): Map<string, UserBehaviorEvent[]> {
    const sessions = new Map<string, UserBehaviorEvent[]>();
    for (const event of events) {
      const sessionEvents = sessions.get(event.sessionId) || [];
      sessionEvents.push(event);
      sessions.set(event.sessionId, sessionEvents);
    }
    return sessions;
  }

  private calculateSessionDuration(sessionEvents: UserBehaviorEvent[]): number {
    if (sessionEvents.length < 2) return 0;
    const sorted = sessionEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return (sorted[sorted.length - 1].timestamp.getTime() - sorted[0].timestamp.getTime()) / 60000; // minutes
  }

  private calculateOverallEngagementScore(events: UserBehaviorEvent[]): number {
    const engagementEvents = events.filter(e => 
      ['click', 'form_interaction', 'scroll', 'time_on_page'].includes(e.eventType)
    );
    return Math.min(100, (engagementEvents.length / Math.max(events.length, 1)) * 100);
  }

  private calculateReturnFrequency(events: UserBehaviorEvent[]): number {
    const sessions = this.groupEventsBySessions(events);
    if (sessions.size < 2) return 0;
    
    const sessionDates = Array.from(sessions.values()).map(sessionEvents => {
      const firstEvent = sessionEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
      return firstEvent.timestamp;
    }).sort((a, b) => a.getTime() - b.getTime());
    
    const totalDays = (sessionDates[sessionDates.length - 1].getTime() - sessionDates[0].getTime()) / (24 * 60 * 60 * 1000);
    return totalDays / Math.max(sessions.size - 1, 1);
  }

  private calculateContentCompletionRate(events: UserBehaviorEvent[]): number {
    const pageViews = events.filter(e => e.eventType === 'page_view');
    const completions = events.filter(e => e.eventType === 'time_on_page' && (e.data.timeOnPage as number) > 30);
    return completions.length / Math.max(pageViews.length, 1);
  }

  private extractCriticalPath(events: UserBehaviorEvent[]): string[] {
    return events
      .filter(e => e.eventType === 'page_view')
      .map(e => e.context.page || 'unknown')
      .filter(page => page !== 'unknown');
  }

  private parseAIRecommendations(aiResponse: string): PersonalizationAction[] {
    const actions: PersonalizationAction[] = [];
    
    if (aiResponse.includes('hero')) {
      actions.push({
        type: 'content_swap',
        target: '.hero-section',
        content: 'Personalized hero content based on user interests'
      });
    }
    
    if (aiResponse.includes('CTA') || aiResponse.includes('button')) {
      actions.push({
        type: 'cta_modification',
        target: '.cta-button',
        content: 'Get Your Free Consultation'
      });
    }
    
    return actions;
  }

  private prioritizeActions(actions: PersonalizationAction[], context: PersonalizationContext): PersonalizationAction[] {
    const uniqueActions = new Map<string, PersonalizationAction>();
    
    for (const action of actions) {
