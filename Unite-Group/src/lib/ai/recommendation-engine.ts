/**
 * AI-Powered Recommendation Engine
 * Unite Group Advanced Personalization System
 */

import { 
  UserProfile, 
  ContentItem, 
  RecommendationRequest, 
  RecommendationResult,
  RecommendationAlgorithm,
  UserBehavior,
  PersonalizationContext,
  RecommendationMetrics
} from './types';

export interface RecommendationConfig {
  maxRecommendations: number;
  diversityFactor: number;
  recencyWeight: number;
  popularityWeight: number;
  personalityWeight: number;
  enableContentFiltering: boolean;
  enableCollaborativeFiltering: boolean;
  enableHybridRecommendations: boolean;
  cacheExpirationMinutes: number;
}

export const DEFAULT_RECOMMENDATION_CONFIG: RecommendationConfig = {
  maxRecommendations: 10,
  diversityFactor: 0.3,
  recencyWeight: 0.2,
  popularityWeight: 0.3,
  personalityWeight: 0.5,
  enableContentFiltering: true,
  enableCollaborativeFiltering: true,
  enableHybridRecommendations: true,
  cacheExpirationMinutes: 30
};

export class RecommendationEngine {
  private config: RecommendationConfig;
  private cache: Map<string, { recommendations: RecommendationResult[]; timestamp: number }> = new Map();
  private userBehaviorHistory: Map<string, UserBehavior[]> = new Map();
  private contentSimilarityMatrix: Map<string, Map<string, number>> = new Map();

  constructor(config: Partial<RecommendationConfig> = {}) {
    this.config = { ...DEFAULT_RECOMMENDATION_CONFIG, ...config };
  }

  /**
   * Generate personalized recommendations for a user
   */
  async generateRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cached = this.getCachedRecommendations(cacheKey);
      if (cached) return cached;

      let recommendations: RecommendationResult[] = [];

      // Apply different recommendation algorithms based on configuration
      if (this.config.enableHybridRecommendations) {
        recommendations = await this.generateHybridRecommendations(request);
      } else if (this.config.enableCollaborativeFiltering) {
        recommendations = await this.generateCollaborativeRecommendations(request);
      } else if (this.config.enableContentFiltering) {
        recommendations = await this.generateContentBasedRecommendations(request);
      } else {
        recommendations = await this.generatePopularityBasedRecommendations(request);
      }

      // Apply diversity filtering
      recommendations = this.applyDiversityFiltering(recommendations);

      // Cache results
      this.cacheRecommendations(cacheKey, recommendations);

      // Log recommendation metrics
      await this.logRecommendationMetrics(request, recommendations);

      return recommendations.slice(0, this.config.maxRecommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.generateFallbackRecommendations(request);
    }
  }

  /**
   * Hybrid recommendation algorithm combining multiple approaches
   */
  private async generateHybridRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const [
      contentBased,
      collaborative,
      popularity
    ] = await Promise.all([
      this.generateContentBasedRecommendations(request),
      this.generateCollaborativeRecommendations(request),
      this.generatePopularityBasedRecommendations(request)
    ]);

    // Combine recommendations with weighted scoring
    const combinedScores = new Map<string, number>();
    const allRecommendations = new Map<string, RecommendationResult>();

    // Content-based recommendations (highest weight for personalization)
    contentBased.forEach(rec => {
      combinedScores.set(rec.contentId, (rec.score * this.config.personalityWeight));
      allRecommendations.set(rec.contentId, rec);
    });

    // Collaborative filtering recommendations
    collaborative.forEach(rec => {
      const currentScore = combinedScores.get(rec.contentId) || 0;
      combinedScores.set(rec.contentId, currentScore + (rec.score * 0.3));
      if (!allRecommendations.has(rec.contentId)) {
        allRecommendations.set(rec.contentId, rec);
      }
    });

    // Popularity-based recommendations (lowest weight)
    popularity.forEach(rec => {
      const currentScore = combinedScores.get(rec.contentId) || 0;
      combinedScores.set(rec.contentId, currentScore + (rec.score * this.config.popularityWeight));
      if (!allRecommendations.has(rec.contentId)) {
        allRecommendations.set(rec.contentId, rec);
      }
    });

    // Sort by combined score and return
    return Array.from(combinedScores.entries())
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .map(([contentId]) => allRecommendations.get(contentId)!)
      .filter(Boolean);
  }

  /**
   * Content-based recommendation algorithm
   */
  private async generateContentBasedRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { userProfile, context, availableContent } = request;
    const recommendations: RecommendationResult[] = [];

    // Calculate content similarity based on user preferences
    for (const content of availableContent) {
      const score = this.calculateContentScore(content, userProfile, context);
      
      if (score > 0.1) { // Minimum threshold
        recommendations.push({
          contentId: content.id,
          content,
          score,
          algorithm: RecommendationAlgorithm.CONTENT_BASED,
          reasons: this.generateRecommendationReasons(content, userProfile, 'content'),
          confidence: this.calculateConfidence(score, RecommendationAlgorithm.CONTENT_BASED),
          metadata: {
            contentSimilarity: score,
            userProfileMatch: this.calculateProfileMatch(content, userProfile)
          }
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Collaborative filtering recommendation algorithm
   */
  private async generateCollaborativeRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { userProfile, availableContent } = request;
    const recommendations: RecommendationResult[] = [];

    // Find similar users based on behavior patterns
    const similarUsers = await this.findSimilarUsers(userProfile);

    // Get content preferences from similar users
    const collaborativeScores = new Map<string, number>();

    for (const similarUser of similarUsers) {
      const userBehavior = this.userBehaviorHistory.get(similarUser.userId) || [];
      
      for (const behavior of userBehavior) {
        // Check if required fields exist before using them
        if (behavior.contentId && behavior.engagementScore !== undefined) {
          const currentScore = collaborativeScores.get(behavior.contentId) || 0;
          const weightedScore = behavior.engagementScore * similarUser.similarity;
          collaborativeScores.set(behavior.contentId, currentScore + weightedScore);
        }
      }
    }

    // Convert to recommendations
    for (const content of availableContent) {
      const score = collaborativeScores.get(content.id) || 0;
      
      if (score > 0.1) {
        recommendations.push({
          contentId: content.id,
          content,
          score: Math.min(score, 1.0), // Normalize to 0-1
          algorithm: RecommendationAlgorithm.COLLABORATIVE_FILTERING,
          reasons: this.generateRecommendationReasons(content, userProfile, 'collaborative'),
          confidence: this.calculateConfidence(score, RecommendationAlgorithm.COLLABORATIVE_FILTERING),
          metadata: {
            similarUserCount: similarUsers.length,
            collaborativeScore: score
          }
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Popularity-based recommendation algorithm
   */
  private async generatePopularityBasedRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const { availableContent, context } = request;
    const recommendations: RecommendationResult[] = [];

    // Sort content by popularity metrics
    const sortedContent = availableContent
      .map((content: ContentItem) => ({
        content,
        popularityScore: this.calculatePopularityScore(content, context)
      }))
      .sort((a: { popularityScore: number }, b: { popularityScore: number }) => b.popularityScore - a.popularityScore);

    for (const { content, popularityScore } of sortedContent) {
      recommendations.push({
        contentId: content.id,
        content,
        score: popularityScore,
        algorithm: RecommendationAlgorithm.POPULARITY_BASED,
        reasons: [`Popular ${content.type}`, 'Trending content', 'High engagement'],
        confidence: this.calculateConfidence(popularityScore, RecommendationAlgorithm.POPULARITY_BASED),
        metadata: {
          popularityScore,
          trendingRank: recommendations.length + 1
        }
      });
    }

    return recommendations;
  }

  /**
   * Calculate content score based on user profile and context
   */
  private calculateContentScore(content: ContentItem, userProfile: UserProfile, context: PersonalizationContext): number {
    let score = 0;

    // Industry match
    if (content.categories.some((cat: string) => userProfile.interests.includes(cat))) {
      score += 0.4;
    }

    // Service type relevance
    if (content.serviceTypes?.some((service: string) => userProfile.preferredServices.includes(service))) {
      score += 0.3;
    }

    // Experience level match
    if (content.targetAudience?.includes(userProfile.experienceLevel)) {
      score += 0.2;
    }

    // Recency factor
    const daysOld = (Date.now() - new Date(content.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - (daysOld / 365)) * this.config.recencyWeight;
    score += recencyScore;

    // Context-based adjustments
    if (context.current_page && content.relatedPages?.includes(context.current_page)) {
      score += 0.1;
    }

    if (context.timeOfDay && content.timeRelevance?.includes(context.timeOfDay)) {
      score += 0.05;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate popularity score for content
   */
  private calculatePopularityScore(content: ContentItem, context: PersonalizationContext): number {
    let score = 0;

    // View count factor (normalized)
    score += Math.min(content.viewCount / 10000, 0.4);

    // Engagement rate
    if (content.engagementMetrics) {
      const engagementRate = (
        content.engagementMetrics.likes + 
        content.engagementMetrics.shares + 
        content.engagementMetrics.comments
      ) / Math.max(content.viewCount, 1);
      score += Math.min(engagementRate * 10, 0.3);
    }

    // Recency boost for newer content
    const daysOld = (Date.now() - new Date(content.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 7) {
      score += 0.2;
    } else if (daysOld < 30) {
      score += 0.1;
    }

    // Context relevance
    if (context.deviceType === 'mobile' && content.mobileOptimized) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Find users similar to the given user profile
   */
  private async findSimilarUsers(_userProfile: UserProfile): Promise<Array<{ userId: string; similarity: number }>> {
    // This would typically query a database of user profiles
    // For now, return mock similar users
    return [
      { userId: 'user1', similarity: 0.8 },
      { userId: 'user2', similarity: 0.7 },
      { userId: 'user3', similarity: 0.6 }
    ];
  }

  /**
   * Calculate profile match score between content and user
   */
  private calculateProfileMatch(content: ContentItem, userProfile: UserProfile): number {
    let matchScore = 0;
    const totalFactors = 4;

    // Industry match
    if (content.categories.some((cat: string) => userProfile.interests.includes(cat))) {
      matchScore += 1;
    }

    // Service preference match
    if (content.serviceTypes?.some((service: string) => userProfile.preferredServices.includes(service))) {
      matchScore += 1;
    }

    // Experience level match
    if (content.targetAudience?.includes(userProfile.experienceLevel)) {
      matchScore += 1;
    }

    // Budget range compatibility
    if (content.priceRange && userProfile.budgetRange) {
      const priceCompatible = content.priceRange.min <= userProfile.budgetRange.max && 
                             content.priceRange.max >= userProfile.budgetRange.min;
      if (priceCompatible) {
        matchScore += 1;
      }
    }

    return matchScore / totalFactors;
  }

  /**
   * Apply diversity filtering to recommendations
   */
  private applyDiversityFiltering(recommendations: RecommendationResult[]): RecommendationResult[] {
    if (this.config.diversityFactor <= 0) return recommendations;

    const diversified: RecommendationResult[] = [];
    const categoryCounts = new Map<string, number>();

    for (const rec of recommendations) {
      const primaryCategory = rec.content.categories[0];
      const currentCount = categoryCounts.get(primaryCategory) || 0;
      
      // Apply diversity penalty
      const diversityPenalty = currentCount * this.config.diversityFactor;
      const adjustedScore = rec.score * (1 - diversityPenalty);
      
      if (adjustedScore > 0.1) { // Minimum threshold after penalty
        diversified.push({
          ...rec,
          score: adjustedScore
        });
        categoryCounts.set(primaryCategory, currentCount + 1);
      }
    }

    return diversified.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate explanation for why content was recommended
   */
  private generateRecommendationReasons(
    content: ContentItem, 
    userProfile: UserProfile, 
    algorithmType: 'content' | 'collaborative' | 'popularity'
  ): string[] {
    const reasons: string[] = [];

    switch (algorithmType) {
      case 'content':
        if (content.categories.some((cat: string) => userProfile.interests.includes(cat))) {
          reasons.push(`Matches your interest in ${content.categories[0]}`);
        }
        if (content.serviceTypes?.some((service: string) => userProfile.preferredServices.includes(service))) {
          reasons.push('Related to your preferred services');
        }
        break;

      case 'collaborative':
        reasons.push('Users with similar interests also viewed this');
        reasons.push('Popular among professionals in your industry');
        break;

      case 'popularity':
        reasons.push('Trending content');
        reasons.push('High engagement from other users');
        break;
    }

    if (reasons.length === 0) {
      reasons.push('Recommended for you');
    }

    return reasons;
  }

  /**
   * Calculate confidence score for recommendation
   */
  private calculateConfidence(score: number, algorithm: RecommendationAlgorithm): number {
    const baseConfidence = score;
    
    // Adjust confidence based on algorithm type
    switch (algorithm) {
      case RecommendationAlgorithm.CONTENT_BASED:
        return Math.min(baseConfidence * 1.1, 1.0); // Higher confidence for content-based
      case RecommendationAlgorithm.COLLABORATIVE_FILTERING:
        return baseConfidence * 0.9; // Slightly lower confidence
      case RecommendationAlgorithm.POPULARITY_BASED:
        return baseConfidence * 0.8; // Lower confidence for popularity-based
      case RecommendationAlgorithm.HYBRID:
        return baseConfidence; // Standard confidence
      default:
        return baseConfidence;
    }
  }

  /**
   * Generate fallback recommendations when main algorithms fail
   */
  private generateFallbackRecommendations(request: RecommendationRequest): RecommendationResult[] {
    const { availableContent } = request;
    
    return availableContent
      .slice(0, this.config.maxRecommendations)
      .map((content: ContentItem, index: number) => ({
        contentId: content.id,
        content,
        score: 0.5 - (index * 0.05), // Decreasing fallback scores
        algorithm: RecommendationAlgorithm.POPULARITY_BASED,
        reasons: ['Fallback recommendation'],
        confidence: 0.3,
        metadata: {
          fallback: true,
          originalRank: index + 1
        }
      }));
  }

  /**
   * Cache management
   */
  private generateCacheKey(request: RecommendationRequest): string {
    return `rec_${request.userProfile.userId}_${request.context.current_page}_${Date.now()}`;
  }

  private getCachedRecommendations(cacheKey: string): RecommendationResult[] | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    const expirationTime = this.config.cacheExpirationMinutes * 60 * 1000;
    
    if (now - cached.timestamp > expirationTime) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.recommendations;
  }

  private cacheRecommendations(cacheKey: string, recommendations: RecommendationResult[]): void {
    this.cache.set(cacheKey, {
      recommendations,
      timestamp: Date.now()
    });

    // Cleanup old cache entries
    if (this.cache.size > 1000) {
      const entries = Array.from(this.cache.entries());
      const oldestEntries = entries
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)
        .slice(0, 100);
      
      oldestEntries.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Update user behavior for future recommendations
   */
  async updateUserBehavior(userId: string, behavior: UserBehavior): Promise<void> {
    const currentBehavior = this.userBehaviorHistory.get(userId) || [];
    currentBehavior.push(behavior);
    
    // Keep only recent behavior (last 100 interactions)
    if (currentBehavior.length > 100) {
      currentBehavior.splice(0, currentBehavior.length - 100);
    }
    
    this.userBehaviorHistory.set(userId, currentBehavior);
  }

  /**
   * Log recommendation metrics for analysis
   */
  private async logRecommendationMetrics(
    request: RecommendationRequest, 
    recommendations: RecommendationResult[]
  ): Promise<void> {
    const metrics: RecommendationMetrics = {
      userId: request.userProfile.userId,
      timestamp: new Date().toISOString(),
      algorithmUsed: this.config.enableHybridRecommendations ? 
        RecommendationAlgorithm.HYBRID : RecommendationAlgorithm.CONTENT_BASED,
      recommendationCount: recommendations.length,
      averageScore: recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.length,
      averageConfidence: recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length,
      topCategory: recommendations[0]?.content.categories[0] || 'unknown',
      context: request.context
    };

    // This would typically log to a analytics service or database
    console.log('Recommendation metrics:', metrics);
  }

  /**
   * Get recommendation statistics
   */
  getRecommendationStats(): {
    cacheSize: number;
    userBehaviorSize: number;
    configuredAlgorithms: string[];
  } {
    const algorithms: string[] = [];
    if (this.config.enableContentFiltering) algorithms.push('content-based');
    if (this.config.enableCollaborativeFiltering) algorithms.push('collaborative');
    if (this.config.enableHybridRecommendations) algorithms.push('hybrid');

    return {
      cacheSize: this.cache.size,
      userBehaviorSize: this.userBehaviorHistory.size,
      configuredAlgorithms: algorithms
    };
  }
}

// Export singleton instance
let recommendationEngineInstance: RecommendationEngine | null = null;

export function getRecommendationEngine(config?: Partial<RecommendationConfig>): RecommendationEngine {
  if (!recommendationEngineInstance) {
    recommendationEngineInstance = new RecommendationEngine(config);
  }
  return recommendationEngineInstance;
}

export default RecommendationEngine;
