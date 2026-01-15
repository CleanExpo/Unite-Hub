/**
 * Unified Agent Registry
 *
 * Smart routing system for automatically selecting the appropriate agent
 * based on task analysis. Provides canonical agent definitions with version
 * tracking and validation.
 *
 * Features:
 * - Task analysis and automatic routing
 * - Agent capability matching
 * - Priority-based selection
 * - Validation and health checks
 * - Performance tracking
 *
 * Usage:
 *   import { routeTask, getAgent, validateAgentRegistry } from '@/lib/agents/unified-registry';
 *
 *   // Automatic routing
 *   const agentId = await routeTask('Fix the login button on dashboard');
 *   // Returns: 'frontend'
 *
 *   // Get agent details
 *   const agent = getAgent('email-agent');
 *   console.log(agent.capabilities);
 */

export type UnifiedAgentId =
  | 'orchestrator'
  | 'email-agent'
  | 'content-agent'
  | 'frontend'
  | 'backend'
  | 'seo'
  | 'founder-os';

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
