/**
 * synthex social Commands
 *
 * Social media drip campaigns with ANZ authenticity
 */

import { Command } from 'commander';
import { logger } from '../utils/logger.js';
import { SocialDripService, type SocialNetwork, type PostFrequency } from '../services/distribution/social-drip-service.js';

export function createSocialCommand(): Command {
  const command = new Command('social');

  command.description('Social media drip campaigns for ANZ markets');

  // synthex social drip --network "LinkedIn_AU" --frequency "Daily_3" --file "./output/story_v1.md"
  command
    .command('drip')
    .description('Start social media drip campaign')
    .requiredOption(
      '--network <network>',
      'Social network (LinkedIn_AU, LinkedIn_NZ, Reddit_AU, Reddit_NZ, Twitter_AU, Facebook_AU)'
    )
    .requiredOption(
      '--frequency <frequency>',
      'Post frequency (Daily_1, Daily_2, Daily_3, Weekly_3, Weekly_5)'
    )
    .requiredOption('--file <path>', 'Content file (markdown)')
    .option('--duration <days>', 'Campaign duration in days', '30')
    .option('--residential-ip', 'Use BrightData residential IPs for ANZ authenticity', false)
    .option('--cities <cities>', 'Target cities (comma-separated)', 'Sydney,Melbourne')
    .option('--hashtags <tags>', 'Additional hashtags (comma-separated)')
    .action(async (options) => {
      try {
        await runDripCampaign(options);
      } catch (error) {
        await logger.error('Drip campaign failed');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex social campaigns
  command
    .command('campaigns')
    .description('List active campaigns')
    .option('--limit <number>', 'Number of campaigns to show', '10')
    .action(async (options) => {
      try {
        await showCampaigns(options);
      } catch (error) {
        await logger.error('Failed to fetch campaigns');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex social posts --campaign-id "campaign-123"
  command
    .command('posts')
    .description('List posts for a campaign')
    .requiredOption('--campaign-id <id>', 'Campaign ID')
    .option('--limit <number>', 'Number of posts to show', '20')
    .action(async (options) => {
      try {
        await showCampaignPosts(options);
      } catch (error) {
        await logger.error('Failed to fetch posts');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  // synthex social pause --campaign-id "campaign-123"
  command
    .command('pause')
    .description('Pause an active campaign')
    .requiredOption('--campaign-id <id>', 'Campaign ID')
    .action(async (options) => {
      try {
        await pauseCampaign(options);
      } catch (error) {
        await logger.error('Failed to pause campaign');
        await logger.errorDetails(error);
        process.exit(1);
      }
    });

  return command;
}

async function runDripCampaign(options: {
  network: string;
  frequency: string;
  file: string;
  duration?: string;
  residentialIp?: boolean;
  cities?: string;
  hashtags?: string;
}): Promise<void> {
  await logger.header('Social: Drip Campaign');
  await logger.divider();

  // Validate network
  const validNetworks = ['LinkedIn_AU', 'LinkedIn_NZ', 'Reddit_AU', 'Reddit_NZ', 'Twitter_AU', 'Facebook_AU'];
  if (!validNetworks.includes(options.network)) {
    await logger.error(`Invalid network: ${options.network}`);
    await logger.info(`Valid networks: ${validNetworks.join(', ')}`);
    process.exit(1);
  }

  // Validate frequency
  const validFrequencies = ['Daily_1', 'Daily_2', 'Daily_3', 'Weekly_3', 'Weekly_5'];
  if (!validFrequencies.includes(options.frequency)) {
    await logger.error(`Invalid frequency: ${options.frequency}`);
    await logger.info(`Valid frequencies: ${validFrequencies.join(', ')}`);
    process.exit(1);
  }

  const network = options.network as SocialNetwork;
  const frequency = options.frequency as PostFrequency;

  await logger.info(`Network: ${network}`);
  await logger.info(`Frequency: ${frequency}`);
  await logger.info(`Content File: ${options.file}`);
  await logger.info(`Duration: ${options.duration || '30'} days`);
  if (options.residentialIp) {
    await logger.info(`Residential IP: Enabled (BrightData)`);
    await logger.info(`Target Cities: ${options.cities}`);
  }
  await logger.divider();

  const spinner = await logger.spinner('Setting up campaign...');

  try {
    const service = new SocialDripService();

    spinner.text = 'Generating post schedule...';

    const result = await service.startDrip({
      network,
      frequency,
      contentFile: options.file,
      duration: parseInt(options.duration || '30', 10),
      useResidentialIP: options.residentialIp,
      targetCities: options.cities?.split(',').map((c) => c.trim()),
      hashtags: options.hashtags?.split(',').map((h) => h.trim()),
    });

    spinner.stop();

    await logger.success('Campaign created!');
    await logger.divider();

    await logger.header('Campaign Details');
    await logger.keyValue('Campaign ID', result.campaign.id);
    await logger.keyValue('Network', result.campaign.network);
    await logger.keyValue('Frequency', result.campaign.frequency);
    await logger.keyValue('Posts Scheduled', result.campaign.postsScheduled.toString());
    await logger.keyValue('Next Post', new Date(result.campaign.nextPostAt!).toLocaleString());
    await logger.keyValue('Estimated Reach', result.estimatedReach.toLocaleString());

    if (result.brightDataConfig) {
      await logger.divider();
      await logger.header('BrightData Residential IP');
      await logger.keyValue('Region', result.brightDataConfig.region);
      await logger.keyValue('City', result.brightDataConfig.city || 'Random');
      await logger.keyValue('ISP Type', result.brightDataConfig.isp || 'Residential');
      await logger.info('Posts will appear from authentic local Australian/NZ IPs');
    }

    // Show sample posts
    if (result.posts.length > 0) {
      await logger.divider();
      await logger.header('Sample Posts');

      const samples = result.posts.slice(0, 3);
      for (let i = 0; i < samples.length; i++) {
        const post = samples[i];
        await logger.info(`${i + 1}. [${new Date(post.scheduledFor).toLocaleDateString()}]`);
        await logger.info(`   ${post.content.substring(0, 100)}...`);
        if (post.hashtags.length > 0) {
          await logger.info(`   ${post.hashtags.join(' ')}`);
        }
        await logger.divider();
      }

      if (result.posts.length > 3) {
        await logger.info(`... and ${result.posts.length - 3} more posts`);
      }
    }

    await logger.info('');
    await logger.success('Campaign is now active!');
    await logger.info('');
    await logger.example('Manage campaign:');
    await logger.example(`  synthex social posts --campaign-id "${result.campaign.id}"`);
    await logger.example(`  synthex social pause --campaign-id "${result.campaign.id}"`);
    await logger.example('  synthex social campaigns');
  } catch (error) {
    spinner.fail('Campaign setup failed');
    throw error;
  }
}

async function showCampaigns(options: { limit?: string }): Promise<void> {
  await logger.header('Active Campaigns');
  await logger.divider();

  const spinner = await logger.spinner('Fetching campaigns...');

  try {
    const service = new SocialDripService();
    const limit = parseInt(options.limit || '10', 10);
    const campaigns = await service.getCampaigns(limit);

    spinner.stop();

    if (campaigns.length === 0) {
      await logger.info('No campaigns found');
      await logger.info('');
      await logger.example('Start a campaign:');
      await logger.example('  synthex social drip --network "LinkedIn_AU" --frequency "Daily_3" --file "content.md"');
      return;
    }

    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i];
      const statusIcon =
        campaign.status === 'active' ? '▶' : campaign.status === 'paused' ? '⏸' : '✓';

      await logger.info(`${i + 1}. ${statusIcon} ${campaign.network} - ${campaign.frequency}`);
      await logger.info(`   ID: ${campaign.id}`);
      await logger.info(`   Progress: ${campaign.postsPublished}/${campaign.postsScheduled} posts`);
      await logger.info(`   Started: ${new Date(campaign.startedAt).toLocaleDateString()}`);
      if (campaign.nextPostAt) {
        await logger.info(`   Next Post: ${new Date(campaign.nextPostAt).toLocaleString()}`);
      }
      await logger.divider();
    }

    await logger.info('');
    await logger.example('View campaign posts:');
    await logger.example(`  synthex social posts --campaign-id "${campaigns[0].id}"`);
  } catch (error) {
    spinner.fail('Failed to fetch campaigns');
    throw error;
  }
}

async function showCampaignPosts(options: { campaignId: string; limit?: string }): Promise<void> {
  await logger.header('Campaign Posts');
  await logger.divider();

  const spinner = await logger.spinner('Fetching posts...');

  try {
    const service = new SocialDripService();
    const limit = parseInt(options.limit || '20', 10);
    const posts = await service.getCampaignPosts(options.campaignId, limit);

    spinner.stop();

    if (posts.length === 0) {
      await logger.info('No posts found for this campaign');
      return;
    }

    await logger.info(`Found ${posts.length} posts`);
    await logger.divider();

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const statusIcon =
        post.status === 'published' ? '✓' : post.status === 'scheduled' ? '⏰' : '✗';

      await logger.info(`${i + 1}. ${statusIcon} [${post.status.toUpperCase()}]`);
      await logger.info(`   ${post.content.substring(0, 100)}...`);
      await logger.info(`   Scheduled: ${new Date(post.scheduledFor).toLocaleString()}`);
      if (post.hashtags.length > 0) {
        await logger.info(`   ${post.hashtags.join(' ')}`);
      }
      if (post.engagement) {
        await logger.info(
          `   Engagement: ${post.engagement.likes} likes, ${post.engagement.comments} comments, ${post.engagement.shares} shares`
        );
      }
      await logger.divider();
    }
  } catch (error) {
    spinner.fail('Failed to fetch posts');
    throw error;
  }
}

async function pauseCampaign(options: { campaignId: string }): Promise<void> {
  await logger.header('Pause Campaign');
  await logger.divider();

  await logger.info(`Campaign ID: ${options.campaignId}`);
  await logger.divider();

  const spinner = await logger.spinner('Pausing campaign...');

  try {
    const service = new SocialDripService();
    await service.pauseCampaign(options.campaignId);

    spinner.stop();

    await logger.success('Campaign paused successfully!');
    await logger.info('');
    await logger.example('Resume campaign:');
    await logger.example('  (Resume functionality coming soon)');
    await logger.example('  synthex social campaigns');
  } catch (error) {
    spinner.fail('Failed to pause campaign');
    throw error;
  }
}
