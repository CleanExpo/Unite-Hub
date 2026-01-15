/**
 * Google Merchant Center API Client
 *
 * Unified client for Google Merchant Center Content API v2.1 with:
 * - Product feed management (insert, update, delete, list)
 * - Multi-country support (AU, NZ, US, UK)
 * - Automatic retry with exponential backoff
 * - Credential management via Secret Manager
 * - Rate limiting (10 QPS per merchant account)
 */

import { SecretManagerService } from '../secrets/secret-manager.js';

export interface GMCConfig {
  merchantId: string; // Google Merchant Center ID
  clientId: string; // OAuth client ID
}

export interface GMCCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface GMCProduct {
  offerId: string; // Unique ID (SKU)
  title: string;
  description: string;
  link: string; // Product page URL
  imageLink: string;
  contentLanguage: string; // en, en-AU, en-NZ
  targetCountry: string; // AU, NZ, US, GB
  channel: 'online' | 'local';
  availability: 'in stock' | 'out of stock' | 'preorder' | 'backorder';
  condition: 'new' | 'refurbished' | 'used';
  price: {
    value: string; // "29.99"
    currency: string; // "AUD"
  };
  salePrice?: {
    value: string;
    currency: string;
  };
  brand?: string;
  gtin?: string; // Global Trade Item Number (barcode)
  mpn?: string; // Manufacturer Part Number
  googleProductCategory?: string; // Google's product taxonomy
  productType?: string; // Custom category hierarchy
  shippingWeight?: {
    value: string;
    unit: 'kg' | 'lb';
  };
  shipping?: Array<{
    country: string;
    price: { value: string; currency: string };
    service?: string;
  }>;
  customLabel0?: string;
  customLabel1?: string;
  customLabel2?: string;
  customLabel3?: string;
  customLabel4?: string;
  additionalImageLinks?: string[];
  ageGroup?: 'newborn' | 'infant' | 'toddler' | 'kids' | 'adult';
  color?: string;
  gender?: 'male' | 'female' | 'unisex';
  material?: string;
  pattern?: string;
  size?: string;
  sizeType?: string;
  sizeSystem?: string;
}

export interface GMCProductResponse {
  kind: 'content#product';
  id: string;
  offerId: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  contentLanguage: string;
  targetCountry: string;
  channel: string;
  availability: string;
  condition: string;
  price: { value: string; currency: string };
  // ... other fields
}

export interface GMCProductsListResponse {
  kind: 'content#productsListResponse';
  resources: GMCProductResponse[];
  nextPageToken?: string;
}

export interface GMCProductStatus {
  productId: string;
  title: string;
  googleExpirationDate?: string;
  creationDate?: string;
  lastUpdateDate?: string;
  destinationStatuses: Array<{
    destination: string;
    status: 'approved' | 'disapproved' | 'pending';
    approvedCountries?: string[];
    pendingCountries?: string[];
    disapprovedCountries?: string[];
  }>;
  itemLevelIssues?: Array<{
    code: string;
    servability: 'demoted' | 'disapproved' | 'unaffected';
    resolution?: string;
    description: string;
    detail?: string;
    documentation?: string;
    applicableCountries?: string[];
  }>;
}

export class GMCClient {
  private merchantId: string;
  private clientId: string;
  private secretManager: SecretManagerService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  // Rate limiting (10 QPS)
  private lastRequest: number = 0;
  private minInterval: number = 100; // 10 req/sec = 100ms interval

  private readonly BASE_URL = 'https://shoppingcontent.googleapis.com/content/v2.1';

  constructor(config: GMCConfig) {
    this.merchantId = config.merchantId;
    this.clientId = config.clientId;
    this.secretManager = new SecretManagerService();
  }

  /**
   * Initialize client by loading credentials from Secret Manager
   */
  async initialize(): Promise<void> {
    const secret = await this.secretManager.retrieveSecret({
      service: 'google-merchant',
      tenantId: this.clientId,
    });

    if (!secret) {
      throw new Error(
        `No Google Merchant Center credentials found for client ${this.clientId}. Run: synthex auth login --service google-merchant --client-id ${this.clientId}`
      );
    }

    this.accessToken = secret.access_token;
    this.refreshToken = secret.refresh_token;
    this.tokenExpiresAt = new Date(secret.expires_at);

    // Check if token needs refresh
    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Insert a product into Google Merchant Center
   */
  async insertProduct(product: GMCProduct): Promise<GMCProductResponse> {
    await this.ensureAuthenticated();

    const url = `${this.BASE_URL}/${this.merchantId}/products`;

    return this.request<GMCProductResponse>('POST', url, product);
  }

  /**
   * Get a product from Google Merchant Center
   */
  async getProduct(productId: string): Promise<GMCProductResponse> {
    await this.ensureAuthenticated();

    const url = `${this.BASE_URL}/${this.merchantId}/products/${productId}`;

    return this.request<GMCProductResponse>('GET', url);
  }

  /**
   * Update a product in Google Merchant Center
   */
  async updateProduct(productId: string, product: GMCProduct): Promise<GMCProductResponse> {
    await this.ensureAuthenticated();

    const url = `${this.BASE_URL}/${this.merchantId}/products/${productId}`;

    return this.request<GMCProductResponse>('PUT', url, product);
  }

  /**
   * Delete a product from Google Merchant Center
   */
  async deleteProduct(productId: string): Promise<void> {
    await this.ensureAuthenticated();

    const url = `${this.BASE_URL}/${this.merchantId}/products/${productId}`;

    await this.request<void>('DELETE', url);
  }

  /**
   * List products from Google Merchant Center
   */
  async listProducts(options: {
    maxResults?: number;
    pageToken?: string;
  } = {}): Promise<GMCProductsListResponse> {
    await this.ensureAuthenticated();

    const params = new URLSearchParams();
    if (options.maxResults) {
      params.set('maxResults', options.maxResults.toString());
    }
    if (options.pageToken) {
      params.set('pageToken', options.pageToken);
    }

    const url = `${this.BASE_URL}/${this.merchantId}/products?${params.toString()}`;

    return this.request<GMCProductsListResponse>('GET', url);
  }

  /**
   * Get product status (approval status, issues)
   */
  async getProductStatus(productId: string): Promise<GMCProductStatus> {
    await this.ensureAuthenticated();

    const url = `${this.BASE_URL}/${this.merchantId}/productstatuses/${productId}`;

    return this.request<GMCProductStatus>('GET', url);
  }

  /**
   * Batch insert products (up to 1000 per batch)
   */
  async batchInsertProducts(products: GMCProduct[]): Promise<{
    successes: number;
    failures: number;
    errors: Array<{ productId: string; error: string }>;
  }> {
    const batchSize = 1000;
    const batches = [];

    for (let i = 0; i < products.length; i += batchSize) {
      batches.push(products.slice(i, i + batchSize));
    }

    let successes = 0;
    let failures = 0;
    const errors: Array<{ productId: string; error: string }> = [];

    for (const batch of batches) {
      const entries = batch.map((product, index) => ({
        batchId: index,
        merchantId: this.merchantId,
        method: 'insert',
        product,
      }));

      const url = `${this.BASE_URL}/products/batch`;

      try {
        const result = await this.request<any>('POST', url, { entries });

        for (const entry of result.entries || []) {
          if (entry.errors) {
            failures++;
            errors.push({
              productId: batch[entry.batchId].offerId,
              error: entry.errors.errors[0].message,
            });
          } else {
            successes++;
          }
        }
      } catch (error) {
        failures += batch.length;
        for (const product of batch) {
          errors.push({
            productId: product.offerId,
            error: (error as Error).message,
          });
        }
      }
    }

    return { successes, failures, errors };
  }

  /**
   * Make authenticated API request with retry
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    body?: any,
    retries: number = 3
  ): Promise<T> {
    // Rate limiting
    await this.waitForRateLimit();

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401 && retries > 0) {
          await this.refreshAccessToken();
          return this.request<T>(method, url, body, retries - 1);
        }

        // Handle rate limiting
        if (response.status === 429 && retries > 0) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          return this.request<T>(method, url, body, retries - 1);
        }

        const errorText = await response.text();
        throw new Error(`GMC API error ${response.status}: ${errorText}`);
      }

      if (method === 'DELETE') {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      if (retries > 0 && (error as any).code !== 'ENOTFOUND') {
        const delay = Math.pow(2, 4 - retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.request<T>(method, url, body, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Wait for rate limit (10 QPS)
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequest;

    if (elapsed < this.minInterval) {
      await new Promise((resolve) => setTimeout(resolve, this.minInterval - elapsed));
    }

    this.lastRequest = Date.now();
  }

  /**
   * Check if token is expired or expiring soon
   */
  private isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return true;

    const now = new Date();
    const expiresIn = this.tokenExpiresAt.getTime() - now.getTime();

    // Refresh if expires in less than 5 minutes
    return expiresIn < 5 * 60 * 1000;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available. Please re-authenticate.');
    }

    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientSecret) {
      throw new Error('GOOGLE_CLIENT_SECRET not configured');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();

    this.accessToken = data.access_token;
    this.tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);

    // Update stored credentials
    await this.secretManager.storeSecret({
      service: 'google-merchant',
      tenantId: this.clientId,
      credentials: {
        access_token: this.accessToken,
        refresh_token: this.refreshToken,
        expires_at: this.tokenExpiresAt.toISOString(),
        scopes: ['https://www.googleapis.com/auth/content'],
      },
    });
  }

  /**
   * Ensure authenticated before making requests
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken) {
      await this.initialize();
    }

    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Get merchant account information
   */
  async getMerchantInfo(): Promise<any> {
    await this.ensureAuthenticated();

    const url = `${this.BASE_URL}/${this.merchantId}/accounts/${this.merchantId}`;

    return this.request<any>('GET', url);
  }
}
