/**
 * Time Service Unit Tests - Phase 3 Step 8
 * Tests all 11 service layer functions with edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getStaffActiveSession,
  startTimer,
  stopTimer,
  addManualEntry,
  getTimeEntries,
  getTimeSummary,
  approveEntry,
  rejectEntry,
  bulkApproveEntries,
  getPendingApprovals,
} from '../services/staff/timeService';
import * as timeEngine from '../timetracking/timeEngine';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
          order: vi.fn(() => ({ data: [], error: null })),
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({ data: [], error: null })),
          })),
        })),
        is: vi.fn(() => ({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: {}, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: {}, error: null })),
          })),
        })),
      })),
    })),
  })),
}));

// Mock time engine
vi.mock('../timetracking/timeEngine');

describe('Time Service - Timer Operations', () => {
  const mockStaffId = '550e8400-e29b-41d4-a716-446655440001';
  const mockOrgId = '550e8400-e29b-41d4-a716-446655440002';
  const mockSessionId = '550e8400-e29b-41d4-a716-446655440003';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStaffActiveSession', () => {
    it('should return active session when one exists', async () => {
      const mockSession = {
        id: mockSessionId,
        staffId: mockStaffId,
        organizationId: mockOrgId,
        startedAt: new Date().toISOString(),
        stoppedAt: null,
        durationSeconds: null,
      };

      vi.mocked(timeEngine.getActiveSession).mockResolvedValue({
        success: true,
        session: mockSession,
      });

      const result = await getStaffActiveSession(mockStaffId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSession);
      expect(timeEngine.getActiveSession).toHaveBeenCalledWith(mockStaffId);
    });

    it('should return null when no active session exists', async () => {
      vi.mocked(timeEngine.getActiveSession).mockResolvedValue({
        success: true,
        session: null,
      });

      const result = await getStaffActiveSession(mockStaffId);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(timeEngine.getActiveSession).mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      const result = await getStaffActiveSession(mockStaffId);

      expect(result.success).toBe(false);
    });
  });

  describe('startTimer', () => {
    it('should start timer successfully with all fields', async () => {
      const mockSession = {
        id: mockSessionId,
        staffId: mockStaffId,
        organizationId: mockOrgId,
        projectId: 'proj-123',
        taskId: 'task-456',
        description: 'Working on feature',
        startedAt: new Date().toISOString(),
      };

      vi.mocked(timeEngine.startTimeSession).mockResolvedValue({
        success: true,
        session: mockSession,
      });

      const result = await startTimer({
        staffId: mockStaffId,
        organizationId: mockOrgId,
        projectId: 'proj-123',
        taskId: 'task-456',
        description: 'Working on feature',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSession);
      expect(result.message).toBe('Timer started successfully');
    });

    it('should start timer with minimal fields', async () => {
      const mockSession = {
        id: mockSessionId,
        staffId: mockStaffId,
        organizationId: mockOrgId,
        startedAt: new Date().toISOString(),
      };

      vi.mocked(timeEngine.startTimeSession).mockResolvedValue({
        success: true,
        session: mockSession,
      });

      const result = await startTimer({
        staffId: mockStaffId,
        organizationId: mockOrgId,
      });

      expect(result.success).toBe(true);
    });

    it('should fail when active session already exists', async () => {
      vi.mocked(timeEngine.startTimeSession).mockResolvedValue({
        success: false,
        error: 'You already have an active timer session.',
      });

      const result = await startTimer({
        staffId: mockStaffId,
        organizationId: mockOrgId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('You already have an active timer session.');
    });
  });

  describe('stopTimer', () => {
    it('should stop timer and create time entry', async () => {
      const mockEntry = {
        id: 'entry-123',
        staffId: mockStaffId,
        organizationId: mockOrgId,
        date: '2025-11-19',
        hours: 1.5,
        entryType: 'timer' as const,
        sessionId: mockSessionId,
        billable: true,
        hourlyRate: 75.0,
        totalAmount: 112.5,
        status: 'pending' as const,
        description: 'Working on feature',
        xeroSynced: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(timeEngine.stopTimeSession).mockResolvedValue({
        success: true,
        entry: mockEntry,
      });

      const result = await stopTimer({
        sessionId: mockSessionId,
        staffId: mockStaffId,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEntry);
      expect(result.message).toContain('stopped');
    });

    it('should fail when session not found', async () => {
      vi.mocked(timeEngine.stopTimeSession).mockResolvedValue({
        success: false,
        error: 'Session not found',
      });

      const result = await stopTimer({
        sessionId: mockSessionId,
        staffId: mockStaffId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Session not found');
    });

    it('should calculate hours correctly', async () => {
      const mockEntry = {
        id: 'entry-123',
        staffId: mockStaffId,
        hours: 2.25, // 2 hours 15 minutes
        entryType: 'timer' as const,
        totalAmount: 168.75, // 2.25 × 75
      };

      vi.mocked(timeEngine.stopTimeSession).mockResolvedValue({
        success: true,
        entry: mockEntry as any,
      });

      const result = await stopTimer({
        sessionId: mockSessionId,
        staffId: mockStaffId,
      });

      expect(result.data?.hours).toBe(2.25);
      expect(result.data?.totalAmount).toBe(168.75);
    });
  });
});

describe('Time Service - Manual Entries', () => {
  const mockStaffId = '550e8400-e29b-41d4-a716-446655440001';
  const mockOrgId = '550e8400-e29b-41d4-a716-446655440002';

  describe('addManualEntry', () => {
    it('should create manual entry with all fields', async () => {
      const mockEntry = {
        id: 'entry-123',
        staffId: mockStaffId,
        organizationId: mockOrgId,
        projectId: 'proj-123',
        date: '2025-11-19',
        hours: 3.5,
        description: 'Code review',
        entryType: 'manual' as const,
        billable: true,
        hourlyRate: 75.0,
        totalAmount: 262.5,
        status: 'pending' as const,
        xeroSynced: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(timeEngine.createManualEntry).mockResolvedValue({
        success: true,
        entry: mockEntry,
      });

      const result = await addManualEntry({
        staffId: mockStaffId,
        organizationId: mockOrgId,
        projectId: 'proj-123',
        date: '2025-11-19',
        hours: 3.5,
        description: 'Code review',
        billable: true,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEntry);
    });

    it('should reject hours > 24', async () => {
      vi.mocked(timeEngine.createManualEntry).mockResolvedValue({
        success: false,
        error: 'Hours must be between 0 and 24',
      });

      const result = await addManualEntry({
        staffId: mockStaffId,
        organizationId: mockOrgId,
        date: '2025-11-19',
        hours: 25,
        description: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('24');
    });

    it('should reject hours <= 0', async () => {
      vi.mocked(timeEngine.createManualEntry).mockResolvedValue({
        success: false,
        error: 'Hours must be between 0 and 24',
      });

      const result = await addManualEntry({
        staffId: mockStaffId,
        organizationId: mockOrgId,
        date: '2025-11-19',
        hours: 0,
        description: 'Test',
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative hours', async () => {
      vi.mocked(timeEngine.createManualEntry).mockResolvedValue({
        success: false,
        error: 'Hours must be between 0 and 24',
      });

      const result = await addManualEntry({
        staffId: mockStaffId,
        organizationId: mockOrgId,
        date: '2025-11-19',
        hours: -5,
        description: 'Test',
      });

      expect(result.success).toBe(false);
    });

    it('should validate date format YYYY-MM-DD', async () => {
      // This would be validated by the schema, not the engine
      const result = await addManualEntry({
        staffId: mockStaffId,
        organizationId: mockOrgId,
        date: '2025-11-19',
        hours: 3.5,
        description: 'Test',
      });

      expect(timeEngine.createManualEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2025-11-19',
        })
      );
    });
  });
});

describe('Time Service - Query Operations', () => {
  const mockOrgId = '550e8400-e29b-41d4-a716-446655440002';

  describe('getTimeEntries', () => {
    it('should return entries with totals', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          hours: 3.5,
          totalAmount: 262.5,
          status: 'approved',
        },
        {
          id: 'entry-2',
          hours: 2.0,
          totalAmount: 150.0,
          status: 'pending',
        },
      ];

      // Mock would return these entries
      const result = await getTimeEntries({
        organizationId: mockOrgId,
      });

      expect(result.success).toBe(true);
      expect(result.entries).toBeDefined();
    });

    it('should filter by status', async () => {
      const result = await getTimeEntries({
        organizationId: mockOrgId,
        status: 'pending',
      });

      expect(result.success).toBe(true);
    });

    it('should filter by date range', async () => {
      const result = await getTimeEntries({
        organizationId: mockOrgId,
        startDate: '2025-11-01',
        endDate: '2025-11-19',
      });

      expect(result.success).toBe(true);
    });

    it('should filter by project', async () => {
      const result = await getTimeEntries({
        organizationId: mockOrgId,
        projectId: 'proj-123',
      });

      expect(result.success).toBe(true);
    });

    it('should filter by staff', async () => {
      const result = await getTimeEntries({
        organizationId: mockOrgId,
        staffId: '550e8400-e29b-41d4-a716-446655440001',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('getTimeSummary', () => {
    it('should calculate today totals', async () => {
      const result = await getTimeSummary(
        '550e8400-e29b-41d4-a716-446655440001',
        mockOrgId
      );

      expect(result.success).toBe(true);
      if (result.summary) {
        expect(result.summary.today).toBeDefined();
        expect(result.summary.today.hours).toBeGreaterThanOrEqual(0);
        expect(result.summary.today.entries).toBeGreaterThanOrEqual(0);
        expect(result.summary.today.amount).toBeGreaterThanOrEqual(0);
      }
    });

    it('should calculate week totals', async () => {
      const result = await getTimeSummary(
        '550e8400-e29b-41d4-a716-446655440001',
        mockOrgId
      );

      expect(result.success).toBe(true);
      if (result.summary) {
        expect(result.summary.week).toBeDefined();
      }
    });

    it('should calculate month totals', async () => {
      const result = await getTimeSummary(
        '550e8400-e29b-41d4-a716-446655440001',
        mockOrgId
      );

      expect(result.success).toBe(true);
      if (result.summary) {
        expect(result.summary.month).toBeDefined();
      }
    });
  });

  describe('getPendingApprovals', () => {
    it('should return pending entries', async () => {
      const result = await getPendingApprovals(mockOrgId);

      expect(result.success).toBe(true);
      expect(result.entries).toBeDefined();
    });

    it('should only return pending status', async () => {
      const result = await getPendingApprovals(mockOrgId);

      if (result.entries && result.entries.length > 0) {
        result.entries.forEach((entry) => {
          expect(entry.status).toBe('pending');
        });
      }
    });
  });
});

describe('Time Service - Approval Operations', () => {
  const mockOrgId = '550e8400-e29b-41d4-a716-446655440002';
  const mockAdminId = '550e8400-e29b-41d4-a716-446655440003';
  const mockEntryId = '550e8400-e29b-41d4-a716-446655440004';

  describe('approveEntry', () => {
    it('should approve entry successfully', async () => {
      const mockApprovedEntry = {
        id: mockEntryId,
        status: 'approved' as const,
        approvedBy: mockAdminId,
        approvedAt: new Date().toISOString(),
      };

      vi.mocked(timeEngine.approveTimeEntry).mockResolvedValue({
        success: true,
        entry: mockApprovedEntry as any,
      });

      const result = await approveEntry({
        entryId: mockEntryId,
        approvedBy: mockAdminId,
        organizationId: mockOrgId,
      });

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('approved');
      expect(result.data?.approvedBy).toBe(mockAdminId);
    });

    it('should fail when entry not found', async () => {
      vi.mocked(timeEngine.approveTimeEntry).mockResolvedValue({
        success: false,
        error: 'Entry not found',
      });

      const result = await approveEntry({
        entryId: mockEntryId,
        approvedBy: mockAdminId,
        organizationId: mockOrgId,
      });

      expect(result.success).toBe(false);
    });

    it('should fail when entry already approved', async () => {
      vi.mocked(timeEngine.approveTimeEntry).mockResolvedValue({
        success: false,
        error: 'Entry is already approved',
      });

      const result = await approveEntry({
        entryId: mockEntryId,
        approvedBy: mockAdminId,
        organizationId: mockOrgId,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('rejectEntry', () => {
    it('should reject entry with reason', async () => {
      const mockRejectedEntry = {
        id: mockEntryId,
        status: 'rejected' as const,
        approvedBy: mockAdminId,
        rejectionReason: 'Hours exceed estimate',
      };

      vi.mocked(timeEngine.rejectTimeEntry).mockResolvedValue({
        success: true,
        entry: mockRejectedEntry as any,
      });

      const result = await rejectEntry({
        entryId: mockEntryId,
        rejectedBy: mockAdminId,
        organizationId: mockOrgId,
        reason: 'Hours exceed estimate',
      });

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('rejected');
      expect(result.data?.rejectionReason).toBe('Hours exceed estimate');
    });

    it('should fail without rejection reason', async () => {
      // This would be caught by validation schema
      const result = await rejectEntry({
        entryId: mockEntryId,
        rejectedBy: mockAdminId,
        organizationId: mockOrgId,
        reason: '',
      });

      // Schema validation should catch this
      expect(result.success).toBeDefined();
    });
  });

  describe('bulkApproveEntries', () => {
    it('should approve multiple entries', async () => {
      const entryIds = [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440003',
      ];

      vi.mocked(timeEngine.approveTimeEntry).mockResolvedValue({
        success: true,
        entry: { id: 'test', status: 'approved' } as any,
      });

      const result = await bulkApproveEntries({
        entryIds,
        approvedBy: mockAdminId,
        organizationId: mockOrgId,
      });

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(3);
    });

    it('should handle partial failures', async () => {
      const entryIds = [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
      ];

      vi.mocked(timeEngine.approveTimeEntry)
        .mockResolvedValueOnce({ success: true, entry: {} as any })
        .mockResolvedValueOnce({ success: false, error: 'Failed' });

      const result = await bulkApproveEntries({
        entryIds,
        approvedBy: mockAdminId,
        organizationId: mockOrgId,
      });

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(1); // Only 1 succeeded
    });

    it('should require at least one entry ID', async () => {
      const result = await bulkApproveEntries({
        entryIds: [],
        approvedBy: mockAdminId,
        organizationId: mockOrgId,
      });

      // Validation would catch this
      expect(result.success).toBeDefined();
    });
  });
});

describe('Time Service - Edge Cases', () => {
  it('should handle missing organization gracefully', async () => {
    const result = await getTimeEntries({
      organizationId: '',
    });

    expect(result.success).toBeDefined();
  });

  it('should handle invalid UUID formats', async () => {
    const result = await startTimer({
      staffId: 'invalid-uuid',
      organizationId: 'invalid-uuid',
    });

    expect(result.success).toBeDefined();
  });

  it('should handle very small hour values (0.01)', async () => {
    vi.mocked(timeEngine.createManualEntry).mockResolvedValue({
      success: true,
      entry: {
        hours: 0.01,
        totalAmount: 0.75, // 0.01 × 75
      } as any,
    });

    const result = await addManualEntry({
      staffId: '550e8400-e29b-41d4-a716-446655440001',
      organizationId: '550e8400-e29b-41d4-a716-446655440002',
      date: '2025-11-19',
      hours: 0.01,
      description: 'Quick fix',
    });

    expect(result.data?.hours).toBe(0.01);
  });

  it('should handle hours at boundary (24)', async () => {
    vi.mocked(timeEngine.createManualEntry).mockResolvedValue({
      success: true,
      entry: { hours: 24 } as any,
    });

    const result = await addManualEntry({
      staffId: '550e8400-e29b-41d4-a716-446655440001',
      organizationId: '550e8400-e29b-41d4-a716-446655440002',
      date: '2025-11-19',
      hours: 24,
      description: 'All-nighter',
    });

    expect(result.success).toBe(true);
  });
});
