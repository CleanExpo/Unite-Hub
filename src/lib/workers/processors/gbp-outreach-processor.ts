/**
 * GBP Outreach Queue Processor
 * Processes jobs from gbp-outreach Bull queue
 */

import { GBPOutreachWorker } from '../gbp-outreach-worker';
import { gbpOutreachQueue } from '@/lib/queue/bull-queue';

const log = (msg: string) => console.log(`[GBPOutreachProcessor]`, msg);

const worker = new GBPOutreachWorker();

// Process jobs from queue
gbpOutreachQueue.process(async (job) => {
  log(`Processing outreach: ${job.data.prospectBusinessName} in ${job.data.suburb}`);

  const result = await worker.processOutreach(job);

  return result;
});

// Event handlers
gbpOutreachQueue.on('completed', (job) => {
  log(`Completed: ${job.data.prospectBusinessName} (${job.id})`);
});

gbpOutreachQueue.on('failed', (job, err) => {
  log(`Failed: ${job?.data?.prospectBusinessName} - ${err.message}`);
});

gbpOutreachQueue.on('stalled', (job) => {
  log(`Stalled: ${job.data.prospectBusinessName}`);
});

log('GBP outreach processor initialized and listening...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  log('SIGTERM received, shutting down...');
  await gbpOutreachQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  log('SIGINT received, shutting down...');
  await gbpOutreachQueue.close();
  process.exit(0);
});
