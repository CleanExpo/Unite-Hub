/**
 * AI Personalization Engine for UNITE Group
 * 
 * This module provides the core personalization functionality including:
 * - Real-time content personalization
 * - User behavior analysis
 * - Recommendation generation
 * - Dynamic content adaptation
 * - A/B testing integration
 */

import { createClient } from '@supabase/supabase-js';
import {
  UserProfile,
  UserBehavior,
  ContentRecommendation,
  PersonalizationContext,
  PersonalizationRule,
  AIInsight,
  PredictionResult,
  CustomerSegment,
  BehaviorEventType,
  RecommendationType,
  PredictionType
} from './types';

export class PersonalizationEngine {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  private aiApiKey = process.env.OPENAI_API_KEY;
  private modelVersion = 'gpt-4-turbo';

  /**
   * Get personalized content for a user based on their profile and context
   */
  async getPersonalizedContent(
    userId: string,
    context: PersonalizationContext
  ): Promise<{
    recommendations: ContentRecommendation[];
    personalizedElements: Record<string, unknown>;
    insights: AIInsight[];
  }> {
    try {
      // Get user profile and behavior history
      const [userProfile, recentBehavior, activeRules] = await Promise.all([
        this.getUserProfile(userId),
        this.getRecentBehavior(userId, 30), // Last 30 days
        this.getActivePersonalizationRules()
      ]);

      // Generate content recommendations
      const recommendations = await this.generateContentRecommendations(
        userId,
        userProfile,
        context,
        recentBehavior
      );

      // Apply personalization rules
      const personalizedElements = await this.applyPersonalizationRules(
        activeRules,
        userProfile,
        context,
        recentBehavior
      );

      // Generate AI insights
      const insights = await this.generatePersonalizationInsights(
        userProfile,
        recentBehavior,
        context
      );

      // Track personalization event
      await this.trackPersonalizationEvent(userId, context, {
        recommendations_count: recommendations.length,
        rules_applied: Object.keys(personalizedElements).length,
        insights_generated: insights.length
      });

      return {
        recommendations,
        personalizedElements,
        insights
      };
    } catch (error) {
      console.error('Personalization engine error:', error);
      return {
        recommendations: [],
        personalizedElements: {},
        insights: []
      };
    }
  }

  /**
   * Track user behavior for personalization learning
   */
  async trackBehavior(
    userId: string,
    sessionId: string,
    eventType: BehaviorEventType,
    pagePath: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      const behavior: Omit<UserBehavior, 'id'> = {
        user_id: userId,
        session_id: sessionId,
        event_type: eventType,
        page_path: pagePath,
        metadata,
        timestamp: new Date().toISOString()
      };

      // Store behavior event
      const { error } = await this.supabase
        .from('user_behaviors')
        .insert(behavior);

      if (error) {
        console.error('Failed to track behavior:', error);
        return;
      }

      // Update user profile with real-time behavior patterns
      await this.updateUserProfileFromBehavior(userId, behavior);

      // Trigger real-time personalization updates if needed
      if (this.isHighValueEvent(eventType)) {
        await this.triggerRealtimePersonalization(userId, behavior);
      }
    } catch (error) {
      console.error('Behavior tracking error:', error);
    }
  }

  /**
   * Generate content recommendations using AI
   */
  private async generateContentRecommendations(
    userId: string,
    userProfile: UserProfile | null,
    context: PersonalizationContext,
    recentBehavior: UserBehavior[]
  ): Promise<ContentRecommendation[]> {
    try {
      // Get available content
      const { data: availableContent } = await this.supabase
        .from('content_items')
        .select('*')
        .eq('status', 'published');

      if (!availableContent || availableContent.length === 0) {
        return [];
      }

      // Calculate content scores using multiple algorithms
      const contentScores = await Promise.all([
        this.calculateBehavioralRecommendations(userId, recentBehavior, availableContent),
        this.calculateContentBasedRecommendations(userProfile, availableContent),
        this.calculateCollaborativeRecommendations(userId, availableContent),
        this.calculateContextualRecommendations(context, availableContent)
      ]);

      // Combine and rank recommendations
      const combinedRecommendations = this.combineRecommendationScores(
        contentScores,
        availableContent
      );

      // Generate AI explanations for top recommendations
      const topRecommendations = combinedRecommendations.slice(0, 10);
      const recommendationsWithReasons = await this.addAIReasoningToRecommendations(
        topRecommendations,
        userProfile,
        context
      );

      return recommendationsWithReasons;
    } catch (error) {
      console.error('Content recommendation error:', error);
      return [];
    }
  }

  /**
   * Generate behavioral-based recommendations
   */
  private async calculateBehavioralRecommendations(
    userId: string,
    recentBehavior: UserBehavior[],
    availableContent: unknown[]
  ): Promise<Array<{ contentId: string; score: number; type: RecommendationType }>> {
    // Analyze user's recent behavior patterns
    const behaviorPatterns = this.analyzeBehaviorPatterns(recentBehavior);
    
    // Score content based on behavior similarity
    return availableContent.map((content: any) => {
      let score = 0;
      
      // Recent page views
      const pageViewScore = behaviorPatterns.frequentPages.includes(content.category) ? 0.3 : 0;
      
      // Time spent on similar content
      const engagementScore = behaviorPatterns.highEngagementCategories.includes(content.category) ? 0.4 : 0;
      
      // Conversion behavior
      const conversionScore = behaviorPatterns.conversionIndicators.some(indicator => 
        content.tags?.includes(indicator)
      ) ? 0.3 : 0;

      score = pageViewScore + engagementScore + conversionScore;

      return {
        contentId: content.id,
        score,
        type: 'behavioral' as RecommendationType
      };
    }).filter(item => item.score > 0.2);
  }

  /**
   * Generate content-based recommendations
   */
  private async calculateContentBasedRecommendations(
    userProfile: UserProfile | null,
    availableContent: unknown[]
  ): Promise<Array<{ contentId: string; score: number; type: RecommendationType }>> {
    if (!userProfile) return [];

    const interests = userProfile.preferences.topics_of_interest;
    const contentTypes = userProfile.preferences.content_types;

    return availableContent.map((content: any) => {
      let score = 0;

      // Interest matching
      const interestScore = interests.some(interest => 
        content.tags?.includes(interest) || content.category === interest
      ) ? 0.5 : 0;

      // Content type preference
      const typeScore = contentTypes.includes(content.type) ? 0.3 : 0;

      // Content length preference
      const lengthScore = this.matchesContentLength(
        content.estimated_read_time,
        userProfile.behavior_patterns.preferred_content_length
      ) ? 0.2 : 0;

      score = interestScore + typeScore + lengthScore;

      return {
        contentId: content.id,
        score,
        type: 'content_based' as RecommendationType
      };
    }).filter(item => item.score > 0.3);
  }

  /**
   * Generate collaborative filtering recommendations
   */
  private async calculateCollaborativeRecommendations(
    userId: string,
    availableContent: unknown[]
  ): Promise<Array<{ contentId: string; score: number; type: RecommendationType }>> {
    try {
      // Find users with similar behavior patterns
      const { data: similarUsers } = await this.supabase
        .rpc('find_similar_users', { target_user_id: userId, limit_users: 50 });

      if (!similarUsers || similarUsers.length === 0) return [];

      // Get content engagement from similar users
      const { data: similarUserEngagement } = await this.supabase
        .from('user_behaviors')
        .select('metadata->content_id, user_id')
        .in('user_id', similarUsers.map((u: any) => u.user_id))
        .eq('event_type', 'content_engagement');

      // Score content based on similar user preferences
      const contentEngagement = new Map<string, number>();
      
      similarUserEngagement?.forEach((engagement: any) => {
        const contentId = engagement.metadata?.content_id;
        if (contentId) {
          contentEngagement.set(contentId, (contentEngagement.get(contentId) || 0) + 1);
        }
      });

      return availableContent.map((content: any) => {
        const engagementCount = contentEngagement.get(content.id) || 0;
        const score = Math.min(engagementCount / similarUsers.length, 1);

        return {
          contentId: content.id,
          score,
          type: 'collaborative' as RecommendationType
        };
      }).filter(item => item.score > 0.1);
    } catch (error) {
      console.error('Collaborative recommendation error:', error);
      return [];
    }
  }

  /**
   * Generate contextual recommendations based on current context
   */
  private calculateContextualRecommendations(
    context: PersonalizationContext,
    availableContent: unknown[]
  ): Array<{ contentId: string; score: number; type: RecommendationType }> {
    return availableContent.map((content: any) => {
      let score = 0;

      // Time-based relevance
      if (this.isBusinessRelevantTime(context.time_context, content)) {
        score += 0.3;
      }

      // Device-specific content
      if (this.isDeviceOptimized(context.device_info, content)) {
        score += 0.2;
      }

      // Location relevance
      if (context.location && this.isLocationRelevant(context.location, content)) {
        score += 0.2;
      }

      // Current page context
      if (this.isPageContextRelevant(context.current_page, content)) {
        score += 0.3;
      }

      return {
        contentId: content.id,
        score,
        type: 'contextual' as RecommendationType
      };
    }).filter(item => item.score > 0.2);
  }

  /**
   * Apply personalization rules to customize page elements
   */
  private async applyPersonalizationRules(
    rules: PersonalizationRule[],
    userProfile: UserProfile | null,
    context: PersonalizationContext,
    recentBehavior: UserBehavior[]
  ): Promise<Record<string, unknown>> {
    const personalizedElements: Record<string, unknown> = {};

    for (const rule of rules) {
      if (!rule.enabled) continue;

      try {
        const conditionMet = await this.evaluateRuleCondition(
          rule.condition,
          userProfile,
          context,
          recentBehavior
        );

        if (conditionMet) {
          const elementKey = rule.action.target;
          personalizedElements[elementKey] = await this.executePersonalizationAction(
            rule.action,
            userProfile,
            context
          );

          // Log rule application
          await this.logRuleApplication(rule.id, context.user_id, context.session_id);
        }
      } catch (error) {
        console.error(`Error applying rule ${rule.id}:`, error);
      }
    }

    return personalizedElements;
  }

  /**
   * Generate AI-powered insights about user behavior
   */
  private async generatePersonalizationInsights(
    userProfile: UserProfile | null,
    recentBehavior: UserBehavior[],
    context: PersonalizationContext
  ): Promise<AIInsight[]> {
    try {
      if (!this.aiApiKey || !userProfile) return [];

      // Prepare behavior summary for AI analysis
      const behaviorSummary = this.createBehaviorSummary(recentBehavior);
      
      const prompt = `
        Analyze this user behavior data and provide personalization insights:
        
        User Profile: ${JSON.stringify(userProfile.behavior_patterns)}
        Recent Behavior: ${JSON.stringify(behaviorSummary)}
        Current Context: ${JSON.stringify({
          page: context.current_page,
          device: context.device_info.type,
          timeOfDay: context.time_context.hour_of_day
        })}
        
        Provide 3-5 actionable insights about:
        1. User engagement patterns
        2. Conversion opportunities
        3. Content preferences
        4. Optimal timing for engagement
        
        Format as JSON array with: title, description, impact_score (1-10), recommendations[]
      `;

      const response = await this.callAIService(prompt);
      const insights = JSON.parse(response);

      return insights.map((insight: Record<string, unknown>) => ({
        id: `insight_${Date.now()}_${Math.random()}`,
        insight_type: 'user_behavior_pattern',
        title: insight.title,
        description: insight.description,
        impact_score: insight.impact_score,
        confidence: 0.8,
        data_points: [behaviorSummary],
        recommendations: insight.recommendations,
        created_at: new Date().toISOString(),
        status: 'active'
      }));
    } catch (error) {
      console.error('AI insight generation error:', error);
      return [];
    }
  }

  /**
   * Helper Methods
   */
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return data;
  }

  private async getRecentBehavior(userId: string, days: number): Promise<UserBehavior[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data } = await this.supabase
      .from('user_behaviors')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: false })
      .limit(1000);

    return data || [];
  }

  private async getActivePersonalizationRules(): Promise<PersonalizationRule[]> {
    const { data } = await this.supabase
      .from('personalization_rules')
      .select('*')
      .eq('enabled', true)
      .order('priority', { ascending: false });

    return data || [];
  }

  private analyzeBehaviorPatterns(behaviors: UserBehavior[]) {
    const patterns = {
      frequentPages: [] as string[],
      highEngagementCategories: [] as string[],
      conversionIndicators: [] as string[]
    };

    // Analyze page frequency
    const pageFrequency = new Map<string, number>();
    behaviors.forEach(behavior => {
      const category = this.extractCategoryFromPath(behavior.page_path);
      pageFrequency.set(category, (pageFrequency.get(category) || 0) + 1);
    });

    patterns.frequentPages = Array.from(pageFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);

    // Analyze engagement (time spent, scroll depth, etc.)
    const engagementByCategory = new Map<string, number[]>();
    behaviors.forEach(behavior => {
      if (behavior.duration) {
        const category = this.extractCategoryFromPath(behavior.page_path);
        if (!engagementByCategory.has(category)) {
          engagementByCategory.set(category, []);
        }
        engagementByCategory.get(category)!.push(behavior.duration);
      }
    });

    patterns.highEngagementCategories = Array.from(engagementByCategory.entries())
      .map(([category, durations]) => ({
        category,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 3)
      .map(item => item.category);

    // Identify conversion indicators
    patterns.conversionIndicators = behaviors
      .filter(b => ['consultation_request', 'contact_attempt', 'pricing_view'].includes(b.event_type))
      .map(b => this.extractCategoryFromPath(b.page_path))
      .filter((category, index, array) => array.indexOf(category) === index);

    return patterns;
  }

  private combineRecommendationScores(
    scoreSets: Array<Array<{ contentId: string; score: number; type: RecommendationType }>>,
    availableContent: unknown[]
  ): ContentRecommendation[] {
    const combinedScores = new Map<string, { totalScore: number; types: RecommendationType[]; content: unknown }>();

    // Combine scores from different algorithms
    scoreSets.forEach(scoreSet => {
      scoreSet.forEach(({ contentId, score, type }) => {
        if (!combinedScores.has(contentId)) {
          const content = (availableContent as any[]).find((c: any) => c.id === contentId);
          combinedScores.set(contentId, { totalScore: 0, types: [], content });
        }
        const existing = combinedScores.get(contentId)!;
        existing.totalScore += score;
        existing.types.push(type);
      });
    });

    // Convert to recommendations and sort by score
    return Array.from(combinedScores.entries())
      .map(([contentId, { totalScore, types, content }]) => ({
        id: `rec_${contentId}_${Date.now()}`,
        user_id: '',
        content_type: (content as any).type,
        content_id: contentId,
        title: (content as any).title,
        description: (content as any).description,
        url: (content as any).url,
        relevance_score: totalScore,
        confidence: Math.min(totalScore / types.length, 1),
        reasoning: [`Recommended based on ${types.join(', ')} analysis`],
        recommendation_type: types[0], // Primary type
        created_at: new Date().toISOString()
      }))
      .sort((a, b) => b.relevance_score - a.relevance_score);
  }

  private async addAIReasoningToRecommendations(
    recommendations: ContentRecommendation[],
    userProfile: UserProfile | null,
    context: PersonalizationContext
  ): Promise<ContentRecommendation[]> {
    if (!this.aiApiKey || recommendations.length === 0) return recommendations;

    try {
      for (const recommendation of recommendations) {
        const prompt = `
          Explain why this content is recommended for the user:
          Content: ${recommendation.title} - ${recommendation.description}
          User interests: ${userProfile?.preferences.topics_of_interest.join(', ') || 'Unknown'}
          Current context: ${context.current_page}
          
          Provide a brief, personalized explanation (1-2 sentences).
        `;

        const reasoning = await this.callAIService(prompt);
        recommendation.reasoning = [reasoning.trim()];
      }
    } catch (error) {
      console.error('AI reasoning error:', error);
    }

    return recommendations;
  }

  private async callAIService(prompt: string): Promise<string> {
    if (!this.aiApiKey) {
      throw new Error('AI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.aiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.modelVersion,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private extractCategoryFromPath(path: string): string {
    const segments = path.split('/').filter(Boolean);
    return segments[0] || 'home';
  }

  private matchesContentLength(estimatedTime: number, preference: string): boolean {
    switch (preference) {
      case 'short': return estimatedTime <= 3;
      case 'medium': return estimatedTime > 3 && estimatedTime <= 10;
      case 'long': return estimatedTime > 10;
      default: return true;
    }
  }

  private isBusinessRelevantTime(timeContext: unknown, content: unknown): boolean {
    // Business hours content gets boosted during business hours
    if ((content as any).tags?.includes('business') && (timeContext as any).is_business_hours) {
      return true;
    }
    return false;
  }

  private isDeviceOptimized(deviceInfo: unknown, content: unknown): boolean {
    // Mobile-optimized content for mobile users
    return (content as any).device_optimized?.includes((deviceInfo as any).type) || false;
  }

  private isLocationRelevant(location: unknown, content: unknown): boolean {
    // Location-specific content
    return (content as any).target_regions?.includes((location as any).country) || false;
  }

  private isPageContextRelevant(currentPage: string, content: unknown): boolean {
    // Content relevant to current page context
    const pageCategory = this.extractCategoryFromPath(currentPage);
    return (content as any).category === pageCategory || (content as any).related_pages?.includes(pageCategory);
  }

  private async evaluateRuleCondition(
    condition: unknown,
    userProfile: UserProfile | null,
    context: PersonalizationContext,
    recentBehavior: UserBehavior[]
  ): Promise<boolean> {
    // Simplified rule evaluation - in production, this would be more comprehensive
    switch ((condition as any).type) {
      case 'segment':
        return (userProfile?.behavior_patterns.engagement_score ?? 0) > 0.7;
      case 'behavior':
        return recentBehavior.some(b => b.event_type === (condition as any).value);
      case 'context':
        return context.device_info.type === (condition as any).value;
      default:
        return false;
    }
  }

  private async executePersonalizationAction(
    action: unknown,
    userProfile: UserProfile | null,
    context: PersonalizationContext
  ): Promise<unknown> {
    // Execute personalization action based on type
    switch ((action as any).type) {
      case 'content_swap':
        return { newContent: (action as any).parameters.content };
      case 'cta_modify':
        return { newText: (action as any).parameters.text, newColor: (action as any).parameters.color };
      default:
        return (action as any).parameters;
    }
  }

  private createBehaviorSummary(behaviors: UserBehavior[]) {
    return {
      totalEvents: behaviors.length,
      eventTypes: behaviors.reduce((acc, b) => {
        acc[b.event_type] = (acc[b.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      avgSessionTime: behaviors
        .filter(b => b.duration)
        .reduce((sum, b) => sum + (b.duration || 0), 0) / behaviors.length,
      topPages: this.getTopPages(behaviors),
      conversionEvents: behaviors.filter(b => 
        ['consultation_request', 'contact_attempt'].includes(b.event_type)
      ).length
    };
  }

  private getTopPages(behaviors: UserBehavior[]): string[] {
    const pageCount = new Map<string, number>();
    behaviors.forEach(b => {
      pageCount.set(b.page_path, (pageCount.get(b.page_path) || 0) + 1);
    });
    
    return Array.from(pageCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([page]) => page);
  }

  private isHighValueEvent(eventType: BehaviorEventType): boolean {
    return ['consultation_request', 'contact_attempt', 'pricing_view', 'conversion'].includes(eventType);
  }

  private async triggerRealtimePersonalization(userId: string, behavior: Omit<UserBehavior, 'id'>): Promise<void> {
    // Trigger real-time updates for high-value events
    // This could integrate with WebSocket or Server-Sent Events
    console.log(`Triggering real-time personalization for user ${userId} after ${behavior.event_type}`);
  }

  private async updateUserProfileFromBehavior(userId: string, behavior: Omit<UserBehavior, 'id'>): Promise<void> {
    // Update user profile with new behavior insights
    // This would typically update engagement scores, preferences, etc.
  }

  private async trackPersonalizationEvent(
    userId: string,
    context: PersonalizationContext,
    metadata: Record<string, unknown>
  ): Promise<void> {
    await this.supabase
      .from('personalization_events')
      .insert({
        user_id: userId,
        session_id: context.session_id,
        event_type: 'personalization_applied',
        metadata,
        timestamp: new Date().toISOString()
      });
  }

  private async logRuleApplication(
    ruleId: string,
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    await this.supabase
      .from('rule_applications')
      .insert({
        rule_id: ruleId,
        user_id: userId,
        session_id: sessionId,
        applied_at: new Date().toISOString()
      });
  }
}

// Export singleton instance
export const personalizationEngine = new PersonalizationEngine();
