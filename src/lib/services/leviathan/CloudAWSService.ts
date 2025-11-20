/**
 * CloudAWSService - AWS S3 Static Site Deployment
 * Phase 13 Week 3-4: Quad-cloud deployment engine
 *
 * Handles:
 * - S3 bucket creation/configuration
 * - Static file uploads (HTML, OG images, schemas)
 * - CloudFront CDN distribution
 * - Public URL generation
 */

import { S3Client, PutObjectCommand, CreateBucketCommand, PutBucketWebsiteCommand, PutBucketPolicyCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateDistributionCommand, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import * as crypto from 'crypto';

export interface AWSDeploymentConfig {
  region?: string;
  bucketPrefix?: string;
  enableCDN?: boolean;
  customDomain?: string;
}

export interface DeploymentAsset {
  filename: string;
  content: string | Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface AWSDeploymentResult {
  success: boolean;
  bucketName: string;
  region: string;
  assets: {
    filename: string;
    s3Key: string;
    publicUrl: string;
    cdnUrl?: string;
    size: number;
    contentHash: string;
  }[];
  websiteUrl: string;
  cdnDistributionId?: string;
  cdnDomain?: string;
  error?: string;
}

export class CloudAWSService {
  private s3Client: S3Client;
  private cloudFrontClient: CloudFrontClient;
  private region: string;
  private bucketPrefix: string;

  constructor(config?: AWSDeploymentConfig) {
    this.region = config?.region || process.env.AWS_REGION || 'us-east-1';
    this.bucketPrefix = config?.bucketPrefix || 'leviathan-deploy';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    this.cloudFrontClient = new CloudFrontClient({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Deploy assets to S3 with static website hosting
   */
  async deploy(
    deploymentId: string,
    assets: DeploymentAsset[],
    config?: AWSDeploymentConfig
  ): Promise<AWSDeploymentResult> {
    const bucketName = this.generateBucketName(deploymentId);
    const uploadedAssets: AWSDeploymentResult['assets'] = [];

    try {
      // Check if bucket exists or create it
      await this.ensureBucket(bucketName);

      // Configure static website hosting
      await this.configureWebsiteHosting(bucketName);

      // Set bucket policy for public read access
      await this.setBucketPolicy(bucketName);

      // Upload all assets
      for (const asset of assets) {
        const result = await this.uploadAsset(bucketName, asset);
        uploadedAssets.push(result);
      }

      // Optionally create CloudFront distribution
      let cdnResult: { distributionId: string; domain: string } | undefined;
      if (config?.enableCDN) {
        cdnResult = await this.createCDNDistribution(bucketName);

        // Update asset URLs with CDN domain
        for (const asset of uploadedAssets) {
          asset.cdnUrl = `https://${cdnResult.domain}/${asset.s3Key}`;
        }
      }

      const websiteUrl = `http://${bucketName}.s3-website-${this.region}.amazonaws.com`;

      return {
        success: true,
        bucketName,
        region: this.region,
        assets: uploadedAssets,
        websiteUrl,
        cdnDistributionId: cdnResult?.distributionId,
        cdnDomain: cdnResult?.domain,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown AWS deployment error';
      console.error('AWS deployment failed:', errorMessage);

      return {
        success: false,
        bucketName,
        region: this.region,
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

    // S3 bucket names must be lowercase, 3-63 chars, no underscores
    return `${this.bucketPrefix}-${hash}`.toLowerCase().replace(/_/g, '-');
  }

  /**
   * Ensure bucket exists, create if not
   */
  private async ensureBucket(bucketName: string): Promise<void> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch {
      // Bucket doesn't exist, create it
      const createParams: any = {
        Bucket: bucketName,
      };

      // LocationConstraint required for non-us-east-1 regions
      if (this.region !== 'us-east-1') {
        createParams.CreateBucketConfiguration = {
          LocationConstraint: this.region,
        };
      }

      await this.s3Client.send(new CreateBucketCommand(createParams));
    }
  }

  /**
   * Configure S3 bucket for static website hosting
   */
  private async configureWebsiteHosting(bucketName: string): Promise<void> {
    await this.s3Client.send(
      new PutBucketWebsiteCommand({
        Bucket: bucketName,
        WebsiteConfiguration: {
          IndexDocument: { Suffix: 'index.html' },
          ErrorDocument: { Key: 'error.html' },
        },
      })
    );
  }

  /**
   * Set bucket policy for public read access
   */
  private async setBucketPolicy(bucketName: string): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucketName}/*`,
        },
      ],
    };

    await this.s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(policy),
      })
    );
  }

  /**
   * Upload a single asset to S3
   */
  private async uploadAsset(
    bucketName: string,
    asset: DeploymentAsset
  ): Promise<AWSDeploymentResult['assets'][0]> {
    const content = typeof asset.content === 'string'
      ? Buffer.from(asset.content)
      : asset.content;

    const contentHash = crypto
      .createHash('md5')
      .update(content)
      .digest('hex');

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: asset.filename,
        Body: content,
        ContentType: asset.contentType,
        Metadata: asset.metadata,
        CacheControl: 'public, max-age=31536000',
      })
    );

    const publicUrl = `http://${bucketName}.s3-website-${this.region}.amazonaws.com/${asset.filename}`;

    return {
      filename: asset.filename,
      s3Key: asset.filename,
      publicUrl,
      size: content.length,
      contentHash,
    };
  }

  /**
   * Create CloudFront distribution for the S3 bucket
   */
  private async createCDNDistribution(
    bucketName: string
  ): Promise<{ distributionId: string; domain: string }> {
    const callerReference = `${bucketName}-${Date.now()}`;

    const result = await this.cloudFrontClient.send(
      new CreateDistributionCommand({
        DistributionConfig: {
          CallerReference: callerReference,
          Comment: `Leviathan deployment: ${bucketName}`,
          DefaultCacheBehavior: {
            TargetOriginId: bucketName,
            ViewerProtocolPolicy: 'redirect-to-https',
            AllowedMethods: {
              Quantity: 2,
              Items: ['GET', 'HEAD'],
            },
            CachedMethods: {
              Quantity: 2,
              Items: ['GET', 'HEAD'],
            },
            ForwardedValues: {
              QueryString: false,
              Cookies: { Forward: 'none' },
            },
            MinTTL: 0,
            DefaultTTL: 86400,
            MaxTTL: 31536000,
            Compress: true,
          },
          Origins: {
            Quantity: 1,
            Items: [
              {
                Id: bucketName,
                DomainName: `${bucketName}.s3-website-${this.region}.amazonaws.com`,
                CustomOriginConfig: {
                  HTTPPort: 80,
                  HTTPSPort: 443,
                  OriginProtocolPolicy: 'http-only',
                },
              },
            ],
          },
          Enabled: true,
          PriceClass: 'PriceClass_100', // US, Canada, Europe only for cost savings
        },
      })
    );

    return {
      distributionId: result.Distribution?.Id || '',
      domain: result.Distribution?.DomainName || '',
    };
  }

  /**
   * Invalidate CloudFront cache
   */
  async invalidateCache(distributionId: string, paths: string[] = ['/*']): Promise<void> {
    await this.cloudFrontClient.send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: Date.now().toString(),
          Paths: {
            Quantity: paths.length,
            Items: paths,
          },
        },
      })
    );
  }

  /**
   * Get the provider name
   */
  getProviderName(): string {
    return 'aws';
  }
}

export default CloudAWSService;
