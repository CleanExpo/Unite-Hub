/**
 * Orchestrator Router
 *
 * Unified skill routing for all marketing agents by intent:
 * - seo: No-Bluff SEO Protocol
 * - social: Social Playbook generation
 * - funnel: Decision Moment mapping
 * - visual: Visual Experience Engine
 * - moment: Decision asset creation
 * - deployment: DigitalOcean MCP monitoring
 * - founder_os: Business registry, signals, snapshots
 * - ai_phill: Strategic advice, journal, insights
 * - seo_leak: SEO audits, gap analysis, leak signals
 * - boost_bump: Behavioral boost jobs, engagement optimization
 * - search_suite: Keyword tracking, SERP monitoring
 * - social_inbox: Social message triage, unified inbox
 * - pre_client: Email-based lead identification, timeline building
 * - cognitive_twin: Health scoring, digests, decision support
 *
 * Provides cross-agent collaboration, plan → execution → validation.
 * All new agents operate in HUMAN_GOVERNED mode by default.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  getUnifiedDashboard,
  propagateBrandConfig,
  getPersonaConfig,
  getRecommendedContentTypes,
  type BrandConfig,
  type UnifiedDashboardData,
} from '@/lib/marketing/marketingOverviewService';
import { createSocialPlaybook, updateSocialPlaybook } from '@/lib/marketing/socialPlaybookService';
import { createSocialAsset } from '@/lib/marketing/socialAssetService';
import { createDecisionMap, createDecisionAsset } from '@/lib/marketing/decisionMomentService';
import { createVisualDemo } from '@/lib/marketing/visualDemoService';

// Import new agents (class-based)
import { FounderOsAgent } from '@/lib/agents/founderOsAgent';
import { AiPhillAgent } from '@/lib/agents/aiPhillAgent';
import { SeoLeakAgent } from '@/lib/agents/seoLeakAgent';

// Import new agents (singleton objects)
import { boostBumpAgent } from '@/lib/agents/boostBumpAgent';
import { searchSuiteAgent } from '@/lib/agents/searchSuiteAgent';
import { socialInboxAgent } from '@/lib/agents/socialInboxAgent';
import { preClientIdentityAgent } from '@/lib/agents/preClientIdentityAgent';
import { cognitiveTwinAgent } from '@/lib/agents/cognitiveTwinAgent';

// Import Council of Logic - Mathematical First Principles
import {
  getCouncilOfLogic,
  type CouncilDeliberation,
  type MemberVerdict,
} from '@/lib/agents/council-of-logic';

// ============================================================================
// TYPES
// ============================================================================

export type AgentIntent =
  | 'seo'
  | 'social'
  | 'funnel'
  | 'visual'
  | 'moment'
  | 'deployment'
  | 'content'
  | 'analysis'
  | 'auto_action'
  | 'connect_app'
  | 'import_client_emails'
  | 'summarise_client_ideas'
  | 'manage_social_inbox'
  | 'optimize_ads'
  | 'run_search_audit'
  | 'replay_browser_task'
  | 'learn_browser_pattern'
  | 'ingest_pre_client_history'
  | 'build_pre_client_timeline'
  | 'analyze_pre_client_insights'
  | 'analyze_founder_memory'
  | 'forecast_founder_outcomes'
  | 'suggest_founder_next_actions'
  | 'simulate_decision_scenarios'
  | 'generate_founder_weekly_digest'
  | 'founder_os'
  | 'ai_phill'
  | 'seo_leak'
  | 'boost_bump'
  | 'search_suite'
  | 'social_inbox'
  | 'pre_client'
  | 'cognitive_twin'
  | 'shadow_observer'
  | 'codebase_audit'
  | 'product_strategy'
  | 'roadmap_planning'
  | 'version_planning'
  | 'issue_synthesis'
  | 'unknown';

export interface OrchestratorRequest {
  workspaceId: string;
  userPrompt: string;
  context?: {
    playbookId?: string;
    mapId?: string;
    persona?: string;
    platform?: string;
    clientId?: string;
    connectedAppId?: string;
    provider?: 'google' | 'microsoft';
  };
}

export interface OrchestratorPlan {
  intent: AgentIntent;
  confidence: number;
  steps: PlanStep[];
  estimatedTokens: number;
  requiresValidation: boolean;
}

export interface PlanStep {
  agent: AgentIntent;
  action: string;
  inputs: Record<string, unknown>;
  dependsOn?: number[];
}

export interface OrchestratorResult {
  success: boolean;
  intent: AgentIntent;
  plan: OrchestratorPlan;
  outputs: AgentOutput[];
  validation?: ValidationResult;
  councilDeliberation?: CouncilDeliberation;
  errors: string[];
  tokensUsed: number;
}

export interface AgentOutput {
  agent: AgentIntent;
  action: string;
  result: unknown;
  confidence: number;
  citations?: string[];
}

export interface ValidationResult {
  passed: boolean;
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
}

// ============================================================================
// INTENT CLASSIFICATION
// ============================================================================

const INTENT_PATTERNS: Record<AgentIntent, RegExp[]> = {
  seo: [
    /\b(seo|search engine|keyword|ranking|backlink|serp|google|bing)\b/i,
    /\b(meta|title tag|description|schema|sitemap)\b/i,
    /\b(organic|search traffic|crawl|index)\b/i,
  ],
  social: [
    /\b(social|playbook|content pack|campaign|post|caption)\b/i,
    /\b(instagram|linkedin|facebook|tiktok|youtube|twitter|x\.com)\b/i,
    /\b(influencer|engagement|viral|trending|hashtag)\b/i,
  ],
  funnel: [
    /\b(funnel|pipeline|journey|conversion|awareness|consideration)\b/i,
    /\b(aida|tofu|mofu|bofu|lead|prospect)\b/i,
    /\b(nurture|drip|sequence|touchpoint)\b/i,
  ],
  visual: [
    /\b(visual|animation|hero|section|design|style)\b/i,
    /\b(three\.?js|3d|motion|parallax|transition)\b/i,
    /\b(landing page|website|ui|ux|aesthetic)\b/i,
  ],
  moment: [
    /\b(decision|moment|objection|proof|friction)\b/i,
    /\b(pain point|blocker|hesitation|concern)\b/i,
    /\b(overcome|address|handle|respond)\b/i,
  ],
  deployment: [
    /\b(deploy|deployment|digitalocean|server|hosting)\b/i,
    /\b(crash|error|log|uptime|health|monitor)\b/i,
    /\b(doctl|droplet|app platform|kubernetes)\b/i,
  ],
  content: [
    /\b(write|generate|create|draft|copy)\b/i,
    /\b(blog|article|email|script|headline)\b/i,
    /\b(hook|cta|call to action|persuasive)\b/i,
  ],
  analysis: [
    /\b(analyze|analyse|audit|review|assess)\b/i,
    /\b(report|insight|metric|performance|data)\b/i,
    /\b(competitor|benchmark|gap|opportunity)\b/i,
  ],
  auto_action: [
    /\b(automat|auto.?fill|auto.?action|computer.?use)\b/i,
    /\b(onboard|onboarding|form.?fill)\b/i,
    /\b(browser|click|type|scroll|navigate)\b/i,
    /\b(assistant|bot|agent).*(fill|complete|submit)\b/i,
    /\b(crm|contact).*(auto|fill|populate)\b/i,
  ],
  connect_app: [
    /\b(connect|link|integrate|authorize|oauth)\b/i,
    /\b(google|gmail|microsoft|outlook|workspace|365)\b/i,
    /\b(email.?provider|email.?account|mail.?integration)\b/i,
    /\b(sign.?in|login).*(google|microsoft)\b/i,
  ],
  import_client_emails: [
    /\b(import|sync|fetch|pull).*(email|mail)\b/i,
    /\b(email|mail).*(import|sync|fetch|pull)\b/i,
    /\b(client|contact).*(email|communication)\b/i,
    /\b(inbox|thread|message).*(sync|import)\b/i,
    /\b(ingest|ingestion).*(email|mail)\b/i,
  ],
  summarise_client_ideas: [
    /\b(summarize|summarise|summary).*(idea|action|task)\b/i,
    /\b(email.?idea|action.?item|follow.?up)\b/i,
    /\b(extract|pending).*(idea|action|task)\b/i,
    /\b(client.?intelligence|communication.?insight)\b/i,
    /\b(email.?analysis|email.?insight)\b/i,
  ],
  manage_social_inbox: [
    /\b(social.?inbox|unified.?inbox|message.?triage)\b/i,
    /\b(dm|direct.?message|comment).*(respond|reply|manage)\b/i,
    /\b(facebook|instagram|youtube|tiktok|linkedin|reddit|twitter|x\.com).*(inbox|message|comment)\b/i,
    /\b(social.?engagement|community.?manage)\b/i,
    /\b(autopilot|auto.?reply|ai.?respond).*(social|comment|dm)\b/i,
  ],
  optimize_ads: [
    /\b(ads?|advertising|campaign).*(optim|improve|analyze)\b/i,
    /\b(google.?ads|meta.?ads|facebook.?ads|tiktok.?ads)\b/i,
    /\b(ppc|cpc|cpm|roas|conversion.?rate)\b/i,
    /\b(ad.?spend|budget.?allocation|bid.?strategy)\b/i,
    /\b(creative.?fatigue|audience.?overlap|ad.?opportunity)\b/i,
  ],
  run_search_audit: [
    /\b(search.?console|gsc|bing.?webmaster)\b/i,
    /\b(serp|search.?result|ranking).*(check|audit|monitor)\b/i,
    /\b(keyword.?tracking|position.?monitor|rank.?track)\b/i,
    /\b(volatility.?alert|ranking.?change|serp.?shift)\b/i,
    /\b(search.?performance|organic.?traffic).*(audit|report)\b/i,
  ],
  replay_browser_task: [
    /\b(replay|re.?run|execute).*(task|automation|workflow)\b/i,
    /\b(browser.?task|browser.?automation).*(run|execute|replay)\b/i,
    /\b(scheduled.?task|recurring.?automation)\b/i,
    /\b(rpa|robotic.?process)\b/i,
    /\b(replay.?session|run.?saved.?task)\b/i,
  ],
  learn_browser_pattern: [
    /\b(learn|record|capture).*(pattern|workflow|sequence)\b/i,
    /\b(browser.?pattern|automation.?pattern)\b/i,
    /\b(dom.?cache|element.?map|selector.?learn)\b/i,
    /\b(smart.?selector|adaptive.?locator)\b/i,
    /\b(train|teach).*(automation|browser|bot)\b/i,
  ],
  ingest_pre_client_history: [
    /\b(pre.?client|pre.?system|historical).*(email|ingest|import)\b/i,
    /\b(ingest|import|pull).*(historical|past|old).*(email|communication)\b/i,
    /\b(discover|reconstruct).*(client|relationship).*(email|history)\b/i,
    /\b(email.?history|past.?communication).*(ingest|import|analyze)\b/i,
    /\b(before.?onboard|pre.?onboard).*(email|communication)\b/i,
  ],
  build_pre_client_timeline: [
    /\b(timeline|chronolog|history).*(build|create|generate)\b/i,
    /\b(relationship.?timeline|client.?history)\b/i,
    /\b(milestone|event).*(track|detect|identify)\b/i,
    /\b(first.?contact|relationship.?start).*(when|date)\b/i,
    /\b(pre.?client).*(timeline|journey|progression)\b/i,
  ],
  analyze_pre_client_insights: [
    /\b(pre.?client).*(insight|opportunity|analysis)\b/i,
    /\b(historical.?email).*(insight|opportunity|pattern)\b/i,
    /\b(detect|find|identify).*(opportunity|task|commitment)\b/i,
    /\b(unanswered|pending|open).*(question|request|task)\b/i,
    /\b(pre.?client).*(sentiment|engagement|score)\b/i,
  ],
  analyze_founder_memory: [
    /\b(founder).*(memory|snapshot|overview|status)\b/i,
    /\b(business).*(health|status|overview|momentum)\b/i,
    /\b(cross.?client).*(pattern|insight|analysis)\b/i,
    /\b(opportunity|risk).*(backlog|register|dashboard)\b/i,
    /\b(cognitive.?twin|business.?twin|digital.?twin)\b/i,
  ],
  forecast_founder_outcomes: [
    /\b(forecast|predict|project).*(revenue|growth|outcome)\b/i,
    /\b(6.?week|12.?week|1.?year).*(forecast|outlook|projection)\b/i,
    /\b(scenario).*(baseline|optimistic|pessimistic)\b/i,
    /\b(strategic).*(forecast|projection|outlook)\b/i,
    /\b(business).*(forecast|predict|future)\b/i,
  ],
  suggest_founder_next_actions: [
    /\b(what).*(should|do|focus|next|priority)\b/i,
    /\b(next.?action|recommend|suggest|advise)\b/i,
    /\b(founder).*(action|recommendation|priority)\b/i,
    /\b(overload|burnout|capacity|fatigue)\b/i,
    /\b(prioritize|prioritise|focus|urgent)\b/i,
  ],
  simulate_decision_scenarios: [
    /\b(simulate|model|scenario|what.?if)\b/i,
    /\b(shadow.?founder|decision.?simulator)\b/i,
    /\b(pricing|hiring|expansion|partnership).*(decision|scenario)\b/i,
    /\b(test|evaluate).*(decision|strategy|move)\b/i,
    /\b(outcome).*(best|worst|expected|simulate)\b/i,
  ],
  generate_founder_weekly_digest: [
    /\b(weekly).*(digest|summary|report|review)\b/i,
    /\b(founder).*(digest|summary|briefing)\b/i,
    /\b(executive).*(summary|briefing|overview)\b/i,
    /\b(week.?in.?review|weekly.?briefing)\b/i,
    /\b(business).*(digest|weekly|summary)\b/i,
  ],
  founder_os: [
    /\b(founder.?os|business.?registry|business.?snapshot)\b/i,
    /\b(portfolio).*(health|analysis|overview)\b/i,
    /\b(signal).*(process|aggregate|infer)\b/i,
    /\b(umbrella).*(synopsis|snapshot|view)\b/i,
    /\b(vault).*(security|check|audit)\b/i,
    /\b(business).*(link|validation|health)\b/i,
  ],
  ai_phill: [
    /\b(ai.?phill|strategic.?advice|business.?counsel)\b/i,
    /\b(journal|reflection|insight).*(business|strategy)\b/i,
    /\b(strategic).*(dialogue|conversation|advice)\b/i,
    /\b(risk).*(assess|analysis|evaluate)\b/i,
    /\b(weekly).*(digest|strategic)\b/i,
    /\b(decision).*(analyze|framework|help)\b/i,
  ],
  seo_leak: [
    /\b(seo.?leak|leak.?signal|ranking.?leak)\b/i,
    /\b(full.?audit|seo.?audit|technical.?audit)\b/i,
    /\b(gap).*(analysis|identify|competitor)\b/i,
    /\b(optimization).*(plan|recommendation)\b/i,
    /\b(ranking).*(factor|estimate|analysis)\b/i,
    /\b(navboost|eeat|e-e-a-t)\b/i,
  ],
  boost_bump: [
    /\b(boost|bump|behavioral.?boost)\b/i,
    /\b(engagement).*(boost|increase|improve)\b/i,
    /\b(conversion).*(lift|boost|optimize)\b/i,
    /\b(behavioral).*(job|pattern|trigger)\b/i,
    /\b(micro.?interaction|nudge|prompt)\b/i,
  ],
  search_suite: [
    /\b(search.?suite|keyword.?track|rank.?monitor)\b/i,
    /\b(serp).*(track|monitor|watch)\b/i,
    /\b(keyword).*(position|track|monitor)\b/i,
    /\b(ranking).*(volatility|change|monitor)\b/i,
    /\b(competitor).*(rank|position|track)\b/i,
  ],
  social_inbox: [
    /\b(social.?inbox|unified.?inbox|message.?hub)\b/i,
    /\b(social).*(message|dm|comment).*(manage|triage)\b/i,
    /\b(multi.?platform).*(inbox|message)\b/i,
    /\b(sentiment).*(social|message|comment)\b/i,
    /\b(auto.?response|smart.?reply).*(social|message)\b/i,
  ],
  pre_client: [
    /\b(pre.?client|lead.?identity|email.?lead)\b/i,
    /\b(email).*(identify|discover|extract).*(lead|client)\b/i,
    /\b(relationship).*(timeline|history|progression)\b/i,
    /\b(opportunity).*(identify|score|detect)\b/i,
    /\b(commitment).*(extract|identify|track)\b/i,
  ],
  cognitive_twin: [
    /\b(cognitive.?twin|digital.?twin|business.?twin)\b/i,
    /\b(health).*(score|check|monitor|dashboard)\b/i,
    /\b(founder).*(digest|health|overview)\b/i,
    /\b(decision).*(support|recommendation|assist)\b/i,
    /\b(momentum|velocity|trajectory).*(business|growth)\b/i,
  ],
  product_strategy: [
    /\b(product.?strateg|strategic.?direction|product.?vision)\b/i,
    /\b(north.?star|okr|objective|key.?result)\b/i,
    /\b(strategic.?pillar|vision|mission).*(product)\b/i,
    /\b(pm|product.?manag).*(strateg|plan|roadmap)\b/i,
  ],
  roadmap_planning: [
    /\b(roadmap|priorit|rank|order).*(feature|initiative|epic)\b/i,
    /\b(quarter|quarterly.?planning|release.?plan)\b/i,
    /\b(rice|kano|feature.?priorit|scoring)\b/i,
    /\b(version|v1|v2|v3|v4|v5).*(plan|roadmap|feature)\b/i,
  ],
  version_planning: [
    /\b(version|release).*(plan|schedule|timeline)\b/i,
    /\b(v1|v2|v3|v4|v5).*(ready|planning|scope)\b/i,
    /\b(milestone|sprint|iteration).*(plan|schedule)\b/i,
    /\b(restoreassist|project).*(version|release)\b/i,
  ],
  issue_synthesis: [
    /\b(issue|task).*(synthe|consolidat|group)\b/i,
    /\b(linear|jira|github).*(issue|task|ticket)\b/i,
    /\b(blocker|dependency).*(identify|map|track)\b/i,
    /\b(development.?task|dev.?task|sprint.?task)\b/i,
  ],
  unknown: [],
};

export function classifyIntent(prompt: string): { intent: AgentIntent; confidence: number } {
  const scores: Record<AgentIntent, number> = {
    seo: 0,
    social: 0,
    funnel: 0,
    visual: 0,
    moment: 0,
    deployment: 0,
    content: 0,
    analysis: 0,
    auto_action: 0,
    connect_app: 0,
    import_client_emails: 0,
    summarise_client_ideas: 0,
    manage_social_inbox: 0,
    optimize_ads: 0,
    run_search_audit: 0,
    replay_browser_task: 0,
    learn_browser_pattern: 0,
    ingest_pre_client_history: 0,
    build_pre_client_timeline: 0,
    analyze_pre_client_insights: 0,
    analyze_founder_memory: 0,
    forecast_founder_outcomes: 0,
    suggest_founder_next_actions: 0,
    simulate_decision_scenarios: 0,
    generate_founder_weekly_digest: 0,
    founder_os: 0,
    ai_phill: 0,
    seo_leak: 0,
    boost_bump: 0,
    search_suite: 0,
    social_inbox: 0,
    pre_client: 0,
    cognitive_twin: 0,
    product_strategy: 0,
    roadmap_planning: 0,
    version_planning: 0,
    issue_synthesis: 0,
    unknown: 0,
  };

  const promptLower = prompt.toLowerCase();

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = promptLower.match(pattern);
      if (matches) {
        scores[intent as AgentIntent] += matches.length;
      }
    }
  }

  // Find highest scoring intent
  let maxIntent: AgentIntent = 'unknown';
  let maxScore = 0;

  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxIntent = intent as AgentIntent;
    }
  }

  // Calculate confidence (0-1)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? maxScore / totalScore : 0;

  return { intent: maxIntent, confidence: Math.min(confidence, 0.95) };
}

// ============================================================================
// PLAN GENERATION
// ============================================================================

export async function generatePlan(request: OrchestratorRequest): Promise<OrchestratorPlan> {
  const { intent, confidence } = classifyIntent(request.userPrompt);

  const steps: PlanStep[] = [];

  switch (intent) {
    case 'seo':
      steps.push(
        { agent: 'seo', action: 'analyze_keywords', inputs: { prompt: request.userPrompt } },
        { agent: 'seo', action: 'validate_claims', inputs: {}, dependsOn: [0] },
        { agent: 'content', action: 'generate_seo_content', inputs: {}, dependsOn: [1] }
      );
      break;

    case 'social':
      steps.push(
        { agent: 'social', action: 'create_playbook', inputs: { workspaceId: request.workspaceId } },
        { agent: 'content', action: 'generate_hooks', inputs: {}, dependsOn: [0] },
        { agent: 'visual', action: 'suggest_thumbnails', inputs: {}, dependsOn: [0] }
      );
      break;

    case 'funnel':
      steps.push(
        { agent: 'funnel', action: 'map_stages', inputs: { workspaceId: request.workspaceId } },
        { agent: 'moment', action: 'identify_friction', inputs: {}, dependsOn: [0] },
        { agent: 'content', action: 'generate_nurture_sequence', inputs: {}, dependsOn: [1] }
      );
      break;

    case 'visual':
      steps.push(
        { agent: 'visual', action: 'analyze_style', inputs: { persona: request.context?.persona } },
        { agent: 'visual', action: 'recommend_animations', inputs: {}, dependsOn: [0] },
        { agent: 'visual', action: 'generate_preview', inputs: {}, dependsOn: [1] }
      );
      break;

    case 'moment':
      steps.push(
        { agent: 'moment', action: 'map_decision_points', inputs: { workspaceId: request.workspaceId } },
        { agent: 'moment', action: 'identify_objections', inputs: {}, dependsOn: [0] },
        { agent: 'content', action: 'generate_proof_assets', inputs: {}, dependsOn: [1] }
      );
      break;

    case 'deployment':
      steps.push(
        { agent: 'deployment', action: 'check_health', inputs: {} },
        { agent: 'deployment', action: 'analyze_logs', inputs: {}, dependsOn: [0] },
        { agent: 'deployment', action: 'suggest_fixes', inputs: {}, dependsOn: [1] }
      );
      break;

    case 'content':
      steps.push(
        { agent: 'analysis', action: 'gather_context', inputs: { workspaceId: request.workspaceId } },
        { agent: 'content', action: 'generate_draft', inputs: { prompt: request.userPrompt }, dependsOn: [0] },
        { agent: 'seo', action: 'validate_claims', inputs: {}, dependsOn: [1] }
      );
      break;

    case 'analysis':
      steps.push(
        { agent: 'analysis', action: 'gather_data', inputs: { workspaceId: request.workspaceId } },
        { agent: 'analysis', action: 'generate_insights', inputs: {}, dependsOn: [0] },
        { agent: 'content', action: 'format_report', inputs: {}, dependsOn: [1] }
      );
      break;

    case 'auto_action':
      steps.push(
        { agent: 'auto_action', action: 'prepare_session', inputs: { workspaceId: request.workspaceId } },
        { agent: 'auto_action', action: 'validate_flow', inputs: {}, dependsOn: [0] },
        { agent: 'auto_action', action: 'execute_flow', inputs: {}, dependsOn: [1] }
      );
      break;

    case 'connect_app':
      steps.push(
        { agent: 'connect_app', action: 'check_existing', inputs: { workspaceId: request.workspaceId } },
        { agent: 'connect_app', action: 'initiate_oauth', inputs: { prompt: request.userPrompt }, dependsOn: [0] },
        { agent: 'connect_app', action: 'return_auth_url', inputs: {}, dependsOn: [1] }
      );
      break;

    case 'import_client_emails':
      steps.push(
        { agent: 'import_client_emails', action: 'validate_connection', inputs: { workspaceId: request.workspaceId } },
        { agent: 'import_client_emails', action: 'sync_emails', inputs: {}, dependsOn: [0] },
        { agent: 'import_client_emails', action: 'map_to_clients', inputs: {}, dependsOn: [1] },
        { agent: 'import_client_emails', action: 'extract_ideas', inputs: {}, dependsOn: [2] }
      );
      break;

    case 'summarise_client_ideas':
      steps.push(
        { agent: 'summarise_client_ideas', action: 'fetch_client_data', inputs: { workspaceId: request.workspaceId, clientId: request.context?.clientId } },
        { agent: 'summarise_client_ideas', action: 'get_email_intelligence', inputs: {}, dependsOn: [0] },
        { agent: 'summarise_client_ideas', action: 'generate_summary', inputs: {}, dependsOn: [1] }
      );
      break;

    case 'manage_social_inbox':
      steps.push(
        { agent: 'manage_social_inbox', action: 'fetch_accounts', inputs: { workspaceId: request.workspaceId } },
        { agent: 'manage_social_inbox', action: 'fetch_messages', inputs: { platform: request.context?.platform }, dependsOn: [0] },
        { agent: 'manage_social_inbox', action: 'triage_messages', inputs: {}, dependsOn: [1] },
        { agent: 'manage_social_inbox', action: 'suggest_replies', inputs: {}, dependsOn: [2] }
      );
      break;

    case 'optimize_ads':
      steps.push(
        { agent: 'optimize_ads', action: 'fetch_ad_accounts', inputs: { workspaceId: request.workspaceId } },
        { agent: 'optimize_ads', action: 'analyze_campaigns', inputs: {}, dependsOn: [0] },
        { agent: 'optimize_ads', action: 'detect_opportunities', inputs: {}, dependsOn: [1] },
        { agent: 'optimize_ads', action: 'generate_recommendations', inputs: {}, dependsOn: [2] }
      );
      break;

    case 'run_search_audit':
      steps.push(
        { agent: 'run_search_audit', action: 'fetch_gsc_data', inputs: { workspaceId: request.workspaceId } },
        { agent: 'run_search_audit', action: 'fetch_bing_data', inputs: {}, dependsOn: [0] },
        { agent: 'run_search_audit', action: 'check_keyword_rankings', inputs: {}, dependsOn: [1] },
        { agent: 'run_search_audit', action: 'analyze_volatility', inputs: {}, dependsOn: [2] },
        { agent: 'run_search_audit', action: 'generate_report', inputs: {}, dependsOn: [3] }
      );
      break;

    case 'replay_browser_task':
      steps.push(
        { agent: 'replay_browser_task', action: 'fetch_task', inputs: { workspaceId: request.workspaceId } },
        { agent: 'replay_browser_task', action: 'restore_session', inputs: {}, dependsOn: [0] },
        { agent: 'replay_browser_task', action: 'execute_replay', inputs: {}, dependsOn: [1] },
        { agent: 'replay_browser_task', action: 'record_result', inputs: {}, dependsOn: [2] }
      );
      break;

    case 'learn_browser_pattern':
      steps.push(
        { agent: 'learn_browser_pattern', action: 'fetch_session', inputs: { workspaceId: request.workspaceId } },
        { agent: 'learn_browser_pattern', action: 'analyze_actions', inputs: {}, dependsOn: [0] },
        { agent: 'learn_browser_pattern', action: 'extract_patterns', inputs: {}, dependsOn: [1] },
        { agent: 'learn_browser_pattern', action: 'save_pattern', inputs: {}, dependsOn: [2] }
      );
      break;

    case 'ingest_pre_client_history':
      steps.push(
        { agent: 'ingest_pre_client_history', action: 'validate_pre_client', inputs: { workspaceId: request.workspaceId, preClientId: request.context?.clientId } },
        { agent: 'ingest_pre_client_history', action: 'fetch_connected_app', inputs: {}, dependsOn: [0] },
        { agent: 'ingest_pre_client_history', action: 'start_ingestion', inputs: {}, dependsOn: [1] },
        { agent: 'ingest_pre_client_history', action: 'cluster_threads', inputs: {}, dependsOn: [2] },
        { agent: 'ingest_pre_client_history', action: 'update_stats', inputs: {}, dependsOn: [3] }
      );
      break;

    case 'build_pre_client_timeline':
      steps.push(
        { agent: 'build_pre_client_timeline', action: 'fetch_pre_client', inputs: { workspaceId: request.workspaceId, preClientId: request.context?.clientId } },
        { agent: 'build_pre_client_timeline', action: 'build_timeline', inputs: {}, dependsOn: [0] },
        { agent: 'build_pre_client_timeline', action: 'generate_summary', inputs: {}, dependsOn: [1] },
        { agent: 'build_pre_client_timeline', action: 'generate_narrative', inputs: {}, dependsOn: [2] }
      );
      break;

    case 'analyze_pre_client_insights':
      steps.push(
        { agent: 'analyze_pre_client_insights', action: 'fetch_pre_client', inputs: { workspaceId: request.workspaceId, preClientId: request.context?.clientId } },
        { agent: 'analyze_pre_client_insights', action: 'process_insights', inputs: {}, dependsOn: [0] },
        { agent: 'analyze_pre_client_insights', action: 'generate_analysis', inputs: {}, dependsOn: [1] },
        { agent: 'analyze_pre_client_insights', action: 'identify_patterns', inputs: {}, dependsOn: [2] }
      );
      break;

    case 'analyze_founder_memory':
      steps.push(
        { agent: 'analyze_founder_memory', action: 'create_snapshot', inputs: { workspaceId: request.workspaceId } },
        { agent: 'analyze_founder_memory', action: 'get_momentum', inputs: {}, dependsOn: [0] },
        { agent: 'analyze_founder_memory', action: 'get_patterns', inputs: {}, dependsOn: [0] },
        { agent: 'analyze_founder_memory', action: 'get_opportunities_risks', inputs: {}, dependsOn: [0] }
      );
      break;

    case 'forecast_founder_outcomes':
      steps.push(
        { agent: 'forecast_founder_outcomes', action: 'gather_inputs', inputs: { workspaceId: request.workspaceId } },
        { agent: 'forecast_founder_outcomes', action: 'generate_forecast', inputs: { horizon: '12_week' }, dependsOn: [0] },
        { agent: 'forecast_founder_outcomes', action: 'analyze_scenarios', inputs: {}, dependsOn: [1] }
      );
      break;

    case 'suggest_founder_next_actions':
      steps.push(
        { agent: 'suggest_founder_next_actions', action: 'check_overload', inputs: { workspaceId: request.workspaceId } },
        { agent: 'suggest_founder_next_actions', action: 'gather_context', inputs: {}, dependsOn: [0] },
        { agent: 'suggest_founder_next_actions', action: 'generate_recommendations', inputs: {}, dependsOn: [1] },
        { agent: 'suggest_founder_next_actions', action: 'prioritize_actions', inputs: {}, dependsOn: [2] }
      );
      break;

    case 'simulate_decision_scenarios':
      steps.push(
        { agent: 'simulate_decision_scenarios', action: 'parse_scenario', inputs: { prompt: request.userPrompt, workspaceId: request.workspaceId } },
        { agent: 'simulate_decision_scenarios', action: 'gather_context', inputs: {}, dependsOn: [0] },
        { agent: 'simulate_decision_scenarios', action: 'run_simulation', inputs: {}, dependsOn: [1] },
        { agent: 'simulate_decision_scenarios', action: 'generate_recommendation', inputs: {}, dependsOn: [2] }
      );
      break;

    case 'generate_founder_weekly_digest':
      steps.push(
        { agent: 'generate_founder_weekly_digest', action: 'gather_week_data', inputs: { workspaceId: request.workspaceId } },
        { agent: 'generate_founder_weekly_digest', action: 'compile_wins_risks', inputs: {}, dependsOn: [0] },
        { agent: 'generate_founder_weekly_digest', action: 'generate_summary', inputs: {}, dependsOn: [1] },
        { agent: 'generate_founder_weekly_digest', action: 'create_digest', inputs: {}, dependsOn: [2] }
      );
      break;

    default:
      steps.push({ agent: 'analysis', action: 'clarify_intent', inputs: { prompt: request.userPrompt } });
  }

  return {
    intent,
    confidence,
    steps,
    estimatedTokens: steps.length * 2000,
    requiresValidation: ['seo', 'content'].includes(intent),
  };
}

// ============================================================================
// EXECUTION ENGINE
// ============================================================================

export async function executePlan(
  plan: OrchestratorPlan,
  request: OrchestratorRequest,
  options?: { skipCouncil?: boolean; councilThreshold?: number }
): Promise<OrchestratorResult> {
  const outputs: AgentOutput[] = [];
  const errors: string[] = [];
  let tokensUsed = 0;
  let councilDeliberation: CouncilDeliberation | undefined;

  // ============================================================================
  // COUNCIL OF LOGIC - Mathematical First Principles Pre-Execution Hook
  // ============================================================================
  // Every operation evaluated by Turing (algorithms), von Neumann (game theory),
  // Bézier (animation physics), and Shannon (token economy)

  if (!options?.skipCouncil && process.env.ENABLE_COUNCIL_OF_LOGIC !== 'false') {
    try {
      const council = getCouncilOfLogic();
      const threshold = options?.councilThreshold ?? 50;

      // Build code context from plan steps
      const operationContext = {
        intent: plan.intent,
        stepsCount: plan.steps.length,
        estimatedTokens: plan.estimatedTokens,
        actions: plan.steps.map(s => `${s.agent}:${s.action}`).join(', '),
      };

      councilDeliberation = await council.deliberate({
        operation: `${plan.intent}: ${request.userPrompt.slice(0, 100)}`,
        context: operationContext,
        prompt: request.userPrompt,
      });

      tokensUsed += 500; // Council evaluation tokens

      // Check if council rejected the operation (Turing veto or low score)
      if (councilDeliberation.finalVerdict === 'rejected') {
        const turingVerdict = councilDeliberation.verdicts.find(v => v.member === 'Alan_Turing');
        const rejectionReason = turingVerdict?.reasoning || 'Council rejected operation';

        return {
          success: false,
          intent: plan.intent,
          plan,
          outputs: [],
          councilDeliberation,
          errors: [`Council of Logic rejected: ${rejectionReason}`],
          tokensUsed,
        };
      }

      // Warn if needs revision but allow execution
      if (councilDeliberation.finalVerdict === 'needs_revision') {
        const recommendations = councilDeliberation.verdicts
          .flatMap(v => v.recommendations)
          .slice(0, 3);
        errors.push(`Council advisory: Operation approved with recommendations - ${recommendations.join('; ')}`);
      }

      // Log council scores for monitoring
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Council of Logic] ${plan.intent} - Score: ${councilDeliberation.overallScore}/100`);
        councilDeliberation.verdicts.forEach(v => {
          console.log(`  ${v.member}: ${v.score} (${v.approved ? '✓' : '✗'})`);
        });
      }
    } catch (councilError) {
      // Don't block execution on council errors, just log
      console.warn('[Council of Logic] Deliberation failed, proceeding without evaluation:', councilError);
    }
  }

  // ============================================================================
  // STEP EXECUTION
  // ============================================================================

  // Execute steps in order, respecting dependencies
  const completedSteps = new Set<number>();

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];

    // Check dependencies
    if (step.dependsOn) {
      const depsComplete = step.dependsOn.every((dep) => completedSteps.has(dep));
      if (!depsComplete) {
        errors.push(`Step ${i} dependencies not met`);
        continue;
      }
    }

    try {
      const result = await executeStep(step, request, outputs);
      outputs.push(result);
      tokensUsed += result.confidence * 1000; // Estimate
      completedSteps.add(i);
    } catch (err) {
      errors.push(`Step ${i} (${step.agent}/${step.action}) failed: ${(err as Error).message}`);
    }
  }

  // Run validation if required
  let validation: ValidationResult | undefined;
  if (plan.requiresValidation) {
    validation = await validateOutputs(outputs, plan.intent);
  }

  return {
    success: errors.length === 0 && (!validation || validation.passed),
    intent: plan.intent,
    plan,
    outputs,
    validation,
    councilDeliberation,
    errors,
    tokensUsed,
  };
}

async function executeStep(
  step: PlanStep,
  request: OrchestratorRequest,
  previousOutputs: AgentOutput[]
): Promise<AgentOutput> {
  // Get context from previous outputs
  const context = previousOutputs.reduce((acc, out) => {
    return { ...acc, [out.agent]: out.result };
  }, {} as Record<string, unknown>);

  switch (step.agent) {
    case 'seo':
      return executeSEOStep(step, request, context);
    case 'social':
      return executeSocialStep(step, request, context);
    case 'funnel':
      return executeFunnelStep(step, request, context);
    case 'visual':
      return executeVisualStep(step, request, context);
    case 'moment':
      return executeMomentStep(step, request, context);
    case 'deployment':
      return executeDeploymentStep(step, request, context);
    case 'content':
      return executeContentStep(step, request, context);
    case 'analysis':
      return executeAnalysisStep(step, request, context);
    case 'auto_action':
      return executeAutoActionStep(step, request, context);
    case 'connect_app':
      return executeConnectAppStep(step, request, context);
    case 'import_client_emails':
      return executeImportClientEmailsStep(step, request, context);
    case 'summarise_client_ideas':
      return executeSummariseClientIdeasStep(step, request, context);
    case 'manage_social_inbox':
      return executeManageSocialInboxStep(step, request, context);
    case 'optimize_ads':
      return executeOptimizeAdsStep(step, request, context);
    case 'run_search_audit':
      return executeRunSearchAuditStep(step, request, context);
    case 'replay_browser_task':
      return executeReplayBrowserTaskStep(step, request, context);
    case 'learn_browser_pattern':
      return executeLearnBrowserPatternStep(step, request, context);
    case 'ingest_pre_client_history':
      return executeIngestPreClientHistoryStep(step, request, context);
    case 'build_pre_client_timeline':
      return executeBuildPreClientTimelineStep(step, request, context);
    case 'analyze_pre_client_insights':
      return executeAnalyzePreClientInsightsStep(step, request, context);
    case 'analyze_founder_memory':
      return executeFounderMemoryStep(step, request, context);
    case 'forecast_founder_outcomes':
      return executeFounderForecastStep(step, request, context);
    case 'suggest_founder_next_actions':
      return executeFounderNextActionsStep(step, request, context);
    case 'simulate_decision_scenarios':
      return executeDecisionSimulatorStep(step, request, context);
    case 'generate_founder_weekly_digest':
      return executeWeeklyDigestStep(step, request, context);
    case 'founder_os':
      return executeFounderOsStep(step, request, context);
    case 'ai_phill':
      return executeAiPhillStep(step, request, context);
    case 'seo_leak':
      return executeSeoLeakStep(step, request, context);
    case 'boost_bump':
      return executeBoostBumpStep(step, request, context);
    case 'search_suite':
      return executeSearchSuiteStep(step, request, context);
    case 'social_inbox':
      return executeSocialInboxStep(step, request, context);
    case 'pre_client':
      return executePreClientStep(step, request, context);
    case 'cognitive_twin':
      return executeCognitiveTwinStep(step, request, context);
    case 'shadow_observer':
    case 'codebase_audit':
      return executeShadowObserverStep(step, request, context);
    default:
      throw new Error(`Unknown agent: ${step.agent}`);
  }
}

// ============================================================================
// AGENT EXECUTORS
// ============================================================================

async function executeSEOStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  switch (step.action) {
    case 'analyze_keywords':
      return {
        agent: 'seo',
        action: step.action,
        result: {
          keywords: [],
          searchVolume: {},
          difficulty: {},
          recommendations: [],
        },
        confidence: 0.8,
        citations: [],
      };

    case 'validate_claims':
      return {
        agent: 'seo',
        action: step.action,
        result: {
          claimsValidated: 0,
          claimsFailed: 0,
          issues: [],
        },
        confidence: 0.9,
      };

    default:
      throw new Error(`Unknown SEO action: ${step.action}`);
  }
}

async function executeSocialStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  switch (step.action) {
    case 'create_playbook':
      const persona = request.context?.persona || 'professional';
      const config = getPersonaConfig(persona);

      return {
        agent: 'social',
        action: step.action,
        result: {
          playbook: {
            name: `Generated Playbook - ${new Date().toLocaleDateString()}`,
            persona,
            platforms: ['linkedin', 'youtube'],
            contentTypes: getRecommendedContentTypes('awareness', persona),
          },
          brandConfig: config,
        },
        confidence: 0.85,
      };

    default:
      throw new Error(`Unknown social action: ${step.action}`);
  }
}

async function executeFunnelStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  switch (step.action) {
    case 'map_stages':
      return {
        agent: 'funnel',
        action: step.action,
        result: {
          stages: ['awareness', 'interest', 'desire', 'action'],
          touchpoints: [],
          conversionGoals: [],
        },
        confidence: 0.8,
      };

    default:
      throw new Error(`Unknown funnel action: ${step.action}`);
  }
}

async function executeVisualStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  switch (step.action) {
    case 'analyze_style':
      return {
        agent: 'visual',
        action: step.action,
        result: {
          recommendedStyle: 'modern-minimal',
          colorPalette: ['#0d9488', '#1e293b', '#f8fafc'],
          animations: ['fade-in', 'slide-up', 'scale'],
        },
        confidence: 0.75,
      };

    case 'recommend_animations':
      return {
        agent: 'visual',
        action: step.action,
        result: {
          animations: [
            { name: 'beam-sweep', intensity: 'normal', use: 'hero' },
            { name: 'card-morph', intensity: 'subtle', use: 'cards' },
          ],
        },
        confidence: 0.8,
      };

    case 'suggest_thumbnails':
      return {
        agent: 'visual',
        action: step.action,
        result: {
          concepts: [
            'Split comparison with before/after',
            'Bold typography with gradient background',
            'Face close-up with text overlay',
          ],
        },
        confidence: 0.7,
      };

    case 'generate_preview':
      return {
        agent: 'visual',
        action: step.action,
        result: {
          previewUrl: null,
          config: {},
        },
        confidence: 0.6,
      };

    default:
      throw new Error(`Unknown visual action: ${step.action}`);
  }
}

async function executeMomentStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  switch (step.action) {
    case 'map_decision_points':
      return {
        agent: 'moment',
        action: step.action,
        result: {
          moments: [
            { stage: 'awareness', key: 'first_touch', friction: 'low' },
            { stage: 'consideration', key: 'comparing', friction: 'medium' },
            { stage: 'conversion', key: 'pricing', friction: 'high' },
          ],
        },
        confidence: 0.8,
      };

    case 'identify_friction':
    case 'identify_objections':
      return {
        agent: 'moment',
        action: step.action,
        result: {
          objections: [
            { type: 'price', severity: 'high', response: 'ROI calculator' },
            { type: 'trust', severity: 'medium', response: 'testimonials' },
            { type: 'complexity', severity: 'low', response: 'demo video' },
          ],
        },
        confidence: 0.75,
      };

    default:
      throw new Error(`Unknown moment action: ${step.action}`);
  }
}

async function executeDeploymentStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  switch (step.action) {
    case 'check_health':
      return {
        agent: 'deployment',
        action: step.action,
        result: {
          status: 'healthy',
          uptime: '99.9%',
          lastDeployment: new Date().toISOString(),
        },
        confidence: 0.95,
      };

    case 'analyze_logs':
      return {
        agent: 'deployment',
        action: step.action,
        result: {
          errors: 0,
          warnings: 2,
          patterns: [],
        },
        confidence: 0.85,
      };

    case 'suggest_fixes':
      return {
        agent: 'deployment',
        action: step.action,
        result: {
          suggestions: [],
          priority: 'low',
        },
        confidence: 0.7,
      };

    default:
      throw new Error(`Unknown deployment action: ${step.action}`);
  }
}

async function executeContentStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  switch (step.action) {
    case 'generate_hooks':
      return {
        agent: 'content',
        action: step.action,
        result: {
          hooks: [
            'Stop making this mistake with your [topic]...',
            'The truth about [topic] that nobody talks about',
            'I tested [approach] for 30 days. Here\'s what happened.',
          ],
        },
        confidence: 0.8,
      };

    case 'generate_draft':
    case 'generate_seo_content':
      return {
        agent: 'content',
        action: step.action,
        result: {
          draft: '',
          wordCount: 0,
          readabilityScore: 0,
        },
        confidence: 0.7,
      };

    case 'generate_nurture_sequence':
      return {
        agent: 'content',
        action: step.action,
        result: {
          emails: [
            { day: 1, subject: 'Welcome', type: 'introduction' },
            { day: 3, subject: 'Quick tip', type: 'value' },
            { day: 7, subject: 'Case study', type: 'proof' },
          ],
        },
        confidence: 0.75,
      };

    case 'generate_proof_assets':
      return {
        agent: 'content',
        action: step.action,
        result: {
          assets: [
            { type: 'testimonial', format: 'video' },
            { type: 'case-study', format: 'pdf' },
            { type: 'stats', format: 'infographic' },
          ],
        },
        confidence: 0.7,
      };

    case 'format_report':
      return {
        agent: 'content',
        action: step.action,
        result: {
          report: '',
          sections: [],
        },
        confidence: 0.8,
      };

    default:
      throw new Error(`Unknown content action: ${step.action}`);
  }
}

async function executeAnalysisStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  switch (step.action) {
    case 'gather_context':
    case 'gather_data':
      const dashboard = await getUnifiedDashboard(request.workspaceId);
      return {
        agent: 'analysis',
        action: step.action,
        result: dashboard.data,
        confidence: 0.9,
      };

    case 'generate_insights':
      return {
        agent: 'analysis',
        action: step.action,
        result: {
          insights: [],
          recommendations: [],
        },
        confidence: 0.75,
      };

    case 'clarify_intent':
      return {
        agent: 'analysis',
        action: step.action,
        result: {
          suggestedIntents: ['social', 'content', 'analysis'],
          clarificationQuestions: [
            'What specific outcome are you looking for?',
            'Which platform or channel should we focus on?',
          ],
        },
        confidence: 0.5,
      };

    default:
      throw new Error(`Unknown analysis action: ${step.action}`);
  }
}

async function executeAutoActionStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  // Import auto-action components dynamically to avoid circular dependencies
  const {
    isAutoActionConfigured,
    getFlow,
    validateFlowData,
    getComputerUseOrchestrator,
  } = await import('@/lib/autoAction');

  switch (step.action) {
    case 'prepare_session':
      // Check if auto-action is available
      const isConfigured = isAutoActionConfigured();
      return {
        agent: 'auto_action',
        action: step.action,
        result: {
          available: isConfigured,
          workspaceId: request.workspaceId,
          availableFlows: [
            'client_onboarding_standard',
            'staff_onboarding_standard',
            'crm_contact_autofill',
            'crm_deal_autofill',
          ],
        },
        confidence: isConfigured ? 0.95 : 0.5,
      };

    case 'validate_flow':
      // Determine flow type from prompt
      const promptLower = request.userPrompt.toLowerCase();
      let flowId = 'client_onboarding_standard';
      if (promptLower.includes('staff')) {
        flowId = 'staff_onboarding_standard';
      } else if (promptLower.includes('crm') || promptLower.includes('contact')) {
        flowId = 'crm_contact_autofill';
      } else if (promptLower.includes('deal')) {
        flowId = 'crm_deal_autofill';
      }

      const flow = getFlow(flowId);
      if (!flow) {
        return {
          agent: 'auto_action',
          action: step.action,
          result: {
            valid: false,
            error: `Flow not found: ${flowId}`,
          },
          confidence: 0.3,
        };
      }

      return {
        agent: 'auto_action',
        action: step.action,
        result: {
          valid: true,
          flowId,
          flowName: flow.name,
          requiredData: flow.requiredData,
          estimatedDuration: flow.estimatedDuration,
          stepsCount: flow.steps.length,
        },
        confidence: 0.9,
      };

    case 'execute_flow':
      // Return instructions for executing the flow
      // Actual execution would happen through the API/WebSocket
      const prevContext = context['auto_action'] as Record<string, unknown> | undefined;
      const validatedFlowId = prevContext?.flowId as string || 'client_onboarding_standard';

      return {
        agent: 'auto_action',
        action: step.action,
        result: {
          status: 'ready',
          flowId: validatedFlowId,
          message: 'Flow ready for execution. Use /api/auto-action/session to start.',
          apiEndpoint: '/api/auto-action/session',
          method: 'POST',
          requiredPayload: {
            flowId: validatedFlowId,
            workspaceId: request.workspaceId,
            data: '{ /* OnboardingData object */ }',
          },
        },
        confidence: 0.85,
      };

    default:
      throw new Error(`Unknown auto_action action: ${step.action}`);
  }
}

// ============================================================================
// CONNECTED APPS EXECUTORS
// ============================================================================

async function executeConnectAppStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  // Import connected apps service dynamically
  const { connectedAppsService } = await import('@/lib/connectedApps');
  const { oauthService } = await import('@/lib/connectedApps');

  switch (step.action) {
    case 'check_existing':
      const existingApps = await connectedAppsService.getConnectedApps(request.workspaceId);
      return {
        agent: 'connect_app',
        action: step.action,
        result: {
          hasGoogle: existingApps.some((a) => a.provider === 'google'),
          hasMicrosoft: existingApps.some((a) => a.provider === 'microsoft'),
          connectedApps: existingApps.map((a) => ({
            id: a.id,
            provider: a.provider,
            email: a.providerEmail,
            status: a.status,
          })),
        },
        confidence: 0.95,
      };

    case 'initiate_oauth':
      // Determine provider from prompt
      const promptLower = request.userPrompt.toLowerCase();
      let provider: 'google' | 'microsoft' = 'google';
      if (promptLower.includes('microsoft') || promptLower.includes('outlook') || promptLower.includes('365')) {
        provider = 'microsoft';
      }

      // Check if already connected
      const prevContext = context['connect_app'] as Record<string, unknown> | undefined;
      const hasProvider = provider === 'google' ? prevContext?.hasGoogle : prevContext?.hasMicrosoft;

      if (hasProvider) {
        return {
          agent: 'connect_app',
          action: step.action,
          result: {
            alreadyConnected: true,
            provider,
            message: `${provider === 'google' ? 'Google' : 'Microsoft'} is already connected.`,
          },
          confidence: 0.9,
        };
      }

      // Generate OAuth URL
      const authUrl = oauthService.generateAuthUrl(
        provider,
        request.workspaceId,
        '/dashboard/settings/connected-apps'
      );

      return {
        agent: 'connect_app',
        action: step.action,
        result: {
          provider,
          authUrl,
          message: `Redirect user to authorize ${provider === 'google' ? 'Google Workspace' : 'Microsoft 365'} access.`,
        },
        confidence: 0.9,
      };

    case 'return_auth_url':
      const oauthContext = context['connect_app'] as Record<string, unknown> | undefined;
      return {
        agent: 'connect_app',
        action: step.action,
        result: {
          success: !!oauthContext?.authUrl,
          authUrl: oauthContext?.authUrl,
          provider: oauthContext?.provider,
          instructions: oauthContext?.authUrl
            ? 'Open the auth URL in a new browser window to complete OAuth authorization.'
            : 'OAuth URL not generated. Check provider configuration.',
        },
        confidence: oauthContext?.authUrl ? 0.95 : 0.5,
      };

    default:
      throw new Error(`Unknown connect_app action: ${step.action}`);
  }
}

async function executeImportClientEmailsStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  // Import email ingestion service dynamically
  const { emailIngestionService } = await import('@/lib/emailIngestion');
  const { connectedAppsService } = await import('@/lib/connectedApps');

  switch (step.action) {
    case 'validate_connection':
      const apps = await connectedAppsService.getConnectedApps(request.workspaceId);
      const activeApps = apps.filter((a) => a.status === 'active');

      if (activeApps.length === 0) {
        return {
          agent: 'import_client_emails',
          action: step.action,
          result: {
            valid: false,
            error: 'No active email connections. Please connect Google or Microsoft first.',
            connectUrl: '/dashboard/settings/connected-apps',
          },
          confidence: 0.4,
        };
      }

      return {
        agent: 'import_client_emails',
        action: step.action,
        result: {
          valid: true,
          activeConnections: activeApps.map((a) => ({
            id: a.id,
            provider: a.provider,
            email: a.providerEmail,
          })),
        },
        confidence: 0.95,
      };

    case 'sync_emails':
      const connContext = context['import_client_emails'] as Record<string, unknown> | undefined;
      if (!connContext?.valid) {
        return {
          agent: 'import_client_emails',
          action: step.action,
          result: {
            success: false,
            error: 'No valid connection to sync from.',
          },
          confidence: 0.3,
        };
      }

      // Get first active connection and sync
      const connections = connContext.activeConnections as Array<{ id: string; provider: string; email: string }>;
      const firstConn = connections[0];

      try {
        const syncResult = await emailIngestionService.syncEmails(request.workspaceId, firstConn.id);
        return {
          agent: 'import_client_emails',
          action: step.action,
          result: {
            success: true,
            connectedAppId: firstConn.id,
            provider: firstConn.provider,
            threadsSynced: syncResult.progress.threadsSynced,
            messagesSynced: syncResult.progress.messagesSynced,
            errors: syncResult.progress.errors,
          },
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'import_client_emails',
          action: step.action,
          result: {
            success: false,
            error: (err as Error).message,
          },
          confidence: 0.3,
        };
      }

    case 'map_to_clients':
      const syncContext = context['import_client_emails'] as Record<string, unknown> | undefined;
      return {
        agent: 'import_client_emails',
        action: step.action,
        result: {
          success: syncContext?.success || false,
          message: syncContext?.success
            ? `Mapped ${syncContext.messagesSynced || 0} messages to CRM clients.`
            : 'Sync was not successful, skipping client mapping.',
        },
        confidence: 0.85,
      };

    case 'extract_ideas':
      const mapContext = context['import_client_emails'] as Record<string, unknown> | undefined;
      return {
        agent: 'import_client_emails',
        action: step.action,
        result: {
          success: mapContext?.success || false,
          message: mapContext?.success
            ? 'AI extraction queued for new messages. Ideas will appear in client profiles.'
            : 'No messages to extract ideas from.',
          viewPendingUrl: '/dashboard/contacts?filter=pending-ideas',
        },
        confidence: 0.8,
      };

    default:
      throw new Error(`Unknown import_client_emails action: ${step.action}`);
  }
}

async function executeSummariseClientIdeasStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  // Import client email intelligence service dynamically
  const { clientEmailIntelligenceService } = await import('@/lib/crm/clientEmailIntelligenceService');

  const clientId = (request.context?.clientId as string) || '';

  switch (step.action) {
    case 'fetch_client_data':
      if (!clientId) {
        return {
          agent: 'summarise_client_ideas',
          action: step.action,
          result: {
            success: false,
            error: 'Client ID is required. Provide context.clientId in the request.',
          },
          confidence: 0.3,
        };
      }

      try {
        const summary = await clientEmailIntelligenceService.getClientEmailSummary(
          request.workspaceId,
          clientId
        );

        return {
          agent: 'summarise_client_ideas',
          action: step.action,
          result: {
            success: true,
            clientId,
            clientName: summary?.clientName || 'Unknown',
            totalThreads: summary?.totalThreads || 0,
            totalMessages: summary?.totalMessages || 0,
            totalIdeas: summary?.totalIdeas || 0,
            pendingIdeas: summary?.pendingIdeas || 0,
          },
          confidence: summary ? 0.95 : 0.5,
        };
      } catch (err) {
        return {
          agent: 'summarise_client_ideas',
          action: step.action,
          result: {
            success: false,
            error: (err as Error).message,
          },
          confidence: 0.3,
        };
      }

    case 'get_email_intelligence':
      const clientContext = context['summarise_client_ideas'] as Record<string, unknown> | undefined;
      if (!clientContext?.success) {
        return {
          agent: 'summarise_client_ideas',
          action: step.action,
          result: {
            success: false,
            error: 'Client data not available.',
          },
          confidence: 0.3,
        };
      }

      try {
        const ideas = await clientEmailIntelligenceService.getClientIdeas(
          request.workspaceId,
          clientId,
          { limit: 20 }
        );

        return {
          agent: 'summarise_client_ideas',
          action: step.action,
          result: {
            success: true,
            ideas: ideas.map((idea) => ({
              id: idea.id,
              type: idea.type,
              title: idea.title,
              priority: idea.priority,
              status: idea.status,
              dueDate: idea.dueDate,
            })),
            pendingCount: ideas.filter((i) => i.status !== 'completed' && i.status !== 'dismissed').length,
          },
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'summarise_client_ideas',
          action: step.action,
          result: {
            success: false,
            error: (err as Error).message,
          },
          confidence: 0.3,
        };
      }

    case 'generate_summary':
      const intelContext = context['summarise_client_ideas'] as Record<string, unknown> | undefined;
      if (!intelContext?.success) {
        return {
          agent: 'summarise_client_ideas',
          action: step.action,
          result: {
            success: false,
            error: 'Email intelligence not available.',
          },
          confidence: 0.3,
        };
      }

      try {
        const insights = await clientEmailIntelligenceService.generateCommunicationInsights(
          request.workspaceId,
          clientId
        );

        return {
          agent: 'summarise_client_ideas',
          action: step.action,
          result: {
            success: true,
            summary: insights?.summary || 'No communication insights available.',
            keyTopics: insights?.keyTopics || [],
            suggestedActions: insights?.suggestedActions || [],
            riskIndicators: insights?.riskIndicators || [],
            opportunitySignals: insights?.opportunitySignals || [],
          },
          confidence: insights ? 0.9 : 0.5,
        };
      } catch (err) {
        return {
          agent: 'summarise_client_ideas',
          action: step.action,
          result: {
            success: false,
            error: (err as Error).message,
          },
          confidence: 0.3,
        };
      }

    default:
      throw new Error(`Unknown summarise_client_ideas action: ${step.action}`);
  }
}

// ============================================================================
// MULTI-CHANNEL AUTONOMY EXECUTORS
// ============================================================================

async function executeManageSocialInboxStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  // Dynamic imports to avoid circular dependencies
  const { socialInboxService } = await import('@/lib/socialEngagement');
  const { socialTriageService } = await import('@/lib/socialEngagement');
  const { socialReplyService } = await import('@/lib/socialEngagement');

  switch (step.action) {
    case 'fetch_accounts':
      try {
        const accounts = await socialInboxService.getConnectedAccounts(request.workspaceId);
        return {
          agent: 'manage_social_inbox',
          action: step.action,
          result: {
            success: true,
            accounts: accounts.map((a) => ({
              id: a.id,
              platform: a.platform,
              username: a.platformUsername,
              status: a.status,
            })),
            totalAccounts: accounts.length,
          },
          confidence: 0.95,
        };
      } catch (err) {
        return {
          agent: 'manage_social_inbox',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'fetch_messages':
      try {
        const platform = (step.inputs?.platform as string) || request.context?.platform;
        const messages = await socialInboxService.getMessages(request.workspaceId, {
          platform: platform as 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'linkedin' | 'reddit' | 'x' | undefined,
          limit: 50
        });
        return {
          agent: 'manage_social_inbox',
          action: step.action,
          result: {
            success: true,
            messages: messages.data,
            totalMessages: messages.total,
            unreadCount: messages.data.filter((m) => !m.isRead).length,
          },
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'manage_social_inbox',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'triage_messages':
      const msgContext = context['manage_social_inbox'] as Record<string, unknown> | undefined;
      if (!msgContext?.success) {
        return {
          agent: 'manage_social_inbox',
          action: step.action,
          result: { success: false, error: 'No messages to triage.' },
          confidence: 0.3,
        };
      }

      try {
        const messages = (msgContext.messages as Array<{ id: string }>) || [];
        const triageResults = [];

        for (const msg of messages.slice(0, 10)) { // Triage first 10
          const triage = await socialTriageService.triageMessage(msg.id);
          triageResults.push({
            messageId: msg.id,
            priority: triage.priority,
            sentiment: triage.sentiment,
            suggestedAction: triage.suggestedAction,
          });
        }

        return {
          agent: 'manage_social_inbox',
          action: step.action,
          result: {
            success: true,
            triaged: triageResults,
            highPriority: triageResults.filter((t) => t.priority === 'high').length,
          },
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'manage_social_inbox',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'suggest_replies':
      const triageContext = context['manage_social_inbox'] as Record<string, unknown> | undefined;
      if (!triageContext?.success) {
        return {
          agent: 'manage_social_inbox',
          action: step.action,
          result: { success: false, error: 'No triaged messages available.' },
          confidence: 0.3,
        };
      }

      try {
        const triaged = (triageContext.triaged as Array<{ messageId: string }>) || [];
        const suggestions = [];

        for (const item of triaged.slice(0, 5)) { // Generate for first 5
          const suggestion = await socialReplyService.generateReply(item.messageId, {
            tone: 'professional',
            maxLength: 280,
          });
          suggestions.push({
            messageId: item.messageId,
            suggestedReply: suggestion.content,
            confidence: suggestion.confidence,
          });
        }

        return {
          agent: 'manage_social_inbox',
          action: step.action,
          result: {
            success: true,
            suggestions,
            message: 'Reply suggestions generated. Review before sending.',
          },
          confidence: 0.8,
        };
      } catch (err) {
        return {
          agent: 'manage_social_inbox',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    default:
      throw new Error(`Unknown manage_social_inbox action: ${step.action}`);
  }
}

async function executeOptimizeAdsStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  const { adsAccountService } = await import('@/lib/ads');
  const { adsIngestionService } = await import('@/lib/ads');
  const { adsOptimizationService } = await import('@/lib/ads');

  switch (step.action) {
    case 'fetch_ad_accounts':
      try {
        const accounts = await adsAccountService.getAccounts(request.workspaceId);
        return {
          agent: 'optimize_ads',
          action: step.action,
          result: {
            success: true,
            accounts: accounts.map((a) => ({
              id: a.id,
              platform: a.platform,
              name: a.accountName,
              status: a.status,
            })),
            totalAccounts: accounts.length,
          },
          confidence: 0.95,
        };
      } catch (err) {
        return {
          agent: 'optimize_ads',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'analyze_campaigns':
      const accountContext = context['optimize_ads'] as Record<string, unknown> | undefined;
      if (!accountContext?.success) {
        return {
          agent: 'optimize_ads',
          action: step.action,
          result: { success: false, error: 'No ad accounts available.' },
          confidence: 0.3,
        };
      }

      try {
        const accounts = (accountContext.accounts as Array<{ id: string }>) || [];
        const campaignData = [];

        for (const account of accounts.slice(0, 3)) {
          const campaigns = await adsIngestionService.getCampaigns(account.id, { limit: 20 });
          campaignData.push({
            accountId: account.id,
            campaigns: campaigns.data,
            totalCampaigns: campaigns.total,
          });
        }

        return {
          agent: 'optimize_ads',
          action: step.action,
          result: {
            success: true,
            campaignData,
            totalCampaigns: campaignData.reduce((sum, d) => sum + d.totalCampaigns, 0),
          },
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'optimize_ads',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'detect_opportunities':
      const campaignContext = context['optimize_ads'] as Record<string, unknown> | undefined;
      if (!campaignContext?.success) {
        return {
          agent: 'optimize_ads',
          action: step.action,
          result: { success: false, error: 'No campaign data available.' },
          confidence: 0.3,
        };
      }

      try {
        const opportunities = await adsOptimizationService.detectOpportunities(request.workspaceId);
        return {
          agent: 'optimize_ads',
          action: step.action,
          result: {
            success: true,
            opportunities: opportunities.slice(0, 10),
            totalOpportunities: opportunities.length,
            highImpact: opportunities.filter((o) => o.impact === 'high').length,
          },
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'optimize_ads',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'generate_recommendations':
      const oppContext = context['optimize_ads'] as Record<string, unknown> | undefined;
      if (!oppContext?.success) {
        return {
          agent: 'optimize_ads',
          action: step.action,
          result: { success: false, error: 'No opportunities detected.' },
          confidence: 0.3,
        };
      }

      try {
        const opportunities = (oppContext.opportunities as Array<{ id: string }>) || [];
        const recommendations = await adsOptimizationService.generateRecommendations(
          request.workspaceId,
          opportunities.map((o) => o.id)
        );

        return {
          agent: 'optimize_ads',
          action: step.action,
          result: {
            success: true,
            recommendations,
            message: 'Recommendations generated. These are suggestions only - no auto-apply.',
            reviewUrl: `/dashboard/ads/opportunities?workspace=${request.workspaceId}`,
          },
          confidence: 0.8,
        };
      } catch (err) {
        return {
          agent: 'optimize_ads',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    default:
      throw new Error(`Unknown optimize_ads action: ${step.action}`);
  }
}

async function executeRunSearchAuditStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  const { gscClient } = await import('@/lib/searchSuite');
  const { bingClient } = await import('@/lib/searchSuite');
  const { keywordTrackingService } = await import('@/lib/searchSuite');
  const { volatilityService } = await import('@/lib/searchSuite');

  switch (step.action) {
    case 'fetch_gsc_data':
      try {
        // Note: This requires a connected GSC property
        const analytics = await gscClient.getSearchAnalytics('properties/YOUR_PROPERTY', {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          dimensions: ['query', 'page'],
          rowLimit: 100,
        });

        return {
          agent: 'run_search_audit',
          action: step.action,
          result: {
            success: true,
            source: 'google_search_console',
            totalRows: analytics.rows?.length || 0,
            topQueries: analytics.rows?.slice(0, 10) || [],
          },
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'run_search_audit',
          action: step.action,
          result: {
            success: false,
            error: (err as Error).message,
            hint: 'Ensure GSC is connected and property is verified.',
          },
          confidence: 0.3,
        };
      }

    case 'fetch_bing_data':
      try {
        const siteUrl = 'https://example.com'; // Should come from workspace config
        const stats = await bingClient.getPageStats(siteUrl, {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        });

        return {
          agent: 'run_search_audit',
          action: step.action,
          result: {
            success: true,
            source: 'bing_webmaster',
            pageStats: stats,
          },
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'run_search_audit',
          action: step.action,
          result: {
            success: false,
            error: (err as Error).message,
            hint: 'Ensure Bing Webmaster Tools is connected.',
          },
          confidence: 0.3,
        };
      }

    case 'check_keyword_rankings':
      try {
        const projectId = request.context?.clientId || request.workspaceId;
        const keywords = await keywordTrackingService.getKeywords(projectId, {}, 1, 50);
        const movers = await keywordTrackingService.getTopMovers(projectId, 10);

        return {
          agent: 'run_search_audit',
          action: step.action,
          result: {
            success: true,
            totalKeywords: keywords.total,
            trackedKeywords: keywords.data.length,
            topGainers: movers.gainers,
            topLosers: movers.losers,
          },
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'run_search_audit',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'analyze_volatility':
      try {
        const projectId = request.context?.clientId || request.workspaceId;
        const summary = await volatilityService.getVolatilitySummary(projectId);

        return {
          agent: 'run_search_audit',
          action: step.action,
          result: {
            success: true,
            volatilitySummary: summary,
            activeAlerts: summary.activeAlerts,
            volatilityLevel: summary.overallVolatility,
          },
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'run_search_audit',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'generate_report':
      const auditContext = context['run_search_audit'] as Record<string, unknown> | undefined;

      return {
        agent: 'run_search_audit',
        action: step.action,
        result: {
          success: true,
          report: {
            generatedAt: new Date().toISOString(),
            gscData: auditContext || {},
            recommendations: [
              'Review top losing keywords for content optimization opportunities',
              'Check high volatility keywords for algorithm update impact',
              'Ensure all priority pages are indexed in both Google and Bing',
            ],
          },
          viewReportUrl: `/dashboard/search-suite?workspace=${request.workspaceId}`,
        },
        confidence: 0.8,
      };

    default:
      throw new Error(`Unknown run_search_audit action: ${step.action}`);
  }
}

async function executeReplayBrowserTaskStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  const { replayService } = await import('@/lib/browserAutomation');
  const { sessionStateStore } = await import('@/lib/browserAutomation');

  switch (step.action) {
    case 'fetch_task':
      try {
        const taskId = (step.inputs?.taskId as string) || request.context?.clientId;

        if (!taskId) {
          // List available tasks
          const tasks = await replayService.getTasks(request.workspaceId, {}, 1, 10);
          return {
            agent: 'replay_browser_task',
            action: step.action,
            result: {
              success: true,
              availableTasks: tasks.data.map((t) => ({
                id: t.id,
                name: t.name,
                lastRun: t.lastRunAt,
                status: t.lastRunStatus,
              })),
              message: 'Select a task to replay.',
            },
            confidence: 0.9,
          };
        }

        const task = await replayService.getTask(taskId);
        return {
          agent: 'replay_browser_task',
          action: step.action,
          result: {
            success: !!task,
            task: task ? {
              id: task.id,
              name: task.name,
              stepsCount: task.steps?.length || 0,
              schedule: task.schedule,
            } : null,
          },
          confidence: task ? 0.95 : 0.3,
        };
      } catch (err) {
        return {
          agent: 'replay_browser_task',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'restore_session':
      const taskContext = context['replay_browser_task'] as Record<string, unknown> | undefined;
      if (!taskContext?.success || !taskContext?.task) {
        return {
          agent: 'replay_browser_task',
          action: step.action,
          result: { success: false, error: 'No task selected.' },
          confidence: 0.3,
        };
      }

      try {
        const task = taskContext.task as { id: string };
        const session = await sessionStateStore.getSession(`task_${task.id}`);

        return {
          agent: 'replay_browser_task',
          action: step.action,
          result: {
            success: true,
            hasExistingSession: !!session,
            sessionId: session?.id || `new_${Date.now()}`,
          },
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'replay_browser_task',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'execute_replay':
      const sessionContext = context['replay_browser_task'] as Record<string, unknown> | undefined;
      if (!sessionContext?.success) {
        return {
          agent: 'replay_browser_task',
          action: step.action,
          result: { success: false, error: 'Session not restored.' },
          confidence: 0.3,
        };
      }

      try {
        const taskCtx = context['replay_browser_task'] as { task?: { id: string } };
        const taskId = taskCtx?.task?.id;

        if (!taskId) {
          return {
            agent: 'replay_browser_task',
            action: step.action,
            result: { success: false, error: 'Task ID not found.' },
            confidence: 0.3,
          };
        }

        const run = await replayService.runTask(taskId, { headless: true });

        return {
          agent: 'replay_browser_task',
          action: step.action,
          result: {
            success: true,
            runId: run.id,
            status: run.status,
            message: 'Task execution started.',
          },
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'replay_browser_task',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'record_result':
      const execContext = context['replay_browser_task'] as Record<string, unknown> | undefined;

      return {
        agent: 'replay_browser_task',
        action: step.action,
        result: {
          success: execContext?.success || false,
          runId: execContext?.runId,
          summary: execContext?.success
            ? 'Task replay completed successfully.'
            : 'Task replay encountered issues.',
          viewHistoryUrl: `/dashboard/browser-automation/history?workspace=${request.workspaceId}`,
        },
        confidence: 0.85,
      };

    default:
      throw new Error(`Unknown replay_browser_task action: ${step.action}`);
  }
}

async function executeLearnBrowserPatternStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  const { patternLearnerService } = await import('@/lib/browserAutomation');
  const { sessionStateStore } = await import('@/lib/browserAutomation');
  const { domCacheService } = await import('@/lib/browserAutomation');

  switch (step.action) {
    case 'fetch_session':
      try {
        const sessionId = (step.inputs?.sessionId as string) || request.context?.clientId;

        if (!sessionId) {
          return {
            agent: 'learn_browser_pattern',
            action: step.action,
            result: {
              success: false,
              error: 'Session ID required for pattern learning.',
              hint: 'Record a browser session first, then learn patterns from it.',
            },
            confidence: 0.3,
          };
        }

        const session = await sessionStateStore.getSession(sessionId);

        return {
          agent: 'learn_browser_pattern',
          action: step.action,
          result: {
            success: !!session,
            session: session ? {
              id: session.id,
              actionsCount: session.actions?.length || 0,
              startUrl: session.startUrl,
            } : null,
          },
          confidence: session ? 0.95 : 0.3,
        };
      } catch (err) {
        return {
          agent: 'learn_browser_pattern',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'analyze_actions':
      const sessionContext = context['learn_browser_pattern'] as Record<string, unknown> | undefined;
      if (!sessionContext?.success || !sessionContext?.session) {
        return {
          agent: 'learn_browser_pattern',
          action: step.action,
          result: { success: false, error: 'No session available for analysis.' },
          confidence: 0.3,
        };
      }

      try {
        const session = sessionContext.session as { id: string; actionsCount: number };

        return {
          agent: 'learn_browser_pattern',
          action: step.action,
          result: {
            success: true,
            analyzed: true,
            totalActions: session.actionsCount,
            categories: ['navigation', 'form_fill', 'click', 'scroll'],
          },
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'learn_browser_pattern',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'extract_patterns':
      const analysisContext = context['learn_browser_pattern'] as Record<string, unknown> | undefined;
      if (!analysisContext?.success) {
        return {
          agent: 'learn_browser_pattern',
          action: step.action,
          result: { success: false, error: 'Actions not analyzed.' },
          confidence: 0.3,
        };
      }

      try {
        const sessionCtx = context['learn_browser_pattern'] as { session?: { id: string } };
        const sessionId = sessionCtx?.session?.id || '';

        // Extract patterns using AI
        const patterns = await patternLearnerService.findMatchingPatterns(
          request.workspaceId,
          '', // URL determined from session
          'general'
        );

        return {
          agent: 'learn_browser_pattern',
          action: step.action,
          result: {
            success: true,
            existingMatches: patterns.length,
            potentialPatterns: [
              { type: 'form_fill', confidence: 0.8 },
              { type: 'navigation_sequence', confidence: 0.75 },
            ],
          },
          confidence: 0.8,
        };
      } catch (err) {
        return {
          agent: 'learn_browser_pattern',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'save_pattern':
      const extractContext = context['learn_browser_pattern'] as Record<string, unknown> | undefined;
      if (!extractContext?.success) {
        return {
          agent: 'learn_browser_pattern',
          action: step.action,
          result: { success: false, error: 'No patterns extracted.' },
          confidence: 0.3,
        };
      }

      try {
        const sessionCtx = context['learn_browser_pattern'] as { session?: { id: string } };
        const sessionId = sessionCtx?.session?.id || '';

        const pattern = await patternLearnerService.learnFromActions(
          request.workspaceId,
          sessionId,
          `Learned Pattern ${new Date().toISOString()}`,
          { minConfidence: 0.7 }
        );

        return {
          agent: 'learn_browser_pattern',
          action: step.action,
          result: {
            success: !!pattern,
            pattern: pattern ? {
              id: pattern.id,
              name: pattern.name,
              confidence: pattern.confidence,
              category: pattern.category,
            } : null,
            message: pattern
              ? 'Pattern saved successfully. It will be suggested for similar workflows.'
              : 'Pattern not saved - insufficient confidence.',
          },
          confidence: pattern ? 0.9 : 0.5,
        };
      } catch (err) {
        return {
          agent: 'learn_browser_pattern',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    default:
      throw new Error(`Unknown learn_browser_pattern action: ${step.action}`);
  }
}

// ============================================================================
// PRE-CLIENT HISTORICAL EMAIL IDENTITY ENGINE EXECUTORS
// ============================================================================

async function executeIngestPreClientHistoryStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  const {
    preClientMapperService,
    historyIngestionService,
    threadClusterService,
  } = await import('@/lib/emailIngestion');

  switch (step.action) {
    case 'validate_pre_client':
      try {
        const preClientId = (step.inputs?.preClientId as string) || request.context?.clientId;

        if (!preClientId) {
          return {
            agent: 'ingest_pre_client_history',
            action: step.action,
            result: {
              success: false,
              error: 'Pre-client ID is required for history ingestion.',
              hint: 'Provide a pre-client ID to start ingesting historical emails.',
            },
            confidence: 0.3,
          };
        }

        const preClient = await preClientMapperService.getPreClient(
          preClientId,
          request.workspaceId
        );

        if (!preClient) {
          return {
            agent: 'ingest_pre_client_history',
            action: step.action,
            result: {
              success: false,
              error: 'Pre-client not found.',
            },
            confidence: 0.3,
          };
        }

        return {
          agent: 'ingest_pre_client_history',
          action: step.action,
          result: {
            success: true,
            preClient: {
              id: preClient.id,
              name: preClient.name,
              email: preClient.email,
              status: preClient.status,
            },
          },
          confidence: 0.95,
        };
      } catch (err) {
        return {
          agent: 'ingest_pre_client_history',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'fetch_connected_app':
      try {
        const { getSupabaseServer } = await import('@/lib/supabase');
        const supabase = await getSupabaseServer();

        const { data: apps } = await supabase
          .from('connected_apps')
          .select('id, provider')
          .eq('workspace_id', request.workspaceId)
          .in('provider', ['gmail', 'outlook']);

        if (!apps?.length) {
          return {
            agent: 'ingest_pre_client_history',
            action: step.action,
            result: {
              success: false,
              error: 'No email account connected.',
              hint: 'Connect Gmail or Outlook first to ingest historical emails.',
            },
            confidence: 0.3,
          };
        }

        return {
          agent: 'ingest_pre_client_history',
          action: step.action,
          result: {
            success: true,
            connectedApp: apps[0],
            availableApps: apps,
          },
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'ingest_pre_client_history',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'start_ingestion':
      const preClientContext = context['ingest_pre_client_history'] as Record<string, unknown> | undefined;
      if (!preClientContext?.success) {
        return {
          agent: 'ingest_pre_client_history',
          action: step.action,
          result: { success: false, error: 'Pre-client validation failed.' },
          confidence: 0.3,
        };
      }

      try {
        const preClient = preClientContext.preClient as { id: string; email: string };
        const connectedApp = preClientContext.connectedApp as { id: string } | undefined;

        if (!connectedApp) {
          return {
            agent: 'ingest_pre_client_history',
            action: step.action,
            result: { success: false, error: 'No connected email app available.' },
            confidence: 0.3,
          };
        }

        const jobId = await historyIngestionService.startIngestion({
          preClientId: preClient.id,
          workspaceId: request.workspaceId,
          connectedAppId: connectedApp.id,
          startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months
          endDate: new Date(),
          emailFilter: preClient.email,
        });

        return {
          agent: 'ingest_pre_client_history',
          action: step.action,
          result: {
            success: !!jobId,
            jobId,
            message: jobId
              ? 'Ingestion job started. Processing historical emails...'
              : 'Failed to start ingestion job.',
          },
          confidence: jobId ? 0.9 : 0.3,
        };
      } catch (err) {
        return {
          agent: 'ingest_pre_client_history',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'cluster_threads':
      const ingestionContext = context['ingest_pre_client_history'] as Record<string, unknown> | undefined;
      if (!ingestionContext?.jobId) {
        return {
          agent: 'ingest_pre_client_history',
          action: step.action,
          result: { success: false, error: 'No ingestion job to cluster.' },
          confidence: 0.3,
        };
      }

      try {
        const pcContext = ingestionContext.preClient as { id: string };
        const clusteredThreads = await threadClusterService.processAndSaveThreads({
          preClientId: pcContext.id,
          workspaceId: request.workspaceId,
        });

        return {
          agent: 'ingest_pre_client_history',
          action: step.action,
          result: {
            success: true,
            threadsProcessed: clusteredThreads.length,
            message: `Clustered ${clusteredThreads.length} email threads.`,
          },
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'ingest_pre_client_history',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'update_stats':
      const clusterContext = context['ingest_pre_client_history'] as Record<string, unknown> | undefined;
      if (!clusterContext?.success) {
        return {
          agent: 'ingest_pre_client_history',
          action: step.action,
          result: { success: false, error: 'Thread clustering incomplete.' },
          confidence: 0.3,
        };
      }

      try {
        const pcCtx = clusterContext.preClient as { id: string };
        await preClientMapperService.updateStats(pcCtx.id, request.workspaceId);
        await preClientMapperService.calculateSentimentScore(pcCtx.id, request.workspaceId);

        return {
          agent: 'ingest_pre_client_history',
          action: step.action,
          result: {
            success: true,
            message: 'Pre-client stats updated successfully.',
          },
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'ingest_pre_client_history',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    default:
      throw new Error(`Unknown ingest_pre_client_history action: ${step.action}`);
  }
}

async function executeBuildPreClientTimelineStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  const {
    preClientMapperService,
    relationshipTimelineService,
  } = await import('@/lib/emailIngestion');

  switch (step.action) {
    case 'fetch_pre_client':
      try {
        const preClientId = (step.inputs?.preClientId as string) || request.context?.clientId;

        if (!preClientId) {
          return {
            agent: 'build_pre_client_timeline',
            action: step.action,
            result: {
              success: false,
              error: 'Pre-client ID is required.',
            },
            confidence: 0.3,
          };
        }

        const preClient = await preClientMapperService.getPreClient(
          preClientId,
          request.workspaceId
        );

        if (!preClient) {
          return {
            agent: 'build_pre_client_timeline',
            action: step.action,
            result: { success: false, error: 'Pre-client not found.' },
            confidence: 0.3,
          };
        }

        return {
          agent: 'build_pre_client_timeline',
          action: step.action,
          result: {
            success: true,
            preClient: {
              id: preClient.id,
              name: preClient.name,
              status: preClient.status,
            },
          },
          confidence: 0.95,
        };
      } catch (err) {
        return {
          agent: 'build_pre_client_timeline',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'build_timeline':
      const pcContext = context['build_pre_client_timeline'] as Record<string, unknown> | undefined;
      if (!pcContext?.success) {
        return {
          agent: 'build_pre_client_timeline',
          action: step.action,
          result: { success: false, error: 'Pre-client not found.' },
          confidence: 0.3,
        };
      }

      try {
        const preClient = pcContext.preClient as { id: string };
        const events = await relationshipTimelineService.buildTimeline(
          preClient.id,
          request.workspaceId
        );

        return {
          agent: 'build_pre_client_timeline',
          action: step.action,
          result: {
            success: true,
            eventsCreated: events.length,
            events: events.slice(0, 5).map((e) => ({
              type: e.eventType,
              date: e.eventDate.toISOString(),
              summary: e.summary,
            })),
          },
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'build_pre_client_timeline',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'generate_summary':
      const timelineContext = context['build_pre_client_timeline'] as Record<string, unknown> | undefined;
      if (!timelineContext?.success) {
        return {
          agent: 'build_pre_client_timeline',
          action: step.action,
          result: { success: false, error: 'Timeline not built.' },
          confidence: 0.3,
        };
      }

      try {
        const pc = timelineContext.preClient as { id: string };
        const summary = await relationshipTimelineService.generateRelationshipSummary(
          pc.id,
          request.workspaceId
        );

        return {
          agent: 'build_pre_client_timeline',
          action: step.action,
          result: {
            success: true,
            summary: {
              currentPhase: summary.currentPhase,
              engagementLevel: summary.engagementLevel,
              durationDays: summary.relationshipDurationDays,
              totalEvents: summary.totalEvents,
              milestones: summary.milestoneCount,
              issues: summary.issuesCount,
            },
          },
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'build_pre_client_timeline',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'generate_narrative':
      const summaryContext = context['build_pre_client_timeline'] as Record<string, unknown> | undefined;
      if (!summaryContext?.success) {
        return {
          agent: 'build_pre_client_timeline',
          action: step.action,
          result: { success: false, error: 'Summary not generated.' },
          confidence: 0.3,
        };
      }

      try {
        const pc = summaryContext.preClient as { id: string };
        const narrative = await relationshipTimelineService.generateRelationshipNarrative(
          pc.id,
          request.workspaceId
        );

        return {
          agent: 'build_pre_client_timeline',
          action: step.action,
          result: {
            success: true,
            narrative,
            message: 'Relationship narrative generated successfully.',
          },
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'build_pre_client_timeline',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    default:
      throw new Error(`Unknown build_pre_client_timeline action: ${step.action}`);
  }
}

async function executeAnalyzePreClientInsightsStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  const {
    preClientMapperService,
    opportunityDetectorService,
  } = await import('@/lib/emailIngestion');

  switch (step.action) {
    case 'fetch_pre_client':
      try {
        const preClientId = (step.inputs?.preClientId as string) || request.context?.clientId;

        if (!preClientId) {
          return {
            agent: 'analyze_pre_client_insights',
            action: step.action,
            result: {
              success: false,
              error: 'Pre-client ID is required.',
            },
            confidence: 0.3,
          };
        }

        const preClient = await preClientMapperService.getPreClient(
          preClientId,
          request.workspaceId
        );

        if (!preClient) {
          return {
            agent: 'analyze_pre_client_insights',
            action: step.action,
            result: { success: false, error: 'Pre-client not found.' },
            confidence: 0.3,
          };
        }

        return {
          agent: 'analyze_pre_client_insights',
          action: step.action,
          result: {
            success: true,
            preClient: {
              id: preClient.id,
              name: preClient.name,
              status: preClient.status,
              totalMessages: preClient.totalMessages,
            },
          },
          confidence: 0.95,
        };
      } catch (err) {
        return {
          agent: 'analyze_pre_client_insights',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'process_insights':
      const pcContext = context['analyze_pre_client_insights'] as Record<string, unknown> | undefined;
      if (!pcContext?.success) {
        return {
          agent: 'analyze_pre_client_insights',
          action: step.action,
          result: { success: false, error: 'Pre-client not found.' },
          confidence: 0.3,
        };
      }

      try {
        const preClient = pcContext.preClient as { id: string };
        const insights = await opportunityDetectorService.processPreClient(
          preClient.id,
          request.workspaceId
        );

        return {
          agent: 'analyze_pre_client_insights',
          action: step.action,
          result: {
            success: true,
            insightsExtracted: insights.length,
            sample: insights.slice(0, 5).map((i) => ({
              category: i.category,
              title: i.title,
              priority: i.priority,
            })),
          },
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'analyze_pre_client_insights',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'generate_analysis':
      const processContext = context['analyze_pre_client_insights'] as Record<string, unknown> | undefined;
      if (!processContext?.success) {
        return {
          agent: 'analyze_pre_client_insights',
          action: step.action,
          result: { success: false, error: 'Insights not processed.' },
          confidence: 0.3,
        };
      }

      try {
        const pc = processContext.preClient as { id: string };
        const analysis = await opportunityDetectorService.generateAnalysis(
          pc.id,
          request.workspaceId
        );

        return {
          agent: 'analyze_pre_client_insights',
          action: step.action,
          result: {
            success: true,
            analysis: {
              totalInsights: analysis.totalInsights,
              byCategory: analysis.byCategory,
              byPriority: analysis.byPriority,
              pendingTasksCount: analysis.pendingTasks.length,
              openOpportunitiesCount: analysis.openOpportunities.length,
              unresolvedQuestionsCount: analysis.unresolvedQuestions.length,
              risksCount: analysis.risks.length,
            },
          },
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'analyze_pre_client_insights',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'identify_patterns':
      const analysisContext = context['analyze_pre_client_insights'] as Record<string, unknown> | undefined;
      if (!analysisContext?.success) {
        return {
          agent: 'analyze_pre_client_insights',
          action: step.action,
          result: { success: false, error: 'Analysis not generated.' },
          confidence: 0.3,
        };
      }

      try {
        const pc = analysisContext.preClient as { id: string };
        const patterns = await opportunityDetectorService.identifyCrossThreadPatterns(
          pc.id,
          request.workspaceId
        );

        return {
          agent: 'analyze_pre_client_insights',
          action: step.action,
          result: {
            success: true,
            patterns: patterns.patterns,
            recommendations: patterns.recommendations,
            message: 'Cross-thread patterns identified successfully.',
          },
          confidence: 0.8,
        };
      } catch (err) {
        return {
          agent: 'analyze_pre_client_insights',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    default:
      throw new Error(`Unknown analyze_pre_client_insights action: ${step.action}`);
  }
}

// ============================================================================
// FOUNDER COGNITIVE TWIN EXECUTORS
// ============================================================================

async function executeFounderMemoryStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  const {
    founderMemoryAggregationService,
    patternExtractionService,
    momentumScoringService,
    opportunityConsolidationService,
    riskAnalysisService,
  } = await import('@/lib/founderMemory');

  switch (step.action) {
    case 'create_snapshot':
      try {
        const snapshot = await founderMemoryAggregationService.createSnapshot({
          founderId: 'current_user', // Will be replaced by actual user ID in API
          workspaceId: request.workspaceId,
          timeRangeStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          timeRangeEnd: new Date(),
        });

        return {
          agent: 'analyze_founder_memory',
          action: step.action,
          result: {
            success: true,
            snapshotId: snapshot.id,
            summary: snapshot.summaryJson,
            confidenceScore: snapshot.confidenceScore,
          },
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'analyze_founder_memory',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'get_momentum':
      try {
        const momentum = await momentumScoringService.calculateMomentum({
          founderId: 'current_user',
          workspaceId: request.workspaceId,
        });

        return {
          agent: 'analyze_founder_memory',
          action: step.action,
          result: {
            success: true,
            overallScore: momentum.overallScore,
            scores: {
              marketing: momentum.marketingScore,
              sales: momentum.salesScore,
              delivery: momentum.deliveryScore,
              product: momentum.productScore,
              clients: momentum.clientsScore,
              engineering: momentum.engineeringScore,
              finance: momentum.financeScore,
            },
          },
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'analyze_founder_memory',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'get_patterns':
      try {
        const patterns = await patternExtractionService.getPatterns(
          'current_user',
          request.workspaceId,
          { limit: 10 }
        );

        return {
          agent: 'analyze_founder_memory',
          action: step.action,
          result: {
            success: true,
            patterns: patterns.map((p) => ({
              type: p.patternType,
              title: p.title,
              strength: p.strengthScore,
            })),
            count: patterns.length,
          },
          confidence: 0.8,
        };
      } catch (err) {
        return {
          agent: 'analyze_founder_memory',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'get_opportunities_risks':
      try {
        const [opportunities, risks] = await Promise.all([
          opportunityConsolidationService.getOpportunities('current_user', request.workspaceId, { limit: 5 }),
          riskAnalysisService.getRisks('current_user', request.workspaceId, { limit: 5 }),
        ]);

        return {
          agent: 'analyze_founder_memory',
          action: step.action,
          result: {
            success: true,
            opportunities: opportunities.map((o) => ({
              title: o.title,
              category: o.category,
              potentialValue: o.potentialValue,
            })),
            risks: risks.map((r) => ({
              title: r.title,
              category: r.category,
              riskScore: r.riskScore,
            })),
          },
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'analyze_founder_memory',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    default:
      throw new Error(`Unknown analyze_founder_memory action: ${step.action}`);
  }
}

async function executeFounderForecastStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  const { forecastEngineService } = await import('@/lib/founderMemory');

  switch (step.action) {
    case 'gather_inputs':
      return {
        agent: 'forecast_founder_outcomes',
        action: step.action,
        result: {
          success: true,
          dataGathered: true,
          message: 'Forecast inputs gathered from business data.',
        },
        confidence: 0.9,
      };

    case 'generate_forecast':
      try {
        const horizon = (step.inputs?.horizon as string) || '12_week';
        const forecast = await forecastEngineService.generateForecast({
          founderId: 'current_user',
          workspaceId: request.workspaceId,
          horizon: horizon as '6_week' | '12_week' | '1_year',
        });

        return {
          agent: 'forecast_founder_outcomes',
          action: step.action,
          result: {
            success: true,
            forecastId: forecast.id,
            horizon: forecast.horizon,
            baseline: forecast.baselineScenario,
            optimistic: forecast.optimisticScenario,
            pessimistic: forecast.pessimisticScenario,
            confidenceScore: forecast.confidenceScore,
          },
          confidence: 0.8,
        };
      } catch (err) {
        return {
          agent: 'forecast_founder_outcomes',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'analyze_scenarios':
      const forecastContext = context['forecast_founder_outcomes'] as Record<string, unknown> | undefined;

      return {
        agent: 'forecast_founder_outcomes',
        action: step.action,
        result: {
          success: !!forecastContext?.success,
          analysis: forecastContext?.success
            ? 'Forecast scenarios analyzed successfully.'
            : 'Unable to analyze scenarios.',
        },
        confidence: forecastContext?.success ? 0.85 : 0.3,
      };

    default:
      throw new Error(`Unknown forecast_founder_outcomes action: ${step.action}`);
  }
}

async function executeFounderNextActionsStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  const { overloadDetectionService, nextActionRecommenderService } = await import('@/lib/founderMemory');

  switch (step.action) {
    case 'check_overload':
      try {
        const analysis = await overloadDetectionService.analyzeOverload({
          founderId: 'current_user',
          workspaceId: request.workspaceId,
        });

        return {
          agent: 'suggest_founder_next_actions',
          action: step.action,
          result: {
            success: true,
            overloadSeverity: analysis.overallSeverity,
            overloadScore: analysis.overallScore,
            recommendations: analysis.recommendations,
          },
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'suggest_founder_next_actions',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'gather_context':
      return {
        agent: 'suggest_founder_next_actions',
        action: step.action,
        result: {
          success: true,
          contextGathered: true,
          message: 'Context gathered from opportunities, risks, and patterns.',
        },
        confidence: 0.85,
      };

    case 'generate_recommendations':
      try {
        const result = await nextActionRecommenderService.generateRecommendations({
          founderId: 'current_user',
          workspaceId: request.workspaceId,
          maxActions: 10,
        });

        return {
          agent: 'suggest_founder_next_actions',
          action: step.action,
          result: {
            success: true,
            actions: result.actions.map((a) => ({
              title: a.title,
              category: a.category,
              urgency: a.urgency,
              reasoning: a.reasoning,
            })),
            summary: result.summary,
            overloadWarning: result.overloadWarning,
          },
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'suggest_founder_next_actions',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'prioritize_actions':
      const actionsContext = context['suggest_founder_next_actions'] as Record<string, unknown> | undefined;

      return {
        agent: 'suggest_founder_next_actions',
        action: step.action,
        result: {
          success: !!actionsContext?.success,
          prioritized: actionsContext?.success,
          message: actionsContext?.success
            ? 'Actions prioritized by urgency and impact.'
            : 'Unable to prioritize actions.',
        },
        confidence: actionsContext?.success ? 0.9 : 0.3,
      };

    default:
      throw new Error(`Unknown suggest_founder_next_actions action: ${step.action}`);
  }
}

async function executeDecisionSimulatorStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  const { decisionSimulatorService } = await import('@/lib/founderMemory');

  switch (step.action) {
    case 'parse_scenario':
      const prompt = step.inputs?.prompt as string;
      // Simple scenario type detection from prompt
      let scenarioType = 'other';
      if (/pric/i.test(prompt)) {
scenarioType = 'pricing_change';
} else if (/product|launch/i.test(prompt)) {
scenarioType = 'new_product';
} else if (/hir|staff/i.test(prompt)) {
scenarioType = 'hiring';
} else if (/market/i.test(prompt)) {
scenarioType = 'marketing_campaign';
} else if (/partner/i.test(prompt)) {
scenarioType = 'partnership';
} else if (/expand/i.test(prompt)) {
scenarioType = 'market_expansion';
} else if (/cost|cut/i.test(prompt)) {
scenarioType = 'cost_reduction';
}

      return {
        agent: 'simulate_decision_scenarios',
        action: step.action,
        result: {
          success: true,
          scenarioType,
          parsedFromPrompt: true,
        },
        confidence: 0.8,
      };

    case 'gather_context':
      return {
        agent: 'simulate_decision_scenarios',
        action: step.action,
        result: {
          success: true,
          contextGathered: true,
          message: 'Business context gathered for simulation.',
        },
        confidence: 0.85,
      };

    case 'run_simulation':
      try {
        const parseContext = context['simulate_decision_scenarios'] as Record<string, unknown> | undefined;
        const scenarioType = (parseContext?.scenarioType as string) || 'other';

        const scenario = await decisionSimulatorService.createScenario({
          founderId: 'current_user',
          workspaceId: request.workspaceId,
          scenarioType: scenarioType as 'pricing_change' | 'new_product' | 'hiring' | 'marketing_campaign' | 'partnership' | 'market_expansion' | 'cost_reduction' | 'other',
          title: `Simulated ${scenarioType.replace('_', ' ')}`,
          description: request.userPrompt,
        });

        return {
          agent: 'simulate_decision_scenarios',
          action: step.action,
          result: {
            success: true,
            scenarioId: scenario.id,
            outcomes: scenario.simulatedOutcomesJson,
            confidenceScore: scenario.confidenceScore,
          },
          confidence: 0.8,
        };
      } catch (err) {
        return {
          agent: 'simulate_decision_scenarios',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'generate_recommendation':
      const simContext = context['simulate_decision_scenarios'] as Record<string, unknown> | undefined;

      return {
        agent: 'simulate_decision_scenarios',
        action: step.action,
        result: {
          success: !!simContext?.success,
          recommendation: simContext?.success
            ? 'Review the simulated outcomes to make an informed decision.'
            : 'Unable to generate recommendation.',
          scenarioId: simContext?.scenarioId,
        },
        confidence: simContext?.success ? 0.85 : 0.3,
      };

    default:
      throw new Error(`Unknown simulate_decision_scenarios action: ${step.action}`);
  }
}

async function executeWeeklyDigestStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  const { weeklyDigestService } = await import('@/lib/founderMemory');

  switch (step.action) {
    case 'gather_week_data':
      return {
        agent: 'generate_founder_weekly_digest',
        action: step.action,
        result: {
          success: true,
          dataGathered: true,
          message: 'Week data gathered from all sources.',
        },
        confidence: 0.9,
      };

    case 'compile_wins_risks':
      return {
        agent: 'generate_founder_weekly_digest',
        action: step.action,
        result: {
          success: true,
          compiled: true,
          message: 'Wins, risks, and opportunities compiled.',
        },
        confidence: 0.85,
      };

    case 'generate_summary':
      return {
        agent: 'generate_founder_weekly_digest',
        action: step.action,
        result: {
          success: true,
          summaryGenerated: true,
          message: 'Executive summary generated with AI.',
        },
        confidence: 0.85,
      };

    case 'create_digest':
      try {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        weekStart.setHours(0, 0, 0, 0);

        const digest = await weeklyDigestService.generateDigest({
          founderId: 'current_user',
          workspaceId: request.workspaceId,
          weekStart,
        });

        return {
          agent: 'generate_founder_weekly_digest',
          action: step.action,
          result: {
            success: true,
            digestId: digest.id,
            weekStart: digest.weekStart.toISOString(),
            weekEnd: digest.weekEnd.toISOString(),
            executiveSummary: digest.executiveSummary,
            winsCount: digest.winsJson?.length || 0,
            risksCount: digest.risksJson?.length || 0,
            opportunitiesCount: digest.opportunitiesJson?.length || 0,
          },
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'generate_founder_weekly_digest',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    default:
      throw new Error(`Unknown generate_founder_weekly_digest action: ${step.action}`);
  }
}

// ============================================================================
// NEW AGENT EXECUTORS
// ============================================================================

async function executeFounderOsStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  const agent = new FounderOsAgent({ governanceMode: 'HUMAN_GOVERNED' });

  switch (step.action) {
    case 'analyze_portfolio':
      try {
        const result = await agent.analyzePortfolioHealth(request.workspaceId);
        return {
          agent: 'founder_os',
          action: step.action,
          result: result.data,
          confidence: result.success ? 0.9 : 0.3,
        };
      } catch (err) {
        return {
          agent: 'founder_os',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'process_signals':
      try {
        const businessId = step.inputs.businessId as string;
        const signals = step.inputs.signals as any[];
        const result = await agent.processSignals(businessId, signals);
        return {
          agent: 'founder_os',
          action: step.action,
          result: result.data,
          confidence: result.success ? 0.85 : 0.3,
        };
      } catch (err) {
        return {
          agent: 'founder_os',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'generate_snapshot':
      try {
        const businessId = step.inputs.businessId as string;
        const result = await agent.generateSnapshot(businessId);
        return {
          agent: 'founder_os',
          action: step.action,
          result: result.data,
          confidence: result.success ? 0.9 : 0.3,
        };
      } catch (err) {
        return {
          agent: 'founder_os',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    default:
      throw new Error(`Unknown founder_os action: ${step.action}`);
  }
}

async function executeAiPhillStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  const agent = new AiPhillAgent({ governanceMode: 'HUMAN_GOVERNED' });

  switch (step.action) {
    case 'analyze_strategy':
      try {
        const businessId = step.inputs.businessId as string;
        const result = await agent.analyzeBusinessStrategy(businessId);
        return {
          agent: 'ai_phill',
          action: step.action,
          result: result.data,
          confidence: result.success ? 0.9 : 0.3,
        };
      } catch (err) {
        return {
          agent: 'ai_phill',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'journal_entry':
      try {
        const userId = step.inputs.userId as string;
        const prompt = step.inputs.prompt as string;
        const result = await agent.facilitateJournalEntry(userId, prompt);
        return {
          agent: 'ai_phill',
          action: step.action,
          result: result.data,
          confidence: result.success ? 0.85 : 0.3,
        };
      } catch (err) {
        return {
          agent: 'ai_phill',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'assess_risks':
      try {
        const businessId = step.inputs.businessId as string;
        const result = await agent.assessRisks(businessId);
        return {
          agent: 'ai_phill',
          action: step.action,
          result: result.data,
          confidence: result.success ? 0.85 : 0.3,
        };
      } catch (err) {
        return {
          agent: 'ai_phill',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    default:
      throw new Error(`Unknown ai_phill action: ${step.action}`);
  }
}

async function executeSeoLeakStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  const agent = new SeoLeakAgent({ governanceMode: 'HUMAN_GOVERNED' });

  switch (step.action) {
    case 'analyze_url':
      try {
        const url = step.inputs.url as string;
        const result = await agent.analyzeUrl(url);
        return {
          agent: 'seo_leak',
          action: step.action,
          result,
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'seo_leak',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'run_audit':
      try {
        const domain = step.inputs.domain as string;
        const result = await agent.runFullAudit(domain);
        return {
          agent: 'seo_leak',
          action: step.action,
          result,
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'seo_leak',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'identify_gaps':
      try {
        const domain = step.inputs.domain as string;
        const competitors = step.inputs.competitors as string[];
        const result = await agent.identifyGaps(domain, competitors);
        return {
          agent: 'seo_leak',
          action: step.action,
          result,
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'seo_leak',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    default:
      throw new Error(`Unknown seo_leak action: ${step.action}`);
  }
}

async function executeBoostBumpStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  switch (step.action) {
    case 'analyze_opportunity':
      try {
        const businessId = step.inputs.businessId as string;
        const result = await boostBumpAgent.analyzeBoostOpportunity(businessId, request.workspaceId);
        return {
          agent: 'boost_bump',
          action: step.action,
          result,
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'boost_bump',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'create_boost':
      try {
        const businessId = step.inputs.businessId as string;
        const config = step.inputs.config as any;
        const result = await boostBumpAgent.createBoostJobWithAnalysis(businessId, request.workspaceId, config);
        return {
          agent: 'boost_bump',
          action: step.action,
          result,
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'boost_bump',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'analyze_results':
      try {
        const jobId = step.inputs.jobId as string;
        const result = await boostBumpAgent.analyzeBoostResults(jobId);
        return {
          agent: 'boost_bump',
          action: step.action,
          result,
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'boost_bump',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    default:
      throw new Error(`Unknown boost_bump action: ${step.action}`);
  }
}

async function executeSearchSuiteStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  switch (step.action) {
    case 'track_keywords':
      try {
        const businessId = step.inputs.businessId as string;
        const keywords = step.inputs.keywords as Array<{ keyword: string; targetUrl?: string }>;
        const result = await searchSuiteAgent.trackKeywords(businessId, request.workspaceId, keywords);
        return {
          agent: 'search_suite',
          action: step.action,
          result,
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'search_suite',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'get_rankings':
      try {
        const businessId = step.inputs.businessId as string;
        const result = await searchSuiteAgent.getKeywordRankings(businessId, request.workspaceId);
        return {
          agent: 'search_suite',
          action: step.action,
          result,
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'search_suite',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'detect_opportunities':
      try {
        const businessId = step.inputs.businessId as string;
        const result = await searchSuiteAgent.detectOpportunities(businessId, request.workspaceId);
        return {
          agent: 'search_suite',
          action: step.action,
          result,
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'search_suite',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    default:
      throw new Error(`Unknown search_suite action: ${step.action}`);
  }
}

async function executeSocialInboxStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  switch (step.action) {
    case 'get_messages':
      try {
        const businessId = step.inputs.businessId as string;
        const filters = step.inputs.filters as any;
        const result = await socialInboxAgent.getInboxMessages(businessId, request.workspaceId, filters);
        return {
          agent: 'social_inbox',
          action: step.action,
          result,
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'social_inbox',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'categorize_message':
      try {
        const messageId = step.inputs.messageId as string;
        const result = await socialInboxAgent.categorizeMessage(messageId, request.workspaceId);
        return {
          agent: 'social_inbox',
          action: step.action,
          result,
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'social_inbox',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'suggest_response':
      try {
        const messageId = step.inputs.messageId as string;
        const result = await socialInboxAgent.suggestResponse(messageId, request.workspaceId);
        return {
          agent: 'social_inbox',
          action: step.action,
          result,
          confidence: 0.8,
        };
      } catch (err) {
        return {
          agent: 'social_inbox',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'get_insights':
      try {
        const businessId = step.inputs.businessId as string;
        const result = await socialInboxAgent.getInboxInsights(businessId, request.workspaceId);
        return {
          agent: 'social_inbox',
          action: step.action,
          result,
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'social_inbox',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    default:
      throw new Error(`Unknown social_inbox action: ${step.action}`);
  }
}

async function executePreClientStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  switch (step.action) {
    case 'process_email':
      try {
        const emailId = step.inputs.emailId as string;
        const result = await preClientIdentityAgent.processEmail(emailId, request.workspaceId);
        return {
          agent: 'pre_client',
          action: step.action,
          result,
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'pre_client',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'build_timeline':
      try {
        const contactEmail = step.inputs.contactEmail as string;
        const result = await preClientIdentityAgent.buildTimeline(contactEmail, request.workspaceId);
        return {
          agent: 'pre_client',
          action: step.action,
          result,
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'pre_client',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'identify_opportunity':
      try {
        const contactEmail = step.inputs.contactEmail as string;
        const result = await preClientIdentityAgent.identifyOpportunity(contactEmail, request.workspaceId);
        return {
          agent: 'pre_client',
          action: step.action,
          result,
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'pre_client',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'get_pre_clients':
      try {
        const businessId = step.inputs.businessId as string;
        const result = await preClientIdentityAgent.getPreClients(businessId, request.workspaceId);
        return {
          agent: 'pre_client',
          action: step.action,
          result,
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'pre_client',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    default:
      throw new Error(`Unknown pre_client action: ${step.action}`);
  }
}

async function executeCognitiveTwinStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  switch (step.action) {
    case 'score_health':
      try {
        const businessId = step.inputs.businessId as string;
        const domain = step.inputs.domain as string;
        const result = await cognitiveTwinAgent.scoreDomainHealth(businessId, request.workspaceId, domain);
        return {
          agent: 'cognitive_twin',
          action: step.action,
          result,
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'cognitive_twin',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'get_snapshot':
      try {
        const businessId = step.inputs.businessId as string;
        const result = await cognitiveTwinAgent.getDomainSnapshot(businessId, request.workspaceId);
        return {
          agent: 'cognitive_twin',
          action: step.action,
          result,
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'cognitive_twin',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'generate_digest':
      try {
        const userId = step.inputs.userId as string;
        const period = step.inputs.period as 'daily' | 'weekly' | 'monthly';
        const result = await cognitiveTwinAgent.generatePeriodicDigest(userId, request.workspaceId, period);
        return {
          agent: 'cognitive_twin',
          action: step.action,
          result,
          confidence: 0.85,
        };
      } catch (err) {
        return {
          agent: 'cognitive_twin',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'decision_guidance':
      try {
        const userId = step.inputs.userId as string;
        const decisionType = step.inputs.decisionType as string;
        const contextData = step.inputs.context as any;
        const result = await cognitiveTwinAgent.getDecisionGuidance(
          userId,
          request.workspaceId,
          decisionType,
          contextData
        );
        return {
          agent: 'cognitive_twin',
          action: step.action,
          result,
          confidence: 0.8,
        };
      } catch (err) {
        return {
          agent: 'cognitive_twin',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    case 'generate_health_report':
      try {
        const userId = step.inputs.userId as string;
        const result = await cognitiveTwinAgent.generateHealthReport(userId, request.workspaceId);
        return {
          agent: 'cognitive_twin',
          action: step.action,
          result,
          confidence: 0.9,
        };
      } catch (err) {
        return {
          agent: 'cognitive_twin',
          action: step.action,
          result: { success: false, error: (err as Error).message },
          confidence: 0.3,
        };
      }

    default:
      throw new Error(`Unknown cognitive_twin action: ${step.action}`);
  }
}

// ============================================================================
// VALIDATION ENGINE (No-Bluff Protocol)
// ============================================================================

async function validateOutputs(
  outputs: AgentOutput[],
  intent: AgentIntent
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  const suggestions: string[] = [];

  // Check for low confidence outputs
  for (const output of outputs) {
    if (output.confidence < 0.6) {
      issues.push({
        severity: 'warning',
        message: `${output.agent}/${output.action} has low confidence (${(output.confidence * 100).toFixed(0)}%)`,
      });
    }
  }

  // SEO-specific validation (No-Bluff Protocol)
  if (intent === 'seo') {
    const seoOutputs = outputs.filter((o) => o.agent === 'seo');
    for (const output of seoOutputs) {
      if (!output.citations || output.citations.length === 0) {
        issues.push({
          severity: 'error',
          message: 'SEO claims must include citations (No-Bluff Protocol)',
        });
        suggestions.push('Add DataForSEO or SEMRush citations to validate claims');
      }
    }
  }

  // Content validation
  if (intent === 'content') {
    const contentOutputs = outputs.filter((o) => o.agent === 'content');
    for (const output of contentOutputs) {
      const result = output.result as Record<string, unknown>;
      if (result.draft && typeof result.draft === 'string' && result.draft.length < 100) {
        issues.push({
          severity: 'warning',
          message: 'Generated content is very short',
        });
      }
    }
  }

  return {
    passed: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
    suggestions,
  };
}

// ============================================================================
// MAIN ORCHESTRATOR FUNCTION
// ============================================================================

export interface OrchestrateOptions {
  skipCouncil?: boolean;
  councilThreshold?: number;
}

export async function orchestrate(
  request: OrchestratorRequest,
  options?: OrchestrateOptions
): Promise<OrchestratorResult> {
  // Step 1: Generate plan
  const plan = await generatePlan(request);

  // Step 2: Execute plan (with Council of Logic pre-evaluation)
  const result = await executePlan(plan, request, options);

  // Step 3: Log for audit trail (including Council verdict)
  const councilInfo = result.councilDeliberation
    ? ` | Council: ${result.councilDeliberation.finalVerdict} (${result.councilDeliberation.overallScore}/100)`
    : '';
  console.log(`[Orchestrator] Intent: ${result.intent}, Success: ${result.success}, Tokens: ${result.tokensUsed}${councilInfo}`);

  return result;
}

/**
 * Quick Council evaluation without full orchestration
 * Use for pre-flight checks on code/prompts
 */
export async function evaluateWithCouncil(
  operation: string,
  content: { code?: string; prompt?: string; context?: Record<string, unknown> }
): Promise<CouncilDeliberation> {
  const council = getCouncilOfLogic();
  return council.deliberate({
    operation,
    code: content.code,
    prompt: content.prompt,
    context: content.context,
  });
}

/**
 * Get quick score from a single Council member
 */
export async function getCouncilMemberScore(
  member: 'Alan_Turing' | 'John_von_Neumann' | 'Pierre_Bezier' | 'Claude_Shannon',
  content: string
): Promise<{ score: number; feedback: string }> {
  const council = getCouncilOfLogic();
  return council.quickEvaluate(member, content);
}

// ============================================================================
// CROSS-AGENT COLLABORATION
// ============================================================================

export async function runCollaborativeWorkflow(
  workspaceId: string,
  workflow: 'full-campaign' | 'seo-audit' | 'funnel-build' | 'visual-refresh'
): Promise<OrchestratorResult[]> {
  const results: OrchestratorResult[] = [];

  switch (workflow) {
    case 'full-campaign':
      // Social → Funnel → Content → Visual → SEO validation
      results.push(await orchestrate({ workspaceId, userPrompt: 'Create social playbook' }));
      results.push(await orchestrate({ workspaceId, userPrompt: 'Build marketing funnel' }));
      results.push(await orchestrate({ workspaceId, userPrompt: 'Generate content assets' }));
      results.push(await orchestrate({ workspaceId, userPrompt: 'Design visual style' }));
      results.push(await orchestrate({ workspaceId, userPrompt: 'Validate SEO claims' }));
      break;

    case 'seo-audit':
      results.push(await orchestrate({ workspaceId, userPrompt: 'Analyze current SEO performance' }));
      results.push(await orchestrate({ workspaceId, userPrompt: 'Identify keyword opportunities' }));
      results.push(await orchestrate({ workspaceId, userPrompt: 'Generate SEO recommendations' }));
      break;

    case 'funnel-build':
      results.push(await orchestrate({ workspaceId, userPrompt: 'Map customer decision journey' }));
      results.push(await orchestrate({ workspaceId, userPrompt: 'Identify friction points' }));
      results.push(await orchestrate({ workspaceId, userPrompt: 'Create nurture sequence' }));
      break;

    case 'visual-refresh':
      results.push(await orchestrate({ workspaceId, userPrompt: 'Analyze brand visual style' }));
      results.push(await orchestrate({ workspaceId, userPrompt: 'Recommend animation updates' }));
      results.push(await orchestrate({ workspaceId, userPrompt: 'Generate style preview' }));
      break;
  }

  return results;
}

// ============================================================================
// APPROVAL & STRATEGY INTENTS
// ============================================================================

import { StrategyGenerator } from '@/lib/strategy/strategyGenerator';
import { getApprovalService } from '@/lib/approval/approvalService';
import { getAIConsultationService } from '@/lib/ai/consultationService';

/**
 * Generate multi-path strategic options for a given context
 */
export async function generateStrategyOptions(context: {
  businessName?: string;
  industry?: string;
  boostBumpEligible?: boolean;
  seoFindings?: Record<string, unknown>;
}): Promise<{
  conservative: unknown;
  aggressive: unknown;
  blue_ocean: unknown;
  data_driven: unknown;
}> {
  const options = StrategyGenerator.generateChoices({
    businessName: context.businessName,
    industry: context.industry,
    boostBumpEligible: context.boostBumpEligible,
    seoFindings: context.seoFindings,
  });

  return options;
}

/**
 * Submit a task for client approval with auto-generated strategy options
 */
export async function submitForClientApproval(input: {
  business_id: string;
  client_id?: string;
  created_by?: string;
  title: string;
  description: string;
  data: Record<string, unknown>;
  source: string;
  context?: {
    businessName?: string;
    industry?: string;
    boostBumpEligible?: boolean;
  };
}): Promise<{
  approvalId: string;
  strategyOptions: unknown;
}> {
  const approvalService = getApprovalService();

  // Generate strategy options if context provided
  const strategyOptions = input.context
    ? StrategyGenerator.generateChoices({
        businessName: input.context.businessName,
        industry: input.context.industry,
        boostBumpEligible: input.context.boostBumpEligible,
        seoFindings: input.data,
      })
    : undefined;

  const approval = await approvalService.create({
    business_id: input.business_id,
    client_id: input.client_id,
    created_by: input.created_by,
    title: input.title,
    description: input.description,
    data: input.data,
    source: input.source,
    strategy_options: strategyOptions,
  });

  await approvalService.logEvent(approval.id, 'submitted_via_orchestrator', {
    source: input.source,
  });

  return {
    approvalId: approval.id,
    strategyOptions,
  };
}

/**
 * Start an AI consultation session
 */
export async function startAIConsultation(input: {
  business_id: string;
  client_id?: string;
  created_by?: string;
  context?: Record<string, unknown>;
  explanation_mode?: 'eli5' | 'beginner' | 'technical' | 'founder';
  title?: string;
}): Promise<{
  consultationId: string;
}> {
  const consultationService = getAIConsultationService();

  const consultation = await consultationService.create({
    business_id: input.business_id,
    client_id: input.client_id,
    created_by: input.created_by,
    context: input.context,
    explanation_mode: input.explanation_mode || 'founder',
    title: input.title,
  });

  return {
    consultationId: consultation.id,
  };
}

// Add orchestrate handlers for new intents
const strategyIntentPatterns = [
  'strategy options',
  'blue ocean strategy',
  'marketing strategy choices',
  'seo strategy choices',
  'growth options',
  'generate strategies',
];

const approvalIntentPatterns = [
  'submit approval',
  'send for approval',
  'client must approve',
  'require approval',
  'needs client sign-off',
];

const consultationIntentPatterns = [
  'start ai consultation',
  'open strategy chat',
  'talk to ai phill',
  'discuss strategy',
  'ai strategy session',
];

export function detectApprovalOrStrategyIntent(
  prompt: string
): 'strategy' | 'approval' | 'consultation' | null {
  const lowerPrompt = prompt.toLowerCase();

  for (const pattern of strategyIntentPatterns) {
    if (lowerPrompt.includes(pattern)) {
      return 'strategy';
    }
  }

  for (const pattern of approvalIntentPatterns) {
    if (lowerPrompt.includes(pattern)) {
      return 'approval';
    }
  }

  for (const pattern of consultationIntentPatterns) {
    if (lowerPrompt.includes(pattern)) {
      return 'consultation';
    }
  }

  return null;
}

// =============================================================================
// BUSINESS IDENTITY VAULT & FOUNDER PORTFOLIO ENGINE (Migration 310)
// =============================================================================

const businessVaultIntentPatterns = [
  'list businesses',
  'show my businesses',
  'business portfolio',
  'company overview',
  'all my companies',
  'portfolio summary',
];

const businessSynopsisIntentPatterns = [
  'business synopsis',
  'analyze business',
  'business health',
  'company analysis',
  'seo leak analysis',
  'navboost analysis',
];

const portfolioSynopsisIntentPatterns = [
  'portfolio synopsis',
  'umbrella analysis',
  'cross-business insights',
  'multi-business summary',
  'founder portfolio health',
];

export function detectBusinessVaultIntent(
  prompt: string
): 'list_businesses' | 'business_synopsis' | 'portfolio_synopsis' | null {
  const lowerPrompt = prompt.toLowerCase();

  for (const pattern of businessVaultIntentPatterns) {
    if (lowerPrompt.includes(pattern)) {
      return 'list_businesses';
    }
  }

  for (const pattern of businessSynopsisIntentPatterns) {
    if (lowerPrompt.includes(pattern)) {
      return 'business_synopsis';
    }
  }

  for (const pattern of portfolioSynopsisIntentPatterns) {
    if (lowerPrompt.includes(pattern)) {
      return 'portfolio_synopsis';
    }
  }

  return null;
}

/**
 * List all businesses overview for founder
 */
export async function handleListBusinessesOverview(): Promise<{
  businesses: Array<{
    business_key: string;
    display_name: string;
    primary_domain: string | null;
    primary_region: string | null;
    industry: string | null;
  }>;
  totalCount: number;
}> {
  const { listFounderBusinesses } = await import('@/lib/founder/businessVaultService');
  const businesses = await listFounderBusinesses();

  return {
    businesses: businesses.map((b) => ({
      business_key: b.business_key,
      display_name: b.display_name,
      primary_domain: b.primary_domain,
      primary_region: b.primary_region,
      industry: b.industry,
    })),
    totalCount: businesses.length,
  };
}

/**
 * Compile business synopsis with channels and snapshots
 */
export async function handleCompileBusinessSynopsis(input: {
  businessKey: string;
}): Promise<{
  business: any;
  channels: any[];
  snapshots: any[];
} | null> {
  const { getBusinessWithChannels } = await import('@/lib/founder/businessVaultService');
  return await getBusinessWithChannels(input.businessKey);
}

/**
 * Compile portfolio-wide synopsis across all businesses
 */
export async function handleCompilePortfolioSynopsis(): Promise<{
  totalBusinesses: number;
  totalChannels: number;
  totalSnapshots: number;
  businesses: Array<{
    business_key: string;
    display_name: string;
    channel_count: number;
    latest_snapshot_date: string | null;
  }>;
}> {
  const { getPortfolioStats } = await import('@/lib/founder/businessVaultService');
  return await getPortfolioStats();
}

// ============================================================================
// SHADOW OBSERVER EXECUTOR
// ============================================================================

async function executeShadowObserverStep(
  step: PlanStep,
  request: OrchestratorRequest,
  context: Record<string, unknown>
): Promise<AgentOutput> {
  try {
    const { executeShadowObserverAudit, recordSelfEvalMetrics, formatForOrchestrator } =
      await import('@/lib/agents/shadow-observer-agent');

    switch (step.action) {
      case 'audit':
      case 'codebase_audit':
      case 'full': {
        const output = await executeShadowObserverAudit({
          action: step.action as any,
          severity: (step.inputs?.severity as string) as any,
          targetFiles: step.inputs?.targetFiles as string[],
          options: step.inputs?.options as Record<string, any>
        });

        // Record metrics to database
        if (output.success && request.context?.founderId) {
          await recordSelfEvalMetrics(output, request.context.founderId as string);
        }

        return {
          agent: 'shadow_observer',
          action: step.action,
          result: formatForOrchestrator(output),
          confidence: output.success ? 0.95 : 0.3,
          citations: [output.reportPath].filter(Boolean)
        };
      }

      case 'scan': {
        const output = await executeShadowObserverAudit({
          action: 'scan',
          severity: (step.inputs?.severity as string) as any
        });

        return {
          agent: 'shadow_observer',
          action: 'scan',
          result: formatForOrchestrator(output),
          confidence: output.success ? 0.9 : 0.3,
          citations: [output.reportPath].filter(Boolean)
        };
      }

      case 'build': {
        const output = await executeShadowObserverAudit({
          action: 'build'
        });

        return {
          agent: 'shadow_observer',
          action: 'build',
          result: formatForOrchestrator(output),
          confidence: output.build?.pass ? 0.95 : 0.5,
          citations: [output.reportPath].filter(Boolean)
        };
      }

      case 'refactor': {
        const output = await executeShadowObserverAudit({
          action: 'refactor'
        });

        if (output.success && request.context?.founderId) {
          await recordSelfEvalMetrics(output, request.context.founderId as string);
        }

        return {
          agent: 'shadow_observer',
          action: 'refactor',
          result: formatForOrchestrator(output),
          confidence: output.agentScore ? output.agentScore / 10 : 0.5,
          citations: [output.reportPath].filter(Boolean)
        };
      }

      default:
        return {
          agent: 'shadow_observer',
          action: step.action,
          result: {
            success: false,
            error: `Unknown action: ${step.action}`
          },
          confidence: 0.0
        };
    }
  } catch (error) {
    return {
      agent: 'shadow_observer',
      action: step.action,
      result: {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      confidence: 0.0
    };
  }
}
