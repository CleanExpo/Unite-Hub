/**
 * Customer Journey Analyzer
 * 
 * Analyzes customer interactions and journey patterns to provide
 * insights for business optimization and customer experience improvement.
 */

export interface CustomerTouchpoint {
  id: string;
  timestamp: Date;
  channel: 'website' | 'email' | 'phone' | 'chat' | 'social' | 'in-person';
  action: string;
  page?: string;
  duration?: number;
  outcome?: 'positive' | 'negative' | 'neutral';
  metadata?: Record<string, any>;
}

export interface CustomerJourney {
  customerId: string;
  startDate: Date;
  endDate?: Date;
  touchpoints: CustomerTouchpoint[];
  stage: 'awareness' | 'consideration' | 'decision' | 'retention' | 'advocacy';
  conversionEvents: string[];
  totalValue?: number;
}

export interface JourneyAnalytics {
  totalJourneys: number;
  averageJourneyLength: number;
  conversionRate: number;
  dropoffPoints: Array<{
    stage: string;
    dropoffRate: number;
    commonReasons: string[];
  }>;
  topChannels: Array<{
    channel: string;
    usage: number;
    conversionRate: number;
  }>;
  stageMetrics: Record<string, {
    averageDuration: number;
    conversionRate: number;
    commonActions: string[];
  }>;
}

export interface CustomerSegment {
  id: string;
  name: string;
  criteria: Record<string, any>;
  journeyPatterns: {
    commonPaths: string[][];
    averageValue: number;
    preferredChannels: string[];
  };
}

export class CustomerJourneyAnalyzer {
  private journeys: CustomerJourney[] = [];
  private segments: CustomerSegment[] = [];

  constructor(journeys: CustomerJourney[] = []) {
    this.journeys = journeys;
  }

  /**
   * Add a new customer journey to the analyzer
   */
  addJourney(journey: CustomerJourney): void {
    this.journeys.push(journey);
  }

  /**
   * Add multiple journeys at once
   */
  addJourneys(journeys: CustomerJourney[]): void {
    this.journeys.push(...journeys);
  }

  /**
   * Analyze all customer journeys and return comprehensive analytics
   */
  analyzeJourneys(): JourneyAnalytics {
    if (this.journeys.length === 0) {
      return this.getEmptyAnalytics();
    }

    const totalJourneys = this.journeys.length;
    const averageJourneyLength = this.calculateAverageJourneyLength();
    const conversionRate = this.calculateOverallConversionRate();
    const dropoffPoints = this.identifyDropoffPoints();
    const topChannels = this.analyzeChannelPerformance();
    const stageMetrics = this.calculateStageMetrics();

    return {
      totalJourneys,
      averageJourneyLength,
      conversionRate,
      dropoffPoints,
      topChannels,
      stageMetrics
    };
  }

  /**
   * Identify common journey paths
   */
  identifyCommonPaths(minOccurrences: number = 3): string[][] {
    const pathCounts = new Map<string, number>();

    this.journeys.forEach(journey => {
      const path = journey.touchpoints
        .map(tp => `${tp.channel}:${tp.action}`)
        .join(' -> ');
      
      pathCounts.set(path, (pathCounts.get(path) || 0) + 1);
    });

    return Array.from(pathCounts.entries())
      .filter(([_, count]) => count >= minOccurrences)
      .sort((a, b) => b[1] - a[1])
      .map(([path, _]) => path.split(' -> '));
  }

  /**
   * Segment customers based on journey patterns
   */
  segmentCustomers(): CustomerSegment[] {
    const segments: CustomerSegment[] = [];

    // High-value customers
    const highValueJourneys = this.journeys.filter(j => (j.totalValue || 0) > 1000);
    if (highValueJourneys.length > 0) {
      segments.push(this.createSegment('high-value', highValueJourneys));
    }

    // Quick converters
    const quickConverters = this.journeys.filter(j => 
      j.touchpoints.length <= 3 && j.conversionEvents.length > 0
    );
    if (quickConverters.length > 0) {
      segments.push(this.createSegment('quick-converters', quickConverters));
    }

    // Research-heavy customers
    const researchHeavy = this.journeys.filter(j => 
      j.touchpoints.length > 10 && j.stage === 'consideration'
    );
    if (researchHeavy.length > 0) {
      segments.push(this.createSegment('research-heavy', researchHeavy));
    }

    this.segments = segments;
    return segments;
  }

  /**
   * Predict customer behavior based on current journey state
   */
  predictNextAction(customerId: string): {
    likelyActions: Array<{ action: string; probability: number }>;
    recommendedChannels: string[];
    riskOfChurn: number;
  } {
    const customerJourney = this.journeys.find(j => j.customerId === customerId);
    
    if (!customerJourney) {
      return {
        likelyActions: [],
        recommendedChannels: [],
        riskOfChurn: 0
      };
    }

    const similarJourneys = this.findSimilarJourneys(customerJourney);
    const likelyActions = this.calculateActionProbabilities(similarJourneys);
    const recommendedChannels = this.getRecommendedChannels(customerJourney);
    const riskOfChurn = this.calculateChurnRisk(customerJourney);

    return {
      likelyActions,
      recommendedChannels,
      riskOfChurn
    };
  }

  /**
   * Generate insights and recommendations
   */
  generateInsights(): {
    insights: string[];
    recommendations: string[];
    opportunities: string[];
  } {
    const analytics = this.analyzeJourneys();
    const insights: string[] = [];
    const recommendations: string[] = [];
    const opportunities: string[] = [];

    // Conversion rate insights
    if (analytics.conversionRate < 0.1) {
      insights.push('Low conversion rate detected - significant optimization opportunity');
      recommendations.push('Focus on reducing friction in the decision stage');
    }

    // Channel performance insights
    const topChannel = analytics.topChannels[0];
    if (topChannel) {
      insights.push(`${topChannel.channel} is the highest performing channel`);
      if (topChannel.conversionRate > 0.2) {
        recommendations.push(`Increase investment in ${topChannel.channel} channel`);
      }
    }

    // Dropoff analysis
    const highestDropoff = analytics.dropoffPoints
      .sort((a, b) => b.dropoffRate - a.dropoffRate)[0];
    
    if (highestDropoff && highestDropoff.dropoffRate > 0.3) {
      insights.push(`High dropoff rate in ${highestDropoff.stage} stage`);
      recommendations.push(`Investigate and optimize ${highestDropoff.stage} stage experience`);
      opportunities.push(`Reducing ${highestDropoff.stage} dropoff could increase conversions by ${Math.round(highestDropoff.dropoffRate * 100)}%`);
    }

    return { insights, recommendations, opportunities };
  }

  // Private helper methods

  private getEmptyAnalytics(): JourneyAnalytics {
    return {
      totalJourneys: 0,
      averageJourneyLength: 0,
      conversionRate: 0,
      dropoffPoints: [],
      topChannels: [],
      stageMetrics: {}
    };
  }

  private calculateAverageJourneyLength(): number {
    const totalTouchpoints = this.journeys.reduce((sum, journey) => 
      sum + journey.touchpoints.length, 0
    );
    return totalTouchpoints / this.journeys.length;
  }

  private calculateOverallConversionRate(): number {
    const conversions = this.journeys.filter(j => j.conversionEvents.length > 0).length;
    return conversions / this.journeys.length;
  }

  private identifyDropoffPoints(): Array<{
    stage: string;
    dropoffRate: number;
    commonReasons: string[];
  }> {
    const stageTransitions = new Map<string, { total: number; dropoffs: number }>();
    
    this.journeys.forEach(journey => {
      const stages = ['awareness', 'consideration', 'decision', 'retention'];
      const currentStageIndex = stages.indexOf(journey.stage);
      
      for (let i = 0; i < currentStageIndex; i++) {
        const stage = stages[i];
        const existing = stageTransitions.get(stage) || { total: 0, dropoffs: 0 };
        stageTransitions.set(stage, { ...existing, total: existing.total + 1 });
      }
      
      if (journey.conversionEvents.length === 0 && currentStageIndex < stages.length - 1) {
        const stage = journey.stage;
        const existing = stageTransitions.get(stage) || { total: 0, dropoffs: 0 };
        stageTransitions.set(stage, { 
          total: existing.total + 1, 
          dropoffs: existing.dropoffs + 1 
        });
      }
    });

    return Array.from(stageTransitions.entries()).map(([stage, data]) => ({
      stage,
      dropoffRate: data.total > 0 ? data.dropoffs / data.total : 0,
      commonReasons: [] // Would be populated with actual reason analysis
    }));
  }

  private analyzeChannelPerformance(): Array<{
    channel: string;
    usage: number;
    conversionRate: number;
  }> {
    const channelStats = new Map<string, { usage: number; conversions: number }>();

    this.journeys.forEach(journey => {
      const channels = new Set(journey.touchpoints.map(tp => tp.channel));
      const hasConversion = journey.conversionEvents.length > 0;

      channels.forEach(channel => {
        const existing = channelStats.get(channel) || { usage: 0, conversions: 0 };
        channelStats.set(channel, {
          usage: existing.usage + 1,
          conversions: existing.conversions + (hasConversion ? 1 : 0)
        });
      });
    });

    return Array.from(channelStats.entries())
      .map(([channel, stats]) => ({
        channel,
        usage: stats.usage,
        conversionRate: stats.usage > 0 ? stats.conversions / stats.usage : 0
      }))
      .sort((a, b) => b.usage - a.usage);
  }

  private calculateStageMetrics(): Record<string, {
    averageDuration: number;
    conversionRate: number;
    commonActions: string[];
  }> {
    const stageMetrics: Record<string, {
      averageDuration: number;
      conversionRate: number;
      commonActions: string[];
    }> = {};

    const stages = ['awareness', 'consideration', 'decision', 'retention', 'advocacy'];

    stages.forEach(stage => {
      const stageJourneys = this.journeys.filter(j => j.stage === stage);
      
      if (stageJourneys.length > 0) {
        const avgDuration = stageJourneys.reduce((sum, journey) => {
          const duration = journey.endDate 
            ? journey.endDate.getTime() - journey.startDate.getTime()
            : Date.now() - journey.startDate.getTime();
          return sum + duration;
        }, 0) / stageJourneys.length;

        const conversions = stageJourneys.filter(j => j.conversionEvents.length > 0).length;
        const conversionRate = conversions / stageJourneys.length;

        const actionCounts = new Map<string, number>();
        stageJourneys.forEach(journey => {
          journey.touchpoints.forEach(tp => {
            actionCounts.set(tp.action, (actionCounts.get(tp.action) || 0) + 1);
          });
        });

        const commonActions = Array.from(actionCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([action]) => action);

        stageMetrics[stage] = {
          averageDuration: avgDuration / (1000 * 60 * 60 * 24), // Convert to days
          conversionRate,
          commonActions
        };
      }
    });

    return stageMetrics;
  }

  private createSegment(name: string, journeys: CustomerJourney[]): CustomerSegment {
    const commonPaths = this.identifyCommonPaths(2);
    const averageValue = journeys.reduce((sum, j) => sum + (j.totalValue || 0), 0) / journeys.length;
    
    const channelCounts = new Map<string, number>();
    journeys.forEach(journey => {
      journey.touchpoints.forEach(tp => {
        channelCounts.set(tp.channel, (channelCounts.get(tp.channel) || 0) + 1);
      });
    });

    const preferredChannels = Array.from(channelCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([channel]) => channel);

    return {
      id: `segment-${name}`,
      name: name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      criteria: { journeyCount: journeys.length },
      journeyPatterns: {
        commonPaths,
        averageValue,
        preferredChannels
      }
    };
  }

  private findSimilarJourneys(targetJourney: CustomerJourney): CustomerJourney[] {
    return this.journeys.filter(journey => 
      journey.customerId !== targetJourney.customerId &&
      journey.stage === targetJourney.stage &&
      Math.abs(journey.touchpoints.length - targetJourney.touchpoints.length) <= 2
    );
  }

  private calculateActionProbabilities(similarJourneys: CustomerJourney[]): Array<{ action: string; probability: number }> {
    const actionCounts = new Map<string, number>();
    let totalActions = 0;

    similarJourneys.forEach(journey => {
      journey.touchpoints.forEach(tp => {
        actionCounts.set(tp.action, (actionCounts.get(tp.action) || 0) + 1);
        totalActions++;
      });
    });

    return Array.from(actionCounts.entries())
      .map(([action, count]) => ({
        action,
        probability: count / totalActions
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);
  }

  private getRecommendedChannels(journey: CustomerJourney): string[] {
    const usedChannels = new Set(journey.touchpoints.map(tp => tp.channel));
    const analytics = this.analyzeJourneys();
    
    return analytics.topChannels
      .filter(channel => !usedChannels.has(channel.channel as any))
      .slice(0, 3)
      .map(channel => channel.channel);
  }

  private calculateChurnRisk(journey: CustomerJourney): number {
    let riskScore = 0;

    // Time since last touchpoint
    const lastTouchpoint = journey.touchpoints[journey.touchpoints.length - 1];
    const daysSinceLastTouch = (Date.now() - lastTouchpoint.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastTouch > 30) riskScore += 0.3;
    else if (daysSinceLastTouch > 14) riskScore += 0.2;
    else if (daysSinceLastTouch > 7) riskScore += 0.1;

    // Stage progression
    if (journey.stage === 'awareness' && journey.touchpoints.length > 10) riskScore += 0.2;
    if (journey.stage === 'consideration' && journey.touchpoints.length > 15) riskScore += 0.3;

    // Negative outcomes
    const negativeOutcomes = journey.touchpoints.filter(tp => tp.outcome === 'negative').length;
    riskScore += Math.min(negativeOutcomes * 0.1, 0.4);

    return Math.min(riskScore, 1.0);
  }
}

export default CustomerJourneyAnalyzer;
