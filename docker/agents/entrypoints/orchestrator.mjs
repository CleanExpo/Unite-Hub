#!/usr/bin/env node

/**
 * Orchestrator Agent - Master Coordinator
 * Routes tasks to specialized worker agents
 */

import { BaseAgent } from '../../../src/lib/agents/base-agent.js';
import { routeToModel } from '../../../src/lib/agents/model-router.js';

class OrchestratorAgent extends BaseAgent {
  constructor() {
    super({
      name: 'orchestrator',
      queueName: 'orchestrator_queue',
      concurrency: 5
    });
  }

  async processTask(task) {
    console.log(`🎯 Orchestrator routing task: ${task.task_type}`);

    // Route to appropriate worker queue
    const workerQueue = this.getWorkerQueue(task.task_type);

    if (!workerQueue) {
      throw new Error(`Unknown task type: ${task.task_type}`);
    }

    // Forward task to worker queue
    await this.channel.sendToQueue(
      workerQueue,
      Buffer.from(JSON.stringify(task)),
      {
        persistent: true,
        priority: task.priority
      }
    );

    console.log(`✅ Task ${task.id} routed to ${workerQueue}`);

    return {
      routed_to: workerQueue,
      timestamp: new Date().toISOString()
    };
  }

  getWorkerQueue(taskType) {
    const routingMap = {
      'email_intelligence': 'email_intelligence_queue',
      'content_generation': 'content_generation_queue',
      'campaign_optimization': 'campaign_optimization_queue',
      'strategy_generation': 'strategy_generation_queue',
      'analytics_insights': 'analytics_insights_queue',
      'contact_scoring': 'email_intelligence_queue', // Handled by email agent
      'mindmap_generation': 'strategy_generation_queue',
      'questionnaire_generation': 'strategy_generation_queue'
    };

    return routingMap[taskType] || null;
  }
}

// Start orchestrator
const orchestrator = new OrchestratorAgent();

orchestrator.start().catch((error) => {
  console.error('❌ Orchestrator failed:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📡 SIGTERM received');
  await orchestrator.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 SIGINT received');
  await orchestrator.stop();
  process.exit(0);
});
