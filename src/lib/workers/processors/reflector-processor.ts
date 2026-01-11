/**
 * Reflector Compliance Queue Processor
 * Processes jobs from reflector-compliance Bull queue
 */

import { getReflectorAgent } from '@/lib/agents/reflector-agent';
import { reflectorQueue } from '@/lib/queue/bull-queue';

const log = (msg: string) => console.log(`[ReflectorProcessor]`, msg);

const reflector = getReflectorAgent();

// Process jobs from queue
reflectorQueue.process(async (job) => {
  log(`Processing compliance check: ${job.data.contentType} for client ${job.data.clientId}`);

  // Convert Bull job to AgentTask format
  const agentTask = {
    id: job.id?.toString() || '',
    task_type: 'reflector_compliance',
    workspace_id: job.data.workspaceId || '',
    payload: job.data,
    priority: 10,
    retry_count: job.attemptsMade,
    max_retries: 2,
  };

  const result = await reflector['processTask'](agentTask); // Access protected method

  return result;
});

// Event handlers
reflectorQueue.on('completed', (job) => {
  log(`Completed: ${job.data.contentType} (${job.id})`);
});

reflectorQueue.on('failed', (job, err) => {
  log(`Failed: ${job?.data?.contentType} - ${err.message}`);
});

log('Reflector processor initialized and listening...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  log('SIGTERM received, shutting down...');
  await reflectorQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  log('SIGINT received, shutting down...');
  await reflectorQueue.close();
  process.exit(0);
});
