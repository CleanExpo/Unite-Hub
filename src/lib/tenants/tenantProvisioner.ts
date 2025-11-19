/**
 * Tenant Provisioner - Phase 3 Step 8 Priority 3
 *
 * Generates tenant-specific docker-compose files and manages container provisioning.
 *
 * Responsibilities:
 * - Generate docker-compose.yml from template with tenant-specific variables
 * - Validate configuration before provisioning
 * - Create tenant directories and configuration files
 * - Safety checks to prevent resource conflicts
 * - Database record creation for tenant containers
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { getSupabaseServer } from '@/lib/supabase';

// Types
export interface TenantConfig {
  organizationId: string;
  tenantName: string;
  cpuLimit?: number; // Default: 0.50 (50% of 1 core)
  memoryLimitMb?: number; // Default: 512MB
  diskLimitMb?: number; // Default: 2048MB
  imageTag?: string; // Default: 'latest'
}

export interface ProvisionResult {
  success: boolean;
  containerId?: string;
  containerName?: string;
  externalPort?: number;
  tenantUrl?: string;
  composePath?: string;
  error?: string;
}

/**
 * Validate tenant configuration
 */
export function validateTenantConfig(config: TenantConfig): {
  valid: boolean;
  error?: string;
} {
  // Validate organization ID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(config.organizationId)) {
    return { valid: false, error: 'Invalid organization ID format' };
  }

  // Validate tenant name
  if (!config.tenantName || config.tenantName.length === 0) {
    return { valid: false, error: 'Tenant name is required' };
  }

  if (config.tenantName.length > 100) {
    return { valid: false, error: 'Tenant name must be 100 characters or less' };
  }

  // Validate CPU limit
  if (config.cpuLimit !== undefined) {
    if (config.cpuLimit <= 0 || config.cpuLimit > 4.0) {
      return { valid: false, error: 'CPU limit must be between 0 and 4.0' };
    }
  }

  // Validate memory limit
  if (config.memoryLimitMb !== undefined) {
    if (config.memoryLimitMb < 256 || config.memoryLimitMb > 8192) {
      return { valid: false, error: 'Memory limit must be between 256MB and 8192MB' };
    }
  }

  // Validate disk limit
  if (config.diskLimitMb !== undefined) {
    if (config.diskLimitMb < 1024) {
      return { valid: false, error: 'Disk limit must be at least 1024MB' };
    }
  }

  return { valid: true };
}

/**
 * Get next available port for tenant
 */
export async function getNextAvailablePort(): Promise<number> {
  const supabase = await getSupabaseServer();

  const { data: containers, error } = await supabase
    .from('tenant_containers')
    .select('external_port')
    .not('external_port', 'is', null)
    .order('external_port', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching ports:', error);
    return 3001; // Default starting port
  }

  if (!containers || containers.length === 0) {
    return 3001; // First tenant gets port 3001
  }

  const maxPort = containers[0].external_port;
  const nextPort = maxPort + 1;

  // Validate port range
  if (nextPort > 65535) {
    throw new Error('No available ports in valid range');
  }

  return nextPort;
}

/**
 * Generate docker-compose file for tenant
 */
export async function generateDockerCompose(
  config: TenantConfig,
  externalPort: number
): Promise<{ success: boolean; composePath?: string; error?: string }> {
  try {
    // Read template
    const templatePath = path.join(process.cwd(), 'docker', 'tenant', 'docker-compose.template.yml');
    const template = await fs.readFile(templatePath, 'utf-8');

    // Prepare variables
    const containerName = `tenant_${config.organizationId}`;
    const tenantUrl = `http://localhost:${externalPort}`;

    const variables = {
      TENANT_ID: config.organizationId,
      TENANT_NAME: config.tenantName,
      TENANT_URL: tenantUrl,
      CPU_LIMIT: (config.cpuLimit || 0.50).toFixed(2),
      MEMORY_LIMIT: `${config.memoryLimitMb || 512}M`,
      PORT: externalPort.toString(),

      // Database (from environment)
      DATABASE_URL: process.env.DATABASE_URL || '',

      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

      // API keys
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',

      // Email
      EMAIL_FROM: process.env.EMAIL_FROM || '',
      EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST || '',
      EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT || '587',
      EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER || '',
      EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD || '',
    };

    // Replace template variables
    let composeContent = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      composeContent = composeContent.replace(regex, value);
    }

    // Create tenant directory
    const tenantDir = path.join(process.cwd(), 'docker', 'tenants', containerName);
    await fs.mkdir(tenantDir, { recursive: true });

    // Write docker-compose file
    const composePath = path.join(tenantDir, 'docker-compose.yml');
    await fs.writeFile(composePath, composeContent, 'utf-8');

    console.log(`[TENANT PROVISIONER] Generated docker-compose file: ${composePath}`);

    return { success: true, composePath };
  } catch (error) {
    console.error('[TENANT PROVISIONER] Error generating docker-compose:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Provision a new tenant container
 */
export async function provisionTenant(
  config: TenantConfig,
  createdBy?: string
): Promise<ProvisionResult> {
  try {
    // Validate configuration
    const validation = validateTenantConfig(config);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const supabase = await getSupabaseServer();

    // Check if tenant already exists
    const { data: existing } = await supabase
      .from('tenant_containers')
      .select('id')
      .eq('organization_id', config.organizationId)
      .single();

    if (existing) {
      return {
        success: false,
        error: 'Tenant container already exists for this organization',
      };
    }

    // Get next available port
    const externalPort = await getNextAvailablePort();

    // Generate docker-compose file
    const composeResult = await generateDockerCompose(config, externalPort);
    if (!composeResult.success) {
      return { success: false, error: composeResult.error };
    }

    // Create database record
    const containerName = `tenant_${config.organizationId}`;
    const tenantUrl = `http://localhost:${externalPort}`;

    const { data: container, error: dbError } = await supabase
      .from('tenant_containers')
      .insert({
        organization_id: config.organizationId,
        tenant_name: config.tenantName,
        container_name: containerName,
        image_tag: config.imageTag || 'latest',
        external_port: externalPort,
        internal_port: 3000,
        tenant_url: tenantUrl,
        cpu_limit: config.cpuLimit || 0.50,
        memory_limit_mb: config.memoryLimitMb || 512,
        disk_limit_mb: config.diskLimitMb || 2048,
        status: 'provisioning',
        health_status: 'unknown',
        created_by: createdBy || null,
      })
      .select()
      .single();

    if (dbError || !container) {
      console.error('[TENANT PROVISIONER] Database error:', dbError);
      return { success: false, error: dbError?.message || 'Failed to create database record' };
    }

    // Create deployment record
    await supabase.from('tenant_deployments').insert({
      container_id: container.id,
      deployment_type: 'provision',
      status: 'pending',
      new_image_tag: config.imageTag || 'latest',
      deployed_by: createdBy || null,
      deployment_notes: 'Initial tenant provisioning',
    });

    console.log(`[TENANT PROVISIONER] Provisioned tenant container: ${containerName}`);

    return {
      success: true,
      containerId: container.id,
      containerName,
      externalPort,
      tenantUrl,
      composePath: composeResult.composePath,
    };
  } catch (error) {
    console.error('[TENANT PROVISIONER] Error provisioning tenant:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Deprovision a tenant container
 */
export async function deprovisionTenant(
  organizationId: string,
  deletedBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Get container record
    const { data: container, error: fetchError } = await supabase
      .from('tenant_containers')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !container) {
      return { success: false, error: 'Container not found' };
    }

    // Update status to terminated
    const { error: updateError } = await supabase
      .from('tenant_containers')
      .update({
        status: 'terminated',
        last_stopped_at: new Date().toISOString(),
      })
      .eq('id', container.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Create termination deployment record
    await supabase.from('tenant_deployments').insert({
      container_id: container.id,
      deployment_type: 'terminate',
      status: 'completed',
      new_image_tag: container.image_tag,
      deployed_by: deletedBy || null,
      deployment_notes: 'Tenant container deprovisioned',
      completed_at: new Date().toISOString(),
    });

    // Delete docker-compose file
    const tenantDir = path.join(process.cwd(), 'docker', 'tenants', container.container_name);
    try {
      await fs.rm(tenantDir, { recursive: true, force: true });
      console.log(`[TENANT PROVISIONER] Deleted tenant directory: ${tenantDir}`);
    } catch (error) {
      console.warn('[TENANT PROVISIONER] Failed to delete tenant directory:', error);
    }

    console.log(`[TENANT PROVISIONER] Deprovisioned tenant: ${container.container_name}`);

    return { success: true };
  } catch (error) {
    console.error('[TENANT PROVISIONER] Error deprovisioning tenant:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get tenant container by organization ID
 */
export async function getTenantContainer(organizationId: string): Promise<{
  success: boolean;
  container?: any;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServer();

    const { data: container, error } = await supabase
      .from('tenant_containers')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, container };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * List all tenant containers
 */
export async function listTenantContainers(): Promise<{
  success: boolean;
  containers?: any[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServer();

    const { data: containers, error } = await supabase
      .from('tenant_containers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, containers };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
