/**
 * Content Pipeline Service
 *
 * Decision Moment → Funnel → Content auto-generation:
 * - Link decision map scoring to recommended content types
 * - Auto-generate social assets from high-intent moments
 * - Auto-generate landing page copy for friction-heavy moments
 * - Auto-generate email scripts for nurturing mid-intent moments
 * - Funnel blueprint generator (AIDA: Awareness → Interest → Desire → Action)
 */

import { getSupabaseServer } from '@/lib/supabase';
import { MOMENT_KEYS, type DecisionAsset } from './decisionAssetService';
import { createSocialAsset } from './socialAssetService';
import { getPersonaConfig, getRecommendedContentTypes } from './marketingOverviewService';

// ============================================================================
// TYPES
// ============================================================================

export interface ContentRecommendation {
  type: string;
  format: string;
  channel: string;
  priority: 'high' | 'medium' | 'low';
  momentKey: string;
  rationale: string;
}

export interface GeneratedContent {
  id: string;
  type: 'social' | 'landing' | 'email' | 'ad';
  title: string;
  hook?: string;
  body: string;
  cta: string;
  metadata: {
    momentKey: string;
    funnelStage: string;
    persona: string;
    confidence: number;
  };
}

export interface LandingPageCopy {
  headline: string;
  subheadline: string;
  benefits: string[];
  objectionHandlers: { objection: string; response: string }[];
  testimonialPrompts: string[];
  cta: {
    primary: string;
    secondary: string;
  };
  seoMeta: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export interface EmailSequence {
  name: string;
  trigger: string;
  emails: EmailTemplate[];
  totalDuration: number;
}

export interface EmailTemplate {
  day: number;
  subject: string;
  preheader: string;
  body: string;
  cta: string;
  type: 'welcome' | 'value' | 'proof' | 'urgency' | 'close';
}

export interface FunnelBlueprint {
  name: string;
  stages: {
    name: 'awareness' | 'interest' | 'desire' | 'action';
    goal: string;
    contentTypes: string[];
    channels: string[];
    kpis: string[];
    assets: ContentRecommendation[];
  }[];
  estimatedDuration: string;
  persona: string;
}

// ============================================================================
// MOMENT SCORING & RECOMMENDATIONS
// ============================================================================

const MOMENT_INTENT_SCORES: Record<string, number> = {
  // Awareness (low intent)
  [MOMENT_KEYS.awareness.unaware]: 10,
  [MOMENT_KEYS.awareness.problem_aware]: 25,
  [MOMENT_KEYS.awareness.solution_aware]: 40,
  // Consideration (medium intent)
  [MOMENT_KEYS.consideration.comparing]: 55,
  [MOMENT_KEYS.consideration.evaluating]: 65,
  [MOMENT_KEYS.consideration.researching]: 50,
  // Conversion (high intent)
  [MOMENT_KEYS.conversion.deciding]: 80,
  [MOMENT_KEYS.conversion.objecting]: 70,
  [MOMENT_KEYS.conversion.purchasing]: 95,
  // Retention
  [MOMENT_KEYS.retention.onboarding]: 85,
  [MOMENT_KEYS.retention.using]: 75,
  [MOMENT_KEYS.retention.advocating]: 90,
};

export function getMomentIntentScore(momentKey: string): number {
  return MOMENT_INTENT_SCORES[momentKey] || 50;
}

export function getContentRecommendations(
  decisionAssets: DecisionAsset[],
  persona: string
): ContentRecommendation[] {
  const recommendations: ContentRecommendation[] = [];

  for (const asset of decisionAssets) {
    const intentScore = getMomentIntentScore(asset.moment_key);
    const funnelStage = asset.moment_key.split('_')[0] as 'awareness' | 'consideration' | 'conversion' | 'retention';

    // High intent (70+): Social proof, case studies, demos
    if (intentScore >= 70) {
      recommendations.push({
        type: 'case-study',
        format: 'video',
        channel: 'youtube',
        priority: 'high',
        momentKey: asset.moment_key,
        rationale: 'High-intent moment requires proof assets to overcome final objections',
      });
      recommendations.push({
        type: 'testimonial',
        format: 'carousel',
        channel: 'linkedin',
        priority: 'high',
        momentKey: asset.moment_key,
        rationale: 'Social proof addresses trust concerns at decision point',
      });
    }

    // Medium intent (40-69): Educational content, comparisons
    if (intentScore >= 40 && intentScore < 70) {
      recommendations.push({
        type: 'comparison',
        format: 'infographic',
        channel: 'instagram',
        priority: 'medium',
        momentKey: asset.moment_key,
        rationale: 'Consideration phase needs clear differentiation',
      });
      recommendations.push({
        type: 'how-to',
        format: 'video',
        channel: 'youtube',
        priority: 'medium',
        momentKey: asset.moment_key,
        rationale: 'Educational content builds authority during research',
      });
    }

    // Low intent (<40): Awareness content
    if (intentScore < 40) {
      recommendations.push({
        type: 'thought-leadership',
        format: 'post',
        channel: 'linkedin',
        priority: 'low',
        momentKey: asset.moment_key,
        rationale: 'Build awareness with valuable insights',
      });
      recommendations.push({
        type: 'problem-agitation',
        format: 'reel',
        channel: 'instagram',
        priority: 'low',
        momentKey: asset.moment_key,
        rationale: 'Create problem awareness with relatable content',
      });
    }

    // Objection handling specific
    if (asset.objection) {
      recommendations.push({
        type: 'objection-handler',
        format: 'landing-section',
        channel: 'website',
        priority: 'high',
        momentKey: asset.moment_key,
        rationale: `Address objection: "${asset.objection}"`,
      });
    }
  }

  return recommendations;
}

// ============================================================================
// AUTO-GENERATION: SOCIAL ASSETS
// ============================================================================

export async function generateSocialFromMoment(
  workspaceId: string,
  playbookId: string,
  decisionAsset: DecisionAsset,
  persona: string
): Promise<{ data: GeneratedContent | null; error: Error | null }> {
  const supabase = await getSupabaseServer();
  const config = getPersonaConfig(persona);
  const intentScore = getMomentIntentScore(decisionAsset.moment_key);

  try {
    // Generate hook based on problem statement
    const hook = generateHook(decisionAsset.problem_statement || '', persona, intentScore);

    // Generate script outline
    const scriptOutline = generateScriptOutline(
      decisionAsset.problem_statement || '',
      decisionAsset.objection || '',
      decisionAsset.required_proof || '',
      persona
    );

    // Determine best platform based on intent
    const platform = intentScore >= 70 ? 'youtube' : intentScore >= 40 ? 'linkedin' : 'instagram';
    const assetType = intentScore >= 70 ? 'video' : intentScore >= 40 ? 'carousel' : 'script';

    // Create the social asset
    const { data: asset, error } = await createSocialAsset({
      workspace_id: workspaceId,
      playbook_id: playbookId,
      platform,
      asset_type: assetType,
      title: `${decisionAsset.moment_key.replace(/_/g, ' ')} - Auto-generated`,
      hook,
      script_outline: scriptOutline,
      metadata: {
        source: 'content-pipeline',
        moment_key: decisionAsset.moment_key,
        intent_score: intentScore,
        persona,
      },
    });

    if (error) {
throw error;
}

    const generated: GeneratedContent = {
      id: asset?.id || '',
      type: 'social',
      title: asset?.title || '',
      hook,
      body: scriptOutline,
      cta: config.keywords[0] ? `Learn more about ${config.keywords[0]}` : 'Learn more',
      metadata: {
        momentKey: decisionAsset.moment_key,
        funnelStage: decisionAsset.moment_key.split('_')[0],
        persona,
        confidence: 0.75,
      },
    };

    return { data: generated, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

function generateHook(problemStatement: string, persona: string, intentScore: number): string {
  const hooks: Record<string, string[]> = {
    high: [
      `Stop wasting money on ${problemStatement.toLowerCase()}...`,
      `The truth about ${problemStatement.toLowerCase()} that nobody tells you`,
      `I fixed ${problemStatement.toLowerCase()} in 30 days. Here's how.`,
    ],
    medium: [
      `Are you struggling with ${problemStatement.toLowerCase()}?`,
      `3 signs ${problemStatement.toLowerCase()} is holding you back`,
      `What if ${problemStatement.toLowerCase()} wasn't an issue?`,
    ],
    low: [
      `Did you know ${problemStatement.toLowerCase()}?`,
      `${problemStatement} explained in 60 seconds`,
      `The hidden cost of ${problemStatement.toLowerCase()}`,
    ],
  };

  const tier = intentScore >= 70 ? 'high' : intentScore >= 40 ? 'medium' : 'low';
  const hookOptions = hooks[tier];
  return hookOptions[Math.floor(Math.random() * hookOptions.length)];
}

function generateScriptOutline(
  problem: string,
  objection: string,
  proof: string,
  persona: string
): string {
  const config = getPersonaConfig(persona);

  const outline = [
    `1. HOOK: Attention-grabbing opener about ${problem}`,
    `2. PROBLEM: Expand on the pain point - why this matters`,
    `3. AGITATE: What happens if this isn't solved?`,
    objection ? `4. OBJECTION: Address "${objection}"` : '4. TRANSITION: Bridge to solution',
    `5. SOLUTION: Introduce your approach`,
    proof ? `6. PROOF: ${proof}` : '6. PROOF: Case study or testimonial',
    `7. CTA: Clear next step (${config.tone} tone)`,
  ];

  return outline.join('\n');
}

// ============================================================================
// AUTO-GENERATION: LANDING PAGE COPY
// ============================================================================

export function generateLandingPageCopy(
  decisionAssets: DecisionAsset[],
  persona: string
): LandingPageCopy {
  const config = getPersonaConfig(persona);

  // Extract objections from assets
  const objections = decisionAssets
    .filter((a) => a.objection)
    .map((a) => ({
      objection: a.objection!,
      response: a.required_proof || generateObjectionResponse(a.objection!, persona),
    }));

  // Generate benefits from problem statements
  const benefits = decisionAssets
    .filter((a) => a.problem_statement)
    .map((a) => problemToBenefit(a.problem_statement!, persona))
    .slice(0, 5);

  // Generate headline based on highest-intent moment
  const highestIntent = decisionAssets.reduce((prev, curr) => {
    return getMomentIntentScore(curr.moment_key) > getMomentIntentScore(prev.moment_key) ? curr : prev;
  }, decisionAssets[0]);

  const headline = generateHeadline(highestIntent, persona);
  const subheadline = generateSubheadline(config);

  return {
    headline,
    subheadline,
    benefits,
    objectionHandlers: objections,
    testimonialPrompts: [
      'How did [product] help you overcome [main objection]?',
      'What results have you seen since using [product]?',
      'What would you tell someone considering [product]?',
    ],
    cta: {
      primary: getCTAText(persona, 'primary'),
      secondary: getCTAText(persona, 'secondary'),
    },
    seoMeta: {
      title: `${headline} | ${config.keywords[0]}`,
      description: subheadline,
      keywords: config.keywords,
    },
  };
}

function generateObjectionResponse(objection: string, persona: string): string {
  const templates: Record<string, string> = {
    saas: `We understand ${objection.toLowerCase()} is a concern. That's why we offer flexible solutions tailored to your needs.`,
    trade: `${objection}? Our track record speaks for itself. We've helped hundreds of clients achieve their goals.`,
    agency: `We hear this often. The truth is, investing in ${objection.toLowerCase().replace("too", "the right")} delivers measurable ROI.`,
    nonprofit: `We're committed to transparency. Every contribution directly supports our mission.`,
    ecommerce: `We've got you covered! Our guarantee ensures your complete satisfaction.`,
    professional: `Our expertise ensures ${objection.toLowerCase()} becomes an advantage, not a barrier.`,
  };

  return templates[persona] || templates.professional;
}

function problemToBenefit(problem: string, persona: string): string {
  // Convert problem to benefit statement
  const prefix = {
    saas: 'Automate',
    trade: 'Eliminate',
    agency: 'Transform',
    nonprofit: 'Empower',
    ecommerce: 'Discover',
    professional: 'Master',
  };

  return `${prefix[persona as keyof typeof prefix] || 'Solve'} ${problem.toLowerCase().replace('struggling with', '').replace('dealing with', '')}`;
}

function generateHeadline(asset: DecisionAsset, persona: string): string {
  const templates: Record<string, string> = {
    saas: 'The Smarter Way to [Outcome]',
    trade: 'Quality [Service] You Can Trust',
    agency: 'Results That Speak for Themselves',
    nonprofit: 'Together, We Can [Mission]',
    ecommerce: 'Discover [Product Category] Made for You',
    professional: 'Expert [Service] for [Outcome]',
  };

  return templates[persona] || templates.professional;
}

function generateSubheadline(config: BrandConfig): string {
  return `Join thousands who've discovered a better way. ${config.voice}.`;
}

function getCTAText(persona: string, type: 'primary' | 'secondary'): string {
  const ctas: Record<string, { primary: string; secondary: string }> = {
    saas: { primary: 'Start Free Trial', secondary: 'Watch Demo' },
    trade: { primary: 'Get Free Quote', secondary: 'View Our Work' },
    agency: { primary: 'Book Discovery Call', secondary: 'See Case Studies' },
    nonprofit: { primary: 'Donate Now', secondary: 'Learn Our Impact' },
    ecommerce: { primary: 'Shop Now', secondary: 'Browse Collections' },
    professional: { primary: 'Schedule Consultation', secondary: 'Learn More' },
  };

  return ctas[persona]?.[type] || ctas.professional[type];
}

// ============================================================================
// AUTO-GENERATION: EMAIL SEQUENCES
// ============================================================================

export function generateEmailSequence(
  funnelStage: 'awareness' | 'consideration' | 'conversion' | 'retention',
  persona: string,
  decisionAssets: DecisionAsset[]
): EmailSequence {
  const config = getPersonaConfig(persona);

  const sequences: Record<string, EmailSequence> = {
    awareness: {
      name: 'Welcome & Educate Sequence',
      trigger: 'Lead magnet download',
      totalDuration: 14,
      emails: [
        {
          day: 0,
          subject: `Welcome! Here's your [resource]`,
          preheader: 'Plus a quick tip to get started',
          body: generateEmailBody('welcome', persona, config),
          cta: 'Download Now',
          type: 'welcome',
        },
        {
          day: 3,
          subject: `The #1 mistake with [topic]`,
          preheader: 'And how to avoid it',
          body: generateEmailBody('value', persona, config),
          cta: 'Read More',
          type: 'value',
        },
        {
          day: 7,
          subject: `How [company] achieved [result]`,
          preheader: 'Real results from real customers',
          body: generateEmailBody('proof', persona, config),
          cta: 'See Case Study',
          type: 'proof',
        },
        {
          day: 14,
          subject: `Ready to take the next step?`,
          preheader: 'Here\'s what comes next',
          body: generateEmailBody('close', persona, config),
          cta: getCTAText(persona, 'primary'),
          type: 'close',
        },
      ],
    },
    consideration: {
      name: 'Comparison & Evaluation Sequence',
      trigger: 'Pricing page visit',
      totalDuration: 10,
      emails: [
        {
          day: 0,
          subject: `Comparing options? Here's what matters`,
          preheader: 'A framework for making the right choice',
          body: generateEmailBody('value', persona, config),
          cta: 'Compare Now',
          type: 'value',
        },
        {
          day: 2,
          subject: `Questions about [common objection]?`,
          preheader: 'Let me address that',
          body: generateEmailBody('proof', persona, config),
          cta: 'Learn More',
          type: 'proof',
        },
        {
          day: 5,
          subject: `[Name], quick question`,
          preheader: 'Is anything holding you back?',
          body: generateEmailBody('urgency', persona, config),
          cta: 'Reply to Chat',
          type: 'urgency',
        },
        {
          day: 10,
          subject: `Special offer inside`,
          preheader: 'Valid for 48 hours',
          body: generateEmailBody('close', persona, config),
          cta: getCTAText(persona, 'primary'),
          type: 'close',
        },
      ],
    },
    conversion: {
      name: 'Cart Abandonment & Close Sequence',
      trigger: 'Cart abandonment',
      totalDuration: 5,
      emails: [
        {
          day: 0,
          subject: `Did something go wrong?`,
          preheader: 'Your cart is waiting',
          body: generateEmailBody('urgency', persona, config),
          cta: 'Complete Order',
          type: 'urgency',
        },
        {
          day: 1,
          subject: `Still thinking it over?`,
          preheader: 'Here\'s what others say',
          body: generateEmailBody('proof', persona, config),
          cta: 'See Reviews',
          type: 'proof',
        },
        {
          day: 3,
          subject: `Last chance: Your exclusive offer`,
          preheader: 'Expires in 24 hours',
          body: generateEmailBody('close', persona, config),
          cta: getCTAText(persona, 'primary'),
          type: 'close',
        },
      ],
    },
    retention: {
      name: 'Onboarding & Success Sequence',
      trigger: 'Purchase complete',
      totalDuration: 30,
      emails: [
        {
          day: 0,
          subject: `Welcome to the family!`,
          preheader: 'Here\'s how to get started',
          body: generateEmailBody('welcome', persona, config),
          cta: 'Get Started',
          type: 'welcome',
        },
        {
          day: 3,
          subject: `Quick win: Try this today`,
          preheader: 'Takes just 5 minutes',
          body: generateEmailBody('value', persona, config),
          cta: 'Try Now',
          type: 'value',
        },
        {
          day: 7,
          subject: `How's it going so far?`,
          preheader: 'We\'d love to hear from you',
          body: generateEmailBody('value', persona, config),
          cta: 'Share Feedback',
          type: 'value',
        },
        {
          day: 14,
          subject: `You're doing great! Here's what's next`,
          preheader: 'Advanced tips inside',
          body: generateEmailBody('value', persona, config),
          cta: 'Level Up',
          type: 'value',
        },
        {
          day: 30,
          subject: `30 days in - celebrating your progress!`,
          preheader: 'Plus a special thank you',
          body: generateEmailBody('proof', persona, config),
          cta: 'Share Your Story',
          type: 'proof',
        },
      ],
    },
  };

  return sequences[funnelStage] || sequences.awareness;
}

function generateEmailBody(type: EmailTemplate['type'], persona: string, config: BrandConfig): string {
  const templates: Record<string, Record<EmailTemplate['type'], string>> = {
    saas: {
      welcome: `Hi [Name],\n\nWelcome aboard! You've made a great decision.\n\nHere's what happens next...\n\nBest,\nThe Team`,
      value: `Hi [Name],\n\nQuick tip that'll save you hours:\n\n[Tip content]\n\nTry it today and let us know how it goes.\n\nCheers,\nThe Team`,
      proof: `Hi [Name],\n\n[Company] was struggling with [problem]. Sound familiar?\n\nHere's how they turned it around...\n\n[Case study summary]\n\nThe Team`,
      urgency: `Hi [Name],\n\nNoticed you were checking things out. Any questions?\n\nI'm here to help.\n\nBest,\n[Name]`,
      close: `Hi [Name],\n\nReady to [main benefit]?\n\nHere's a special offer just for you...\n\nLet's get started,\nThe Team`,
    },
  };

  return templates[persona]?.[type] || templates.saas[type];
}

// ============================================================================
// FUNNEL BLUEPRINT GENERATOR
// ============================================================================

export function generateFunnelBlueprint(
  persona: string,
  industry: string,
  decisionAssets: DecisionAsset[]
): FunnelBlueprint {
  const config = getPersonaConfig(persona);
  const recommendations = getContentRecommendations(decisionAssets, persona);

  return {
    name: `${industry} Marketing Funnel - ${persona}`,
    estimatedDuration: '90 days',
    persona,
    stages: [
      {
        name: 'awareness',
        goal: 'Build brand recognition and attract target audience',
        contentTypes: getRecommendedContentTypes('awareness', persona),
        channels: ['organic-social', 'paid-social', 'seo', 'pr'],
        kpis: ['impressions', 'reach', 'engagement-rate', 'brand-mentions'],
        assets: recommendations.filter((r) => r.priority === 'low'),
      },
      {
        name: 'interest',
        goal: 'Capture leads and educate prospects',
        contentTypes: getRecommendedContentTypes('interest', persona),
        channels: ['email', 'retargeting', 'webinars', 'content-marketing'],
        kpis: ['leads', 'email-subscribers', 'content-downloads', 'webinar-registrations'],
        assets: recommendations.filter((r) => r.priority === 'medium'),
      },
      {
        name: 'desire',
        goal: 'Build preference and overcome objections',
        contentTypes: getRecommendedContentTypes('desire', persona),
        channels: ['email-nurture', 'demos', 'case-studies', 'comparisons'],
        kpis: ['demo-requests', 'trial-signups', 'proposal-requests', 'sales-calls'],
        assets: recommendations.filter((r) => r.priority === 'high'),
      },
      {
        name: 'action',
        goal: 'Convert prospects to customers',
        contentTypes: getRecommendedContentTypes('action', persona),
        channels: ['sales', 'checkout', 'onboarding'],
        kpis: ['conversions', 'revenue', 'aov', 'time-to-close'],
        assets: recommendations.filter((r) => r.momentKey.includes('conversion')),
      },
    ],
  };
}
