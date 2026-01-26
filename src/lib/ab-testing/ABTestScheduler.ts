/**
 * A/B Test Scheduler
 *
 * Background worker for periodic A/B test analysis and auto-winner declaration
 *
 * @module ab-testing/ABTestScheduler
 */

import { createApiLogger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { updateTestMetrics, autoCheckAndDeclareWinner } from './ABTestManager';

const logger = createApiLogger({ service: 'ABTestScheduler' });

export interface SchedulerConfig {
  updateInterval?: number; // milliseconds
  enableAutoWinner?: boolean;
}

export class ABTestScheduler {
  private config: Required<SchedulerConfig>;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor(config: SchedulerConfig = {}) {
    this.config = {
      updateInterval: config.updateInterval ?? 3600000, // 1 hour
      enableAutoWinner: config.enableAutoWinner ?? true,
    };
  }

  /**
   * Start scheduler (continuous polling)
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Scheduler already running');
      return;
    }

    this.isRunning = true;
    logger.info('A/B Test scheduler started', {
      updateInterval: this.config.updateInterval,
      enableAutoWinner: this.config.enableAutoWinner,
    });

    // Run immediately
    await this.processTests();

    // Then run periodically
    this.intervalId = setInterval(async () => {
      try {
        await this.processTests();
      } catch (error) {
        logger.error('Scheduler error', { error });
      }
    }, this.config.updateInterval);
  }

  /**
   * Stop scheduler
   */
  async stop(): Promise<void> {
    logger.info('Stopping A/B Test scheduler');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    logger.info('A/B Test scheduler stopped');
  }

  /**
   * Process all active A/B tests
   */
  async processTests(): Promise<void> {
    try {
      logger.info('Processing A/B tests');

      // Get all active campaigns with A/B testing enabled
      const campaigns = await this.getActiveCampaigns();

      if (campaigns.length === 0) {
        logger.debug('No active A/B tests found');
        return;
      }

      logger.info('Found active A/B tests', { count: campaigns.length });

      // Process each campaign
      let updated = 0;
      let winnersDeclar ed = 0;

      for (const campaign of campaigns) {
        try {
          // Update metrics
          await updateTestMetrics(campaign.id);
          updated++;

          // Check if winner can be declared
          if (this.config.enableAutoWinner) {
            const declared = await autoCheckAndDeclareWinner(campaign.id);
            if (declared) {
              winnersDeclar ed++;
              logger.info('Auto-declared winner', { campaignId: campaign.id });
            }
          }
        } catch (error) {
          logger.error('Failed to process campaign', {
            error,
            campaignId: campaign.id,
          });
        }
      }

      logger.info('A/B test processing complete', {
        totalCampaigns: campaigns.length,
        metricsUpdated: updated,
        winnersDeclar ed,
      });
    } catch (error) {
      logger.error('Failed to process A/B tests', { error });
      throw error;
    }
  }

  /**
   * Get active campaigns with A/B testing
   */
  private async getActiveCampaigns(): Promise<Array<{ id: string; name: string }>> {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase
        .from('drip_campaigns')
        .select('id, name, ab_test_config, ab_test_winner_id')
        .eq('status', 'active')
        .not('ab_test_config', 'is', null);

      if (error) throw error;

      // Filter campaigns with A/B testing enabled and no winner yet
      return data
        .filter(
          (campaign) =>
            campaign.ab_test_config?.enabled === true && !campaign.ab_test_winner_id
        )
        .map((campaign) => ({
          id: campaign.id,
          name: campaign.name,
        }));
    } catch (error) {
      logger.error('Failed to get active campaigns', { error });
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    running: boolean;
    config: SchedulerConfig;
  } {
    return {
      running: this.isRunning,
      config: this.config,
    };
  }
}

// For direct execution as a worker process
if (require.main === module) {
  const scheduler = new ABTestScheduler({
    updateInterval: 3600000, // 1 hour
    enableAutoWinner: true,
  });

  // Handle shutdown gracefully
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down...');
    await scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down...');
    await scheduler.stop();
    process.exit(0);
  });

  // Start scheduler
  scheduler.start().catch((error) => {
    logger.error('Scheduler crashed', { error });
    process.exit(1);
  });
}
