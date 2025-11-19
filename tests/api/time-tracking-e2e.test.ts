/**
 * Time Tracking End-to-End Tests - Phase 3 Step 8 Priority 2
 *
 * Comprehensive E2E tests covering:
 * - Complete timer workflow (start → stop → approve → sync)
 * - Complete manual entry workflow (create → approve → sync)
 * - Client view rendering and filters
 * - Xero sync workflow
 * - Multi-user scenarios
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Test configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008';
let staffToken: string;
let adminToken: string;
let clientToken: string;
let organizationId: string;
let projectId: string;
let activeSessionId: string;
let timerEntryId: string;
let manualEntryId: string;

// Setup test environment
const setupTestEnvironment = async () => {
  // In real implementation:
  // 1. Create test organization
  // 2. Create test users (staff, admin, client)
  // 3. Get auth tokens
  // 4. Create test project

  staffToken = process.env.TEST_STAFF_TOKEN || 'test-staff-token';
  adminToken = process.env.TEST_ADMIN_TOKEN || 'test-admin-token';
  clientToken = process.env.TEST_CLIENT_TOKEN || 'test-client-token';
  organizationId = process.env.TEST_ORG_ID || '550e8400-e29b-41d4-a716-446655440000';
  projectId = process.env.TEST_PROJECT_ID || 'proj-test-123';
};

const cleanupTestEnvironment = async () => {
  // Clean up test data
  // In real implementation: delete test entries, sessions, project, users
};

beforeAll(async () => {
  await setupTestEnvironment();
});

afterAll(async () => {
  await cleanupTestEnvironment();
});

describe('E2E - Complete Timer Workflow', () => {
  it('should complete full timer lifecycle: start → stop → approve → sync', async () => {
    // Step 1: Start timer
    const startResponse = await fetch(`${API_BASE_URL}/api/staff/time/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        projectId,
        description: 'E2E test timer session',
      }),
    });

    expect(startResponse.status).toBe(201);
    const startData = await startResponse.json();
    expect(startData.success).toBe(true);
    expect(startData.session).toBeDefined();
    activeSessionId = startData.session.id;

    // Step 2: Wait 2 seconds to simulate work
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 3: Stop timer
    const stopResponse = await fetch(`${API_BASE_URL}/api/staff/time/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        sessionId: activeSessionId,
      }),
    });

    expect(stopResponse.status).toBe(200);
    const stopData = await stopResponse.json();
    expect(stopData.success).toBe(true);
    expect(stopData.entry).toBeDefined();
    expect(stopData.entry.hours).toBeGreaterThan(0);
    expect(stopData.entry.status).toBe('pending');
    timerEntryId = stopData.entry.id;

    // Step 4: Verify entry appears in staff's list
    const listResponse = await fetch(
      `${API_BASE_URL}/api/staff/time/entries?status=pending`,
      {
        headers: {
          'Authorization': `Bearer ${staffToken}`,
        },
      }
    );

    expect(listResponse.status).toBe(200);
    const listData = await listResponse.json();
    expect(listData.success).toBe(true);
    const foundEntry = listData.entries.find((e: any) => e.id === timerEntryId);
    expect(foundEntry).toBeDefined();

    // Step 5: Admin approves entry
    const approveResponse = await fetch(`${API_BASE_URL}/api/staff/time/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        entryId: timerEntryId,
        action: 'approve',
      }),
    });

    expect(approveResponse.status).toBe(200);
    const approveData = await approveResponse.json();
    expect(approveData.success).toBe(true);
    expect(approveData.entry.status).toBe('approved');

    // Step 6: Sync to Xero (stub)
    const syncResponse = await fetch(`${API_BASE_URL}/api/staff/time/xero-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        entryIds: [timerEntryId],
      }),
    });

    expect(syncResponse.status).toBe(200);
    const syncData = await syncResponse.json();
    expect(syncData.success).toBe(true);
    expect(syncData.syncedCount).toBe(1);
    expect(syncData.message).toContain('STUB');

    // Step 7: Verify sync status
    const statusResponse = await fetch(
      `${API_BASE_URL}/api/staff/time/xero-sync?entryIds=${timerEntryId}`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      }
    );

    expect(statusResponse.status).toBe(200);
    const statusData = await statusResponse.json();
    expect(statusData.success).toBe(true);
    expect(statusData.status[0].synced).toBe(true);
  });
});

describe('E2E - Complete Manual Entry Workflow', () => {
  it('should complete full manual entry lifecycle: create → approve → sync', async () => {
    // Step 1: Create manual entry
    const createResponse = await fetch(`${API_BASE_URL}/api/staff/time/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        projectId,
        date: '2025-11-19',
        hours: 4.5,
        description: 'E2E test manual entry',
        billable: true,
      }),
    });

    expect(createResponse.status).toBe(201);
    const createData = await createResponse.json();
    expect(createData.success).toBe(true);
    expect(createData.entry.hours).toBe(4.5);
    expect(createData.entry.status).toBe('pending');
    manualEntryId = createData.entry.id;

    // Step 2: Admin approves entry
    const approveResponse = await fetch(`${API_BASE_URL}/api/staff/time/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        entryId: manualEntryId,
        action: 'approve',
      }),
    });

    expect(approveResponse.status).toBe(200);
    const approveData = await approveResponse.json();
    expect(approveData.entry.status).toBe('approved');

    // Step 3: Sync to Xero
    const syncResponse = await fetch(`${API_BASE_URL}/api/staff/time/xero-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        entryIds: [manualEntryId],
      }),
    });

    expect(syncResponse.status).toBe(200);
    const syncData = await syncResponse.json();
    expect(syncData.success).toBe(true);
    expect(syncData.syncedCount).toBe(1);
  });
});

describe('E2E - Client View Tests', () => {
  it('should display approved entries to client', async () => {
    // Ensure we have approved entries (from previous tests)
    const response = await fetch(
      `${API_BASE_URL}/api/staff/time/entries?projectId=${projectId}&status=approved`,
      {
        headers: {
          'Authorization': `Bearer ${clientToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.entries).toBeDefined();
    expect(Array.isArray(data.entries)).toBe(true);

    // Should have at least 2 approved entries from previous workflows
    expect(data.entries.length).toBeGreaterThanOrEqual(2);

    // All entries should be approved
    data.entries.forEach((entry: any) => {
      expect(entry.status).toBe('approved');
    });

    // Should have totals
    expect(data.totalHours).toBeDefined();
    expect(data.totalAmount).toBeDefined();
  });

  it('should filter entries by date range', async () => {
    const startDate = '2025-11-01';
    const endDate = '2025-11-30';

    const response = await fetch(
      `${API_BASE_URL}/api/staff/time/entries?projectId=${projectId}&status=approved&startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          'Authorization': `Bearer ${clientToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify all entries are within date range
    data.entries.forEach((entry: any) => {
      const entryDate = new Date(entry.date);
      expect(entryDate >= new Date(startDate)).toBe(true);
      expect(entryDate <= new Date(endDate)).toBe(true);
    });
  });

  it('should calculate correct totals', async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/staff/time/entries?projectId=${projectId}&status=approved`,
      {
        headers: {
          'Authorization': `Bearer ${clientToken}`,
        },
      }
    );

    const data = await response.json();

    // Manually calculate totals to verify
    const manualTotalHours = data.entries.reduce(
      (sum: number, entry: any) => sum + entry.hours,
      0
    );
    const manualTotalAmount = data.entries.reduce(
      (sum: number, entry: any) => sum + (entry.totalAmount || 0),
      0
    );

    expect(Math.abs(data.totalHours - manualTotalHours)).toBeLessThan(0.01);
    expect(Math.abs(data.totalAmount - manualTotalAmount)).toBeLessThan(0.01);
  });

  it('should not show pending or rejected entries to client', async () => {
    // Create a pending entry
    const createResponse = await fetch(`${API_BASE_URL}/api/staff/time/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        projectId,
        date: '2025-11-19',
        hours: 1.0,
        description: 'Should not be visible to client',
      }),
    });

    const createData = await createResponse.json();
    const pendingEntryId = createData.entry.id;

    // Client queries approved entries
    const response = await fetch(
      `${API_BASE_URL}/api/staff/time/entries?projectId=${projectId}&status=approved`,
      {
        headers: {
          'Authorization': `Bearer ${clientToken}`,
        },
      }
    );

    const data = await response.json();

    // Pending entry should not appear
    const foundPending = data.entries.find((e: any) => e.id === pendingEntryId);
    expect(foundPending).toBeUndefined();
  });
});

describe('E2E - Bulk Operations', () => {
  it('should bulk approve multiple entries', async () => {
    // Create 3 entries
    const entryIds: string[] = [];

    for (let i = 0; i < 3; i++) {
      const response = await fetch(`${API_BASE_URL}/api/staff/time/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          projectId,
          date: '2025-11-19',
          hours: 1.0,
          description: `Bulk test entry ${i + 1}`,
        }),
      });

      const data = await response.json();
      entryIds.push(data.entry.id);
    }

    // Bulk approve
    const approveResponse = await fetch(`${API_BASE_URL}/api/staff/time/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        entryIds,
        action: 'approve',
      }),
    });

    expect(approveResponse.status).toBe(200);
    const approveData = await approveResponse.json();
    expect(approveData.success).toBe(true);
    expect(approveData.count).toBe(3);

    // Verify all are approved
    const listResponse = await fetch(
      `${API_BASE_URL}/api/staff/time/entries?status=approved`,
      {
        headers: {
          'Authorization': `Bearer ${staffToken}`,
        },
      }
    );

    const listData = await listResponse.json();
    entryIds.forEach((id) => {
      const entry = listData.entries.find((e: any) => e.id === id);
      expect(entry).toBeDefined();
      expect(entry.status).toBe('approved');
    });
  });

  it('should bulk sync multiple entries to Xero', async () => {
    // Get approved entries
    const listResponse = await fetch(
      `${API_BASE_URL}/api/staff/time/entries?status=approved&projectId=${projectId}`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      }
    );

    const listData = await listResponse.json();
    const unsyncedEntries = listData.entries
      .filter((e: any) => !e.xeroSynced)
      .slice(0, 5); // Take up to 5 entries

    if (unsyncedEntries.length === 0) {
      console.log('No unsynced entries for bulk sync test');
      return;
    }

    const entryIds = unsyncedEntries.map((e: any) => e.id);

    // Bulk sync
    const syncResponse = await fetch(`${API_BASE_URL}/api/staff/time/xero-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        entryIds,
      }),
    });

    expect(syncResponse.status).toBe(200);
    const syncData = await syncResponse.json();
    expect(syncData.success).toBe(true);
    expect(syncData.syncedCount).toBe(entryIds.length);
  });
});

describe('E2E - Multi-User Scenarios', () => {
  it('should prevent staff from approving their own entries', async () => {
    // Create entry as staff
    const createResponse = await fetch(`${API_BASE_URL}/api/staff/time/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        projectId,
        date: '2025-11-19',
        hours: 2.0,
        description: 'Self-approval test',
      }),
    });

    const createData = await createResponse.json();
    const entryId = createData.entry.id;

    // Try to approve as same staff member
    const approveResponse = await fetch(`${API_BASE_URL}/api/staff/time/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`, // Staff trying to approve
      },
      body: JSON.stringify({
        entryId,
        action: 'approve',
      }),
    });

    expect(approveResponse.status).toBe(403); // Forbidden
  });

  it('should prevent staff from syncing to Xero', async () => {
    const syncResponse = await fetch(`${API_BASE_URL}/api/staff/time/xero-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`, // Staff trying to sync
      },
      body: JSON.stringify({
        entryIds: [timerEntryId],
      }),
    });

    expect(syncResponse.status).toBe(403); // Forbidden
  });

  it('should allow admin to view all staff entries', async () => {
    const response = await fetch(`${API_BASE_URL}/api/staff/time/entries`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    // Should see entries from all staff members
    expect(data.entries.length).toBeGreaterThan(0);
  });
});

describe('E2E - Error Handling', () => {
  it('should reject timer start when session already active', async () => {
    // Start first timer
    const start1 = await fetch(`${API_BASE_URL}/api/staff/time/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        description: 'First timer',
      }),
    });

    const data1 = await start1.json();
    activeSessionId = data1.session.id;

    // Try to start second timer
    const start2 = await fetch(`${API_BASE_URL}/api/staff/time/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        description: 'Second timer',
      }),
    });

    expect(start2.status).toBe(400);
    const data2 = await start2.json();
    expect(data2.success).toBe(false);
    expect(data2.error).toContain('active');

    // Clean up - stop timer
    await fetch(`${API_BASE_URL}/api/staff/time/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        sessionId: activeSessionId,
      }),
    });
  });

  it('should reject manual entry with invalid hours', async () => {
    const response = await fetch(`${API_BASE_URL}/api/staff/time/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        projectId,
        date: '2025-11-19',
        hours: 30, // Invalid: > 24
        description: 'Invalid hours',
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should reject Xero sync of pending entries', async () => {
    // Create pending entry
    const createResponse = await fetch(`${API_BASE_URL}/api/staff/time/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        projectId,
        date: '2025-11-19',
        hours: 1.0,
        description: 'Pending entry for sync test',
      }),
    });

    const createData = await createResponse.json();
    const pendingId = createData.entry.id;

    // Try to sync pending entry
    const syncResponse = await fetch(`${API_BASE_URL}/api/staff/time/xero-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        entryIds: [pendingId],
      }),
    });

    const syncData = await syncResponse.json();
    expect(syncData.success).toBe(false);
    expect(syncData.syncedCount).toBe(0);
  });
});
