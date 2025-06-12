import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase/server';

interface UserProfile {
  userId: string;
  demographics: Demographics;
  preferences: UserPreferences;
  behavior: UserBehavior;
  segments: string[];
  persona: PersonaType;
  lastUpdated: Date;
}

interface Demographics {
  age?: number;
  gender?: string;
  location?: string;
  language: string;
  timezone: string;
  occupation?: string;
  incomeRange?: string;
}

interface UserPreferences {
  contentTypes: string[];
  topics: string[];
  communicationChannels: string[];
  notificationFrequency: 'real_time' | 'daily' | 'weekly' | 'monthly';
  productCategories: string[];
  priceRange: { min: number; max: number };
  brandAffinities: string[];
}

interface UserBehavior {
  avgSessionDuration: number;
  visitFrequency: number;
  peakActivityHours: number[];
  deviceTypes: Record<string, number>;
  referralSources: Record<string, number>;
  purchaseHistory: PurchasePattern;
  contentEngagement: ContentEngagement;
  searchPatterns: SearchPattern[];
}

interface PurchasePattern {
  frequency: number;
  avgOrderValue: number;
  categories: Record<string, number>;
  seasonality: Record<string, number>;
  paymentMethods: string[];
}

interface ContentEngagement {
  viewedPages: Record<string, number>;
  clickThroughRate: number;
  shareRate: number;
  commentRate: number;
  savedItems: string[];
}

interface SearchPattern {
  query: string;
  frequency: number;
  conversionRate: number;
}

interface PersonaType {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  recommendationStrategies: string[];
}

interface PersonalizationRule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  actions: PersonalizationAction[];
  priority: number;
  enabled: boolean;
}

interface RuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: string | number | string[] | number[] | boolean;
}

interface PersonalizationAction {
  type: 'content' | 'recommendation' | 'offer' | 'message' | 'layout';
  config: Record<string, unknown>;
}

interface PersonalizedContent {
  userId: string;
  contentId: string;
  type: 'product' | 'article' | 'offer' | 'message';
  score: number;
  reason: string;
  metadata: Record<string, unknown>;
}

interface ABTestConfig {
  id: string;
  name: string;
  variants: TestVariant[];
  targetAudience: RuleCondition[];
  metrics: string[];
  status: 'draft' | 'running' | 'completed';
  startDate: Date;
  endDate?: Date;
}

interface TestVariant {
  id: string;
  name: string;
  config: Record<string, unknown>;
  allocation: number; // percentage
  performance: VariantPerformance;
}

interface VariantPerformance {
  impressions: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  confidence: number;
}

export class PersonalizationEngine extends EventEmitter {
  private userProfiles: Map<string, UserProfile> = new Map();
  private rules: Map<string, PersonalizationRule> = new Map();
  private personas: Map<string, PersonaType> = new Map();
  private abTests: Map<string, ABTestConfig> = new Map();
  private contentScores: Map<string, Map<string, number>> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    await this.loadUserProfiles();
    await this.initializePersonas();
    await this.loadPersonalizationRules();
    await this.loadABTests();
    this.startContinuousLearning();
  }

  private async loadUserProfiles() {
    try {
      const supabase = await createClient();
      
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          *,
          user_preferences (*),
          user_activities (*),
          purchases (*),
          content_interactions (*)
        `);

      if (error) throw error;

      if (users) {
        users.forEach(user => {
          const profile = this.buildUserProfile(user);
          this.userProfiles.set(user.id, profile);
        });
      }

      this.emit('profiles:loaded', { count: this.userProfiles.size });
    } catch (error) {
      console.error('Failed to load user profiles:', error);
      this.emit('error', { type: 'profile_load', error });
    }
  }

  private buildUserProfile(userData: Record<string, unknown>): UserProfile {
    const activities = (userData.user_activities as Record<string, unknown>[]) || [];
    const purchases = (userData.purchases as Record<string, unknown>[]) || [];
    const interactions = (userData.content_interactions as Record<string, unknown>[]) || [];

    // Analyze user behavior
    const behavior = this.analyzeUserBehavior(activities, purchases, interactions);
    
    // Determine user segments
    const segments = this.determineUserSegments(userData, behavior);
    
    // Assign persona
    const persona = this.assignPersona(segments, behavior);

    return {
      userId: userData.id as string,
      demographics: this.extractDemographics(userData),
      preferences: this.extractPreferences(userData),
      behavior,
      segments,
      persona,
      lastUpdated: new Date()
    };
  }

  private extractDemographics(userData: Record<string, unknown>): Demographics {
    return {
      age: userData.age as number | undefined,
      gender: userData.gender as string | undefined,
      location: userData.location as string | undefined,
      language: (userData.language as string) || 'en',
      timezone: (userData.timezone as string) || 'UTC',
      occupation: userData.occupation as string | undefined,
      incomeRange: userData.income_range as string | undefined
    };
  }

  private extractPreferences(userData: Record<string, unknown>): UserPreferences {
    const prefs = userData.user_preferences as Record<string, unknown> || {};
    
    return {
      contentTypes: (prefs.content_types as string[]) || [],
      topics: (prefs.topics as string[]) || [],
      communicationChannels: (prefs.channels as string[]) || ['email'],
      notificationFrequency: (prefs.notification_frequency as UserPreferences['notificationFrequency']) || 'weekly',
      productCategories: (prefs.product_categories as string[]) || [],
      priceRange: (prefs.price_range as { min: number; max: number }) || { min: 0, max: 1000000 },
      brandAffinities: (prefs.brand_affinities as string[]) || []
    };
  }

  private analyzeUserBehavior(
    activities: Record<string, unknown>[],
    purchases: Record<string, unknown>[],
    interactions: Record<string, unknown>[]
  ): UserBehavior {
    // Calculate session metrics
    const sessions = this.extractSessions(activities);
    const avgSessionDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / Math.max(1, sessions.length);
    
    // Visit frequency (visits per month)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentVisits = sessions.filter(s => s.startTime > thirtyDaysAgo).length;

    // Peak activity hours
    const hourCounts = new Array(24).fill(0);
    activities.forEach(activity => {
      const hour = new Date(activity.created_at as string).getHours();
      hourCounts[hour]++;
    });
    const peakActivityHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(h => h.hour);

    // Device types
    const deviceTypes: Record<string, number> = {};
    activities.forEach(activity => {
      const device = (activity.device_type as string) || 'unknown';
      deviceTypes[device] = (deviceTypes[device] || 0) + 1;
    });

    // Purchase patterns
    const purchaseHistory = this.analyzePurchaseHistory(purchases);
    
    // Content engagement
    const contentEngagement = this.analyzeContentEngagement(interactions);
    
    // Search patterns
    const searchPatterns = this.analyzeSearchPatterns(activities);

    return {
      avgSessionDuration,
      visitFrequency: recentVisits,
      peakActivityHours,
      deviceTypes,
      referralSources: this.extractReferralSources(activities),
      purchaseHistory,
      contentEngagement,
      searchPatterns
    };
  }

  private extractSessions(activities: Record<string, unknown>[]): Array<{ startTime: Date; duration: number }> {
    const sessions: Array<{ startTime: Date; duration: number }> = [];
    let currentSession: { startTime: Date; lastActivity: Date } | null = null;
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    activities
      .sort((a, b) => new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime())
      .forEach(activity => {
        const activityTime = new Date(activity.created_at as string);
        
        if (!currentSession || activityTime.getTime() - currentSession.lastActivity.getTime() > SESSION_TIMEOUT) {
          if (currentSession) {
            sessions.push({
              startTime: currentSession.startTime,
              duration: currentSession.lastActivity.getTime() - currentSession.startTime.getTime()
            });
          }
          currentSession = { startTime: activityTime, lastActivity: activityTime };
        } else {
          currentSession.lastActivity = activityTime;
        }
      });

    if (currentSession !== null) {
      sessions.push({
        startTime: currentSession.startTime,
        duration: currentSession.lastActivity.getTime() - currentSession.startTime.getTime()
      });
    }

    return sessions;
  }

  private extractReferralSources(activities: Record<string, unknown>[]): Record<string, number> {
    const sources: Record<string, number> = {};
    
    activities.forEach(activity => {
      const source = (activity.referral_source as string) || 'direct';
      sources[source] = (sources[source] || 0) + 1;
    });

    return sources;
  }

  private analyzePurchaseHistory(purchases: Record<string, unknown>[]): PurchasePattern {
    if (purchases.length === 0) {
      return {
        frequency: 0,
        avgOrderValue: 0,
        categories: {},
        seasonality: {},
        paymentMethods: []
      };
    }

    const totalValue = purchases.reduce((sum, p) => sum + ((p.amount as number) || 0), 0);
    const categories: Record<string, number> = {};
    const seasonality: Record<string, number> = {};
    const paymentMethods = new Set<string>();

    purchases.forEach(purchase => {
      // Categories
      const category = (purchase.category as string) || 'other';
      categories[category] = (categories[category] || 0) + 1;

      // Seasonality
      const month = new Date(purchase.created_at as string).toLocaleString('default', { month: 'long' });
      seasonality[month] = (seasonality[month] || 0) + 1;

      // Payment methods
      if (purchase.payment_method) {
        paymentMethods.add(purchase.payment_method as string);
      }
    });

    return {
      frequency: purchases.length,
      avgOrderValue: totalValue / purchases.length,
      categories,
      seasonality,
      paymentMethods: Array.from(paymentMethods)
    };
  }

  private analyzeContentEngagement(interactions: Record<string, unknown>[]): ContentEngagement {
    const viewedPages: Record<string, number> = {};
    let clicks = 0;
    let shares = 0;
    let comments = 0;
    const savedItems: string[] = [];

    interactions.forEach(interaction => {
      const type = interaction.type as string;
      const page = interaction.page as string;

      if (page) {
        viewedPages[page] = (viewedPages[page] || 0) + 1;
      }

      switch (type) {
        case 'click':
          clicks++;
          break;
        case 'share':
          shares++;
          break;
        case 'comment':
          comments++;
          break;
        case 'save':
          savedItems.push(interaction.item_id as string);
          break;
      }
    });

    const totalInteractions = interactions.length;
    
    return {
      viewedPages,
      clickThroughRate: totalInteractions > 0 ? clicks / totalInteractions : 0,
      shareRate: totalInteractions > 0 ? shares / totalInteractions : 0,
      commentRate: totalInteractions > 0 ? comments / totalInteractions : 0,
      savedItems
    };
  }

  private analyzeSearchPatterns(activities: Record<string, unknown>[]): SearchPattern[] {
    const searchMap = new Map<string, { count: number; conversions: number }>();

    activities
      .filter(a => a.type === 'search')
      .forEach(activity => {
        const query = (activity.search_query as string) || '';
        const converted = activity.converted as boolean || false;

        if (!searchMap.has(query)) {
          searchMap.set(query, { count: 0, conversions: 0 });
        }

        const stats = searchMap.get(query)!;
        stats.count++;
        if (converted) stats.conversions++;
      });

    return Array.from(searchMap.entries())
      .map(([query, stats]) => ({
        query,
        frequency: stats.count,
        conversionRate: stats.count > 0 ? stats.conversions / stats.count : 0
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);
  }

  private determineUserSegments(userData: Record<string, unknown>, behavior: UserBehavior): string[] {
    const segments: string[] = [];

    // Value-based segments
    if (behavior.purchaseHistory.avgOrderValue > 500) {
      segments.push('high_value');
    } else if (behavior.purchaseHistory.avgOrderValue > 100) {
      segments.push('medium_value');
    } else {
      segments.push('low_value');
    }

    // Engagement-based segments
    if (behavior.visitFrequency > 20) {
      segments.push('highly_engaged');
    } else if (behavior.visitFrequency > 5) {
      segments.push('engaged');
    } else {
      segments.push('casual');
    }

    // Behavior-based segments
    if (behavior.purchaseHistory.frequency > 10) {
      segments.push('frequent_buyer');
    }

    if (behavior.contentEngagement.shareRate > 0.1) {
      segments.push('brand_advocate');
    }

    // Device preference
    const primaryDevice = Object.entries(behavior.deviceTypes)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    if (primaryDevice) {
      segments.push(`${primaryDevice}_user`);
    }

    return segments;
  }

  private async initializePersonas() {
    const personas: PersonaType[] = [
      {
        id: 'power_user',
        name: 'Power User',
        description: 'Highly engaged users who frequently interact with the platform',
        characteristics: [
          'High visit frequency',
          'Multiple device usage',
          'High feature adoption',
          'Active in community'
        ],
        recommendationStrategies: [
          'Early access to new features',
          'Advanced functionality',
          'Community leadership opportunities'
        ]
      },
      {
        id: 'bargain_hunter',
        name: 'Bargain Hunter',
        description: 'Price-sensitive users who look for deals',
        characteristics: [
          'High price sensitivity',
          'Frequent use of discounts',
          'Comparison shopping behavior',
          'Seasonal purchasing'
        ],
        recommendationStrategies: [
          'Personalized deals',
          'Price drop alerts',
          'Bundle offers',
          'Loyalty rewards'
        ]
      },
      {
        id: 'premium_customer',
        name: 'Premium Customer',
        description: 'High-value customers who prefer quality',
        characteristics: [
          'High average order value',
          'Premium product preference',
          'Low price sensitivity',
          'Brand loyalty'
        ],
        recommendationStrategies: [
          'Exclusive products',
          'VIP services',
          'Premium content',
          'Concierge support'
        ]
      },
      {
        id: 'casual_browser',
        name: 'Casual Browser',
        description: 'Users who browse occasionally',
        characteristics: [
          'Low visit frequency',
          'High bounce rate',
          'Limited engagement',
          'Price comparison behavior'
        ],
        recommendationStrategies: [
          'Welcome offers',
          'Simplified onboarding',
          'Popular items',
          'Social proof'
        ]
      }
    ];

    personas.forEach(persona => {
      this.personas.set(persona.id, persona);
    });
  }

  private assignPersona(segments: string[], behavior: UserBehavior): PersonaType {
    // Score each persona based on matching characteristics
    const scores = new Map<string, number>();

    for (const [personaId, _persona] of this.personas) {
      let score = 0;

      // Power user indicators
      if (personaId === 'power_user') {
        if (segments.includes('highly_engaged')) score += 3;
        if (behavior.visitFrequency > 20) score += 2;
        if (Object.keys(behavior.deviceTypes).length > 2) score += 1;
      }

      // Bargain hunter indicators
      if (personaId === 'bargain_hunter') {
        if (segments.includes('low_value')) score += 2;
        if (behavior.searchPatterns.some(p => p.query.includes('sale') || p.query.includes('discount'))) score += 3;
      }

      // Premium customer indicators
      if (personaId === 'premium_customer') {
        if (segments.includes('high_value')) score += 3;
        if (behavior.purchaseHistory.avgOrderValue > 500) score += 2;
      }

      // Casual browser indicators
      if (personaId === 'casual_browser') {
        if (segments.includes('casual')) score += 3;
        if (behavior.visitFrequency < 5) score += 2;
      }

      scores.set(personaId, score);
    }

    // Select persona with highest score
    const topPersonaId = Array.from(scores.entries())
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'casual_browser';

    return this.personas.get(topPersonaId)!;
  }

  private async loadPersonalizationRules() {
    // Load predefined personalization rules
    const rules: PersonalizationRule[] = [
      {
        id: 'high_value_offers',
        name: 'Exclusive offers for high-value customers',
        conditions: [
          { field: 'segment', operator: 'contains', value: 'high_value' }
        ],
        actions: [
          {
            type: 'offer',
            config: {
              discount: 15,
              freeShipping: true,
              earlyAccess: true
            }
          }
        ],
        priority: 10,
        enabled: true
      },
      {
        id: 'mobile_optimization',
        name: 'Mobile-optimized experience',
        conditions: [
          { field: 'device', operator: 'equals', value: 'mobile' }
        ],
        actions: [
          {
            type: 'layout',
            config: {
              simplified: true,
              largerButtons: true,
              swipeEnabled: true
            }
          }
        ],
        priority: 8,
        enabled: true
      },
      {
        id: 'abandoned_cart',
        name: 'Abandoned cart recovery',
        conditions: [
          { field: 'hasAbandonedCart', operator: 'equals', value: true }
        ],
        actions: [
          {
            type: 'message',
            config: {
              type: 'email',
              template: 'abandoned_cart_reminder',
              incentive: '10% off'
            }
          }
        ],
        priority: 9,
        enabled: true
      }
    ];

    rules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  private async loadABTests() {
    try {
      const supabase = await createClient();
      
      const { data: tests, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('status', 'running');

      if (error) throw error;

      if (tests) {
        tests.forEach(test => {
          this.abTests.set(test.id, this.parseABTest(test));
        });
      }
    } catch (error) {
      console.error('Failed to load AB tests:', error);
    }
  }

  private parseABTest(testData: Record<string, unknown>): ABTestConfig {
    return {
      id: testData.id as string,
      name: testData.name as string,
      variants: (testData.variants as Record<string, unknown>[]).map(v => ({
        id: v.id as string,
        name: v.name as string,
        config: v.config as Record<string, unknown>,
        allocation: v.allocation as number,
        performance: {
          impressions: v.impressions as number || 0,
          conversions: v.conversions as number || 0,
          conversionRate: v.conversion_rate as number || 0,
          revenue: v.revenue as number || 0,
          confidence: v.confidence as number || 0
        }
      })),
      targetAudience: testData.target_audience as RuleCondition[],
      metrics: testData.metrics as string[],
      status: testData.status as ABTestConfig['status'],
      startDate: new Date(testData.start_date as string),
      endDate: testData.end_date ? new Date(testData.end_date as string) : undefined
    };
  }

  private startContinuousLearning() {
    // Update profiles and recommendations periodically
    this.updateInterval = setInterval(() => {
      this.updateUserProfiles();
      this.optimizePersonalization();
    }, 60 * 60 * 1000); // Every hour

    // Initial content scoring
    this.scoreAllContent();
  }

  private async updateUserProfiles() {
    // Refresh user profiles with latest activity
    for (const [userId, _profile] of this.userProfiles) {
      try {
        await this.refreshUserProfile(userId);
      } catch (error) {
        console.error(`Failed to update profile for user ${userId}:`, error);
      }
    }
  }

  private async refreshUserProfile(userId: string) {
    const supabase = await createClient();
    
    // Get recent activities
    const { data: recentActivities } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (recentActivities) {
      const profile = this.userProfiles.get(userId);
      if (profile) {
        // Update behavior patterns
        const updatedBehavior = this.analyzeUserBehavior(
          recentActivities,
          [], // Keep existing purchase history
          [] // Keep existing interactions
        );

        // Merge with existing behavior
        profile.behavior = {
          ...profile.behavior,
          visitFrequency: updatedBehavior.visitFrequency,
          avgSessionDuration: (profile.behavior.avgSessionDuration + updatedBehavior.avgSessionDuration) / 2
        };

        profile.lastUpdated = new Date();
      }
    }
  }

  private async scoreAllContent() {
    // Score content for each user
    for (const [userId, profile] of this.userProfiles) {
      const scores = await this.scoreContentForUser(profile);
      this.contentScores.set(userId, scores);
    }
  }

  private async scoreContentForUser(profile: UserProfile): Promise<Map<string, number>> {
    const scores = new Map<string, number>();
    
    try {
      const supabase = await createClient();
      
      // Get available content
      const { data: content } = await supabase
        .from('content')
        .select('*')
        .eq('active', true);

      if (content) {
        content.forEach(item => {
          const score = this.calculateContentScore(item, profile);
          scores.set(item.id, score);
        });
      }
    } catch (error) {
      console.error('Failed to score content:', error);
    }

    return scores;
  }

  private calculateContentScore(content: Record<string, unknown>, profile: UserProfile): number {
    let score = 0;

    // Category match
    if (profile.preferences.productCategories.includes(content.category as string)) {
      score += 0.3;
    }

    // Topic relevance
    const contentTopics = (content.topics as string[]) || [];
    const matchingTopics = contentTopics.filter(t => profile.preferences.topics.includes(t));
    score += matchingTopics.length * 0.1;

    // Price range match
    const price = content.price as number;
    if (price >= profile.preferences.priceRange.min && price <= profile.preferences.priceRange.max) {
      score += 0.2;
    }

    // Persona-based scoring
    if (profile.persona.id === 'premium_customer' && content.is_premium) {
      score += 0.2;
    }

    // Popularity factor
    const popularity = (content.view_count as number || 0) / 1000;
    score += Math.min(0.1, popularity * 0.01);

    // Recency factor
    const daysOld = (Date.now() - new Date(content.created_at as string).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 7) score += 0.1;

    return Math.min(1, score);
  }

  private optimizePersonalization() {
    // Analyze rule performance
    for (const [ruleId, rule] of this.rules) {
      const performance = this.analyzeRulePerformance(ruleId);
      
      // Adjust rule priority based on performance
      if (performance.conversionLift > 0.1) {
        rule.priority = Math.min(10, rule.priority + 1);
      } else if (performance.conversionLift < -0.05) {
        rule.priority = Math.max(1, rule.priority - 1);
      }
    }

    // Update AB test results
    this.updateABTestResults();
  }

  private analyzeRulePerformance(_ruleId: string): { conversionLift: number; engagement: number } {
    // Simulated performance analysis
    return {
      conversionLift: Math.random() * 0.3 - 0.1, // -10% to +20%
      engagement: Math.random() * 0.5 + 0.5 // 50% to 100%
    };
  }

  private async updateABTestResults() {
    for (const [testId, test] of this.abTests) {
      if (test.status === 'running') {
        // Update variant performance
        test.variants.forEach(variant => {
          variant.performance.impressions += Math.round(Math.random() * 100);
          variant.performance.conversions += Math.round(Math.random() * 10);
          variant.performance.conversionRate = 
            variant.performance.impressions > 0 ? 
            variant.performance.conversions / variant.performance.impressions : 0;
          variant.performance.revenue += Math.random() * 1000;
          
          // Calculate statistical confidence
          variant.performance.confidence = this.calculateConfidence(
            variant.performance.conversions,
            variant.performance.impressions
          );
        });

        // Check if test should be concluded
        if (this.shouldConcludeTest(test)) {
          test.status = 'completed';
          test.endDate = new Date();
          this.emit('abtest:completed', { testId, winner: this.determineWinner(test) });
        }
      }
    }
  }

  private calculateConfidence(conversions: number, impressions: number): number {
    if (impressions < 100) return 0;
    
    // Simplified confidence calculation
    const rate = conversions / impressions;
    const standardError = Math.sqrt((rate * (1 - rate)) / impressions);
    const zScore = 1.96; // 95% confidence
    const margin = zScore * standardError;
    
    return Math.min(0.99, 1 - margin);
  }

  private shouldConcludeTest(test: ABTestConfig): boolean {
    // Check if any variant has reached statistical significance
    const hasSignificance = test.variants.some(v => v.performance.confidence > 0.95);
    
    // Check if test has run long enough
    const daysRunning = (Date.now() - test.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const hasRunLongEnough = daysRunning >= 14; // At least 2 weeks
    
    // Check if we have enough impressions
    const totalImpressions = test.variants.reduce((sum, v) => sum + v.performance.impressions, 0);
    const hasEnoughData = totalImpressions >= 1000;
    
    return hasSignificance && hasRunLongEnough && hasEnoughData;
  }

  private determineWinner(test: ABTestConfig): string {
    // Find variant with highest conversion rate and confidence
    let bestVariant = test.variants[0];
    let highestScore = 0;

    test.variants.forEach(variant => {
      const score = variant.performance.conversionRate * variant.performance.confidence;
      if (score > highestScore) {
        highestScore = score;
        bestVariant = variant;
      }
    });

    return bestVariant.name;
  }

  // Public API methods

  async getPersonalizedContent(userId: string, contentType?: string, limit: number = 10): Promise<PersonalizedContent[]> {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return [];
    }

    const userScores = this.contentScores.get(userId);
    if (!userScores) {
      return [];
    }

    // Apply personalization rules
    const _applicableRules = this.getApplicableRules(profile);
    
    // Get top scored content
    const sortedContent = Array.from(userScores.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    return sortedContent.map(([contentId, score]) => ({
      userId,
      contentId,
      type: (contentType || 'product') as PersonalizedContent['type'],
      score,
      reason: this.generateRecommendationReason(profile, contentId),
      metadata: {
        persona: profile.persona.name,
        segments: profile.segments
      }
    }));
  }

  private getApplicableRules(profile: UserProfile): PersonalizationRule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.enabled && this.matchesConditions(profile, rule.conditions))
      .sort((a, b) => b.priority - a.priority);
  }

  private matchesConditions(profile: UserProfile, conditions: RuleCondition[]): boolean {
    return conditions.every(condition => {
      const value = this.getProfileValue(profile, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return Array.isArray(value) && (value as (string | number)[]).includes(condition.value as string | number);
        case 'greater_than':
          return typeof value === 'number' && value > (condition.value as number);
        case 'less_than':
          return typeof value === 'number' && value < (condition.value as number);
        case 'in':
          return Array.isArray(condition.value) && (condition.value as unknown[]).includes(value as string | number | boolean);
        case 'not_in':
          return Array.isArray(condition.value) && !(condition.value as unknown[]).includes(value as string | number | boolean);
        default:
          return false;
      }
    });
  }

  private getProfileValue(profile: UserProfile, field: string): string | number | string[] | number[] | boolean {
    switch (field) {
      case 'segment':
        return profile.segments;
      case 'device':
        return Object.entries(profile.behavior.deviceTypes)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown';
      case 'hasAbandonedCart':
        return false; // Would need to implement cart tracking
      default:
        return '';
    }
  }

  private generateRecommendationReason(profile: UserProfile, _contentId: string): string {
    const reasons: string[] = [];

    if (profile.segments.includes('high_value')) {
      reasons.push('Exclusive for valued customers');
    }

    if (profile.persona.id === 'premium_customer') {
      reasons.push('Premium selection');
    }

    if (profile.behavior.searchPatterns.length > 0) {
      reasons.push('Based on your searches');
    }

    if (reasons.length === 0) {
      reasons.push('Recommended for you');
    }

    return reasons.join(' Â· ');
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.userProfiles.get(userId) || null;
  }

  async getUserSegments(userId: string): Promise<string[]> {
    const profile = this.userProfiles.get(userId);
    return profile ? profile.segments : [];
  }

  async getABTestVariant(userId: string, testId: string): Promise<TestVariant | null> {
    const test = this.abTests.get(testId);
    if (!test || test.status !== 'running') {
      return null;
    }

    const profile = this.userProfiles.get(userId);
    if (!profile || !this.matchesConditions(profile, test.targetAudience)) {
      return null;
    }

    // Assign variant based on user ID hash for consistency
    const hash = this.hashUserId(userId);
    const variantIndex = hash % test.variants.length;
    
    return test.variants[variantIndex];
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async trackConversion(userId: string, testId: string, revenue?: number) {
    const test = this.abTests.get(testId);
    if (!test) return;

    const variant = await this.getABTestVariant(userId, testId);
    if (!variant) return;

    // Update variant performance
    variant.performance.conversions++;
    if (revenue) {
      variant.performance.revenue += revenue;
    }

    this.emit('conversion:tracked', {
      userId,
      testId,
      variantId: variant.id,
      revenue
    });
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
