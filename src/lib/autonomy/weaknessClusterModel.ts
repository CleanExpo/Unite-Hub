/**
 * Weakness Cluster Model
 *
 * Analyzes failure patterns and system signals to identify and cluster
 * related weaknesses across the platform, enabling targeted improvements.
 *
 * Core capabilities:
 * - Detect memory contradictions and inconsistencies
 * - Identify temporal patterns in failures
 * - Analyze agent performance degradation
 * - Detect orchestrator bottlenecks
 * - Map cross-agent weakness dependencies
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface WeaknessCluster {
  clusterId: string;
  clusterType:
    | 'memory_contradiction'
    | 'agent_performance'
    | 'orchestration_bottleneck'
    | 'cross_agent_conflict'
    | 'temporal_pattern'
    | 'resource_constraint';
  severity: number; // 1-5
  confidence: number; // 0-100
  affectedAgents: string[];
  affectedMemories: string[];
  nodes: WeaknessNode[];
  patterns: FailurePattern[];
  rootCauses: string[];
  createdAt: string;
}

export interface WeaknessNode {
  nodeId: string;
  nodeType: string;
  severity: number; // 1-5
  signal: string;
  value: any;
  source: string;
  timestamp: string;
}

export interface FailurePattern {
  patternId: string;
  type: string;
  frequency: number;
  lastOccurrence: string;
  impact: number; // 0-100
  affectedEntities: string[];
}

export interface MemoryContradiction {
  contradiction_id: string;
  memory1_id: string;
  memory2_id: string;
  content1: string;
  content2: string;
  contradiction_type: string;
  confidence: number;
  severity: number; // 1-5
}

export interface AgentPerformanceIssue {
  agentName: string;
  metricType: 'success_rate' | 'latency' | 'error_rate' | 'reliability';
  currentValue: number;
  baselineValue: number;
  degradationPercentage: number;
  trend: 'improving' | 'stable' | 'worsening';
  affectedRuns: number;
}

class WeaknessClusterModel {
  /**
   * Analyze all signals and cluster related weaknesses
   */
  async analyzeSystems(params: {
    workspaceId: string;
    lookbackDays?: number;
  }): Promise<WeaknessCluster[]> {
    const supabase = await getSupabaseServer();
    const lookbackDays = params.lookbackDays || 7;
    const lookbackDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

    try {
      // 1. Detect memory contradictions
      const memoryContradictions = await this.detectMemoryContradictions(params.workspaceId);

      // 2. Analyze agent performance
      const agentIssues = await this.analyzeAgentPerformance(params.workspaceId, lookbackDate);

      // 3. Detect orchestration bottlenecks
      const bottlenecks = await this.detectOrchestrationBottlenecks(params.workspaceId, lookbackDate);

      // 4. Identify cross-agent conflicts
      const conflicts = await this.identifyCrossAgentConflicts(params.workspaceId, lookbackDate);

      // 5. Analyze temporal patterns
      const temporalPatterns = await this.analyzeTemporalPatterns(params.workspaceId, lookbackDate);

      // 6. Cluster related weaknesses
      const clusters = this.clusterWeaknesses({
        memoryContradictions,
        agentIssues,
        bottlenecks,
        conflicts,
        temporalPatterns,
      });

      return clusters;
    } catch (error) {
      console.error('Error analyzing systems:', error);
      throw error;
    }
  }

  /**
   * Detect contradictions between memories
   */
  async detectMemoryContradictions(workspaceId: string): Promise<MemoryContradiction[]> {
    const supabase = await getSupabaseServer();
    const contradictions: MemoryContradiction[] = [];

    try {
      // Fetch recent memories
      const { data: memories } = await supabase
        .from('ai_memory')
        .select('id, content, keywords, importance, confidence')
        .eq('workspace_id', workspaceId)
        .order('importance', { ascending: false })
        .limit(100);

      if (!memories || memories.length < 2) {
        return [];
      }

      // Check for contradictions pairwise
      for (let i = 0; i < memories.length; i++) {
        for (let j = i + 1; j < memories.length; j++) {
          const mem1 = memories[i];
          const mem2 = memories[j];

          // Simple contradiction detection: check for opposite keywords
          const contradiction = this.checkForContradiction(mem1, mem2);

          if (contradiction) {
            contradictions.push({
              contradiction_id: `contradiction_${i}_${j}`,
              memory1_id: mem1.id,
              memory2_id: mem2.id,
              content1: mem1.content?.substring(0, 200) || '',
              content2: mem2.content?.substring(0, 200) || '',
              contradiction_type: contradiction.type,
              confidence: contradiction.confidence,
              severity: contradiction.severity,
            });
          }
        }
      }

      return contradictions.sort((a, b) => b.severity - a.severity).slice(0, 10);
    } catch (error) {
      console.error('Error detecting memory contradictions:', error);
      return [];
    }
  }

  /**
   * Analyze agent performance over time
   */
  async analyzeAgentPerformance(workspaceId: string, lookbackDate: string): Promise<AgentPerformanceIssue[]> {
    const supabase = await getSupabaseServer();
    const issues: AgentPerformanceIssue[] = [];

    try {
      // Fetch recent autonomy runs
      const { data: runs } = await supabase
        .from('global_autonomy_runs')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('created_at', lookbackDate)
        .order('created_at', { ascending: true });

      if (!runs || runs.length === 0) {
        return [];
      }

      // Group by agent and calculate metrics
      const agentMetrics: Record<string, any> = {};

      for (const run of runs) {
        if (!run.active_agents) continue;

        for (const agent of run.active_agents) {
          if (!agentMetrics[agent]) {
            agentMetrics[agent] = {
              runs: 0,
              completedSteps: 0,
              failedSteps: 0,
              riskScores: [],
              uncertaintyScores: [],
            };
          }

          agentMetrics[agent].runs++;
          agentMetrics[agent].completedSteps += run.completed_steps || 0;
          agentMetrics[agent].failedSteps += run.failed_steps || 0;
          agentMetrics[agent].riskScores.push(run.risk_score || 0);
          agentMetrics[agent].uncertaintyScores.push(run.uncertainty_score || 0);
        }
      }

      // Calculate baseline from first 20% of runs
      const baselineSize = Math.ceil(runs.length * 0.2);
      const baselineRuns = runs.slice(0, baselineSize);

      const baselineMetrics: Record<string, any> = {};
      for (const run of baselineRuns) {
        if (!run.active_agents) continue;

        for (const agent of run.active_agents) {
          if (!baselineMetrics[agent]) {
            baselineMetrics[agent] = {
              successRate: 0,
              avgLatency: 0,
              count: 0,
            };
          }

          const successRate = (run.completed_steps / Math.max(run.total_steps, 1)) * 100;
          baselineMetrics[agent].successRate += successRate;
          baselineMetrics[agent].count++;
        }
      }

      // Analyze each agent
      for (const [agent, metrics] of Object.entries(agentMetrics)) {
        const successRate = (metrics.completedSteps / Math.max(metrics.completedSteps + metrics.failedSteps, 1)) * 100;
        const baselineSuccessRate = baselineMetrics[agent]?.successRate / Math.max(baselineMetrics[agent]?.count || 1, 1) || 85;
        const degradation = baselineSuccessRate - successRate;

        if (degradation > 5) {
          // More than 5% degradation
          const avgRiskScore = metrics.riskScores.reduce((a, b) => a + b, 0) / metrics.riskScores.length;

          issues.push({
            agentName: agent,
            metricType: 'success_rate',
            currentValue: Math.round(successRate),
            baselineValue: Math.round(baselineSuccessRate),
            degradationPercentage: Math.round(degradation),
            trend: this.calculateTrend(metrics.riskScores),
            affectedRuns: metrics.runs,
          });
        }

        // Check for high error rate
        const errorRate = (metrics.failedSteps / Math.max(metrics.completedSteps + metrics.failedSteps, 1)) * 100;
        if (errorRate > 15) {
          issues.push({
            agentName: agent,
            metricType: 'error_rate',
            currentValue: Math.round(errorRate),
            baselineValue: 10,
            degradationPercentage: Math.round(errorRate - 10),
            trend: this.calculateTrend(metrics.riskScores),
            affectedRuns: metrics.runs,
          });
        }
      }

      return issues;
    } catch (error) {
      console.error('Error analyzing agent performance:', error);
      return [];
    }
  }

  /**
   * Detect orchestration bottlenecks
   */
  async detectOrchestrationBottlenecks(workspaceId: string, lookbackDate: string): Promise<any[]> {
    const supabase = await getSupabaseServer();
    const bottlenecks: any[] = [];

    try {
      // Fetch orchestrator tasks with high latency
      const { data: tasks } = await supabase
        .from('orchestrator_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('created_at', lookbackDate);

      if (!tasks || tasks.length === 0) {
        return [];
      }

      // Identify tasks with long execution times
      const avgExecutionTime = this.calculateAverageExecutionTime(tasks);

      for (const task of tasks) {
        const executionTime = this.calculateTaskExecutionTime(task);

        if (executionTime > avgExecutionTime * 1.5) {
          // 50% slower than average
          bottlenecks.push({
            bottleneck_id: task.id,
            task_name: task.objective,
            execution_time: executionTime,
            avg_execution_time: avgExecutionTime,
            overhead_percentage: Math.round(((executionTime - avgExecutionTime) / avgExecutionTime) * 100),
            affected_steps: task.total_steps || 0,
            severity: Math.min(5, Math.ceil(((executionTime - avgExecutionTime) / avgExecutionTime) * 5)),
          });
        }
      }

      return bottlenecks.sort((a, b) => b.overhead_percentage - a.overhead_percentage);
    } catch (error) {
      console.error('Error detecting orchestration bottlenecks:', error);
      return [];
    }
  }

  /**
   * Identify cross-agent conflicts
   */
  async identifyCrossAgentConflicts(workspaceId: string, lookbackDate: string): Promise<any[]> {
    const supabase = await getSupabaseServer();
    const conflicts: any[] = [];

    try {
      // Fetch autonomy runs with multiple agents
      const { data: runs } = await supabase
        .from('global_autonomy_runs')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('created_at', lookbackDate)
        .filter('jsonb_array_length(active_agents)', 'gt', 1); // Multiple agents

      if (!runs || runs.length === 0) {
        return [];
      }

      // Identify runs with failures when multiple agents were active
      const failedMultiAgentRuns = runs.filter(r => r.failed_steps > 0 && r.active_agents?.length > 1);

      for (const run of failedMultiAgentRuns) {
        const agents = run.active_agents || [];

        // Check for conflicting objectives or resource contention
        conflicts.push({
          conflict_id: run.id,
          run_id: run.id,
          involved_agents: agents,
          conflict_type: 'multi_agent_failure',
          failed_steps: run.failed_steps,
          total_steps: run.total_steps,
          severity: Math.min(5, Math.ceil((run.failed_steps / run.total_steps) * 5)),
          risk_score: run.risk_score,
        });
      }

      return conflicts.slice(0, 5);
    } catch (error) {
      console.error('Error identifying cross-agent conflicts:', error);
      return [];
    }
  }

  /**
   * Analyze temporal patterns in failures
   */
  async analyzeTemporalPatterns(workspaceId: string, lookbackDate: string): Promise<any[]> {
    const supabase = await getSupabaseServer();
    const patterns: any[] = [];

    try {
      // Fetch all autonomy runs
      const { data: runs } = await supabase
        .from('global_autonomy_runs')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('created_at', lookbackDate)
        .order('created_at', { ascending: true });

      if (!runs || runs.length < 3) {
        return [];
      }

      // Analyze patterns by hour of day
      const hourlyFailures: Record<number, number> = {};
      const hourlyRuns: Record<number, number> = {};

      for (const run of runs) {
        const hour = new Date(run.created_at).getHours();

        hourlyRuns[hour] = (hourlyRuns[hour] || 0) + 1;
        if (run.failed_steps > 0) {
          hourlyFailures[hour] = (hourlyFailures[hour] || 0) + 1;
        }
      }

      // Identify hours with high failure rates
      for (const [hour, failures] of Object.entries(hourlyFailures)) {
        const runs = hourlyRuns[parseInt(hour)] || 1;
        const failureRate = (failures / runs) * 100;

        if (failureRate > 30) {
          patterns.push({
            pattern_id: `temporal_${hour}`,
            pattern_type: 'hourly_failure_spike',
            hour_of_day: parseInt(hour),
            failure_count: failures,
            total_runs: runs,
            failure_rate: Math.round(failureRate),
            severity: Math.min(5, Math.ceil(failureRate / 20)),
          });
        }
      }

      // Analyze day-of-week patterns
      const dayFailures: Record<number, number> = {};
      const dayRuns: Record<number, number> = {};

      for (const run of runs) {
        const day = new Date(run.created_at).getDay();

        dayRuns[day] = (dayRuns[day] || 0) + 1;
        if (run.failed_steps > 0) {
          dayFailures[day] = (dayFailures[day] || 0) + 1;
        }
      }

      for (const [day, failures] of Object.entries(dayFailures)) {
        const runs = dayRuns[parseInt(day)] || 1;
        const failureRate = (failures / runs) * 100;

        if (failureRate > 25) {
          patterns.push({
            pattern_id: `temporal_day_${day}`,
            pattern_type: 'daily_failure_pattern',
            day_of_week: parseInt(day),
            failure_count: failures,
            total_runs: runs,
            failure_rate: Math.round(failureRate),
            severity: Math.min(5, Math.ceil(failureRate / 20)),
          });
        }
      }

      return patterns;
    } catch (error) {
      console.error('Error analyzing temporal patterns:', error);
      return [];
    }
  }

  /**
   * Private: Check for contradiction between two memories
   */
  private checkForContradiction(
    mem1: any,
    mem2: any
  ): { type: string; confidence: number; severity: number } | null {
    // Simple check: opposite keywords
    const keywords1 = (mem1.keywords || []).map((k: string) => k.toLowerCase());
    const keywords2 = (mem2.keywords || []).map((k: string) => k.toLowerCase());

    // Opposite pairs
    const opposites = [
      ['success', 'failure'],
      ['ready', 'unready'],
      ['complete', 'incomplete'],
      ['healthy', 'unhealthy'],
    ];

    for (const [word1, word2] of opposites) {
      if ((keywords1.includes(word1) && keywords2.includes(word2)) ||
          (keywords1.includes(word2) && keywords2.includes(word1))) {
        return {
          type: 'opposite_keywords',
          confidence: 70,
          severity: 3,
        };
      }
    }

    // Check content similarity for conflicting information
    const content1 = (mem1.content || '').toLowerCase();
    const content2 = (mem2.content || '').toLowerCase();

    if (content1.includes('not ') && content2.includes('must ')) {
      return {
        type: 'direct_contradiction',
        confidence: 80,
        severity: 4,
      };
    }

    return null;
  }

  /**
   * Private: Calculate trend from risk scores
   */
  private calculateTrend(scores: number[]): 'improving' | 'stable' | 'worsening' {
    if (scores.length < 3) return 'stable';

    const recent = scores.slice(-3);
    const older = scores.slice(0, 3);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 10) return 'worsening';
    if (change < -10) return 'improving';

    return 'stable';
  }

  /**
   * Private: Calculate average execution time for tasks
   */
  private calculateAverageExecutionTime(tasks: any[]): number {
    if (tasks.length === 0) return 0;

    const totalTime = tasks.reduce((sum, task) => {
      return sum + this.calculateTaskExecutionTime(task);
    }, 0);

    return totalTime / tasks.length;
  }

  /**
   * Private: Calculate execution time for a task
   */
  private calculateTaskExecutionTime(task: any): number {
    if (!task.started_at || !task.completed_at) return 0;

    const start = new Date(task.started_at).getTime();
    const end = new Date(task.completed_at).getTime();

    return Math.max(0, end - start);
  }

  /**
   * Private: Cluster weaknesses by type and relationships
   */
  private clusterWeaknesses(signals: any): WeaknessCluster[] {
    const clusters: WeaknessCluster[] = [];
    let clusterId = 0;

    // Memory contradiction cluster
    if (signals.memoryContradictions && signals.memoryContradictions.length > 0) {
      const affectedMemories = new Set<string>();
      const nodes: WeaknessNode[] = [];

      for (const contradiction of signals.memoryContradictions) {
        affectedMemories.add(contradiction.memory1_id);
        affectedMemories.add(contradiction.memory2_id);

        nodes.push({
          nodeId: `mem_${contradiction.contradiction_id}`,
          nodeType: 'memory_contradiction',
          severity: contradiction.severity,
          signal: contradiction.contradiction_type,
          value: {
            mem1: contradiction.memory1_id,
            mem2: contradiction.memory2_id,
          },
          source: 'memory_system',
          timestamp: new Date().toISOString(),
        });
      }

      clusters.push({
        clusterId: `cluster_${clusterId++}`,
        clusterType: 'memory_contradiction',
        severity: Math.max(...signals.memoryContradictions.map((c: any) => c.severity)),
        confidence: 75,
        affectedAgents: [],
        affectedMemories: Array.from(affectedMemories),
        nodes,
        patterns: [],
        rootCauses: ['Inconsistent memory state', 'Conflicting learning outcomes'],
        createdAt: new Date().toISOString(),
      });
    }

    // Agent performance cluster
    if (signals.agentIssues && signals.agentIssues.length > 0) {
      const affectedAgents = new Set<string>();
      const nodes: WeaknessNode[] = [];

      for (const issue of signals.agentIssues) {
        affectedAgents.add(issue.agentName);

        nodes.push({
          nodeId: `agent_${issue.agentName}_${issue.metricType}`,
          nodeType: 'agent_failure',
          severity: Math.min(5, Math.ceil(issue.degradationPercentage / 20)),
          signal: `${issue.metricType} degradation`,
          value: {
            currentValue: issue.currentValue,
            baselineValue: issue.baselineValue,
            degradation: issue.degradationPercentage,
          },
          source: 'orchestrator_runs',
          timestamp: new Date().toISOString(),
        });
      }

      clusters.push({
        clusterId: `cluster_${clusterId++}`,
        clusterType: 'agent_performance',
        severity: Math.max(...signals.agentIssues.map((i: any) => Math.min(5, Math.ceil(i.degradationPercentage / 20)))),
        confidence: 80,
        affectedAgents: Array.from(affectedAgents),
        affectedMemories: [],
        nodes,
        patterns: signals.agentIssues.map((i: any) => ({
          patternId: `pattern_${i.agentName}`,
          type: i.metricType,
          frequency: i.affectedRuns,
          lastOccurrence: new Date().toISOString(),
          impact: i.degradationPercentage,
          affectedEntities: [i.agentName],
        })),
        rootCauses: ['Agent performance degradation', 'Resource constraints'],
        createdAt: new Date().toISOString(),
      });
    }

    // Orchestration bottleneck cluster
    if (signals.bottlenecks && signals.bottlenecks.length > 0) {
      const nodes: WeaknessNode[] = [];

      for (const bottleneck of signals.bottlenecks) {
        nodes.push({
          nodeId: `bottleneck_${bottleneck.bottleneck_id}`,
          nodeType: 'orchestration_bottleneck',
          severity: bottleneck.severity,
          signal: `Task execution delay: ${bottleneck.overhead_percentage}%`,
          value: {
            executionTime: bottleneck.execution_time,
            avgTime: bottleneck.avg_execution_time,
          },
          source: 'orchestrator_tasks',
          timestamp: new Date().toISOString(),
        });
      }

      clusters.push({
        clusterId: `cluster_${clusterId++}`,
        clusterType: 'orchestration_bottleneck',
        severity: Math.max(...signals.bottlenecks.map((b: any) => b.severity)),
        confidence: 70,
        affectedAgents: [],
        affectedMemories: [],
        nodes,
        patterns: [],
        rootCauses: ['Slow task execution', 'Resource limitations'],
        createdAt: new Date().toISOString(),
      });
    }

    // Cross-agent conflict cluster
    if (signals.conflicts && signals.conflicts.length > 0) {
      const affectedAgents = new Set<string>();
      const nodes: WeaknessNode[] = [];

      for (const conflict of signals.conflicts) {
        for (const agent of conflict.involved_agents) {
          affectedAgents.add(agent);
        }

        nodes.push({
          nodeId: `conflict_${conflict.conflict_id}`,
          nodeType: 'cross_agent_conflict',
          severity: conflict.severity,
          signal: 'Multi-agent execution failure',
          value: {
            agents: conflict.involved_agents,
            failedSteps: conflict.failed_steps,
          },
          source: 'global_autonomy_runs',
          timestamp: new Date().toISOString(),
        });
      }

      clusters.push({
        clusterId: `cluster_${clusterId++}`,
        clusterType: 'cross_agent_conflict',
        severity: Math.max(...signals.conflicts.map((c: any) => c.severity)),
        confidence: 75,
        affectedAgents: Array.from(affectedAgents),
        affectedMemories: [],
        nodes,
        patterns: [],
        rootCauses: ['Agent resource contention', 'Conflicting objectives'],
        createdAt: new Date().toISOString(),
      });
    }

    // Temporal pattern cluster
    if (signals.temporalPatterns && signals.temporalPatterns.length > 0) {
      const nodes: WeaknessNode[] = [];

      for (const pattern of signals.temporalPatterns) {
        nodes.push({
          nodeId: `temporal_${pattern.pattern_id}`,
          nodeType: 'temporal_pattern',
          severity: pattern.severity,
          signal: pattern.pattern_type,
          value: {
            failureRate: pattern.failure_rate,
            timeUnit: pattern.hour_of_day !== undefined ? 'hour' : 'day',
          },
          source: 'autonomy_runs',
          timestamp: new Date().toISOString(),
        });
      }

      clusters.push({
        clusterId: `cluster_${clusterId++}`,
        clusterType: 'temporal_pattern',
        severity: Math.max(...signals.temporalPatterns.map((p: any) => p.severity)),
        confidence: 65,
        affectedAgents: [],
        affectedMemories: [],
        nodes,
        patterns: signals.temporalPatterns.map((p: any) => ({
          patternId: `pattern_${p.pattern_id}`,
          type: p.pattern_type,
          frequency: p.total_runs,
          lastOccurrence: new Date().toISOString(),
          impact: p.failure_rate,
          affectedEntities: [],
        })),
        rootCauses: ['System load patterns', 'Temporal dependencies'],
        createdAt: new Date().toISOString(),
      });
    }

    return clusters;
  }
}

export const weaknessClusterModel = new WeaknessClusterModel();
