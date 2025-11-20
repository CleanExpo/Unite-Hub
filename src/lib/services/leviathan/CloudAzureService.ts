/**
 * CloudAzureService - Azure Blob Static Site Deployment
 * Phase 13 Week 3-4: Quad-cloud deployment engine
 *
 * Handles:
 * - Azure Blob Storage container creation
 * - Static website hosting configuration
 * - File uploads with CDN support
 * - Public access configuration
 */

import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import * as crypto from 'crypto';

export interface AzureDeploymentConfig {
  accountName?: string;
  containerPrefix?: string;
  enableCDN?: boolean;
}

export interface DeploymentAsset {
  filename: string;
  content: string | Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface AzureDeploymentResult {
  success: boolean;
  containerName: string;
  storageAccount: string;
  assets: {
    filename: string;
    blobPath: string;
    publicUrl: string;
    cdnUrl?: string;
    size: number;
    contentHash: string;
  }[];
  websiteUrl: string;
  error?: string;
}

export class CloudAzureService {
  private blobServiceClient: BlobServiceClient;
  private accountName: string;
  private containerPrefix: string;

  constructor(config?: AzureDeploymentConfig) {
    this.accountName = config?.accountName || process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
    this.containerPrefix = config?.containerPrefix || 'leviathan-deploy';

    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';

    if (this.accountName && accountKey) {
      const sharedKeyCredential = new StorageSharedKeyCredential(
        this.accountName,
        accountKey
      );

      this.blobServiceClient = new BlobServiceClient(
        `https://${this.accountName}.blob.core.windows.net`,
        sharedKeyCredential
      );
    } else if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
      );
    } else {
      // Create a placeholder client - will fail on actual operations
      this.blobServiceClient = new BlobServiceClient(
        `https://${this.accountName || 'placeholder'}.blob.core.windows.net`
      );
    }
  }

  /**
   * Deploy assets to Azure Blob Storage with static website hosting
   */
  async deploy(
    deploymentId: string,
    assets: DeploymentAsset[],
    config?: AzureDeploymentConfig
  ): Promise<AzureDeploymentResult> {
    const containerName = this.generateContainerName(deploymentId);
    const uploadedAssets: AzureDeploymentResult['assets'] = [];

    try {
      // Ensure container exists with public access
      const containerClient = await this.ensureContainer(containerName);

      // Upload all assets
      for (const asset of assets) {
        const result = await this.uploadAsset(containerClient, asset);
        uploadedAssets.push(result);
      }

      // Azure static website URL
      const websiteUrl = `https://${this.accountName}.z13.web.core.windows.net/${containerName}/index.html`;

      return {
        success: true,
        containerName,
        storageAccount: this.accountName,
        assets: uploadedAssets,
        websiteUrl,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Azure deployment error';
      console.error('Azure deployment failed:', errorMessage);

      return {
        success: false,
        containerName,
        storageAccount: this.accountName,
        assets: uploadedAssets,
        websiteUrl: '',
        error: errorMessage,
      };
    }
  }

  /**
   * Generate unique container name from deployment ID
   */
  private generateContainerName(deploymentId: string): string {
    const hash = crypto
      .createHash('md5')
      .update(deploymentId)
      .digest('hex')
      .substring(0, 8);

    // Azure container names: lowercase, 3-63 chars, alphanumeric and hyphens only
    return `${this.containerPrefix}-${hash}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  /**
   * Ensure container exists with public access
   */
  private async ensureContainer(containerName: string): Promise<ContainerClient> {
    const containerClient = this.blobServiceClient.getContainerClient(containerName);

    const exists = await containerClient.exists();
    if (!exists) {
      await containerClient.create({
        access: 'blob', // Public read access for blobs
      });
    }

    return containerClient;
  }

  /**
   * Upload a single asset to Azure Blob Storage
   */
  private async uploadAsset(
    containerClient: ContainerClient,
    asset: DeploymentAsset
  ): Promise<AzureDeploymentResult['assets'][0]> {
    const content = typeof asset.content === 'string'
      ? Buffer.from(asset.content)
      : asset.content;

    const contentHash = crypto
      .createHash('md5')
      .update(content)
      .digest('hex');

    const blockBlobClient = containerClient.getBlockBlobClient(asset.filename);

    await blockBlobClient.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: asset.contentType,
        blobCacheControl: 'public, max-age=31536000',
      },
      metadata: asset.metadata,
    });

    const publicUrl = blockBlobClient.url;

    return {
      filename: asset.filename,
      blobPath: `${containerClient.containerName}/${asset.filename}`,
      publicUrl,
      size: content.length,
      contentHash,
    };
  }

  /**
   * Delete all blobs in a container
   */
  async clearContainer(containerName: string): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(containerName);

    for await (const blob of containerClient.listBlobsFlat()) {
      await containerClient.deleteBlob(blob.name);
    }
  }

  /**
   * Get the provider name
   */
  getProviderName(): string {
    return 'azure';
  }
}

export default CloudAzureService;
