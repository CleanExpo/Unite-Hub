/**
 * Multi-Agent Routing Optimizer (MARO)
 * Analyzes task patterns and recommends optimal agent routing
 * Helps ensure the right agent handles the right task type
 *
 * Read-only - never modifies routing at runtime, only recommends
 */

import fs from 'fs';
import path from 'path';
import { maroConfig } from './agent-routing-config';

export interface RoutingRecommendation {
  taskPattern: string;
  currentRoutingAccuracy?: number;
  recommendedAgent: string;
  alternativeAgent?: string;
  supportingSkills: string[];
  rationale: string;
  riskLevel: string;
  riskMitigation: string;
  successCriteria: string[];
  requiresApproval: boolean;
}

export interface TaskAnalysis {
  taskType: string;
  keywords: string[];
  detectedPatterns: string[];
  complexity: string;
  riskLevel: string;
}

export interface MAROReport {
  timestamp: string;
  taskPatternsCovered: number;
  routingRecommendations: RoutingRecommendation[];
  taskTypeAnalysis: TaskAnalysis[];
  routingAccuracy: {
    overall: number;
    byAgent: Record<string, number>;
  };
  insights: string[];
  recommendations: string[];
  routingHooks: RoutingHook[];
}

export interface RoutingHook {
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  condition: string;
  action: string;
  fallback: string;
}

export class MultiAgentRoutingOptimizer {
  /**
   * Analyze a task description and detect patterns
   */
  private analyzeTask(taskDescription: string): TaskAnalysis {
    const lowerDesc = taskDescription.toLowerCase();

    const matchedPatterns = maroConfig.taskPatterns
      .filter(p => p.keywords.some(kw => lowerDesc.includes(kw)))
      .map(p => p.pattern);

    const pattern = matchedPatterns[0] || 'unknown';
    const patternConfig = maroConfig.taskPatterns.find(p => p.pattern === pattern);

    return {
      taskType: pattern,
      keywords: (patternConfig?.keywords || []).filter(kw => lowerDesc.includes(kw)),
      detectedPatterns: matchedPatterns,
      complexity: patternConfig?.complexity || 'medium',
      riskLevel: patternConfig?.riskLevel || 'medium'
    };
  }

  /**
   * Generate routing recommendations
   */
  async generateRoutingRecommendations(): Promise<MAROReport> {
    console.log('[MARO] Generating agent routing recommendations...');
    const startTime = Date.now();

    const report: MAROReport = {
      timestamp: new Date().toISOString(),
      taskPatternsCovered: maroConfig.taskPatterns.length,
      routingRecommendations: [],
      taskTypeAnalysis: [],
      routingAccuracy: {
        overall: 0,
        byAgent: {}
      },
      insights: [],
      recommendations: [],
      routingHooks: []
    };

    try {
      // Generate recommendations for each task pattern
      for (const rule of maroConfig.routingRules) {
        const pattern = maroConfig.taskPatterns.find(p => p.pattern === rule.taskPattern);

        const recommendation: RoutingRecommendation = {
          taskPattern: rule.taskPattern,
          recommendedAgent: rule.recommendedAgent,
          alternativeAgent: rule.fallbackAgent,
          supportingSkills: rule.supportingSkills,
          rationale: rule.rationale,
          riskLevel: pattern?.riskLevel || 'medium',
          riskMitigation: rule.riskMitigation,
          successCriteria: this.generateSuccessCriteria(rule.taskPattern),
          requiresApproval: pattern?.requiresApproval || false
        };

        report.routingRecommendations.push(recommendation);

        // Track agent loads
        if (!report.routingAccuracy.byAgent[rule.recommendedAgent]) {
          report.routingAccuracy.byAgent[rule.recommendedAgent] = 0;
        }
        report.routingAccuracy.byAgent[rule.recommendedAgent]++;
      }

      // Generate task type analysis
      for (const pattern of maroConfig.taskPatterns) {
        const analysis = this.analyzeTask(pattern.pattern);
        report.taskTypeAnalysis.push(analysis);
      }

      // Calculate routing accuracy (simulated from config alignment)
      const agentCount = Object.keys(report.routingAccuracy.byAgent).length;
      const totalRecommendations = report.routingRecommendations.length;
      report.routingAccuracy.overall = Math.round((totalRecommendations / maroConfig.taskPatterns.length) * 100);

      for (const agent in report.routingAccuracy.byAgent) {
        report.routingAccuracy.byAgent[agent] = Math.round(
          (report.routingAccuracy.byAgent[agent] / totalRecommendations) * 100
        );
      }

      // Generate routing hooks
      report.routingHooks = this.generateRoutingHooks();

      // Generate insights
      report.insights = this.generateInsights(report);
      report.recommendations = this.generateRecommendations(report);

      console.log(`✓ Routing optimization complete in ${(Date.now() - startTime) / 1000}s`);

      return report;
    } catch (error) {
      console.error('[MARO] Optimization failed:', error);
      throw error;
    }
  }

  /**
   * Generate success criteria for a task
   */
  private generateSuccessCriteria(taskPattern: string): string[] {
    const criteria: Record<string, string[]> = {
      'Code Refactoring': [
        'Code passes linter and type checker',
        'All tests pass with new code',
        'No regressions detected',
        'Code review approved'
      ],
      'Documentation': [
        'All required sections present',
        'Examples included and tested',
        'Clear and grammatically correct',
        'Linked from main documentation'
      ],
      'Testing': [
        'Coverage meets minimum threshold (80%)',
        'All tests pass consistently',
        'Edge cases documented',
        'Performance benchmarks acceptable'
      ],
      'Bug Fix': [
        'Root cause identified and documented',
        'Fix prevents regression',
        'Regression test added',
        'Fix validated in multiple scenarios'
      ],
      'Security Audit': [
        'Vulnerabilities documented with severity',
        'Remediation plans created',
        'No critical issues remain',
        'Security review approved'
      ],
      'Performance Optimization': [
        'Measurable improvement demonstrated',
        'No regressions in other metrics',
        'Before/after benchmarks recorded',
        'Safe for production deployment'
      ],
      'Architecture Review': [
        'Design decisions documented',
        'Trade-offs analyzed',
        'Scalability verified',
        'Stakeholder approval obtained'
      ],
      'Feature Addition': [
        'All requirements implemented',
        'Tests provide sufficient coverage',
        'Documentation complete',
        'Ready for production deployment'
      ]
    };

    return criteria[taskPattern] || [
      'Task completed successfully',
      'No errors or warnings',
      'Quality standards met',
      'Review and approval obtained'
    ];
  }

  /**
   * Generate routing hooks
   */
  private generateRoutingHooks(): RoutingHook[] {
    const hooks: RoutingHook[] = [
      {
        name: 'Security-First Routing',
        priority: 'critical',
        condition: 'task contains security keywords',
        action: 'Route to Security Agent',
        fallback: 'Escalate to human review'
      },
      {
        name: 'Critical Fix Priority',
        priority: 'critical',
        condition: 'bug severity is critical',
        action: 'Route to Code Refactor Agent immediately',
        fallback: 'Orchestrator coordinates emergency response'
      },
      {
        name: 'Architecture Guard',
        priority: 'high',
        condition: 'task affects system architecture',
        action: 'Route to Orchestrator for design review',
        fallback: 'Require human architect approval'
      },
      {
        name: 'Performance Monitoring',
        priority: 'high',
        condition: 'optimization task detected',
        action: 'Route to Performance Agent',
        fallback: 'Code Refactor Agent with performance checklist'
      },
      {
        name: 'Documentation Enforcement',
        priority: 'medium',
        condition: 'code change without docs',
        action: 'Route to Documentation Agent',
        fallback: 'Require docs in code review'
      },
      {
        name: 'Test Coverage Requirement',
        priority: 'high',
        condition: 'test coverage below threshold',
        action: 'Route to Testing Agent',
        fallback: 'Block merge until coverage improves'
      },
      {
        name: 'Complexity Management',
        priority: 'medium',
        condition: 'task complexity exceeds agent max',
        action: 'Split task or escalate to Orchestrator',
        fallback: 'Return for decomposition'
      }
    ];

    return hooks;
  }

  /**
   * Generate insights
   */
  private generateInsights(report: MAROReport): string[] {
    const insights: string[] = [];

    // Coverage insights
    insights.push(
      `✅ Task Pattern Coverage: ${report.taskPatternsCovered} patterns covered by routing rules`
    );

    // Agent load insights
    const agentLoads = Object.entries(report.routingAccuracy.byAgent)
      .sort((a, b) => b[1] - a[1]);

    if (agentLoads.length > 0) {
      const primary = agentLoads[0];
      insights.push(
        `📊 Primary Orchestrator: ${primary[0]} handles ${primary[1]}% of recommended tasks`
      );
    }

    // Hook insights
    insights.push(
      `🔒 Safety Hooks: ${report.routingHooks.filter(h => h.priority === 'critical').length} critical routing rules active`
    );

    // Recommendation insights
    const approvalsRequired = report.routingRecommendations.filter(r => r.requiresApproval).length;
    insights.push(
      `⚠️ Approval Requirements: ${approvalsRequired} task types require human approval`
    );

    return insights;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(report: MAROReport): string[] {
    const recommendations: string[] = [];

    const criticalHooks = report.routingHooks.filter(h => h.priority === 'critical');
    if (criticalHooks.length > 0) {
      recommendations.push(
        `🔒 Activate ${criticalHooks.length} critical routing hooks to ensure safety`
      );
    }

    const approvalTasks = report.routingRecommendations.filter(r => r.requiresApproval);
    if (approvalTasks.length > 0) {
      recommendations.push(
        `✋ Enforce approval gates for ${approvalTasks.length} high-risk task types`
      );
    }

    recommendations.push(
      `📋 Document routing decision rationale for team reference`
    );

    recommendations.push(
      `🎯 Use MARO recommendations to improve agent selection and reduce misrouting`
    );

    return recommendations;
  }
}

export async function generateRoutingRecommendations(): Promise<MAROReport> {
  const optimizer = new MultiAgentRoutingOptimizer();
  return optimizer.generateRoutingRecommendations();
}
