/**
 * CONVEX Scoring API
 *
 * Scoring functions for CONVEX strategies and SEO analysis.
 * Provides quantitative assessment of marketing effectiveness.
 */

// Types
export interface SEOScore {
  category: string;
  score: number;
  maxScore: number;
  trend: "up" | "down" | "stable";
  details: SEOScoreDetail[];
}

export interface SEOScoreDetail {
  factor: string;
  score: number;
  maxScore: number;
  status: "good" | "warning" | "critical";
  recommendation?: string;
}

export interface StrategyScore {
  overall: number;
  dimensions: {
    name: string;
    score: number;
    weight: number;
  }[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface ContentScore {
  overall: number;
  readability: number;
  seoOptimization: number;
  emotionalResonance: number;
  conversionPotential: number;
  recommendations: string[];
}

// Scoring weights for different categories
const SEO_WEIGHTS = {
  technical: 0.25,
  content: 0.30,
  authority: 0.25,
  userExperience: 0.20
};

const STRATEGY_WEIGHTS = {
  marketAlignment: 0.25,
  competitiveAdvantage: 0.20,
  executionClarity: 0.20,
  conversionPotential: 0.20,
  brandConsistency: 0.15
};

/**
 * Calculate overall SEO score from individual category scores
 */
export function calculateOverallSEOScore(scores: SEOScore[]): number {
  if (scores.length === 0) {
return 0;
}

  let weightedSum = 0;
  let totalWeight = 0;

  for (const score of scores) {
    const categoryWeight = getCategoryWeight(score.category);
    weightedSum += (score.score / score.maxScore) * 100 * categoryWeight;
    totalWeight += categoryWeight;
  }

  return Math.round(weightedSum / totalWeight);
}

/**
 * Get weight for SEO category
 */
function getCategoryWeight(category: string): number {
  const weights: Record<string, number> = {
    "Technical SEO": SEO_WEIGHTS.technical,
    "Content Quality": SEO_WEIGHTS.content,
    "Authority": SEO_WEIGHTS.authority,
    "User Experience": SEO_WEIGHTS.userExperience
  };
  return weights[category] || 0.25;
}

/**
 * Analyze technical SEO factors
 */
export function analyzeTechnicalSEO(data: {
  pageSpeed?: number;
  mobileFriendly?: boolean;
  crawlability?: number;
  schemaMarkup?: boolean;
  sslEnabled?: boolean;
  coreWebVitals?: { lcp: number; fid: number; cls: number };
}): SEOScore {
  const details: SEOScoreDetail[] = [];
  let totalScore = 0;
  const maxScore = 100;

  // Page Speed (25 points)
  if (data.pageSpeed !== undefined) {
    const speedScore = Math.min(25, Math.round((data.pageSpeed / 100) * 25));
    details.push({
      factor: "Page Speed",
      score: speedScore,
      maxScore: 25,
      status: speedScore >= 20 ? "good" : speedScore >= 15 ? "warning" : "critical",
      recommendation: speedScore < 20 ? "Optimize images and enable compression" : undefined
    });
    totalScore += speedScore;
  }

  // Mobile Friendly (20 points)
  if (data.mobileFriendly !== undefined) {
    const mobileScore = data.mobileFriendly ? 20 : 0;
    details.push({
      factor: "Mobile Friendly",
      score: mobileScore,
      maxScore: 20,
      status: mobileScore === 20 ? "good" : "critical",
      recommendation: mobileScore === 0 ? "Implement responsive design" : undefined
    });
    totalScore += mobileScore;
  }

  // Crawlability (20 points)
  if (data.crawlability !== undefined) {
    const crawlScore = Math.min(20, Math.round((data.crawlability / 100) * 20));
    details.push({
      factor: "Crawlability",
      score: crawlScore,
      maxScore: 20,
      status: crawlScore >= 16 ? "good" : crawlScore >= 12 ? "warning" : "critical",
      recommendation: crawlScore < 16 ? "Fix crawl errors and improve sitemap" : undefined
    });
    totalScore += crawlScore;
  }

  // Schema Markup (15 points)
  if (data.schemaMarkup !== undefined) {
    const schemaScore = data.schemaMarkup ? 15 : 0;
    details.push({
      factor: "Schema Markup",
      score: schemaScore,
      maxScore: 15,
      status: schemaScore === 15 ? "good" : "warning",
      recommendation: schemaScore === 0 ? "Implement structured data for rich snippets" : undefined
    });
    totalScore += schemaScore;
  }

  // SSL/HTTPS (10 points)
  if (data.sslEnabled !== undefined) {
    const sslScore = data.sslEnabled ? 10 : 0;
    details.push({
      factor: "HTTPS Security",
      score: sslScore,
      maxScore: 10,
      status: sslScore === 10 ? "good" : "critical",
      recommendation: sslScore === 0 ? "Enable SSL certificate" : undefined
    });
    totalScore += sslScore;
  }

  // Core Web Vitals (10 points)
  if (data.coreWebVitals) {
    const { lcp, fid, cls } = data.coreWebVitals;
    const lcpGood = lcp <= 2.5;
    const fidGood = fid <= 100;
    const clsGood = cls <= 0.1;
    const vitalsScore = (lcpGood ? 4 : 0) + (fidGood ? 3 : 0) + (clsGood ? 3 : 0);
    details.push({
      factor: "Core Web Vitals",
      score: vitalsScore,
      maxScore: 10,
      status: vitalsScore >= 8 ? "good" : vitalsScore >= 5 ? "warning" : "critical",
      recommendation: vitalsScore < 8 ? "Optimize LCP, FID, and CLS metrics" : undefined
    });
    totalScore += vitalsScore;
  }

  return {
    category: "Technical SEO",
    score: totalScore,
    maxScore,
    trend: "stable",
    details
  };
}

/**
 * Analyze content quality factors
 */
export function analyzeContentQuality(data: {
  wordCount?: number;
  keywordDensity?: number;
  uniqueness?: number;
  readabilityScore?: number;
  headingStructure?: boolean;
  imageOptimization?: boolean;
  lastUpdated?: Date;
}): SEOScore {
  const details: SEOScoreDetail[] = [];
  let totalScore = 0;
  const maxScore = 100;

  // Word Count / Content Depth (25 points)
  if (data.wordCount !== undefined) {
    const depthScore = data.wordCount >= 2500 ? 25 :
                       data.wordCount >= 1500 ? 20 :
                       data.wordCount >= 800 ? 15 : 10;
    details.push({
      factor: "Content Depth",
      score: depthScore,
      maxScore: 25,
      status: depthScore >= 20 ? "good" : "warning",
      recommendation: depthScore < 20 ? `Expand content to 2500+ words (current: ${data.wordCount})` : undefined
    });
    totalScore += depthScore;
  }

  // Keyword Relevance (20 points)
  if (data.keywordDensity !== undefined) {
    const optimalDensity = data.keywordDensity >= 1 && data.keywordDensity <= 3;
    const keywordScore = optimalDensity ? 20 : data.keywordDensity < 1 ? 10 : 5;
    details.push({
      factor: "Keyword Relevance",
      score: keywordScore,
      maxScore: 20,
      status: keywordScore >= 15 ? "good" : "warning",
      recommendation: keywordScore < 15 ? "Optimize keyword density to 1-3%" : undefined
    });
    totalScore += keywordScore;
  }

  // Uniqueness (20 points)
  if (data.uniqueness !== undefined) {
    const uniqueScore = Math.min(20, Math.round((data.uniqueness / 100) * 20));
    details.push({
      factor: "Uniqueness",
      score: uniqueScore,
      maxScore: 20,
      status: uniqueScore >= 16 ? "good" : uniqueScore >= 12 ? "warning" : "critical",
      recommendation: uniqueScore < 16 ? "Reduce duplicate content" : undefined
    });
    totalScore += uniqueScore;
  }

  // Readability (15 points)
  if (data.readabilityScore !== undefined) {
    const readScore = Math.min(15, Math.round((data.readabilityScore / 100) * 15));
    details.push({
      factor: "Readability",
      score: readScore,
      maxScore: 15,
      status: readScore >= 12 ? "good" : "warning",
      recommendation: readScore < 12 ? "Simplify sentence structure" : undefined
    });
    totalScore += readScore;
  }

  // Content Freshness (20 points)
  if (data.lastUpdated) {
    const daysSinceUpdate = Math.floor((Date.now() - data.lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
    const freshnessScore = daysSinceUpdate <= 30 ? 20 :
                           daysSinceUpdate <= 90 ? 15 :
                           daysSinceUpdate <= 180 ? 10 : 5;
    details.push({
      factor: "Freshness",
      score: freshnessScore,
      maxScore: 20,
      status: freshnessScore >= 15 ? "good" : "warning",
      recommendation: freshnessScore < 15 ? "Update content within last 90 days" : undefined
    });
    totalScore += freshnessScore;
  }

  return {
    category: "Content Quality",
    score: totalScore,
    maxScore,
    trend: "stable",
    details
  };
}

/**
 * Analyze authority factors
 */
export function analyzeAuthority(data: {
  domainAuthority?: number;
  backlinks?: number;
  referringDomains?: number;
  trustFlow?: number;
  citationFlow?: number;
}): SEOScore {
  const details: SEOScoreDetail[] = [];
  let totalScore = 0;
  const maxScore = 100;

  // Domain Authority (35 points)
  if (data.domainAuthority !== undefined) {
    const daScore = Math.min(35, Math.round((data.domainAuthority / 100) * 35));
    details.push({
      factor: "Domain Authority",
      score: daScore,
      maxScore: 35,
      status: daScore >= 28 ? "good" : daScore >= 20 ? "warning" : "critical",
      recommendation: daScore < 28 ? "Build high-quality backlinks to increase DA" : undefined
    });
    totalScore += daScore;
  }

  // Backlink Quality (25 points)
  if (data.backlinks !== undefined && data.referringDomains !== undefined) {
    const ratio = data.referringDomains / Math.max(1, data.backlinks);
    const qualityScore = ratio >= 0.3 ? 25 : ratio >= 0.1 ? 18 : 10;
    details.push({
      factor: "Backlink Quality",
      score: qualityScore,
      maxScore: 25,
      status: qualityScore >= 20 ? "good" : "warning",
      recommendation: qualityScore < 20 ? "Diversify backlink sources" : undefined
    });
    totalScore += qualityScore;
  }

  // Trust Flow (20 points)
  if (data.trustFlow !== undefined) {
    const trustScore = Math.min(20, Math.round((data.trustFlow / 100) * 20));
    details.push({
      factor: "Trust Flow",
      score: trustScore,
      maxScore: 20,
      status: trustScore >= 15 ? "good" : "warning",
      recommendation: trustScore < 15 ? "Earn links from trusted domains" : undefined
    });
    totalScore += trustScore;
  }

  // Topical Authority (20 points) - based on citation flow relative to trust
  if (data.citationFlow !== undefined && data.trustFlow !== undefined) {
    const ratio = data.trustFlow / Math.max(1, data.citationFlow);
    const topicalScore = ratio >= 0.8 ? 20 : ratio >= 0.5 ? 15 : 10;
    details.push({
      factor: "Topical Coverage",
      score: topicalScore,
      maxScore: 20,
      status: topicalScore >= 15 ? "good" : "warning",
      recommendation: topicalScore < 15 ? "Create supporting cluster content" : undefined
    });
    totalScore += topicalScore;
  }

  return {
    category: "Authority",
    score: totalScore,
    maxScore,
    trend: "stable",
    details
  };
}

/**
 * Analyze user experience factors
 */
export function analyzeUserExperience(data: {
  bounceRate?: number;
  timeOnPage?: number;
  pagesPerSession?: number;
  mobileUsability?: number;
}): SEOScore {
  const details: SEOScoreDetail[] = [];
  let totalScore = 0;
  const maxScore = 100;

  // Bounce Rate (30 points)
  if (data.bounceRate !== undefined) {
    const bounceScore = data.bounceRate <= 40 ? 30 :
                        data.bounceRate <= 55 ? 22 :
                        data.bounceRate <= 70 ? 15 : 8;
    details.push({
      factor: "Bounce Rate",
      score: bounceScore,
      maxScore: 30,
      status: bounceScore >= 22 ? "good" : "warning",
      recommendation: bounceScore < 22 ? "Improve above-fold engagement" : undefined
    });
    totalScore += bounceScore;
  }

  // Time on Page (30 points)
  if (data.timeOnPage !== undefined) {
    const timeScore = data.timeOnPage >= 180 ? 30 :
                      data.timeOnPage >= 120 ? 24 :
                      data.timeOnPage >= 60 ? 18 : 10;
    details.push({
      factor: "Time on Page",
      score: timeScore,
      maxScore: 30,
      status: timeScore >= 24 ? "good" : "warning",
      recommendation: timeScore < 24 ? "Add engaging content and media" : undefined
    });
    totalScore += timeScore;
  }

  // Pages per Session (20 points)
  if (data.pagesPerSession !== undefined) {
    const pagesScore = data.pagesPerSession >= 3 ? 20 :
                       data.pagesPerSession >= 2 ? 15 : 10;
    details.push({
      factor: "Pages per Session",
      score: pagesScore,
      maxScore: 20,
      status: pagesScore >= 15 ? "good" : "warning",
      recommendation: pagesScore < 15 ? "Improve internal linking" : undefined
    });
    totalScore += pagesScore;
  }

  // Mobile Usability (20 points)
  if (data.mobileUsability !== undefined) {
    const mobileScore = Math.min(20, Math.round((data.mobileUsability / 100) * 20));
    details.push({
      factor: "Mobile Usability",
      score: mobileScore,
      maxScore: 20,
      status: mobileScore >= 16 ? "good" : "warning",
      recommendation: mobileScore < 16 ? "Optimize touch targets and font sizes" : undefined
    });
    totalScore += mobileScore;
  }

  return {
    category: "User Experience",
    score: totalScore,
    maxScore,
    trend: "stable",
    details
  };
}

/**
 * Score a CONVEX marketing strategy
 */
export function scoreStrategy(data: {
  marketAlignment: number;
  competitiveAdvantage: number;
  executionClarity: number;
  conversionPotential: number;
  brandConsistency: number;
}): StrategyScore {
  const dimensions = [
    { name: "Market Alignment", score: data.marketAlignment, weight: STRATEGY_WEIGHTS.marketAlignment },
    { name: "Competitive Advantage", score: data.competitiveAdvantage, weight: STRATEGY_WEIGHTS.competitiveAdvantage },
    { name: "Execution Clarity", score: data.executionClarity, weight: STRATEGY_WEIGHTS.executionClarity },
    { name: "Conversion Potential", score: data.conversionPotential, weight: STRATEGY_WEIGHTS.conversionPotential },
    { name: "Brand Consistency", score: data.brandConsistency, weight: STRATEGY_WEIGHTS.brandConsistency }
  ];

  const overall = Math.round(
    dimensions.reduce((sum, d) => sum + (d.score * d.weight), 0)
  );

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  for (const dim of dimensions) {
    if (dim.score >= 80) {
      strengths.push(`Strong ${dim.name.toLowerCase()}`);
    } else if (dim.score < 60) {
      weaknesses.push(`Weak ${dim.name.toLowerCase()}`);
      recommendations.push(`Improve ${dim.name.toLowerCase()} score`);
    }
  }

  return {
    overall,
    dimensions,
    strengths,
    weaknesses,
    recommendations
  };
}

/**
 * Score marketing content using CONVEX methodology
 */
export function scoreContent(data: {
  text: string;
  targetKeywords?: string[];
  emotionalTriggers?: string[];
  callToAction?: boolean;
}): ContentScore {
  const recommendations: string[] = [];

  // Readability score (simplified Flesch-Kincaid)
  const sentences = data.text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = data.text.split(/\s+/).filter(w => w.length > 0);
  const avgWordsPerSentence = words.length / Math.max(1, sentences.length);
  const readability = Math.min(100, Math.max(0, 100 - (avgWordsPerSentence - 15) * 5));

  // SEO Optimization
  let seoOptimization = 50;
  if (data.targetKeywords && data.targetKeywords.length > 0) {
    const textLower = data.text.toLowerCase();
    const foundKeywords = data.targetKeywords.filter(kw =>
      textLower.includes(kw.toLowerCase())
    );
    seoOptimization = Math.round((foundKeywords.length / data.targetKeywords.length) * 100);
  }
  if (seoOptimization < 70) {
    recommendations.push("Include more target keywords naturally");
  }

  // Emotional Resonance
  let emotionalResonance = 50;
  if (data.emotionalTriggers && data.emotionalTriggers.length > 0) {
    const textLower = data.text.toLowerCase();
    const foundTriggers = data.emotionalTriggers.filter(trigger =>
      textLower.includes(trigger.toLowerCase())
    );
    emotionalResonance = Math.round((foundTriggers.length / data.emotionalTriggers.length) * 100);
  }
  if (emotionalResonance < 60) {
    recommendations.push("Add emotional triggers to increase engagement");
  }

  // Conversion Potential
  let conversionPotential = 40;
  if (data.callToAction) {
    conversionPotential += 30;
  } else {
    recommendations.push("Add a clear call-to-action");
  }
  if (data.text.includes("free") || data.text.includes("limited") || data.text.includes("exclusive")) {
    conversionPotential += 15;
  }
  if (data.text.includes("guarantee") || data.text.includes("risk-free")) {
    conversionPotential += 15;
  }
  conversionPotential = Math.min(100, conversionPotential);

  // Overall score (weighted average)
  const overall = Math.round(
    readability * 0.2 +
    seoOptimization * 0.3 +
    emotionalResonance * 0.25 +
    conversionPotential * 0.25
  );

  return {
    overall,
    readability: Math.round(readability),
    seoOptimization,
    emotionalResonance,
    conversionPotential,
    recommendations
  };
}

/**
 * Generate quick wins from SEO scores
 */
export function generateQuickWins(scores: SEOScore[], limit: number = 5): SEOScoreDetail[] {
  const allDetails: SEOScoreDetail[] = [];

  for (const score of scores) {
    for (const detail of score.details) {
      if (detail.recommendation) {
        allDetails.push(detail);
      }
    }
  }

  // Sort by potential impact (lowest score = highest potential)
  allDetails.sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore));

  return allDetails.slice(0, limit);
}
