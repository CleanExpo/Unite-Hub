import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase/server';
import { ProcessAutomation } from '../orchestration/ProcessAutomation';
import { DecisionEngine } from '../orchestration/DecisionEngine';

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  metrics: WorkflowMetrics;
  optimizations: Optimization[];
  version: number;
  status: 'active' | 'testing' | 'retired';
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowStep {
  id: string;
  name: string;
  type: 'manual' | 'automated' | 'decision' | 'parallel';
  duration: {
    average: number;
    min: number;
    max: number;
  };
  cost: number;
  errorRate: number;
  dependencies: string[];
  automatable: boolean;
  optimizationPotential: number;
}

interface WorkflowMetrics {
  totalExecutions: number;
  averageDuration: number;
  averageCost: number;
  errorRate: number;
  throughput: number;
  bottlenecks: Bottleneck[];
  efficiency: number;
}

interface Bottleneck {
  stepId: string;
  impact: number;
  frequency: number;
  suggestions: string[];
}

interface Optimization {
  id: string;
  type: 'automation' | 'parallelization' | 'elimination' | 'simplification' | 'reordering';
  targetSteps: string[];
  expectedImprovement: {
    duration: number;
    cost: number;
    errorRate: number;
  };
  implementationCost: number;
  priority: number;
  status: 'proposed' | 'testing' | 'implemented' | 'rejected';
  results?: OptimizationResult;
}

interface OptimizationResult {
  actualImprovement: {
    duration: number;
    cost: number;
    errorRate: number;
  };
  implementedAt: Date;
  feedback: string;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  stepExecutions: StepExecution[];
  totalCost: number;
  errors: Error[];
}

interface StepExecution {
  stepId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  cost: number;
  error?: string;
}

export class WorkflowOptimizer extends EventEmitter {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution[]> = new Map();
  private processAutomation: ProcessAutomation;
  private decisionEngine: DecisionEngine;
  private optimizationInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.processAutomation = new ProcessAutomation();
    this.decisionEngine = new DecisionEngine();
    this.initialize();
  }

  private async initialize() {
    await this.loadWorkflows();
    await this.loadExecutionHistory();
    this.startContinuousOptimization();
  }

  private async loadWorkflows() {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('ai_workflows')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      if (data) {
        data.forEach(workflow => {
          this.workflows.set(workflow.id, workflow);
        });
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  }

  private async loadExecutionHistory() {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('ai_workflow_executions')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(10000);

      if (error) throw error;

      if (data) {
        data.forEach(execution => {
          if (!this.executions.has(execution.workflow_id)) {
            this.executions.set(execution.workflow_id, []);
          }
          this.executions.get(execution.workflow_id)!.push(execution);
        });
      }
    } catch (error) {
      console.error('Failed to load execution history:', error);
    }
  }

  private startContinuousOptimization() {
    // Initial optimization
    this.optimizeAllWorkflows();

    // Continuous optimization every hour
    this.optimizationInterval = setInterval(() => {
      this.optimizeAllWorkflows();
    }, 3600000); // 1 hour
  }

  private async optimizeAllWorkflows() {
    for (const [workflowId, _workflow] of this.workflows) {
      try {
        await this.analyzeAndOptimize(workflowId);
      } catch (error) {
        console.error(`Failed to optimize workflow ${workflowId}:`, error);
      }
    }
  }

  async analyzeAndOptimize(workflowId: string): Promise<Optimization[]> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    // Analyze workflow performance
    const metrics = await this.calculateMetrics(workflow);
    workflow.metrics = metrics;

    // Identify optimization opportunities
    const optimizations = await this.identifyOptimizations(workflow, metrics);

    // Prioritize optimizations
    const prioritizedOptimizations = this.prioritizeOptimizations(optimizations);

    // Store optimizations
    workflow.optimizations = prioritizedOptimizations;
    await this.storeWorkflow(workflow);

    // Emit optimization event
    this.emit('workflow:optimized', {
      workflowId,
      metrics,
      optimizations: prioritizedOptimizations
    });

    return prioritizedOptimizations;
  }

  private async calculateMetrics(workflow: Workflow): Promise<WorkflowMetrics> {
    const executions = this.executions.get(workflow.id) || [];
    const completedExecutions = executions.filter(e => e.status === 'completed');

    if (completedExecutions.length === 0) {
      return {
        totalExecutions: 0,
        averageDuration: 0,
        averageCost: 0,
        errorRate: 0,
        throughput: 0,
        bottlenecks: [],
        efficiency: 0
      };
    }

    // Calculate basic metrics
    const totalDuration = completedExecutions.reduce((sum, e) => 
      sum + (e.endTime!.getTime() - e.startTime.getTime()), 0);
    const averageDuration = totalDuration / completedExecutions.length;

    const totalCost = completedExecutions.reduce((sum, e) => sum + e.totalCost, 0);
    const averageCost = totalCost / completedExecutions.length;

    const failedExecutions = executions.filter(e => e.status === 'failed');
    const errorRate = failedExecutions.length / executions.length;

    // Calculate throughput (executions per hour)
    const timeSpan = executions.length > 0 ? 
      executions[0].startTime.getTime() - executions[executions.length - 1].startTime.getTime() : 
      3600000;
    const throughput = (completedExecutions.length / timeSpan) * 3600000;

    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(workflow, executions);

    // Calculate efficiency (ratio of value-adding time to total time)
    const efficiency = this.calculateEfficiency(workflow, completedExecutions);

    return {
      totalExecutions: executions.length,
      averageDuration,
      averageCost,
      errorRate,
      throughput,
      bottlenecks,
      efficiency
    };
  }

  private identifyBottlenecks(
    workflow: Workflow, 
    executions: WorkflowExecution[]
  ): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];
    const stepDurations = new Map<string, number[]>();

    // Collect step durations
    executions.forEach(execution => {
      execution.stepExecutions.forEach(step => {
        if (step.duration) {
          if (!stepDurations.has(step.stepId)) {
            stepDurations.set(step.stepId, []);
          }
          stepDurations.get(step.stepId)!.push(step.duration);
        }
      });
    });

    // Analyze each step
    workflow.steps.forEach(step => {
      const durations = stepDurations.get(step.id) || [];
      if (durations.length === 0) return;

      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const totalWorkflowDuration = workflow.steps.reduce((sum, s) => 
        sum + s.duration.average, 0);

      const impact = avgDuration / totalWorkflowDuration;

      if (impact > 0.2) { // Step takes more than 20% of total time
        bottlenecks.push({
          stepId: step.id,
          impact,
          frequency: 1.0,
          suggestions: this.generateBottleneckSuggestions(step, avgDuration)
        });
      }
    });

    return bottlenecks.sort((a, b) => b.impact - a.impact);
  }

  private generateBottleneckSuggestions(step: WorkflowStep, avgDuration: number): string[] {
    const suggestions: string[] = [];

    if (step.automatable && step.type === 'manual') {
      suggestions.push('Automate this step to reduce duration and cost');
    }

    if (step.dependencies.length > 2) {
      suggestions.push('Consider parallelizing independent sub-tasks');
    }

    if (avgDuration > step.duration.average * 1.5) {
      suggestions.push('Investigate performance degradation');
    }

    if (step.errorRate > 0.1) {
      suggestions.push('Address high error rate to reduce rework');
    }

    return suggestions;
  }

  private calculateEfficiency(
    workflow: Workflow, 
    executions: WorkflowExecution[]
  ): number {
    if (executions.length === 0) return 0;

    let totalValueTime = 0;
    let totalElapsedTime = 0;

    executions.forEach(execution => {
      if (execution.endTime) {
        totalElapsedTime += execution.endTime.getTime() - execution.startTime.getTime();
        
        // Calculate value-adding time (time spent in actual work, not waiting)
        execution.stepExecutions.forEach(step => {
          if (step.duration && step.status === 'completed') {
            const workflowStep = workflow.steps.find(s => s.id === step.stepId);
            if (workflowStep && workflowStep.type !== 'decision') {
              totalValueTime += step.duration;
            }
          }
        });
      }
    });

    return totalElapsedTime > 0 ? totalValueTime / totalElapsedTime : 0;
  }

  private async identifyOptimizations(
    workflow: Workflow, 
    _metrics: WorkflowMetrics
  ): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];

    // Automation opportunities
    workflow.steps.forEach(step => {
      if (step.automatable && step.type === 'manual') {
        optimizations.push({
          id: `auto-${step.id}`,
          type: 'automation',
          targetSteps: [step.id],
          expectedImprovement: {
            duration: step.duration.average * 0.8,
            cost: step.cost * 0.6,
            errorRate: -step.errorRate * 0.5
          },
          implementationCost: step.cost * 20, // 20x current cost to automate
          priority: 0,
          status: 'proposed'
        });
      }
    });

    // Parallelization opportunities
    const parallelizableGroups = this.findParallelizableSteps(workflow);
    parallelizableGroups.forEach((group, index) => {
      if (group.length > 1) {
        const totalDuration = group.reduce((sum, stepId) => {
          const step = workflow.steps.find(s => s.id === stepId)!;
          return sum + step.duration.average;
        }, 0);
        const maxDuration = Math.max(...group.map(stepId => {
          const step = workflow.steps.find(s => s.id === stepId)!;
          return step.duration.average;
        }));

        optimizations.push({
          id: `parallel-${index}`,
          type: 'parallelization',
          targetSteps: group,
          expectedImprovement: {
            duration: totalDuration - maxDuration,
            cost: 0,
            errorRate: 0
          },
          implementationCost: 100,
          priority: 0,
          status: 'proposed'
        });
      }
    });

    // Elimination opportunities (steps with low value)
    workflow.steps.forEach(step => {
      if (step.optimizationPotential < 0.2) {
        optimizations.push({
          id: `eliminate-${step.id}`,
          type: 'elimination',
          targetSteps: [step.id],
          expectedImprovement: {
            duration: step.duration.average,
            cost: step.cost,
            errorRate: -step.errorRate
          },
          implementationCost: 50,
          priority: 0,
          status: 'proposed'
        });
      }
    });

    // Simplification for complex steps
    const complexSteps = workflow.steps.filter(s => 
      s.errorRate > 0.1 || s.duration.max > s.duration.average * 2
    );
    complexSteps.forEach(step => {
      optimizations.push({
        id: `simplify-${step.id}`,
        type: 'simplification',
        targetSteps: [step.id],
        expectedImprovement: {
          duration: step.duration.average * 0.2,
          cost: 0,
          errorRate: -step.errorRate * 0.3
        },
        implementationCost: 200,
        priority: 0,
        status: 'proposed'
      });
    });

    return optimizations;
  }

  private findParallelizableSteps(workflow: Workflow): string[][] {
    const groups: string[][] = [];
    const visited = new Set<string>();

    workflow.steps.forEach(step => {
      if (visited.has(step.id)) return;

      const group: string[] = [step.id];
      visited.add(step.id);

      // Find other steps that can run in parallel
      workflow.steps.forEach(otherStep => {
        if (otherStep.id !== step.id && !visited.has(otherStep.id)) {
          if (this.canRunInParallel(step, otherStep, workflow)) {
            group.push(otherStep.id);
            visited.add(otherStep.id);
          }
        }
      });

      if (group.length > 1) {
        groups.push(group);
      }
    });

    return groups;
  }

  private canRunInParallel(
    step1: WorkflowStep, 
    step2: WorkflowStep, 
    _workflow: Workflow
  ): boolean {
    // Check if steps have dependencies on each other
    if (step1.dependencies.includes(step2.id) || 
        step2.dependencies.includes(step1.id)) {
      return false;
    }

    // Check if they share critical resources
    // This is simplified - in production, check actual resource conflicts
    return true;
  }

  private prioritizeOptimizations(optimizations: Optimization[]): Optimization[] {
    return optimizations.map(opt => {
      let priority = 0;

      // ROI calculation
      const expectedSavings = 
        opt.expectedImprovement.duration * 10 + // $10 per minute saved
        opt.expectedImprovement.cost +
        Math.abs(opt.expectedImprovement.errorRate) * 1000; // $1000 per 1% error reduction

      const roi = expectedSavings / opt.implementationCost;
      priority += roi * 100;

      // Ease of implementation
      if (opt.type === 'parallelization' || opt.type === 'reordering') {
        priority += 20; // Easier to implement
      }

      // Impact scale
      if (opt.targetSteps.length > 1) {
        priority += opt.targetSteps.length * 10;
      }

      opt.priority = priority;
      return opt;
    }).sort((a, b) => b.priority - a.priority);
  }

  async implementOptimization(
    workflowId: string, 
    optimizationId: string
  ): Promise<boolean> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    const optimization = workflow.optimizations.find(o => o.id === optimizationId);
    if (!optimization || optimization.status !== 'proposed') return false;

    try {
      optimization.status = 'testing';
      this.emit('optimization:testing', { workflowId, optimization });

      // Create optimized version
      const optimizedWorkflow = await this.createOptimizedVersion(workflow, optimization);
      
      // Test the optimization
      const testResults = await this.testOptimization(optimizedWorkflow, workflow);
      
      if (testResults.successful) {
        optimization.status = 'implemented';
        optimization.results = {
          actualImprovement: testResults.improvement,
          implementedAt: new Date(),
          feedback: testResults.feedback
        };

        // Update workflow
        this.applyOptimization(workflow, optimization);
        workflow.version++;
        
        await this.storeWorkflow(workflow);
        
        this.emit('optimization:implemented', { workflowId, optimization, results: testResults });
        return true;
      } else {
        optimization.status = 'rejected';
        this.emit('optimization:rejected', { workflowId, optimization, reason: testResults.feedback });
        return false;
      }
    } catch (error) {
      optimization.status = 'rejected';
      this.emit('optimization:failed', { workflowId, optimization, error });
      return false;
    }
  }

  private async createOptimizedVersion(
    workflow: Workflow, 
    optimization: Optimization
  ): Promise<Workflow> {
    const optimized = JSON.parse(JSON.stringify(workflow)) as Workflow;

    switch (optimization.type) {
      case 'automation':
        optimization.targetSteps.forEach(stepId => {
          const step = optimized.steps.find(s => s.id === stepId);
          if (step) {
            step.type = 'automated';
            step.duration.average *= 0.2;
            step.cost *= 0.4;
            step.errorRate *= 0.5;
          }
        });
        break;

      case 'parallelization':
        // Mark steps as parallel
        optimization.targetSteps.forEach(stepId => {
          const step = optimized.steps.find(s => s.id === stepId);
          if (step) {
            step.type = 'parallel';
          }
        });
        break;

      case 'elimination':
        // Remove steps
        optimized.steps = optimized.steps.filter(s => 
          !optimization.targetSteps.includes(s.id)
        );
        break;

      case 'simplification':
        optimization.targetSteps.forEach(stepId => {
          const step = optimized.steps.find(s => s.id === stepId);
          if (step) {
            step.duration.average *= 0.8;
            step.errorRate *= 0.7;
          }
        });
        break;
    }

    return optimized;
  }

  private async testOptimization(
    optimizedWorkflow: Workflow, 
    originalWorkflow: Workflow
  ): Promise<{
    successful: boolean;
    improvement: { duration: number; cost: number; errorRate: number };
    feedback: string;
  }> {
    // Simulate testing - in production, run actual A/B tests
    const originalMetrics = originalWorkflow.metrics;
    const projectedMetrics = this.projectMetrics(optimizedWorkflow);

    const improvement = {
      duration: originalMetrics.averageDuration - projectedMetrics.averageDuration,
      cost: originalMetrics.averageCost - projectedMetrics.averageCost,
      errorRate: originalMetrics.errorRate - projectedMetrics.errorRate
    };

    const successful = improvement.duration > 0 || 
                      improvement.cost > 0 || 
                      improvement.errorRate > 0;

    const feedback = successful ? 
      'Optimization shows positive improvements' : 
      'Optimization did not yield expected improvements';

    return { successful, improvement, feedback };
  }

  private projectMetrics(workflow: Workflow): WorkflowMetrics {
    // Project metrics based on workflow structure
    const totalDuration = workflow.steps.reduce((sum, s) => sum + s.duration.average, 0);
    const totalCost = workflow.steps.reduce((sum, s) => sum + s.cost, 0);
    const avgErrorRate = workflow.steps.reduce((sum, s) => sum + s.errorRate, 0) / workflow.steps.length;

    return {
      totalExecutions: 0,
      averageDuration: totalDuration,
      averageCost: totalCost,
      errorRate: avgErrorRate,
      throughput: 3600000 / totalDuration, // Executions per hour
      bottlenecks: [],
      efficiency: 0.8
    };
  }

  private async applyOptimization(workflow: Workflow, optimization: Optimization) {
    // Apply the optimization to the actual workflow
    const optimizedVersion = await this.createOptimizedVersion(workflow, optimization);
    workflow.steps = optimizedVersion.steps;
    workflow.updatedAt = new Date();
  }

  private async storeWorkflow(workflow: Workflow) {
    try {
      const supabase = await createClient();
      await supabase
        .from('ai_workflows')
        .upsert({
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          steps: workflow.steps,
          metrics: workflow.metrics,
          optimizations: workflow.optimizations,
          version: workflow.version,
          status: workflow.status,
          updated_at: workflow.updatedAt
        });
    } catch (error) {
      console.error('Failed to store workflow:', error);
    }
  }

  async getOptimizationStatus(workflowId?: string): Promise<{
    workflows: { id: string; name: string; efficiency: number; optimizations: number }[];
    totalOptimizations: number;
    implementedOptimizations: number;
    averageImprovement: { duration: number; cost: number; errorRate: number };
  }> {
    const workflows = workflowId ? 
      [this.workflows.get(workflowId)].filter(w => w) :
      Array.from(this.workflows.values());

    const allOptimizations: Optimization[] = [];
    const workflowSummaries = workflows.map(w => {
      if (w) {
        allOptimizations.push(...w.optimizations);
        return {
          id: w.id,
          name: w.name,
          efficiency: w.metrics.efficiency,
          optimizations: w.optimizations.length
        };
      }
      return null;
    }).filter((w): w is NonNullable<typeof w> => w !== null);

    const implementedOptimizations = allOptimizations.filter(o => 
      o.status === 'implemented' && o.results
    );

    const avgImprovement = implementedOptimizations.length > 0 ? {
      duration: implementedOptimizations.reduce((sum, o) => 
        sum + o.results!.actualImprovement.duration, 0) / implementedOptimizations.length,
      cost: implementedOptimizations.reduce((sum, o) => 
        sum + o.results!.actualImprovement.cost, 0) / implementedOptimizations.length,
      errorRate: implementedOptimizations.reduce((sum, o) => 
        sum + o.results!.actualImprovement.errorRate, 0) / implementedOptimizations.length
    } : { duration: 0, cost: 0, errorRate: 0 };

    return {
      workflows: workflowSummaries,
      totalOptimizations: allOptimizations.length,
      implementedOptimizations: implementedOptimizations.length,
      averageImprovement: avgImprovement
    };
  }

  destroy() {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }
  }
}
