// src/lib/testing/improved-prompts.ts
// Improved prompts based on overnight test quality analysis
// Fixes: perspective issues, generic language, local context

export interface SMBPersona {
  id: string;
  business_name: string;
  industry: string;
  location: string;
  employees: number;
  pain_points: string[];
  goals: string[];
  current_marketing: string[];
  budget_range: string;
  decision_maker: {
    role: string;
    tech_savvy: 'low' | 'medium' | 'high';
  };
}

// ============================================
// BANNED WORDS - Avoid generic marketing speak
// ============================================

export const BANNED_WORDS = [
  'leverage',
  'tailored',
  'solutions',
  'seamless',
  'cutting-edge',
  'innovative',
  'synergy',
  'holistic',
  'robust',
  'proven track record',
  'best-in-class',
  'world-class',
  'game-changing',
  'paradigm shift',
];

// ============================================
// IMPROVED PROMPTS - V2
// ============================================

export function getImprovedPrompt(testType: string, persona: SMBPersona): string {
  const location = persona.location.split(',')[0]; // Get city name

  switch (testType) {
    // ----------------------------------------
    // CONTENT GENERATION - Fixed perspective
    // ----------------------------------------
    case 'content_generation':
      return `You are writing marketing copy FOR ${persona.business_name} to use on their website/ads to attract THEIR customers.

Create a headline and value proposition that ${persona.business_name} can put on their homepage to attract customers in ${location}.

Business context:
- Industry: ${persona.industry}
- Location: ${location}, Australia
- What their customers struggle with: ${persona.pain_points[0]}

Requirements:
- Write FROM the business's perspective (use "we" as the business, not as Synthex)
- Target the END CUSTOMER who needs ${persona.industry} services
- Include the location (${location})
- DO NOT use these words: leverage, tailored, solutions, seamless, innovative, proven
- Keep it punchy and specific

Output format:
**Headline:** [10 words max]
**Value Prop:** [One sentence, max 20 words]`;

    // ----------------------------------------
    // BRAND ANALYSIS - More specific
    // ----------------------------------------
    case 'brand_analysis':
      return `Analyze ${persona.business_name}, a ${persona.industry} business in ${location}, Australia.

Context:
- Team size: ${persona.employees} people
- Main challenges: ${persona.pain_points.join(', ')}
- Goals: ${persona.goals.join(', ')}

Provide a 3-sentence brand positioning analysis:
1. Current market position (be specific to ${location})
2. Key differentiator opportunity
3. One concrete action to strengthen brand

DO NOT use generic phrases like "tailored solutions" or "leverage their expertise". Be specific.`;

    // ----------------------------------------
    // SEO AUDIT - Actionable local SEO
    // ----------------------------------------
    case 'seo_audit':
      return `Provide 3 specific SEO actions for ${persona.business_name} in ${location}.

Current marketing: ${persona.current_marketing.join(', ')}
Industry: ${persona.industry}

For each recommendation:
- State the exact action (what to do THIS WEEK)
- Include a specific ${location}-focused keyword example
- Estimate effort (1-5 hours)

Focus on local SEO that works for Australian small businesses. No generic advice.`;

    // ----------------------------------------
    // COMPETITOR ANALYSIS - Specific differentiators
    // ----------------------------------------
    case 'competitor_analysis':
      return `${persona.business_name} is a small ${persona.industry} business in ${location} competing against bigger players.

Budget: ${persona.budget_range}
Team: ${persona.employees} people

Identify 2 specific competitive advantages they can exploit:

1. [ADVANTAGE NAME]
   - Why big competitors can't match this
   - Specific implementation (with budget estimate)
   - Example messaging to use

2. [ADVANTAGE NAME]
   - Why big competitors can't match this
   - Specific implementation (with budget estimate)
   - Example messaging to use

Be concrete. Avoid words like: leverage, solutions, innovative.`;

    // ----------------------------------------
    // CAMPAIGN STRATEGY - Lean and actionable
    // ----------------------------------------
    case 'campaign_strategy':
      return `Create a simple 3-step marketing campaign for ${persona.business_name}.

Goal: ${persona.goals[0]}
Budget: ${persona.budget_range}
Location: ${location}, Australia
Owner tech level: ${persona.decision_maker.tech_savvy}

For each step, provide:
- What to do (one sentence)
- Cost estimate
- Expected result

Keep it SIMPLE. This owner is ${persona.decision_maker.tech_savvy} tech-savvy.
Total campaign should fit within ${persona.budget_range}.
Focus on what works in ${location}.`;

    // ----------------------------------------
    // CLIENT RETENTION - New test type
    // ----------------------------------------
    case 'client_retention':
      return `${persona.business_name} in ${location} wants to keep more customers coming back.

Industry: ${persona.industry}
Current marketing: ${persona.current_marketing.join(', ')}
Budget: ${persona.budget_range}

Give 3 specific retention tactics:

1. [TACTIC NAME]
   - How it works
   - Setup cost and time
   - Expected impact (e.g., "increase repeat visits by X%")

2. [TACTIC NAME]
   - How it works
   - Setup cost and time
   - Expected impact

3. [TACTIC NAME]
   - How it works
   - Setup cost and time
   - Expected impact

Make these practical for a ${persona.employees}-person business.`;

    // ----------------------------------------
    // STICKINESS - New test type
    // ----------------------------------------
    case 'stickiness':
      return `How can ${persona.business_name} make customers LESS likely to switch to competitors?

Industry: ${persona.industry}
Location: ${location}
Customer pain points: ${persona.pain_points.join(', ')}

Describe 2-3 "stickiness mechanisms" - things that create switching costs or loyalty:

For each mechanism:
- What it is
- Why it makes switching hard
- How to implement it (budget: ${persona.budget_range})
- Example from a similar business

Be specific to ${persona.industry} in Australia.`;

    // ----------------------------------------
    // LOST DIRECTION - New test type
    // ----------------------------------------
    case 'lost_direction':
      return `${persona.business_name} feels stuck and unsure what to focus on.

Original goals: ${persona.goals.join(', ')}
Current challenges: ${persona.pain_points.join(', ')}
Location: ${location}

Provide a brief diagnostic:

1. LIKELY ROOT CAUSE (one sentence)
2. THE ONE THING to focus on first
3. FIRST ACTION to take this week
4. HOW TO MEASURE progress

Keep this simple and actionable. No jargon.`;

    // ----------------------------------------
    // FLOW - Customer journey mapping
    // ----------------------------------------
    case 'flow':
      return `Map the ideal customer journey for ${persona.business_name} (${persona.industry}, ${location}).

Budget: ${persona.budget_range}

Create a 5-stage flow:

AWARENESS → INTEREST → DECISION → PURCHASE → LOYALTY

For each stage:
- What the customer is thinking/feeling
- The ONE marketing touch point
- Specific action/tool to use (within budget)

Make this practical for a ${persona.employees}-person ${persona.industry} business in ${location}.`;

    default:
      return `Help ${persona.business_name} with their ${testType} marketing needs.`;
  }
}

// ============================================
// QUALITY CHECKER
// ============================================

export function checkResponseQuality(response: string): {
  score: number;
  issues: string[];
  passed: boolean;
} {
  const issues: string[] = [];
  let score = 100;

  // Check for banned words
  for (const word of BANNED_WORDS) {
    if (response.toLowerCase().includes(word.toLowerCase())) {
      issues.push(`Contains banned word: "${word}"`);
      score -= 5;
    }
  }

  // Check for wrong perspective (selling Synthex)
  const synthexPatterns = ['we connect you', 'we help you', 'we deliver', 'our team', 'our service', 'contact us'];
  for (const pattern of synthexPatterns) {
    if (response.toLowerCase().includes(pattern)) {
      issues.push(`Wrong perspective: "${pattern}" - should be from business POV`);
      score -= 10;
    }
  }

  // Check for length
  if (response.length < 100) {
    issues.push('Response too short');
    score -= 10;
  }
  if (response.length > 2000) {
    issues.push('Response too long');
    score -= 5;
  }

  // Check for Australian context
  const ausTerms = ['australia', 'australian', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'local'];
  const hasAusContext = ausTerms.some(term => response.toLowerCase().includes(term));
  if (!hasAusContext) {
    issues.push('Missing Australian/local context');
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    issues,
    passed: score >= 70,
  };
}

// ============================================
// EXAMPLE USAGE
// ============================================

/*
import { getImprovedPrompt, checkResponseQuality } from './improved-prompts';

const persona = {
  id: 'trades-001',
  business_name: 'Reliable Plumbing Co',
  industry: 'trades',
  location: 'Sydney, NSW',
  employees: 5,
  pain_points: ['Finding quality leads', 'Managing job scheduling'],
  goals: ['More consistent work', 'Higher margin jobs'],
  current_marketing: ['Word of mouth', 'Facebook page'],
  budget_range: '$500-$1000/month',
  decision_maker: { role: 'Owner', tech_savvy: 'low' as const },
};

const prompt = getImprovedPrompt('content_generation', persona);
// Send to LLM...
// const response = await callLLM(prompt);

// Check quality
const quality = checkResponseQuality(response);
console.log(`Quality score: ${quality.score}`);
console.log(`Issues: ${quality.issues.join(', ')}`);
*/
