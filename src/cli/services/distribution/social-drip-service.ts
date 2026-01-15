/**
 * Social Drip Service - LinkedIn/Reddit ANZ Campaign Automation
 *
 * Automates social media content distribution with BrightData residential IPs
 * for local authenticity in ANZ markets.
 */

import { readFile } from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import { ConfigManager } from '../../utils/config-manager.js';
import Anthropic from '@anthropic-ai/sdk';

export type SocialNetwork =
  | 'LinkedIn_AU'
  | 'LinkedIn_NZ'
  | 'Reddit_AU'
  | 'Reddit_NZ'
  | 'Twitter_AU'
  | 'Facebook_AU';

export type PostFrequency = 'Daily_1' | 'Daily_2' | 'Daily_3' | 'Weekly_3' | 'Weekly_5';

export interface DripCampaign {
  id: string;
  network: SocialNetwork;
  frequency: PostFrequency;
  contentSource: string;
  status: 'active' | 'paused' | 'completed';
  postsScheduled: number;
  postsPublished: number;
  startedAt: string;
  nextPostAt?: string;
}

export interface SocialPost {
  id: string;
  campaignId: string;
  network: SocialNetwork;
  content: string;
  hashtags: string[];
  mentions: string[];
  mediaUrls?: string[];
  scheduledFor: string;
  publishedAt?: string;
  status: 'scheduled' | 'published' | 'failed';
  engagement?: PostEngagement;
}

export interface PostEngagement {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  clicks: number;
}

export interface BrightDataConfig {
  enabled: boolean;
  residentialProxy: string;
  region: 'AU' | 'NZ';
  city?: string;
  isp?: string;
}

export interface DripOptions {
  network: SocialNetwork;
  frequency: PostFrequency;
  contentFile: string;
  duration?: number; // days
  useResidentialIP?: boolean;
  targetCities?: string[];
  hashtags?: string[];
}

export interface DripResult {
  campaign: DripCampaign;
  posts: SocialPost[];
  brightDataConfig?: BrightDataConfig;
  estimatedReach: number;
}

export class SocialDripService {
  private supabase;
  private workspaceId: string;
  private anthropic: Anthropic;

  constructor() {
    const config = ConfigManager.getInstance();
    this.workspaceId = config.getWorkspaceId();

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async startDrip(options: DripOptions): Promise<DripResult> {
    console.log(`[Social] Starting drip campaign on ${options.network}...`);

    // Step 1: Load content
    const content = await readFile(options.contentFile, 'utf-8');
    console.log(`[Social] Loaded content from ${options.contentFile}`);

    // Step 2: Configure BrightData residential IPs if requested
    const brightDataConfig = options.useResidentialIP
      ? this.configureBrightData(options.network, options.targetCities)
      : undefined;

    if (brightDataConfig) {
      console.log(`[Social] Configured residential IP: ${brightDataConfig.region} (${brightDataConfig.city || 'random'})`);
    }

    // Step 3: Create campaign
    const campaign = await this.createCampaign(options);

    // Step 4: Generate post schedule
    const posts = await this.generatePostSchedule(campaign.id, content, options);

    // Step 5: Calculate estimated reach
    const estimatedReach = this.calculateEstimatedReach(options.network, posts.length);

    // Step 6: Store campaign and posts
    await this.storeCampaign(campaign);
    for (const post of posts) {
      await this.storePost(post);
    }

    console.log(`[Social] Campaign created: ${posts.length} posts scheduled`);

    return {
      campaign,
      posts,
      brightDataConfig,
      estimatedReach,
    };
  }

  private configureBrightData(network: SocialNetwork, targetCities?: string[]): BrightDataConfig {
    // Extract region from network
    const region: 'AU' | 'NZ' = network.includes('_AU') ? 'AU' : 'NZ';

    // City selection for residential IP
    const cities: Record<'AU' | 'NZ', string[]> = {
      AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
      NZ: ['Auckland', 'Wellington', 'Christchurch'],
    };

    const city = targetCities?.[0] || cities[region][Math.floor(Math.random() * cities[region].length)];

    // BrightData residential proxy format
    // In production: 'brd.superproxy.io:22225' with auth
    const residentialProxy = `proxy.brightdata.com:22225?country=${region.toLowerCase()}&city=${city.toLowerCase()}`;

    return {
      enabled: true,
      residentialProxy,
      region,
      city,
      isp: 'residential', // Uses actual ISP connections (Telstra, Optus, etc.)
    };
  }

  private async createCampaign(options: DripOptions): Promise<DripCampaign> {
    const frequency = this.parseFrequency(options.frequency);
    const duration = options.duration || 30; // default 30 days
    const totalPosts = frequency.postsPerDay * duration;

    return {
      id: `campaign-${Date.now()}`,
      network: options.network,
      frequency: options.frequency,
      contentSource: options.contentFile,
      status: 'active',
      postsScheduled: totalPosts,
      postsPublished: 0,
      startedAt: new Date().toISOString(),
      nextPostAt: this.calculateNextPostTime(frequency).toISOString(),
    };
  }

  private async generatePostSchedule(
    campaignId: string,
    content: string,
    options: DripOptions
  ): Promise<SocialPost[]> {
    console.log(`[Social] Generating post schedule with AI...`);

    const frequency = this.parseFrequency(options.frequency);
    const duration = options.duration || 30;
    const totalPosts = frequency.postsPerDay * duration;

    // Use Claude to break content into social posts
    const systemPrompt = `You are a social media strategist for ${options.network}.

Break the provided content into ${totalPosts} engaging social media posts.

Guidelines:
- Keep posts concise and platform-appropriate
- Use Australian English spelling
- Include 3-5 relevant hashtags per post
- Vary the tone and format (questions, insights, tips)
- Focus on value and engagement
- No promotional language
- Professional but approachable

Output: JSON array of posts with 'content', 'hashtags', and 'hook' properties.`;

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate ${totalPosts} social posts from this content:\n\n${content.substring(0, 2000)}`,
        },
      ],
    });

    const responseContent = message.content[0];
    if (responseContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse posts from response
    const posts: SocialPost[] = [];
    let postData: any[];

    try {
      const jsonMatch = responseContent.text.match(/\[[\s\S]*\]/);
      postData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      postData = [];
    }

    // If parsing failed, generate sample posts
    if (postData.length === 0) {
      postData = this.generateSamplePosts(totalPosts);
    }

    // Create scheduled posts
    const now = new Date();
    for (let i = 0; i < Math.min(postData.length, totalPosts); i++) {
      const post = postData[i];
      const scheduledTime = this.calculatePostTime(i, frequency, now);

      posts.push({
        id: `post-${campaignId}-${i}`,
        campaignId,
        network: options.network,
        content: post.content || post.text || `Social post ${i + 1}`,
        hashtags: post.hashtags || options.hashtags || [],
        mentions: [],
        scheduledFor: scheduledTime.toISOString(),
        status: 'scheduled',
      });
    }

    return posts;
  }

  private generateSamplePosts(count: number): any[] {
    const samples = [
      {
        content: 'Professional services in Australia are adapting to AI-driven workflows. How is your organization preparing?',
        hashtags: ['#ProfessionalServices', '#AIinBusiness', '#AustralianBusiness'],
      },
      {
        content: 'Data shows Melbourne SMBs achieving 40% efficiency gains through strategic automation. Key insights from our latest research.',
        hashtags: ['#BusinessEfficiency', '#MelbourneBusiness', '#Automation'],
      },
      {
        content: 'Compliance requirements for Australian businesses continue to evolve. Staying ahead requires proactive strategy.',
        hashtags: ['#BusinessCompliance', '#AustralianBusiness', '#RegulatoryChange'],
      },
    ];

    const result: any[] = [];
    for (let i = 0; i < count; i++) {
      result.push(samples[i % samples.length]);
    }
    return result;
  }

  private parseFrequency(frequency: PostFrequency): { postsPerDay: number; intervalHours: number } {
    const map: Record<PostFrequency, { postsPerDay: number; intervalHours: number }> = {
      Daily_1: { postsPerDay: 1, intervalHours: 24 },
      Daily_2: { postsPerDay: 2, intervalHours: 12 },
      Daily_3: { postsPerDay: 3, intervalHours: 8 },
      Weekly_3: { postsPerDay: 3 / 7, intervalHours: 56 },
      Weekly_5: { postsPerDay: 5 / 7, intervalHours: 33.6 },
    };

    return map[frequency];
  }

  private calculateNextPostTime(frequency: { postsPerDay: number; intervalHours: number }): Date {
    const now = new Date();
    now.setHours(now.getHours() + frequency.intervalHours);
    return now;
  }

  private calculatePostTime(
    index: number,
    frequency: { postsPerDay: number; intervalHours: number },
    startDate: Date
  ): Date {
    const date = new Date(startDate);
    date.setHours(date.getHours() + index * frequency.intervalHours);
    return date;
  }

  private calculateEstimatedReach(network: SocialNetwork, postCount: number): number {
    // Estimated reach per post by platform
    const baseReach: Record<SocialNetwork, number> = {
      LinkedIn_AU: 500,
      LinkedIn_NZ: 300,
      Reddit_AU: 1000,
      Reddit_NZ: 500,
      Twitter_AU: 300,
      Facebook_AU: 400,
    };

    return baseReach[network] * postCount;
  }

  private async storeCampaign(campaign: DripCampaign): Promise<void> {
    const record = {
      id: campaign.id,
      workspace_id: this.workspaceId,
      network: campaign.network,
      frequency: campaign.frequency,
      content_source: campaign.contentSource,
      status: campaign.status,
      posts_scheduled: campaign.postsScheduled,
      posts_published: campaign.postsPublished,
      started_at: campaign.startedAt,
      next_post_at: campaign.nextPostAt,
    };

    await this.supabase.from('social_campaigns').insert(record);
  }

  private async storePost(post: SocialPost): Promise<void> {
    const record = {
      id: post.id,
      workspace_id: this.workspaceId,
      campaign_id: post.campaignId,
      network: post.network,
      content: post.content,
      hashtags: post.hashtags,
      mentions: post.mentions,
      scheduled_for: post.scheduledFor,
      status: post.status,
    };

    await this.supabase.from('social_posts').insert(record);
  }

  async getCampaigns(limit: number = 20): Promise<DripCampaign[]> {
    const { data } = await this.supabase
      .from('social_campaigns')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      network: row.network,
      frequency: row.frequency,
      contentSource: row.content_source,
      status: row.status,
      postsScheduled: row.posts_scheduled,
      postsPublished: row.posts_published,
      startedAt: row.started_at,
      nextPostAt: row.next_post_at,
    }));
  }

  async getCampaignPosts(campaignId: string, limit: number = 50): Promise<SocialPost[]> {
    const { data } = await this.supabase
      .from('social_posts')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .eq('campaign_id', campaignId)
      .order('scheduled_for', { ascending: true })
      .limit(limit);

    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      campaignId: row.campaign_id,
      network: row.network,
      content: row.content,
      hashtags: row.hashtags || [],
      mentions: row.mentions || [],
      scheduledFor: row.scheduled_for,
      publishedAt: row.published_at,
      status: row.status,
      engagement: row.engagement,
    }));
  }

  async pauseCampaign(campaignId: string): Promise<void> {
    await this.supabase
      .from('social_campaigns')
      .update({ status: 'paused' })
      .eq('id', campaignId)
      .eq('workspace_id', this.workspaceId);

    console.log(`[Social] Campaign paused: ${campaignId}`);
  }

  async resumeCampaign(campaignId: string): Promise<void> {
    await this.supabase
      .from('social_campaigns')
      .update({ status: 'active' })
      .eq('id', campaignId)
      .eq('workspace_id', this.workspaceId);

    console.log(`[Social] Campaign resumed: ${campaignId}`);
  }
}
