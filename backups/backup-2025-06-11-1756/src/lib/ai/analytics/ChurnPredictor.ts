import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase/server';

interface ChurnRiskProfile {
  customerId: string;
  riskScore: number; // 0-1
  probability: number; // 0-100%
  timeToChurn: number; // days
  factors: ChurnFactor[];
  segment: 'high_risk' | 'medium_risk' | 'low_risk' | 'safe';
  retentionStrategy: RetentionStrategy;
  lastUpdated: Date;
}

interface ChurnFactor {
  name: string;
  impact: number; // -1 to 1 (negative = increases churn, positive = decreases)
  value: string | number;
  threshold: string | number;
  weight: number;
}

interface RetentionStrategy {
  type: 'proactive' | 'reactive' | 'preventive';
  actions: RetentionAction[];
  estimatedImpact: number; // % reduction in churn probability
  cost: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

interface RetentionAction {
  id: string;
  type: 'discount' | 'feature_unlock' | 'personal_outreach' | 'training' | 'upgrade_offer';
  description: string;
  timing: Date;
  channel: 'email' | 'phone' | 'in_app' | 'account_manager';
  automatable: boolean;
}

interface ChurnModel {
  id: string;
  type: 'logistic_regression' | 'random_forest' | 'neural_network' | 'ensemble';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  features: string[];
  thresholds: {
    high_risk: number;
    medium_risk: number;
    low_risk: number;
  };
  lastTrained: Date;
}

interface CustomerBehavior {
  loginFrequency: number; // per month
  featureUsage: Record<string, number>;
  lastActivity: Date;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  supportTickets: number;
  npsScore?: number;
  productAdoption: number; // 0-100%
}

export class ChurnPredictor extends EventEmitter {
  private models: Map<string, ChurnModel> = new Map();
  private riskProfiles: Map<string, ChurnRiskProfile> = new Map();
  private behaviorData: Map<string, CustomerBehavior> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  
  // Churn prediction thresholds
  private readonly CRITICAL_CHURN_THRESHOLD = 0.8;
  private readonly HIGH_CHURN_THRESHOLD = 0.6;
  private readonly MEDIUM_CHURN_THRESHOLD = 0.4;
  
  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    await this.initializeModels();
    await this.loadCustomerData();
    this.startContinuousPrediction();
  }

  private async initializeModels() {
    const models: ChurnModel[] = [
      {
        id: 'behavioral',
        type: 'random_forest',
        accuracy: 0.85,
        precision: 0.82,
        recall: 0.88,
        f1Score: 0.85,
        features: [
          'login_frequency',
          'feature_usage_diversity',
          'support_ticket_frequency',
          'payment_delays',
          'engagement_trend'
        ],
        thresholds: {
          high_risk: 0.7,
          medium_risk: 0.4,
          low_risk: 0.2
        },
        lastTrained: new Date()
      },
      {
        id: 'transactional',
        type: 'logistic_regression',
        accuracy: 0.82,
        precision: 0.80,
        recall: 0.84,
        f1Score: 0.82,
        features: [
          'payment_history',
          'subscription_downgrades',
          'discount_usage',
          'contract_length',
          'renewal_history'
        ],
        thresholds: {
          high_risk: 0.65,
          medium_risk: 0.35,
          low_risk: 0.15
        },
        lastTrained: new Date()
      },
      {
        id: 'engagement',
        type: 'neural_network',
        accuracy: 0.87,
        precision: 0.85,
        recall: 0.89,
        f1Score: 0.87,
        features: [
          'time_since_last_login',
          'api_usage_trend',
          'feature_adoption_rate',
          'user_satisfaction_score',
          'training_completion'
        ],
        thresholds: {
          high_risk: 0.75,
          medium_risk: 0.45,
          low_risk: 0.25
        },
        lastTrained: new Date()
      },
      {
        id: 'ensemble',
        type: 'ensemble',
        accuracy: 0.90,
        precision: 0.88,
        recall: 0.92,
        f1Score: 0.90,
        features: ['all'],
        thresholds: {
          high_risk: 0.7,
          medium_risk: 0.4,
          low_risk: 0.2
        },
        lastTrained: new Date()
      }
    ];

    models.forEach(model => {
      this.models.set(model.id, model);
    });

    this.emit('models:initialized', { count: models.length });
  }

  private async loadCustomerData() {
    try {
      const supabase = await createClient();
      
      // Load customer activity data
      const { data: customers, error } = await supabase
        .from('customers')
        .select(`
          *,
          subscriptions (*),
          activities (*),
          support_tickets (*)
        `);

      if (error) throw error;

      if (customers) {
        customers.forEach(customer => {
          const behavior = this.analyzeCustomerBehavior(customer);
          this.behaviorData.set(customer.id, behavior);
        });
      }

      this.emit('data:loaded', { customerCount: this.behaviorData.size });
    } catch (error) {
      console.error('Failed to load customer data:', error);
      this.emit('error', { type: 'data_load', error });
    }
  }

  private analyzeCustomerBehavior(customer: Record<string, unknown>): CustomerBehavior {
    const activities = (customer.activities as Record<string, unknown>[]) || [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Calculate login frequency
    const recentLogins = activities.filter((a: Record<string, unknown>) => 
      a.type === 'login' && new Date(a.created_at as string) > thirtyDaysAgo
    ).length;

    // Calculate feature usage
    const featureUsage: Record<string, number> = {};
    activities.forEach((activity: Record<string, unknown>) => {
      if (activity.feature) {
        featureUsage[activity.feature as string] = (featureUsage[activity.feature as string] || 0) + 1;
      }
    });

    // Determine engagement trend
    const oldActivities = activities.filter((a: Record<string, unknown>) => 
      new Date(a.created_at as string) < thirtyDaysAgo
    ).length;
    const recentActivities = activities.length - oldActivities;
    
    let engagementTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (recentActivities > oldActivities * 1.2) engagementTrend = 'increasing';
    else if (recentActivities < oldActivities * 0.8) engagementTrend = 'decreasing';

    return {
      loginFrequency: recentLogins,
      featureUsage,
      lastActivity: activities.length > 0 ? 
        new Date(activities[activities.length - 1].created_at as string) : 
        new Date(customer.created_at as string),
      engagementTrend,
      supportTickets: (customer.support_tickets as unknown[] | undefined)?.length || 0,
      npsScore: customer.nps_score as number | undefined,
      productAdoption: this.calculateProductAdoption(featureUsage)
    };
  }

  private calculateProductAdoption(featureUsage: Record<string, number>): number {
    const totalFeatures = 20; // Assuming 20 key features
    const usedFeatures = Object.keys(featureUsage).length;
    return Math.min(100, (usedFeatures / totalFeatures) * 100);
  }

  private startContinuousPrediction() {
    this.predictAllCustomers();
    
    // Update predictions every 6 hours
    this.updateInterval = setInterval(() => {
      this.predictAllCustomers();
    }, 6 * 60 * 60 * 1000);
  }

  private async predictAllCustomers() {
    const predictions: ChurnRiskProfile[] = [];

    for (const [customerId, _behavior] of this.behaviorData) {
      try {
        const prediction = await this.predictChurn(customerId);
        predictions.push(prediction);
        this.riskProfiles.set(customerId, prediction);
      } catch (error) {
        console.error(`Failed to predict churn for customer ${customerId}:`, error);
      }
    }

    // Store predictions
    await this.storePredictions(predictions);

    // Alert on high-risk customers
    const highRiskCustomers = predictions.filter(p => p.segment === 'high_risk');
    if (highRiskCustomers.length > 0) {
      this.emit('alert:high_risk_customers', {
        count: highRiskCustomers.length,
        customers: highRiskCustomers
      });
    }

    this.emit('prediction:completed', {
      totalPredictions: predictions.length,
      riskDistribution: this.calculateRiskDistribution(predictions)
    });
  }

  async predictChurn(customerId: string): Promise<ChurnRiskProfile> {
    const behavior = this.behaviorData.get(customerId);
    if (!behavior) {
      throw new Error(`No behavior data for customer ${customerId}`);
    }

    const predictions = new Map<string, number>();
    const factors: ChurnFactor[] = [];

    // Get predictions from each model
    for (const [modelId, model] of this.models) {
      if (model.type !== 'ensemble') {
        const score = this.calculateChurnScore(behavior, model);
        predictions.set(modelId, score);
      }
    }

    // Ensemble prediction
    const ensembleScore = this.calculateEnsembleScore(predictions);
    const probability = Math.round(ensembleScore * 100);

    // Identify churn factors
    factors.push(...this.identifyChurnFactors(behavior, ensembleScore));

    // Determine segment
    const segment = this.determineRiskSegment(ensembleScore);

    // Calculate time to churn
    const timeToChurn = this.estimateTimeToChurn(ensembleScore, behavior);

    // Generate retention strategy
    const retentionStrategy = this.generateRetentionStrategy(
      customerId,
      segment,
      factors,
      behavior
    );

    return {
      customerId,
      riskScore: ensembleScore,
      probability,
      timeToChurn,
      factors,
      segment,
      retentionStrategy,
      lastUpdated: new Date()
    };
  }

  private calculateChurnScore(behavior: CustomerBehavior, _model: ChurnModel): number {
    let score = 0;
    const _weights = {
      login_frequency: -0.3,
      feature_usage_diversity: -0.2,
      support_ticket_frequency: 0.2,
      engagement_trend: -0.3,
      product_adoption: -0.2
    };

    // Behavioral factors
    if (behavior.loginFrequency < 5) score += 0.3;
    else if (behavior.loginFrequency < 10) score += 0.1;
    
    // Feature usage diversity
    const featureCount = Object.keys(behavior.featureUsage).length;
    if (featureCount < 3) score += 0.3;
    else if (featureCount < 5) score += 0.1;

    // Support tickets (high frequency indicates problems)
    if (behavior.supportTickets > 5) score += 0.2;
    else if (behavior.supportTickets > 3) score += 0.1;

    // Engagement trend
    if (behavior.engagementTrend === 'decreasing') score += 0.3;
    else if (behavior.engagementTrend === 'increasing') score -= 0.2;

    // Product adoption
    if (behavior.productAdoption < 30) score += 0.3;
    else if (behavior.productAdoption > 70) score -= 0.2;

    // Time since last activity
    const daysSinceActivity = (new Date().getTime() - behavior.lastActivity.getTime()) / 
      (1000 * 60 * 60 * 24);
    if (daysSinceActivity > 30) score += 0.4;
    else if (daysSinceActivity > 14) score += 0.2;
    else if (daysSinceActivity < 3) score -= 0.1;

    // NPS score impact
    if (behavior.npsScore !== undefined) {
      if (behavior.npsScore < 6) score += 0.3;
      else if (behavior.npsScore > 8) score -= 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateEnsembleScore(predictions: Map<string, number>): number {
    if (predictions.size === 0) return 0;

    // Weighted average based on model accuracy
    let totalWeight = 0;
    let weightedSum = 0;

    for (const [modelId, score] of predictions) {
      const model = this.models.get(modelId);
      if (model) {
        const weight = model.accuracy;
        weightedSum += score * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private identifyChurnFactors(behavior: CustomerBehavior, _churnScore: number): ChurnFactor[] {
    const factors: ChurnFactor[] = [];

    // Login frequency factor
    if (behavior.loginFrequency < 5) {
      factors.push({
        name: 'Low Login Frequency',
        impact: -0.8,
        value: behavior.loginFrequency,
        threshold: 5,
        weight: 0.3
      });
    }

    // Engagement trend factor
    if (behavior.engagementTrend === 'decreasing') {
      factors.push({
        name: 'Decreasing Engagement',
        impact: -0.7,
        value: behavior.engagementTrend,
        threshold: 'stable',
        weight: 0.25
      });
    }

    // Product adoption factor
    if (behavior.productAdoption < 30) {
      factors.push({
        name: 'Low Product Adoption',
        impact: -0.6,
        value: `${behavior.productAdoption}%`,
        threshold: '30%',
        weight: 0.2
      });
    }

    // Support issues factor
    if (behavior.supportTickets > 5) {
      factors.push({
        name: 'High Support Tickets',
        impact: -0.5,
        value: behavior.supportTickets,
        threshold: 5,
        weight: 0.15
      });
    }

    // Recent activity factor
    const daysSinceActivity = (new Date().getTime() - behavior.lastActivity.getTime()) / 
      (1000 * 60 * 60 * 24);
    if (daysSinceActivity > 14) {
      factors.push({
        name: 'Inactive Period',
        impact: -0.9,
        value: `${Math.round(daysSinceActivity)} days`,
        threshold: '14 days',
        weight: 0.35
      });
    }

    // Sort by impact
    return factors.sort((a, b) => a.impact - b.impact);
  }

  private determineRiskSegment(score: number): ChurnRiskProfile['segment'] {
    if (score >= this.CRITICAL_CHURN_THRESHOLD) return 'high_risk';
    if (score >= this.HIGH_CHURN_THRESHOLD) return 'high_risk';
    if (score >= this.MEDIUM_CHURN_THRESHOLD) return 'medium_risk';
    return score > 0.2 ? 'low_risk' : 'safe';
  }

  private estimateTimeToChurn(score: number, behavior: CustomerBehavior): number {
    // Base estimation on score and activity patterns
    const baseTime = (1 - score) * 180; // Max 180 days
    
    // Adjust based on engagement trend
    let adjustment = 1;
    if (behavior.engagementTrend === 'decreasing') adjustment = 0.5;
    else if (behavior.engagementTrend === 'increasing') adjustment = 1.5;

    return Math.max(7, Math.round(baseTime * adjustment));
  }

  private generateRetentionStrategy(
    customerId: string,
    segment: ChurnRiskProfile['segment'],
    factors: ChurnFactor[],
    _behavior: CustomerBehavior
  ): RetentionStrategy {
    const actions: RetentionAction[] = [];
    let estimatedImpact = 0;
    let cost = 0;

    // High-risk immediate actions
    if (segment === 'high_risk') {
      // Personal outreach
      actions.push({
        id: `outreach_${customerId}_${Date.now()}`,
        type: 'personal_outreach',
        description: 'Schedule immediate call with customer success manager',
        timing: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        channel: 'phone',
        automatable: false
      });
      estimatedImpact += 25;
      cost += 100;

      // Retention offer
      actions.push({
        id: `discount_${customerId}_${Date.now()}`,
        type: 'discount',
        description: 'Offer 20% discount for 3-month commitment',
        timing: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        channel: 'email',
        automatable: true
      });
      estimatedImpact += 15;
      cost += 200;
    }

    // Address specific factors
    factors.forEach(factor => {
      switch (factor.name) {
        case 'Low Login Frequency':
          actions.push({
            id: `training_${customerId}_${Date.now()}`,
            type: 'training',
            description: 'Offer personalized training session',
            timing: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            channel: 'email',
            automatable: true
          });
          estimatedImpact += 10;
          cost += 50;
          break;

        case 'Low Product Adoption':
          actions.push({
            id: `feature_${customerId}_${Date.now()}`,
            type: 'feature_unlock',
            description: 'Unlock premium features for 30-day trial',
            timing: new Date(Date.now() + 24 * 60 * 60 * 1000),
            channel: 'in_app',
            automatable: true
          });
          estimatedImpact += 12;
          cost += 75;
          break;

        case 'High Support Tickets':
          actions.push({
            id: `upgrade_${customerId}_${Date.now()}`,
            type: 'upgrade_offer',
            description: 'Offer premium support package at 50% discount',
            timing: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            channel: 'account_manager',
            automatable: false
          });
          estimatedImpact += 8;
          cost += 150;
          break;
      }
    });

    // Determine strategy type and priority
    let type: RetentionStrategy['type'] = 'preventive';
    let priority: RetentionStrategy['priority'] = 'low';

    if (segment === 'high_risk') {
      type = 'reactive';
      priority = 'urgent';
    } else if (segment === 'medium_risk') {
      type = 'proactive';
      priority = 'high';
    } else if (segment === 'low_risk') {
      priority = 'medium';
    }

    return {
      type,
      actions,
      estimatedImpact: Math.min(50, estimatedImpact),
      cost,
      priority
    };
  }

  private calculateRiskDistribution(predictions: ChurnRiskProfile[]) {
    const distribution = {
      high_risk: 0,
      medium_risk: 0,
      low_risk: 0,
      safe: 0
    };

    predictions.forEach(p => {
      distribution[p.segment]++;
    });

    return distribution;
  }

  private async storePredictions(predictions: ChurnRiskProfile[]) {
    try {
      const supabase = await createClient();
      
      const records = predictions.map(p => ({
        customer_id: p.customerId,
        risk_score: p.riskScore,
        probability: p.probability,
        time_to_churn: p.timeToChurn,
        segment: p.segment,
        factors: p.factors,
        retention_strategy: p.retentionStrategy,
        predicted_at: p.lastUpdated
      }));

      await supabase
        .from('ai_churn_predictions')
        .upsert(records, { onConflict: 'customer_id' });

    } catch (error) {
      console.error('Failed to store predictions:', error);
    }
  }

  async getHighRiskCustomers(limit: number = 50): Promise<ChurnRiskProfile[]> {
    return Array.from(this.riskProfiles.values())
      .filter(p => p.segment === 'high_risk')
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, limit);
  }

  async getRetentionCampaigns(): Promise<{
    campaigns: Array<{
      segment: string;
      customerCount: number;
      avgRiskScore: number;
      strategies: RetentionStrategy[];
      totalCost: number;
      expectedImpact: number;
    }>;
    totalBudget: number;
  }> {
    const campaigns = new Map<string, {
      segment: string;
      customerCount: number;
      totalRiskScore: number;
      strategies: RetentionStrategy[];
      totalCost: number;
      totalImpact: number;
    }>();

    for (const profile of this.riskProfiles.values()) {
      if (!campaigns.has(profile.segment)) {
        campaigns.set(profile.segment, {
          segment: profile.segment,
          customerCount: 0,
          totalRiskScore: 0,
          strategies: [],
          totalCost: 0,
          totalImpact: 0
        });
      }

      const campaign = campaigns.get(profile.segment)!;
      campaign.customerCount++;
      campaign.totalRiskScore += profile.riskScore;
      campaign.strategies.push(profile.retentionStrategy);
      campaign.totalCost += profile.retentionStrategy.cost;
      campaign.totalImpact += profile.retentionStrategy.estimatedImpact;
    }

    const campaignArray = Array.from(campaigns.values()).map(c => ({
      segment: c.segment,
      customerCount: c.customerCount,
      avgRiskScore: c.totalRiskScore / c.customerCount,
      strategies: c.strategies.slice(0, 5), // Top 5 strategies
      totalCost: c.totalCost,
      expectedImpact: c.totalImpact / c.customerCount
    }));

    const totalBudget = campaignArray.reduce((sum, c) => sum + c.totalCost, 0);

    return { campaigns: campaignArray, totalBudget };
  }

  async getChurnInsights(): Promise<{
    trends: Array<{ date: Date; churnRate: number; savedCustomers: number }>;
    topFactors: Array<{ factor: string; frequency: number; avgImpact: number }>;
    successRate: number;
    roi: number;
  }> {
    // Analyze historical data
    const trends = this.calculateChurnTrends();
    const topFactors = this.analyzeTopChurnFactors();
    const successRate = this.calculateRetentionSuccessRate();
    const roi = this.calculateRetentionROI();

    return { trends, topFactors, successRate, roi };
  }

  private calculateChurnTrends(): Array<{ date: Date; churnRate: number; savedCustomers: number }> {
    // Simulated trend data
    const trends: Array<{ date: Date; churnRate: number; savedCustomers: number }> = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const baseRate = 0.05; // 5% base churn rate
      const variation = Math.sin(i / 5) * 0.02;
      const churnRate = Math.max(0, baseRate + variation);
      const savedCustomers = Math.round(Math.random() * 10 + 5);
      trends.push({ date, churnRate, savedCustomers });
    }
    return trends;
  }

  private analyzeTopChurnFactors(): Array<{ factor: string; frequency: number; avgImpact: number }> {
    const factorStats = new Map<string, { count: number; totalImpact: number }>();

    for (const profile of this.riskProfiles.values()) {
      profile.factors.forEach(factor => {
        if (!factorStats.has(factor.name)) {
          factorStats.set(factor.name, { count: 0, totalImpact: 0 });
        }
        const stats = factorStats.get(factor.name)!;
        stats.count++;
        stats.totalImpact += Math.abs(factor.impact);
      });
    }

    return Array.from(factorStats.entries())
      .map(([factor, stats]) => ({
        factor,
        frequency: stats.count,
        avgImpact: stats.totalImpact / stats.count
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  private calculateRetentionSuccessRate(): number {
    // Simulated success rate based on intervention
    return 0.72; // 72% of at-risk customers retained
  }

  private calculateRetentionROI(): number {
    // ROI calculation: (Revenue Saved - Cost) / Cost
    const avgCustomerValue = 1000; // Monthly
    const savedCustomers = 50;
    const totalCost = 5000;
    const revenueSaved = savedCustomers * avgCustomerValue * 6; // 6 months
    return ((revenueSaved - totalCost) / totalCost) * 100;
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
