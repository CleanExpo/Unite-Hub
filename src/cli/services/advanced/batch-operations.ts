/**
 * Batch Operations Service
 *
 * Handles bulk operations on multiple tenants:
 * - Bulk tenant creation from CSV/JSON
 * - Bulk tenant updates
 * - Bulk tenant deletion
 * - Bulk credential cleanup
 * - Progress tracking and rollback
 * - Dry-run mode for validation
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import { ConfigManager } from '../../utils/config-manager.js';
import { TenantManager, type Tenant, type CreateTenantInput, type UpdateTenantInput } from '../tenant/tenant-manager.js';
import { CredentialManager } from '../tenant/credential-manager.js';

export interface BatchOperationResult<T> {
  successful: T[];
  failed: Array<{ item: any; error: string }>;
  total: number;
  successCount: number;
  failureCount: number;
  duration: number;
  dryRun: boolean;
}

export interface CSVTenantRow {
  tenantId: string;
  name: string;
  type: 'shopify' | 'google-merchant' | 'mixed';
  market?: string;
  region?: string;
  shopifyShop?: string;
  gmcMerchantId?: string;
  industry?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface BatchProgressCallback {
  (current: number, total: number, item: any, status: 'success' | 'failure'): void;
}

export class BatchOperationsService {
  private supabase: any;
  private configManager: ConfigManager;
  private tenantManager: TenantManager;
  private credentialManager: CredentialManager;
  private workspaceId: string;

  constructor() {
    this.configManager = new ConfigManager();

    const config = this.configManager.loadConfig();
    if (!config) {
      throw new Error('Synthex not initialized. Run: synthex init');
    }

    this.workspaceId = config.workspace_id;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      throw new Error('Supabase credentials not configured');
    }

    this.tenantManager = new TenantManager();
    this.credentialManager = new CredentialManager();
  }

  /**
   * Create multiple tenants from CSV file
   */
  async createTenantsFromCSV(
    filePath: string,
    dryRun: boolean = false,
    onProgress?: BatchProgressCallback
  ): Promise<BatchOperationResult<Tenant>> {
    const startTime = Date.now();

    // Read and parse CSV file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CSVTenantRow[];

    const successful: Tenant[] = [];
    const failed: Array<{ item: CSVTenantRow; error: string }> = [];

    // Process each row
    for (let i = 0; i < records.length; i++) {
      const row = records[i];

      try {
        // Validate required fields
        if (!row.tenantId || !row.name || !row.type) {
          throw new Error('Missing required fields: tenantId, name, type');
        }

        // Validate type
        if (!['shopify', 'google-merchant', 'mixed'].includes(row.type)) {
          throw new Error(`Invalid type: ${row.type}`);
        }

        // Build create input
        const input: CreateTenantInput = {
          tenantId: row.tenantId,
          name: row.name,
          type: row.type,
          market: row.market,
          region: row.region,
          metadata: {
            shopifyShop: row.shopifyShop,
            gmcMerchantId: row.gmcMerchantId,
            industry: row.industry,
            website: row.website,
            contactEmail: row.contactEmail,
            contactPhone: row.contactPhone,
          },
        };

        if (dryRun) {
          // Dry run: validate without creating
          // Check if tenant ID already exists
          const existing = await this.tenantManager.getTenant(row.tenantId);
          if (existing) {
            throw new Error(`Tenant with ID "${row.tenantId}" already exists`);
          }

          // Simulate successful creation
          successful.push({
            id: 'dry-run-id',
            workspaceId: this.workspaceId,
            ...input,
            status: 'active',
            metadata: input.metadata || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Tenant);
        } else {
          // Actually create tenant
          const tenant = await this.tenantManager.createTenant(input);
          successful.push(tenant);
        }

        if (onProgress) {
          onProgress(i + 1, records.length, row, 'success');
        }
      } catch (error: unknown) {
        failed.push({
          item: row,
          error: error.message || 'Unknown error',
        });

        if (onProgress) {
          onProgress(i + 1, records.length, row, 'failure');
        }
      }
    }

    const duration = Date.now() - startTime;

    return {
      successful,
      failed,
      total: records.length,
      successCount: successful.length,
      failureCount: failed.length,
      duration,
      dryRun,
    };
  }

  /**
   * Create multiple tenants from JSON array
   */
  async createTenantsFromJSON(
    filePath: string,
    dryRun: boolean = false,
    onProgress?: BatchProgressCallback
  ): Promise<BatchOperationResult<Tenant>> {
    const startTime = Date.now();

    // Read and parse JSON file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = JSON.parse(fileContent) as CreateTenantInput[];

    const successful: Tenant[] = [];
    const failed: Array<{ item: CreateTenantInput; error: string }> = [];

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const input = records[i];

      try {
        if (dryRun) {
          // Dry run: validate without creating
          const existing = await this.tenantManager.getTenant(input.tenantId);
          if (existing) {
            throw new Error(`Tenant with ID "${input.tenantId}" already exists`);
          }

          successful.push({
            id: 'dry-run-id',
            workspaceId: this.workspaceId,
            ...input,
            status: 'active',
            metadata: input.metadata || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Tenant);
        } else {
          const tenant = await this.tenantManager.createTenant(input);
          successful.push(tenant);
        }

        if (onProgress) {
          onProgress(i + 1, records.length, input, 'success');
        }
      } catch (error: unknown) {
        failed.push({
          item: input,
          error: error.message || 'Unknown error',
        });

        if (onProgress) {
          onProgress(i + 1, records.length, input, 'failure');
        }
      }
    }

    const duration = Date.now() - startTime;

    return {
      successful,
      failed,
      total: records.length,
      successCount: successful.length,
      failureCount: failed.length,
      duration,
      dryRun,
    };
  }

  /**
   * Update multiple tenants in bulk
   */
  async updateTenantsBulk(
    tenantIds: string[],
    updates: UpdateTenantInput,
    dryRun: boolean = false,
    onProgress?: BatchProgressCallback
  ): Promise<BatchOperationResult<Tenant>> {
    const startTime = Date.now();

    const successful: Tenant[] = [];
    const failed: Array<{ item: string; error: string }> = [];

    for (let i = 0; i < tenantIds.length; i++) {
      const tenantId = tenantIds[i];

      try {
        if (dryRun) {
          // Dry run: verify tenant exists
          const tenant = await this.tenantManager.getTenant(tenantId);
          if (!tenant) {
            throw new Error(`Tenant "${tenantId}" not found`);
          }

          successful.push({
            ...tenant,
            ...updates,
            updatedAt: new Date().toISOString(),
          });
        } else {
          const tenant = await this.tenantManager.updateTenant(tenantId, updates);
          successful.push(tenant);
        }

        if (onProgress) {
          onProgress(i + 1, tenantIds.length, tenantId, 'success');
        }
      } catch (error: unknown) {
        failed.push({
          item: tenantId,
          error: error.message || 'Unknown error',
        });

        if (onProgress) {
          onProgress(i + 1, tenantIds.length, tenantId, 'failure');
        }
      }
    }

    const duration = Date.now() - startTime;

    return {
      successful,
      failed,
      total: tenantIds.length,
      successCount: successful.length,
      failureCount: failed.length,
      duration,
      dryRun,
    };
  }

  /**
   * Delete multiple tenants in bulk
   */
  async deleteTenantsBulk(
    tenantIds: string[],
    permanent: boolean = false,
    dryRun: boolean = false,
    onProgress?: BatchProgressCallback
  ): Promise<BatchOperationResult<string>> {
    const startTime = Date.now();

    const successful: string[] = [];
    const failed: Array<{ item: string; error: string }> = [];

    for (let i = 0; i < tenantIds.length; i++) {
      const tenantId = tenantIds[i];

      try {
        if (dryRun) {
          // Dry run: verify tenant exists
          const tenant = await this.tenantManager.getTenant(tenantId);
          if (!tenant) {
            throw new Error(`Tenant "${tenantId}" not found`);
          }

          successful.push(tenantId);
        } else {
          await this.tenantManager.deleteTenant(tenantId, permanent);
          successful.push(tenantId);
        }

        if (onProgress) {
          onProgress(i + 1, tenantIds.length, tenantId, 'success');
        }
      } catch (error: unknown) {
        failed.push({
          item: tenantId,
          error: error.message || 'Unknown error',
        });

        if (onProgress) {
          onProgress(i + 1, tenantIds.length, tenantId, 'failure');
        }
      }
    }

    const duration = Date.now() - startTime;

    return {
      successful,
      failed,
      total: tenantIds.length,
      successCount: successful.length,
      failureCount: failed.length,
      duration,
      dryRun,
    };
  }

  /**
   * Cleanup expired credentials across multiple workspaces
   */
  async cleanupExpiredCredentialsBulk(
    workspaceIds: string[],
    dryRun: boolean = false,
    onProgress?: BatchProgressCallback
  ): Promise<BatchOperationResult<{ workspaceId: string; deleted: number }>> {
    const startTime = Date.now();

    const successful: Array<{ workspaceId: string; deleted: number }> = [];
    const failed: Array<{ item: string; error: string }> = [];

    for (let i = 0; i < workspaceIds.length; i++) {
      const workspaceId = workspaceIds[i];

      try {
        if (dryRun) {
          // Dry run: count expired credentials without deleting
          const expiredCreds = await this.credentialManager.getExpiredCredentials(workspaceId);

          successful.push({
            workspaceId,
            deleted: expiredCreds.length,
          });
        } else {
          const result = await this.credentialManager.cleanupExpiredCredentials(workspaceId);

          successful.push({
            workspaceId,
            deleted: result.deleted,
          });
        }

        if (onProgress) {
          onProgress(i + 1, workspaceIds.length, workspaceId, 'success');
        }
      } catch (error: unknown) {
        failed.push({
          item: workspaceId,
          error: error.message || 'Unknown error',
        });

        if (onProgress) {
          onProgress(i + 1, workspaceIds.length, workspaceId, 'failure');
        }
      }
    }

    const duration = Date.now() - startTime;

    return {
      successful,
      failed,
      total: workspaceIds.length,
      successCount: successful.length,
      failureCount: failed.length,
      duration,
      dryRun,
    };
  }

  /**
   * Export tenants to CSV
   */
  async exportTenantsToCSV(outputPath: string): Promise<number> {
    const tenants = await this.tenantManager.listTenants();

    const csvRows: string[] = [];

    // Header
    csvRows.push(
      'tenantId,name,type,market,region,status,shopifyShop,gmcMerchantId,industry,website,contactEmail,contactPhone,createdAt,updatedAt'
    );

    // Data rows
    for (const tenant of tenants) {
      const row = [
        tenant.tenantId,
        `"${tenant.name}"`,
        tenant.type,
        tenant.market,
        tenant.region,
        tenant.status,
        tenant.metadata.shopifyShop || '',
        tenant.metadata.gmcMerchantId || '',
        tenant.metadata.industry || '',
        tenant.metadata.website || '',
        tenant.metadata.contactEmail || '',
        tenant.metadata.contactPhone || '',
        tenant.createdAt,
        tenant.updatedAt,
      ];

      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    fs.writeFileSync(outputPath, csvContent, 'utf-8');

    return tenants.length;
  }

  /**
   * Export tenants to JSON
   */
  async exportTenantsToJSON(outputPath: string, pretty: boolean = true): Promise<number> {
    const tenants = await this.tenantManager.listTenants();

    const jsonContent = pretty
      ? JSON.stringify(tenants, null, 2)
      : JSON.stringify(tenants);

    fs.writeFileSync(outputPath, jsonContent, 'utf-8');

    return tenants.length;
  }
}
