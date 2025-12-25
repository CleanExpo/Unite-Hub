/**
 * Visual Audit Queue Processor
 * Processes jobs from visual-audit Bull queue
 */

import { getAuditorAgent } from '@/lib/agents/authority/auditor-agent';
import { visualAuditQueue } from '@/lib/queue/bull-queue';

const log = (msg: string) => console.log(`[VisualAuditProcessor]`, msg);

const auditor = getAuditorAgent();

// Process jobs from queue
visualAuditQueue.process(async (job) => {
  log(`Processing visual audit: ${job.data.keyword} in ${job.data.suburb}`);

  // Convert Bull job to AgentTask format
  const agentTask = {
    id: job.id?.toString() || '',
    task_type: 'visual_audit',
    workspace_id: job.data.workspaceId || '',
    payload: job.data,
    priority: 5,
    retry_count: job.attemptsMade,
    max_retries: 2,
  };

  const result = await auditor['processTask'](agentTask); // Access protected method

  return result;
});

// Event handlers
visualAuditQueue.on('completed', (job) => {
  log(`Completed: ${job.data.keyword} (${job.id})`);
});

visualAuditQueue.on('failed', (job, err) => {
  log(`Failed: ${job?.data?.keyword} - ${err.message}`);
});

visualAuditQueue.on('stalled', (job) => {
  log(`Stalled: ${job.data.keyword}`);
});

log('Visual audit processor initialized and listening...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  log('SIGTERM received, shutting down...');
  await visualAuditQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  log('SIGINT received, shutting down...');
  await visualAuditQueue.close();
  process.exit(0);
});
