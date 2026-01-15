/**
 * JWT Manager
 *
 * Manages JWT token lifecycle for Synthex CLI authentication
 * - Generates tokens with 24-hour expiry
 * - Validates tokens
 * - Stores tokens in ~/.synthex/jwt.token
 */

import jwt from 'jsonwebtoken';
import fs from 'fs';
import { configManager } from '../../utils/config-manager.js';

export interface JwtPayload {
  iss: string; // Issuer: 'synthex-cli'
  sub: string; // Subject: user email or ID
  aud: string; // Audience: 'synthex-api'
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  workspace_id: string;
  tenant_id?: string; // Optional: for tenant-specific operations
  scopes: string[]; // OAuth scopes granted
}

export interface TokenGenerationOptions {
  userId: string;
  workspaceId: string;
  tenantId?: string;
  scopes: string[];
  expiresIn?: string; // Default: '24h'
}

export class JwtManager {
  private readonly issuer = 'synthex-cli';
  private readonly audience = 'synthex-api';
  private readonly algorithm = 'HS256';
  private readonly defaultExpiry = '24h';

  /**
   * Get JWT secret from environment or generate one
   */
  private getSecret(): string {
    // Try environment variable first
    if (process.env.SYNTHEX_JWT_SECRET) {
      return process.env.SYNTHEX_JWT_SECRET;
    }

    // For development, use a deterministic secret based on workspace
    // In production, this should come from environment or Secret Manager
    const config = configManager.loadConfig();
    if (!config) {
      throw new Error('Synthex not initialized. Run `synthex init` first.');
    }

    // Generate deterministic secret from workspace_id
    // WARNING: This is for development only. Production should use env vars.
    const secret = `synthex-jwt-${config.workspace_id}-${config.project_id}`;
    return secret;
  }

  /**
   * Generate JWT token
   */
  generateToken(options: TokenGenerationOptions): { token: string; expiresAt: Date } {
    const config = configManager.loadConfig();
    if (!config) {
      throw new Error('Synthex not initialized. Run `synthex init` first.');
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = options.expiresIn || this.defaultExpiry;

    // Calculate expiry timestamp
    const expirySeconds = this.parseExpiry(expiresIn);
    const exp = now + expirySeconds;

    const payload: JwtPayload = {
      iss: this.issuer,
      sub: options.userId,
      aud: this.audience,
      exp,
      iat: now,
      workspace_id: options.workspaceId,
      tenant_id: options.tenantId,
      scopes: options.scopes,
    };

    const token = jwt.sign(payload, this.getSecret(), {
      algorithm: this.algorithm,
    });

    const expiresAt = new Date(exp * 1000);

    return { token, expiresAt };
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.getSecret(), {
        algorithms: [this.algorithm],
        issuer: this.issuer,
        audience: this.audience,
      }) as JwtPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('JWT token has expired. Please run `synthex auth refresh`.');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid JWT token. Please run `synthex auth login` again.');
      }

      throw error;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as JwtPayload;
      if (!decoded || !decoded.exp) {
        return true;
      }

      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch {
      return true;
    }
  }

  /**
   * Save token to file and update config
   */
  saveToken(token: string, expiresAt: Date): void {
    configManager.saveJwt(token, expiresAt);
  }

  /**
   * Load token from file
   */
  loadToken(): string | null {
    return configManager.loadJwt();
  }

  /**
   * Clear token
   */
  clearToken(): void {
    configManager.clearJwt();
  }

  /**
   * Get current token if valid, null otherwise
   */
  getCurrentToken(): string | null {
    const token = this.loadToken();
    if (!token) {
      return null;
    }

    if (this.isTokenExpired(token)) {
      this.clearToken();
      return null;
    }

    return token;
  }

  /**
   * Get token payload without verification (for display purposes)
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Parse expiry string like '24h', '7d', '30m' to seconds
   */
  private parseExpiry(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiresIn}. Use format like '24h', '7d', '30m'`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * multipliers[unit];
  }

  /**
   * Refresh token (generate new token from existing one)
   */
  refreshToken(): { token: string; expiresAt: Date } {
    const currentToken = this.getCurrentToken();
    if (!currentToken) {
      throw new Error('No valid token found. Please run `synthex auth login`.');
    }

    // Verify current token (will throw if invalid)
    const payload = this.verifyToken(currentToken);

    // Generate new token with same scopes
    return this.generateToken({
      userId: payload.sub,
      workspaceId: payload.workspace_id,
      tenantId: payload.tenant_id,
      scopes: payload.scopes,
    });
  }

  /**
   * Get token expiry date
   */
  getTokenExpiry(token?: string): Date | null {
    const tokenToCheck = token || this.getCurrentToken();
    if (!tokenToCheck) {
      return null;
    }

    const decoded = this.decodeToken(tokenToCheck);
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  getTimeUntilExpiry(token?: string): number | null {
    const expiryDate = this.getTokenExpiry(token);
    if (!expiryDate) {
      return null;
    }

    return expiryDate.getTime() - Date.now();
  }

  /**
   * Check if token needs refresh (expires in < 1 hour)
   */
  needsRefresh(token?: string): boolean {
    const timeUntilExpiry = this.getTimeUntilExpiry(token);
    if (timeUntilExpiry === null) {
      return true;
    }

    // Refresh if expires in less than 1 hour
    return timeUntilExpiry < 3600000;
  }
}

// Singleton instance
export const jwtManager = new JwtManager();
