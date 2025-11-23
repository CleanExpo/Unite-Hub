/**
 * Success Scheduler Service
 * Phase 49: Utility for managing and triggering success cron jobs
 */

// Cron schedules
export const CRON_SCHEDULES = {
  weekly_score: '0 7 * * 1',     // Monday 7 AM
  weekly_insights: '0 7 * * 1',  // Monday 7 AM
  weekly_email: '0 8 * * 1',     // Monday 8 AM
};

// Cron endpoints
export const CRON_ENDPOINTS = {
  score: '/api/cron/success-score',
  insights: '/api/cron/success-insights',
  email: '/api/cron/success-email',
};

/**
 * Manually trigger a cron job
 */
export async function triggerCronJob(
  jobType: 'score' | 'insights' | 'email',
  options?: { cronSecret?: string }
): Promise<{ success: boolean; results?: any; error?: string }> {
  try {
    const endpoint = CRON_ENDPOINTS[jobType];
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options?.cronSecret) {
      headers['Authorization'] = `Bearer ${options.cronSecret}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Cron job failed' };
    }

    return { success: true, results: data.results };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger cron job',
    };
  }
}

/**
 * Trigger all weekly jobs in sequence
 */
export async function runWeeklySuccessJobs(
  cronSecret?: string
): Promise<{
  score: { success: boolean; results?: any; error?: string };
  insights: { success: boolean; results?: any; error?: string };
  email: { success: boolean; results?: any; error?: string };
}> {
  const results = {
    score: await triggerCronJob('score', { cronSecret }),
    insights: await triggerCronJob('insights', { cronSecret }),
    email: await triggerCronJob('email', { cronSecret }),
  };

  return results;
}

/**
 * Get Vercel cron configuration for vercel.json
 */
export function getVercelCronConfig() {
  return {
    crons: [
      {
        path: '/api/cron/success-score',
        schedule: CRON_SCHEDULES.weekly_score,
      },
      {
        path: '/api/cron/success-insights',
        schedule: CRON_SCHEDULES.weekly_insights,
      },
      {
        path: '/api/cron/success-email',
        schedule: CRON_SCHEDULES.weekly_email,
      },
    ],
  };
}

/**
 * Check if scheduler is enabled
 */
export function isSchedulerEnabled(): boolean {
  return process.env.ENABLE_SUCCESS_CRONS === 'true';
}

export default {
  CRON_SCHEDULES,
  CRON_ENDPOINTS,
  triggerCronJob,
  runWeeklySuccessJobs,
  getVercelCronConfig,
  isSchedulerEnabled,
};
