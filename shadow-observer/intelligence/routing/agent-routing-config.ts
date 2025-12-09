/**
 * Multi-Agent Routing Optimizer (MARO) Configuration
 * Defines task patterns, agent capabilities, and routing rules
 */

export interface TaskPattern {
  pattern: string;
  keywords: string[];
  complexity: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface AgentCapability {
  agent: string;
  strength: string[];
  weakness: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  maxComplexity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RoutingRule {
  taskPattern: string;
  recommendedAgent: string;
  supportingSkills: string[];
  rationale: string;
  fallbackAgent?: string;
  riskMitigation: string;
}

export interface MAROConfig {
  taskPatterns: TaskPattern[];
  agentCapabilities: AgentCapability[];
  routingRules: RoutingRule[];
}

export const maroConfig: MAROConfig = {
  taskPatterns: [
    {
      pattern: 'Code Refactoring',
      keywords: ['refactor', 'modernize', 'cleanup', 'improve'],
      complexity: 'high',
      requiresApproval: true,
      riskLevel: 'high'
    },
    {
      pattern: 'Documentation',
      keywords: ['doc', 'readme', 'guide', 'comment', 'explain'],
      complexity: 'medium',
      requiresApproval: false,
      riskLevel: 'low'
    },
    {
      pattern: 'Testing',
      keywords: ['test', 'unit', 'integration', 'coverage', 'validate'],
      complexity: 'medium',
      requiresApproval: false,
      riskLevel: 'medium'
    },
    {
      pattern: 'Bug Fix',
      keywords: ['fix', 'bug', 'error', 'issue', 'crash'],
      complexity: 'medium',
      requiresApproval: true,
      riskLevel: 'medium'
    },
    {
      pattern: 'Security Audit',
      keywords: ['security', 'vulnerability', 'exploit', 'breach', 'auth'],
      complexity: 'critical',
      requiresApproval: true,
      riskLevel: 'critical'
    },
    {
      pattern: 'Performance Optimization',
      keywords: ['performance', 'optimize', 'speed', 'efficiency', 'cache'],
      complexity: 'high',
      requiresApproval: true,
      riskLevel: 'high'
    },
    {
      pattern: 'Architecture Review',
      keywords: ['architecture', 'design', 'structure', 'pattern', 'migration'],
      complexity: 'critical',
      requiresApproval: true,
      riskLevel: 'critical'
    },
    {
      pattern: 'Feature Addition',
      keywords: ['feature', 'new', 'add', 'implement', 'create'],
      complexity: 'high',
      requiresApproval: true,
      riskLevel: 'medium'
    }
  ],

  agentCapabilities: [
    {
      agent: 'Orchestrator',
      strength: ['coordination', 'planning', 'task routing', 'error handling'],
      weakness: ['detailed coding', 'specific domain work'],
      riskTolerance: 'conservative',
      maxComplexity: 'critical'
    },
    {
      agent: 'Code Refactor Agent',
      strength: ['refactoring', 'modernization', 'cleanup', 'architecture'],
      weakness: ['new feature creation', 'domain-specific logic'],
      riskTolerance: 'moderate',
      maxComplexity: 'high'
    },
    {
      agent: 'Documentation Agent',
      strength: ['writing', 'clarity', 'examples', 'guides'],
      weakness: ['code analysis', 'architecture decisions'],
      riskTolerance: 'conservative',
      maxComplexity: 'medium'
    },
    {
      agent: 'Testing Agent',
      strength: ['test design', 'coverage analysis', 'quality metrics'],
      weakness: ['performance tuning', 'security auditing'],
      riskTolerance: 'moderate',
      maxComplexity: 'medium'
    },
    {
      agent: 'Security Agent',
      strength: ['vulnerability detection', 'compliance', 'secure coding'],
      weakness: ['general maintenance', 'feature development'],
      riskTolerance: 'conservative',
      maxComplexity: 'critical'
    },
    {
      agent: 'Performance Agent',
      strength: ['profiling', 'optimization', 'benchmarking', 'efficiency'],
      weakness: ['new feature work', 'documentation'],
      riskTolerance: 'moderate',
      maxComplexity: 'high'
    },
    {
      agent: 'Content Agent',
      strength: ['narrative', 'explanation', 'knowledge capture'],
      weakness: ['code execution', 'testing'],
      riskTolerance: 'conservative',
      maxComplexity: 'low'
    }
  ],

  routingRules: [
    {
      taskPattern: 'Code Refactoring',
      recommendedAgent: 'Code Refactor Agent',
      supportingSkills: ['drift-detector', 'code-analyzer', 'architect-validator'],
      rationale: 'Specialized in modernization and architectural improvements',
      fallbackAgent: 'Orchestrator',
      riskMitigation: 'Require code review before merge, comprehensive testing'
    },
    {
      taskPattern: 'Documentation',
      recommendedAgent: 'Documentation Agent',
      supportingSkills: ['content-generator', 'clarity-checker', 'example-builder'],
      rationale: 'Expert in clear communication and comprehensive guides',
      fallbackAgent: 'Content Agent',
      riskMitigation: 'Review for technical accuracy and completeness'
    },
    {
      taskPattern: 'Testing',
      recommendedAgent: 'Testing Agent',
      supportingSkills: ['test-generator', 'coverage-analyzer', 'quality-scorer'],
      rationale: 'Specialized in test design and quality metrics',
      fallbackAgent: 'Code Refactor Agent',
      riskMitigation: 'Ensure coverage meets minimum standards, validate edge cases'
    },
    {
      taskPattern: 'Bug Fix',
      recommendedAgent: 'Code Refactor Agent',
      supportingSkills: ['issue-analyzer', 'root-cause-finder', 'test-validator'],
      rationale: 'Can handle root cause analysis and targeted fixes',
      fallbackAgent: 'Orchestrator',
      riskMitigation: 'Test fix thoroughly, document root cause'
    },
    {
      taskPattern: 'Security Audit',
      recommendedAgent: 'Security Agent',
      supportingSkills: ['vulnerability-scanner', 'compliance-checker', 'secure-coder'],
      rationale: 'Expert in security vulnerabilities and compliance',
      fallbackAgent: 'Orchestrator',
      riskMitigation: 'Review by human security expert, no auto-deployment'
    },
    {
      taskPattern: 'Performance Optimization',
      recommendedAgent: 'Performance Agent',
      supportingSkills: ['profiler', 'benchmarker', 'optimizer'],
      rationale: 'Specialized in profiling and optimization techniques',
      fallbackAgent: 'Code Refactor Agent',
      riskMitigation: 'Benchmark before/after, ensure no regressions'
    },
    {
      taskPattern: 'Architecture Review',
      recommendedAgent: 'Orchestrator',
      supportingSkills: ['architect-validator', 'pattern-matcher', 'trade-off-analyzer'],
      rationale: 'Requires holistic system view and coordination capability',
      fallbackAgent: 'Code Refactor Agent',
      riskMitigation: 'Involve human architects, document decisions'
    },
    {
      taskPattern: 'Feature Addition',
      recommendedAgent: 'Orchestrator',
      supportingSkills: ['requirements-analyzer', 'designer', 'implementer'],
      rationale: 'Complex multi-step work requiring orchestration',
      fallbackAgent: 'Code Refactor Agent',
      riskMitigation: 'Break into smaller tasks, require architectural approval'
    }
  ]
};
