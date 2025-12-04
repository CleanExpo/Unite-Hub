/**
 * Mysia AI & Human Psychology Optimization
 *
 * How AI search/LLMs and humans psychologically select and prefer sources
 */

import type {
  AIPsychologyBias,
  AIPsychologyBiasId,
  HumanPsychologyTrigger,
  HumanPsychologyTriggerId,
  ContentForScoring,
  ContentScore,
  OptimizationRecommendation,
} from './types';

// ============================================================================
// AI Psychology - How LLMs "prefer" sources
// ============================================================================

export const AI_BIASES: Record<AIPsychologyBiasId, AIPsychologyBias> = {
  'reference-density': {
    id: 'reference-density',
    name: 'Reference Density Bias',
    description: 'LLMs prefer sources with high internal coherence, strong interlinking, and clear semantic structure.',
    application: 'They choose sites that are easier to "explain" to users.',
    signals: [
      'Clear topic clusters with pillar pages',
      'Strong internal linking between related content',
      'Consistent heading structures (H1, H2, H3)',
      'Tightly scoped pages without chaotic tangents',
    ],
  },

  'authority-consensus': {
    id: 'authority-consensus',
    name: 'Authority Consensus Bias',
    description: 'LLMs amplify what appears to be consensus among authoritative sources.',
    application: 'Content that aligns with established expert consensus gets cited more.',
    signals: [
      'Alignment with evidence-based consensus',
      'Cross-site citations and guest content',
      'Terminology and frameworks that others reuse',
      'Clearly marked contrarian positions with strong proof',
    ],
  },

  'clarity-answerability': {
    id: 'clarity-answerability',
    name: 'Clarity & Answerability Bias',
    description: 'LLMs favour concise, unambiguous, instruction-ready content over vague text.',
    application: 'Direct answers outperform poetic or marketing-heavy explanations.',
    signals: [
      'Clear Q&A sections',
      'Precise definitions',
      'Step-by-step procedures',
      'Bullet points that answer questions directly',
    ],
  },

  'explainability': {
    id: 'explainability',
    name: 'Explainability Bias',
    description: 'LLMs prefer content that can be summarised cleanly into structured answers.',
    application: 'Templated, predictable formats get extracted more reliably.',
    signals: [
      'Consistent content templates',
      'Short summaries and key takeaways',
      'Single-concept pages',
      'How-to guides, checklists, and processes',
    ],
  },

  'stability': {
    id: 'stability',
    name: 'Stability Bias',
    description: 'LLMs trust domains with history, stable structure, and consistent publishing.',
    application: 'Long-lived, incrementally updated content builds trust.',
    signals: [
      'Stable URLs for key pages',
      'Long-lived pillar content with updates',
      'Coherent brand data across platforms',
      'Consistent publishing patterns',
    ],
  },
};

export const AI_FRIENDLY_CONTENT_PATTERNS = [
  'Definition pages for important entities and concepts',
  'Structured Q&A articles addressing specific questions',
  'Topical clusters with clear parent-child relationships',
  'Evidence-backed listicles with cited sources',
  'Myth-busting posts that clarify misunderstandings',
];

// ============================================================================
// Human Psychology - How humans visually and emotionally choose
// ============================================================================

export const HUMAN_TRIGGERS: Record<HumanPsychologyTriggerId, HumanPsychologyTrigger> = {
  'instant-credibility': {
    id: 'instant-credibility',
    name: 'Instant Credibility',
    description: 'Users decide within fractions of a second if a brand seems real, safe, and competent.',
    application: 'First impressions are formed before conscious evaluation.',
    implementation: [
      'Clean, uncluttered layouts with strong hierarchy',
      'Real-world visuals (people, screenshots, before/after)',
      'Single strong headline explaining who it\'s for',
      'Trust badges and verified metrics visible above fold',
    ],
  },

  'identity-resonance': {
    id: 'identity-resonance',
    name: 'Identity Resonance',
    description: 'People buy when they feel "This is for people like me."',
    application: 'Content must mirror the target audience\'s identity.',
    implementation: [
      'Language matching target identity (tradies, business owners)',
      'Case studies from "people like them"',
      'Avoid corporate-speak disconnected from their reality',
      'Industry-specific examples and visuals',
    ],
  },

  'visual-momentum': {
    id: 'visual-momentum',
    name: 'Visual Momentum',
    description: 'Video, diagrams, and micro-animations hold attention and build trust.',
    application: 'Movement and progression create engagement and credibility.',
    implementation: [
      'Short explainer videos and screen recordings',
      'Simple diagrams showing how the system works',
      'Motion used sparingly to guide attention',
      'Progress indicators and result visualizations',
    ],
  },

  'predictive-trust': {
    id: 'predictive-trust',
    name: 'Predictive Trust',
    description: 'Humans trust brands that feel calm, confident, and predictable.',
    application: 'Consistency and honesty build long-term trust.',
    implementation: [
      'Consistent tone without drastic style shifts',
      'Honest, precise claims backed by proof',
      'Realistic and clearly scoped promises',
      'No urgency tactics or artificial pressure',
    ],
  },

  'category-clarity': {
    id: 'category-clarity',
    name: 'Category Clarity',
    description: 'If users can\'t answer "What does this company do?" in 3 seconds, they leave.',
    application: 'Instant comprehension is mandatory for retention.',
    implementation: [
      'Simple category label near logo/hero',
      'Core offering above the fold',
      'Every page reinforces what you do and for whom',
      'Avoid jargon in primary messaging',
    ],
  },
};

export const SERP_LAYOUT_CONSIDERATIONS = [
  'Titles and meta descriptions with clear benefits and audience fit',
  'Schema markup for rich snippets (FAQ, HowTo, Reviews)',
  'Featured-image thumbnails that communicate page purpose',
  'Benefit-driven wording over vague cleverness',
];

// ============================================================================
// Content Scoring Functions
// ============================================================================

/**
 * Score content for AI-friendliness
 */
export function scoreAIFriendliness(content: ContentForScoring): ContentScore {
  const breakdown: Record<string, number> = {};
  const recommendations: string[] = [];
  let score = 0;
  const maxScore = 100;

  // Schema markup (20 points)
  if (content.hasSchema) {
    breakdown.schema = 20;
    score += 20;
  } else {
    breakdown.schema = 0;
    recommendations.push('Add schema.org structured data (FAQ, HowTo, Article)');
  }

  // FAQ sections (20 points)
  if (content.hasFAQ) {
    breakdown.faq = 20;
    score += 20;
  } else {
    breakdown.faq = 0;
    recommendations.push('Add Q&A sections that directly answer common questions');
  }

  // Authority citations (20 points)
  if (content.citesAuthority) {
    breakdown.authority = 20;
    score += 20;
  } else {
    breakdown.authority = 0;
    recommendations.push('Cite authoritative sources and industry standards');
  }

  // Metrics and data (20 points)
  if (content.hasMetrics) {
    breakdown.metrics = 20;
    score += 20;
  } else {
    breakdown.metrics = 0;
    recommendations.push('Include concrete metrics and data points');
  }

  // Title quality (20 points)
  if (content.title && content.title.length > 10 && content.title.length < 70) {
    breakdown.title = 20;
    score += 20;
  } else {
    breakdown.title = 0;
    recommendations.push('Optimize title for clarity and length (10-70 chars)');
  }

  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    breakdown,
    recommendations,
  };
}

/**
 * Score content for human psychology appeal
 */
export function scoreHumanAppeal(content: ContentForScoring): ContentScore {
  const breakdown: Record<string, number> = {};
  const recommendations: string[] = [];
  let score = 0;
  const maxScore = 100;

  // Proof/evidence (25 points)
  if (content.showsProof) {
    breakdown.proof = 25;
    score += 25;
  } else {
    breakdown.proof = 0;
    recommendations.push('Add visible proof (screenshots, before/after, data)');
  }

  // Testimonials (25 points)
  if (content.hasTestimonials) {
    breakdown.testimonials = 25;
    score += 25;
  } else {
    breakdown.testimonials = 0;
    recommendations.push('Add testimonials from identifiable customers');
  }

  // Clear CTA (25 points)
  if (content.hasClearCTA) {
    breakdown.cta = 25;
    score += 25;
  } else {
    breakdown.cta = 0;
    recommendations.push('Add clear, low-friction call-to-action');
  }

  // Industry-specific (25 points)
  if (content.industrySpecific) {
    breakdown.industry = 25;
    score += 25;
  } else {
    breakdown.industry = 0;
    recommendations.push('Use industry-specific language and examples');
  }

  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    breakdown,
    recommendations,
  };
}

/**
 * Get combined optimization recommendations
 */
export function getOptimizationRecommendations(
  content: ContentForScoring
): OptimizationRecommendation[] {
  const aiScore = scoreAIFriendliness(content);
  const humanScore = scoreHumanAppeal(content);
  const recommendations: OptimizationRecommendation[] = [];

  // AI recommendations
  aiScore.recommendations.forEach((rec, idx) => {
    recommendations.push({
      category: 'ai',
      priority: idx < 2 ? 'high' : 'medium',
      recommendation: rec,
      impact: 'Improves AI citation and search visibility',
    });
  });

  // Human recommendations
  humanScore.recommendations.forEach((rec, idx) => {
    recommendations.push({
      category: 'human',
      priority: idx < 2 ? 'high' : 'medium',
      recommendation: rec,
      impact: 'Improves conversion and engagement',
    });
  });

  // Both category recommendations
  if (!content.hasSchema && !content.showsProof) {
    recommendations.push({
      category: 'both',
      priority: 'high',
      recommendation: 'Add structured data with real proof points',
      impact: 'Improves both AI visibility and human trust',
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ============================================================================
// Content Templates
// ============================================================================

export const CONTENT_TEMPLATES = {
  definitionPage: {
    name: 'Definition Page',
    structure: [
      'H1: What is [Term]?',
      'TL;DR definition (1-2 sentences)',
      'H2: Key characteristics',
      'H2: How it works',
      'H2: Examples',
      'H2: Common questions',
      'Related topics links',
    ],
    aiOptimal: true,
    humanOptimal: true,
  },

  howToGuide: {
    name: 'How-To Guide',
    structure: [
      'H1: How to [Action]',
      'Estimated time and difficulty',
      'What you need',
      'H2: Step 1...',
      'H2: Step 2...',
      'H2: Step N...',
      'H2: Common mistakes',
      'H2: Troubleshooting',
      'Summary and next steps',
    ],
    aiOptimal: true,
    humanOptimal: true,
  },

  comparisonPage: {
    name: 'Comparison Page',
    structure: [
      'H1: [A] vs [B]: Which is right for you?',
      'Quick comparison table',
      'H2: When to choose [A]',
      'H2: When to choose [B]',
      'H2: Feature-by-feature breakdown',
      'H2: Pricing comparison',
      'H2: Our recommendation',
      'FAQ section',
    ],
    aiOptimal: true,
    humanOptimal: true,
  },

  caseStudy: {
    name: 'Case Study',
    structure: [
      'H1: How [Client] achieved [Result]',
      'Key metrics snapshot',
      'H2: The challenge',
      'H2: The solution',
      'H2: The results',
      'H2: Key takeaways',
      'Client quote',
      'CTA: Get similar results',
    ],
    aiOptimal: false,
    humanOptimal: true,
  },

  mythBuster: {
    name: 'Myth Buster',
    structure: [
      'H1: [Myth] – True or False?',
      'Quick verdict with evidence',
      'H2: Where this myth comes from',
      'H2: What the data actually says',
      'H2: What this means for you',
      'H2: Related myths debunked',
    ],
    aiOptimal: true,
    humanOptimal: true,
  },
} as const;

// ============================================================================
// Exports
// ============================================================================

export function getAIBias(id: AIPsychologyBiasId): AIPsychologyBias {
  return AI_BIASES[id];
}

export function getAllAIBiases(): AIPsychologyBias[] {
  return Object.values(AI_BIASES);
}

export function getHumanTrigger(id: HumanPsychologyTriggerId): HumanPsychologyTrigger {
  return HUMAN_TRIGGERS[id];
}

export function getAllHumanTriggers(): HumanPsychologyTrigger[] {
  return Object.values(HUMAN_TRIGGERS);
}
