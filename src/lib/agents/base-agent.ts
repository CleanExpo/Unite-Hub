/**
 * Base Agent Class
 * Provides common functionality for all specialized agents
 * Enhanced with Project Vend Phase 2 metrics collection
 */

import * as amqp from 'amqplib';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getMetricsCollector } from './metrics/metricsCollector';
import { getRulesEngine, ValidationContext } from './rules/rulesEngine';
import { getEscalationManager } from './escalation/escalationManager';

export interface AgentTask {
  id: string;
  task_type: string;
  payload: Record<string, any>;
  context?: Record<string, any>;
  workspace_id: string;
  priority: number;
  retry_count: number;
  max_retries: number;
}

export interface AgentConfig {
  name: string;
  queueName: string;
  concurrency?: number;
  prefetchCount?: number;
  retryDelay?: number; // milliseconds
}

export abstract class BaseAgent {
  protected name: string;
  protected queueName: string;
  protected concurrency: number;
  protected prefetchCount: number;
  protected retryDelay: number;
  protected connection: amqp.Connection | null = null;
  protected channel: amqp.Channel | null = null;
  protected supabase: SupabaseClient;
  protected isRunning: boolean = false;

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.queueName = config.queueName;
    this.concurrency = config.concurrency || 1;
    this.prefetchCount = config.prefetchCount || this.concurrency;
    this.retryDelay = config.retryDelay || 5000;

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Connect to RabbitMQ and start consuming tasks
   */
  async start(): Promise<void> {
    try {
      console.log(`🚀 Starting ${this.name}...`);

      // Connect to RabbitMQ
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Assert queue exists
      await this.channel.assertQueue(this.queueName, {
        durable: true,
        arguments: {
          'x-message-ttl': 3600000, // 1 hour
          'x-max-priority': 10
        }
      });

      // Set prefetch count for load balancing
      await this.channel.prefetch(this.prefetchCount);

      console.log(`✅ ${this.name} connected to RabbitMQ`);
      console.log(`📥 Listening on queue: ${this.queueName}`);
      console.log(`⚙️  Concurrency: ${this.concurrency}`);

      // Start consuming messages
      this.isRunning = true;
      await this.channel.consume(this.queueName, async (msg) => {
        if (!msg) {
return;
}

        try {
          const task: AgentTask = JSON.parse(msg.content.toString());
          console.log(`📨 Received task: ${task.id} (${task.task_type})`);

          // Record execution start
          const executionId = await this.recordExecutionStart(task);

          // Validate against business rules (Project Vend Phase 2)
          const rulesEngine = getRulesEngine();
          const validationResult = await rulesEngine.validateAction({
            agent_name: this.name,
            workspace_id: task.workspace_id,
            action_type: task.task_type,
            action_data: task.payload,
            execution_id: executionId
          });

          // If blocked by rules, reject task
          if (!validationResult.allowed) {
            console.log(`🚫 Task ${task.id} blocked by business rules`);
            console.log(`   Violations: ${validationResult.violations.map(v => v.message).join(', ')}`);

            // Create escalation if required
            if (validationResult.should_escalate) {
              const escalationManager = getEscalationManager();
              await escalationManager.createEscalation({
                workspace_id: task.workspace_id,
                agent_name: this.name,
                execution_id: executionId,
                escalation_type: 'rule_violation',
                severity: 'critical',
                title: `${this.name} blocked by business rules`,
                description: validationResult.violations.map(v => v.message).join('; '),
                context: {
                  task_id: task.id,
                  task_type: task.task_type,
                  violations: validationResult.violations
                },
                requires_approval: true
              });
              console.log(`📤 Escalated to approval queue`);
            }

            await this.recordExecutionFailure(
              task.id,
              `Blocked by business rules: ${validationResult.violations.map(v => v.message).join('; ')}`,
              0,
              task.workspace_id
            );

            await this.updateTaskStatus(task.id, 'failed', null, 'Blocked by business rules');
            this.channel!.ack(msg);
            return;
          }

          // Log warnings if any (and escalate if configured)
          if (validationResult.violations.length > 0 && validationResult.enforcement === 'warn') {
            console.warn(`⚠️  Task ${task.id} has rule warnings:`, validationResult.violations.map(v => v.message));

            if (validationResult.should_escalate) {
              const escalationManager = getEscalationManager();
              await escalationManager.createEscalation({
                workspace_id: task.workspace_id,
                agent_name: this.name,
                execution_id: executionId,
                escalation_type: 'rule_violation',
                severity: 'warning',
                title: `${this.name} rule warnings`,
                description: validationResult.violations.map(v => v.message).join('; '),
                context: {
                  task_id: task.id,
                  task_type: task.task_type,
                  violations: validationResult.violations
                },
                requires_approval: false
              });
            }
          }

          // Process task
          const startTime = Date.now();
          const result = await this.processTask(task);
          const duration = Date.now() - startTime;

          // Record success
          await this.recordExecutionSuccess(executionId, result, duration);

          // Update task status in database
          await this.updateTaskStatus(task.id, 'completed', result);

          // Acknowledge message
          this.channel!.ack(msg);

          console.log(`✅ Task ${task.id} completed in ${duration}ms`);

          // Record heartbeat
          await this.recordHeartbeat();

        } catch (error: any) {
          console.error(`❌ Task processing failed:`, error);

          const task: AgentTask = JSON.parse(msg.content.toString());
          const executionTime = Date.now() - startTime;

          // Record failure (with metrics)
          await this.recordExecutionFailure(
            task.id,
            error.message,
            executionTime,
            task.workspace_id
          );

          // Retry logic
          if (task.retry_count < task.max_retries) {
            console.log(`🔄 Retrying task ${task.id} (attempt ${task.retry_count + 1}/${task.max_retries})`);

            // Requeue with delay
            setTimeout(async () => {
              task.retry_count++;
              await this.requeueTask(task);
            }, this.retryDelay);

            this.channel!.ack(msg);
          } else {
            console.log(`💀 Task ${task.id} failed permanently after ${task.max_retries} retries`);
            await this.updateTaskStatus(task.id, 'failed', null, error.message);
            this.channel!.ack(msg);
          }
        }
      }, { noAck: false });

      // Start heartbeat interval (every 30 seconds)
      setInterval(() => this.recordHeartbeat(), 30000);

      console.log(`✅ ${this.name} is running`);

    } catch (error) {
      console.error(`❌ Failed to start ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Stop the agent gracefully
   */
  async stop(): Promise<void> {
    console.log(`🛑 Stopping ${this.name}...`);
    this.isRunning = false;

    if (this.channel) {
      await this.channel.close();
    }

    if (this.connection) {
      await this.connection.close();
    }

    console.log(`✅ ${this.name} stopped`);
  }

  /**
   * Abstract method: Process individual task
   * Must be implemented by each specialized agent
   */
  protected abstract processTask(task: AgentTask): Promise<any>;

  /**
   * Requeue a failed task
   */
  protected async requeueTask(task: AgentTask): Promise<void> {
    if (!this.channel) {
return;
}

    await this.channel.sendToQueue(
      this.queueName,
      Buffer.from(JSON.stringify(task)),
      {
        persistent: true,
        priority: task.priority
      }
    );
  }

  /**
   * Update task status in database
   */
  protected async updateTaskStatus(
    taskId: string,
    status: string,
    result: any = null,
    error: string | null = null
  ): Promise<void> {
    try {
      await this.supabase
        .from('agent_tasks')
        .update({
          status,
          result,
          last_error: error,
          completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null
        })
        .eq('id', taskId);
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  }

  /**
   * Record execution start
   */
  protected async recordExecutionStart(task: AgentTask): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('agent_executions')
        .insert({
          task_id: task.id,
          workspace_id: task.workspace_id,
          agent_name: this.name,
          status: 'running',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
throw error;
}
      return data.id;
    } catch (err) {
      console.error('Failed to record execution start:', err);
      return 'unknown';
    }
  }

  /**
   * Record execution success
   * Enhanced with metrics collection (Project Vend Phase 2)
   */
  protected async recordExecutionSuccess(
    executionId: string,
    result: any,
    durationMs: number
  ): Promise<void> {
    try {
      // Update agent_executions table
      await this.supabase
        .from('agent_executions')
        .update({
          status: 'success',
          output: result,
          duration_ms: durationMs,
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId);

      // Record metrics (Project Vend Phase 2)
      const metricsCollector = getMetricsCollector();
      await metricsCollector.recordMetrics({
        workspace_id: result?.workspace_id || 'unknown',
        agent_name: this.name,
        execution_id: executionId,
        execution_time_ms: durationMs,
        success: true,
        model_used: result?.model_used,
        input_tokens: result?.input_tokens,
        output_tokens: result?.output_tokens,
        items_processed: result?.items_processed,
        items_failed: result?.items_failed,
        confidence_score: result?.confidence_score
      });
    } catch (err) {
      console.error('Failed to record execution success:', err);
    }
  }

  /**
   * Record execution failure
   * Enhanced with metrics collection (Project Vend Phase 2)
   */
  protected async recordExecutionFailure(
    taskId: string,
    errorMessage: string,
    executionTimeMs: number = 0,
    workspaceId: string = 'unknown'
  ): Promise<void> {
    try {
      // Update agent_executions table
      await this.supabase
        .from('agent_executions')
        .update({
          status: 'error',
          error_message: errorMessage,
          completed_at: new Date().toISOString()
        })
        .eq('task_id', taskId)
        .eq('status', 'running');

      // Record metrics (Project Vend Phase 2)
      const metricsCollector = getMetricsCollector();
      await metricsCollector.recordMetrics({
        workspace_id: workspaceId,
        agent_name: this.name,
        execution_time_ms: executionTimeMs,
        success: false,
        error_type: this.getErrorType(errorMessage)
      });
    } catch (err) {
      console.error('Failed to record execution failure:', err);
    }
  }

  /**
   * Extract error type from error message
   */
  private getErrorType(errorMessage: string): string {
    if (errorMessage.includes('timeout')) {
return 'TimeoutError';
}
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
return 'NetworkError';
}
    if (errorMessage.includes('API') || errorMessage.includes('401') || errorMessage.includes('403')) {
return 'APIError';
}
    if (errorMessage.includes('validation')) {
return 'ValidationError';
}
    if (errorMessage.includes('database') || errorMessage.includes('SQL')) {
return 'DatabaseError';
}
    return 'UnknownError';
  }

  /**
   * Record agent heartbeat
   */
  protected async recordHeartbeat(): Promise<void> {
    try {
      await this.supabase.rpc('record_agent_heartbeat', {
        p_agent_name: this.name,
        p_status: this.isRunning ? 'healthy' : 'offline',
        p_metrics: {
          queue_name: this.queueName,
          concurrency: this.concurrency,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      // Heartbeat failures are non-critical
      console.warn('Heartbeat failed:', err);
    }
  }
}
