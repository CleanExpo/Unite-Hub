/**
 * Tenant Orchestrator - Phase 3 Step 8 Priority 3
 *
 * Manages tenant container lifecycle operations using Docker commands.
 *
 * Responsibilities:
 * - Start/stop tenant containers
 * - Health check monitoring
 * - Resource usage tracking
 * - Container scaling and updates
 * - Deployment management
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { getSupabaseServer } from '@/lib/supabase';

const execAsync = promisify(exec);

// Types
export interface ContainerStatus {
  running: boolean;
  healthy: boolean;
  uptime?: string;
  containerId?: string;
  error?: string;
}

export interface ResourceMetrics {
  cpuPercent: number;
  memoryUsageMb: number;
  memoryLimitMb: number;
  networkRxBytes: number;
  networkTxBytes: number;
}

/**
 * Start a tenant container
 */
export async function startTenantContainer(
  organizationId: string
): Promise<{ success: boolean; containerId?: string; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Get container configuration
    const { data: container, error: fetchError } = await supabase
      .from('tenant_containers')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !container) {
      return { success: false, error: 'Container not found' };
    }

    // Check if container is already running
    if (container.status === 'running') {
      return { success: false, error: 'Container is already running' };
    }

    // Get docker-compose path
    const composePath = path.join(
      process.cwd(),
      'docker',
      'tenants',
      container.container_name,
      'docker-compose.yml'
    );

    // Start container using docker-compose
    const { stdout, stderr } = await execAsync(
      `docker-compose -f "${composePath}" up -d`,
      { cwd: process.cwd() }
    );

    console.log('[TENANT ORCHESTRATOR] Docker compose up output:', stdout);
    if (stderr) {
      console.warn('[TENANT ORCHESTRATOR] Docker compose stderr:', stderr);
    }

    // Get container ID
    const { stdout: psOutput } = await execAsync(
      `docker-compose -f "${composePath}" ps -q`
    );

    const dockerContainerId = psOutput.trim();

    // Update database
    const { error: updateError } = await supabase
      .from('tenant_containers')
      .update({
        status: 'running',
        container_id: dockerContainerId,
        last_started_at: new Date().toISOString(),
        health_status: 'starting',
      })
      .eq('id', container.id);

    if (updateError) {
      console.error('[TENANT ORCHESTRATOR] Failed to update database:', updateError);
    }

    // Create deployment record
    await supabase.from('tenant_deployments').insert({
      container_id: container.id,
      deployment_type: 'restart',
      status: 'completed',
      new_image_tag: container.image_tag,
      completed_at: new Date().toISOString(),
    });

    console.log(`[TENANT ORCHESTRATOR] Started container: ${container.container_name}`);

    return { success: true, containerId: dockerContainerId };
  } catch (error) {
    console.error('[TENANT ORCHESTRATOR] Error starting container:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Stop a tenant container
 */
export async function stopTenantContainer(
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Get container configuration
    const { data: container, error: fetchError } = await supabase
      .from('tenant_containers')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !container) {
      return { success: false, error: 'Container not found' };
    }

    // Check if container is already stopped
    if (container.status === 'stopped') {
      return { success: false, error: 'Container is already stopped' };
    }

    // Get docker-compose path
    const composePath = path.join(
      process.cwd(),
      'docker',
      'tenants',
      container.container_name,
      'docker-compose.yml'
    );

    // Stop container using docker-compose
    const { stdout, stderr } = await execAsync(
      `docker-compose -f "${composePath}" down`,
      { cwd: process.cwd() }
    );

    console.log('[TENANT ORCHESTRATOR] Docker compose down output:', stdout);
    if (stderr) {
      console.warn('[TENANT ORCHESTRATOR] Docker compose stderr:', stderr);
    }

    // Update database
    const { error: updateError } = await supabase
      .from('tenant_containers')
      .update({
        status: 'stopped',
        last_stopped_at: new Date().toISOString(),
        health_status: 'unknown',
      })
      .eq('id', container.id);

    if (updateError) {
      console.error('[TENANT ORCHESTRATOR] Failed to update database:', updateError);
    }

    console.log(`[TENANT ORCHESTRATOR] Stopped container: ${container.container_name}`);

    return { success: true };
  } catch (error) {
    console.error('[TENANT ORCHESTRATOR] Error stopping container:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Restart a tenant container
 */
export async function restartTenantContainer(
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Stop container
    const stopResult = await stopTenantContainer(organizationId);
    if (!stopResult.success) {
      return stopResult;
    }

    // Wait 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Start container
    const startResult = await startTenantContainer(organizationId);
    return startResult;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get container status
 */
export async function getContainerStatus(
  organizationId: string
): Promise<ContainerStatus> {
  try {
    const supabase = await getSupabaseServer();

    // Get container from database
    const { data: container, error } = await supabase
      .from('tenant_containers')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error || !container) {
      return { running: false, healthy: false, error: 'Container not found' };
    }

    // If container ID is null, it's not running
    if (!container.container_id) {
      return {
        running: false,
        healthy: false,
        containerId: undefined,
      };
    }

    // Check Docker container status
    try {
      const { stdout } = await execAsync(
        `docker inspect --format='{{.State.Status}}' ${container.container_id}`
      );

      const status = stdout.trim();
      const running = status === 'running';

      // Get uptime if running
      let uptime: string | undefined;
      if (running) {
        const { stdout: startedAtStr } = await execAsync(
          `docker inspect --format='{{.State.StartedAt}}' ${container.container_id}`
        );
        const startedAt = new Date(startedAtStr.trim());
        const now = new Date();
        const uptimeMs = now.getTime() - startedAt.getTime();
        const uptimeMinutes = Math.floor(uptimeMs / 60000);
        uptime = `${uptimeMinutes} minutes`;
      }

      return {
        running,
        healthy: container.health_status === 'healthy',
        uptime,
        containerId: container.container_id,
      };
    } catch (dockerError) {
      // Container doesn't exist in Docker
      return {
        running: false,
        healthy: false,
        containerId: container.container_id,
        error: 'Container not found in Docker',
      };
    }
  } catch (error) {
    return {
      running: false,
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Perform health check on container
 */
export async function performHealthCheck(
  organizationId: string
): Promise<{ success: boolean; healthy: boolean; responseTimeMs?: number; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Get container
    const { data: container, error } = await supabase
      .from('tenant_containers')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error || !container) {
      return { success: false, healthy: false, error: 'Container not found' };
    }

    // Check if container is running
    const status = await getContainerStatus(organizationId);
    if (!status.running) {
      // Record unhealthy check
      await supabase.from('tenant_health').insert({
        container_id: container.id,
        status: 'unhealthy',
        error_message: 'Container is not running',
      });

      await supabase
        .from('tenant_containers')
        .update({ health_status: 'unhealthy', last_health_check_at: new Date().toISOString() })
        .eq('id', container.id);

      return { success: true, healthy: false, error: 'Container is not running' };
    }

    // Perform HTTP health check
    const startTime = Date.now();
    try {
      const response = await fetch(`${container.tenant_url}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const responseTimeMs = Date.now() - startTime;
      const healthy = response.status === 200;

      // Record health check
      await supabase.from('tenant_health').insert({
        container_id: container.id,
        status: healthy ? 'healthy' : 'unhealthy',
        response_time_ms: responseTimeMs,
        http_status_code: response.status,
      });

      // Update container health status
      await supabase
        .from('tenant_containers')
        .update({
          health_status: healthy ? 'healthy' : 'unhealthy',
          last_health_check_at: new Date().toISOString(),
        })
        .eq('id', container.id);

      return { success: true, healthy, responseTimeMs };
    } catch (fetchError) {
      // Health check failed
      const responseTimeMs = Date.now() - startTime;

      await supabase.from('tenant_health').insert({
        container_id: container.id,
        status: 'timeout',
        response_time_ms: responseTimeMs,
        error_message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
      });

      await supabase
        .from('tenant_containers')
        .update({
          health_status: 'unhealthy',
          last_health_check_at: new Date().toISOString(),
        })
        .eq('id', container.id);

      return {
        success: true,
        healthy: false,
        responseTimeMs,
        error: fetchError instanceof Error ? fetchError.message : 'Health check failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get resource metrics for container
 */
export async function getResourceMetrics(
  organizationId: string
): Promise<{ success: boolean; metrics?: ResourceMetrics; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Get container
    const { data: container, error } = await supabase
      .from('tenant_containers')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error || !container || !container.container_id) {
      return { success: false, error: 'Container not found' };
    }

    // Get Docker stats
    const { stdout } = await execAsync(
      `docker stats ${container.container_id} --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}|{{.NetIO}}"`
    );

    // Parse stats: "0.50%|512MiB / 1GiB|1.23MB / 4.56MB"
    const parts = stdout.trim().split('|');
    if (parts.length !== 3) {
      return { success: false, error: 'Failed to parse stats' };
    }

    // Parse CPU
    const cpuPercent = parseFloat(parts[0].replace('%', ''));

    // Parse memory
    const memoryParts = parts[1].split(' / ');
    const memoryUsage = memoryParts[0].trim();
    const memoryLimit = memoryParts[1].trim();

    const memoryUsageMb = parseFloat(memoryUsage.replace(/[^\d.]/g, ''));
    const memoryLimitMb = parseFloat(memoryLimit.replace(/[^\d.]/g, ''));

    // Parse network
    const networkParts = parts[2].split(' / ');
    const networkRx = networkParts[0].trim();
    const networkTx = networkParts[1].trim();

    const networkRxBytes = parseFloat(networkRx.replace(/[^\d.]/g, '')) * 1024 * 1024; // MB to bytes
    const networkTxBytes = parseFloat(networkTx.replace(/[^\d.]/g, '')) * 1024 * 1024;

    const metrics: ResourceMetrics = {
      cpuPercent,
      memoryUsageMb,
      memoryLimitMb,
      networkRxBytes,
      networkTxBytes,
    };

    // Record metrics in database
    await supabase.from('tenant_resource_usage').insert({
      container_id: container.id,
      period_start: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      period_end: new Date().toISOString(),
      cpu_usage_percent_avg: cpuPercent,
      cpu_usage_percent_max: cpuPercent,
      memory_usage_mb_avg: memoryUsageMb,
      memory_usage_mb_max: memoryUsageMb,
      memory_limit_mb: memoryLimitMb,
      network_rx_bytes: networkRxBytes,
      network_tx_bytes: networkTxBytes,
    });

    return { success: true, metrics };
  } catch (error) {
    console.error('[TENANT ORCHESTRATOR] Error getting metrics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Scale container resources (update CPU/memory limits)
 */
export async function scaleContainer(
  organizationId: string,
  cpuLimit?: number,
  memoryLimitMb?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Update database
    const updates: any = {};
    if (cpuLimit !== undefined) updates.cpu_limit = cpuLimit;
    if (memoryLimitMb !== undefined) updates.memory_limit_mb = memoryLimitMb;

    const { error: updateError } = await supabase
      .from('tenant_containers')
      .update(updates)
      .eq('organization_id', organizationId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Restart container to apply new limits
    const restartResult = await restartTenantContainer(organizationId);
    if (!restartResult.success) {
      return restartResult;
    }

    // Create deployment record
    const { data: container } = await supabase
      .from('tenant_containers')
      .select('id, image_tag')
      .eq('organization_id', organizationId)
      .single();

    if (container) {
      await supabase.from('tenant_deployments').insert({
        container_id: container.id,
        deployment_type: 'scale',
        status: 'completed',
        new_image_tag: container.image_tag,
        new_config: updates,
        completed_at: new Date().toISOString(),
      });
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
