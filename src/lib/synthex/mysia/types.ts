/**
 * Mysia Strategy Engine Type Definitions
 *
 * Truth-first, E.E.A.T.-driven marketing strategy types for Synthex
 */

// ============================================================================
// Strategy Mode Types
// ============================================================================

export type StrategyModeId =
  | 'blue-ocean'
  | 'jtbd'
  | 'category-design'
  | 'challenger-brand'
  | 'content-moat'
  | 'narrative-clarity'
  | 'growth-loops'
  | 'demand-generation'
  | 'own-conversation'
  | 'minimum-viable'
  | 'ethical-psychology';

export type AdvancedStrategyId =
  | 'temporal-demand'
  | 'conversation-gravity'
  | 'reality-anchoring'
  | 'emergent-authority'
  | 'ai-search-domination';

export interface StrategyMode {
  id: StrategyModeId;
  name: string;
  description: string;
  bestFor: string[];
  tactics: string[];
  metrics: string[];
  priority: number;
}

export interface AdvancedStrategy {
  id: AdvancedStrategyId;
  name: string;
  description: string;
  application: string;
  requirements: string[];
}

// ============================================================================
// AI Psychology Types
// ============================================================================

export type AIPsychologyBiasId =
  | 'reference-density'
  | 'authority-consensus'
  | 'clarity-answerability'
  | 'explainability'
  | 'stability';

export interface AIPsychologyBias {
  id: AIPsychologyBiasId;
  name: string;
  description: string;
  application: string;
  signals: string[];
}

// ============================================================================
// Human Psychology Types
// ============================================================================

export type HumanPsychologyTriggerId =
  | 'instant-credibility'
  | 'identity-resonance'
  | 'visual-momentum'
  | 'predictive-trust'
  | 'category-clarity';

export interface HumanPsychologyTrigger {
  id: HumanPsychologyTriggerId;
  name: string;
  description: string;
  application: string;
  implementation: string[];
}

// ============================================================================
// Agent Types
// ============================================================================

export type AgentRole = 'strategist' | 'researcher' | 'writer' | 'optimizer' | 'analyst';

export interface Agent {
  role: AgentRole;
  name: string;
  responsibilities: string[];
  outputs: string[];
}

// ============================================================================
// E.E.A.T. Types
// ============================================================================

export interface EEATGuardrails {
  experience: { requirement: string; validation: string[] };
  expertise: { requirement: string; validation: string[] };
  authoritativeness: { requirement: string; validation: string[] };
  trustworthiness: { requirement: string; validation: string[] };
}

// ============================================================================
// Client Context Types
// ============================================================================

export interface ClientContext {
  industry: string;
  businessSize: 'micro' | 'small' | 'medium';
  revenueRange: string;
  competitorStrength: 'weak' | 'moderate' | 'strong';
  marketPosition: 'new' | 'established' | 'leader';
  budget: 'low' | 'medium' | 'high';
  goals: string[];
  painPoints: string[];
}

export interface StrategyRecommendation {
  strategy: StrategyMode;
  score: number;
  reasoning: string;
  priorityTactics: string[];
}

// ============================================================================
// Content Scoring Types
// ============================================================================

export interface ContentForScoring {
  title?: string;
  body?: string;
  hasSchema?: boolean;
  hasFAQ?: boolean;
  citesAuthority?: boolean;
  hasMetrics?: boolean;
  showsProof?: boolean;
  hasTestimonials?: boolean;
  hasClearCTA?: boolean;
  industrySpecific?: boolean;
}

export interface ContentScore {
  score: number;
  maxScore: number;
  percentage: number;
  breakdown: Record<string, number>;
  recommendations: string[];
}

export interface OptimizationRecommendation {
  category: 'ai' | 'human' | 'both';
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  impact: string;
}

// ============================================================================
// Brand Configuration Types
// ============================================================================

export interface TargetAudience {
  primary: string;
  ageRange: string;
  employeeCount: string;
  revenueRange: string;
  industries: string[];
  psychographics: Record<string, boolean>;
  painPoints: string[];
  desiredOutcomes: string[];
}

export interface StoryBrandFramework {
  hero: string;
  problem: { external: string; internal: string; philosophical: string };
  villain: string;
  villainManifestations: string[];
  guide: { name: string; character: string; empathy: string; authority: string };
  plan: {
    step1: { name: string; description: string };
    step2: { name: string; description: string };
    step3: { name: string; description: string };
    step4: { name: string; description: string };
  };
  callToAction: { primary: string; secondary: string };
  success: { outcomes: string[] };
  failureAvoided: string[];
}

export interface ProofPoint {
  value: string;
  label: string;
  context: string;
  verified: boolean;
}

export interface Testimonial {
  quote: string;
  name: string;
  business: string;
  location: string;
  industry: string;
  metric: string;
}

export interface VoiceGuidelines {
  attributes: Record<string, string>;
  weAre: string[];
  weAreNot: string[];
  bannedWords: string[];
  australianSpelling: Record<string, string>;
}

export interface GlobalConstraints {
  truthFirst: { allowed: string[]; forbidden: string[] };
  interactionModel: { allowed: string[]; forbidden: string[] };
  eeatRequirements: {
    experience: string;
    expertise: string;
    authoritativeness: string;
    trustworthiness: string;
  };
}
