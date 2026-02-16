/**
 * Google Secret Manager Service
 *
 * Securely stores and retrieves OAuth credentials in Google Cloud Secret Manager
 * - Zero credentials in code or environment files
 * - Per-tenant credential isolation
 * - Automatic versioning
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

export interface SecretValue {
  access_token: string;
  refresh_token?: string;
  expires_at: string; // ISO 8601 timestamp
  scopes: string[];
  metadata?: Record<string, any>;
}

export interface StoreSecretOptions {
  tenantId: string;
  service: 'shopify' | 'google-merchant' | 'facebook-ads' | 'tiktok-ads';
  value: SecretValue;
  projectId?: string;
}

export interface RetrieveSecretOptions {
  tenantId: string;
  service: 'shopify' | 'google-merchant' | 'facebook-ads' | 'tiktok-ads';
  projectId?: string;
  version?: string; // Default: 'latest'
}

export class SecretManagerService {
  private client: SecretManagerServiceClient;
  private defaultProjectId: string;

  constructor() {
    // Initialize Secret Manager client
    // Credentials come from GOOGLE_APPLICATION_CREDENTIALS env var
    this.client = new SecretManagerServiceClient();

    // Get project ID from environment or config
    this.defaultProjectId = process.env.SYNTHEX_PROJECT_ID || 'synthex-prod';
  }

  /**
   * Generate secret name from tenant ID and service
   */
  private generateSecretName(tenantId: string, service: string): string {
    // Format: {service}-{tenantId}-token
    // Example: shopify-SMB_CLIENT_001-token
    return `${service}-${tenantId}-token`;
  }

  /**
   * Get full secret path
   */
  private getSecretPath(secretName: string, projectId: string, version: string = 'latest'): string {
    return `projects/${projectId}/secrets/${secretName}/versions/${version}`;
  }

  /**
   * Store OAuth credentials in Secret Manager
   */
  async storeSecret(options: StoreSecretOptions): Promise<string> {
    const projectId = options.projectId || this.defaultProjectId;
    const secretName = this.generateSecretName(options.tenantId, options.service);

    try {
      // Convert SecretValue to JSON string
      const payload = JSON.stringify(options.value);
      const payloadBuffer = Buffer.from(payload, 'utf8');

      // Check if secret exists
      const secretPath = `projects/${projectId}/secrets/${secretName}`;
      let secretExists = false;

      try {
        await this.client.getSecret({ name: secretPath });
        secretExists = true;
      } catch (error: unknown) {
        if (error.code !== 5) {
          // Code 5 = NOT_FOUND
          throw error;
        }
      }

      if (!secretExists) {
        // Create secret if it doesn't exist
        await this.client.createSecret({
          parent: `projects/${projectId}`,
          secretId: secretName,
          secret: {
            replication: {
              automatic: {},
            },
            labels: {
              tenant_id: options.tenantId.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
              service: options.service,
              managed_by: 'synthex-cli',
            },
          },
        });
      }

      // Add new version
      const [version] = await this.client.addSecretVersion({
        parent: secretPath,
        payload: {
          data: payloadBuffer,
        },
      });

      const versionName = version.name || '';

      return versionName;
    } catch (error) {
      throw new Error(
        `Failed to store secret for ${options.service}/${options.tenantId}: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  /**
   * Retrieve OAuth credentials from Secret Manager
   */
  async retrieveSecret(options: RetrieveSecretOptions): Promise<SecretValue | null> {
    const projectId = options.projectId || this.defaultProjectId;
    const secretName = this.generateSecretName(options.tenantId, options.service);
    const version = options.version || 'latest';

    try {
      const secretPath = this.getSecretPath(secretName, projectId, version);

      const [accessResponse] = await this.client.accessSecretVersion({
        name: secretPath,
      });

      const payload = accessResponse.payload?.data;
      if (!payload) {
        return null;
      }

      // Convert buffer to string and parse JSON
      const jsonString = payload.toString('utf8');
      const secretValue = JSON.parse(jsonString) as SecretValue;

      return secretValue;
    } catch (error: unknown) {
      if (error.code === 5) {
        // NOT_FOUND
        return null;
      }

      throw new Error(
        `Failed to retrieve secret for ${options.service}/${options.tenantId}: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  /**
   * Delete secret (all versions)
   */
  async deleteSecret(options: RetrieveSecretOptions): Promise<void> {
    const projectId = options.projectId || this.defaultProjectId;
    const secretName = this.generateSecretName(options.tenantId, options.service);
    const secretPath = `projects/${projectId}/secrets/${secretName}`;

    try {
      await this.client.deleteSecret({ name: secretPath });
    } catch (error: unknown) {
      if (error.code === 5) {
        // NOT_FOUND - already deleted
        return;
      }

      throw new Error(
        `Failed to delete secret for ${options.service}/${options.tenantId}: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  /**
   * Check if secret exists
   */
  async secretExists(options: RetrieveSecretOptions): Promise<boolean> {
    const projectId = options.projectId || this.defaultProjectId;
    const secretName = this.generateSecretName(options.tenantId, options.service);
    const secretPath = `projects/${projectId}/secrets/${secretName}`;

    try {
      await this.client.getSecret({ name: secretPath });
      return true;
    } catch (error: unknown) {
      if (error.code === 5) {
        // NOT_FOUND
        return false;
      }

      throw error;
    }
  }

  /**
   * List all secrets for a tenant
   */
  async listSecretsForTenant(tenantId: string, projectId?: string): Promise<string[]> {
    const pid = projectId || this.defaultProjectId;
    const parent = `projects/${pid}`;

    try {
      const [secrets] = await this.client.listSecrets({
        parent,
        filter: `labels.tenant_id=${tenantId.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`,
      });

      return secrets.map((secret) => secret.name || '').filter(Boolean);
    } catch (error) {
      throw new Error(
        `Failed to list secrets for tenant ${tenantId}: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(secretValue: SecretValue): boolean {
    const expiresAt = new Date(secretValue.expires_at);
    return expiresAt < new Date();
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  getTimeUntilExpiry(secretValue: SecretValue): number {
    const expiresAt = new Date(secretValue.expires_at);
    return expiresAt.getTime() - Date.now();
  }

  /**
   * Check if token needs refresh (expires in < 1 hour)
   */
  needsRefresh(secretValue: SecretValue): boolean {
    const timeUntilExpiry = this.getTimeUntilExpiry(secretValue);
    return timeUntilExpiry < 3600000; // 1 hour in ms
  }

  /**
   * Validate Secret Manager credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      // Try to list secrets (will fail if credentials are invalid)
      const projectId = this.defaultProjectId;
      await this.client.listSecrets({
        parent: `projects/${projectId}`,
        pageSize: 1, // Just need to verify access
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get project ID
   */
  getProjectId(): string {
    return this.defaultProjectId;
  }
}

// Singleton instance
export const secretManager = new SecretManagerService();
