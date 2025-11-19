/**
 * Staff Time Service
 * Phase 3 Step 8 - Universal Hours Tracking
 *
 * Service layer for time tracking operations.
 * Provides type-safe functions for managing time sessions and entries.
 *
 * Following CLAUDE.md patterns:
 * - Server-side operations
 * - Workspace isolation
 * - Full error handling
 * - Typed responses
 *
 * Usage:
 * ```typescript
 * import { startTimer, stopTimer, getTimeEntries } from '@/lib/services/staff/timeService';
 *
 * const result = await startTimer({
 *   staffId: 'uuid',
 *   organizationId: 'uuid',
 *   projectId: 'proj-123',
 *   taskId: 'task-1',
 *   description: 'Working on feature'
 * });
 * ```
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  startTimeSession,
  stopTimeSession,
  getActiveSession,
  createManualEntry,
  approveTimeEntry,
  rejectTimeEntry,
  type TimeSession,
  type TimeEntry,
} from '@/lib/timetracking/timeEngine';

// Service response types
export interface TimeServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TimeEntriesListResult {
  success: boolean;
  entries?: TimeEntry[];
  totalHours?: number;
  totalAmount?: number;
  error?: string;
  message?: string;
}

export interface TimeSummaryResult {
  success: boolean;
  summary?: {
    today: { hours: number; entries: number; amount: number };
    week: { hours: number; entries: number; amount: number };
    month: { hours: number; entries: number; amount: number };
  };
  error?: string;
}

// Service function input types
export interface GetTimeEntriesParams {
  staffId?: string;
  organizationId: string;
  projectId?: string;
  taskId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status?: 'pending' | 'approved' | 'rejected' | 'billed';
  limit?: number;
  offset?: number;
}

export interface BulkApproveParams {
  entryIds: string[];
  approvedBy: string;
  organizationId: string;
}

/**
 * Get active timer session for a staff member
 *
 * @param staffId - Staff member ID
 * @returns Active session or null
 */
export async function getStaffActiveSession(staffId: string): Promise<TimeServiceResult<TimeSession | null>> {
  try {
    const result = await getActiveSession(staffId);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: result.session,
    };
  } catch (error) {
    console.error('Get active session service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Start a new time tracking session
 *
 * @param params - Session parameters (from timeEngine)
 * @returns Created session or error
 */
export async function startTimer(params: {
  staffId: string;
  organizationId: string;
  projectId?: string;
  taskId?: string;
  description?: string;
}): Promise<TimeServiceResult<TimeSession>> {
  try {
    const result = await startTimeSession(params);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: result.session,
      message: 'Timer started successfully',
    };
  } catch (error) {
    console.error('Start timer service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Stop an active time tracking session
 *
 * @param params - Stop parameters (from timeEngine)
 * @returns Created time entry or error
 */
export async function stopTimer(params: {
  sessionId: string;
  staffId: string;
}): Promise<TimeServiceResult<TimeEntry>> {
  try {
    const result = await stopTimeSession(params);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: result.entry,
      message: 'Timer stopped and time entry created',
    };
  } catch (error) {
    console.error('Stop timer service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a manual time entry
 *
 * @param params - Entry parameters (from timeEngine)
 * @returns Created entry or error
 */
export async function addManualEntry(params: {
  staffId: string;
  organizationId: string;
  projectId?: string;
  taskId?: string;
  date: string;
  hours: number;
  description: string;
  billable?: boolean;
  hourlyRate?: number;
}): Promise<TimeServiceResult<TimeEntry>> {
  try {
    const result = await createManualEntry(params);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: result.entry,
      message: 'Manual time entry created successfully',
    };
  } catch (error) {
    console.error('Add manual entry service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get time entries with filters
 *
 * @param params - Filter parameters
 * @returns Time entries list or error
 */
export async function getTimeEntries(params: GetTimeEntriesParams): Promise<TimeEntriesListResult> {
  try {
    const {
      staffId,
      organizationId,
      projectId,
      taskId,
      startDate,
      endDate,
      status,
      limit = 50,
      offset = 0,
    } = params;

    const supabase = await getSupabaseServer();

    let query = supabase
      .from('time_entries')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: entries, error } = await query;

    if (error) {
      console.error('Error fetching time entries:', error);
      return {
        success: false,
        error: 'Failed to fetch time entries',
      };
    }

    // Calculate totals
    const totalHours = entries.reduce((sum, entry) => sum + parseFloat(entry.hours.toString()), 0);
    const totalAmount = entries.reduce(
      (sum, entry) => sum + (entry.total_amount ? parseFloat(entry.total_amount.toString()) : 0),
      0
    );

    return {
      success: true,
      entries: entries.map((entry: any) => ({
        id: entry.id,
        staffId: entry.staff_id,
        organizationId: entry.organization_id,
        projectId: entry.project_id,
        taskId: entry.task_id,
        description: entry.description,
        date: entry.date,
        hours: parseFloat(entry.hours),
        entryType: entry.entry_type,
        sessionId: entry.session_id,
        billable: entry.billable,
        hourlyRate: entry.hourly_rate ? parseFloat(entry.hourly_rate) : undefined,
        totalAmount: entry.total_amount ? parseFloat(entry.total_amount) : undefined,
        status: entry.status,
        approvedBy: entry.approved_by,
        approvedAt: entry.approved_at,
        rejectionReason: entry.rejection_reason,
        xeroSynced: entry.xero_synced,
        xeroTimesheetId: entry.xero_timesheet_id,
        xeroSyncedAt: entry.xero_synced_at,
        metadata: entry.metadata,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      })),
      totalHours: parseFloat(totalHours.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      message: `Found ${entries.length} time entries`,
    };
  } catch (error) {
    console.error('Get time entries service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get time summary for a staff member
 *
 * @param staffId - Staff member ID
 * @param organizationId - Organization ID
 * @returns Summary for today, this week, this month
 */
export async function getTimeSummary(
  staffId: string,
  organizationId: string
): Promise<TimeSummaryResult> {
  try {
    const supabase = await getSupabaseServer();

    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    // Today's entries
    const { data: todayEntries } = await supabase
      .from('time_entries')
      .select('hours, total_amount')
      .eq('staff_id', staffId)
      .eq('organization_id', organizationId)
      .eq('date', today);

    // This week's entries
    const { data: weekEntries } = await supabase
      .from('time_entries')
      .select('hours, total_amount')
      .eq('staff_id', staffId)
      .eq('organization_id', organizationId)
      .gte('date', weekStartStr);

    // This month's entries
    const { data: monthEntries } = await supabase
      .from('time_entries')
      .select('hours, total_amount')
      .eq('staff_id', staffId)
      .eq('organization_id', organizationId)
      .gte('date', monthStartStr);

    const calculateTotals = (entries: any[]) => {
      if (!entries || entries.length === 0) {
        return { hours: 0, entries: 0, amount: 0 };
      }

      return {
        hours: parseFloat(
          entries.reduce((sum, e) => sum + parseFloat(e.hours.toString()), 0).toFixed(2)
        ),
        entries: entries.length,
        amount: parseFloat(
          entries
            .reduce((sum, e) => sum + (e.total_amount ? parseFloat(e.total_amount.toString()) : 0), 0)
            .toFixed(2)
        ),
      };
    };

    return {
      success: true,
      summary: {
        today: calculateTotals(todayEntries || []),
        week: calculateTotals(weekEntries || []),
        month: calculateTotals(monthEntries || []),
      },
    };
  } catch (error) {
    console.error('Get time summary service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Approve a time entry
 *
 * @param params - Approval parameters (from timeEngine)
 * @returns Updated entry or error
 */
export async function approveEntry(params: {
  entryId: string;
  approvedBy: string;
  organizationId: string;
}): Promise<TimeServiceResult<TimeEntry>> {
  try {
    const result = await approveTimeEntry(params);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: result.entry,
      message: 'Time entry approved successfully',
    };
  } catch (error) {
    console.error('Approve entry service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reject a time entry
 *
 * @param params - Rejection parameters (from timeEngine)
 * @returns Updated entry or error
 */
export async function rejectEntry(params: {
  entryId: string;
  rejectedBy: string;
  organizationId: string;
  reason: string;
}): Promise<TimeServiceResult<TimeEntry>> {
  try {
    const result = await rejectTimeEntry(params);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: result.entry,
      message: 'Time entry rejected',
    };
  } catch (error) {
    console.error('Reject entry service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Bulk approve multiple time entries
 *
 * @param params - Bulk approval parameters
 * @returns Count of approved entries or error
 */
export async function bulkApproveEntries(params: BulkApproveParams): Promise<TimeServiceResult<{ count: number }>> {
  try {
    const { entryIds, approvedBy, organizationId } = params;

    let approvedCount = 0;

    for (const entryId of entryIds) {
      const result = await approveTimeEntry({
        entryId,
        approvedBy,
        organizationId,
      });

      if (result.success) {
        approvedCount++;
      }
    }

    return {
      success: true,
      data: { count: approvedCount },
      message: `Approved ${approvedCount} of ${entryIds.length} entries`,
    };
  } catch (error) {
    console.error('Bulk approve entries service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get pending approvals for an organization
 *
 * @param organizationId - Organization ID
 * @param limit - Max number of entries
 * @returns Pending entries or error
 */
export async function getPendingApprovals(
  organizationId: string,
  limit: number = 50
): Promise<TimeEntriesListResult> {
  try {
    return await getTimeEntries({
      organizationId,
      status: 'pending',
      limit,
      offset: 0,
    });
  } catch (error) {
    console.error('Get pending approvals service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
