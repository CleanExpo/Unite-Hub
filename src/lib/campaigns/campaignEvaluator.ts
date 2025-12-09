/**
 * Campaign Evaluator
 * Scores campaign blueprints for difficulty, impact, and effort
 * Integrates analytics data and brand capabilities for accurate scoring
 */

import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ service: 'campaignEvaluator' });

export interface EvaluationRequest {
  topicKeywords: string[];
  selectedChannels: string[];
  brandSlug: string;
  analyticsInsights?: any;
  contentComplexity?: 'simple' | 'moderate' | 'complex';
}

export interface EvaluationResult {
  difficulty_score: number; // 1-10
  impact_score: number; // 1-10
  effort_score: number; // 1-10
  priority_score: number; // Calculated: (impact * 10) / (difficulty + effort)
  reasoning: {
    difficulty_factors: string[];
    impact_factors: string[];
    effort_factors: string[];
  };
}

export class CampaignEvaluator {
  /**
   * Evaluate campaign blueprint for difficulty, impact, and effort
   */
  evaluateCampaign(request: EvaluationRequest): EvaluationResult {
    const difficulty = this.calculateDifficulty(request);
    const impact = this.calculateImpact(request);
    const effort = this.calculateEffort(request);

    const priority = this.calculatePriority(difficulty.score, impact.score, effort.score);

    return {
      difficulty_score: difficulty.score,
      impact_score: impact.score,
      effort_score: effort.score,
      priority_score: priority,
      reasoning: {
        difficulty_factors: difficulty.factors,
        impact_factors: impact.factors,
        effort_factors: effort.factors,
      },
    };
  }

  /**
   * Calculate difficulty score (1-10)
   * Factors: Competition, keyword difficulty, content complexity, channel requirements
   */
  private calculateDifficulty(request: EvaluationRequest): { score: number; factors: string[] } {
    let score = 5; // Base difficulty
    const factors: string[] = [];

    // Analytics-based difficulty
    if (request.analyticsInsights) {
      const keywordDifficulty = request.analyticsInsights.keyword_difficulty || 50;

      if (keywordDifficulty >= 70) {
        score += 2;
        factors.push(`High keyword difficulty (${keywordDifficulty}/100)`);
      } else if (keywordDifficulty >= 50) {
        score += 1;
        factors.push(`Moderate keyword difficulty (${keywordDifficulty}/100)`);
      } else {
        score -= 1;
        factors.push(`Low keyword difficulty (${keywordDifficulty}/100)`);
      }

      const competition = request.analyticsInsights.competition || 0.5;
      if (competition >= 0.8) {
        score += 1;
        factors.push(`High competition (${(competition * 100).toFixed(0)}%)`);
      } else if (competition <= 0.3) {
        score -= 1;
        factors.push(`Low competition (${(competition * 100).toFixed(0)}%)`);
      }
    }

    // Channel complexity
    const channelComplexity = this.getChannelComplexity(request.selectedChannels);
    score += channelComplexity.adjustment;
    factors.push(...channelComplexity.factors);

    // Content complexity
    if (request.contentComplexity === 'complex') {
      score += 1;
      factors.push('Complex content requirements');
    } else if (request.contentComplexity === 'simple') {
      score -= 1;
      factors.push('Simple content requirements');
    }

    // Brand-specific adjustments
    const brandAdjustment = this.getBrandDifficultyAdjustment(request.brandSlug);
    score += brandAdjustment.adjustment;
    if (brandAdjustment.reason) {
factors.push(brandAdjustment.reason);
}

    // Clamp score between 1-10
    score = Math.max(1, Math.min(10, Math.round(score)));

    return { score, factors };
  }

  /**
   * Calculate impact score (1-10)
   * Factors: Search volume, audience size, conversion potential, strategic alignment
   */
  private calculateImpact(request: EvaluationRequest): { score: number; factors: string[] } {
    let score = 5; // Base impact
    const factors: string[] = [];

    // Analytics-based impact
    if (request.analyticsInsights) {
      const searchVolume = request.analyticsInsights.search_volume || 0;

      if (searchVolume >= 10000) {
        score += 3;
        factors.push(`High search volume (${searchVolume.toLocaleString()}/month)`);
      } else if (searchVolume >= 1000) {
        score += 2;
        factors.push(`Moderate search volume (${searchVolume.toLocaleString()}/month)`);
      } else if (searchVolume >= 100) {
        score += 1;
        factors.push(`Low-medium search volume (${searchVolume.toLocaleString()}/month)`);
      } else {
        score -= 1;
        factors.push(`Very low search volume (${searchVolume}/month)`);
      }

      const cpc = request.analyticsInsights.cpc || 0;
      if (cpc >= 5) {
        score += 1;
        factors.push(`High commercial intent (CPC $${cpc.toFixed(2)})`);
      }
    }

    // Channel reach impact
    const channelReach = this.getChannelReachImpact(request.selectedChannels);
    score += channelReach.adjustment;
    factors.push(...channelReach.factors);

    // Strategic value for brand
    const strategicValue = this.getStrategicValue(request.brandSlug, request.topicKeywords);
    score += strategicValue.adjustment;
    factors.push(...strategicValue.factors);

    // Clamp score between 1-10
    score = Math.max(1, Math.min(10, Math.round(score)));

    return { score, factors };
  }

  /**
   * Calculate effort score (1-10)
   * Factors: Number of channels, content volume, coordination requirements
   */
  private calculateEffort(request: EvaluationRequest): { score: number; factors: string[] } {
    let score = 3; // Base effort
    const factors: string[] = [];

    // Channel count
    const channelCount = request.selectedChannels.length;
    if (channelCount >= 7) {
      score += 3;
      factors.push(`Many channels (${channelCount} channels)`);
    } else if (channelCount >= 4) {
      score += 2;
      factors.push(`Multiple channels (${channelCount} channels)`);
    } else if (channelCount >= 2) {
      score += 1;
      factors.push(`Few channels (${channelCount} channels)`);
    }

    // Content volume requirements
    const hasLongForm = request.selectedChannels.some(c =>
      c.includes('blog') || c.includes('website')
    );
    if (hasLongForm) {
      score += 1;
      factors.push('Includes long-form content (blog/website)');
    }

    const hasVideo = request.selectedChannels.some(c =>
      c.includes('video') || c.includes('tiktok') || c.includes('youtube')
    );
    if (hasVideo) {
      score += 2;
      factors.push('Includes video production');
    }

    // Email sequences require more effort
    if (request.selectedChannels.includes('email_nurture_sequence')) {
      score += 1;
      factors.push('Email nurture sequence (5-7 emails)');
    }

    // Visual requirements
    const visualsNeeded = this.estimateVisualsNeeded(request.selectedChannels);
    if (visualsNeeded >= 10) {
      score += 2;
      factors.push(`Many visuals needed (${visualsNeeded}+ assets)`);
    } else if (visualsNeeded >= 5) {
      score += 1;
      factors.push(`Multiple visuals needed (${visualsNeeded} assets)`);
    }

    // Clamp score between 1-10
    score = Math.max(1, Math.min(10, Math.round(score)));

    return { score, factors };
  }

  /**
   * Calculate priority score
   * Formula: (impact * 10) / (difficulty + effort)
   */
  private calculatePriority(difficulty: number, impact: number, effort: number): number {
    if (difficulty + effort === 0) {
return 100;
}
    return Math.round(((impact * 10) / (difficulty + effort)) * 100) / 100;
  }

  /**
   * Get channel complexity adjustment
   */
  private getChannelComplexity(channels: string[]): { adjustment: number; factors: string[] } {
    let adjustment = 0;
    const factors: string[] = [];

    // LinkedIn posts require more professional polish
    if (channels.includes('linkedin_post')) {
      adjustment += 0.5;
      factors.push('LinkedIn requires professional tone');
    }

    // Blog pillar posts are comprehensive
    if (channels.includes('blog_pillar_post')) {
      adjustment += 1;
      factors.push('Pillar post requires comprehensive research');
    }

    // Video content is more complex
    const videoChannels = channels.filter(c => c.includes('video') || c.includes('youtube') || c.includes('tiktok'));
    if (videoChannels.length > 0) {
      adjustment += 1;
      factors.push('Video content requires scripting and production');
    }

    return { adjustment, factors };
  }

  /**
   * Get brand-specific difficulty adjustment
   */
  private getBrandDifficultyAdjustment(brandSlug: string): { adjustment: number; reason?: string } {
    // Technical brands (R&P Tech) have higher content difficulty
    if (brandSlug === 'rp_tech') {
      return { adjustment: 0.5, reason: 'Technical content requires specialized knowledge' };
    }

    // Premium brands (Ultra Chrome) require higher quality standards
    if (brandSlug === 'ultra_chrome') {
      return { adjustment: 0.5, reason: 'Premium brand requires meticulous quality' };
    }

    return { adjustment: 0 };
  }

  /**
   * Get channel reach impact
   */
  private getChannelReachImpact(channels: string[]): { adjustment: number; factors: string[] } {
    let adjustment = 0;
    const factors: string[] = [];

    // Website channels have long-term SEO value
    if (channels.some(c => c.includes('website'))) {
      adjustment += 1;
      factors.push('Website content has long-term SEO value');
    }

    // Social media for brand awareness
    const socialChannels = channels.filter(c =>
      c.includes('facebook') || c.includes('instagram') || c.includes('linkedin')
    );
    if (socialChannels.length >= 2) {
      adjustment += 1;
      factors.push('Multi-platform social reach');
    }

    // Email for direct communication
    if (channels.some(c => c.includes('email'))) {
      adjustment += 0.5;
      factors.push('Direct audience communication via email');
    }

    return { adjustment, factors };
  }

  /**
   * Get strategic value for brand
   */
  private getStrategicValue(brandSlug: string, keywords: string[]): { adjustment: number; factors: string[] } {
    const factors: string[] = [];

    // Check if keywords align with brand focus
    const brandKeywords: Record<string, string[]> = {
      unite_group: ['stainless', 'steel', 'balustrade', 'metalwork', 'commercial'],
      aussie_stainless: ['stainless', 'craftsmanship', 'australian', 'balustrade'],
      rp_tech: ['technology', 'innovation', 'software', 'automation', 'efficiency'],
      bne_glass_pool_fencing: ['glass', 'pool', 'fencing', 'safety', 'brisbane'],
      ultra_chrome: ['chrome', 'premium', 'finishing', 'luxury'],
    };

    const brandFocus = brandKeywords[brandSlug] || [];
    const alignment = keywords.filter(kw =>
      brandFocus.some(focus => kw.toLowerCase().includes(focus.toLowerCase()))
    ).length;

    if (alignment >= 2) {
      factors.push('Strong alignment with brand focus areas');
      return { adjustment: 1, factors };
    } else if (alignment >= 1) {
      factors.push('Moderate alignment with brand focus');
      return { adjustment: 0.5, factors };
    }

    return { adjustment: 0, factors };
  }

  /**
   * Estimate visuals needed
   */
  private estimateVisualsNeeded(channels: string[]): number {
    let count = 0;

    if (channels.some(c => c.includes('website'))) {
count += 3;
} // Hero + sections
    if (channels.some(c => c.includes('blog'))) {
count += 5;
} // Featured + in-content
    if (channels.includes('facebook_post')) {
count += 1;
}
    if (channels.includes('instagram_post')) {
count += 2;
} // Feed + story
    if (channels.includes('linkedin_post')) {
count += 1;
}
    if (channels.includes('tiktok_video')) {
count += 3;
} // Thumbnail + b-roll
    if (channels.includes('youtube_short')) {
count += 2;
} // Thumbnail + end screen

    return count;
  }
}

export const campaignEvaluator = new CampaignEvaluator();
