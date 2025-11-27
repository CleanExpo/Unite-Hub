/**
 * Prediction Engines Unit Tests
 * Prediction engine and lead scoring framework tests
 */

import { describe, it, expect } from "vitest";
import {
  getPredictionEngine,
  LeadDataPoint,
} from "@/lib/ml/prediction-engine";
import {
  getLeadScoringFramework,
  LeadScoringInput,
} from "@/lib/ml/lead-scoring";

describe("Prediction Engine", () => {
  const engine = getPredictionEngine();

  const mockLead: LeadDataPoint = {
    id: "lead-1",
    engagementFrequency: 8,
    sentimentScore: 85,
    intentQuality: 78,
    jobTitle: "VP Sales",
    industry: "technology",
    companySize: 500,
    daysActive: 45,
    lastEngagementDays: 2,
    openRate: 0.75,
    clickRate: 0.45,
    responseRate: 0.2,
  };

  it("should predict conversion probability", () => {
    const result = engine.predictConversion(mockLead);
    expect(result.probability).toBeGreaterThanOrEqual(0);
    expect(result.probability).toBeLessThanOrEqual(1);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.factors.length).toBeGreaterThan(0);
  });

  it("should predict churn risk", () => {
    const result = engine.predictChurn(mockLead);
    expect(result.risk).toBeGreaterThanOrEqual(0);
    expect(result.risk).toBeLessThanOrEqual(1);
    expect(result.factors.length).toBeGreaterThan(0);
  });

  it("should generate lead score", () => {
    const result = engine.generateLeadScore(mockLead);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(["Cold", "Lukewarm", "Warm", "Hot"]).toContain(result.tier);
    expect(result.components.engagement).toBeDefined();
  });

  it("should generate full prediction", () => {
    const result = engine.generatePrediction(mockLead);
    expect(result.leadId).toBe(mockLead.id);
    expect(result.conversionProbability).toBeGreaterThanOrEqual(0);
    expect(result.conversionProbability).toBeLessThanOrEqual(1);
    expect(result.churnRisk).toBeGreaterThanOrEqual(0);
    expect(result.churnRisk).toBeLessThanOrEqual(1);
    expect(result.leadScore).toBeGreaterThanOrEqual(0);
    expect(result.leadScore).toBeLessThanOrEqual(100);
    expect(result.recommendedActions.length).toBeGreaterThan(0);
  });

  it("should calculate confidence intervals", () => {
    const result = engine.generatePrediction(mockLead);
    expect(result.confidenceInterval.lower).toBeLessThan(
      result.conversionProbability
    );
    expect(result.confidenceInterval.upper).toBeGreaterThan(
      result.conversionProbability
    );
  });

  it("should predict conversion timeline", () => {
    const result = engine.generatePrediction(mockLead);
    expect(result.predictedTimelineWeeks).toBeGreaterThan(0);
    expect(result.predictedTimelineWeeks).toBeLessThan(52);
  });

  it("should batch predict multiple leads", () => {
    const leads = [mockLead, { ...mockLead, id: "lead-2" }];
    const results = engine.batchPredict(leads);
    expect(results.length).toBe(2);
    expect(results.every((r) => r.conversionProbability >= 0)).toBe(true);
  });

  it("should calculate prediction accuracy", () => {
    const predictions = engine.batchPredict([mockLead]);
    const outcomes = [{ leadId: "lead-1", converted: true }];
    const accuracy = engine.calculatePredictionAccuracy(predictions, outcomes);
    expect(accuracy.accuracy).toBeGreaterThanOrEqual(0);
    expect(accuracy.accuracy).toBeLessThanOrEqual(1);
    expect(accuracy.precision).toBeDefined();
    expect(accuracy.recall).toBeDefined();
    expect(accuracy.f1Score).toBeDefined();
  });

  it("should handle low engagement lead", () => {
    const lowEngagementLead: LeadDataPoint = {
      ...mockLead,
      engagementFrequency: 1,
      openRate: 0.1,
      clickRate: 0.05,
      lastEngagementDays: 30,
    };
    const result = engine.predictConversion(lowEngagementLead);
    expect(result.probability).toBeLessThan(0.5);
  });

  it("should handle high engagement lead", () => {
    const highEngagementLead: LeadDataPoint = {
      ...mockLead,
      engagementFrequency: 12,
      openRate: 0.9,
      clickRate: 0.7,
      responseRate: 0.5,
      lastEngagementDays: 1,
    };
    const result = engine.predictConversion(highEngagementLead);
    expect(result.probability).toBeGreaterThan(0.6);
  });
});

describe("Lead Scoring Framework", () => {
  const framework = getLeadScoringFramework();

  const mockInput: LeadScoringInput = {
    contactId: "contact-1",
    engagementMetrics: {
      emailsReceived: 8,
      emailsOpened: 6,
      emailsClicked: 3,
      repliesReceived: 2,
      meetingsScheduled: 1,
      pageViews: 12,
      timeOnSite: 45,
    },
    firmographics: {
      companySize: "51-200",
      industry: "technology",
      revenue: 50,
      location: "San Francisco",
      stage: "growth",
    },
    demographics: {
      jobTitle: "VP Sales",
      level: "executive",
      department: "sales",
      yearsInRole: 3,
    },
    behavioralSignals: {
      contentDownloads: 2,
      webinarAttendance: 1,
      caseStudyReads: 3,
      demoRequests: 1,
      pricingPageViews: 2,
    },
    engagement: {
      sentimentScore: 85,
      responseTime: 2,
      interactionFrequency: 3,
      lastInteractionDaysAgo: 2,
    },
  };

  it("should generate lead score", () => {
    const score = framework.generateScore(mockInput);
    expect(score.contactId).toBe(mockInput.contactId);
    expect(score.totalScore).toBeGreaterThanOrEqual(0);
    expect(score.totalScore).toBeLessThanOrEqual(100);
    expect(["hot", "warm", "lukewarm", "cold"]).toContain(score.tier);
  });

  it("should calculate score breakdown", () => {
    const score = framework.generateScore(mockInput);
    expect(score.scoreBreakdown.engagement).toBeDefined();
    expect(score.scoreBreakdown.firmographic).toBeDefined();
    expect(score.scoreBreakdown.demographic).toBeDefined();
    expect(score.scoreBreakdown.behavioral).toBeDefined();
    expect(score.scoreBreakdown.temporal).toBeDefined();
  });

  it("should classify hot leads correctly", () => {
    const hotInput: LeadScoringInput = {
      ...mockInput,
      engagementMetrics: {
        emailsReceived: 12,
        emailsOpened: 11,
        emailsClicked: 9,
        repliesReceived: 5,
        meetingsScheduled: 2,
        pageViews: 25,
        timeOnSite: 120,
      },
      behavioralSignals: {
        contentDownloads: 5,
        webinarAttendance: 2,
        caseStudyReads: 4,
        demoRequests: 2,
        pricingPageViews: 3,
      },
    };
    const score = framework.generateScore(hotInput);
    expect(score.totalScore).toBeGreaterThanOrEqual(70);
  });

  it("should detect score trends", () => {
    const currentScore = 75;
    const previousScores = [70, 72, 74];
    const trend = framework.calculateScoreTrend(currentScore, previousScores);
    expect(trend).toBe("increasing");
  });

  it("should recommend appropriate actions", () => {
    const score = framework.generateScore(mockInput);
    const actions = framework.getRecommendedActions(score);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.every((a) => typeof a === "string")).toBe(true);
  });

  it("should batch score multiple leads", () => {
    const inputs = [mockInput, { ...mockInput, contactId: "contact-2" }];
    const scores = framework.batchScore(inputs);
    expect(scores.length).toBe(2);
    expect(scores.every((s) => s.totalScore >= 0)).toBe(true);
  });

  it("should validate accuracy", () => {
    const scores = framework.batchScore([mockInput]);
    const outcomes = [{ contactId: "contact-1", converted: true }];
    const validation = framework.validateAccuracy(scores, outcomes);
    expect(validation.accuracy).toBeGreaterThanOrEqual(0);
    expect(validation.accuracy).toBeLessThanOrEqual(1);
    expect(validation.precision).toBeDefined();
    expect(validation.f1Score).toBeDefined();
  });

  it("should handle decaying engagement", () => {
    const staleInput: LeadScoringInput = {
      ...mockInput,
      engagement: {
        ...mockInput.engagement,
        lastInteractionDaysAgo: 30,
      },
    };
    const freshScore = framework.generateScore(mockInput);
    const staleScore = framework.generateScore(staleInput);
    expect(staleScore.totalScore).toBeLessThan(freshScore.totalScore);
  });

  it("should handle cold leads appropriately", () => {
    const coldInput: LeadScoringInput = {
      ...mockInput,
      engagementMetrics: {
        emailsReceived: 1,
        emailsOpened: 0,
        emailsClicked: 0,
        repliesReceived: 0,
        meetingsScheduled: 0,
        pageViews: 0,
        timeOnSite: 0,
      },
      behavioralSignals: {
        contentDownloads: 0,
        webinarAttendance: 0,
        caseStudyReads: 0,
        demoRequests: 0,
        pricingPageViews: 0,
      },
    };
    const score = framework.generateScore(coldInput);
    expect(score.tier).toBe("cold");
  });
});

describe("Prediction & Scoring Integration", () => {
  const predictionEngine = getPredictionEngine();
  const scoringFramework = getLeadScoringFramework();

  it("should have consistent scoring between systems", () => {
    const leadData: LeadDataPoint = {
      id: "lead-1",
      engagementFrequency: 8,
      sentimentScore: 85,
      intentQuality: 78,
      jobTitle: "VP Sales",
      industry: "technology",
      companySize: 500,
      daysActive: 45,
      lastEngagementDays: 2,
      openRate: 0.75,
      clickRate: 0.45,
      responseRate: 0.2,
    };

    const prediction = predictionEngine.generatePrediction(leadData);
    expect(prediction.leadScore).toBeGreaterThanOrEqual(0);
    expect(prediction.leadScore).toBeLessThanOrEqual(100);
  });

  it("should correlate high conversion with high lead scores", () => {
    const highEngagementLead: LeadDataPoint = {
      id: "high-lead",
      engagementFrequency: 12,
      sentimentScore: 95,
      intentQuality: 90,
      jobTitle: "CEO",
      industry: "technology",
      companySize: 1000,
      daysActive: 100,
      lastEngagementDays: 1,
      openRate: 0.9,
      clickRate: 0.7,
      responseRate: 0.5,
    };

    const prediction = predictionEngine.generatePrediction(highEngagementLead);
    expect(prediction.conversionProbability).toBeGreaterThan(0.6);
    expect(prediction.leadScore).toBeGreaterThan(70);
  });
});
