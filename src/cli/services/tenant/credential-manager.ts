/**
 * Credential Lifecycle Manager
 *
 * Manages credential lifecycle for tenants:
 * - Credential expiry monitoring
 * - Renewal reminders
 * - Cleanup expired credentials
 * - Credential health checks
 */

import { createClient } from '@supabase/supabase-js';
import { SecretManagerService } from '../secrets/secret-manager.js';

export interface CredentialInfo {
  id: string;
  service: string;
  tenantId: string;
  workspaceId: string;
  expiresAt: string | null;
  createdAt: string;
  status: 'active' | 'expiring_soon' | 'expired';
  daysUntilExpiry?: number;
}

export interface CredentialHealthReport {
  totalCredentials: number;
  activeCredentials: number;
  expiringSoonCredentials: number; // <7 days
  expiredCredentials: number;
  byService: Record<string, { total: number; active: number; expired: number }>;
  recommendations: string[];
}

export class CredentialManager {
  private supabase: any;
  private secretManager: SecretManagerService;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      throw new Error('Supabase credentials not configured');
    }

    this.secretManager = new SecretManagerService();
  }

  /**
   * Get all credentials for a tenant
   */
  async getTenantCredentials(workspaceId: string, tenantId: string): Promise<CredentialInfo[]> {
    const { data, error } = await this.supabase
      .from('credential_registry')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch credentials: ${error.message}`);
    }

    return (data || []).map((cred: any) => this.mapCredential(cred));
  }

  /**
   * Get all credentials for a workspace
   */
  async getWorkspaceCredentials(workspaceId: string): Promise<CredentialInfo[]> {
    const { data, error } = await this.supabase
      .from('credential_registry')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch credentials: ${error.message}`);
    }

    return (data || []).map((cred: any) => this.mapCredential(cred));
  }

  /**
   * Get credentials expiring soon (<7 days)
   */
  async getExpiringSoonCredentials(workspaceId: string): Promise<CredentialInfo[]> {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data, error } = await this.supabase
      .from('credential_registry')
      .select('*')
      .eq('workspace_id', workspaceId)
      .lte('expires_at', sevenDaysFromNow.toISOString())
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch expiring credentials: ${error.message}`);
    }

    return (data || []).map((cred: any) => this.mapCredential(cred));
  }

  /**
   * Get expired credentials
   */
  async getExpiredCredentials(workspaceId: string): Promise<CredentialInfo[]> {
    const { data, error } = await this.supabase
      .from('credential_registry')
      .select('*')
      .eq('workspace_id', workspaceId)
      .lt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch expired credentials: ${error.message}`);
    }

    return (data || []).map((cred: any) => this.mapCredential(cred));
  }

  /**
   * Delete expired credentials
   */
  async cleanupExpiredCredentials(workspaceId: string): Promise<{
    deleted: number;
    credentials: CredentialInfo[];
  }> {
    const expiredCreds = await this.getExpiredCredentials(workspaceId);

    if (expiredCreds.length === 0) {
      return { deleted: 0, credentials: [] };
    }

    // Delete from Secret Manager
    for (const cred of expiredCreds) {
      try {
        await this.secretManager.deleteSecret({
          service: cred.service,
          tenantId: cred.tenantId,
        });
      } catch (error) {
        // Continue even if delete fails
        console.error(`Failed to delete secret for ${cred.service}:${cred.tenantId}:`, error);
      }
    }

    // Delete from database
    const { error } = await this.supabase
      .from('credential_registry')
      .delete()
      .eq('workspace_id', workspaceId)
      .lt('expires_at', new Date().toISOString());

    if (error) {
      throw new Error(`Failed to cleanup credentials: ${error.message}`);
    }

    return {
      deleted: expiredCreds.length,
      credentials: expiredCreds,
    };
  }

  /**
   * Revoke credential manually
   */
  async revokeCredential(
    workspaceId: string,
    service: string,
    tenantId: string
  ): Promise<void> {
    // Delete from Secret Manager
    await this.secretManager.deleteSecret({
      service,
      tenantId,
    });

    // Delete from database
    const { error } = await this.supabase
      .from('credential_registry')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('service', service)
      .eq('tenant_id', tenantId);

    if (error) {
      throw new Error(`Failed to revoke credential: ${error.message}`);
    }
  }

  /**
   * Get credential health report
   */
  async getHealthReport(workspaceId: string): Promise<CredentialHealthReport> {
    const allCredentials = await this.getWorkspaceCredentials(workspaceId);
    const expiringSoon = await this.getExpiringSoonCredentials(workspaceId);
    const expired = await this.getExpiredCredentials(workspaceId);

    const report: CredentialHealthReport = {
      totalCredentials: allCredentials.length,
      activeCredentials: allCredentials.filter((c) => c.status === 'active').length,
      expiringSoonCredentials: expiringSoon.length,
      expiredCredentials: expired.length,
      byService: {},
      recommendations: [],
    };

    // Group by service
    for (const cred of allCredentials) {
      if (!report.byService[cred.service]) {
        report.byService[cred.service] = { total: 0, active: 0, expired: 0 };
      }

      report.byService[cred.service].total++;

      if (cred.status === 'active') {
        report.byService[cred.service].active++;
      } else if (cred.status === 'expired') {
        report.byService[cred.service].expired++;
      }
    }

    // Generate recommendations
    if (expired.length > 0) {
      report.recommendations.push(
        `You have ${expired.length} expired credential(s). Run: synthex tenant credentials cleanup`
      );
    }

    if (expiringSoon.length > 0) {
      report.recommendations.push(
        `You have ${expiringSoon.length} credential(s) expiring soon. Renew them with: synthex auth login`
      );
    }

    for (const service in report.byService) {
      const stats = report.byService[service];
      if (stats.expired > 0) {
        report.recommendations.push(
          `Service "${service}" has ${stats.expired} expired credential(s). Re-authenticate affected tenants.`
        );
      }
    }

    if (report.recommendations.length === 0) {
      report.recommendations.push('All credentials are healthy!');
    }

    return report;
  }

  /**
   * Check if credential needs renewal
   */
  needsRenewal(credential: CredentialInfo, daysThreshold: number = 7): boolean {
    return credential.status === 'expiring_soon' && (credential.daysUntilExpiry || 0) <= daysThreshold;
  }

  /**
   * Map database record to CredentialInfo
   */
  private mapCredential(data: any): CredentialInfo {
    let status: 'active' | 'expiring_soon' | 'expired' = 'active';
    let daysUntilExpiry: number | undefined;

    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      daysUntilExpiry = diffDays;

      if (diffDays < 0) {
        status = 'expired';
      } else if (diffDays <= 7) {
        status = 'expiring_soon';
      }
    }

    return {
      id: data.id,
      service: data.service,
      tenantId: data.tenant_id,
      workspaceId: data.workspace_id,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      status,
      daysUntilExpiry,
    };
  }

  /**
   * Get credential renewal instructions
   */
  getRenewalInstructions(service: string, tenantId: string): string {
    const commands: Record<string, string> = {
      shopify: `synthex auth login --service shopify --tenant-id "${tenantId}"`,
      'google-merchant': `synthex auth login --service google-merchant --client-id "${tenantId}"`,
    };

    return commands[service] || `synthex auth login --service ${service} --tenant-id "${tenantId}"`;
  }
}
