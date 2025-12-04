/**
 * Mysia Strategy Modes Configuration
 *
 * Core strategy modes that clients can pick, combine, and switch.
 * Each mode has specific goals, use cases, and core actions.
 */

import type { StrategyMode, AdvancedStrategy, StrategyModeId, ClientContext, StrategyRecommendation } from './types';

// ============================================================================
// Core Strategy Modes
// ============================================================================

export const STRATEGY_MODES: Record<StrategyModeId, StrategyMode> = {
  'blue-ocean': {
    id: 'blue-ocean',
    name: 'Blue Ocean Strategy',
    description: 'Find or create uncontested market spaces where you can escape direct competition.',
    bestFor: [
      'Saturated, commoditised markets',
      'Launching new AI-driven products or services',
      'Reframing how the industry sees a problem',
    ],
    tactics: [
      'Identify crowded feature/price-level competition',
      'Find underserved audiences and ignored pain points',
      'Generate new value curves (eliminate, reduce, raise, create)',
      'Design category messaging for clear differentiation',
    ],
    metrics: ['Market share in new space', 'Competitive separation', 'Price premium achieved'],
    priority: 8,
  },

  'jtbd': {
    id: 'jtbd',
    name: 'Jobs-To-Be-Done',
    description: 'Understand the "jobs" customers hire your product/service to do and build messaging around those jobs.',
    bestFor: [
      'Feature-heavy, unclear messaging',
      'Confusion about what problem the product solves',
      'Multiple segments with different needs',
    ],
    tactics: [
      'Mine conversations for job language (I need to…, I\'m trying to…)',
      'Cluster jobs into functional, emotional, and social categories',
      'Rewrite positioning around jobs and desired outcomes',
      'Map content and funnel stages to key jobs per segment',
    ],
    metrics: ['Conversion rate by segment', 'Message resonance scores', 'Customer journey completion'],
    priority: 7,
  },

  'category-design': {
    id: 'category-design',
    name: 'Category Design',
    description: 'Define and own a new or emerging category you can lead instead of just being another option.',
    bestFor: [
      'Genuinely differentiated tech or process',
      'Market unsure how to classify the product',
      'Opportunity to name a new category or framework',
    ],
    tactics: [
      'Find problems with no clear category label',
      'Define the category, its enemy, and its promised land',
      'Create a category narrative (Problem → Shift → New Category → Product)',
      'Launch lightning strike campaigns to embed the category',
    ],
    metrics: ['Category term search volume', 'Share of voice in category', 'Category association rate'],
    priority: 9,
  },

  'challenger-brand': {
    id: 'challenger-brand',
    name: 'Challenger Brand',
    description: 'Position as the bold, honest, disruptive alternative to incumbents.',
    bestFor: [
      'Smaller than main competitors',
      'Incumbents deliver poor or outdated solutions',
      'Obvious frustration in the market with status quo',
    ],
    tactics: [
      'Identify incumbent narratives and weak promises',
      'Challenge those narratives respectfully but firmly with data',
      'Craft Old Way vs New Way messaging',
      'Emphasize agility, honesty, and aligned incentives',
    ],
    metrics: ['Brand sentiment vs incumbents', 'Win rate in competitive deals', 'Organic mentions'],
    priority: 7,
  },

  'content-moat': {
    id: 'content-moat',
    name: 'Content Moat / Authority Flywheel',
    description: 'Own key informational territory with deep, defensible topical authority.',
    bestFor: [
      'Long-term SEO and AI search presence goals',
      'Well-defined topics where you can lead',
      'Competitors with shallow or outdated content',
    ],
    tactics: [
      'Map topic clusters, difficulty, and intent',
      'Identify recurring and painful questions from conversations',
      'Design pillar pages and cluster content to truly solve questions',
      'Continuously update, expand, and interlink based on performance',
    ],
    metrics: ['Topic authority score', 'Organic traffic growth', 'AI citation frequency'],
    priority: 8,
  },

  'narrative-clarity': {
    id: 'narrative-clarity',
    name: 'Narrative Clarity (StoryBrand)',
    description: 'Make the customer the hero, the brand the guide, and the journey crystal clear.',
    bestFor: [
      'Confusing or too technical sites',
      'Low conversions despite traffic',
      'Non-technical or time-poor audiences',
    ],
    tactics: [
      'Clarify the main villain (problem) and desired outcome',
      'Define the brand as guide, not hero',
      'Rewrite pages with obvious journey (Problem → Plan → Promise → Proof → Action)',
      'Ensure CTAs are direct and low-friction',
    ],
    metrics: ['Bounce rate reduction', 'Conversion rate', 'Time to first CTA click'],
    priority: 9,
  },

  'growth-loops': {
    id: 'growth-loops',
    name: 'Growth Loops',
    description: 'Turn results into inputs so growth compounds over time.',
    bestFor: [
      'Some traction but inconsistent growth',
      'User actions can generate more awareness, content, or referrals',
      'Underused touchpoints (reviews, UGC, referrals)',
    ],
    tactics: [
      'Identify existing or potential loops (referral, review, UGC, education)',
      'Design incentives and flows that make feeding the loop easy',
      'Measure loop efficiency and fix drop-offs',
      'Prioritize loops that strengthen E.E.A.T.',
    ],
    metrics: ['Referral rate', 'Review velocity', 'Loop efficiency ratio'],
    priority: 7,
  },

  'demand-generation': {
    id: 'demand-generation',
    name: 'Demand Generation',
    description: 'Create demand by changing beliefs and educating the market before they search.',
    bestFor: [
      'Low but growing search volume',
      'Market doesn\'t yet understand the problem or solution',
      'Want to lead education in the niche',
    ],
    tactics: [
      'Identify limiting beliefs that block adoption',
      'Create top-of-funnel content to shift those beliefs',
      'Distribute via social, email, and partnerships',
      'Track conversation shifts and search trends',
    ],
    metrics: ['Branded search growth', 'Belief shift surveys', 'Top-of-funnel engagement'],
    priority: 6,
  },

  'own-conversation': {
    id: 'own-conversation',
    name: 'Own the Conversation',
    description: 'Become the default voice people and AIs reference when the topic appears.',
    bestFor: [
      'Strong expertise but low visibility',
      'Active communities around the topic',
      'Want to be cited and quoted',
    ],
    tactics: [
      'Identify recurring high-value threads (Reddit, LinkedIn, X, YouTube)',
      'Generate deep, helpful replies that add clarity and evidence',
      'Create knowledge capsules and myth-busters for sharing',
      'Monitor brand appearance in conversations and AI answers',
    ],
    metrics: ['Share of voice', 'Citation frequency', 'AI answer inclusion rate'],
    priority: 8,
  },

  'minimum-viable': {
    id: 'minimum-viable',
    name: 'Minimum Viable Marketing',
    description: 'Discover what works fast using small, controlled experiments.',
    bestFor: [
      'Limited budget/time/team',
      'Uncertainty around audience or channel',
      'Want to avoid overbuilding before validating',
    ],
    tactics: [
      'Design micro-tests (one hook + one offer + one channel)',
      'Define simple success metrics per test',
      'Kill losing experiments quickly, double down on winners',
      'Document lessons to refine future strategy selection',
    ],
    metrics: ['Test velocity', 'Win rate', 'Cost per learning'],
    priority: 10,
  },

  'ethical-psychology': {
    id: 'ethical-psychology',
    name: 'Ethical Psychology',
    description: 'Increase resonance and action using behavioural science ethically.',
    bestFor: [
      'Higher conversions and engagement goals',
      'Emotionally influenced decisions',
      'Enough proof to avoid overpromising',
    ],
    tactics: [
      'Apply social proof, authority, reciprocity only when grounded in reality',
      'Replace vague claims with proof (data, testimonials, outcomes)',
      'Simplify language and remove friction',
      'Review all messaging for potential manipulation',
    ],
    metrics: ['Conversion rate', 'Trust score', 'Long-term retention'],
    priority: 6,
  },
};

// ============================================================================
// Advanced Strategies (Expert Modes)
// ============================================================================

export const ADVANCED_STRATEGIES: Record<string, AdvancedStrategy> = {
  'temporal-demand': {
    id: 'temporal-demand',
    name: 'Temporal Demand Strategy',
    description: 'Position the brand in front of demand 30–180 days before it fully forms.',
    application: 'Use trend curves and query evolution to forecast emerging searches. Create content for rising topics early.',
    requirements: [
      'Access to Semrush/DataForSEO trend data',
      'Conversation velocity monitoring',
      'Content production capacity',
    ],
  },

  'conversation-gravity': {
    id: 'conversation-gravity',
    name: 'Conversation Gravity Wells',
    description: 'Identify topics that naturally attract attention and place the brand at their centre.',
    application: 'Score topics by frequency, emotional intensity, and multi-platform presence. Build go-to reference assets.',
    requirements: [
      'Multi-platform conversation monitoring',
      'Topic scoring framework',
      'Deep content creation capability',
    ],
  },

  'reality-anchoring': {
    id: 'reality-anchoring',
    name: 'Reality Anchoring',
    description: 'Use rigorous truth and visible proof as the brand\'s primary differentiator.',
    application: 'Prioritise case studies, concrete numbers, and field stories. Make truth-over-hype content recurring.',
    requirements: [
      'Access to real client data and outcomes',
      'Case study production process',
      'Fact-checking workflow',
    ],
  },

  'emergent-authority': {
    id: 'emergent-authority',
    name: 'Emergent Authority',
    description: 'Track and amplify patterns that cause authority to emerge organically.',
    application: 'Monitor cross-platform mentions and citations. Scale behaviours that lead to unprompted references.',
    requirements: [
      'Mention and citation tracking',
      'Sentiment analysis',
      'Content performance correlation',
    ],
  },

  'ai-search-domination': {
    id: 'ai-search-domination',
    name: 'AI Search Domination',
    description: 'Optimise specifically for AI answers and overviews, not just traditional search.',
    application: 'Track brand appearance in AI outputs. Favour structures LLMs find easy to quote.',
    requirements: [
      'AI answer monitoring capability',
      'Structured content templates',
      'Factual density optimisation',
    ],
  },
};

// ============================================================================
// Strategy Selection Logic
// ============================================================================

/**
 * Score a strategy for a given client context
 */
function scoreStrategy(strategy: StrategyMode, context: ClientContext): number {
  let score = strategy.priority * 10;

  // Budget alignment
  if (context.budget === 'low' && strategy.id === 'minimum-viable') {
score += 30;
}
  if (context.budget === 'high' && ['category-design', 'content-moat'].includes(strategy.id)) {
score += 20;
}

  // Market position
  if (context.marketPosition === 'new' && ['narrative-clarity', 'minimum-viable'].includes(strategy.id)) {
score += 25;
}
  if (context.marketPosition === 'established' && ['content-moat', 'growth-loops'].includes(strategy.id)) {
score += 20;
}

  // Competitor strength
  if (context.competitorStrength === 'strong' && ['challenger-brand', 'blue-ocean'].includes(strategy.id)) {
score += 25;
}

  // Goal alignment
  if (context.goals.some(g => g.toLowerCase().includes('authority')) && strategy.id === 'content-moat') {
score += 20;
}
  if (context.goals.some(g => g.toLowerCase().includes('conversion')) && strategy.id === 'narrative-clarity') {
score += 20;
}
  if (context.goals.some(g => g.toLowerCase().includes('growth')) && strategy.id === 'growth-loops') {
score += 20;
}

  // Industry-specific
  const serviceIndustries = ['trades', 'services', 'health', 'hospitality'];
  if (serviceIndustries.some(ind => context.industry.toLowerCase().includes(ind))) {
    if (['narrative-clarity', 'own-conversation'].includes(strategy.id)) {
score += 15;
}
  }

  return score;
}

/**
 * Get recommended strategies based on client context
 */
export function getRecommendedStrategies(context: ClientContext): StrategyRecommendation[] {
  const strategies = Object.values(STRATEGY_MODES);
  const scored = strategies.map(strategy => ({
    strategy,
    score: scoreStrategy(strategy, context),
    reasoning: generateReasoning(strategy, context),
    priorityTactics: strategy.tactics.slice(0, 3),
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, 3);
}

/**
 * Generate reasoning for why a strategy was recommended
 */
function generateReasoning(strategy: StrategyMode, context: ClientContext): string {
  const reasons: string[] = [];

  if (context.budget === 'low' && strategy.id === 'minimum-viable') {
    reasons.push('Budget constraints favour rapid experimentation');
  }
  if (context.marketPosition === 'new') {
    reasons.push('New market entrant benefits from clear positioning');
  }
  if (context.competitorStrength === 'strong' && strategy.id === 'challenger-brand') {
    reasons.push('Strong competitors create opportunity for challenger positioning');
  }
  if (strategy.priority >= 8) {
    reasons.push(`High-priority strategy (${strategy.priority}/10) for most contexts`);
  }

  return reasons.length > 0 ? reasons.join('. ') + '.' : `${strategy.name} aligns with your goals.`;
}

/**
 * Get strategy mode by ID
 */
export function getStrategyMode(id: StrategyModeId): StrategyMode | undefined {
  return STRATEGY_MODES[id];
}

/**
 * Get all strategy modes as array
 */
export function getAllStrategyModes(): StrategyMode[] {
  return Object.values(STRATEGY_MODES);
}

/**
 * Get advanced strategy by ID
 */
export function getAdvancedStrategy(id: string): AdvancedStrategy | undefined {
  return ADVANCED_STRATEGIES[id];
}

/**
 * Get all advanced strategies
 */
export function getAllAdvancedStrategies(): AdvancedStrategy[] {
  return Object.values(ADVANCED_STRATEGIES);
}
