import { EventEmitter } from 'events';
import { createClient } from '@/lib/supabase/server';

interface Process {
  id: string;
  name: string;
  description: string;
  steps: ProcessStep[];
  triggers: ProcessTrigger[];
  status: 'active' | 'inactive' | 'paused';
  metrics: ProcessMetrics;
  createdAt: Date;
  updatedAt: Date;
}

interface ProcessStep {
  id: string;
  name: string;
  type: 'action' | 'decision' | 'wait' | 'parallel';
  action?: {
    type: string;
    params: Record<string, unknown>;
  };
  decision?: {
    condition: string;
    truePath: string;
    falsePath: string;
  };
  wait?: {
    duration?: number;
    until?: string;
  };
  parallel?: string[];
  nextStep?: string;
  retryPolicy?: {
    maxAttempts: number;
    backoff: 'linear' | 'exponential';
    initialDelay: number;
  };
}

interface ProcessTrigger {
  id: string;
  type: 'schedule' | 'event' | 'webhook' | 'condition';
  schedule?: {
    cron: string;
    timezone: string;
  };
  event?: {
    source: string;
    type: string;
    filters?: Record<string, unknown>;
  };
  webhook?: {
    url: string;
    secret: string;
  };
  condition?: {
    expression: string;
    checkInterval: number;
  };
}

interface ProcessMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageDuration: number;
  lastRunAt?: Date;
  lastSuccess?: Date;
  lastFailure?: Date;
}

interface ProcessInstance {
  id: string;
  processId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentStep: string;
  startedAt: Date;
  completedAt?: Date;
  context: Record<string, unknown>;
  logs: ProcessLog[];
  error?: string;
}

interface ProcessLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  stepId?: string;
  data?: Record<string, unknown>;
}

export class ProcessAutomation extends EventEmitter {
  private processes: Map<string, Process> = new Map();
  private instances: Map<string, ProcessInstance> = new Map();
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private automationInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    // Load processes from database
    await this.loadProcesses();
    
    // Start automation engine
    this.startAutomation();
  }

  private async loadProcesses() {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('ai_processes')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      if (data) {
        data.forEach(process => {
          this.processes.set(process.id, process);
          this.setupTriggers(process);
        });
      }
    } catch (error) {
      console.error('Failed to load processes:', error);
    }
  }

  private setupTriggers(process: Process) {
    process.triggers.forEach(trigger => {
      switch (trigger.type) {
        case 'schedule':
          this.setupScheduleTrigger(process.id, trigger);
          break;
        case 'event':
          this.setupEventTrigger(process.id, trigger);
          break;
        case 'webhook':
          this.setupWebhookTrigger(process.id, trigger);
          break;
        case 'condition':
          this.setupConditionTrigger(process.id, trigger);
          break;
      }
    });
  }

  private setupScheduleTrigger(processId: string, trigger: ProcessTrigger) {
    if (!trigger.schedule) return;

    // Simple interval-based scheduling for demo
    // In production, use a proper cron library
    const interval = this.parseCronToInterval(trigger.schedule.cron);
    
    const job = setInterval(() => {
      this.startProcess(processId, { trigger: 'schedule' });
    }, interval);

    this.scheduledJobs.set(`${processId}-${trigger.id}`, job);
  }

  private parseCronToInterval(cron: string): number {
    // Simplified cron parsing - in production use node-cron
    if (cron.includes('* * * * *')) return 60000; // Every minute
    if (cron.includes('*/5 * * * *')) return 300000; // Every 5 minutes
    if (cron.includes('0 * * * *')) return 3600000; // Every hour
    return 86400000; // Daily default
  }

  private setupEventTrigger(processId: string, trigger: ProcessTrigger) {
    if (!trigger.event) return;

    // Subscribe to event bus
    this.on(trigger.event.type, (data) => {
      if (this.matchesFilters(data, trigger.event!.filters)) {
        this.startProcess(processId, { trigger: 'event', eventData: data });
      }
    });
  }

  private setupWebhookTrigger(processId: string, _trigger: ProcessTrigger) {
    // Webhook triggers would be handled by API endpoints
    console.log(`Webhook trigger setup for process ${processId}`);
  }

  private setupConditionTrigger(processId: string, trigger: ProcessTrigger) {
    if (!trigger.condition) return;

    setInterval(async () => {
      if (await this.evaluateCondition(trigger.condition!.expression)) {
        this.startProcess(processId, { trigger: 'condition' });
      }
    }, trigger.condition.checkInterval);
  }

  private matchesFilters(data: Record<string, unknown>, filters?: Record<string, unknown>): boolean {
    if (!filters) return true;

    return Object.entries(filters).every(([key, value]) => {
      return data[key] === value;
    });
  }

  private async evaluateCondition(_expression: string): Promise<boolean> {
    // Simple expression evaluation - in production use a safe evaluator
    try {
      // This is a placeholder - implement safe expression evaluation
      return Math.random() > 0.5;
    } catch {
      return false;
    }
  }

  async startProcess(processId: string, context: Record<string, unknown> = {}): Promise<string> {
    const process = this.processes.get(processId);
    if (!process) {
      throw new Error(`Process ${processId} not found`);
    }

    const instance: ProcessInstance = {
      id: `inst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      processId,
      status: 'running',
      currentStep: process.steps[0].id,
      startedAt: new Date(),
      context,
      logs: []
    };

    this.instances.set(instance.id, instance);
    this.emit('process:started', { process, instance });

    // Start execution
    this.executeInstance(instance.id);

    return instance.id;
  }

  private async executeInstance(instanceId: string) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    const process = this.processes.get(instance.processId);
    if (!process) return;

    try {
      while (instance.status === 'running' && instance.currentStep) {
        const step = process.steps.find(s => s.id === instance.currentStep);
        if (!step) {
          throw new Error(`Step ${instance.currentStep} not found`);
        }

        await this.executeStep(instance, step);

        if (instance.status !== 'running') break;

        // Move to next step
        if (step.nextStep) {
          instance.currentStep = step.nextStep;
        } else {
          // Process completed
          instance.status = 'completed';
          instance.completedAt = new Date();
        }
      }

      if (instance.status === 'completed') {
        this.updateProcessMetrics(instance.processId, true, instance);
        this.emit('process:completed', { process, instance });
      }

    } catch (error) {
      instance.status = 'failed';
      instance.error = error instanceof Error ? error.message : 'Unknown error';
      instance.completedAt = new Date();
      
      this.updateProcessMetrics(instance.processId, false, instance);
      this.emit('process:failed', { process, instance, error });
    }

    // Store final state
    await this.storeInstance(instance);
  }

  private async executeStep(instance: ProcessInstance, step: ProcessStep) {
    this.logInstance(instance, 'info', `Executing step: ${step.name}`, step.id);

    try {
      switch (step.type) {
        case 'action':
          await this.executeAction(instance, step);
          break;
        case 'decision':
          await this.executeDecision(instance, step);
          break;
        case 'wait':
          await this.executeWait(instance, step);
          break;
        case 'parallel':
          await this.executeParallel(instance, step);
          break;
      }
    } catch (error) {
      if (step.retryPolicy) {
        await this.retryStep(instance, step, error as Error);
      } else {
        throw error;
      }
    }
  }

  private async executeAction(instance: ProcessInstance, step: ProcessStep) {
    if (!step.action) return;

    // Execute the action based on type
    switch (step.action.type) {
      case 'http':
        await this.executeHttpAction(instance, step.action.params);
        break;
      case 'database':
        await this.executeDatabaseAction(instance, step.action.params);
        break;
      case 'email':
        await this.executeEmailAction(instance, step.action.params);
        break;
      case 'function':
        await this.executeFunctionAction(instance, step.action.params);
        break;
      default:
        throw new Error(`Unknown action type: ${step.action.type}`);
    }
  }

  private async executeHttpAction(instance: ProcessInstance, params: Record<string, unknown>) {
    // Simulate HTTP request
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.logInstance(instance, 'info', 'HTTP action executed', undefined, params);
  }

  private async executeDatabaseAction(instance: ProcessInstance, params: Record<string, unknown>) {
    const _supabase = await createClient();
    // Execute database operation based on params
    this.logInstance(instance, 'info', 'Database action executed', undefined, params);
  }

  private async executeEmailAction(instance: ProcessInstance, params: Record<string, unknown>) {
    // Send email using email service
    this.logInstance(instance, 'info', 'Email action executed', undefined, params);
  }

  private async executeFunctionAction(instance: ProcessInstance, params: Record<string, unknown>) {
    // Execute custom function
    this.logInstance(instance, 'info', 'Function action executed', undefined, params);
  }

  private async executeDecision(instance: ProcessInstance, step: ProcessStep) {
    if (!step.decision) return;

    const result = await this.evaluateCondition(step.decision.condition);
    
    if (result) {
      instance.currentStep = step.decision.truePath;
    } else {
      instance.currentStep = step.decision.falsePath;
    }

    this.logInstance(instance, 'info', `Decision result: ${result}`, step.id);
  }

  private async executeWait(instance: ProcessInstance, step: ProcessStep) {
    if (!step.wait) return;

    if (step.wait.duration) {
      await new Promise(resolve => setTimeout(resolve, step.wait.duration));
    } else if (step.wait.until) {
      // Wait until condition is met
      while (!await this.evaluateCondition(step.wait.until)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async executeParallel(instance: ProcessInstance, step: ProcessStep) {
    if (!step.parallel) return;

    const promises = step.parallel.map(stepId => {
      const parallelStep = this.processes.get(instance.processId)?.steps.find(s => s.id === stepId);
      if (parallelStep) {
        return this.executeStep(instance, parallelStep);
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
  }

  private async retryStep(instance: ProcessInstance, step: ProcessStep, error: Error) {
    // Implement retry logic
    throw error; // For now, just re-throw
  }

  private logInstance(
    instance: ProcessInstance,
    level: ProcessLog['level'],
    message: string,
    stepId?: string,
    data?: Record<string, unknown>
  ) {
    instance.logs.push({
      timestamp: new Date(),
      level,
      message,
      stepId,
      data
    });
  }

  private updateProcessMetrics(processId: string, success: boolean, instance: ProcessInstance) {
    const process = this.processes.get(processId);
    if (!process) return;

    process.metrics.totalRuns++;
    if (success) {
      process.metrics.successfulRuns++;
      process.metrics.lastSuccess = new Date();
    } else {
      process.metrics.failedRuns++;
      process.metrics.lastFailure = new Date();
    }

    process.metrics.lastRunAt = new Date();
    
    // Update average duration
    const duration = instance.completedAt ? 
      instance.completedAt.getTime() - instance.startedAt.getTime() : 0;
    
    process.metrics.averageDuration = 
      (process.metrics.averageDuration * (process.metrics.totalRuns - 1) + duration) / 
      process.metrics.totalRuns;
  }

  private async storeInstance(instance: ProcessInstance) {
    try {
      const supabase = await createClient();
      await supabase
        .from('ai_process_instances')
        .insert({
          id: instance.id,
          process_id: instance.processId,
          status: instance.status,
          started_at: instance.startedAt,
          completed_at: instance.completedAt,
          context: instance.context,
          logs: instance.logs,
          error: instance.error
        });
    } catch (error) {
      console.error('Failed to store process instance:', error);
    }
  }

  private startAutomation() {
    this.automationInterval = setInterval(() => {
      this.checkAutomationHealth();
    }, 60000); // Check every minute
  }

  private checkAutomationHealth() {
    // Monitor running instances
    const runningInstances = Array.from(this.instances.values())
      .filter(i => i.status === 'running');

    runningInstances.forEach(instance => {
      const runtime = Date.now() - instance.startedAt.getTime();
      if (runtime > 3600000) { // 1 hour timeout
        instance.status = 'failed';
        instance.error = 'Process timeout';
        this.emit('process:timeout', instance);
      }
    });
  }

  async getProcessStatus(): Promise<{
    processes: Process[];
    runningInstances: ProcessInstance[];
    metrics: {
      totalProcesses: number;
      activeProcesses: number;
      totalInstances: number;
      runningInstances: number;
      successRate: number;
    };
  }> {
    const processes = Array.from(this.processes.values());
    const instances = Array.from(this.instances.values());
    const runningInstances = instances.filter(i => i.status === 'running');

    const totalRuns = processes.reduce((sum, p) => sum + p.metrics.totalRuns, 0);
    const successfulRuns = processes.reduce((sum, p) => sum + p.metrics.successfulRuns, 0);

    return {
      processes,
      runningInstances,
      metrics: {
        totalProcesses: processes.length,
        activeProcesses: processes.filter(p => p.status === 'active').length,
        totalInstances: instances.length,
        runningInstances: runningInstances.length,
        successRate: totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0
      }
    };
  }

  destroy() {
    // Clear all scheduled jobs
    for (const job of this.scheduledJobs.values()) {
      clearInterval(job);
    }
    this.scheduledJobs.clear();

    // Stop automation
    if (this.automationInterval) {
      clearInterval(this.automationInterval);
    }
  }
}
