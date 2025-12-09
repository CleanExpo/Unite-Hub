/**
 * Synthex Audit & Governance Service
 * Phase B43: Governance, Audit Logging & Export
 *
 * Provides:
 * - Audit logging
 * - Data export
 * - Compliance tracking
 * - API key management
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';

// =====================================================
// Types
// =====================================================

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string | null;
  user_email: string | null;
  actor_type: 'user' | 'system' | 'api' | 'automation' | 'webhook';
  action: string;
  action_category:
    | 'auth'
    | 'contact'
    | 'campaign'
    | 'content'
    | 'template'
    | 'automation'
    | 'integration'
    | 'settings'
    | 'billing'
    | 'experiment'
    | 'export'
    | 'import'
    | 'admin'
    | 'api';
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  status: 'success' | 'failure' | 'pending';
  error_message: string | null;
  created_at: string;
}

export interface DataExport {
  id: string;
  tenant_id: string;
  requested_by: string;
  export_type:
    | 'contacts'
    | 'campaigns'
    | 'analytics'
    | 'audit_logs'
    | 'templates'
    | 'automations'
    | 'all_data'
    | 'gdpr';
  format: 'csv' | 'json' | 'xlsx';
  filters: Record<string, unknown>;
  date_range_start: string | null;
  date_range_end: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  file_path: string | null;
  file_size_bytes: number | null;
  file_url: string | null;
  expires_at: string | null;
  total_records: number | null;
  processed_records: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ComplianceRecord {
  id: string;
  tenant_id: string;
  request_type:
    | 'access_request'
    | 'deletion_request'
    | 'portability_request'
    | 'consent_update'
    | 'opt_out'
    | 'rectification';
  requester_email: string;
  requester_contact_id: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'expired';
  processed_by: string | null;
  processed_at: string | null;
  completion_notes: string | null;
  request_data: Record<string, unknown>;
  response_data: Record<string, unknown>;
  deadline_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  key_prefix: string;
  permissions: string[];
  allowed_origins: string[] | null;
  rate_limit_per_minute: number;
  is_active: boolean;
  last_used_at: string | null;
  usage_count: number;
  expires_at: string | null;
  created_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
}

export interface AuditLogInput {
  tenant_id: string;
  user_id?: string;
  user_email?: string;
  actor_type?: AuditLog['actor_type'];
  action: string;
  action_category: AuditLog['action_category'];
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  status?: AuditLog['status'];
  error_message?: string;
}

// =====================================================
// Audit Logging Functions
// =====================================================

/**
 * Log an audit event
 */
export async function logAuditEvent(input: AuditLogInput): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc('log_audit_event', {
    p_tenant_id: input.tenant_id,
    p_user_id: input.user_id || null,
    p_action: input.action,
    p_action_category: input.action_category,
    p_resource_type: input.resource_type,
    p_resource_id: input.resource_id || null,
    p_resource_name: input.resource_name || null,
    p_old_value: input.old_value || null,
    p_new_value: input.new_value || null,
    p_metadata: {
      ...input.metadata,
      ip_address: input.ip_address,
      user_agent: input.user_agent,
      request_id: input.request_id,
      user_email: input.user_email,
      actor_type: input.actor_type || 'user',
    },
    p_status: input.status || 'success',
  });

  if (error) {
    console.error('Error logging audit event:', error);
    // Don't throw - audit logging should not break the main flow
    return '';
  }

  return data;
}

/**
 * List audit logs with filtering
 */
export async function listAuditLogs(
  tenantId: string,
  options: {
    userId?: string;
    actionCategory?: AuditLog['action_category'];
    resourceType?: string;
    resourceId?: string;
    status?: AuditLog['status'];
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<AuditLog[]> {
  const {
    userId,
    actionCategory,
    resourceType,
    resourceId,
    status,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
  } = options;

  let query = supabaseAdmin
    .from('synthex_audit_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (actionCategory) {
    query = query.eq('action_category', actionCategory);
  }
  if (resourceType) {
    query = query.eq('resource_type', resourceType);
  }
  if (resourceId) {
    query = query.eq('resource_id', resourceId);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list audit logs: ${error.message}`);
  }

  return data || [];
}

/**
 * Get audit summary
 */
export async function getAuditSummary(
  tenantId: string,
  days: number = 30
): Promise<{
  total_events: number;
  events_by_category: Record<string, number>;
  events_by_status: Record<string, number>;
  top_users: Array<{ user_id: string; count: number }>;
  events_by_day: Array<{ date: string; count: number }>;
}> {
  const { data, error } = await supabaseAdmin.rpc('get_audit_summary', {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) {
    throw new Error(`Failed to get audit summary: ${error.message}`);
  }

  return data || {
    total_events: 0,
    events_by_category: {},
    events_by_status: {},
    top_users: [],
    events_by_day: [],
  };
}

// =====================================================
// Data Export Functions
// =====================================================

/**
 * Create a data export request
 */
export async function createDataExport(
  tenantId: string,
  requestedBy: string,
  input: {
    export_type: DataExport['export_type'];
    format?: DataExport['format'];
    filters?: Record<string, unknown>;
    date_range_start?: string;
    date_range_end?: string;
  }
): Promise<DataExport> {
  const { data, error } = await supabaseAdmin
    .from('synthex_data_exports')
    .insert({
      tenant_id: tenantId,
      requested_by: requestedBy,
      export_type: input.export_type,
      format: input.format || 'csv',
      filters: input.filters || {},
      date_range_start: input.date_range_start || null,
      date_range_end: input.date_range_end || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create export: ${error.message}`);
  }

  // Log audit event
  await logAuditEvent({
    tenant_id: tenantId,
    user_id: requestedBy,
    action: 'create_export',
    action_category: 'export',
    resource_type: 'data_export',
    resource_id: data.id,
    new_value: { export_type: input.export_type, format: input.format },
  });

  return data;
}

/**
 * Get data export by ID
 */
export async function getDataExport(exportId: string): Promise<DataExport | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_data_exports')
    .select('*')
    .eq('id', exportId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to get export: ${error.message}`);
  }

  return data;
}

/**
 * List data exports
 */
export async function listDataExports(
  tenantId: string,
  options: {
    status?: DataExport['status'];
    limit?: number;
  } = {}
): Promise<DataExport[]> {
  const { status, limit = 50 } = options;

  let query = supabaseAdmin
    .from('synthex_data_exports')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list exports: ${error.message}`);
  }

  return data || [];
}

/**
 * Update export status
 */
export async function updateExportStatus(
  exportId: string,
  update: Partial<DataExport>
): Promise<DataExport> {
  const { data, error } = await supabaseAdmin
    .from('synthex_data_exports')
    .update(update)
    .eq('id', exportId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update export: ${error.message}`);
  }

  return data;
}

// =====================================================
// Compliance Functions
// =====================================================

/**
 * Create a compliance request
 */
export async function createComplianceRequest(
  tenantId: string,
  input: {
    request_type: ComplianceRecord['request_type'];
    requester_email: string;
    requester_contact_id?: string;
    request_data?: Record<string, unknown>;
    deadline_days?: number;
  }
): Promise<ComplianceRecord> {
  const deadlineAt = new Date();
  deadlineAt.setDate(deadlineAt.getDate() + (input.deadline_days || 30));

  const { data, error } = await supabaseAdmin
    .from('synthex_compliance_records')
    .insert({
      tenant_id: tenantId,
      request_type: input.request_type,
      requester_email: input.requester_email,
      requester_contact_id: input.requester_contact_id || null,
      request_data: input.request_data || {},
      deadline_at: deadlineAt.toISOString(),
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create compliance request: ${error.message}`);
  }

  // Log audit event
  await logAuditEvent({
    tenant_id: tenantId,
    action: 'create_compliance_request',
    action_category: 'admin',
    resource_type: 'compliance_request',
    resource_id: data.id,
    new_value: { request_type: input.request_type, requester_email: input.requester_email },
  });

  return data;
}

/**
 * List compliance requests
 */
export async function listComplianceRequests(
  tenantId: string,
  options: {
    status?: ComplianceRecord['status'];
    request_type?: ComplianceRecord['request_type'];
    limit?: number;
  } = {}
): Promise<ComplianceRecord[]> {
  const { status, request_type, limit = 50 } = options;

  let query = supabaseAdmin
    .from('synthex_compliance_records')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }
  if (request_type) {
    query = query.eq('request_type', request_type);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list compliance requests: ${error.message}`);
  }

  return data || [];
}

/**
 * Update compliance request
 */
export async function updateComplianceRequest(
  requestId: string,
  processedBy: string,
  update: {
    status: ComplianceRecord['status'];
    completion_notes?: string;
    response_data?: Record<string, unknown>;
  }
): Promise<ComplianceRecord> {
  const { data, error } = await supabaseAdmin
    .from('synthex_compliance_records')
    .update({
      ...update,
      processed_by: processedBy,
      processed_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update compliance request: ${error.message}`);
  }

  return data;
}

// =====================================================
// API Key Functions
// =====================================================

/**
 * Generate a new API key
 */
export async function createApiKey(
  tenantId: string,
  createdBy: string,
  input: {
    name: string;
    description?: string;
    permissions?: string[];
    allowed_origins?: string[];
    rate_limit_per_minute?: number;
    expires_in_days?: number;
  }
): Promise<{ apiKey: ApiKey; plainTextKey: string }> {
  // Generate a secure random key
  const plainTextKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
  const keyPrefix = plainTextKey.substring(0, 16);
  const keyHash = crypto.createHash('sha256').update(plainTextKey).digest('hex');

  const expiresAt = input.expires_in_days
    ? new Date(Date.now() + input.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabaseAdmin
    .from('synthex_api_keys')
    .insert({
      tenant_id: tenantId,
      name: input.name,
      description: input.description || null,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      permissions: input.permissions || ['read'],
      allowed_origins: input.allowed_origins || null,
      rate_limit_per_minute: input.rate_limit_per_minute || 60,
      expires_at: expiresAt,
      created_by: createdBy,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create API key: ${error.message}`);
  }

  // Log audit event
  await logAuditEvent({
    tenant_id: tenantId,
    user_id: createdBy,
    action: 'create_api_key',
    action_category: 'api',
    resource_type: 'api_key',
    resource_id: data.id,
    resource_name: input.name,
  });

  return { apiKey: data, plainTextKey };
}

/**
 * Validate an API key
 */
export async function validateApiKey(
  key: string
): Promise<{ valid: boolean; apiKey?: ApiKey; error?: string }> {
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  const { data, error } = await supabaseAdmin
    .from('synthex_api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid API key' };
  }

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'API key expired' };
  }

  // Update usage stats
  await supabaseAdmin
    .from('synthex_api_keys')
    .update({
      last_used_at: new Date().toISOString(),
      usage_count: (data.usage_count || 0) + 1,
    })
    .eq('id', data.id);

  return { valid: true, apiKey: data };
}

/**
 * List API keys
 */
export async function listApiKeys(
  tenantId: string,
  includeRevoked: boolean = false
): Promise<ApiKey[]> {
  let query = supabaseAdmin
    .from('synthex_api_keys')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (!includeRevoked) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list API keys: ${error.message}`);
  }

  return data || [];
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(
  keyId: string,
  revokedBy: string
): Promise<void> {
  const { data: key, error: getError } = await supabaseAdmin
    .from('synthex_api_keys')
    .select('tenant_id, name')
    .eq('id', keyId)
    .single();

  if (getError) {
    throw new Error(`API key not found`);
  }

  const { error } = await supabaseAdmin
    .from('synthex_api_keys')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
    })
    .eq('id', keyId);

  if (error) {
    throw new Error(`Failed to revoke API key: ${error.message}`);
  }

  // Log audit event
  await logAuditEvent({
    tenant_id: key.tenant_id,
    user_id: revokedBy,
    action: 'revoke_api_key',
    action_category: 'api',
    resource_type: 'api_key',
    resource_id: keyId,
    resource_name: key.name,
  });
}

// =====================================================
// Helper: Create audit middleware
// =====================================================

/**
 * Create an audit logger for a specific context
 */
export function createAuditLogger(tenantId: string, userId?: string) {
  return {
    log: (
      action: string,
      category: AuditLog['action_category'],
      resourceType: string,
      details?: {
        resourceId?: string;
        resourceName?: string;
        oldValue?: Record<string, unknown>;
        newValue?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
      }
    ) =>
      logAuditEvent({
        tenant_id: tenantId,
        user_id: userId,
        action,
        action_category: category,
        resource_type: resourceType,
        ...details,
      }),

    logSuccess: (
      action: string,
      category: AuditLog['action_category'],
      resourceType: string,
      details?: {
        resourceId?: string;
        resourceName?: string;
        metadata?: Record<string, unknown>;
      }
    ) =>
      logAuditEvent({
        tenant_id: tenantId,
        user_id: userId,
        action,
        action_category: category,
        resource_type: resourceType,
        status: 'success',
        ...details,
      }),

    logFailure: (
      action: string,
      category: AuditLog['action_category'],
      resourceType: string,
      errorMessage: string,
      details?: {
        resourceId?: string;
        metadata?: Record<string, unknown>;
      }
    ) =>
      logAuditEvent({
        tenant_id: tenantId,
        user_id: userId,
        action,
        action_category: category,
        resource_type: resourceType,
        status: 'failure',
        error_message: errorMessage,
        ...details,
      }),
  };
}
