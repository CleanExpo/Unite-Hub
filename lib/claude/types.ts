// Type definitions for Claude AI integration

// Auto-reply types
export interface AutoReplyAnalysis {
  intent: string;
  needs: string[];
  gaps: string[];
  urgency: 'low' | 'medium' | 'high';
}

export interface QualifyingQuestion {
  question: string;
  purpose: string;
  category: 'pain_point' | 'goal' | 'budget' | 'timeline' | 'context';
}

export interface EmailTemplate {
  greeting: string;
  acknowledgment: string;
  body: string;
  closing: string;
  signature: string;
}

export interface AutoReplyResult {
  analysis: AutoReplyAnalysis;
  questions: QualifyingQuestion[];
  emailTemplate: EmailTemplate;
}

// Persona types
export interface PersonaDemographics {
  ageRange: string;
  location: string;
  industry: string;
  role: string;
  companySize: string;
  income: string;
}

export interface PersonaPsychographics {
  values: string[];
  interests: string[];
  motivations: string[];
  fears: string[];
  personality: string;
}

export interface PainPoint {
  pain: string;
  impact: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Goal {
  goal: string;
  priority: 'low' | 'medium' | 'high';
  timeframe: string;
}

export interface CommunicationPreferences {
  preferredChannels: string[];
  tone: string;
  frequency: string;
}

export interface BuyingBehavior {
  decisionMakers: string[];
  decisionProcess: string;
  budgetConsiderations: string;
  objections: string[];
}

export interface ContentPreferences {
  formats: string[];
  topics: string[];
  mediaConsumption: string[];
}

export interface CustomerPersona {
  name: string;
  tagline: string;
  demographics: PersonaDemographics;
  psychographics: PersonaPsychographics;
  painPoints: PainPoint[];
  goals: Goal[];
  communication: CommunicationPreferences;
  buyingBehavior: BuyingBehavior;
  contentPreferences: ContentPreferences;
}

export interface PersonaConfidence {
  score: number;
  dataQuality: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface PersonaResult {
  persona: CustomerPersona;
  confidence: PersonaConfidence;
}

// Strategy types
export interface MarketAnalysis {
  targetMarket: string;
  marketSize: string;
  trends: string[];
  opportunities: string[];
  threats: string[];
}

export interface BrandPositioning {
  uvp: string;
  differentiation: string;
  brandVoice: string;
  messagingPillars: string[];
}

export interface PlatformRecommendation {
  platform: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
  targetAudience: string;
  contentTypes: string[];
}

export interface ContentPillar {
  pillar: string;
  description: string;
  topics: string[];
}

export interface ContentMix {
  educational: number;
  promotional: number;
  engagement: number;
  entertainment: number;
}

export interface ContentStrategy {
  themes: string[];
  contentPillars: ContentPillar[];
  contentMix: ContentMix;
}

export interface CampaignIdea {
  name: string;
  goal: string;
  platforms: string[];
  duration: string;
  budget: string;
  tactics: string[];
}

export interface KPI {
  metric: string;
  target: string;
  measurement: string;
}

export interface Metrics {
  kpis: KPI[];
  tools: string[];
}

export interface StrategyPhase {
  duration: string;
  focus: string;
  deliverables: string[];
}

export interface Timeline {
  phase1: StrategyPhase;
  phase2: StrategyPhase;
  phase3: StrategyPhase;
}

export interface MarketingStrategy {
  marketAnalysis: MarketAnalysis;
  positioning: BrandPositioning;
  platforms: PlatformRecommendation[];
  contentStrategy: ContentStrategy;
  campaigns: CampaignIdea[];
  metrics: Metrics;
  timeline: Timeline;
}

export interface StrategyResult {
  strategy: MarketingStrategy;
}

// Campaign types
export interface AdTargeting {
  demographics: string[];
  interests: string[];
  behaviors: string[];
}

export interface VisualRequirements {
  dimensions: string;
  type: string;
  specifications: string;
}

export interface Ad {
  format: string;
  headline: string;
  primaryText: string;
  description: string;
  cta: string;
  visualRequirements: VisualRequirements;
}

export interface AdSet {
  name: string;
  targeting: AdTargeting;
  ads: Ad[];
}

export interface PlatformCampaign {
  platform: string;
  adSets: AdSet[];
}

export interface CalendarEntry {
  date: string;
  platform: string;
  contentType: string;
  content: string;
  hashtags: string[];
  visualNeeds: string;
  bestTimeToPost: string;
}

export interface ABTest {
  element: string;
  variationA: string;
  variationB: string;
  hypothesis: string;
}

export interface BudgetAllocation {
  platform: string;
  percentage: number;
  amount: string;
}

export interface CampaignBudget {
  total: string;
  allocation: BudgetAllocation[];
}

export interface Campaign {
  name: string;
  objective: string;
  duration: string;
  platforms: PlatformCampaign[];
  contentCalendar: CalendarEntry[];
  abTests: ABTest[];
  budget: CampaignBudget;
}

export interface CampaignResult {
  campaign: Campaign;
}

// Hooks types
export interface Hook {
  platform: string;
  funnelStage: 'awareness' | 'interest' | 'consideration' | 'decision';
  hook: string;
  variant: string;
  effectiveness: number;
  context: string;
  followUp: string;
}

export interface HookRecommendations {
  topPerformers: number[];
  testingStrategy: string;
  optimizationTips: string[];
}

export interface HooksResult {
  hooks: Hook[];
  recommendations: HookRecommendations;
}

// Mindmap types
export interface MindmapCentralNode {
  id: string;
  label: string;
  type: 'central';
}

export interface MindmapNodeMetadata {
  source: string;
  importance: 'low' | 'medium' | 'high';
  frequency: number;
}

export interface MindmapNode {
  id: string;
  label: string;
  type: 'category' | 'topic' | 'idea' | 'goal' | 'pain_point' | 'solution' | 'question';
  parentId: string;
  depth: number;
  metadata: MindmapNodeMetadata;
}

export interface MindmapRelationship {
  from: string;
  to: string;
  type: 'causes' | 'relates_to' | 'solves' | 'requires' | 'enables';
  strength: number;
}

export interface Mindmap {
  centralNode: MindmapCentralNode;
  nodes: MindmapNode[];
  relationships: MindmapRelationship[];
}

export interface MindmapInsights {
  mainThemes: string[];
  gaps: string[];
  opportunities: string[];
}

export interface MindmapResult {
  mindmap: Mindmap;
  insights: MindmapInsights;
}

// API response types
export interface AIResponse<T> {
  success: boolean;
  data: T;
  metadata: {
    contactId?: string;
    generatedAt: string;
    model: string;
    [key: string]: any;
  };
}

export interface AIError {
  error: string;
  details?: string;
}

// Email data type
export interface EmailData {
  from: string;
  subject: string;
  body: string;
  date?: string;
}

// Asset data type
export interface AssetData {
  type: string;
  description: string;
  url?: string;
}
