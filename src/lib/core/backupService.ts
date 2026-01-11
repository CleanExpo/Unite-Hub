/**
 * Backup & Recovery Service (Phase E11)
 *
 * Orchestration layer for backup and restore operations
 * Tracks metadata only - actual storage operations handled externally
 *
 * @module backupService
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export type BackupScope = "global" | "tenant" | "database" | "storage";
export type BackupStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface BackupJob {
  id: string;
  tenant_id?: string;
  scope: BackupScope;
  status: BackupStatus;
  storage_location?: string;
  backup_size_bytes?: number;
  started_at: string;
  finished_at?: string;
  duration_ms?: number;
  notes?: string;
  metadata?: Record<string, any>;
  error_message?: string;
  created_by?: string;
  created_at: string;
}

export interface RestoreJob {
  id: string;
  tenant_id?: string;
  scope: BackupScope;
  source_backup_id?: string;
  source_artifact_id?: string;
  status: BackupStatus;
  started_at: string;
  finished_at?: string;
  duration_ms?: number;
  notes?: string;
  restoration_notes?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  created_by?: string;
  created_at: string;
}

export interface BackupArtifact {
  id: string;
  backup_job_id: string;
  artifact_type: string;
  storage_location: string;
  file_size_bytes?: number;
  checksum?: string;
  compression?: string;
  encryption: boolean;
  retention_until?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Register a new backup job
 *
 * @param scope - Backup scope (global, tenant, database, storage)
 * @param tenantId - Tenant UUID (null for global backups)
 * @param notes - Optional notes
 * @param metadata - Additional backup configuration
 * @param createdBy - User initiating backup
 * @returns Backup job ID
 */
export async function registerBackupJob(
  scope: BackupScope,
  tenantId?: string,
  notes?: string,
  metadata?: Record<string, any>,
  createdBy?: string
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.rpc("register_backup_job", {
      p_tenant_id: tenantId || null,
      p_scope: scope,
      p_notes: notes || null,
      p_metadata: metadata || {},
      p_created_by: createdBy || null,
    });

    if (error) {
      console.error("[BackupService] Error registering backup job:", error);
      return null;
    }

    return data as string;
  } catch (err) {
    console.error("[BackupService] Exception in registerBackupJob:", err);
    return null;
  }
}

/**
 * Complete a backup job
 *
 * @param jobId - Backup job UUID
 * @param status - Final status
 * @param storageLocation - Where backup is stored
 * @param backupSizeBytes - Size of backup in bytes
 * @param errorMessage - Error message if failed
 */
export async function completeBackupJob(
  jobId: string,
  status: BackupStatus,
  storageLocation?: string,
  backupSizeBytes?: number,
  errorMessage?: string
): Promise<boolean> {
  try {
    await supabaseAdmin.rpc("complete_backup_job", {
      p_job_id: jobId,
      p_status: status,
      p_storage_location: storageLocation || null,
      p_backup_size_bytes: backupSizeBytes || null,
      p_error_message: errorMessage || null,
    });

    return true;
  } catch (err) {
    console.error("[BackupService] Exception in completeBackupJob:", err);
    return false;
  }
}

/**
 * Register a new restore job
 *
 * @param scope - Restore scope
 * @param tenantId - Tenant UUID
 * @param sourceBackupId - Source backup job ID
 * @param sourceArtifactId - Specific artifact to restore
 * @param notes - Optional notes
 * @param metadata - Restore configuration
 * @param createdBy - User initiating restore
 * @returns Restore job ID
 */
export async function registerRestoreJob(
  scope: BackupScope,
  tenantId?: string,
  sourceBackupId?: string,
  sourceArtifactId?: string,
  notes?: string,
  metadata?: Record<string, any>,
  createdBy?: string
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.rpc("register_restore_job", {
      p_tenant_id: tenantId || null,
      p_scope: scope,
      p_source_backup_id: sourceBackupId || null,
      p_source_artifact_id: sourceArtifactId || null,
      p_notes: notes || null,
      p_metadata: metadata || {},
      p_created_by: createdBy || null,
    });

    if (error) {
      console.error("[BackupService] Error registering restore job:", error);
      return null;
    }

    return data as string;
  } catch (err) {
    console.error("[BackupService] Exception in registerRestoreJob:", err);
    return null;
  }
}

/**
 * Complete a restore job
 *
 * @param jobId - Restore job UUID
 * @param status - Final status
 * @param restorationNotes - Notes about restoration
 * @param errorMessage - Error message if failed
 */
export async function completeRestoreJob(
  jobId: string,
  status: BackupStatus,
  restorationNotes?: string,
  errorMessage?: string
): Promise<boolean> {
  try {
    await supabaseAdmin.rpc("complete_restore_job", {
      p_job_id: jobId,
      p_status: status,
      p_restoration_notes: restorationNotes || null,
      p_error_message: errorMessage || null,
    });

    return true;
  } catch (err) {
    console.error("[BackupService] Exception in completeRestoreJob:", err);
    return false;
  }
}

/**
 * List backup jobs
 *
 * @param tenantId - Filter by tenant (null for global)
 * @param scope - Filter by scope
 * @param limit - Max results
 * @returns Array of backup jobs
 */
export async function listBackupJobs(
  tenantId?: string,
  scope?: BackupScope,
  limit: number = 50
): Promise<BackupJob[]> {
  try {
    let query = supabaseAdmin
      .from("backup_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tenantId !== undefined) {
      if (tenantId === null) {
        query = query.is("tenant_id", null);
      } else {
        query = query.eq("tenant_id", tenantId);
      }
    }

    if (scope) {
      query = query.eq("scope", scope);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[BackupService] Error listing backup jobs:", error);
      return [];
    }

    return (data || []) as BackupJob[];
  } catch (err) {
    console.error("[BackupService] Exception in listBackupJobs:", err);
    return [];
  }
}

/**
 * List restore jobs
 *
 * @param tenantId - Filter by tenant
 * @param limit - Max results
 * @returns Array of restore jobs
 */
export async function listRestoreJobs(
  tenantId?: string,
  limit: number = 50
): Promise<RestoreJob[]> {
  try {
    let query = supabaseAdmin
      .from("restore_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tenantId !== undefined) {
      if (tenantId === null) {
        query = query.is("tenant_id", null);
      } else {
        query = query.eq("tenant_id", tenantId);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("[BackupService] Error listing restore jobs:", error);
      return [];
    }

    return (data || []) as RestoreJob[];
  } catch (err) {
    console.error("[BackupService] Exception in listRestoreJobs:", err);
    return [];
  }
}

/**
 * Add backup artifact
 *
 * @param backupJobId - Backup job UUID
 * @param artifactType - Type of artifact (database, files, config, media)
 * @param storageLocation - Where artifact is stored
 * @param metadata - Additional metadata
 * @returns Artifact ID
 */
export async function addBackupArtifact(
  backupJobId: string,
  artifactType: string,
  storageLocation: string,
  metadata?: {
    file_size_bytes?: number;
    checksum?: string;
    compression?: string;
    encryption?: boolean;
    retention_until?: string;
  }
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("backup_artifacts")
      .insert({
        backup_job_id: backupJobId,
        artifact_type: artifactType,
        storage_location: storageLocation,
        file_size_bytes: metadata?.file_size_bytes || null,
        checksum: metadata?.checksum || null,
        compression: metadata?.compression || null,
        encryption: metadata?.encryption || false,
        retention_until: metadata?.retention_until || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[BackupService] Error adding backup artifact:", error);
      return null;
    }

    return data.id;
  } catch (err) {
    console.error("[BackupService] Exception in addBackupArtifact:", err);
    return null;
  }
}

/**
 * Get backup job details
 *
 * @param jobId - Backup job UUID
 * @returns Backup job with artifacts
 */
export async function getBackupJob(jobId: string): Promise<(BackupJob & { artifacts?: BackupArtifact[] }) | null> {
  try {
    const { data: job, error: jobError } = await supabaseAdmin
      .from("backup_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return null;
    }

    const { data: artifacts } = await supabaseAdmin
      .from("backup_artifacts")
      .select("*")
      .eq("backup_job_id", jobId);

    return {
      ...job,
      artifacts: artifacts || [],
    } as BackupJob & { artifacts: BackupArtifact[] };
  } catch (err) {
    console.error("[BackupService] Exception in getBackupJob:", err);
    return null;
  }
}
