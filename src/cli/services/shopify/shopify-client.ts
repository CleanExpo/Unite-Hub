/**
 * Shopify API Client
 *
 * Unified client for Shopify GraphQL and REST Admin APIs with:
 * - Rate limiting (40 req/sec GraphQL, 2 req/sec REST)
 * - Automatic retry with exponential backoff
 * - Credential management via Secret Manager
 * - Multi-tenant support
 */

import { SecretManagerService } from '../secrets/secret-manager.js';

export interface ShopifyConfig {
  shop: string; // mystore.myshopify.com
  tenantId: string;
  apiVersion?: string; // Default: 2024-01
}

export interface ShopifyCredentials {
  accessToken: string;
  shop: string;
}

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  restoreRate: number; // Points per second
  requestedCost: number;
  actualCost: number;
}

export interface ShopifyGraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: any;
  }>;
  extensions?: {
    cost?: {
      requestedQueryCost: number;
      actualQueryCost: number;
      throttleStatus: {
        maximumAvailable: number;
        currentlyAvailable: number;
        restoreRate: number;
      };
    };
  };
}

export interface ShopifyRESTResponse<T = any> {
  data?: T;
  errors?: any;
  headers?: Record<string, string>;
}

export class ShopifyClient {
  private shop: string;
  private tenantId: string;
  private apiVersion: string;
  private secretManager: SecretManagerService;
  private accessToken: string | null = null;

  // Rate limiting state
  private graphqlAvailable: number = 1000; // Max bucket size
  private graphqlRestoreRate: number = 50; // Points per second
  private graphqlLastRefill: number = Date.now();
  private restLastRequest: number = 0;
  private restMinInterval: number = 500; // 2 req/sec = 500ms interval

  constructor(config: ShopifyConfig) {
    this.shop = config.shop;
    this.tenantId = config.tenantId;
    this.apiVersion = config.apiVersion || '2024-01';
    this.secretManager = new SecretManagerService();
  }

  /**
   * Initialize client by loading credentials from Secret Manager
   */
  async initialize(): Promise<void> {
    const secret = await this.secretManager.retrieveSecret({
      service: 'shopify',
      tenantId: this.tenantId,
    });

    if (!secret) {
      throw new Error(
        `No Shopify credentials found for tenant ${this.tenantId}. Run: synthex auth login --service shopify --tenant-id ${this.tenantId}`
      );
    }

    this.accessToken = secret.access_token;
  }

  /**
   * Execute GraphQL query with rate limiting and retry
   */
  async graphql<T = any>(
    query: string,
    variables?: Record<string, any>,
    options: {
      retries?: number;
      cost?: number; // Estimated query cost
    } = {}
  ): Promise<ShopifyGraphQLResponse<T>> {
    const { retries = 3, cost = 10 } = options;

    // Ensure initialized
    if (!this.accessToken) {
      await this.initialize();
    }

    // Wait for rate limit
    await this.waitForGraphQLRateLimit(cost);

    const url = `https://${this.shop}/admin/api/${this.apiVersion}/graphql.json`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.accessToken!,
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`Shopify GraphQL error: ${response.status} ${response.statusText}`);
      }

      const result: ShopifyGraphQLResponse<T> = await response.json();

      // Update rate limit from response
      if (result.extensions?.cost) {
        this.updateGraphQLRateLimit(result.extensions.cost.throttleStatus);
      }

      // Handle errors
      if (result.errors && result.errors.length > 0) {
        const error = result.errors[0];
        throw new Error(`GraphQL error: ${error.message}`);
      }

      return result;
    } catch (error) {
      if (retries > 0) {
        // Exponential backoff
        const delay = Math.pow(2, 4 - retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.graphql<T>(query, variables, { ...options, retries: retries - 1 });
      }
      throw error;
    }
  }

  /**
   * Execute REST API request with rate limiting and retry
   */
  async rest<T = any>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      retries?: number;
    } = {}
  ): Promise<ShopifyRESTResponse<T>> {
    const { method = 'GET', body, retries = 3 } = options;

    // Ensure initialized
    if (!this.accessToken) {
      await this.initialize();
    }

    // Wait for rate limit (2 req/sec)
    await this.waitForRESTRateLimit();

    const url = `https://${this.shop}/admin/api/${this.apiVersion}/${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.accessToken!,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      // Extract rate limit headers
      const rateLimitHeader = response.headers.get('X-Shopify-Shop-Api-Call-Limit');
      if (rateLimitHeader) {
        const [current, max] = rateLimitHeader.split('/').map(Number);
        // If approaching limit, slow down
        if (current >= max * 0.8) {
          this.restMinInterval = 1000; // Slow to 1 req/sec
        } else {
          this.restMinInterval = 500; // Normal 2 req/sec
        }
      }

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - retry after delay
          const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          if (retries > 0) {
            return this.rest<T>(endpoint, { ...options, retries: retries - 1 });
          }
        }
        throw new Error(`Shopify REST error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      return {
        data: result,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      if (retries > 0 && (error as any).status !== 404) {
        const delay = Math.pow(2, 4 - retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.rest<T>(endpoint, { ...options, retries: retries - 1 });
      }
      throw error;
    }
  }

  /**
   * Wait for GraphQL rate limit (bucket refill)
   */
  private async waitForGraphQLRateLimit(cost: number): Promise<void> {
    const now = Date.now();
    const elapsed = (now - this.graphqlLastRefill) / 1000;

    // Refill bucket
    this.graphqlAvailable = Math.min(
      1000,
      this.graphqlAvailable + elapsed * this.graphqlRestoreRate
    );
    this.graphqlLastRefill = now;

    // Wait if insufficient points
    if (this.graphqlAvailable < cost) {
      const waitTime = ((cost - this.graphqlAvailable) / this.graphqlRestoreRate) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.graphqlAvailable = cost;
    } else {
      this.graphqlAvailable -= cost;
    }
  }

  /**
   * Wait for REST rate limit (2 req/sec)
   */
  private async waitForRESTRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.restLastRequest;

    if (elapsed < this.restMinInterval) {
      await new Promise((resolve) => setTimeout(resolve, this.restMinInterval - elapsed));
    }

    this.restLastRequest = Date.now();
  }

  /**
   * Update GraphQL rate limit from response
   */
  private updateGraphQLRateLimit(throttleStatus: {
    maximumAvailable: number;
    currentlyAvailable: number;
    restoreRate: number;
  }): void {
    this.graphqlAvailable = throttleStatus.currentlyAvailable;
    this.graphqlRestoreRate = throttleStatus.restoreRate;
    this.graphqlLastRefill = Date.now();
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): {
    graphql: { available: number; max: number; restoreRate: number };
    rest: { minInterval: number };
  } {
    return {
      graphql: {
        available: Math.floor(this.graphqlAvailable),
        max: 1000,
        restoreRate: this.graphqlRestoreRate,
      },
      rest: {
        minInterval: this.restMinInterval,
      },
    };
  }

  /**
   * Get shop information
   */
  async getShopInfo(): Promise<any> {
    const query = `
      query {
        shop {
          name
          email
          currencyCode
          primaryDomain {
            url
          }
          plan {
            displayName
          }
        }
      }
    `;

    const result = await this.graphql(query, {}, { cost: 1 });
    return result.data?.shop;
  }
}
