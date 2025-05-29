/**
 * AI Business Intelligence Module
 * Unite Group - Advanced Business Analytics and Intelligence
 */

// Export types
export type {
  BusinessMetrics,
  PredictiveAnalysis,
  BusinessRecommendation,
  WorkflowAutomation,
  CustomerIntelligence,
  MarketIntelligence,
  AIBusinessInsight,
  BusinessIntelligenceConfig,
  BusinessIntelligenceResponse,
  BusinessProcessAnalysis,
  WorkflowTrigger,
  WorkflowAction,
  WorkflowCondition,
  MarketTrend,
  MarketThreat,
  MarketOpportunity,
  Competitor,
  ProcessStep,
  ImplementationPhase
} from './types';

// Import types for use in this file
import type {
  BusinessMetrics,
  BusinessRecommendation,
  AIBusinessInsight,
  BusinessIntelligenceConfig
} from './types';

// Export service (only one export declaration)
export { BusinessIntelligenceService } from './service';

// Export default configuration
export const defaultBusinessIntelligenceConfig: BusinessIntelligenceConfig = {
  data_sources: {
    crm_enabled: true,
    analytics_enabled: true,
    financial_enabled: true,
    external_apis: []
  },
  analysis_frequency: {
    metrics_update: 'hourly',
    predictions_update: 'daily',
    insights_generation: 'continuous'
  },
  ai_settings: {
    prediction_models: ['gpt-4', 'claude-3-opus'],
    confidence_threshold: 0.7,
    insight_categories: ['revenue', 'operations', 'customer', 'marketing'],
    auto_action_enabled: false
  },
  notifications: {
    critical_insights: true,
    daily_summary: true,
    weekly_report: true,
    threshold_alerts: true
  },
  permissions: {
    view_insights: ['admin', 'manager', 'analyst'],
    manage_workflows: ['admin', 'manager'],
    configure_ai: ['admin'],
    export_data: ['admin', 'manager']
  }
};

// Export utility functions
export const BusinessIntelligenceUtils = {
  /**
   * Create a business intelligence configuration
   */
  createConfig: (overrides: Partial<BusinessIntelligenceConfig> = {}): BusinessIntelligenceConfig => ({
    ...defaultBusinessIntelligenceConfig,
    ...overrides
  }),

  /**
   * Validate business metrics data
   */
  validateMetrics: (metrics: Partial<BusinessMetrics>): boolean => {
    return !!(metrics.id && metrics.timestamp && metrics.revenue && metrics.clients);
  },

  /**
   * Generate cache key for business intelligence operations
   */
  generateCacheKey: (operation: string, params: Record<string, unknown>): string => {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
      .join('|');
    
    return `business_intelligence:${operation}:${Buffer.from(paramString).toString('base64').slice(0, 32)}`;
  },

  /**
   * Format business insights for display
   */
  formatInsight: (insight: AIBusinessInsight): string => {
    const urgencyEmoji: Record<string, string> = {
      low: '🔵',
      medium: '🟡', 
      high: '🟠',
      critical: '🔴'
    };

    const categoryEmoji: Record<string, string> = {
      revenue: '💰',
      operations: '⚙️',
      marketing: '📢',
      customer: '👥',
      competitive: '🏆'
    };

    const urgencyIcon = urgencyEmoji[insight.urgency] || '⚪';
    const categoryIcon = categoryEmoji[insight.category] || '📊';

    return `${urgencyIcon} ${categoryIcon} **${insight.title}**\n${insight.summary}`;
  },

  /**
   * Calculate confidence score for predictions
   */
  calculateConfidenceScore: (factors: {
    dataQuality: number;
    historicalAccuracy: number;
    modelPerformance: number;
    externalFactors: number;
  }): number => {
    const weights = {
      dataQuality: 0.3,
      historicalAccuracy: 0.25,
      modelPerformance: 0.25,
      externalFactors: 0.2
    };

    return Object.entries(factors).reduce(
      (score, [key, value]) => score + value * weights[key as keyof typeof weights],
      0
    );
  },

  /**
   * Prioritize business recommendations
   */
  prioritizeRecommendations: (recommendations: BusinessRecommendation[]): BusinessRecommendation[] => {
    const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    
    return [...recommendations].sort((a, b) => {
      // First by priority
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by estimated value
      return b.impact.estimated_value - a.impact.estimated_value;
    });
  },

  /**
   * Generate executive summary from multiple insights
   */
  generateExecutiveSummary: (insights: AIBusinessInsight[]): string => {
    const criticalInsights = insights.filter(i => i.urgency === 'critical').length;
    const totalOpportunities = insights.filter(i => i.type === 'opportunity').length;
    const totalRisks = insights.filter(i => i.type === 'risk').length;

    return `Business Intelligence Summary: ${criticalInsights} critical items requiring immediate attention, ${totalOpportunities} growth opportunities identified, ${totalRisks} potential risks detected. Review detailed insights for actionable recommendations.`;
  }
};
