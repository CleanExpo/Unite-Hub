/**
 * Google Merchant Center OAuth Service
 *
 * Handles Google OAuth 2.0 authentication flow for Merchant Center API
 * - Generates OAuth authorization URL
 * - Exchanges authorization code for access + refresh tokens
 * - Stores tokens in Google Secret Manager
 * - Handles token refresh
 */

import http from 'http';
import open from 'open';
import { URL } from 'url';
import { secretManager, type SecretValue } from '../secrets/secret-manager.js';
import { logger } from '../../utils/logger.js';

export interface GoogleAuthOptions {
  clientId: string; // Agency client ID
  scopes?: string[];
  redirectUri?: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export class GoogleOAuthService {
  private readonly defaultScopes = [
    'https://www.googleapis.com/auth/content', // Merchant Center API
  ];

  private readonly authEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly tokenEndpoint = 'https://oauth2.googleapis.com/token';
  private readonly callbackPort = 3008;
  private readonly callbackPath = '/api/synthex/auth/google/callback';

  /**
   * Get Google OAuth client ID from environment
   */
  private getClientId(): string {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) {
      throw new Error(
        'GOOGLE_OAUTH_CLIENT_ID environment variable not set. Please configure Google OAuth credentials.'
      );
    }
    return clientId;
  }

  /**
   * Get Google OAuth client secret from environment
   */
  private getClientSecret(): string {
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    if (!clientSecret) {
      throw new Error(
        'GOOGLE_OAUTH_CLIENT_SECRET environment variable not set. Please configure Google OAuth credentials.'
      );
    }
    return clientSecret;
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(options: GoogleAuthOptions): string {
    const scopes = options.scopes || this.defaultScopes;
    const redirectUri =
      options.redirectUri || `http://localhost:${this.callbackPort}${this.callbackPath}`;

    const authUrl = new URL(this.authEndpoint);
    authUrl.searchParams.set('client_id', this.getClientId());
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline'); // Request refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent screen to get refresh token

    return authUrl.toString();
  }

  /**
   * Start OAuth flow and open browser
   */
  async startAuthFlow(options: GoogleAuthOptions): Promise<SecretValue> {
    const authUrl = this.generateAuthUrl(options);

    await logger.info('Opening browser for Google authentication...');
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
          const error = url.searchParams.get('error');

          if (error) {
            res.writeHead(400);
            res.end(`Authentication error: ${error}`);
            server.close();
            reject(new Error(`OAuth error: ${error}`));
            return;
          }

          if (!code) {
            res.writeHead(400);
            res.end('Missing authorization code');
            server.close();
            reject(new Error('Missing authorization code'));
            return;
          }

          try {
            // Exchange code for tokens
            const tokenData = await this.exchangeCodeForToken(
              code,
              options.redirectUri || `http://localhost:${this.callbackPort}${this.callbackPath}`
            );

            // Store in Secret Manager
            const secretValue: SecretValue = {
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token,
              expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
              scopes: tokenData.scope.split(' '),
              metadata: {
                token_type: tokenData.token_type,
              },
            };

            await secretManager.storeSecret({
              tenantId: options.clientId,
              service: 'google-merchant',
              value: secretValue,
            });

            // Success response
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Google Authentication Success</title>
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
                      color: #4285f4;
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
                    <p>You have successfully authenticated with Google Merchant Center.</p>
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
  private async exchangeCodeForToken(
    code: string,
    redirectUri: string
  ): Promise<GoogleTokenResponse> {
    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: this.getClientId(),
        client_secret: this.getClientSecret(),
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange code for token: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as GoogleTokenResponse;
    return data;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<GoogleTokenResponse> {
    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.getClientId(),
        client_secret: this.getClientSecret(),
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as GoogleTokenResponse;
    return data;
  }

  /**
   * Retrieve stored Google credentials
   */
  async getCredentials(clientId: string): Promise<SecretValue | null> {
    return await secretManager.retrieveSecret({
      tenantId: clientId,
      service: 'google-merchant',
    });
  }

  /**
   * Check if credentials exist and are valid
   */
  async hasValidCredentials(clientId: string): Promise<boolean> {
    const credentials = await this.getCredentials(clientId);
    if (!credentials) {
      return false;
    }

    // If expired but has refresh token, try to refresh
    if (secretManager.isTokenExpired(credentials) && credentials.refresh_token) {
      try {
        const newTokens = await this.refreshToken(credentials.refresh_token);

        // Store refreshed token
        const secretValue: SecretValue = {
          access_token: newTokens.access_token,
          refresh_token: credentials.refresh_token, // Keep existing refresh token
          expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          scopes: newTokens.scope.split(' '),
          metadata: credentials.metadata,
        };

        await secretManager.storeSecret({
          tenantId: clientId,
          service: 'google-merchant',
          value: secretValue,
        });

        return true;
      } catch {
        return false;
      }
    }

    return !secretManager.isTokenExpired(credentials);
  }

  /**
   * Revoke Google access
   */
  async revokeAccess(clientId: string): Promise<void> {
    await secretManager.deleteSecret({
      tenantId: clientId,
      service: 'google-merchant',
    });
  }
}

// Singleton instance
export const googleOAuth = new GoogleOAuthService();
