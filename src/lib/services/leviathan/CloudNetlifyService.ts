/**
 * CloudNetlifyService - Netlify API Direct Deployment
 * Phase 13 Week 3-4: Quad-cloud deployment engine
 *
 * Handles:
 * - Netlify site creation
 * - Direct file deployment via API
 * - Automatic HTTPS and CDN
 * - Deploy preview URLs
 */

import * as crypto from 'crypto';

export interface NetlifyDeploymentConfig {
  teamSlug?: string;
  siteNamePrefix?: string;
  customDomain?: string;
}

export interface DeploymentAsset {
  filename: string;
  content: string | Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface NetlifyDeploymentResult {
  success: boolean;
  siteId: string;
  siteName: string;
  deployId: string;
  assets: {
    filename: string;
    path: string;
    publicUrl: string;
    size: number;
    contentHash: string;
  }[];
  deployUrl: string;
  siteUrl: string;
  adminUrl: string;
  error?: string;
}

export class CloudNetlifyService {
  private apiToken: string;
  private apiBase: string = 'https://api.netlify.com/api/v1';
  private siteNamePrefix: string;

  constructor(config?: NetlifyDeploymentConfig) {
    this.apiToken = process.env.NETLIFY_AUTH_TOKEN || '';
    this.siteNamePrefix = config?.siteNamePrefix || 'leviathan';
  }

  /**
   * Deploy assets to Netlify
   */
  async deploy(
    deploymentId: string,
    assets: DeploymentAsset[],
    config?: NetlifyDeploymentConfig
  ): Promise<NetlifyDeploymentResult> {
    const siteName = this.generateSiteName(deploymentId);
    const uploadedAssets: NetlifyDeploymentResult['assets'] = [];

    try {
      // Create or get site
      const site = await this.ensureSite(siteName);

      // Prepare file digests for deployment
      const files: Record<string, string> = {};
      const fileContents: Map<string, Buffer> = new Map();

      for (const asset of assets) {
        const content = typeof asset.content === 'string'
          ? Buffer.from(asset.content)
          : asset.content;

        const sha1 = crypto.createHash('sha1').update(content).digest('hex');
        const path = `/${asset.filename}`;

        files[path] = sha1;
        fileContents.set(sha1, content);

        uploadedAssets.push({
          filename: asset.filename,
          path,
          publicUrl: '', // Will be updated after deploy
          size: content.length,
          contentHash: sha1,
        });
      }

      // Create deploy
      const deploy = await this.createDeploy(site.id, files);

      // Upload required files
      for (const sha1 of deploy.required || []) {
        const content = fileContents.get(sha1);
        if (content) {
          await this.uploadFile(deploy.id, sha1, content);
        }
      }

      // Update asset URLs
      for (const asset of uploadedAssets) {
        asset.publicUrl = `${deploy.ssl_url}${asset.path}`;
      }

      return {
        success: true,
        siteId: site.id,
        siteName: site.name,
        deployId: deploy.id,
        assets: uploadedAssets,
        deployUrl: deploy.deploy_ssl_url || deploy.deploy_url,
        siteUrl: deploy.ssl_url || deploy.url,
        adminUrl: site.admin_url,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Netlify deployment error';
      console.error('Netlify deployment failed:', errorMessage);

      return {
        success: false,
        siteId: '',
        siteName,
        deployId: '',
        assets: uploadedAssets,
        deployUrl: '',
        siteUrl: '',
        adminUrl: '',
        error: errorMessage,
      };
    }
  }

  /**
   * Generate unique site name from deployment ID
   */
  private generateSiteName(deploymentId: string): string {
    const hash = crypto
      .createHash('md5')
      .update(deploymentId)
      .digest('hex')
      .substring(0, 8);

    // Netlify site names: lowercase, alphanumeric and hyphens
    return `${this.siteNamePrefix}-${hash}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  /**
   * Ensure site exists, create if not
   */
  private async ensureSite(siteName: string): Promise<{
    id: string;
    name: string;
    admin_url: string;
  }> {
    // First try to get existing site
    try {
      const response = await fetch(`${this.apiBase}/sites/${siteName}.netlify.app`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Site doesn't exist, create it
    }

    // Create new site
    const response = await fetch(`${this.apiBase}/sites`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: siteName,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create Netlify site: ${error}`);
    }

    return await response.json();
  }

  /**
   * Create a new deploy with file manifest
   */
  private async createDeploy(
    siteId: string,
    files: Record<string, string>
  ): Promise<{
    id: string;
    required: string[];
    url: string;
    ssl_url: string;
    deploy_url: string;
    deploy_ssl_url: string;
  }> {
    const response = await fetch(`${this.apiBase}/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files,
        async: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create Netlify deploy: ${error}`);
    }

    return await response.json();
  }

  /**
   * Upload a single file to a deploy
   */
  private async uploadFile(
    deployId: string,
    sha1: string,
    content: Buffer
  ): Promise<void> {
    const response = await fetch(`${this.apiBase}/deploys/${deployId}/files/${sha1}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: content,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload file to Netlify: ${error}`);
    }
  }

  /**
   * Get deploy status
   */
  async getDeployStatus(deployId: string): Promise<{
    state: string;
    error_message?: string;
  }> {
    const response = await fetch(`${this.apiBase}/deploys/${deployId}`, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get deploy status');
    }

    const deploy = await response.json();
    return {
      state: deploy.state,
      error_message: deploy.error_message,
    };
  }

  /**
   * Get the provider name
   */
  getProviderName(): string {
    return 'netlify';
  }
}

export default CloudNetlifyService;
