/**
 * Suburb Mapping Queue Processor
 * Processes jobs from suburb-mapping Bull queue
 */

import { SuburbMappingWorker } from '../suburb-mapping-worker';
import { suburbMappingQueue } from '@/lib/queue/bull-queue';

const log = (msg: string) => console.log(`[SuburbMappingProcessor]`, msg);

const worker = new SuburbMappingWorker();

// Process jobs from queue
suburbMappingQueue.process(async (job) => {
  log(`Processing suburb: ${job.data.suburbName}, ${job.data.state}`);

  const result = await worker.processSuburb(job);

  return result;
});

// Event handlers
suburbMappingQueue.on('completed', (job) => {
  log(`Completed: ${job.data.suburbName} (${job.id})`);
});

suburbMappingQueue.on('failed', (job, err) => {
  log(`Failed: ${job?.data?.suburbName} - ${err.message}`);
});

suburbMappingQueue.on('stalled', (job) => {
  log(`Stalled: ${job.data.suburbName}`);
});

log('Suburb mapping processor initialized and listening...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  log('SIGTERM received, shutting down...');
  await suburbMappingQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  log('SIGINT received, shutting down...');
  await suburbMappingQueue.close();
  process.exit(0);
});
