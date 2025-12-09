/**
 * Advanced Lead Scoring Framework
 * Phase 6 Week 3 - Multi-factor lead scoring with historical accuracy tracking
 */

export interface LeadScoringInput {
  contactId: string;
  engagementMetrics: {
    emailsReceived: number;
    emailsOpened: number;
    emailsClicked: number;
    repliesReceived: number;
    meetingsScheduled: number;
    pageViews: number;
    timeOnSite: number; // minutes
  };
  firmographics: {
    companySize: "1-10" | "11-50" | "51-200" | "201-1000" | "1000+";
    industry: string;
    revenue: number; // millions
    location: string;
    stage: "seed" | "series-a" | "series-b" | "growth" | "public";
  };
  demographics: {
    jobTitle: string;
    level: "individual" | "manager" | "director" | "executive" | "ceo";
    department: string;
    yearsInRole: number;
  };
  behavioralSignals: {
    contentDownloads: number;
    webinarAttendance: number;
    caseStudyReads: number;
    demoRequests: number;
    pricingPageViews: number;
  };
  engagement: {
    sentimentScore: number; // 0-100
    responseTime: number; // hours
    interactionFrequency: number; // per week
    lastInteractionDaysAgo: number;
  };
}

export interface LeadScore {
  contactId: string;
  totalScore: number; // 0-100
  scoreBreakdown: {
    engagement: number;
    firmographic: number;
    demographic: number;
    behavioral: number;
    temporal: number;
  };
  tier: "hot" | "warm" | "lukewarm" | "cold";
  trend: "increasing" | "stable" | "decreasing";
  nextReviewDate: Date;
  historicalAccuracy: number; // 0-1
  modelConfidence: number; // 0-1
}

export class LeadScoringFramework {
  private decayFactor: number = 0.05; // Engagement decay per day
  private weights = {
    engagement: 0.35,
    firmographic: 0.25,
    demographic: 0.15,
    behavioral: 0.15,
    temporal: 0.1,
  };

  /**
   * Calculate engagement score (0-100)
   * Based on email and interaction metrics
   */
  private calculateEngagementScore(metrics: LeadScoringInput["engagementMetrics"]): number {
    let score = 0;
    let maxScore = 0;

    // Email engagement (0-30 points)
    const emailsReceived = Math.min(metrics.emailsReceived, 10);
    const openRate = metrics.emailsReceived > 0
      ? metrics.emailsOpened / metrics.emailsReceived
      : 0;
    const clickRate = metrics.emailsReceived > 0
      ? metrics.emailsClicked / metrics.emailsReceived
      : 0;

    score += (openRate * 15) + (clickRate * 15);
    maxScore += 30;

    // Direct responses (0-25 points)
    const responsePoints = Math.min(metrics.repliesReceived * 5, 25);
    score += responsePoints;
    maxScore += 25;

    // Meetings (0-20 points)
    const meetingPoints = Math.min(metrics.meetingsScheduled * 10, 20);
    score += meetingPoints;
    maxScore += 20;

    // Website engagement (0-25 points)
    const pageViewScore = Math.min(metrics.pageViews / 10, 10);
    const timeOnSiteScore = Math.min(metrics.timeOnSite / 30, 15);
    score += pageViewScore + timeOnSiteScore;
    maxScore += 25;

    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  }

  /**
   * Calculate firmographic fit score (0-100)
   * Based on company characteristics
   */
  private calculateFirmographicScore(firmographics: LeadScoringInput["firmographics"]): number {
    let score = 0;
    const weights = {
      size: 0.3,
      revenue: 0.3,
      stage: 0.25,
      industry: 0.15,
    };

    // Company size scoring
    const sizeScores: Record<string, number> = {
      "1-10": 0.6,
      "11-50": 0.8,
      "51-200": 0.9,
      "201-1000": 1.0,
      "1000+": 0.8, // May be less likely to convert
    };
    score += (sizeScores[firmographics.companySize] || 0.5) * weights.size * 100;

    // Revenue potential
    const revenueFactor = Math.min(firmographics.revenue / 100, 1); // 100M+ = max
    score += revenueFactor * weights.revenue * 100;

    // Company stage
    const stageScores: Record<string, number> = {
      seed: 0.4,
      "series-a": 0.7,
      "series-b": 0.85,
      growth: 0.95,
      public: 0.7,
    };
    score += (stageScores[firmographics.stage] || 0.5) * weights.stage * 100;

    // Industry fit (mock - in production would use historical conversion data)
    const goodIndustries = ["technology", "saas", "fintech"];
    const industryScore = goodIndustries.some((ind) =>
      firmographics.industry.toLowerCase().includes(ind)
    )
      ? 0.9
      : 0.6;
    score += industryScore * weights.industry * 100;

    return Math.min(score, 100);
  }

  /**
   * Calculate demographic fit score (0-100)
   * Based on job title and seniority
   */
  private calculateDemographicScore(demographics: LeadScoringInput["demographics"]): number {
    let score = 0;
    const levelWeight = 0.6;
    const deptWeight = 0.25;
    const experienceWeight = 0.15;

    // Job level scoring
    const levelScores: Record<string, number> = {
      individual: 0.5,
      manager: 0.7,
      director: 0.85,
      executive: 0.95,
      ceo: 1.0,
    };
    score += (levelScores[demographics.level] || 0.5) * levelWeight * 100;

    // Department fit
    const buyingDepartments = ["sales", "marketing", "operations", "executive"];
    const deptScore = buyingDepartments.some((dept) =>
      demographics.department.toLowerCase().includes(dept)
    )
      ? 0.9
      : 0.6;
    score += deptScore * deptWeight * 100;

    // Experience factor (more experienced = higher score)
    const experienceFactor = Math.min(demographics.yearsInRole / 5, 1);
    score += experienceFactor * experienceWeight * 100;

    return Math.min(score, 100);
  }

  /**
   * Calculate behavioral signals score (0-100)
   * Based on intent-indicating actions
   */
  private calculateBehavioralScore(behavioral: LeadScoringInput["behavioralSignals"]): number {
    let score = 0;
    let signals = 0;

    // Content downloads (0-20 points)
    score += Math.min(behavioral.contentDownloads * 4, 20);
    signals += behavioral.contentDownloads;

    // Webinar attendance (0-15 points)
    score += Math.min(behavioral.webinarAttendance * 7.5, 15);
    signals += behavioral.webinarAttendance;

    // Case study reads (0-20 points)
    score += Math.min(behavioral.caseStudyReads * 4, 20);
    signals += behavioral.caseStudyReads;

    // Demo requests (0-30 points)
    score += Math.min(behavioral.demoRequests * 10, 30);
    signals += behavioral.demoRequests * 3;

    // Pricing page views (0-15 points)
    score += Math.min(behavioral.pricingPageViews * 3, 15);
    signals += behavioral.pricingPageViews;

    return Math.min(score, 100);
  }

  /**
   * Calculate temporal decay score
   * Recent engagement = higher score
   */
  private calculateTemporalScore(engagement: LeadScoringInput["engagement"]): number {
    const daysAgo = engagement.lastInteractionDaysAgo;
    const decayedScore = 100 * Math.exp(-this.decayFactor * daysAgo);

    return Math.max(decayedScore, 5); // Minimum 5% even if stale
  }

  /**
   * Generate comprehensive lead score
   */
  generateScore(input: LeadScoringInput): LeadScore {
    const engagementScore = this.calculateEngagementScore(input.engagementMetrics);
    const firmographicScore = this.calculateFirmographicScore(input.firmographics);
    const demographicScore = this.calculateDemographicScore(input.demographics);
    const behavioralScore = this.calculateBehavioralScore(input.behavioralSignals);
    const temporalScore = this.calculateTemporalScore(input.engagement);

    // Calculate weighted total
    const totalScore =
      engagementScore * this.weights.engagement +
      firmographicScore * this.weights.firmographic +
      demographicScore * this.weights.demographic +
      behavioralScore * this.weights.behavioral +
      temporalScore * this.weights.temporal;

    // Determine tier
    let tier: "hot" | "warm" | "lukewarm" | "cold";
    if (totalScore >= 80) {
tier = "hot";
} else if (totalScore >= 60) {
tier = "warm";
} else if (totalScore >= 40) {
tier = "lukewarm";
} else {
tier = "cold";
}

    // Determine trend (mock - in production would compare to previous score)
    const trend: "increasing" | "stable" | "decreasing" = totalScore > 70 ? "increasing" : "stable";

    // Calculate model confidence
    const modelConfidence =
      (input.engagementMetrics.emailsReceived +
        input.behavioralSignals.demoRequests) /
      10;

    // Next review date (more frequently for hot leads)
    const daysUntilReview =
      tier === "hot" ? 3 : tier === "warm" ? 7 : 14;
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + daysUntilReview);

    return {
      contactId: input.contactId,
      totalScore: Math.round(totalScore),
      scoreBreakdown: {
        engagement: Math.round(engagementScore),
        firmographic: Math.round(firmographicScore),
        demographic: Math.round(demographicScore),
        behavioral: Math.round(behavioralScore),
        temporal: Math.round(temporalScore),
      },
      tier,
      trend,
      nextReviewDate,
      historicalAccuracy: 0.85, // Mock accuracy
      modelConfidence: Math.min(modelConfidence, 1),
    };
  }

  /**
   * Batch score multiple leads
   */
  batchScore(inputs: LeadScoringInput[]): LeadScore[] {
    return inputs.map((input) => this.generateScore(input));
  }

  /**
   * Calculate score change over time
   */
  calculateScoreTrend(
    currentScore: number,
    previousScores: number[]
  ): "increasing" | "stable" | "decreasing" {
    if (previousScores.length === 0) {
return "stable";
}

    const avgPrevious =
      previousScores.reduce((a, b) => a + b, 0) / previousScores.length;
    const change = currentScore - avgPrevious;

    if (Math.abs(change) < 5) {
return "stable";
}
    return change > 0 ? "increasing" : "decreasing";
  }

  /**
   * Get recommended actions based on score
   */
  getRecommendedActions(score: LeadScore): string[] {
    const actions: string[] = [];

    if (score.tier === "hot") {
      actions.push("Schedule sales call immediately");
      actions.push("Prepare custom proposal");
      actions.push("Assign dedicated account manager");
    } else if (score.tier === "warm") {
      actions.push("Send personalized follow-up");
      actions.push("Offer product demo");
      actions.push("Share relevant case studies");
    } else if (score.tier === "lukewarm") {
      actions.push("Add to nurture drip campaign");
      actions.push("Share educational webinars");
      actions.push("Monitor for engagement signals");
    } else {
      actions.push("Add to cold outreach sequence");
      actions.push("Focus on awareness-stage content");
      actions.push("Re-engage in 30 days");
    }

    if (score.trend === "increasing") {
      actions.push("Accelerate sales process");
    } else if (score.trend === "decreasing") {
      actions.push("Investigate cause of decline");
      actions.push("Re-engage with relevant content");
    }

    return actions;
  }

  /**
   * Validate score accuracy against actual outcomes
   */
  validateAccuracy(
    scores: LeadScore[],
    outcomes: Array<{ contactId: string; converted: boolean }>
  ): {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    scoreCalibration: number;
  } {
    let correct = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let calibrationError = 0;

    for (const outcome of outcomes) {
      const score = scores.find((s) => s.contactId === outcome.contactId);
      if (!score) {
continue;
}

      const predicted = score.tier === "hot" || score.tier === "warm";
      correct += predicted === outcome.converted ? 1 : 0;

      if (predicted && outcome.converted) {
truePositives++;
} else if (predicted && !outcome.converted) {
falsePositives++;
} else if (!predicted && outcome.converted) {
falseNegatives++;
}

      // Track calibration error
      const expectedConversion = score.totalScore / 100;
      calibrationError += Math.abs(expectedConversion - (outcome.converted ? 1 : 0));
    }

    const total = outcomes.length;
    const accuracy = total > 0 ? correct / total : 0;
    const precision =
      truePositives + falsePositives > 0
        ? truePositives / (truePositives + falsePositives)
        : 0;
    const recall =
      truePositives + falseNegatives > 0
        ? truePositives / (truePositives + falseNegatives)
        : 0;
    const f1Score =
      precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0;
    const scoreCalibration = 1 - calibrationError / total;

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      scoreCalibration,
    };
  }
}

// Singleton instance
let instance: LeadScoringFramework | null = null;

export function getLeadScoringFramework(): LeadScoringFramework {
  if (!instance) {
    instance = new LeadScoringFramework();
  }
  return instance;
}
