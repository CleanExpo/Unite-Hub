'use client';

/**
 * Client Project Time View - Phase 3 Step 8 Priority 2
 *
 * Client-facing page showing:
 * - Summary totals (billable hours, non-billable hours, total cost)
 * - Table of approved time entries only
 * - Date range filters
 * - Read-only view (no editing/approval capabilities)
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Download } from 'lucide-react';
import ClientTimeSummary from '@/components/client/ClientTimeSummary';
import ClientTimeTable from '@/components/client/ClientTimeTable';
import { format } from 'date-fns';

interface TimeEntry {
  id: string;
  staffId: string;
  organizationId: string;
  projectId?: string;
  taskId?: string;
  description: string;
  date: string;
  hours: number;
  entryType: 'timer' | 'manual';
  billable: boolean;
  hourlyRate?: number;
  totalAmount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'billed';
  approvedBy?: string;
  approvedAt?: string;
  xeroSynced: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TimeSummary {
  billableHours: number;
  nonBillableHours: number;
  totalHours: number;
  totalCost: number;
  entriesCount: number;
}

export default function ClientProjectTimePage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user, currentOrganization } = useAuth();

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [summary, setSummary] = useState<TimeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 20;

  const organizationId = currentOrganization?.org_id;

  // Get auth token
  const getAuthToken = useCallback(async () => {
    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token;
  }, []);

  // Fetch time entries for this project
  const fetchTimeEntries = useCallback(async () => {
    if (!user || !organizationId || !projectId) return;

    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();

      const params = new URLSearchParams({
        projectId,
        status: 'approved', // Only show approved entries to clients
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/staff/time/entries?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);

        // Calculate summary
        const billableHours = data.entries
          .filter((e: TimeEntry) => e.billable)
          .reduce((sum: number, e: TimeEntry) => sum + e.hours, 0);

        const nonBillableHours = data.entries
          .filter((e: TimeEntry) => !e.billable)
          .reduce((sum: number, e: TimeEntry) => sum + e.hours, 0);

        const totalCost = data.entries
          .filter((e: TimeEntry) => e.billable)
          .reduce((sum: number, e: TimeEntry) => sum + (e.totalAmount || 0), 0);

        setSummary({
          billableHours: parseFloat(billableHours.toFixed(2)),
          nonBillableHours: parseFloat(nonBillableHours.toFixed(2)),
          totalHours: parseFloat((billableHours + nonBillableHours).toFixed(2)),
          totalCost: parseFloat(totalCost.toFixed(2)),
          entriesCount: data.entries.length,
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to load time entries');
      }
    } catch (err) {
      console.error('Error fetching time entries:', err);
      setError('Failed to load time entries');
    } finally {
      setLoading(false);
    }
  }, [user, organizationId, projectId, startDate, endDate, getAuthToken]);

  // Export to CSV
  const handleExportCSV = () => {
    if (entries.length === 0) return;

    const headers = [
      'Date',
      'Staff Member',
      'Description',
      'Hours',
      'Type',
      'Billable',
      'Rate',
      'Amount',
      'Approved Date',
    ];

    const rows = entries.map((entry) => [
      entry.date,
      entry.staffId, // In real implementation, fetch staff name
      entry.description,
      entry.hours.toString(),
      entry.entryType,
      entry.billable ? 'Yes' : 'No',
      entry.hourlyRate?.toString() || '',
      entry.totalAmount?.toString() || '',
      entry.approvedAt ? format(new Date(entry.approvedAt), 'yyyy-MM-dd') : '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-${projectId}-time-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Initial fetch
  useEffect(() => {
    fetchTimeEntries();
  }, [fetchTimeEntries]);

  // Auto-dismiss error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = entries.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(entries.length / entriesPerPage);

  if (!user || !organizationId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Please log in to view project time.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Time Tracking</h1>
          <p className="text-muted-foreground">
            Approved time entries for project {projectId}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTimeEntries} disabled={loading}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={entries.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Section */}
      {summary && (
        <ClientTimeSummary
          summary={summary}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      )}

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>
            {loading ? (
              'Loading...'
            ) : (
              <>
                Showing {indexOfFirstEntry + 1}-
                {Math.min(indexOfLastEntry, entries.length)} of {entries.length} approved entries
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading time entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No approved time entries found for this project</p>
            </div>
          ) : (
            <>
              <ClientTimeTable entries={currentEntries} />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
