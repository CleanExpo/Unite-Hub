/**
 * CloudGCSService - Google Cloud Storage Static Site Deployment
 * Phase 13 Week 3-4: Quad-cloud deployment engine
 *
 * Handles:
 * - GCS bucket creation/configuration
 * - Static file uploads
 * - Public access configuration
 * - Cloud CDN integration
 */

import { Storage, Bucket } from '@google-cloud/storage';
import * as crypto from 'crypto';

export interface GCSDeploymentConfig {
  projectId?: string;
  location?: string;
  bucketPrefix?: string;
  enableCDN?: boolean;
}

export interface DeploymentAsset {
  filename: string;
  content: string | Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface GCSDeploymentResult {
  success: boolean;
  bucketName: string;
  location: string;
  assets: {
    filename: string;
    gcsPath: string;
    publicUrl: string;
    size: number;
    contentHash: string;
  }[];
  websiteUrl: string;
  error?: string;
}

export class CloudGCSService {
  private storage: Storage;
  private projectId: string;
  private location: string;
  private bucketPrefix: string;

  constructor(config?: GCSDeploymentConfig) {
    this.projectId = config?.projectId || process.env.GCP_PROJECT_ID || '';
    this.location = config?.location || process.env.GCS_LOCATION || 'US';
    this.bucketPrefix = config?.bucketPrefix || 'leviathan-deploy';

    // Initialize with credentials from environment or service account
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? undefined // Will use ADC
      : {
          client_email: process.env.GCP_CLIENT_EMAIL,
          private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

    this.storage = new Storage({
      projectId: this.projectId,
      credentials,
    });
  }

  /**
   * Deploy assets to GCS with static website hosting
   */
  async deploy(
    deploymentId: string,
    assets: DeploymentAsset[],
    config?: GCSDeploymentConfig
  ): Promise<GCSDeploymentResult> {
    const bucketName = this.generateBucketName(deploymentId);
    const uploadedAssets: GCSDeploymentResult['assets'] = [];

    try {
      // Ensure bucket exists with website configuration
      const bucket = await this.ensureBucket(bucketName);

      // Make bucket publicly accessible
      await this.makePublic(bucket);

      // Upload all assets
      for (const asset of assets) {
        const result = await this.uploadAsset(bucket, asset);
        uploadedAssets.push(result);
      }

      // GCS website URL format
      const websiteUrl = `https://storage.googleapis.com/${bucketName}/index.html`;

      return {
        success: true,
        bucketName,
        location: this.location,
        assets: uploadedAssets,
        websiteUrl,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown GCS deployment error';
      console.error('GCS deployment failed:', errorMessage);

      return {
        success: false,
        bucketName,
        location: this.location,
        assets: uploadedAssets,
        websiteUrl: '',
        error: errorMessage,
      };
    }
  }

  /**
   * Generate unique bucket name from deployment ID
   */
  private generateBucketName(deploymentId: string): string {
    const hash = crypto
      .createHash('md5')
      .update(deploymentId)
      .digest('hex')
      .substring(0, 8);

    // GCS bucket names: lowercase, 3-63 chars, no underscores
    return `${this.bucketPrefix}-${hash}`.toLowerCase().replace(/_/g, '-');
  }

  /**
   * Ensure bucket exists with proper configuration
   */
  private async ensureBucket(bucketName: string): Promise<Bucket> {
    const bucket = this.storage.bucket(bucketName);
    const [exists] = await bucket.exists();

    if (!exists) {
      await this.storage.createBucket(bucketName, {
        location: this.location,
        storageClass: 'STANDARD',
        iamConfiguration: {
          uniformBucketLevelAccess: {
            enabled: true,
          },
        },
      });

      // Set website configuration
      await bucket.setMetadata({
        website: {
          mainPageSuffix: 'index.html',
          notFoundPage: 'error.html',
        },
      });
    }

    return bucket;
  }

  /**
   * Make bucket publicly accessible
   */
  private async makePublic(bucket: Bucket): Promise<void> {
    await bucket.iam.setPolicy({
      bindings: [
        {
          role: 'roles/storage.objectViewer',
          members: ['allUsers'],
        },
      ],
    });
  }

  /**
   * Upload a single asset to GCS
   */
  private async uploadAsset(
    bucket: Bucket,
    asset: DeploymentAsset
  ): Promise<GCSDeploymentResult['assets'][0]> {
    const content = typeof asset.content === 'string'
      ? Buffer.from(asset.content)
      : asset.content;

    const contentHash = crypto
      .createHash('md5')
      .update(content)
      .digest('hex');

    const file = bucket.file(asset.filename);

    await file.save(content, {
      contentType: asset.contentType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
        ...asset.metadata,
      },
      resumable: false,
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${asset.filename}`;

    return {
      filename: asset.filename,
      gcsPath: `gs://${bucket.name}/${asset.filename}`,
      publicUrl,
      size: content.length,
      contentHash,
    };
  }

  /**
   * Delete all objects in a bucket
   */
  async clearBucket(bucketName: string): Promise<void> {
    const bucket = this.storage.bucket(bucketName);
    await bucket.deleteFiles({ force: true });
  }

  /**
   * Get the provider name
   */
  getProviderName(): string {
    return 'gcs';
  }
}

export default CloudGCSService;
