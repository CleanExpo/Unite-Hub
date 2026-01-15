/**
 * Workspace Context Manager
 *
 * Manages workspace context switching and active tenant selection:
 * - Set active workspace
 * - Set active tenant
 * - Context persistence
 * - Multi-workspace support
 */

import { ConfigManager } from '../../utils/config-manager.js';
import { createClient } from '@supabase/supabase-js';

export interface WorkspaceContext {
  workspaceId: string;
  workspaceName?: string;
  activeTenantId?: string;
  market: string;
  region: string;
  lastSwitched: string;
}

export class WorkspaceManager {
  private configManager: ConfigManager;
  private supabase: any;

  constructor() {
    this.configManager = new ConfigManager();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Get current workspace context
   */
  getCurrentContext(): WorkspaceContext | null {
    const config = this.configManager.loadConfig();
    if (!config) {
      return null;
    }

    const contextData = this.configManager.get('workspace_context') as any;

    return {
      workspaceId: config.workspace_id,
      workspaceName: config.project_id || undefined,
      activeTenantId: contextData?.active_tenant_id,
      market: config.market,
      region: config.region,
      lastSwitched: contextData?.last_switched || config.initialized_at,
    };
  }

  /**
   * Set active tenant in current workspace
   */
  setActiveTenant(tenantId: string | null): void {
    const config = this.configManager.loadConfig();
    if (!config) {
      throw new Error('Synthex not initialized. Run: synthex init');
    }

    const contextData = {
      active_tenant_id: tenantId,
      last_switched: new Date().toISOString(),
    };

    this.configManager.set('workspace_context', contextData);
  }

  /**
   * Get active tenant ID
   */
  getActiveTenant(): string | null {
    const context = this.getCurrentContext();
    return context?.activeTenantId || null;
  }

  /**
   * Clear active tenant
   */
  clearActiveTenant(): void {
    this.setActiveTenant(null);
  }

  /**
   * Verify tenant exists and is active
   */
  async verifyTenant(tenantId: string): Promise<boolean> {
    if (!this.supabase) {
      return false;
    }

    const config = this.configManager.loadConfig();
    if (!config) {
      return false;
    }

    const { data, error } = await this.supabase
      .from('synthex_tenants')
      .select('id, status')
      .eq('workspace_id', config.workspace_id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.status === 'active';
  }

  /**
   * Get workspace information
   */
  async getWorkspaceInfo(): Promise<{
    workspaceId: string;
    market: string;
    region: string;
    tenantsCount: number;
    activeTenant?: {
      tenantId: string;
      name: string;
      type: string;
    };
  } | null> {
    const config = this.configManager.loadConfig();
    if (!config) {
      return null;
    }

    const info: any = {
      workspaceId: config.workspace_id,
      market: config.market,
      region: config.region,
      tenantsCount: 0,
    };

    // Get tenant count
    if (this.supabase) {
      const { data: tenants } = await this.supabase
        .from('synthex_tenants')
        .select('id')
        .eq('workspace_id', config.workspace_id);

      info.tenantsCount = tenants?.length || 0;

      // Get active tenant info
      const activeTenantId = this.getActiveTenant();
      if (activeTenantId) {
        const { data: tenant } = await this.supabase
          .from('synthex_tenants')
          .select('tenant_id, name, type')
          .eq('workspace_id', config.workspace_id)
          .eq('tenant_id', activeTenantId)
          .single();

        if (tenant) {
          info.activeTenant = {
            tenantId: tenant.tenant_id,
            name: tenant.name,
            type: tenant.type,
          };
        }
      }
    }

    return info;
  }

  /**
   * Switch to a different workspace (reinitialize)
   */
  switchWorkspace(market: string, region: string): void {
    // This will create a new workspace context
    // User should run: synthex init --market <market> --region <region>
    throw new Error(
      'To switch workspace, run: synthex init --market <market> --region <region>'
    );
  }

  /**
   * Get workspace history (stored contexts)
   */
  getWorkspaceHistory(): Array<{
    workspaceId: string;
    market: string;
    region: string;
    lastUsed: string;
  }> {
    const history = this.configManager.get('workspace_history') as any[];
    return history || [];
  }

  /**
   * Add current workspace to history
   */
  addToHistory(): void {
    const config = this.configManager.loadConfig();
    if (!config) {
      return;
    }

    const history = this.getWorkspaceHistory();

    // Remove existing entry for this workspace
    const filtered = history.filter((h) => h.workspaceId !== config.workspace_id);

    // Add current workspace to front
    filtered.unshift({
      workspaceId: config.workspace_id,
      market: config.market,
      region: config.region,
      lastUsed: new Date().toISOString(),
    });

    // Keep last 10 workspaces
    const trimmed = filtered.slice(0, 10);

    this.configManager.set('workspace_history', trimmed);
  }
}
