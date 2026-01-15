/**
 * Synthex Configuration Manager
 *
 * Manages ~/.synthex/config.json configuration file
 * Handles market settings, region configuration, and workspace management
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

export interface SynthexConfig {
  version: string;
  market: string;
  region: string;
  workspace_id: string;
  project_id: string;
  initialized_at: string;
  settings: {
    currency: string;
    timezone: string;
    tax_mode: 'inclusive' | 'exclusive';
    locale: string;
  };
  auth: {
    jwt_path: string;
    jwt_expires_at: string | null;
  };
}

export interface MarketSettings {
  currency: string;
  timezone: string;
  locale: string;
  tax_mode: 'inclusive' | 'exclusive';
}

const MARKET_DEFAULTS: Record<string, MarketSettings> = {
  ANZ_SMB: {
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    locale: 'en-AU',
    tax_mode: 'inclusive',
  },
  ANZ_ENTERPRISE: {
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    locale: 'en-AU',
    tax_mode: 'exclusive',
  },
  US_SMB: {
    currency: 'USD',
    timezone: 'America/New_York',
    locale: 'en-US',
    tax_mode: 'exclusive',
  },
  UK_SMB: {
    currency: 'GBP',
    timezone: 'Europe/London',
    locale: 'en-GB',
    tax_mode: 'inclusive',
  },
};

const REGION_NAMES: Record<string, string> = {
  'AU-SE1': 'Australia Southeast (Sydney)',
  'AU-SE2': 'Australia Southeast (Melbourne)',
  'NZ-NR1': 'New Zealand North (Auckland)',
  'US-EA1': 'US East (Virginia)',
  'US-WE1': 'US West (Oregon)',
  'EU-WE1': 'Europe West (London)',
};

export class ConfigManager {
  private configDir: string;
  private configPath: string;
  private jwtPath: string;

  constructor() {
    this.configDir = path.join(os.homedir(), '.synthex');
    this.configPath = path.join(this.configDir, 'config.json');
    this.jwtPath = path.join(this.configDir, 'jwt.token');
  }

  /**
   * Initialize Synthex configuration
   */
  async initialize(market: string, region: string): Promise<SynthexConfig> {
    // Ensure config directory exists
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    // Validate market
    if (!MARKET_DEFAULTS[market]) {
      throw new Error(
        `Invalid market: ${market}. Valid options: ${Object.keys(MARKET_DEFAULTS).join(', ')}`
      );
    }

    // Validate region
    if (!REGION_NAMES[region]) {
      throw new Error(
        `Invalid region: ${region}. Valid options: ${Object.keys(REGION_NAMES).join(', ')}`
      );
    }

    // Get market-specific settings
    const marketSettings = MARKET_DEFAULTS[market];

    // Create config
    const config: SynthexConfig = {
      version: '1.0.0',
      market,
      region,
      workspace_id: this.generateWorkspaceId(market, region),
      project_id: process.env.SYNTHEX_PROJECT_ID || 'synthex-prod',
      initialized_at: new Date().toISOString(),
      settings: marketSettings,
      auth: {
        jwt_path: this.jwtPath,
        jwt_expires_at: null,
      },
    };

    // Write config file
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');

    return config;
  }

  /**
   * Load existing configuration
   */
  loadConfig(): SynthexConfig | null {
    if (!fs.existsSync(this.configPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(content) as SynthexConfig;
    } catch (error) {
      throw new Error(`Failed to load config: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SynthexConfig>): SynthexConfig {
    const currentConfig = this.loadConfig();
    if (!currentConfig) {
      throw new Error('No configuration found. Run `synthex init` first.');
    }

    const updatedConfig = { ...currentConfig, ...updates };
    fs.writeFileSync(this.configPath, JSON.stringify(updatedConfig, null, 2), 'utf-8');

    return updatedConfig;
  }

  /**
   * Get configuration value
   */
  get(key: string): any {
    const config = this.loadConfig();
    if (!config) {
      throw new Error('No configuration found. Run `synthex init` first.');
    }

    // Support nested keys like "settings.currency"
    const keys = key.split('.');
    let value: any = config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return value;
  }

  /**
   * Set configuration value
   */
  set(key: string, value: any): void {
    const config = this.loadConfig();
    if (!config) {
      throw new Error('No configuration found. Run `synthex init` first.');
    }

    // Support nested keys like "settings.currency"
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    let target: any = config;

    for (const k of keys) {
      if (!(k in target)) {
        target[k] = {};
      }
      target = target[k];
    }

    target[lastKey] = value;

    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  /**
   * Check if Synthex is initialized
   */
  isInitialized(): boolean {
    return fs.existsSync(this.configPath);
  }

  /**
   * Get config file path
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Get JWT token path
   */
  getJwtPath(): string {
    return this.jwtPath;
  }

  /**
   * Get market settings for a market
   */
  static getMarketSettings(market: string): MarketSettings | null {
    return MARKET_DEFAULTS[market] || null;
  }

  /**
   * Get region name
   */
  static getRegionName(region: string): string | null {
    return REGION_NAMES[region] || null;
  }

  /**
   * Get all valid markets
   */
  static getValidMarkets(): string[] {
    return Object.keys(MARKET_DEFAULTS);
  }

  /**
   * Get all valid regions
   */
  static getValidRegions(): string[] {
    return Object.keys(REGION_NAMES);
  }

  /**
   * Generate workspace ID from market and region
   */
  private generateWorkspaceId(market: string, region: string): string {
    const marketSlug = market.toLowerCase().replace(/_/g, '-');
    const regionSlug = region.toLowerCase();
    return `${marketSlug}-${regionSlug}`;
  }

  /**
   * Check JWT token expiry
   */
  isJwtExpired(): boolean {
    const config = this.loadConfig();
    if (!config || !config.auth.jwt_expires_at) {
      return true;
    }

    const expiresAt = new Date(config.auth.jwt_expires_at);
    return expiresAt < new Date();
  }

  /**
   * Update JWT expiry
   */
  updateJwtExpiry(expiresAt: Date): void {
    this.updateConfig({
      auth: {
        jwt_path: this.jwtPath,
        jwt_expires_at: expiresAt.toISOString(),
      },
    });
  }

  /**
   * Clear JWT token
   */
  clearJwt(): void {
    if (fs.existsSync(this.jwtPath)) {
      fs.unlinkSync(this.jwtPath);
    }

    this.updateConfig({
      auth: {
        jwt_path: this.jwtPath,
        jwt_expires_at: null,
      },
    });
  }

  /**
   * Save JWT token
   */
  saveJwt(token: string, expiresAt: Date): void {
    fs.writeFileSync(this.jwtPath, token, 'utf-8');
    this.updateJwtExpiry(expiresAt);
  }

  /**
   * Load JWT token
   */
  loadJwt(): string | null {
    if (!fs.existsSync(this.jwtPath)) {
      return null;
    }

    if (this.isJwtExpired()) {
      this.clearJwt();
      return null;
    }

    return fs.readFileSync(this.jwtPath, 'utf-8');
  }
}

// Singleton instance
export const configManager = new ConfigManager();
