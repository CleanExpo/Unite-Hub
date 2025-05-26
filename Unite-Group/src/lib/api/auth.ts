/**
 * Authentication Strategies
 * Provides implementations for various authentication mechanisms for API clients
 */

import { z } from 'zod';

// Token storage interface
export interface TokenStorage {
  saveTokens(tokens: TokenSet): Promise<void>;
  getTokens(): Promise<TokenSet | null>;
  clearTokens(): Promise<void>;
}

// Base token set interface
export interface TokenSet {
  accessToken: string;
  tokenType: string;
  expiresAt?: number; // Unix timestamp in seconds
  refreshToken?: string;
  scope?: string;
  [key: string]: any; // Allow for additional properties
}

// OAuth2 configuration
export interface OAuth2Config {
  clientId: string;
  clientSecret?: string;
  tokenEndpoint: string;
  authorizationEndpoint?: string;
  redirectUri?: string;
  scopes?: string[];
  storage: TokenStorage;
  tokenField?: string; // Default: 'access_token'
  typeField?: string; // Default: 'token_type'
  expiresInField?: string; // Default: 'expires_in'
  refreshTokenField?: string; // Default: 'refresh_token'
  scopeField?: string; // Default: 'scope'
  additionalParams?: Record<string, string>;
}

// OAuth2 token response schema
const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number().optional(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
}).passthrough();

/**
 * OAuth2 Authentication Strategy
 * Implements OAuth2 authentication with automatic token refresh
 */
export class OAuth2AuthStrategy {
  private config: OAuth2Config;
  private tokenSet: TokenSet | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor(config: OAuth2Config) {
    this.config = {
      tokenField: 'access_token',
      typeField: 'token_type',
      expiresInField: 'expires_in',
      refreshTokenField: 'refresh_token',
      scopeField: 'scope',
      ...config,
    };
  }

  /**
   * Get authorization headers for API requests
   * Will automatically refresh tokens if needed
   */
  public async getAuthHeaders(): Promise<Record<string, string>> {
    // Load tokens if not loaded yet
    if (!this.tokenSet) {
      this.tokenSet = await this.config.storage.getTokens();
    }
    
    // Check if tokens need to be refreshed
    if (this.tokenSet && this.isTokenExpired() && this.tokenSet.refreshToken) {
      // If refresh is already in progress, wait for it
      if (this.refreshPromise) {
        await this.refreshPromise;
      } else {
        // Start refresh process
        this.refreshPromise = this.refreshAuth()
          .finally(() => {
            this.refreshPromise = null;
          });
        
        await this.refreshPromise;
      }
    }
    
    // If we still don't have tokens, throw an error
    if (!this.tokenSet) {
      throw new Error('No authentication tokens available');
    }
    
    // Return authorization header
    return {
      'Authorization': `${this.tokenSet.tokenType} ${this.tokenSet.accessToken}`,
    };
  }

  /**
   * Check if access token is expired
   */
  public isTokenExpired(): boolean {
    if (!this.tokenSet || !this.tokenSet.expiresAt) {
      return true;
    }
    
    // Add a 30-second buffer to prevent edge cases
    const bufferSeconds = 30;
    return (this.tokenSet.expiresAt - bufferSeconds) < (Date.now() / 1000);
  }

  /**
   * Refresh authentication tokens
   */
  public async refreshAuth(): Promise<void> {
    if (!this.tokenSet?.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.tokenSet.refreshToken,
          client_id: this.config.clientId,
          ...(this.config.clientSecret && { client_secret: this.config.clientSecret }),
          ...(this.config.additionalParams || {}),
        }).toString(),
      });
      
      if (!response.ok) {
        // If refresh fails, try to parse error message
        let errorData: any;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = await response.text();
        }
        
        throw new Error(`Token refresh failed: ${JSON.stringify(errorData)}`);
      }
      
      // Parse token response
      const data = await response.json();
      const validatedData = tokenResponseSchema.parse(data);
      
      // Create new token set
      this.tokenSet = this.parseTokenResponse(validatedData);
      
      // Save tokens
      await this.config.storage.saveTokens(this.tokenSet);
    } catch (error) {
      // If refresh fails, clear tokens and re-throw
      this.tokenSet = null;
      await this.config.storage.clearTokens();
      throw error;
    }
  }

  /**
   * Generate authorization URL for OAuth2 authorization code flow
   */
  public generateAuthorizationUrl(state?: string, codeChallenge?: string): string {
    if (!this.config.authorizationEndpoint) {
      throw new Error('Authorization endpoint not configured');
    }
    
    if (!this.config.redirectUri) {
      throw new Error('Redirect URI not configured');
    }
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      ...(this.config.scopes && { scope: this.config.scopes.join(' ') }),
      ...(state && { state }),
      ...(codeChallenge && { 
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      }),
      ...(this.config.additionalParams || {}),
    });
    
    return `${this.config.authorizationEndpoint}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  public async exchangeCodeForTokens(code: string, codeVerifier?: string): Promise<TokenSet> {
    if (!this.config.redirectUri) {
      throw new Error('Redirect URI not configured');
    }
    
    const params: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
    };
    
    if (this.config.clientSecret) {
      params.client_secret = this.config.clientSecret;
    }
    
    if (codeVerifier) {
      params.code_verifier = codeVerifier;
    }
    
    const response = await fetch(this.config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        ...params,
        ...(this.config.additionalParams || {}),
      }).toString(),
    });
    
    if (!response.ok) {
      // Try to parse error message
      let errorData: any;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      
      throw new Error(`Code exchange failed: ${JSON.stringify(errorData)}`);
    }
    
    // Parse token response
    const data = await response.json();
    const validatedData = tokenResponseSchema.parse(data);
    
    // Create new token set
    this.tokenSet = this.parseTokenResponse(validatedData);
    
    // Save tokens
    await this.config.storage.saveTokens(this.tokenSet);
    
    return this.tokenSet;
  }

  /**
   * Parse token response into TokenSet
   */
  private parseTokenResponse(data: any): TokenSet {
    const tokenField = this.config.tokenField || 'access_token';
    const typeField = this.config.typeField || 'token_type';
    const expiresInField = this.config.expiresInField || 'expires_in';
    const refreshTokenField = this.config.refreshTokenField || 'refresh_token';
    const scopeField = this.config.scopeField || 'scope';
    
    const tokenSet: TokenSet = {
      accessToken: data[tokenField],
      tokenType: data[typeField],
    };
    
    // Calculate expiration time if expires_in is provided
    if (data[expiresInField]) {
      tokenSet.expiresAt = Math.floor(Date.now() / 1000) + Number(data[expiresInField]);
    }
    
    // Add refresh token if provided
    if (data[refreshTokenField]) {
      tokenSet.refreshToken = data[refreshTokenField];
    }
    
    // Add scope if provided
    if (data[scopeField]) {
      tokenSet.scope = data[scopeField];
    }
    
    // Add all additional fields from the response
    for (const [key, value] of Object.entries(data)) {
      // Skip fields we've already processed
      if (
        key === tokenField ||
        key === typeField ||
        key === expiresInField ||
        key === refreshTokenField ||
        key === scopeField
      ) {
        continue;
      }
      
      tokenSet[key] = value;
    }
    
    return tokenSet;
  }

  /**
   * Clear authentication tokens
   */
  public async clearAuth(): Promise<void> {
    this.tokenSet = null;
    await this.config.storage.clearTokens();
  }
}

/**
 * Local Storage Token Storage
 * Implements TokenStorage using localStorage
 */
export class LocalStorageTokenStorage implements TokenStorage {
  private storageKey: string;
  
  constructor(storageKey: string = 'oauth2_tokens') {
    this.storageKey = storageKey;
  }
  
  public async saveTokens(tokens: TokenSet): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(tokens));
    }
  }
  
  public async getTokens(): Promise<TokenSet | null> {
    if (typeof localStorage !== 'undefined') {
      const tokensJson = localStorage.getItem(this.storageKey);
      if (tokensJson) {
        try {
          return JSON.parse(tokensJson) as TokenSet;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }
  
  public async clearTokens(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }
}

/**
 * Memory Token Storage
 * Implements TokenStorage using in-memory storage (for server-side use)
 */
export class MemoryTokenStorage implements TokenStorage {
  private tokens: TokenSet | null = null;
  
  public async saveTokens(tokens: TokenSet): Promise<void> {
    this.tokens = tokens;
  }
  
  public async getTokens(): Promise<TokenSet | null> {
    return this.tokens;
  }
  
  public async clearTokens(): Promise<void> {
    this.tokens = null;
  }
}

/**
 * API Key Authentication Strategy
 * Simple strategy for API key based authentication
 */
export class ApiKeyAuthStrategy {
  private apiKey: string;
  private headerName: string;
  private prefix?: string;
  
  constructor(apiKey: string, headerName: string = 'X-API-Key', prefix?: string) {
    this.apiKey = apiKey;
    this.headerName = headerName;
    this.prefix = prefix;
  }
  
  public async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    headers[this.headerName] = this.prefix 
      ? `${this.prefix} ${this.apiKey}` 
      : this.apiKey;
    return headers;
  }
}

/**
 * Basic Authentication Strategy
 * Implements HTTP Basic Authentication
 */
export class BasicAuthStrategy {
  private username: string;
  private password: string;
  
  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }
  
  public async getAuthHeaders(): Promise<Record<string, string>> {
    const credentials = btoa(`${this.username}:${this.password}`);
    return {
      'Authorization': `Basic ${credentials}`,
    };
  }
}
