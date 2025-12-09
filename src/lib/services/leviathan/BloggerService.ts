/**
 * BloggerService - Automated Blogger Publishing
 * Phase 13 Week 5-6: Social stack integration
 *
 * Handles:
 * - Google OAuth2 authentication for Blogger API
 * - Automated post creation with HTML + schema + OG
 * - Post scheduling and publishing
 * - Blog management
 */

import { google } from 'googleapis';
import * as crypto from 'crypto';

export interface BloggerConfig {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

export interface BloggerPost {
  title: string;
  content: string;
  labels?: string[];
  isDraft?: boolean;
  scheduledTime?: Date;
  customMetaData?: string;
}

export interface BloggerPostResult {
  success: boolean;
  postId?: string;
  blogId?: string;
  postUrl?: string;
  editUrl?: string;
  publishedAt?: string;
  error?: string;
}

export interface BlogInfo {
  id: string;
  name: string;
  description: string;
  url: string;
  postsCount: number;
}

export class BloggerService {
  private oauth2Client;
  private blogger;
  private isInitialized: boolean = false;

  constructor(config?: BloggerConfig) {
    const clientId = config?.clientId || process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = config?.clientSecret || process.env.GOOGLE_CLIENT_SECRET || '';
    const refreshToken = config?.refreshToken || process.env.BLOGGER_REFRESH_TOKEN || '';

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost:3008/api/auth/callback/google'
    );

    if (refreshToken) {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });
      this.isInitialized = true;
    }

    this.blogger = google.blogger({
      version: 'v3',
      auth: this.oauth2Client,
    });
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/blogger',
      ],
      prompt: 'consent',
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string): Promise<{ refreshToken: string; accessToken: string }> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    this.isInitialized = true;

    return {
      refreshToken: tokens.refresh_token || '',
      accessToken: tokens.access_token || '',
    };
  }

  /**
   * List user's blogs
   */
  async listBlogs(): Promise<BlogInfo[]> {
    if (!this.isInitialized) {
      throw new Error('BloggerService not initialized. Please authenticate first.');
    }

    const response = await this.blogger.blogs.listByUser({
      userId: 'self',
    });

    return (response.data.items || []).map((blog: any) => ({
      id: blog.id || '',
      name: blog.name || '',
      description: blog.description || '',
      url: blog.url || '',
      postsCount: blog.posts?.totalItems || 0,
    }));
  }

  /**
   * Create a new post on a blog
   */
  async createPost(
    blogId: string,
    post: BloggerPost
  ): Promise<BloggerPostResult> {
    if (!this.isInitialized) {
      throw new Error('BloggerService not initialized. Please authenticate first.');
    }

    try {
      const requestBody: any = {
        kind: 'blogger#post',
        title: post.title,
        content: post.content,
        labels: post.labels || [],
      };

      // Add custom meta data if provided
      if (post.customMetaData) {
        requestBody.customMetaData = post.customMetaData;
      }

      let response;

      if (post.isDraft) {
        // Create as draft
        response = await this.blogger.posts.insert({
          blogId,
          requestBody,
          isDraft: true,
        });
      } else if (post.scheduledTime) {
        // Schedule for future
        requestBody.published = post.scheduledTime.toISOString();
        response = await this.blogger.posts.insert({
          blogId,
          requestBody,
        });
      } else {
        // Publish immediately
        response = await this.blogger.posts.insert({
          blogId,
          requestBody,
        });
      }

      const data = response.data;

      return {
        success: true,
        postId: data.id || undefined,
        blogId: data.blog?.id || blogId,
        postUrl: data.url || undefined,
        editUrl: `https://www.blogger.com/blog/post/edit/${blogId}/${data.id}`,
        publishedAt: data.published || undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Blogger error';
      console.error('Blogger post creation failed:', errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Update an existing post
   */
  async updatePost(
    blogId: string,
    postId: string,
    post: Partial<BloggerPost>
  ): Promise<BloggerPostResult> {
    if (!this.isInitialized) {
      throw new Error('BloggerService not initialized. Please authenticate first.');
    }

    try {
      const requestBody: any = {};

      if (post.title) {
requestBody.title = post.title;
}
      if (post.content) {
requestBody.content = post.content;
}
      if (post.labels) {
requestBody.labels = post.labels;
}

      const response = await this.blogger.posts.patch({
        blogId,
        postId,
        requestBody,
      });

      return {
        success: true,
        postId: response.data.id || postId,
        blogId,
        postUrl: response.data.url || undefined,
        editUrl: `https://www.blogger.com/blog/post/edit/${blogId}/${postId}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Blogger error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Delete a post
   */
  async deletePost(blogId: string, postId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('BloggerService not initialized. Please authenticate first.');
    }

    try {
      await this.blogger.posts.delete({
        blogId,
        postId,
      });
      return true;
    } catch (error) {
      console.error('Failed to delete post:', error);
      return false;
    }
  }

  /**
   * Get a specific post
   */
  async getPost(blogId: string, postId: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('BloggerService not initialized. Please authenticate first.');
    }

    const response = await this.blogger.posts.get({
      blogId,
      postId,
    });

    return response.data;
  }

  /**
   * Publish a draft post
   */
  async publishDraft(blogId: string, postId: string): Promise<BloggerPostResult> {
    if (!this.isInitialized) {
      throw new Error('BloggerService not initialized. Please authenticate first.');
    }

    try {
      const response = await this.blogger.posts.publish({
        blogId,
        postId,
      });

      return {
        success: true,
        postId: response.data.id || postId,
        blogId,
        postUrl: response.data.url || undefined,
        publishedAt: response.data.published || undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Revert a published post to draft
   */
  async revertToDraft(blogId: string, postId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('BloggerService not initialized. Please authenticate first.');
    }

    try {
      await this.blogger.posts.revert({
        blogId,
        postId,
      });
      return true;
    } catch (error) {
      console.error('Failed to revert to draft:', error);
      return false;
    }
  }

  /**
   * Generate a unique post ID for tracking
   */
  generateTrackingId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

export default BloggerService;
