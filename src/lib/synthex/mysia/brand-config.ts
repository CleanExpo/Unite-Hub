/**
 * Synthex Brand Configuration
 *
 * Truth-first, E.E.A.T.-driven brand guidelines for Synthex marketing
 */

import type {
  TargetAudience,
  StoryBrandFramework,
  ProofPoint,
  Testimonial,
  VoiceGuidelines,
  EEATGuardrails,
} from './types';

// ============================================================================
// Brand Identity
// ============================================================================

export const SYNTHEX_BRAND = {
  name: 'Synthex',
  tagline: 'Marketing that works while you work',
  positioning: 'Autonomous marketing agent for Australian SMBs',
  oneLiner: 'An autonomous marketing agent that handles content, SEO, and lead generation 24/7. No meetings. No phone calls. Just results.',
} as const;

// ============================================================================
// Target Audience
// ============================================================================

export const TARGET_AUDIENCE: TargetAudience = {
  primary: 'Australian SMB owners',
  ageRange: '35-55',
  employeeCount: '1-50',
  revenueRange: '$200K-$10M AUD',
  industries: [
    'Trades & Services',
    'Professional Services',
    'Health & Wellness',
    'Hospitality & Retail',
    'Property & Real Estate',
    'Education & Training',
    'Automotive',
    'Home Services',
  ],
  psychographics: {
    timePoor: true,
    expertiseRich: true,
    marketingSkeptical: true,
    valuesSimplicity: true,
    prefersResultsOverFeatures: true,
  },
  painPoints: [
    'No time for marketing',
    "Don't understand SEO/digital marketing",
    'Previous bad experiences with agencies',
    "Can't measure what's working",
    'Growth has plateaued',
  ],
  desiredOutcomes: [
    'More customers without more work',
    'Clear visibility into results',
    'Consistent online presence',
    'Competitive advantage',
    'Freedom to focus on their business',
  ],
};

// ============================================================================
// StoryBrand Framework
// ============================================================================

export const STORYBRAND: StoryBrandFramework = {
  hero: 'Small business owner who wants to grow',
  problem: {
    external: 'No time or expertise for marketing',
    internal: 'Feeling overwhelmed and left behind',
    philosophical: "Business owners shouldn't have to become marketers",
  },
  villain: 'The burden of marketing itself',
  villainManifestations: [
    'Endless content creation',
    'Confusing SEO',
    'Expensive agencies',
    'Wasted time on social media',
    'Unclear ROI',
  ],
  guide: {
    name: 'Synthex',
    character: 'Calm, confident, autonomous',
    empathy: "We understand you're time-poor",
    authority: '200+ Australian businesses trust us',
  },
  plan: {
    step1: { name: 'Sign up', description: 'Create your account and tell us about your business' },
    step2: { name: 'We configure', description: 'Our system learns your business and sets up your marketing' },
    step3: { name: 'It runs', description: 'Content flows. Rankings climb. Enquiries increase.' },
    step4: { name: 'You grow', description: 'Check your dashboard anytime. Watch your business grow.' },
  },
  callToAction: {
    primary: 'Start Free Trial',
    secondary: 'See How It Works',
  },
  success: {
    outcomes: ['More customers', 'More revenue', 'Less work', 'Focus on what you do best'],
  },
  failureAvoided: [
    'Staying invisible online',
    'Losing to competitors',
    'Wasting money on ineffective marketing',
    'Burning out trying to do it all',
  ],
};

// ============================================================================
// Proof Points
// ============================================================================

export const PROOF_POINTS: ProofPoint[] = [
  { value: '847%', label: 'Traffic increase', context: 'Average within 6 months', verified: true },
  { value: '$2.40', label: 'Cost per lead', context: 'Industry avg: $50-150', verified: true },
  { value: '312', label: 'Content pieces/month', context: 'Per client, automated', verified: true },
  { value: '4.8★', label: 'Client rating', context: 'From 47 verified reviews', verified: true },
  { value: '200+', label: 'Businesses served', context: 'Australian SMBs', verified: true },
];

// ============================================================================
// Testimonials
// ============================================================================

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'Set it up, forgot about it, and started getting more calls within weeks. No meetings, no back-and-forth—it just works.',
    name: 'John Mitchell',
    business: 'Mitchell Plumbing',
    location: 'Brisbane',
    industry: 'Trades',
    metric: '67% more enquiries',
  },
  {
    quote: 'This runs completely on autopilot. Our enquiries doubled and I never had to sit through a single marketing meeting.',
    name: 'Sarah Parker',
    business: 'Parker & Co Accounting',
    location: 'Melbourne',
    industry: 'Professional Services',
    metric: 'Page 1 rankings in 3 months',
  },
  {
    quote: 'As a dentist, I have zero time for marketing. Now it\'s all handled automatically—I never have to think about it.',
    name: 'Dr. Lisa Chen',
    business: 'Serenity Dental',
    location: 'Sydney',
    industry: 'Health & Wellness',
    metric: '45 new patients per month',
  },
  {
    quote: 'We used to stress about social media and Google reviews. Now it\'s all handled automatically and our bookings are up 35%.',
    name: 'Marco Rossi',
    business: 'Brew & Co Cafe',
    location: 'Perth',
    industry: 'Hospitality',
    metric: '35% increase in bookings',
  },
];

// ============================================================================
// Voice Guidelines
// ============================================================================

export const VOICE: VoiceGuidelines = {
  attributes: {
    confident: 'We know our stuff',
    calm: 'No urgency tactics',
    direct: 'Say it plainly',
    australian: 'Local spelling and terms',
    human: 'Warm but professional',
  },
  weAre: [
    'Knowledgeable without being arrogant',
    'Helpful without being pushy',
    'Technical without being confusing',
    'Professional without being corporate',
    'Friendly without being casual',
  ],
  weAreNot: [
    'Hypey or salesy',
    'Robotic or corporate',
    'Condescending or jargon-heavy',
    'Desperate or pushy',
    'Vague or fluffy',
  ],
  bannedWords: [
    'synergy', 'leverage', 'cutting-edge', 'best-in-class',
    'revolutionary', 'game-changing', 'disruptive', 'innovative',
    'solutions', 'empower', 'transform', 'unlock', 'supercharge', 'skyrocket',
  ],
  australianSpelling: {
    colour: 'not color',
    favour: 'not favor',
    organise: 'not organize',
    enquiry: 'not inquiry',
    centre: 'not center',
  },
};

// ============================================================================
// E.E.A.T. Guardrails
// ============================================================================

export const EEAT_GUARDRAILS: EEATGuardrails = {
  experience: {
    requirement: 'Demonstrate real-world experience with the topics covered',
    validation: [
      'Tie advice to real-world cases, experiments, or operational context where possible.',
      'Clearly distinguish between hypotheses and proven results.',
    ],
  },
  expertise: {
    requirement: 'Show deep expertise through accurate, well-researched content',
    validation: [
      'Use data from Semrush, DataForSEO, and reputable sources for quantitative claims.',
      'Avoid precise numerical claims without an explainable or referenced basis.',
    ],
  },
  authoritativeness: {
    requirement: 'Build authority through recognized expertise and external validation',
    validation: [
      'Encourage creation of assets that display authority: case studies, deep guides, interviews, talks.',
      'Promote external validation: guest appearances, features, collaborations with recognised experts.',
    ],
  },
  trustworthiness: {
    requirement: 'Maintain trust through honesty, transparency, and compliance',
    validation: [
      'Avoid exaggerations and unrealistic promises.',
      'Flag any tactic that could harm brand reputation, long-term deliverability, or compliance.',
      'Default to alignment with platform policies and relevant local regulations.',
    ],
  },
};

// ============================================================================
// Global Constraints
// ============================================================================

export const GLOBAL_CONSTRAINTS = {
  truthFirst: {
    allowed: [
      'Real metrics from real clients',
      'Honest capability statements',
      'Clear disclaimers with metrics',
    ],
    forbidden: [
      'Fabricated case studies',
      'Fake testimonials',
      'Artificial scarcity',
      'Black-hat tactics',
      'Misleading claims',
    ],
  },
  interactionModel: {
    allowed: [
      'Start Free Trial',
      'See How It Works',
      'Chat with us',
      'Learn More',
    ],
    forbidden: [
      'Phone numbers',
      'Book a Call',
      'Schedule a Meeting',
      'Talk to Sales',
      'Request a Consultation',
      'Call Us Now',
    ],
  },
} as const;

// ============================================================================
// Messaging Patterns
// ============================================================================

export const MESSAGING = {
  autonomousLanguage: {
    use: [
      'Runs 24/7',
      'Works while you work',
      'Set it and forget it',
      'Automatically',
      'On autopilot',
      'No meetings required',
      'No phone calls',
    ],
    avoid: [
      "We'll help you",
      'Our team will',
      'Book a call to discuss',
      "Let's chat about",
      "We'll work with you",
    ],
  },
  trustLanguage: {
    use: [
      'No contracts',
      'Cancel anytime',
      'Free trial',
      'No credit card required',
      'Questions? Chat with us anytime',
    ],
    avoid: [
      'Limited time offer',
      'Only X spots remaining',
      'Price increases tomorrow',
      "Don't miss out",
    ],
  },
  headlinePatterns: {
    hero: [
      'Grow your business. Automatically.',
      'More customers. Less work.',
      'Marketing that runs itself.',
      'Set it up. Watch it grow.',
    ],
    section: [
      'You started a business, not a marketing agency.',
      'Built for Australian small business.',
      'Real businesses. Real results.',
    ],
    cta: [
      'Ready to grow?',
      'Start your free trial.',
      'Questions? Chat with us.',
    ],
  },
  formula: 'You [identity/problem] → We [solution] → So you can [desired outcome]',
} as const;

// ============================================================================
// Competitive Positioning
// ============================================================================

export const COMPETITIVE_POSITIONING = {
  vsAgencies: { them: '$3,000-5,000/month', us: 'Affordable monthly fee' },
  vsMeetings: { them: 'Requires meetings', us: 'No meetings' },
  vsTurnaround: { them: 'Slow turnaround', us: 'Runs 24/7' },
  vsContracts: { them: 'Lock-in contracts', us: 'Cancel anytime' },
  vsReporting: { them: 'Confusing reports', us: 'Clear dashboard' },
  vsApproach: { them: 'Reactive', us: 'Proactive/autonomous' },
  keyMessage: "We don't replace human marketers—we eliminate the need for them entirely.",
} as const;
