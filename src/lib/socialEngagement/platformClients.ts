/**
 * Social Platform Clients
 *
 * Thin client wrappers around Meta Graph, YouTube, TikTok, LinkedIn, Reddit, X
 * using existing tokens from Connected Apps.
 */

import {
  SocialProvider,
  NormalizedMessage,
  FacebookMessage,
  InstagramComment,
  YouTubeComment,
  TikTokComment,
  LinkedInComment,
  RedditMessage,
  XTweet,
  XDirectMessage,
  MessageAttachment,
  ChannelType,
} from './providerTypes';
import { socialEngagementConfig, getProviderConfig } from '../../../config/socialEngagement.config';

export interface PlatformClientConfig {
  accessToken: string;
  refreshToken?: string;
  accountId: string;
  provider: SocialProvider;
}

export interface FetchMessagesOptions {
  since?: Date;
  until?: Date;
  limit?: number;
  cursor?: string;
  channelTypes?: ChannelType[];
}

export interface FetchMessagesResult {
  messages: NormalizedMessage[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface SendReplyOptions {
  messageId: string;
  text: string;
  attachments?: MessageAttachment[];
}

export interface SendReplyResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

// Base client class
abstract class BasePlatformClient {
  protected config: PlatformClientConfig;
  protected rateLimiter: RateLimiter;

  constructor(config: PlatformClientConfig) {
    this.config = config;
    const providerConfig = getProviderConfig(config.provider);
    this.rateLimiter = new RateLimiter(
      providerConfig?.rateLimits.requestsPerMinute || 60,
      providerConfig?.rateLimits.requestsPerDay || 1000
    );
  }

  abstract fetchMessages(options: FetchMessagesOptions): Promise<FetchMessagesResult>;
  abstract sendReply(options: SendReplyOptions): Promise<SendReplyResult>;
  abstract getAccountInfo(): Promise<{ id: string; name: string; handle?: string; profileImage?: string }>;

  protected async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    await this.rateLimiter.waitForSlot();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.accessToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }

    return response.json();
  }
}

// Simple rate limiter
class RateLimiter {
  private requestsThisMinute = 0;
  private requestsToday = 0;
  private minuteReset: number;
  private dayReset: number;

  constructor(
    private maxPerMinute: number,
    private maxPerDay: number
  ) {
    this.minuteReset = Date.now() + 60000;
    this.dayReset = Date.now() + 86400000;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();

    if (now >= this.minuteReset) {
      this.requestsThisMinute = 0;
      this.minuteReset = now + 60000;
    }

    if (now >= this.dayReset) {
      this.requestsToday = 0;
      this.dayReset = now + 86400000;
    }

    if (this.requestsThisMinute >= this.maxPerMinute) {
      const waitTime = this.minuteReset - now;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestsThisMinute = 0;
      this.minuteReset = Date.now() + 60000;
    }

    if (this.requestsToday >= this.maxPerDay) {
      throw new Error('Daily rate limit exceeded');
    }

    this.requestsThisMinute++;
    this.requestsToday++;
  }
}

// Facebook/Instagram client (Meta Graph API)
export class MetaClient extends BasePlatformClient {
  private baseUrl = 'https://graph.facebook.com/v19.0';

  async fetchMessages(options: FetchMessagesOptions): Promise<FetchMessagesResult> {
    const messages: NormalizedMessage[] = [];
    let nextCursor: string | undefined;

    // Fetch page conversations
    const params = new URLSearchParams({
      fields: 'id,messages{id,created_time,from,message,attachments}',
      limit: String(options.limit || 25),
    });

    if (options.cursor) {
      params.set('after', options.cursor);
    }

    const url = `${this.baseUrl}/${this.config.accountId}/conversations?${params}`;
    const response = await this.makeRequest<{
      data: Array<{ id: string; messages: { data: FacebookMessage[] } }>;
      paging?: { cursors: { after: string }; next?: string };
    }>(url);

    for (const conversation of response.data) {
      for (const msg of conversation.messages?.data || []) {
        messages.push(this.normalizeFacebookMessage(msg, conversation.id));
      }
    }

    nextCursor = response.paging?.cursors?.after;

    return {
      messages,
      nextCursor,
      hasMore: !!response.paging?.next,
    };
  }

  async sendReply(options: SendReplyOptions): Promise<SendReplyResult> {
    try {
      const url = `${this.baseUrl}/${options.messageId}/messages`;
      const response = await this.makeRequest<{ id: string }>(url, {
        method: 'POST',
        body: JSON.stringify({ message: options.text }),
      });

      return { success: true, externalId: response.id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getAccountInfo() {
    const url = `${this.baseUrl}/${this.config.accountId}?fields=id,name,username,picture`;
    const response = await this.makeRequest<{
      id: string;
      name: string;
      username?: string;
      picture?: { data: { url: string } };
    }>(url);

    return {
      id: response.id,
      name: response.name,
      handle: response.username,
      profileImage: response.picture?.data?.url,
    };
  }

  private normalizeFacebookMessage(msg: FacebookMessage, threadId: string): NormalizedMessage {
    return {
      externalId: msg.id,
      provider: 'facebook',
      channelType: 'dm',
      direction: msg.from.id === this.config.accountId ? 'outbound' : 'inbound',
      content: msg.message,
      contentType: msg.attachments?.data?.length ? 'mixed' : 'text',
      author: {
        id: msg.from.id,
        name: msg.from.name,
      },
      attachments:
        msg.attachments?.data?.map((a) => ({
          type: a.type as MessageAttachment['type'],
          url: a.url,
        })) || [],
      sentAt: new Date(msg.created_time),
      threadId,
      rawData: msg,
    };
  }
}

// YouTube client
export class YouTubeClient extends BasePlatformClient {
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  async fetchMessages(options: FetchMessagesOptions): Promise<FetchMessagesResult> {
    const messages: NormalizedMessage[] = [];
    let nextCursor: string | undefined;

    // Fetch comments on channel's videos
    const params = new URLSearchParams({
      part: 'snippet',
      allThreadsRelatedToChannelId: this.config.accountId,
      maxResults: String(options.limit || 25),
      order: 'time',
    });

    if (options.cursor) {
      params.set('pageToken', options.cursor);
    }

    const url = `${this.baseUrl}/commentThreads?${params}`;
    const response = await this.makeRequest<{
      items: Array<{ id: string; snippet: { topLevelComment: YouTubeComment } }>;
      nextPageToken?: string;
    }>(url);

    for (const item of response.items || []) {
      messages.push(this.normalizeYouTubeComment(item.snippet.topLevelComment));
    }

    nextCursor = response.nextPageToken;

    return {
      messages,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }

  async sendReply(options: SendReplyOptions): Promise<SendReplyResult> {
    try {
      const url = `${this.baseUrl}/comments?part=snippet`;
      const response = await this.makeRequest<{ id: string }>(url, {
        method: 'POST',
        body: JSON.stringify({
          snippet: {
            parentId: options.messageId,
            textOriginal: options.text,
          },
        }),
      });

      return { success: true, externalId: response.id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getAccountInfo() {
    const url = `${this.baseUrl}/channels?part=snippet&mine=true`;
    const response = await this.makeRequest<{
      items: Array<{
        id: string;
        snippet: { title: string; customUrl?: string; thumbnails: { default: { url: string } } };
      }>;
    }>(url);

    const channel = response.items?.[0];
    return {
      id: channel?.id || this.config.accountId,
      name: channel?.snippet?.title || '',
      handle: channel?.snippet?.customUrl,
      profileImage: channel?.snippet?.thumbnails?.default?.url,
    };
  }

  private normalizeYouTubeComment(comment: YouTubeComment): NormalizedMessage {
    return {
      externalId: comment.id,
      provider: 'youtube',
      channelType: 'comment',
      direction: 'inbound',
      content: comment.snippet.textOriginal,
      contentType: 'text',
      author: {
        id: comment.snippet.authorChannelId?.value || '',
        name: comment.snippet.authorDisplayName,
        profileImage: comment.snippet.authorProfileImageUrl,
      },
      attachments: [],
      sentAt: new Date(comment.snippet.publishedAt),
      rawData: comment,
    };
  }
}

// TikTok client
export class TikTokClient extends BasePlatformClient {
  private baseUrl = 'https://open.tiktokapis.com/v2';

  async fetchMessages(options: FetchMessagesOptions): Promise<FetchMessagesResult> {
    const messages: NormalizedMessage[] = [];
    let nextCursor: string | undefined;

    // Fetch comments on user's videos
    const params = new URLSearchParams({
      fields: 'id,text,create_time,user',
      max_count: String(options.limit || 25),
    });

    if (options.cursor) {
      params.set('cursor', options.cursor);
    }

    const url = `${this.baseUrl}/video/comment/list/?${params}`;
    const response = await this.makeRequest<{
      data: { comments: TikTokComment[]; cursor?: string; has_more: boolean };
    }>(url);

    for (const comment of response.data?.comments || []) {
      messages.push(this.normalizeTikTokComment(comment));
    }

    nextCursor = response.data?.cursor;

    return {
      messages,
      nextCursor,
      hasMore: response.data?.has_more || false,
    };
  }

  async sendReply(options: SendReplyOptions): Promise<SendReplyResult> {
    try {
      const url = `${this.baseUrl}/video/comment/reply/`;
      const response = await this.makeRequest<{ data: { comment_id: string } }>(url, {
        method: 'POST',
        body: JSON.stringify({
          comment_id: options.messageId,
          text: options.text,
        }),
      });

      return { success: true, externalId: response.data?.comment_id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getAccountInfo() {
    const url = `${this.baseUrl}/user/info/?fields=open_id,union_id,avatar_url,display_name`;
    const response = await this.makeRequest<{
      data: { user: { open_id: string; display_name: string; avatar_url: string } };
    }>(url);

    return {
      id: response.data?.user?.open_id || this.config.accountId,
      name: response.data?.user?.display_name || '',
      profileImage: response.data?.user?.avatar_url,
    };
  }

  private normalizeTikTokComment(comment: TikTokComment): NormalizedMessage {
    return {
      externalId: comment.id,
      provider: 'tiktok',
      channelType: 'comment',
      direction: 'inbound',
      content: comment.text,
      contentType: 'text',
      author: {
        id: comment.user.id,
        handle: comment.user.unique_id,
        name: comment.user.nickname,
        profileImage: comment.user.avatar_url,
      },
      attachments: [],
      sentAt: new Date(comment.create_time * 1000),
      rawData: comment,
    };
  }
}

// LinkedIn client
export class LinkedInClient extends BasePlatformClient {
  private baseUrl = 'https://api.linkedin.com/v2';

  async fetchMessages(options: FetchMessagesOptions): Promise<FetchMessagesResult> {
    const messages: NormalizedMessage[] = [];
    let nextCursor: string | undefined;

    // Fetch social actions (comments) on organization posts
    const params = new URLSearchParams({
      q: 'organization',
      organization: this.config.accountId,
      count: String(options.limit || 25),
    });

    if (options.cursor) {
      params.set('start', options.cursor);
    }

    const url = `${this.baseUrl}/socialActions?${params}`;
    const response = await this.makeRequest<{
      elements: LinkedInComment[];
      paging?: { start: number; count: number; total: number };
    }>(url);

    for (const comment of response.elements || []) {
      messages.push(this.normalizeLinkedInComment(comment));
    }

    if (response.paging) {
      const nextStart = response.paging.start + response.paging.count;
      if (nextStart < response.paging.total) {
        nextCursor = String(nextStart);
      }
    }

    return {
      messages,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }

  async sendReply(options: SendReplyOptions): Promise<SendReplyResult> {
    // LinkedIn has restrictions on automated replies
    return {
      success: false,
      error: 'LinkedIn does not support automated replies. Manual interaction required.',
    };
  }

  async getAccountInfo() {
    const url = `${this.baseUrl}/organizations/${this.config.accountId}?projection=(id,localizedName,logoV2)`;
    const response = await this.makeRequest<{
      id: string;
      localizedName: string;
      logoV2?: { original: string };
    }>(url);

    return {
      id: response.id,
      name: response.localizedName,
      profileImage: response.logoV2?.original,
    };
  }

  private normalizeLinkedInComment(comment: LinkedInComment): NormalizedMessage {
    return {
      externalId: comment.id,
      provider: 'linkedin',
      channelType: 'comment',
      direction: 'inbound',
      content: comment.message?.text || '',
      contentType: 'text',
      author: {
        id: comment.actor,
      },
      attachments: [],
      sentAt: new Date(comment.created?.time || Date.now()),
      rawData: comment,
    };
  }
}

// Reddit client
export class RedditClient extends BasePlatformClient {
  private baseUrl = 'https://oauth.reddit.com';

  protected override async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    await this.rateLimiter.waitForSlot();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.accessToken}`,
        'User-Agent': 'UniteHub/1.0',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Reddit API request failed: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async fetchMessages(options: FetchMessagesOptions): Promise<FetchMessagesResult> {
    const messages: NormalizedMessage[] = [];
    let nextCursor: string | undefined;

    // Fetch inbox messages and comment replies
    const params = new URLSearchParams({
      limit: String(options.limit || 25),
    });

    if (options.cursor) {
      params.set('after', options.cursor);
    }

    const url = `${this.baseUrl}/message/inbox?${params}`;
    const response = await this.makeRequest<{
      data: {
        children: Array<{ data: RedditMessage }>;
        after?: string;
      };
    }>(url);

    for (const child of response.data?.children || []) {
      messages.push(this.normalizeRedditMessage(child.data));
    }

    nextCursor = response.data?.after ?? undefined;

    return {
      messages,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }

  async sendReply(options: SendReplyOptions): Promise<SendReplyResult> {
    try {
      const url = `${this.baseUrl}/api/comment`;
      const body = new URLSearchParams({
        thing_id: options.messageId,
        text: options.text,
        api_type: 'json',
      });

      const response = await this.makeRequest<{
        json: { errors: string[][]; data?: { things: Array<{ data: { id: string } }> } };
      }>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (response.json?.errors?.length) {
        return { success: false, error: response.json.errors.map((e) => e.join(': ')).join('; ') };
      }

      return {
        success: true,
        externalId: response.json?.data?.things?.[0]?.data?.id,
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getAccountInfo() {
    const url = `${this.baseUrl}/api/v1/me`;
    const response = await this.makeRequest<{
      id: string;
      name: string;
      icon_img?: string;
      subreddit?: { display_name_prefixed: string };
    }>(url);

    return {
      id: response.id,
      name: response.name,
      handle: response.subreddit?.display_name_prefixed ?? `u/${response.name}`,
      profileImage: response.icon_img?.split('?')[0],
    };
  }

  private normalizeRedditMessage(msg: RedditMessage): NormalizedMessage {
    return {
      externalId: msg.id,
      provider: 'reddit',
      channelType: msg.subreddit ? 'comment' : 'dm',
      direction: 'inbound',
      content: msg.body,
      contentType: 'text',
      author: {
        id: msg.author,
        handle: `u/${msg.author}`,
        name: msg.author,
      },
      attachments: [],
      sentAt: new Date(msg.created_utc * 1000),
      threadId: msg.parent_id,
      rawData: msg,
    };
  }
}

// X (Twitter) client
export class XClient extends BasePlatformClient {
  private baseUrl = 'https://api.twitter.com/2';

  async fetchMessages(options: FetchMessagesOptions): Promise<FetchMessagesResult> {
    const messages: NormalizedMessage[] = [];
    let nextCursor: string | undefined;

    // Fetch mentions
    const params = new URLSearchParams({
      'user.fields': 'id,name,username,profile_image_url',
      'tweet.fields': 'created_at,conversation_id,in_reply_to_user_id',
      max_results: String(options.limit || 25),
    });

    if (options.cursor) {
      params.set('pagination_token', options.cursor);
    }

    if (options.since) {
      params.set('start_time', options.since.toISOString());
    }

    const url = `${this.baseUrl}/users/${this.config.accountId}/mentions?${params}`;
    const response = await this.makeRequest<{
      data: XTweet[];
      includes?: { users: Array<{ id: string; name: string; username: string; profile_image_url: string }> };
      meta?: { next_token?: string };
    }>(url);

    const users = new Map(
      (response.includes?.users || []).map((u) => [u.id, u])
    );

    for (const tweet of response.data || []) {
      messages.push(this.normalizeXTweet(tweet, users));
    }

    nextCursor = response.meta?.next_token;

    return {
      messages,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }

  async sendReply(options: SendReplyOptions): Promise<SendReplyResult> {
    try {
      const url = `${this.baseUrl}/tweets`;
      const response = await this.makeRequest<{ data: { id: string } }>(url, {
        method: 'POST',
        body: JSON.stringify({
          text: options.text,
          reply: { in_reply_to_tweet_id: options.messageId },
        }),
      });

      return { success: true, externalId: response.data?.id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getAccountInfo() {
    const url = `${this.baseUrl}/users/${this.config.accountId}?user.fields=id,name,username,profile_image_url`;
    const response = await this.makeRequest<{
      data: { id: string; name: string; username: string; profile_image_url: string };
    }>(url);

    return {
      id: response.data?.id || this.config.accountId,
      name: response.data?.name || '',
      handle: response.data?.username,
      profileImage: response.data?.profile_image_url,
    };
  }

  private normalizeXTweet(
    tweet: XTweet,
    users: Map<string, { id: string; name: string; username: string; profile_image_url: string }>
  ): NormalizedMessage {
    const author = users.get(tweet.author_id);

    return {
      externalId: tweet.id,
      provider: 'x',
      channelType: 'mention',
      direction: 'inbound',
      content: tweet.text,
      contentType: 'text',
      author: {
        id: tweet.author_id,
        handle: author?.username,
        name: author?.name,
        profileImage: author?.profile_image_url,
      },
      attachments: [],
      sentAt: new Date(tweet.created_at),
      threadId: tweet.conversation_id,
      rawData: tweet,
    };
  }
}

// Factory function to create appropriate client
export function createPlatformClient(config: PlatformClientConfig): BasePlatformClient {
  switch (config.provider) {
    case 'facebook':
    case 'instagram':
      return new MetaClient(config);
    case 'youtube':
      return new YouTubeClient(config);
    case 'tiktok':
      return new TikTokClient(config);
    case 'linkedin':
      return new LinkedInClient(config);
    case 'reddit':
      return new RedditClient(config);
    case 'x':
      return new XClient(config);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

// Export base class for type checking
export { BasePlatformClient };
