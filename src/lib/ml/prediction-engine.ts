/**
 * Prediction Engine
 * Phase 6 Week 3 - Conversion, churn, and lead scoring predictions
 *
 * Uses historical patterns and engagement signals to predict future outcomes
 */

export interface LeadDataPoint {
  id: string;
  engagementFrequency: number; // emails/month
  sentimentScore: number; // 0-100
  intentQuality: number; // 0-100
  jobTitle: string;
  industry: string;
  companySize: number;
  daysActive: number;
  lastEngagementDays: number;
  openRate: number; // 0-1
  clickRate: number; // 0-1
  responseRate: number; // 0-1
}

export interface PredictionResult {
  leadId: string;
  conversionProbability: number; // 0-1
  churnRisk: number; // 0-1
  leadScore: number; // 0-100
  confidence: number; // 0-1
  confidenceInterval: {
    lower: number; // 0-1
    upper: number; // 0-1
  };
  recommendedActions: string[];
  riskFactors: string[];
  opportunityFactors: string[];
  predictedTimelineWeeks: number;
}

export class PredictionEngine {
  /**
   * Predict conversion probability for a lead
   * Uses engagement patterns and interaction quality
   */
  predictConversion(lead: LeadDataPoint): {
    probability: number;
    confidence: number;
    factors: string[];
  } {
    let conversionScore = 0;
    let factorCount = 0;
    const factors: string[] = [];

    // 1. Engagement frequency (weight: 25%)
    const frequencyNorm = Math.min(lead.engagementFrequency / 10, 1);
    const frequencyScore = frequencyNorm * 0.25;
    conversionScore += frequencyScore;
    factorCount++;

    if (frequencyNorm > 0.5) {
      factors.push("High engagement frequency detected");
    } else if (frequencyNorm < 0.2) {
      factors.push("Low engagement frequency - risky");
    }

    // 2. Sentiment score (weight: 20%)
    const sentimentNorm = lead.sentimentScore / 100;
    const sentimentScore = sentimentNorm * 0.2;
    conversionScore += sentimentScore;
    factorCount++;

    if (sentimentNorm > 0.7) {
      factors.push("Very positive sentiment");
    } else if (sentimentNorm < 0.4) {
      factors.push("Negative sentiment detected");
    }

    // 3. Intent quality (weight: 20%)
    const intentNorm = lead.intentQuality / 100;
    const intentScore = intentNorm * 0.2;
    conversionScore += intentScore;
    factorCount++;

    if (intentNorm > 0.7) {
      factors.push("Clear buying intent signals");
    }

    // 4. Click-through rate (weight: 15%)
    const ctrScore = lead.clickRate * 0.15;
    conversionScore += ctrScore;
    factorCount++;

    if (lead.clickRate > 0.3) {
      factors.push("Excellent click engagement");
    }

    // 5. Response rate (weight: 10%)
    const responseScore = lead.responseRate * 0.1;
    conversionScore += responseScore;
    factorCount++;

    if (lead.responseRate > 0.1) {
      factors.push("Responsive to outreach");
    }

    // 6. Recency penalty (weight: 10%)
    const recencyDays = Math.max(lead.lastEngagementDays, 1);
    const recencyDecay = Math.exp(-recencyDays / 30); // Exponential decay over 30 days
    const recencyScore = recencyDecay * 0.1;
    conversionScore += recencyScore;
    factorCount++;

    if (recencyDays > 14) {
      factors.push("Engagement is stale - follow up needed");
    }

    // Calculate confidence based on data quality
    const dataQuality =
      (frequencyNorm + sentimentNorm + intentNorm + lead.clickRate) / 4;
    const confidence = Math.min(dataQuality * 0.9 + 0.1, 1); // 10-100% confidence

    return {
      probability: Math.min(conversionScore, 1),
      confidence,
      factors,
    };
  }

  /**
   * Predict churn risk for a lead
   * Uses engagement decay and inactivity patterns
   */
  predictChurn(lead: LeadDataPoint): {
    risk: number;
    confidence: number;
    factors: string[];
  } {
    let churnScore = 0;
    const factors: string[] = [];

    // 1. Days since last engagement (weight: 30%)
    const inactiveDays = Math.max(lead.lastEngagementDays, 1);
    const inactivityRisk = Math.min(inactiveDays / 60, 1); // 60 days = max risk
    churnScore += inactivityRisk * 0.3;

    if (inactiveDays > 30) {
      factors.push(`No engagement for ${inactiveDays} days`);
    }

    // 2. Declining engagement frequency (weight: 20%)
    const engagementTrend = lead.engagementFrequency > 5 ? 0.2 : 0.4;
    churnScore += engagementTrend;

    if (lead.engagementFrequency < 2) {
      factors.push("Engagement frequency declining");
    }

    // 3. Low sentiment (weight: 15%)
    const negativeSentiment = Math.max(1 - lead.sentimentScore / 100, 0);
    churnScore += negativeSentiment * 0.15;

    if (lead.sentimentScore < 40) {
      factors.push("Negative sentiment indicates dissatisfaction");
    }

    // 4. Low open rate (weight: 15%)
    const lowOpenRate = Math.max(1 - lead.openRate, 0);
    churnScore += lowOpenRate * 0.15;

    if (lead.openRate < 0.2) {
      factors.push("Very low email open rates");
    }

    // 5. Industry/company fit (weight: 10%)
    const industryChurn = this.getIndustryChurnRate(lead.industry);
    churnScore += industryChurn * 0.1;

    // 6. Account age (weight: 10%)
    const accountAge = Math.min(lead.daysActive / 365, 1); // 1 year = mature
    const accountAgeScore = Math.max(1 - accountAge * 0.5, 0.5); // Older = lower risk
    churnScore += accountAgeScore * 0.1;

    if (lead.daysActive < 30) {
      factors.push("New account - may need more nurturing");
    }

    const confidence = Math.min(
      (lead.engagementFrequency + lead.openRate) / 2 + 0.3,
      1
    );

    return {
      risk: Math.min(churnScore, 1),
      confidence,
      factors,
    };
  }

  /**
   * Generate comprehensive lead score (0-100)
   * Combines engagement, fit, and conversion probability
   */
  generateLeadScore(lead: LeadDataPoint): {
    score: number;
    tier: string;
    components: Record<string, number>;
  } {
    const conversion = this.predictConversion(lead);
    const churn = this.predictChurn(lead);

    // Calculate composite score components
    const engagementScore = (lead.engagementFrequency / 10) * 40; // 0-40 points
    const qualityScore = (lead.intentQuality / 100) * 30; // 0-30 points
    const sentimentScore = (lead.sentimentScore / 100) * 20; // 0-20 points
    const churnAdjustment = (1 - churn.risk) * 10; // 0-10 points (subtract risk)

    const totalScore = Math.min(
      engagementScore + qualityScore + sentimentScore + churnAdjustment,
      100
    );

    // Determine tier
    let tier = "Cold";
    if (totalScore >= 80) {
tier = "Hot";
} else if (totalScore >= 60) {
tier = "Warm";
} else if (totalScore >= 40) {
tier = "Lukewarm";
}

    return {
      score: Math.round(totalScore),
      tier,
      components: {
        engagement: Math.round(engagementScore),
        quality: Math.round(qualityScore),
        sentiment: Math.round(sentimentScore),
        churnAdjustment: Math.round(churnAdjustment),
      },
    };
  }

  /**
   * Generate full prediction with confidence intervals
   */
  generatePrediction(lead: LeadDataPoint): PredictionResult {
    const conversion = this.predictConversion(lead);
    const churn = this.predictChurn(lead);
    const scoring = this.generateLeadScore(lead);

    // Calculate confidence interval
    const avgConfidence = (conversion.confidence + churn.confidence) / 2;
    const margin = (1 - avgConfidence) * 0.15; // 15% margin of error

    const recommendedActions: string[] = [];
    const riskFactors: string[] = [];
    const opportunityFactors: string[] = [];

    // Generate recommendations
    if (conversion.probability > 0.7) {
      recommendedActions.push("Schedule sales call immediately");
      opportunityFactors.push("High conversion likelihood");
    } else if (conversion.probability > 0.5) {
      recommendedActions.push("Send personalized proposal");
      opportunityFactors.push("Strong buying signals");
    } else if (conversion.probability > 0.3) {
      recommendedActions.push("Nurture with educational content");
      opportunityFactors.push("Building relationship");
    } else {
      recommendedActions.push("Add to drip campaign");
      opportunityFactors.push("Long-term prospect");
    }

    // Churn-based recommendations
    if (churn.risk > 0.7) {
      recommendedActions.push("Immediate re-engagement campaign");
      riskFactors.push("High churn risk - at risk of losing");
    } else if (churn.risk > 0.5) {
      recommendedActions.push("Schedule check-in call");
      riskFactors.push("Elevated churn indicators");
    }

    // Add specific factors from predictions
    riskFactors.push(...churn.factors.slice(0, 2));
    opportunityFactors.push(...conversion.factors.slice(0, 2));

    // Predict timeline to conversion
    const timelineWeeks = this.predictTimelineWeeks(
      conversion.probability,
      lead.daysActive
    );

    return {
      leadId: lead.id,
      conversionProbability: conversion.probability,
      churnRisk: churn.risk,
      leadScore: scoring.score,
      confidence: avgConfidence,
      confidenceInterval: {
        lower: Math.max(conversion.probability - margin, 0),
        upper: Math.min(conversion.probability + margin, 1),
      },
      recommendedActions,
      riskFactors,
      opportunityFactors,
      predictedTimelineWeeks: timelineWeeks,
    };
  }

  /**
   * Predict timeline to conversion in weeks
   */
  private predictTimelineWeeks(
    conversionProbability: number,
    accountAgeDays: number
  ): number {
    // Higher probability = faster conversion
    // Older accounts = faster (already in relationship)
    const probabilityFactor = 1 / (conversionProbability + 0.1);
    const accountFactor = Math.max(12 - accountAgeDays / 30, 2); // 2-12 weeks

    return Math.round(probabilityFactor * accountFactor);
  }

  /**
   * Get baseline churn rate for industry
   */
  private getIndustryChurnRate(industry: string): number {
    const rates: Record<string, number> = {
      technology: 0.2,
      finance: 0.15,
      healthcare: 0.1,
      retail: 0.25,
      saas: 0.18,
      enterprise: 0.12,
      startup: 0.3,
      default: 0.2,
    };

    return rates[industry.toLowerCase()] || rates.default;
  }

  /**
   * Batch prediction for multiple leads
   */
  batchPredict(leads: LeadDataPoint[]): PredictionResult[] {
    return leads.map((lead) => this.generatePrediction(lead));
  }

  /**
   * Calculate prediction accuracy (mock - in production would use historical data)
   */
  calculatePredictionAccuracy(
    predictions: PredictionResult[],
    actualOutcomes: Array<{ leadId: string; converted: boolean }>
  ): {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  } {
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let trueNegatives = 0;

    for (const outcome of actualOutcomes) {
      const prediction = predictions.find((p) => p.leadId === outcome.leadId);
      if (!prediction) {
continue;
}

      const predicted = prediction.conversionProbability > 0.5;
      const actual = outcome.converted;

      if (predicted && actual) {
truePositives++;
} else if (predicted && !actual) {
falsePositives++;
} else if (!predicted && actual) {
falseNegatives++;
} else {
trueNegatives++;
}
    }

    const total =
      truePositives + falsePositives + falseNegatives + trueNegatives;
    const accuracy = total > 0 ? (truePositives + trueNegatives) / total : 0;
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

    return {
      accuracy,
      precision,
      recall,
      f1Score,
    };
  }
}

// Singleton instance
let instance: PredictionEngine | null = null;

export function getPredictionEngine(): PredictionEngine {
  if (!instance) {
    instance = new PredictionEngine();
  }
  return instance;
}
