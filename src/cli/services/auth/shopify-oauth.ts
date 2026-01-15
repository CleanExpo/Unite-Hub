/**
 * Shopify OAuth Service
 *
 * Handles Shopify OAuth 2.0 authentication flow
 * - Generates OAuth authorization URL
 * - Exchanges authorization code for access token
 * - Stores tokens in Google Secret Manager
 * - Validates HMAC signatures
 */

import crypto from 'crypto';
import http from 'http';
import open from 'open';
import { URL } from 'url';
import { secretManager, type SecretValue } from '../secrets/secret-manager.js';
import { logger } from '../../utils/logger.js';

export interface ShopifyAuthOptions {
  tenantId: string;
  shop: string; // myshopify.com domain (e.g., 'example.myshopify.com')
  scopes?: string[];
  redirectUri?: string;
}

export interface ShopifyTokenResponse {
  access_token: string;
  scope: string;
  expires_in?: number; // Some apps have expiring tokens
}

export class ShopifyOAuthService {
  private readonly apiVersion = '2024-01';
  private readonly defaultScopes = [
    'read_products',
    'write_products',
    'read_orders',
    'write_orders',
    'read_customers',
    'write_customers',
    'read_inventory',
    'write_inventory',
  ];

  private readonly callbackPort = 3008;
  private readonly callbackPath = '/api/synthex/auth/shopify/callback';

  /**
   * Get Shopify API key from environment
   */
  private getApiKey(): string {
    const apiKey = process.env.SHOPIFY_API_KEY;
    if (!apiKey) {
      throw new Error(
        'SHOPIFY_API_KEY environment variable not set. Please configure Shopify app credentials.'
      );
    }
    return apiKey;
  }

  /**
   * Get Shopify API secret from environment
   */
  private getApiSecret(): string {
    const apiSecret = process.env.SHOPIFY_API_SECRET;
    if (!apiSecret) {
      throw new Error(
        'SHOPIFY_API_SECRET environment variable not set. Please configure Shopify app credentials.'
      );
    }
    return apiSecret;
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(options: ShopifyAuthOptions): string {
    const scopes = options.scopes || this.defaultScopes;
    const redirectUri =
      options.redirectUri || `http://localhost:${this.callbackPort}${this.callbackPath}`;

    // Generate random state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Store state temporarily (in production, use Redis or database)
    // For CLI, we'll validate it in the callback

    const authUrl = new URL(`https://${options.shop}/admin/oauth/authorize`);
    authUrl.searchParams.set('client_id', this.getApiKey());
    authUrl.searchParams.set('scope', scopes.join(','));
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);

    return authUrl.toString();
  }

  /**
   * Start OAuth flow and open browser
   */
  async startAuthFlow(options: ShopifyAuthOptions): Promise<SecretValue> {
    const authUrl = this.generateAuthUrl(options);

    await logger.info('Opening browser for Shopify authentication...');
    await logger.url(authUrl);

    // Open browser
    await open(authUrl);

    // Start local server to handle callback
    return new Promise((resolve, reject) => {
      const server = http.createServer(async (req, res) => {
        if (!req.url) {
          res.writeHead(400);
          res.end('Bad Request');
          return;
        }

        const url = new URL(req.url, `http://localhost:${this.callbackPort}`);

        if (url.pathname === this.callbackPath) {
          const code = url.searchParams.get('code');
          const shop = url.searchParams.get('shop');
          const hmac = url.searchParams.get('hmac');
          const state = url.searchParams.get('state');

          if (!code || !shop || !hmac) {
            res.writeHead(400);
            res.end('Missing required parameters');
            server.close();
            reject(new Error('Missing required OAuth parameters'));
            return;
          }

          // Validate HMAC
          if (!this.validateHmac(url.search, hmac)) {
            res.writeHead(403);
            res.end('Invalid HMAC signature');
            server.close();
            reject(new Error('Invalid HMAC signature'));
            return;
          }

          try {
            // Exchange code for access token
            const tokenData = await this.exchangeCodeForToken(shop, code);

            // Store in Secret Manager
            const secretValue: SecretValue = {
              access_token: tokenData.access_token,
              expires_at: tokenData.expires_in
                ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days default
              scopes: tokenData.scope.split(','),
              metadata: {
                shop,
              },
            };

            await secretManager.storeSecret({
              tenantId: options.tenantId,
              service: 'shopify',
              value: secretValue,
            });

            // Success response
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Shopify Authentication Success</title>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      height: 100vh;
                      margin: 0;
                      background: #f6f6f7;
                    }
                    .container {
                      background: white;
                      padding: 40px;
                      border-radius: 8px;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                      text-align: center;
                      max-width: 400px;
                    }
                    .success {
                      color: #5cb85c;
                      font-size: 48px;
                      margin-bottom: 20px;
                    }
                    h1 {
                      color: #333;
                      margin-bottom: 10px;
                    }
                    p {
                      color: #666;
                      line-height: 1.5;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="success">✓</div>
                    <h1>Authentication Successful!</h1>
                    <p>You have successfully authenticated with Shopify.</p>
                    <p>You can close this window and return to the terminal.</p>
                  </div>
                </body>
              </html>
            `);

            server.close();
            resolve(secretValue);
          } catch (error) {
            res.writeHead(500);
            res.end('Authentication failed');
            server.close();
            reject(error);
          }
        }
      });

      server.listen(this.callbackPort, () => {
        logger.log(`Waiting for OAuth callback on port ${this.callbackPort}...`);
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        server.close();
        reject(new Error('OAuth flow timed out'));
      }, 300000);
    });
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(shop: string, code: string): Promise<ShopifyTokenResponse> {
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.getApiKey(),
        client_secret: this.getApiSecret(),
        code,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange code for token: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as ShopifyTokenResponse;
    return data;
  }

  /**
   * Validate HMAC signature
   */
  private validateHmac(queryString: string, hmacToVerify: string): boolean {
    // Remove HMAC and signature from query string
    const params = new URLSearchParams(queryString);
    params.delete('hmac');
    params.delete('signature');

    // Sort parameters alphabetically
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    // Calculate HMAC
    const hash = crypto
      .createHmac('sha256', this.getApiSecret())
      .update(sortedParams)
      .digest('hex');

    return hash === hmacToVerify;
  }

  /**
   * Retrieve stored Shopify credentials
   */
  async getCredentials(tenantId: string): Promise<SecretValue | null> {
    return await secretManager.retrieveSecret({
      tenantId,
      service: 'shopify',
    });
  }

  /**
   * Check if credentials exist and are valid
   */
  async hasValidCredentials(tenantId: string): Promise<boolean> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) {
      return false;
    }

    return !secretManager.isTokenExpired(credentials);
  }

  /**
   * Revoke Shopify access
   */
  async revokeAccess(tenantId: string): Promise<void> {
    await secretManager.deleteSecret({
      tenantId,
      service: 'shopify',
    });
  }
}

// Singleton instance
export const shopifyOAuth = new ShopifyOAuthService();
