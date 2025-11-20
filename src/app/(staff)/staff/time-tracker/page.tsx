// Force dynamic
export const dynamic = 'force-dynamic';
'use client';

/**
 * Staff Time Tracker Page - Phase 3 Step 8
 *
 * Complete time tracking interface with:
 * - Active timer display with start/stop controls
 * - Real-time timer counter
 * - Manual entry modal with date picker
 * - Time entries table with sorting/filtering
 * - Daily/weekly/monthly summary cards
 * - Pending approvals section (for admins)
 * - Export to CSV functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Play,
  Square,
  Plus,
  Clock,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  RefreshCcw,
} from 'lucide-react';
import { format } from 'date-fns';

// Types
interface TimeSession {
  id: string;
  staffId: string;
  organizationId: string;
  projectId?: string;
  taskId?: string;
  description?: string;
  startedAt: string;
  stoppedAt?: string;
  durationSeconds?: number;
}

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
  sessionId?: string;
  billable: boolean;
  hourlyRate?: number;
  totalAmount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'billed';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  xeroSynced: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TimeSummary {
  today: { hours: number; entries: number; amount: number };
  week: { hours: number; entries: number; amount: number };
  month: { hours: number; entries: number; amount: number };
}

export default function StaffTimeTrackerPage() {
  const { user, currentOrganization } = useAuth();
  const [activeSession, setActiveSession] = useState<TimeSession | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [summary, setSummary] = useState<TimeSummary | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Manual entry form state
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualEntryData, setManualEntryData] = useState({
    projectId: '',
    taskId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: '',
    description: '',
    billable: true,
  });

  // Timer form state
  const [timerDescription, setTimerDescription] = useState('');
  const [timerProjectId, setTimerProjectId] = useState('');

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // User role
  const [userRole, setUserRole] = useState<string>('staff');

  // Get organization ID
  const organizationId = currentOrganization?.org_id;

  // Get auth token
  const getAuthToken = useCallback(async () => {
    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token;
  }, []);

  // Fetch active session
  const fetchActiveSession = useCallback(async () => {
    if (!user || !organizationId) return;

    try {
      const token = await getAuthToken();
      const response = await fetch('/api/staff/time/start', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActiveSession(data.session);

        // Calculate elapsed time
        if (data.session?.startedAt) {
          const elapsed = Math.floor(
            (new Date().getTime() - new Date(data.session.startedAt).getTime()) / 1000
          );
          setTimerSeconds(elapsed);
        }
      }
    } catch (err) {
      console.error('Error fetching active session:', err);
    }
  }, [user, organizationId, getAuthToken]);

  // Fetch time entries
  const fetchTimeEntries = useCallback(async () => {
    if (!user || !organizationId) return;

    try {
      setLoading(true);
      const token = await getAuthToken();

      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);

      const response = await fetch(`/api/staff/time/entries?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      }
    } catch (err) {
      console.error('Error fetching entries:', err);
      setError('Failed to load time entries');
    } finally {
      setLoading(false);
    }
  }, [user, organizationId, filterStatus, filterStartDate, filterEndDate, getAuthToken]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    if (!user || !organizationId) return;

    try {
      const token = await getAuthToken();
      const response = await fetch('/api/staff/time/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  }, [user, organizationId, getAuthToken]);

  // Fetch pending approvals (admin only)
  const fetchPendingApprovals = useCallback(async () => {
    if (!user || !organizationId || userRole !== 'admin') return;

    try {
      const token = await getAuthToken();
      const response = await fetch('/api/staff/time/entries?status=pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingApprovals(data.entries || []);
      }
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
    }
  }, [user, organizationId, userRole, getAuthToken]);

  // Start timer
  const handleStartTimer = async () => {
    if (!user || !organizationId) return;

    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();

      const response = await fetch('/api/staff/time/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: timerProjectId || undefined,
          description: timerDescription,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setActiveSession(data.session);
        setTimerSeconds(0);
        setSuccess('Timer started successfully');
        setTimerDescription('');
        setTimerProjectId('');
      } else {
        setError(data.error || 'Failed to start timer');
      }
    } catch (err) {
      console.error('Error starting timer:', err);
      setError('Failed to start timer');
    } finally {
      setLoading(false);
    }
  };

  // Stop timer
  const handleStopTimer = async () => {
    if (!activeSession) return;

    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();

      const response = await fetch('/api/staff/time/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: activeSession.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setActiveSession(null);
        setTimerSeconds(0);
        setSuccess(`Timer stopped. Logged ${data.entry.hours} hours.`);
        fetchTimeEntries();
        fetchSummary();
      } else {
        setError(data.error || 'Failed to stop timer');
      }
    } catch (err) {
      console.error('Error stopping timer:', err);
      setError('Failed to stop timer');
    } finally {
      setLoading(false);
    }
  };

  // Create manual entry
  const handleCreateManualEntry = async () => {
    if (!user || !organizationId) return;

    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();

      const response = await fetch('/api/staff/time/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: manualEntryData.projectId || undefined,
          taskId: manualEntryData.taskId || undefined,
          date: manualEntryData.date,
          hours: parseFloat(manualEntryData.hours),
          description: manualEntryData.description,
          billable: manualEntryData.billable,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Manual entry created: ${data.entry.hours} hours`);
        setManualEntryOpen(false);
        setManualEntryData({
          projectId: '',
          taskId: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          hours: '',
          description: '',
          billable: true,
        });
        fetchTimeEntries();
        fetchSummary();
      } else {
        setError(data.error || 'Failed to create manual entry');
      }
    } catch (err) {
      console.error('Error creating manual entry:', err);
      setError('Failed to create manual entry');
    } finally {
      setLoading(false);
    }
  };

  // Approve entry (admin only)
  const handleApproveEntry = async (entryId: string) => {
    if (!user || !organizationId) return;

    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();

      const response = await fetch('/api/staff/time/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          entryId,
          action: 'approve',
        }),
      });

      if (response.ok) {
        setSuccess('Entry approved successfully');
        fetchTimeEntries();
        fetchPendingApprovals();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to approve entry');
      }
    } catch (err) {
      console.error('Error approving entry:', err);
      setError('Failed to approve entry');
    } finally {
      setLoading(false);
    }
  };

  // Reject entry (admin only)
  const handleRejectEntry = async (entryId: string, reason: string) => {
    if (!user || !organizationId) return;

    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();

      const response = await fetch('/api/staff/time/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          entryId,
          action: 'reject',
          reason,
        }),
      });

      if (response.ok) {
        setSuccess('Entry rejected successfully');
        fetchTimeEntries();
        fetchPendingApprovals();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to reject entry');
      }
    } catch (err) {
      console.error('Error rejecting entry:', err);
      setError('Failed to reject entry');
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (entries.length === 0) return;

    const headers = [
      'Date',
      'Description',
      'Hours',
      'Type',
      'Billable',
      'Rate',
      'Amount',
      'Status',
      'Created',
    ];

    const rows = entries.map((entry) => [
      entry.date,
      entry.description,
      entry.hours.toString(),
      entry.entryType,
      entry.billable ? 'Yes' : 'No',
      entry.hourlyRate?.toString() || '',
      entry.totalAmount?.toString() || '',
      entry.status,
      format(new Date(entry.createdAt), 'yyyy-MM-dd HH:mm'),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `time-entries-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Timer tick effect
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Initial data fetch
  useEffect(() => {
    fetchActiveSession();
    fetchTimeEntries();
    fetchSummary();
  }, [fetchActiveSession, fetchTimeEntries, fetchSummary]);

  // Fetch pending approvals for admins
  useEffect(() => {
    if (userRole === 'admin') {
      fetchPendingApprovals();
    }
  }, [userRole, fetchPendingApprovals]);

  // Auto-dismiss alerts
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Format timer display
  const formatTimer = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      billed: 'outline',
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (!user || !organizationId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Please log in to access time tracking.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Tracker</h1>
          <p className="text-muted-foreground">Track your hours and manage time entries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTimeEntries}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={entries.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{summary.today.hours.toFixed(2)}h</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.today.entries} entries • ${summary.today.amount.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{summary.week.hours.toFixed(2)}h</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.week.entries} entries • ${summary.week.amount.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{summary.month.hours.toFixed(2)}h</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.month.entries} entries • ${summary.month.amount.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timer Card */}
      <Card>
        <CardHeader>
          <CardTitle>Active Timer</CardTitle>
          <CardDescription>Start or stop your time tracking session</CardDescription>
        </CardHeader>
        <CardContent>
          {activeSession ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Running</p>
                  <p className="text-5xl font-mono font-bold">{formatTimer(timerSeconds)}</p>
                  {activeSession.description && (
                    <p className="text-sm text-muted-foreground mt-2">{activeSession.description}</p>
                  )}
                </div>
              </div>
              <Button onClick={handleStopTimer} disabled={loading} className="w-full" variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                Stop Timer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timer-description">Description (optional)</Label>
                <Textarea
                  id="timer-description"
                  placeholder="What are you working on?"
                  value={timerDescription}
                  onChange={(e) => setTimerDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleStartTimer} disabled={loading} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Start Timer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Entry Dialog */}
      <Dialog open={manualEntryOpen} onOpenChange={setManualEntryOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Manual Entry
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Manual Time Entry</DialogTitle>
            <DialogDescription>Enter time manually without using the timer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="manual-date">Date</Label>
              <Input
                id="manual-date"
                type="date"
                value={manualEntryData.date}
                onChange={(e) =>
                  setManualEntryData({ ...manualEntryData, date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-hours">Hours</Label>
              <Input
                id="manual-hours"
                type="number"
                step="0.25"
                min="0"
                max="24"
                placeholder="0.00"
                value={manualEntryData.hours}
                onChange={(e) =>
                  setManualEntryData({ ...manualEntryData, hours: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-description">Description</Label>
              <Textarea
                id="manual-description"
                placeholder="What did you work on?"
                value={manualEntryData.description}
                onChange={(e) =>
                  setManualEntryData({ ...manualEntryData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="manual-billable"
                checked={manualEntryData.billable}
                onChange={(e) =>
                  setManualEntryData({ ...manualEntryData, billable: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="manual-billable">Billable</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualEntryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateManualEntry} disabled={loading}>
              Create Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="billed">Billed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>
            Showing {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No time entries found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  {userRole === 'admin' && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(entry.date), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {entry.hours.toFixed(2)}h
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.entryType}</Badge>
                    </TableCell>
                    <TableCell>
                      {entry.totalAmount ? (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          ${entry.totalAmount.toFixed(2)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    {userRole === 'admin' && (
                      <TableCell>
                        {entry.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveEntry(entry.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const reason = prompt('Rejection reason:');
                                if (reason) handleRejectEntry(entry.id, reason);
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Approvals (Admin Only) */}
      {userRole === 'admin' && pendingApprovals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>
              {pendingApprovals.length} {pendingApprovals.length === 1 ? 'entry' : 'entries'} awaiting approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovals.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.staffId}</TableCell>
                    <TableCell>{format(new Date(entry.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                    <TableCell>{entry.hours.toFixed(2)}h</TableCell>
                    <TableCell>
                      {entry.totalAmount ? `$${entry.totalAmount.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveEntry(entry.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const reason = prompt('Rejection reason:');
                            if (reason) handleRejectEntry(entry.id, reason);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
