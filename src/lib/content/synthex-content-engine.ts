// src/lib/content/synthex-content-engine.ts
// Synthex Content Engine - Framework-driven content generation

import config from './synthex-config.json';

// ============================================
// TYPES
// ============================================

export interface ContentRequest {
  business_name: string;
  industry: string;
  location: string;
  section_type: 'hero' | 'problem' | 'features' | 'process' | 'testimonials' | 'results' | 'cta' | 'faq';
  pain_points: string[];
  goals: string[];
  target_audience?: string;
  keywords?: string[];
}

export interface ContentOutput {
  content: string;
  framework_used: string;
  psychology_triggers: string[];
  quality_score: ContentScore;
  meta?: {
    headline?: string;
    subheadline?: string;
    cta?: string;
  };
}

export interface ContentScore {
  total: number;
  ai_friendliness: number;
  human_appeal: number;
  eeat_compliance: number;
  voice_compliance: number;
  breakdown: {
    check: string;
    passed: boolean;
    weight: number;
  }[];
}

// ============================================
// FRAMEWORK PROMPTS
// ============================================

function getFrameworkPrompt(framework: string, request: ContentRequest): string {
  const fw = config.copywriting.frameworks[framework as keyof typeof config.copywriting.frameworks];
  if (!fw) return '';

  const industryVoice = config.voice.industry_adaptation[request.industry as keyof typeof config.voice.industry_adaptation];
  const tone = industryVoice?.tone || 'Professional and helpful';
  const example = industryVoice?.example || '';

  return `
FRAMEWORK: ${fw.name}
${fw.description}

STRUCTURE:
${fw.structure.map((s, i) => `${i + 1}. ${s}`).join('\n')}

BRAND VOICE:
- Tone: ${tone}
- Example: "${example}"

LANGUAGE RULES:
${config.voice.language_rules.map(r => `- ${r.rule}: "${r.good}" (not "${r.bad}")`).join('\n')}

WORDS TO USE: ${config.voice.vocabulary.use.slice(0, 5).join(', ')}
WORDS TO AVOID: ${config.voice.vocabulary.avoid.slice(0, 5).join(', ')}
`;
}

function getAIPsychologyPrompt(request: ContentRequest): string {
  const biases = config.ai_psychology.biases;
  return `
AI OPTIMIZATION (for ChatGPT/Perplexity/Google AI visibility):
- CLARITY: ${biases.clarity.tactics.slice(0, 2).join('; ')}
- STRUCTURE: ${biases.structure.tactics.slice(0, 2).join('; ')}
- ENTITIES: Name the brand "${request.business_name}" consistently, include "${request.location}"
- AUTHORITY: Use specific numbers, reference standards
`;
}

function getHumanPsychologyPrompt(request: ContentRequest): string {
  // Triggers available for future use: config.human_psychology.triggers
  return `
PSYCHOLOGY TRIGGERS TO INCLUDE:
- Identity Resonance: Use "you" and "your", mirror their ${request.industry} vocabulary
- Cognitive Ease: Short sentences (<20 words), common words
- Loss Aversion: What they lose without action
- Social Proof: Reference "200+ Australian SMBs"

EMOTIONAL GOAL: Make the reader feel understood, then confident in the solution.
`;
}

// ============================================
// SECTION-SPECIFIC PROMPTS
// ============================================

export function generateSectionPrompt(request: ContentRequest): string {
  const framework = config.copywriting.section_to_framework[request.section_type as keyof typeof config.copywriting.section_to_framework] || 'storybrand';

  const basePrompt = `You are writing ${request.section_type.toUpperCase()} section content for ${request.business_name}, a ${request.industry} business in ${request.location}, Australia.

TARGET AUDIENCE: ${request.target_audience || `${request.industry} business owners in ${request.location}`}
PAIN POINTS: ${request.pain_points.join(', ')}
GOALS: ${request.goals.join(', ')}
${request.keywords ? `KEYWORDS TO INCLUDE: ${request.keywords.join(', ')}` : ''}

${getFrameworkPrompt(framework, request)}

${getAIPsychologyPrompt(request)}

${getHumanPsychologyPrompt(request)}

SYNTHEX BRAND RULES:
- Primary CTA: "${config.brand_rules.synthex_specific.primary_cta}"
- Positioning: "${config.brand_rules.synthex_specific.positioning}"
- Trust signal: "${config.brand_rules.trust_signals.client_count}"
- NO phone numbers or "book a call"
- Australian English (colour, organisation, centre)

`;

  // Section-specific instructions
  switch (request.section_type) {
    case 'hero':
      return basePrompt + `
OUTPUT FORMAT:
1. HEADLINE (10 words max, bold claim)
2. SUBHEADLINE (20 words max, expand on benefit)
3. CTA BUTTON TEXT
4. SUPPORTING TEXT (1-2 sentences)

Use 4U formula: Useful + Urgent + Unique + Ultra-specific
Example: "Get 3X More Leads in 30 Days Without Spending More on Ads"
`;

    case 'problem':
      return basePrompt + `
OUTPUT FORMAT (PAS Structure):
1. PROBLEM HEADLINE
2. PROBLEM DESCRIPTION (2-3 sentences, make pain vivid)
3. AGITATE (1-2 sentences, what happens if unsolved)
4. BRIDGE TO SOLUTION (1 sentence)

Make the reader nod and think "that's exactly my problem"
`;

    case 'features':
      return basePrompt + `
OUTPUT FORMAT (FAB for each feature):
For 3 key features, provide:
1. FEATURE NAME (2-4 words)
2. ADVANTAGE (what it does)
3. BENEFIT (why it matters to THEM)

Focus on outcomes, not technology. No jargon.
`;

    case 'testimonials':
      return basePrompt + `
OUTPUT FORMAT (4Ps Structure):
1. PROMISE (what result they got)
2. PICTURE (help reader visualize)
3. PROOF (specific numbers/details)
4. PUSH (implied CTA)

Include: Name, business type, location, specific result
Example format: "Sarah M., Plumber, Sydney - 'We went from 3 jobs/week to 12...'"
`;

    case 'cta':
      return basePrompt + `
OUTPUT FORMAT:
1. HEADLINE (urgency + benefit)
2. SUPPORTING TEXT (address final objection)
3. PRIMARY CTA: "Start Free Trial"
4. SECONDARY TEXT (reduce risk: "Cancel anytime, no contracts")

Use loss aversion: What do they miss by not acting?
`;

    case 'faq':
      return basePrompt + `
OUTPUT FORMAT:
Generate 5 FAQs that:
1. Address real objections
2. Build trust (E-E-A-T signals)
3. Include keywords naturally
4. Keep answers under 50 words each

Common objections: price, time, complexity, "will it work for me?"
`;

    default:
      return basePrompt + `
OUTPUT FORMAT:
Provide relevant content for this section following the framework guidelines.
`;
  }
}

// ============================================
// CONTENT SCORER
// ============================================

export function scoreContent(content: string, request: ContentRequest): ContentScore {
  const breakdown: ContentScore['breakdown'] = [];
  let totalScore = 0;
  let totalWeight = 0;

  // AI Friendliness (30%)
  const aiChecks = [
    {
      check: 'Short sentences (<20 words avg)',
      passed: calculateAvgSentenceLength(content) < 20,
      weight: 7.5,
    },
    {
      check: 'Entity name used consistently',
      passed: content.includes(request.business_name) || content.includes('Synthex'),
      weight: 7.5,
    },
    {
      check: 'Location mentioned',
      passed: content.toLowerCase().includes(request.location.toLowerCase().split(',')[0]),
      weight: 7.5,
    },
    {
      check: 'Specific numbers used',
      passed: /\d+/.test(content),
      weight: 7.5,
    },
  ];

  // Human Appeal (30%)
  const humanChecks = [
    {
      check: "Uses 'you' language",
      passed: (content.match(/\byou\b/gi) || []).length >= 2,
      weight: 7.5,
    },
    {
      check: 'No banned words',
      passed: !config.voice.vocabulary.avoid.some(w => content.toLowerCase().includes(w)),
      weight: 7.5,
    },
    {
      check: 'Active voice',
      passed: !content.includes('is handled by') && !content.includes('are managed by'),
      weight: 7.5,
    },
    {
      check: 'Benefit-focused',
      passed: content.includes('get') || content.includes('save') || content.includes('grow') || content.includes('increase'),
      weight: 7.5,
    },
  ];

  // E-E-A-T Compliance (20%)
  const eeatChecks = [
    {
      check: 'Trust signal present',
      passed: content.includes('200+') || content.includes('Australian') || content.includes('SMB'),
      weight: 10,
    },
    {
      check: 'Specific claim (not vague)',
      passed: !content.includes('many') && !content.includes('various') && !content.includes('multiple'),
      weight: 10,
    },
  ];

  // Voice Compliance (20%)
  const voiceChecks = [
    {
      check: 'Australian English',
      passed: !content.includes('color') && !content.includes('center') && !content.includes('organization'),
      weight: 10,
    },
    {
      check: 'No phone/call CTA',
      passed: !content.toLowerCase().includes('call us') && !content.toLowerCase().includes('phone'),
      weight: 10,
    },
  ];

  // Calculate scores
  const allChecks = [...aiChecks, ...humanChecks, ...eeatChecks, ...voiceChecks];

  for (const check of allChecks) {
    breakdown.push(check);
    if (check.passed) {
      totalScore += check.weight;
    }
    totalWeight += check.weight;
  }

  const normalizedScore = Math.round((totalScore / totalWeight) * 100);

  return {
    total: normalizedScore,
    ai_friendliness: calculateCategoryScore(aiChecks),
    human_appeal: calculateCategoryScore(humanChecks),
    eeat_compliance: calculateCategoryScore(eeatChecks),
    voice_compliance: calculateCategoryScore(voiceChecks),
    breakdown,
  };
}

function calculateAvgSentenceLength(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  const totalWords = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0);
  return totalWords / sentences.length;
}

function calculateCategoryScore(checks: { passed: boolean; weight: number }[]): number {
  const passed = checks.filter(c => c.passed).reduce((sum, c) => sum + c.weight, 0);
  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  return Math.round((passed / total) * 100);
}

// ============================================
// HEADLINE GENERATORS
// ============================================

export function generateHeadlinePrompt(request: ContentRequest, formula: '4u' | 'how_to' | 'number' = '4u'): string {
  const formulaConfig = config.copywriting.headline_formulas[formula];
  const industryVoice = config.voice.industry_adaptation[request.industry as keyof typeof config.voice.industry_adaptation];

  return `Generate a headline for ${request.business_name} (${request.industry}, ${request.location}).

FORMULA: ${formulaConfig.formula}
EXAMPLE: "${formulaConfig.example}"

PAIN POINT TO ADDRESS: ${request.pain_points[0]}
GOAL TO ACHIEVE: ${request.goals[0]}

TONE: ${industryVoice?.tone || 'Professional'}

RULES:
- Max 12 words
- Use "you/your" not "we/our"
- Include specific number or timeframe
- Australian English

Output just the headline, nothing else.`;
}

// ============================================
// INDUSTRY-SPECIFIC CONTENT
// ============================================

export function getIndustryContext(industry: string): {
  tone: string;
  vocabulary: string;
  example: string;
  pain_points: string[];
  goals: string[];
} {
  const adaptation = config.voice.industry_adaptation[industry as keyof typeof config.voice.industry_adaptation];

  const industryDefaults: Record<string, { pain_points: string[]; goals: string[] }> = {
    trades: {
      pain_points: ['Finding quality leads', 'Managing job scheduling', 'Quote follow-ups', 'Getting reviews'],
      goals: ['More consistent work', 'Higher margin jobs', 'Better reviews', 'Expand service area'],
    },
    professional_services: {
      pain_points: ['Client retention', 'Lead generation', 'Standing out from competitors', 'Online visibility'],
      goals: ['Grow client base', 'Increase referrals', 'Build authority', 'Automate admin'],
    },
    health_wellness: {
      pain_points: ['No-show appointments', 'Patient retention', 'Managing reviews', 'Local competition'],
      goals: ['Fill appointment book', 'Reduce no-shows', 'Build reputation', 'Attract new patients'],
    },
    hospitality: {
      pain_points: ['Seasonal fluctuations', 'Staff retention', 'Online ordering', 'Review management'],
      goals: ['Increase covers', 'Build loyal customers', 'Grow delivery sales', 'Event bookings'],
    },
    retail: {
      pain_points: ['Online competition', 'Inventory management', 'Foot traffic', 'Customer loyalty'],
      goals: ['Increase sales', 'Build online presence', 'Customer retention', 'Local brand awareness'],
    },
    automotive: {
      pain_points: ['Customer trust', 'Price competition', 'Staff recruitment', 'Building reputation'],
      goals: ['Increase bookings', 'Build trust', 'Better reviews', 'Fleet contracts'],
    },
    home_services: {
      pain_points: ['Seasonal demand', 'Staff reliability', 'Building trust', 'Getting repeat business'],
      goals: ['Consistent bookings', 'Grow service area', 'Build reviews', 'Recurring contracts'],
    },
    tech_services: {
      pain_points: ['Explaining value', 'Scope creep', 'Long sales cycles', 'Standing out'],
      goals: ['Retainer clients', 'Higher value projects', 'Build authority', 'Niche specialization'],
    },
  };

  const defaults = industryDefaults[industry] || industryDefaults.trades;

  return {
    tone: adaptation?.tone || 'Professional and helpful',
    vocabulary: adaptation?.vocabulary || 'Clear and direct',
    example: adaptation?.example || 'You do the work. We bring the customers.',
    pain_points: defaults.pain_points,
    goals: defaults.goals,
  };
}

// ============================================
// EXPORT CONFIG ACCESS
// ============================================

export const SYNTHEX_CONFIG = config;
export const COPYWRITING_FRAMEWORKS = config.copywriting.frameworks;
export const VOICE_RULES = config.voice;
export const DESIGN_TOKENS = config.design;
export const BRAND_RULES = config.brand_rules;
