/**
 * Unified Agent Registry
 *
 * Smart routing system for automatically selecting the appropriate agent
 * based on task analysis. Provides canonical agent definitions with version
 * tracking and validation.
 *
 * Now enhanced with Agents Protocol v1.0 Agent Cards for structured
 * boundaries, permissions, delegation rules, and state management.
 *
 * Features:
 * - Task analysis and automatic routing
 * - Agent capability matching
 * - Priority-based selection
 * - Validation and health checks
 * - Performance tracking
 * - Agent Card protocol compliance (v1.0)
 *
 * Usage:
 *   import { routeTask, getAgent, getAgentCard, validateAgentRegistry } from '@/lib/agents/unified-registry';
 *
 *   // Automatic routing
 *   const agentId = await routeTask('Fix the login button on dashboard');
 *   // Returns: 'frontend'
 *
 *   // Get agent details (legacy)
 *   const agent = getAgent('email-agent');
 *
 *   // Get Agent Card (Protocol v1.0)
 *   const card = getAgentCard('email-agent');
 *   console.log(card.boundaries, card.permissions, card.delegationRules);
 */

import {
  type AgentCard,
  type AgentState,
  createAgentCard,
  createDefaultBoundaries,
  createDefaultPermissions,
} from './protocol';

export type UnifiedAgentId =
  | 'orchestrator'
  | 'email-agent'
  | 'content-agent'
  | 'frontend'
  | 'backend'
  | 'seo'
  | 'founder-os'
  | 'ai-phill'
  | 'seo-leak'
  | 'cognitive-twin'
  | 'social-inbox'
  | 'search-suite'
  | 'pre-client-identity'
  | 'whatsapp-intelligence'
  | 'boost-bump';

export interface AgentCapability {
  /** Capability name */
  name: string;
  /** Keywords associated with this capability */
  keywords: string[];
  /** Confidence threshold (0-1) */
  confidence: number;
}

export interface AgentDefinition {
  /** Unique agent identifier */
  id: UnifiedAgentId;
  /** Display name */
  name: string;
  /** Agent role/purpose */
  role: string;
  /** Priority (1 = highest, 5 = lowest) */
  priority: number;
  /** Version */
  version: string;
  /** Operational status */
  status: 'active' | 'disabled' | 'maintenance';
  /** File location */
  location: string;
  /** Agent capabilities */
  capabilities: AgentCapability[];
  /** When to use this agent */
  useCases: string[];
  /** AI model to use */
  model: 'opus' | 'sonnet' | 'haiku';
  /** Uses Extended Thinking */
  thinking?: boolean;
}

/**
 * Canonical agent registry
 */
export const AGENT_REGISTRY: Record<UnifiedAgentId, AgentDefinition> = {
  orchestrator: {
    id: 'orchestrator',
    name: 'Orchestrator',
    role: 'Master Coordinator',
    priority: 1,
    version: '2.0.0',
    status: 'active',
    location: '.claude/agents/orchestrator/',
    model: 'sonnet',
    capabilities: [
      {
        name: 'Task Coordination',
        keywords: ['coordinate', 'orchestrate', 'manage', 'workflow', 'multi-step', 'complex'],
        confidence: 0.9,
      },
      {
        name: 'Agent Routing',
        keywords: ['route', 'delegate', 'assign', 'distribute'],
        confidence: 0.95,
      },
      {
        name: 'Multi-Agent Operations',
        keywords: ['multiple', 'several', 'various', 'different agents'],
        confidence: 0.9,
      },
    ],
    useCases: [
      'Complex tasks requiring multiple agents',
      'Multi-step workflow coordination',
      'Task routing decisions',
      'Cross-functional operations',
    ],
  },

  'email-agent': {
    id: 'email-agent',
    name: 'Email Agent',
    role: 'Email Processing Specialist',
    priority: 2,
    version: '2.0.0',
    status: 'active',
    location: '.claude/agents/email-agent/',
    model: 'sonnet',
    capabilities: [
      {
        name: 'Email Processing',
        keywords: ['email', 'gmail', 'inbox', 'message', 'sender'],
        confidence: 0.95,
      },
      {
        name: 'Intent Extraction',
        keywords: ['intent', 'classification', 'categorize', 'analyze email'],
        confidence: 0.9,
      },
      {
        name: 'Lead Scoring',
        keywords: ['score', 'qualify', 'lead', 'engagement'],
        confidence: 0.85,
      },
    ],
    useCases: [
      'Processing incoming emails',
      'Email intelligence extraction',
      'Contact scoring updates',
      'Gmail integration tasks',
      'Email-based lead qualification',
    ],
  },

  'content-agent': {
    id: 'content-agent',
    name: 'Content Agent',
    role: 'Content Generation Specialist',
    priority: 2,
    version: '2.0.0',
    status: 'active',
    location: '.claude/agents/content-agent/',
    model: 'opus',
    thinking: true,
    capabilities: [
      {
        name: 'Content Generation',
        keywords: ['content', 'write', 'generate', 'create', 'compose'],
        confidence: 0.95,
      },
      {
        name: 'Marketing Copy',
        keywords: ['marketing', 'campaign', 'copy', 'email campaign', 'proposal'],
        confidence: 0.9,
      },
      {
        name: 'Personalization',
        keywords: ['personalized', 'customized', 'tailored', 'specific to'],
        confidence: 0.85,
      },
    ],
    useCases: [
      'Generating personalized content for warm leads',
      'Creating email campaign content',
      'Drafting proposals or case studies',
      'Content requiring strategic depth',
      'High-value content generation',
    ],
  },

  frontend: {
    id: 'frontend',
    name: 'Frontend Specialist',
    role: 'UI/Component Specialist',
    priority: 3,
    version: '2.0.0',
    status: 'active',
    location: '.claude/agents/frontend-specialist/',
    model: 'sonnet',
    capabilities: [
      {
        name: 'UI Development',
        keywords: ['ui', 'interface', 'component', 'page', 'layout', 'design'],
        confidence: 0.95,
      },
      {
        name: 'React Development',
        keywords: ['react', 'jsx', 'tsx', 'component', 'hook', 'state'],
        confidence: 0.9,
      },
      {
        name: 'Styling',
        keywords: ['css', 'style', 'tailwind', 'responsive', 'design'],
        confidence: 0.85,
      },
      {
        name: 'Frontend Bugs',
        keywords: ['button', 'form', 'input', 'click', 'display', 'render'],
        confidence: 0.8,
      },
    ],
    useCases: [
      'UI bug fixes',
      'New component development',
      'Page routing issues',
      'Styling and design work',
      'Client-side functionality',
      'Dashboard improvements',
    ],
  },

  backend: {
    id: 'backend',
    name: 'Backend Specialist',
    role: 'API/Database Specialist',
    priority: 3,
    version: '2.0.0',
    status: 'active',
    location: '.claude/agents/backend-specialist/',
    model: 'sonnet',
    capabilities: [
      {
        name: 'API Development',
        keywords: ['api', 'endpoint', 'route', 'server', 'backend'],
        confidence: 0.95,
      },
      {
        name: 'Database Operations',
        keywords: ['database', 'db', 'sql', 'query', 'migration', 'schema'],
        confidence: 0.9,
      },
      {
        name: 'RLS Policies',
        keywords: ['rls', 'security', 'permission', 'access control'],
        confidence: 0.85,
      },
      {
        name: 'Authentication',
        keywords: ['auth', 'login', 'session', 'token', 'oauth'],
        confidence: 0.8,
      },
    ],
    useCases: [
      'API endpoint development',
      'Database schema changes',
      'RLS policy work',
      'Authentication issues',
      'Integration work',
      'Backend performance optimization',
    ],
  },

  seo: {
    id: 'seo',
    name: 'SEO Intelligence',
    role: 'SEO Research & Analysis Specialist',
    priority: 3,
    version: '2.0.0',
    status: 'active',
    location: '.claude/agents/seo-intelligence/',
    model: 'sonnet',
    capabilities: [
      {
        name: 'SEO Research',
        keywords: ['seo', 'search', 'ranking', 'keyword', 'optimization'],
        confidence: 0.95,
      },
      {
        name: 'Competitor Analysis',
        keywords: ['competitor', 'competition', 'analysis', 'compare'],
        confidence: 0.85,
      },
      {
        name: 'Content Optimization',
        keywords: ['optimize', 'improve seo', 'meta', 'schema'],
        confidence: 0.8,
      },
    ],
    useCases: [
      'SEO research and trends',
      'Keyword strategy development',
      'Competitor SEO analysis',
      'Content optimization guidance',
      'Technical SEO audits',
      'Schema markup needs',
    ],
  },

  'founder-os': {
    id: 'founder-os',
    name: 'Founder OS',
    role: 'Founder Intelligence System',
    priority: 2,
    version: '2.0.0',
    status: 'active',
    location: '.claude/agents/founder-os/',
    model: 'opus',
    thinking: true,
    capabilities: [
      {
        name: 'Strategic Analysis',
        keywords: ['strategy', 'strategic', 'business', 'decision', 'founder'],
        confidence: 0.9,
      },
      {
        name: 'Multi-Business Management',
        keywords: ['multiple businesses', 'portfolio', 'brands'],
        confidence: 0.85,
      },
      {
        name: 'Business Intelligence',
        keywords: ['intelligence', 'insights', 'analytics', 'health'],
        confidence: 0.8,
      },
    ],
    useCases: [
      'Founder-level strategic decisions',
      'Multi-business operations',
      'Business health monitoring',
      'Strategic insights and recommendations',
      'Cross-business intelligence',
      'Decision momentum tracking',
    ],
  },

  'ai-phill': {
    id: 'ai-phill',
    name: 'AI Phill',
    role: 'Strategic Advisor & Thinking Partner',
    priority: 2,
    version: '1.0.0',
    status: 'active',
    location: '.claude/agents/ai-phill/',
    model: 'opus',
    thinking: true,
    capabilities: [
      {
        name: 'Strategic Dialogue',
        keywords: ['advice', 'think', 'strategy', 'reflect', 'journal', 'dialogue'],
        confidence: 0.9,
      },
      {
        name: 'Risk Assessment',
        keywords: ['risk', 'opportunity', 'assess', 'evaluate', 'decision'],
        confidence: 0.85,
      },
      {
        name: 'Business Digest',
        keywords: ['digest', 'weekly', 'summary', 'recap', 'overview'],
        confidence: 0.8,
      },
    ],
    useCases: [
      'Strategic business advice via Socratic dialogue',
      'Guided journal entries and founder reflection',
      'Risk and opportunity assessment',
      'Weekly business digests',
      'Decision analysis frameworks',
    ],
  },

  'seo-leak': {
    id: 'seo-leak',
    name: 'SEO Leak Agent',
    role: 'SEO Signal Intelligence Specialist',
    priority: 3,
    version: '1.0.0',
    status: 'active',
    location: '.claude/agents/seo-leak/',
    model: 'sonnet',
    capabilities: [
      {
        name: 'Leak Signal Analysis',
        keywords: ['leak', 'navboost', 'q-star', 'ranking factors', 'yandex'],
        confidence: 0.95,
      },
      {
        name: 'SEO Audit',
        keywords: ['audit', 'technical seo', 'crawl', 'indexing', 'sitemap'],
        confidence: 0.9,
      },
      {
        name: 'E-E-A-T Assessment',
        keywords: ['eeat', 'expertise', 'authority', 'trust', 'experience'],
        confidence: 0.85,
      },
      {
        name: 'Schema Generation',
        keywords: ['schema', 'structured data', 'json-ld', 'rich snippets'],
        confidence: 0.85,
      },
    ],
    useCases: [
      'Google/DOJ/Yandex leak-informed SEO analysis',
      'Full domain SEO audits with leak profile',
      'Competitive gap analysis',
      'E-E-A-T signal assessment',
      'Optimized schema markup generation',
      'NavBoost potential analysis',
    ],
  },

  'cognitive-twin': {
    id: 'cognitive-twin',
    name: 'Cognitive Twin',
    role: 'Business Health Monitor & Decision Simulator',
    priority: 3,
    version: '1.0.0',
    status: 'active',
    location: '.claude/agents/cognitive-twin/',
    model: 'sonnet',
    capabilities: [
      {
        name: 'Domain Health Scoring',
        keywords: ['health', 'score', 'domain', 'marketing', 'sales', 'finance', 'operations'],
        confidence: 0.9,
      },
      {
        name: 'Decision Simulation',
        keywords: ['simulate', 'decision', 'scenario', 'guidance', 'option'],
        confidence: 0.85,
      },
      {
        name: 'Periodic Digests',
        keywords: ['daily', 'weekly', 'monthly', 'digest', 'report'],
        confidence: 0.8,
      },
    ],
    useCases: [
      'Domain-specific business health scoring',
      'Decision simulation and guidance',
      'Daily/weekly/monthly digest generation',
      'Health trend analysis over time',
      'Cross-domain risk identification',
    ],
  },

  'social-inbox': {
    id: 'social-inbox',
    name: 'Social Inbox Agent',
    role: 'Unified Social Media Inbox Manager',
    priority: 3,
    version: '1.0.0',
    status: 'active',
    location: '.claude/agents/social-inbox/',
    model: 'sonnet',
    capabilities: [
      {
        name: 'Social Message Management',
        keywords: ['social', 'inbox', 'message', 'dm', 'comment', 'mention'],
        confidence: 0.95,
      },
      {
        name: 'Message Categorization',
        keywords: ['categorize', 'classify', 'triage', 'priority', 'label'],
        confidence: 0.9,
      },
      {
        name: 'Response Suggestions',
        keywords: ['respond', 'reply', 'suggest', 'draft response'],
        confidence: 0.85,
      },
    ],
    useCases: [
      'Unified social media inbox across platforms',
      'AI message categorization and triage',
      'Response suggestion generation',
      'Social engagement insights and statistics',
      'Thread management and assignment',
    ],
  },

  'search-suite': {
    id: 'search-suite',
    name: 'Search Suite Agent',
    role: 'Keyword Tracking & SERP Monitor',
    priority: 3,
    version: '1.0.0',
    status: 'active',
    location: '.claude/agents/search-suite/',
    model: 'sonnet',
    capabilities: [
      {
        name: 'Keyword Tracking',
        keywords: ['keyword', 'track', 'rank', 'position', 'serp'],
        confidence: 0.95,
      },
      {
        name: 'Ranking Analysis',
        keywords: ['ranking', 'movement', 'trend', 'gainers', 'losers'],
        confidence: 0.9,
      },
      {
        name: 'Opportunity Detection',
        keywords: ['opportunity', 'quick win', 'low hanging', 'featured snippet'],
        confidence: 0.85,
      },
    ],
    useCases: [
      'Multi-engine keyword ranking tracking (Google, Bing, Brave)',
      'SERP monitoring and change detection',
      'Ranking trend analysis and alerts',
      'SEO opportunity identification',
      'Keyword portfolio management',
    ],
  },

  'pre-client-identity': {
    id: 'pre-client-identity',
    name: 'Pre-Client Identity Agent',
    role: 'Pre-Sales Intelligence & Relationship Builder',
    priority: 2,
    version: '1.0.0',
    status: 'active',
    location: '.claude/agents/pre-client-identity/',
    model: 'sonnet',
    capabilities: [
      {
        name: 'Pre-Client Identification',
        keywords: ['pre-client', 'prospect', 'lead', 'identify', 'incoming'],
        confidence: 0.95,
      },
      {
        name: 'Relationship Timeline',
        keywords: ['timeline', 'relationship', 'touchpoint', 'history'],
        confidence: 0.9,
      },
      {
        name: 'Opportunity Detection',
        keywords: ['opportunity', 'intent', 'signal', 'readiness'],
        confidence: 0.85,
      },
    ],
    useCases: [
      'Email-based pre-client identification',
      'Relationship timeline construction',
      'Opportunity detection from communication patterns',
      'Relationship health analysis',
      'Pre-sales intelligence gathering',
    ],
  },

  'whatsapp-intelligence': {
    id: 'whatsapp-intelligence',
    name: 'WhatsApp Intelligence',
    role: 'WhatsApp Message Analysis & Response Specialist',
    priority: 3,
    version: '1.0.0',
    status: 'active',
    location: '.claude/agents/whatsapp-intelligence/',
    model: 'sonnet',
    capabilities: [
      {
        name: 'WhatsApp Message Analysis',
        keywords: ['whatsapp', 'wa', 'message', 'chat', 'conversation'],
        confidence: 0.95,
      },
      {
        name: 'Sentiment Detection',
        keywords: ['sentiment', 'tone', 'mood', 'feeling', 'urgency'],
        confidence: 0.85,
      },
      {
        name: 'Contact Intelligence',
        keywords: ['contact update', 'scoring', 'profile enrich'],
        confidence: 0.8,
      },
    ],
    useCases: [
      'WhatsApp message analysis and intent detection',
      'Automated response suggestion generation',
      'Conversation-based contact intelligence updates',
      'Sentiment and urgency detection',
      'WhatsApp-to-CRM data synchronization',
    ],
  },

  'boost-bump': {
    id: 'boost-bump',
    name: 'Boost Bump Agent',
    role: 'White-Hat SEO Boost Orchestrator',
    priority: 3,
    version: '1.0.0',
    status: 'active',
    location: '.claude/agents/boost-bump/',
    model: 'sonnet',
    capabilities: [
      {
        name: 'Boost Strategy',
        keywords: ['boost', 'bump', 'promote', 'visibility', 'organic'],
        confidence: 0.95,
      },
      {
        name: 'Content Quality Optimization',
        keywords: ['quality', 'improvement', 'enhance', 'optimize content'],
        confidence: 0.85,
      },
      {
        name: 'Local SEO',
        keywords: ['local', 'geo', 'location', 'google business', 'maps'],
        confidence: 0.8,
      },
    ],
    useCases: [
      'White-hat SEO boost strategy recommendations',
      'Approval-gated boost job execution',
      'Performance tracking and results recording',
      'Content quality and UX optimization',
      'Local visibility enhancement',
    ],
  },
};

/**
 * Analyze task and calculate confidence scores for each agent
 */
function analyzeTask(taskDescription: string): Record<UnifiedAgentId, number> {
  const lowerTask = taskDescription.toLowerCase();
  const scores: Record<UnifiedAgentId, number> = {} as any;

  for (const [id, agent] of Object.entries(AGENT_REGISTRY)) {
    let totalScore = 0;
    let matchCount = 0;

    for (const capability of agent.capabilities) {
      for (const keyword of capability.keywords) {
        if (lowerTask.includes(keyword)) {
          totalScore += capability.confidence;
          matchCount++;
        }
      }
    }

    // Normalize score
    scores[id as UnifiedAgentId] = matchCount > 0 ? totalScore / matchCount : 0;
  }

  return scores;
}

/**
 * Route task to appropriate agent
 */
export function routeTask(taskDescription: string): UnifiedAgentId {
  const scores = analyzeTask(taskDescription);

  // Find highest scoring agent
  let bestAgent: UnifiedAgentId = 'orchestrator';
  let bestScore = 0;

  for (const [id, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestAgent = id as UnifiedAgentId;
    }
  }

  // If confidence is low, use orchestrator
  if (bestScore < 0.5) {
    console.log(
      `⚠️ Low confidence (${bestScore.toFixed(2)}) for task routing. Defaulting to Orchestrator.`
    );
    return 'orchestrator';
  }

  // If task has multiple high-scoring agents, use orchestrator
  const highScoreAgents = Object.entries(scores).filter(([, score]) => score > 0.7);
  if (highScoreAgents.length > 2) {
    console.log(
      `⚠️ Multiple agents match (${highScoreAgents.length}). Routing to Orchestrator for coordination.`
    );
    return 'orchestrator';
  }

  console.log(
    `✅ Task routed to ${AGENT_REGISTRY[bestAgent].name} (confidence: ${bestScore.toFixed(2)})`
  );
  return bestAgent;
}

/**
 * Get agent definition
 */
export function getAgent(id: UnifiedAgentId): AgentDefinition {
  const agent = AGENT_REGISTRY[id];
  if (!agent) {
    throw new Error(`Agent not found: ${id}`);
  }
  return agent;
}

/**
 * Get all active agents
 */
export function getActiveAgents(): AgentDefinition[] {
  return Object.values(AGENT_REGISTRY).filter((agent) => agent.status === 'active');
}

/**
 * Get agents by priority
 */
export function getAgentsByPriority(priority: number): AgentDefinition[] {
  return Object.values(AGENT_REGISTRY).filter((agent) => agent.priority === priority);
}

/**
 * Validate agent registry
 */
export function validateAgentRegistry(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check all agents have required fields
  for (const [id, agent] of Object.entries(AGENT_REGISTRY)) {
    if (!agent.name) {
      errors.push(`Agent ${id} missing name`);
    }
    if (!agent.role) {
      errors.push(`Agent ${id} missing role`);
    }
    if (!agent.location) {
      errors.push(`Agent ${id} missing location`);
    }
    if (!agent.capabilities || agent.capabilities.length === 0) {
      warnings.push(`Agent ${id} has no capabilities defined`);
    }
    if (!agent.useCases || agent.useCases.length === 0) {
      warnings.push(`Agent ${id} has no use cases defined`);
    }
  }

  // Check for duplicate IDs
  const ids = Object.keys(AGENT_REGISTRY);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    errors.push('Duplicate agent IDs detected');
  }

  // Check for conflicting priorities
  const priorityGroups = Object.values(AGENT_REGISTRY).reduce(
    (acc, agent) => {
      if (!acc[agent.priority]) acc[agent.priority] = [];
      acc[agent.priority].push(agent.name);
      return acc;
    },
    {} as Record<number, string[]>
  );

  // Orchestrator should be priority 1
  if (AGENT_REGISTRY.orchestrator.priority !== 1) {
    errors.push('Orchestrator should have priority 1');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get agent skill path
 */
export function getSkillPath(id: UnifiedAgentId): string {
  const agent = AGENT_REGISTRY[id];
  return `${agent.location}agent.md`;
}

/**
 * Get agent status summary
 */
export function getAgentStatusSummary(): {
  total: number;
  active: number;
  disabled: number;
  maintenance: number;
} {
  const agents = Object.values(AGENT_REGISTRY);

  return {
    total: agents.length,
    active: agents.filter((a) => a.status === 'active').length,
    disabled: agents.filter((a) => a.status === 'disabled').length,
    maintenance: agents.filter((a) => a.status === 'maintenance').length,
  };
}

/**
 * Search agents by capability
 */
export function searchAgentsByCapability(capabilityKeyword: string): AgentDefinition[] {
  const lowerKeyword = capabilityKeyword.toLowerCase();

  return Object.values(AGENT_REGISTRY).filter((agent) =>
    agent.capabilities.some((cap) =>
      cap.keywords.some((keyword) => keyword.includes(lowerKeyword))
    )
  );
}

/**
 * Get recommended agent for task with explanation
 */
export function getRecommendedAgent(taskDescription: string): {
  agentId: UnifiedAgentId;
  agent: AgentDefinition;
  confidence: number;
  reasoning: string;
} {
  const scores = analyzeTask(taskDescription);
  const agentId = routeTask(taskDescription);
  const agent = getAgent(agentId);

  const reasoning =
    scores[agentId] > 0.7
      ? `High confidence match based on task keywords`
      : scores[agentId] > 0.5
        ? `Moderate confidence match, agent capabilities align`
        : `Low confidence, routing to Orchestrator for analysis`;

  return {
    agentId,
    agent,
    confidence: scores[agentId],
    reasoning,
  };
}

// ============================================================================
// Agent Cards (Agents Protocol v1.0)
// ============================================================================

const ALL_AGENT_IDS: UnifiedAgentId[] = [
  'orchestrator',
  'email-agent',
  'content-agent',
  'frontend',
  'backend',
  'seo',
  'founder-os',
  'ai-phill',
  'seo-leak',
  'cognitive-twin',
  'social-inbox',
  'search-suite',
  'pre-client-identity',
  'whatsapp-intelligence',
  'boost-bump',
];

/**
 * Protocol v1.0 Agent Cards with structured boundaries, permissions,
 * delegation rules, and state management. These extend the existing
 * AGENT_REGISTRY definitions with protocol-compliant metadata.
 */
export const AGENT_CARDS: Record<UnifiedAgentId, AgentCard> = {
  orchestrator: createAgentCard({
    id: 'orchestrator',
    name: 'Orchestrator',
    type: 'orchestrator',
    role: 'Master Coordinator',
    description: 'Routes tasks, coordinates multi-agent workflows, manages context and resources.',
    modelTier: 'sonnet',
    priority: 1,
    location: '.claude/agents/orchestrator/',
    capabilities: AGENT_REGISTRY.orchestrator.capabilities.map((cap, i) => ({
      id: `orchestrator-cap-${i}`,
      name: cap.name,
      description: `${cap.name} capability`,
      keywords: cap.keywords,
      confidence: cap.confidence,
    })),
    useCases: AGENT_REGISTRY.orchestrator.useCases,
    boundaries: {
      maxExecutionTimeMs: 600_000,
      maxTokensPerRequest: 200_000,
      maxRequestsPerMinute: 120,
      canSpawnSubAgents: true,
      maxConcurrentSubAgents: 5,
      fileSystemAccess: 'read',
      maxPlanSteps: 30,
      maxRetries: 3,
    },
    permissions: {
      tier: 'system',
      canReadDatabase: true,
      canWriteDatabase: true,
      canCallExternalAPIs: true,
      canSendMessages: false,
      canModifyFiles: false,
      canExecuteCommands: false,
      requiresApprovalForHighRisk: true,
      approvalRequiredCommands: ['open_app', 'close_app', 'launch_url', 'system_command'],
      blockedCommands: ['file_delete', 'registry_edit', 'network_reconfig', 'system_shutdown', 'execute_arbitrary_binary'],
    },
    canDelegateTo: ['email-agent', 'content-agent', 'frontend', 'backend', 'seo', 'founder-os', 'ai-phill', 'seo-leak', 'cognitive-twin', 'social-inbox', 'search-suite', 'pre-client-identity', 'whatsapp-intelligence', 'boost-bump'],
    canReceiveDelegationFrom: ALL_AGENT_IDS,
    escalatesTo: 'human',
    delegationRules: [
      {
        id: 'orchestrator-multi-domain',
        condition: 'complexity_threshold',
        targetAgentId: 'orchestrator',
        complexityThreshold: 0.8,
        enabled: true,
      },
    ],
  }),

  'email-agent': createAgentCard({
    id: 'email-agent',
    name: 'Email Agent',
    type: 'worker',
    role: 'Email Processing Specialist',
    description: 'Processes incoming emails, extracts intents, scores leads, and manages Gmail integration.',
    modelTier: 'sonnet',
    priority: 2,
    location: '.claude/agents/email-agent/',
    capabilities: AGENT_REGISTRY['email-agent'].capabilities.map((cap, i) => ({
      id: `email-cap-${i}`,
      name: cap.name,
      description: `${cap.name} capability`,
      keywords: cap.keywords,
      confidence: cap.confidence,
    })),
    useCases: AGENT_REGISTRY['email-agent'].useCases,
    boundaries: {
      maxExecutionTimeMs: 300_000,
      maxTokensPerRequest: 100_000,
      maxRequestsPerMinute: 60,
      canSpawnSubAgents: false,
      maxConcurrentSubAgents: 0,
      fileSystemAccess: 'none',
      maxPlanSteps: 15,
      maxRetries: 3,
    },
    permissions: {
      tier: 'elevated',
      canReadDatabase: true,
      canWriteDatabase: true,
      canCallExternalAPIs: true,
      canSendMessages: true,
      canModifyFiles: false,
      canExecuteCommands: false,
      requiresApprovalForHighRisk: true,
      approvalRequiredCommands: ['send_email'],
      blockedCommands: ['file_delete', 'registry_edit', 'network_reconfig', 'system_shutdown', 'execute_arbitrary_binary'],
    },
    canDelegateTo: ['orchestrator'],
    canReceiveDelegationFrom: ['orchestrator'],
    escalatesTo: 'orchestrator',
    delegationRules: [
      {
        id: 'email-low-confidence',
        condition: 'low_confidence',
        targetAgentId: 'orchestrator',
        confidenceThreshold: 0.5,
        enabled: true,
      },
      {
        id: 'email-content-handoff',
        condition: 'capability_mismatch',
        targetAgentId: 'content-agent',
        enabled: true,
      },
    ],
  }),

  'content-agent': createAgentCard({
    id: 'content-agent',
    name: 'Content Agent',
    type: 'worker',
    role: 'Content Generation Specialist',
    description: 'Generates personalized marketing content, proposals, and case studies using Extended Thinking.',
    modelTier: 'opus',
    useExtendedThinking: true,
    thinkingBudgetTokens: 10_000,
    priority: 2,
    location: '.claude/agents/content-agent/',
    capabilities: AGENT_REGISTRY['content-agent'].capabilities.map((cap, i) => ({
      id: `content-cap-${i}`,
      name: cap.name,
      description: `${cap.name} capability`,
      keywords: cap.keywords,
      confidence: cap.confidence,
    })),
    useCases: AGENT_REGISTRY['content-agent'].useCases,
    boundaries: {
      maxExecutionTimeMs: 600_000,
      maxTokensPerRequest: 200_000,
      maxRequestsPerMinute: 30,
      canSpawnSubAgents: false,
      maxConcurrentSubAgents: 0,
      fileSystemAccess: 'none',
      maxPlanSteps: 10,
      maxRetries: 2,
    },
    permissions: {
      tier: 'standard',
      canReadDatabase: true,
      canWriteDatabase: true,
      canCallExternalAPIs: false,
      canSendMessages: false,
      canModifyFiles: false,
      canExecuteCommands: false,
      requiresApprovalForHighRisk: true,
      approvalRequiredCommands: [],
      blockedCommands: ['file_delete', 'registry_edit', 'network_reconfig', 'system_shutdown', 'execute_arbitrary_binary'],
    },
    canDelegateTo: ['orchestrator'],
    canReceiveDelegationFrom: ['orchestrator', 'email-agent'],
    escalatesTo: 'orchestrator',
  }),

  frontend: createAgentCard({
    id: 'frontend',
    name: 'Frontend Specialist',
    type: 'worker',
    role: 'UI/Component Specialist',
    description: 'Builds React components, fixes UI bugs, handles styling and responsive design.',
    modelTier: 'sonnet',
    priority: 3,
    location: '.claude/agents/frontend-specialist/',
    capabilities: AGENT_REGISTRY.frontend.capabilities.map((cap, i) => ({
      id: `frontend-cap-${i}`,
      name: cap.name,
      description: `${cap.name} capability`,
      keywords: cap.keywords,
      confidence: cap.confidence,
    })),
    useCases: AGENT_REGISTRY.frontend.useCases,
    boundaries: {
      maxExecutionTimeMs: 300_000,
      maxTokensPerRequest: 100_000,
      maxRequestsPerMinute: 60,
      canSpawnSubAgents: false,
      maxConcurrentSubAgents: 0,
      fileSystemAccess: 'read-write',
      maxPlanSteps: 20,
      maxRetries: 3,
    },
    permissions: {
      tier: 'elevated',
      canReadDatabase: false,
      canWriteDatabase: false,
      canCallExternalAPIs: false,
      canSendMessages: false,
      canModifyFiles: true,
      canExecuteCommands: true,
      requiresApprovalForHighRisk: true,
      approvalRequiredCommands: [],
      blockedCommands: ['file_delete', 'registry_edit', 'network_reconfig', 'system_shutdown', 'execute_arbitrary_binary'],
    },
    canDelegateTo: ['orchestrator'],
    canReceiveDelegationFrom: ['orchestrator'],
    escalatesTo: 'orchestrator',
  }),

  backend: createAgentCard({
    id: 'backend',
    name: 'Backend Specialist',
    type: 'worker',
    role: 'API/Database Specialist',
    description: 'Implements API routes, database operations, RLS policies, authentication, and integrations.',
    modelTier: 'sonnet',
    priority: 3,
    location: '.claude/agents/backend-specialist/',
    capabilities: AGENT_REGISTRY.backend.capabilities.map((cap, i) => ({
      id: `backend-cap-${i}`,
      name: cap.name,
      description: `${cap.name} capability`,
      keywords: cap.keywords,
      confidence: cap.confidence,
    })),
    useCases: AGENT_REGISTRY.backend.useCases,
    boundaries: {
      maxExecutionTimeMs: 300_000,
      maxTokensPerRequest: 100_000,
      maxRequestsPerMinute: 60,
      canSpawnSubAgents: false,
      maxConcurrentSubAgents: 0,
      fileSystemAccess: 'read-write',
      maxPlanSteps: 20,
      maxRetries: 3,
    },
    permissions: {
      tier: 'elevated',
      canReadDatabase: true,
      canWriteDatabase: true,
      canCallExternalAPIs: true,
      canSendMessages: false,
      canModifyFiles: true,
      canExecuteCommands: true,
      requiresApprovalForHighRisk: true,
      approvalRequiredCommands: ['system_command'],
      blockedCommands: ['file_delete', 'registry_edit', 'network_reconfig', 'system_shutdown', 'execute_arbitrary_binary'],
    },
    canDelegateTo: ['orchestrator'],
    canReceiveDelegationFrom: ['orchestrator'],
    escalatesTo: 'orchestrator',
  }),

  seo: createAgentCard({
    id: 'seo',
    name: 'SEO Intelligence',
    type: 'worker',
    role: 'SEO Research & Analysis Specialist',
    description: 'Performs SEO research, keyword analysis, competitor audits, and content optimization.',
    modelTier: 'sonnet',
    priority: 3,
    location: '.claude/agents/seo-intelligence/',
    capabilities: AGENT_REGISTRY.seo.capabilities.map((cap, i) => ({
      id: `seo-cap-${i}`,
      name: cap.name,
      description: `${cap.name} capability`,
      keywords: cap.keywords,
      confidence: cap.confidence,
    })),
    useCases: AGENT_REGISTRY.seo.useCases,
    boundaries: {
      maxExecutionTimeMs: 300_000,
      maxTokensPerRequest: 100_000,
      maxRequestsPerMinute: 60,
      canSpawnSubAgents: false,
      maxConcurrentSubAgents: 0,
      fileSystemAccess: 'none',
      maxPlanSteps: 15,
      maxRetries: 3,
    },
    permissions: {
      tier: 'standard',
      canReadDatabase: true,
      canWriteDatabase: true,
      canCallExternalAPIs: true,
      canSendMessages: false,
      canModifyFiles: false,
      canExecuteCommands: false,
      requiresApprovalForHighRisk: true,
      approvalRequiredCommands: [],
      blockedCommands: ['file_delete', 'registry_edit', 'network_reconfig', 'system_shutdown', 'execute_arbitrary_binary'],
    },
    canDelegateTo: ['orchestrator'],
    canReceiveDelegationFrom: ['orchestrator'],
    escalatesTo: 'orchestrator',
  }),

  'founder-os': createAgentCard({
    id: 'founder-os',
    name: 'Founder OS',
    type: 'hybrid',
    role: 'Founder Intelligence System',
    description: 'Strategic analysis, multi-business management, decision support with Extended Thinking.',
    modelTier: 'opus',
    useExtendedThinking: true,
    thinkingBudgetTokens: 10_000,
    priority: 2,
    location: '.claude/agents/founder-os/',
    capabilities: AGENT_REGISTRY['founder-os'].capabilities.map((cap, i) => ({
      id: `founder-cap-${i}`,
      name: cap.name,
      description: `${cap.name} capability`,
      keywords: cap.keywords,
      confidence: cap.confidence,
    })),
    useCases: AGENT_REGISTRY['founder-os'].useCases,
    boundaries: {
      maxExecutionTimeMs: 600_000,
      maxTokensPerRequest: 200_000,
      maxRequestsPerMinute: 30,
      canSpawnSubAgents: true,
      maxConcurrentSubAgents: 3,
      fileSystemAccess: 'read',
      maxPlanSteps: 20,
      maxRetries: 2,
    },
    permissions: {
      tier: 'system',
      canReadDatabase: true,
      canWriteDatabase: true,
      canCallExternalAPIs: true,
      canSendMessages: false,
      canModifyFiles: false,
      canExecuteCommands: false,
      requiresApprovalForHighRisk: true,
      approvalRequiredCommands: [],
      blockedCommands: ['file_delete', 'registry_edit', 'network_reconfig', 'system_shutdown', 'execute_arbitrary_binary'],
    },
    canDelegateTo: ['orchestrator', 'seo', 'content-agent'],
    canReceiveDelegationFrom: ['orchestrator'],
    escalatesTo: 'orchestrator',
  }),

  'ai-phill': createAgentCard({
    id: 'ai-phill',
    name: 'AI Phill',
    type: 'hybrid',
    role: 'Strategic Advisor & Thinking Partner',
    description: 'Founder strategic advisor using Extended Thinking for deep analysis, Socratic dialogue, risk assessment, and business digests.',
    modelTier: 'opus',
    useExtendedThinking: true,
    thinkingBudgetTokens: 15_000,
    priority: 2,
    location: '.claude/agents/ai-phill/',
    capabilities: AGENT_REGISTRY['ai-phill'].capabilities.map((cap, i) => ({
      id: `ai-phill-cap-${i}`,
      name: cap.name,
      description: `${cap.name} capability`,
      keywords: cap.keywords,
      confidence: cap.confidence,
    })),
    useCases: AGENT_REGISTRY['ai-phill'].useCases,
    boundaries: {
      maxExecutionTimeMs: 600_000,
      maxTokensPerRequest: 200_000,
      maxRequestsPerMinute: 20,
      canSpawnSubAgents: false,
      maxConcurrentSubAgents: 0,
      fileSystemAccess: 'none',
      maxPlanSteps: 10,
      maxRetries: 2,
    },
    permissions: {
      tier: 'elevated',
      canReadDatabase: true,
      canWriteDatabase: true,
      canCallExternalAPIs: false,
      canSendMessages: false,
      canModifyFiles: false,
      canExecuteCommands: false,
      requiresApprovalForHighRisk: true,
      approvalRequiredCommands: [],
      blockedCommands: ['file_delete', 'registry_edit', 'network_reconfig', 'system_shutdown', 'execute_arbitrary_binary'],
    },
    canDelegateTo: ['orchestrator'],
    canReceiveDelegationFrom: ['orchestrator', 'founder-os'],
    escalatesTo: 'orchestrator',
  }),

  'seo-leak': createAgentCard({
    id: 'seo-leak',
    name: 'SEO Leak Agent',
    type: 'worker',
    role: 'SEO Signal Intelligence Specialist',
    description: 'Google/DOJ/Yandex leak-informed SEO analysis with Q*, P*, T* signal estimation and NavBoost analysis.',
    modelTier: 'sonnet',
    priority: 3,
    location: '.claude/agents/seo-leak/',
    capabilities: AGENT_REGISTRY['seo-leak'].capabilities.map((cap, i) => ({
      id: `seo-leak-cap-${i}`,
      name: cap.name,
      description: `${cap.name} capability`,
      keywords: cap.keywords,
      confidence: cap.confidence,
    })),
    useCases: AGENT_REGISTRY['seo-leak'].useCases,
    boundaries: {
      maxExecutionTimeMs: 300_000,
      maxTokensPerRequest: 100_000,
      maxRequestsPerMinute: 40,
      canSpawnSubAgents: false,
      maxConcurrentSubAgents: 0,
      fileSystemAccess: 'none',
      maxPlanSteps: 15,
      maxRetries: 3,
    },
    permissions: {
      tier: 'standard',
      canReadDatabase: true,
      canWriteDatabase: true,
      canCallExternalAPIs: true,
      canSendMessages: false,
      canModifyFiles: false,
      canExecuteCommands: false,
      requiresApprovalForHighRisk: true,
      approvalRequiredCommands: [],
      blockedCommands: ['file_delete', 'registry_edit', 'network_reconfig', 'system_shutdown', 'execute_arbitrary_binary'],
    },
    canDelegateTo: ['orchestrator', 'seo'],
    canReceiveDelegationFrom: ['orchestrator', 'seo'],
    escalatesTo: 'orchestrator',
  }),

  'cognitive-twin': createAgentCard({
    id: 'cognitive-twin',
    name: 'Cognitive Twin',
    type: 'worker',
    role: 'Business Health Monitor & Decision Simulator',
    description: 'Continuous business health monitoring across 13 domains with decision simulation and periodic digest generation.',
    modelTier: 'sonnet',
    priority: 3,
    location: '.claude/agents/cognitive-twin/',
    capabilities: AGENT_REGISTRY['cognitive-twin'].capabilities.map((cap, i) => ({
      id: `cognitive-twin-cap-${i}`,
      name: cap.name,
      description: `${cap.name} capability`,
      keywords: cap.keywords,
      confidence: cap.confidence,
    })),
    useCases: AGENT_REGISTRY['cognitive-twin'].useCases,
    boundaries: {
      maxExecutionTimeMs: 300_000,
      maxTokensPerRequest: 100_000,
      maxRequestsPerMinute: 40,
      canSpawnSubAgents: false,
      maxConcurrentSubAgents: 0,
      fileSystemAccess: 'none',
      maxPlanSteps: 10,
      maxRetries: 2,
    },
    permissions: {
      tier: 'standard',
      canReadDatabase: true,
      canWriteDatabase: true,
      canCallExternalAPIs: false,
      canSendMessages: false,
      canModifyFiles: false,
      canExecuteCommands: false,
      requiresApprovalForHighRisk: true,
      approvalRequiredCommands: [],
      blockedCommands: ['file_delete', 'registry_edit', 'network_reconfig', 'system_shutdown', 'execute_arbitrary_binary'],
    },
    canDelegateTo: ['orchestrator'],
    canReceiveDelegationFrom: ['orchestrator', 'founder-os'],
    escalatesTo: 'orchestrator',
  }),

  'social-inbox': createAgentCard({
    id: 'social-inbox',
    name: 'Social Inbox Agent',
    type: 'worker',
    role: 'Unified Social Media Inbox Manager',
    description: 'Manages unified inbox across social platforms with AI categorization and response suggestions.',
    modelTier: 'sonnet',
    priority: 3,
    location: '.claude/agents/social-inbox/',
    capabilities: AGENT_REGISTRY['social-inbox'].capabilities.map((cap, i) => ({
      id: `social-inbox-cap-${i}`,
      name: cap.name,
      description: `${cap.name} capability`,
      keywords: cap.keywords,
      confidence: cap.confidence,
    })),
    useCases: AGENT_REGISTRY['social-inbox'].useCases,
    boundaries: {
      maxExecutionTimeMs: 300_000,
      maxTokensPerRequest: 100_000,
      maxRequestsPerMinute: 60,
      canSpawnSubAgents: false,
      maxConcurrentSubAgents: 0,
      fileSystemAccess: 'none',
      maxPlanSteps: 15,
      maxRetries: 3,
    },
    permissions: {
      tier: 'elevated',
      canReadDatabase: true,
      canWriteDatabase: true,
      canCallExternalAPIs: true,
      canSendMessages: false,
      canModifyFiles: false,
      canExecuteCommands: false,
      requiresApprovalForHighRisk: true,
      approvalRequiredCommands: ['send_social_message'],
      blockedCommands: ['file_delete', 'registry_edit', 'network_reconfig', 'system_shutdown', 'execute_arbitrary_binary'],
    },
    canDelegateTo: ['orchestrator'],
    canReceiveDelegationFrom: ['orchestrator'],
    escalatesTo: 'orchestrator',
  }),

  'search-suite': createAgentCard({
    id: 'search-suite',
    name: 'Search Suite Agent',
    type: 'worker',
    role: 'Keyword Tracking & SERP Monitor',
    description: 'Multi-engine keyword ranking tracking, SERP monitoring, and SEO opportunity detection.',
    modelTier: 'sonnet',
    priority: 3,
    location: '.claude/agents/search-suite/',
    capabilities: AGENT_REGISTRY['search-suite'].capabilities.map((cap, i) => ({
      id: `search-suite-cap-${i}`,
      name: cap.name,
      description: `${cap.name} capability`,
      keywords: cap.keywords,
      confidence: cap.confidence,
    })),
    useCases: AGENT_REGISTRY['search-suite'].useCases,
    boundaries: {
      maxExecutionTimeMs: 300_000,
      maxTokensPerRequest: 100_000,
      maxRequestsPerMinute: 40,
      canSpawnSubAgents: false,
      maxConcurrentSubAgents: 0,
      fileSystemAccess: 'none',
      maxPlanSteps: 15,
      maxRetries: 3,
    },
    permissions: {
      tier: 'standard',
      canReadDatabase: true,
      canWriteDatabase: true,
      canCallExternalAPIs: true,
      canSendMessages: false,
      canModifyFiles: false,
      canExecuteCommands: false,
      requiresApprovalForHighRisk: true,
      approvalRequiredCommands: [],
      blockedCommands: ['file_delete', 'registry_edit', 'network_reconfig', 'system_shutdown', 'execute_arbitrary_binary'],
    },
    canDelegateTo: ['orchestrator', 'seo'],
    canReceiveDelegationFrom: ['orchestrator', 'seo'],
    escalatesTo: 'orchestrator',
  }),

  'pre-client-identity': createAgentCard({
    id: 'pre-client-identity',
    name: 'Pre-Client Identity Agent',
    type: 'worker',
    role: 'Pre-Sales Intelligence & Relationship Builder',
    description: 'Email-based pre-client identification, relationship timeline construction, and opportunity detection.',
    modelTier: 'sonnet',
    priority: 2,
    location: '.claude/agents/pre-client-identity/',
    capabilities: AGENT_REGISTRY['pre-client-identity'].capabilities.map((cap, i) => ({
      id: `pre-client-cap-${i}`,
      name: cap.name,
      description: `${cap.name} capability`,
      keywords: cap.keywords,
      confidence: cap.confidence,
    })),
    useCases: AGENT_REGISTRY['pre-client-identity'].useCases,
    boundaries: {
      maxExecutionTimeMs: 300_000,
      maxTokensPerRequest: 100_000,
      maxRequestsPerMinute: 60,
      canSpawnSubAgents: false,
      maxConcurrentSubAgents: 0,
      fileSystemAccess: 'none',
      maxPlanSteps: 15,
      maxRetries: 3,
    },
    permissions: {
      tier: 'elevated',
      canReadDatabase: true,
      canWriteDatabase: true,
      canCallExternalAPIs: false,
      canSendMessages: false,
      canModifyFiles: false,
      canExecuteCommands: false,
      requiresApprovalForHighRisk: true,
      approvalRequiredCommands: [],
      blockedCommands: ['file_delete', 'registry_edit', 'network_reconfig', 'system_shutdown', 'execute_arbitrary_binary'],
    },
    canDelegateTo: ['orchestrator', 'email-agent'],
    canReceiveDelegationFrom: ['orchestrator', 'email-agent'],
    escalatesTo: 'orchestrator',
  }),

  'whatsapp-intelligence': createAgentCard({
    id: 'whatsapp-intelligence',
    name: 'WhatsApp Intelligence',
    type: 'worker',
    role: 'WhatsApp Message Analysis & Response Specialist',
    description: 'WhatsApp message analysis, sentiment detection, response generation, and contact intelligence updates.',
    modelTier: 'sonnet',
    priority: 3,
    location: '.claude/agents/whatsapp-intelligence/',
    capabilities: AGENT_REGISTRY['whatsapp-intelligence'].capabilities.map((cap, i) => ({
      id: `whatsapp-cap-${i}`,
      name: cap.name,
      description: `${cap.name} capability`,
      keywords: cap.keywords,
      confidence: cap.confidence,
    })),
    useCases: AGENT_REGISTRY['whatsapp-intelligence'].useCases,
    boundaries: {
      maxExecutionTimeMs: 180_000,
      maxTokensPerRequest: 50_000,
      maxRequestsPerMinute: 120,
      canSpawnSubAgents: false,
      maxConcurrentSubAgents: 0,
      fileSystemAccess: 'none',
      maxPlanSteps: 10,
      maxRetries: 3,
    },
    permissions: {
      tier: 'elevated',
      canReadDatabase: true,
      canWriteDatabase: true,
      canCallExternalAPIs: true,
      canSendMessages: true,
      canModifyFiles: false,
      canExecuteCommands: false,
      requiresApprovalForHighRisk: true,
      approvalRequiredCommands: ['send_whatsapp_message'],
      blockedCommands: ['file_delete', 'registry_edit', 'network_reconfig', 'system_shutdown', 'execute_arbitrary_binary'],
    },
    canDelegateTo: ['orchestrator'],
    canReceiveDelegationFrom: ['orchestrator'],
    escalatesTo: 'orchestrator',
  }),

  'boost-bump': createAgentCard({
    id: 'boost-bump',
    name: 'Boost Bump Agent',
    type: 'worker',
    role: 'White-Hat SEO Boost Orchestrator',
    description: 'White-hat SEO boost strategy with human-governed approval workflow, performance tracking, and results analysis.',
    modelTier: 'sonnet',
    priority: 3,
    location: '.claude/agents/boost-bump/',
    capabilities: AGENT_REGISTRY['boost-bump'].capabilities.map((cap, i) => ({
      id: `boost-bump-cap-${i}`,
      name: cap.name,
      description: `${cap.name} capability`,
      keywords: cap.keywords,
      confidence: cap.confidence,
    })),
    useCases: AGENT_REGISTRY['boost-bump'].useCases,
    boundaries: {
      maxExecutionTimeMs: 300_000,
      maxTokensPerRequest: 100_000,
      maxRequestsPerMinute: 30,
      canSpawnSubAgents: false,
      maxConcurrentSubAgents: 0,
      fileSystemAccess: 'none',
      maxPlanSteps: 15,
      maxRetries: 2,
    },
    permissions: {
      tier: 'elevated',
      canReadDatabase: true,
      canWriteDatabase: true,
      canCallExternalAPIs: true,
      canSendMessages: false,
      canModifyFiles: false,
      canExecuteCommands: false,
      requiresApprovalForHighRisk: true,
      approvalRequiredCommands: ['execute_boost', 'schedule_boost'],
      blockedCommands: ['file_delete', 'registry_edit', 'network_reconfig', 'system_shutdown', 'execute_arbitrary_binary'],
    },
    canDelegateTo: ['orchestrator', 'seo-leak'],
    canReceiveDelegationFrom: ['orchestrator'],
    escalatesTo: 'orchestrator',
  }),
};

// ============================================================================
// Agent Card Access Functions
// ============================================================================

/**
 * Get an Agent Card by ID (Protocol v1.0)
 */
export function getAgentCard(id: UnifiedAgentId): AgentCard {
  const card = AGENT_CARDS[id];
  if (!card) {
    throw new Error(`Agent Card not found: ${id}`);
  }
  return card;
}

/**
 * Get all Agent Cards
 */
export function getAllAgentCards(): AgentCard[] {
  return Object.values(AGENT_CARDS);
}

// ============================================================================
// Agent State Management
// ============================================================================

/**
 * Get the current state of an agent
 */
export function getAgentState(id: UnifiedAgentId): AgentState {
  return AGENT_CARDS[id]?.currentState || 'offline';
}

/**
 * Update the state of an agent
 */
export function setAgentState(id: UnifiedAgentId, state: AgentState): void {
  const card = AGENT_CARDS[id];
  if (card) {
    card.currentState = state;
    card.stateChangedAt = new Date().toISOString();
  }
}

/**
 * Increment active execution count for an agent
 */
export function incrementActiveExecutions(id: UnifiedAgentId): void {
  const card = AGENT_CARDS[id];
  if (card) {
    card.activeExecutions++;
    if (card.activeExecutions > 0) {
      card.currentState = 'active';
      card.stateChangedAt = new Date().toISOString();
    }
  }
}

/**
 * Decrement active execution count for an agent
 */
export function decrementActiveExecutions(id: UnifiedAgentId): void {
  const card = AGENT_CARDS[id];
  if (card) {
    card.activeExecutions = Math.max(0, card.activeExecutions - 1);
    if (card.activeExecutions === 0) {
      card.currentState = 'idle';
      card.stateChangedAt = new Date().toISOString();
    }
  }
}

/**
 * Update agent metrics after an execution
 */
export function updateAgentMetrics(
  id: UnifiedAgentId,
  executionTimeMs: number,
  success: boolean,
  confidenceScore?: number
): void {
  const card = AGENT_CARDS[id];
  if (!card) return;

  const m = card.metrics;
  m.totalExecutions++;

  if (success) {
    m.successfulExecutions++;
  } else {
    m.failedExecutions++;
  }

  // Running average for execution time
  m.averageExecutionTimeMs =
    (m.averageExecutionTimeMs * (m.totalExecutions - 1) + executionTimeMs) /
    m.totalExecutions;

  // Running average for confidence
  if (confidenceScore !== undefined) {
    const prevTotal = m.totalExecutions - 1;
    m.averageConfidenceScore =
      prevTotal === 0
        ? confidenceScore
        : (m.averageConfidenceScore * prevTotal + confidenceScore) / m.totalExecutions;
  }

  m.lastExecutionAt = new Date().toISOString();
  card.updatedAt = new Date().toISOString();
}
