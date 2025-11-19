/**
 * Time Tracking Engine
 * Phase 3 Step 8 - Universal Hours Tracking
 *
 * Core time tracking logic for:
 * - Starting/stopping timer sessions
 * - Creating manual time entries
 * - Calculating billable amounts
 * - Linking to Xero for invoicing
 *
 * Usage:
 * ```typescript
 * import { startTimeSession, stopTimeSession, createManualEntry } from '@/lib/timetracking/timeEngine';
 *
 * // Start timer
 * const session = await startTimeSession({
 *   staffId: 'uuid',
 *   organizationId: 'uuid',
 *   projectId: 'proj-123',
 *   taskId: 'task-1',
 *   description: 'Working on feature X'
 * });
 *
 * // Stop timer
 * const entry = await stopTimeSession({
 *   sessionId: session.id,
 *   staffId: 'uuid'
 * });
 *
 * // Manual entry
 * const manualEntry = await createManualEntry({
 *   staffId: 'uuid',
 *   organizationId: 'uuid',
 *   projectId: 'proj-123',
 *   date: '2025-11-19',
 *   hours: 3.5,
 *   description: 'Code review'
 * });
 * ```
 */

import { getSupabaseServer } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface TimeSession {
  id: string;
  staffId: string;
  organizationId: string;
  projectId?: string;
  taskId?: string;
  description?: string;
  startedAt: string;
  stoppedAt?: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  staffId: string;
  organizationId: string;
  projectId?: string;
  taskId?: string;
  description: string;
  date: string;
  hours: number;
  entryType: 'timer' | 'manual';
  sessionId?: string;
  billable: boolean;
  hourlyRate?: number;
  totalAmount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'billed';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  xeroSynced: boolean;
  xeroTimesheetId?: string;
  xeroSyncedAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface StartSessionParams {
  staffId: string;
  organizationId: string;
  projectId?: string;
  taskId?: string;
  description?: string;
}

export interface StopSessionParams {
  sessionId: string;
  staffId: string;
}

export interface CreateManualEntryParams {
  staffId: string;
  organizationId: string;
  projectId?: string;
  taskId?: string;
  date: string; // YYYY-MM-DD
  hours: number;
  description: string;
  billable?: boolean;
  hourlyRate?: number;
}

export interface ApproveEntryParams {
  entryId: string;
  approvedBy: string;
  organizationId: string;
}

export interface RejectEntryParams {
  entryId: string;
  rejectedBy: string;
  organizationId: string;
  reason: string;
}

export interface SyncToXeroParams {
  entryIds: string[];
  organizationId: string;
}

// ============================================================================
// TIME SESSION FUNCTIONS
// ============================================================================

/**
 * Start a new time tracking session (timer)
 *
 * @param params - Session parameters
 * @returns Created session or error
 */
export async function startTimeSession(params: StartSessionParams): Promise<{
  success: boolean;
  session?: TimeSession;
  error?: string;
}> {
  try {
    const { staffId, organizationId, projectId, taskId, description } = params;

    const supabase = await getSupabaseServer();

    // Check if user already has an active session
    const { data: activeSessions } = await supabase
      .from('time_sessions')
      .select('id')
      .eq('staff_id', staffId)
      .is('stopped_at', null);

    if (activeSessions && activeSessions.length > 0) {
      return {
        success: false,
        error: 'You already have an active timer session. Stop it before starting a new one.',
      };
    }

    // Create new session
    const { data: session, error } = await supabase
      .from('time_sessions')
      .insert({
        staff_id: staffId,
        organization_id: organizationId,
        project_id: projectId,
        task_id: taskId,
        description,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating time session:', error);
      return {
        success: false,
        error: 'Failed to start timer session',
      };
    }

    return {
      success: true,
      session: transformSession(session),
    };
  } catch (error) {
    console.error('Start time session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Stop an active time tracking session
 *
 * @param params - Stop parameters
 * @returns Created time entry or error
 */
export async function stopTimeSession(params: StopSessionParams): Promise<{
  success: boolean;
  entry?: TimeEntry;
  error?: string;
}> {
  try {
    const { sessionId, staffId } = params;

    const supabase = await getSupabaseServer();

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('time_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('staff_id', staffId)
      .single();

    if (sessionError || !session) {
      return {
        success: false,
        error: 'Session not found or access denied',
      };
    }

    if (session.stopped_at) {
      return {
        success: false,
        error: 'Session already stopped',
      };
    }

    const stoppedAt = new Date();
    const startedAt = new Date(session.started_at);
    const durationSeconds = Math.floor((stoppedAt.getTime() - startedAt.getTime()) / 1000);
    const hours = parseFloat((durationSeconds / 3600).toFixed(2));

    // Update session
    await supabase
      .from('time_sessions')
      .update({
        stopped_at: stoppedAt.toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq('id', sessionId);

    // Get hourly rate if project is set
    let hourlyRate: number | undefined;
    if (session.project_id) {
      const { data: staffProfile } = await supabase
        .from('user_profiles')
        .select('metadata')
        .eq('id', staffId)
        .single();

      hourlyRate = staffProfile?.metadata?.hourly_rate;
    }

    const totalAmount = hourlyRate ? parseFloat((hours * hourlyRate).toFixed(2)) : undefined;

    // Create time entry
    const { data: entry, error: entryError } = await supabase
      .from('time_entries')
      .insert({
        staff_id: staffId,
        organization_id: session.organization_id,
        project_id: session.project_id,
        task_id: session.task_id,
        description: session.description || 'Timer session',
        date: startedAt.toISOString().split('T')[0], // YYYY-MM-DD
        hours,
        entry_type: 'timer',
        session_id: sessionId,
        billable: true,
        hourly_rate: hourlyRate,
        total_amount: totalAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (entryError) {
      console.error('Error creating time entry:', entryError);
      return {
        success: false,
        error: 'Failed to create time entry',
      };
    }

    return {
      success: true,
      entry: transformEntry(entry),
    };
  } catch (error) {
    console.error('Stop time session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get active session for a staff member
 *
 * @param staffId - Staff member ID
 * @returns Active session or null
 */
export async function getActiveSession(staffId: string): Promise<{
  success: boolean;
  session?: TimeSession | null;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServer();

    const { data: session, error } = await supabase
      .from('time_sessions')
      .select('*')
      .eq('staff_id', staffId)
      .is('stopped_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error getting active session:', error);
      return {
        success: false,
        error: 'Failed to get active session',
      };
    }

    return {
      success: true,
      session: session ? transformSession(session) : null,
    };
  } catch (error) {
    console.error('Get active session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// MANUAL TIME ENTRY FUNCTIONS
// ============================================================================

/**
 * Create a manual time entry (no timer)
 *
 * @param params - Entry parameters
 * @returns Created entry or error
 */
export async function createManualEntry(params: CreateManualEntryParams): Promise<{
  success: boolean;
  entry?: TimeEntry;
  error?: string;
}> {
  try {
    const {
      staffId,
      organizationId,
      projectId,
      taskId,
      date,
      hours,
      description,
      billable = true,
      hourlyRate,
    } = params;

    // Validate hours
    if (hours <= 0 || hours > 24) {
      return {
        success: false,
        error: 'Hours must be between 0 and 24',
      };
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return {
        success: false,
        error: 'Date must be in YYYY-MM-DD format',
      };
    }

    const supabase = await getSupabaseServer();

    // Get hourly rate if not provided
    let finalHourlyRate = hourlyRate;
    if (!finalHourlyRate && projectId) {
      const { data: staffProfile } = await supabase
        .from('user_profiles')
        .select('metadata')
        .eq('id', staffId)
        .single();

      finalHourlyRate = staffProfile?.metadata?.hourly_rate;
    }

    const totalAmount = finalHourlyRate
      ? parseFloat((hours * finalHourlyRate).toFixed(2))
      : undefined;

    // Create entry
    const { data: entry, error } = await supabase
      .from('time_entries')
      .insert({
        staff_id: staffId,
        organization_id: organizationId,
        project_id: projectId,
        task_id: taskId,
        description,
        date,
        hours,
        entry_type: 'manual',
        billable,
        hourly_rate: finalHourlyRate,
        total_amount: totalAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating manual entry:', error);
      return {
        success: false,
        error: 'Failed to create manual entry',
      };
    }

    return {
      success: true,
      entry: transformEntry(entry),
    };
  } catch (error) {
    console.error('Create manual entry error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// APPROVAL FUNCTIONS
// ============================================================================

/**
 * Approve a time entry
 *
 * @param params - Approval parameters
 * @returns Updated entry or error
 */
export async function approveTimeEntry(params: ApproveEntryParams): Promise<{
  success: boolean;
  entry?: TimeEntry;
  error?: string;
}> {
  try {
    const { entryId, approvedBy, organizationId } = params;

    const supabase = await getSupabaseServer();

    // Update entry
    const { data: entry, error: entryError } = await supabase
      .from('time_entries')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      })
      .eq('id', entryId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (entryError) {
      console.error('Error approving entry:', entryError);
      return {
        success: false,
        error: 'Failed to approve entry',
      };
    }

    // Create approval record
    await supabase.from('time_approvals').insert({
      time_entry_id: entryId,
      organization_id: organizationId,
      status: 'approved',
      approved_by: approvedBy,
      previous_status: 'pending',
    });

    return {
      success: true,
      entry: transformEntry(entry),
    };
  } catch (error) {
    console.error('Approve time entry error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reject a time entry
 *
 * @param params - Rejection parameters
 * @returns Updated entry or error
 */
export async function rejectTimeEntry(params: RejectEntryParams): Promise<{
  success: boolean;
  entry?: TimeEntry;
  error?: string;
}> {
  try {
    const { entryId, rejectedBy, organizationId, reason } = params;

    const supabase = await getSupabaseServer();

    // Update entry
    const { data: entry, error: entryError } = await supabase
      .from('time_entries')
      .update({
        status: 'rejected',
        approved_by: rejectedBy,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', entryId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (entryError) {
      console.error('Error rejecting entry:', entryError);
      return {
        success: false,
        error: 'Failed to reject entry',
      };
    }

    // Create approval record
    await supabase.from('time_approvals').insert({
      time_entry_id: entryId,
      organization_id: organizationId,
      status: 'rejected',
      approved_by: rejectedBy,
      notes: reason,
      previous_status: 'pending',
    });

    return {
      success: true,
      entry: transformEntry(entry),
    };
  } catch (error) {
    console.error('Reject time entry error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// XERO INTEGRATION
// ============================================================================

/**
 * Sync approved time entries to Xero
 *
 * @param params - Sync parameters
 * @returns Sync result or error
 */
export async function syncToXero(params: SyncToXeroParams): Promise<{
  success: boolean;
  syncedCount?: number;
  error?: string;
}> {
  try {
    const { entryIds, organizationId } = params;

    const supabase = await getSupabaseServer();

    // Get entries
    const { data: entries, error: entriesError } = await supabase
      .from('time_entries')
      .select('*')
      .in('id', entryIds)
      .eq('organization_id', organizationId)
      .eq('status', 'approved')
      .eq('xero_synced', false);

    if (entriesError || !entries || entries.length === 0) {
      return {
        success: false,
        error: 'No eligible entries found for sync',
      };
    }

    // TODO: Implement actual Xero API integration
    // For now, mark as synced with placeholder data
    const syncedAt = new Date().toISOString();

    for (const entry of entries) {
      await supabase
        .from('time_entries')
        .update({
          xero_synced: true,
          xero_timesheet_id: `xero-${entry.id}`,
          xero_synced_at: syncedAt,
          status: 'billed',
        })
        .eq('id', entry.id);
    }

    return {
      success: true,
      syncedCount: entries.length,
    };
  } catch (error) {
    console.error('Sync to Xero error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function transformSession(data: any): TimeSession {
  return {
    id: data.id,
    staffId: data.staff_id,
    organizationId: data.organization_id,
    projectId: data.project_id,
    taskId: data.task_id,
    description: data.description,
    startedAt: data.started_at,
    stoppedAt: data.stopped_at,
    durationSeconds: data.duration_seconds,
    metadata: data.metadata,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function transformEntry(data: any): TimeEntry {
  return {
    id: data.id,
    staffId: data.staff_id,
    organizationId: data.organization_id,
    projectId: data.project_id,
    taskId: data.task_id,
    description: data.description,
    date: data.date,
    hours: parseFloat(data.hours),
    entryType: data.entry_type,
    sessionId: data.session_id,
    billable: data.billable,
    hourlyRate: data.hourly_rate ? parseFloat(data.hourly_rate) : undefined,
    totalAmount: data.total_amount ? parseFloat(data.total_amount) : undefined,
    status: data.status,
    approvedBy: data.approved_by,
    approvedAt: data.approved_at,
    rejectionReason: data.rejection_reason,
    xeroSynced: data.xero_synced,
    xeroTimesheetId: data.xero_timesheet_id,
    xeroSyncedAt: data.xero_synced_at,
    metadata: data.metadata,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
