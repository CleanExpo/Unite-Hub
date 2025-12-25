/**
 * Bull Job Queue Setup
 * Manages background jobs for alerts, analytics, and predictions
 */

import Queue, { Job, Queue as BullQueue } from 'bull';

// Redis connection config
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Job Queues
export const alertQueue: BullQueue = new Queue('alerts', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Remove after 1 hour
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
});

export const analyticsQueue: BullQueue = new Queue('analytics', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  },
});

export const predictionQueue: BullQueue = new Queue('predictions', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 7200, // Remove after 2 hours
    },
  },
});

export const notificationQueue: BullQueue = new Queue('notifications', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 1800, // Remove after 30 minutes
    },
  },
});

export const emailSendQueue: BullQueue = new Queue('emailSend', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Remove after 1 hour
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
});

export const emailMetricsQueue: BullQueue = new Queue('emailMetrics', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 7200, // Remove after 2 hours
    },
  },
});

// Queue Event Listeners

// Alert Queue Events
alertQueue.on('completed', (job: Job) => {
  console.log(`[Alert Queue] Job ${job.id} completed`);
});

alertQueue.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[Alert Queue] Job failed:`, err.message);
});

alertQueue.on('error', (error: Error) => {
  console.error('[Alert Queue] Error:', error);
});

alertQueue.on('active', (job: Job) => {
  console.log(`[Alert Queue] Job ${job.id} started processing`);
});

// Analytics Queue Events
analyticsQueue.on('completed', (job: Job) => {
  console.log(`[Analytics Queue] Job ${job.id} completed`);
});

analyticsQueue.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[Analytics Queue] Job failed:`, err.message);
});

analyticsQueue.on('error', (error: Error) => {
  console.error('[Analytics Queue] Error:', error);
});

// Prediction Queue Events
predictionQueue.on('completed', (job: Job) => {
  console.log(`[Prediction Queue] Job ${job.id} completed`);
});

predictionQueue.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[Prediction Queue] Job failed:`, err.message);
});

predictionQueue.on('error', (error: Error) => {
  console.error('[Prediction Queue] Error:', error);
});

// Notification Queue Events
notificationQueue.on('completed', (job: Job) => {
  console.log(`[Notification Queue] Job ${job.id} completed`);
});

notificationQueue.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[Notification Queue] Job failed:`, err.message);
});

notificationQueue.on('error', (error: Error) => {
  console.error('[Notification Queue] Error:', error);
});

// Email Send Queue Events
emailSendQueue.on('completed', (job: Job) => {
  console.log(`[Email Send Queue] Job ${job.id} completed`);
});

emailSendQueue.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[Email Send Queue] Job failed:`, err.message);
});

emailSendQueue.on('error', (error: Error) => {
  console.error('[Email Send Queue] Error:', error);
});

emailSendQueue.on('active', (job: Job) => {
  console.log(`[Email Send Queue] Job ${job.id} started processing`);
});

// Email Metrics Queue Events
emailMetricsQueue.on('completed', (job: Job) => {
  console.log(`[Email Metrics Queue] Job ${job.id} completed`);
});

emailMetricsQueue.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[Email Metrics Queue] Job failed:`, err.message);
});

emailMetricsQueue.on('error', (error: Error) => {
  console.error('[Email Metrics Queue] Error:', error);
});

// Queue Management Functions

/**
 * Initialize all queue processors
 */
export async function initializeQueues() {
  console.log('[Queue] Initializing all queues...');

  // Clear stuck jobs
  await Promise.all([
    alertQueue.clean(0, 'active'),
    analyticsQueue.clean(0, 'active'),
    predictionQueue.clean(0, 'active'),
    notificationQueue.clean(0, 'active'),
    emailSendQueue.clean(0, 'active'),
    emailMetricsQueue.clean(0, 'active'),
    suburbMappingQueue.clean(0, 'active'),
    visualAuditQueue.clean(0, 'active'),
    reflectorQueue.clean(0, 'active'),
    gbpOutreachQueue.clean(0, 'active'),
  ]);

  console.log('[Queue] All queues initialized (10 queues)');
}

/**
 * Shutdown all queues
 */
export async function shutdownQueues() {
  console.log('[Queue] Shutting down all queues...');

  await Promise.all([
    alertQueue.close(),
    analyticsQueue.close(),
    predictionQueue.close(),
    notificationQueue.close(),
    emailSendQueue.close(),
    emailMetricsQueue.close(),
    suburbMappingQueue.close(),
    visualAuditQueue.close(),
    reflectorQueue.close(),
    gbpOutreachQueue.close(),
  ]);

  console.log('[Queue] All queues shut down');
}

/**
 * Get queue metrics
 */
export async function getQueueMetrics() {
  const metrics = {
    alert: await alertQueue.getStats(),
    analytics: await analyticsQueue.getStats(),
    prediction: await predictionQueue.getStats(),
    notification: await notificationQueue.getStats(),
    emailSend: await emailSendQueue.getStats(),
    emailMetrics: await emailMetricsQueue.getStats(),
  };

  return metrics;
}

/**
 * Get queue status
 */
export async function getQueueStatus() {
  const alertCounts = await alertQueue.getJobCounts();
  const analyticsCounts = await analyticsQueue.getJobCounts();
  const predictionCounts = await predictionQueue.getJobCounts();
  const notificationCounts = await notificationQueue.getJobCounts();
  const emailSendCounts = await emailSendQueue.getJobCounts();
  const emailMetricsCounts = await emailMetricsQueue.getJobCounts();

  return {
    alert: alertCounts,
    analytics: analyticsCounts,
    prediction: predictionCounts,
    notification: notificationCounts,
    emailSend: emailSendCounts,
    emailMetrics: emailMetricsCounts,
  };
}

/**
 * Get queue health
 */
// =====================================================================
// AI Authority Layer Queues (Phase 2)
// =====================================================================

export const suburbMappingQueue: BullQueue = new Queue('suburb-mapping', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    timeout: 300000, // 5 min per suburb
    removeOnComplete: {
      age: 86400, // Keep for 24 hours
    },
  },
});

export const visualAuditQueue: BullQueue = new Queue('visual-audit', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
    timeout: 600000, // 10 min per audit
    removeOnComplete: {
      age: 86400,
    },
  },
});

export const reflectorQueue: BullQueue = new Queue('reflector-compliance', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 2,
    priority: 10, // High priority for compliance
    removeOnComplete: {
      age: 7200,
    },
  },
});

export const gbpOutreachQueue: BullQueue = new Queue('gbp-outreach', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 5, // More retries for external API
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600,
    },
    removeOnFail: {
      age: 86400,
    },
  },
});

export async function getQueueHealth() {
  const status = await getQueueStatus();

  const failed =
    (status.alert.failed || 0) +
    (status.analytics.failed || 0) +
    (status.prediction.failed || 0) +
    (status.notification.failed || 0) +
    (status.emailSend.failed || 0) +
    (status.emailMetrics.failed || 0);

  const delayed =
    (status.alert.delayed || 0) +
    (status.analytics.delayed || 0) +
    (status.prediction.delayed || 0) +
    (status.notification.delayed || 0) +
    (status.emailSend.delayed || 0) +
    (status.emailMetrics.delayed || 0);

  return {
    healthy: failed < 10 && delayed < 50,
    failed_jobs: failed,
    delayed_jobs: delayed,
    status,
  };
}

export default {
  alertQueue,
  analyticsQueue,
  predictionQueue,
  notificationQueue,
  emailSendQueue,
  emailMetricsQueue,
  suburbMappingQueue,
  visualAuditQueue,
  reflectorQueue,
  gbpOutreachQueue,
  initializeQueues,
  shutdownQueues,
  getQueueMetrics,
  getQueueStatus,
  getQueueHealth,
};
