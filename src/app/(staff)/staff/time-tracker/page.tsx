'use client';

// Force dynamic
export const dynamic = 'force-dynamic';

/**
 * Staff Time Tracker Page - Phase 3 Step 8
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { PageContainer, Section } from '@/ui/layout/AppGrid';

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

  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualEntryData, setManualEntryData] = useState({
    projectId: '',
    taskId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: '',
    description: '',
    billable: true,
  });

  const [timerDescription, setTimerDescription] = useState('');
  const [timerProjectId, setTimerProjectId] = useState('');

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [userRole, setUserRole] = useState<string>('staff');

  const organizationId = currentOrganization?.org_id;

  const getAuthToken = useCallback(async () => {
    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token;
  }, []);

  const fetchActiveSession = useCallback(async () => {
    if (!user || !organizationId) return;
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/staff/time/start', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setActiveSession(data.session);
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
        headers: { 'Authorization': `Bearer ${token}` },
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

  const fetchSummary = useCallback(async () => {
    if (!user || !organizationId) return;
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/staff/time/summary', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  }, [user, organizationId, getAuthToken]);

  const fetchPendingApprovals = useCallback(async () => {
    if (!user || !organizationId || userRole !== 'admin') return;
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/staff/time/entries?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPendingApprovals(data.entries || []);
      }
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
    }
  }, [user, organizationId, userRole, getAuthToken]);

  const handleStartTimer = async () => {
    if (!user || !organizationId) return;
    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();
      const response = await fetch('/api/staff/time/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ projectId: timerProjectId || undefined, description: timerDescription }),
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

  const handleStopTimer = async () => {
    if (!activeSession) return;
    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();
      const response = await fetch('/api/staff/time/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ sessionId: activeSession.id }),
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

  const handleCreateManualEntry = async () => {
    if (!user || !organizationId) return;
    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();
      const response = await fetch('/api/staff/time/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

  const handleApproveEntry = async (entryId: string) => {
    if (!user || !organizationId) return;
    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();
      const response = await fetch('/api/staff/time/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ entryId, action: 'approve' }),
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

  const handleRejectEntry = async (entryId: string, reason: string) => {
    if (!user || !organizationId) return;
    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();
      const response = await fetch('/api/staff/time/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ entryId, action: 'reject', reason }),
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

  const handleExportCSV = () => {
    if (entries.length === 0) return;
    const headers = ['Date', 'Description', 'Hours', 'Type', 'Billable', 'Rate', 'Amount', 'Status', 'Created'];
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

  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  useEffect(() => {
    fetchActiveSession();
    fetchTimeEntries();
    fetchSummary();
  }, [fetchActiveSession, fetchTimeEntries, fetchSummary]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchPendingApprovals();
    }
  }, [userRole, fetchPendingApprovals]);

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

  const formatTimer = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'border-[#FFB800]/30 text-[#FFB800]',
      approved: 'border-[#00FF88]/30 text-[#00FF88]',
      rejected: 'border-[#FF4444]/30 text-[#FF4444]',
      billed: 'border-white/10 text-white/40',
    };
    return (
      <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${styles[status] || 'border-white/10 text-white/40'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!user || !organizationId) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050505]">
        <p className="text-white/40 font-mono">Please log in to access time tracking.</p>
      </div>
    );
  }

  return (
    <PageContainer>
      <Section>
        <div className="min-h-screen bg-[#050505] space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white font-mono">Time Tracker</h1>
              <p className="text-white/40 font-mono text-sm mt-1">Track your hours and manage time entries</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchTimeEntries}
                className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 flex items-center gap-2 hover:bg-white/[0.06]"
              >
                <RefreshCcw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleExportCSV}
                disabled={entries.length === 0}
                className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 flex items-center gap-2 hover:bg-white/[0.06] disabled:opacity-40"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-3 border border-[#FF4444]/30 bg-[#FF4444]/10 rounded-sm">
              <p className="text-[#FF4444] font-mono text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-3 border border-[#00FF88]/30 bg-[#00FF88]/10 rounded-sm">
              <p className="text-[#00FF88] font-mono text-sm">{success}</p>
            </div>
          )}

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Today', data: summary.today },
                { label: 'This Week', data: summary.week },
                { label: 'This Month', data: summary.month },
              ].map((item) => (
                <div key={item.label} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
                  <p className="text-xs font-mono text-white/40 mb-2">{item.label}</p>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-white/30" />
                    <span className="text-2xl font-bold text-white font-mono">{item.data.hours.toFixed(2)}h</span>
                  </div>
                  <p className="text-xs text-white/30 font-mono">
                    {item.data.entries} entries · ${item.data.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Timer Card */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
            <div className="p-4 border-b border-white/[0.06]">
              <h2 className="font-mono text-white font-bold">Active Timer</h2>
              <p className="text-xs text-white/40 font-mono mt-0.5">Start or stop your time tracking session</p>
            </div>
            <div className="p-4">
              {activeSession ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center p-8 bg-white/[0.02] border border-white/[0.04] rounded-sm">
                    <div className="text-center">
                      <p className="text-xs text-white/40 font-mono mb-2">Running</p>
                      <p className="text-5xl font-mono font-bold text-[#00F5FF]">{formatTimer(timerSeconds)}</p>
                      {activeSession.description && (
                        <p className="text-sm text-white/40 font-mono mt-2">{activeSession.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleStopTimer}
                    disabled={loading}
                    className="w-full bg-[#FF4444] text-white font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center justify-center gap-2 hover:bg-[#FF4444]/90 disabled:opacity-50"
                  >
                    <Square className="w-4 h-4" />
                    Stop Timer
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Description (optional)</label>
                    <Textarea
                      id="timer-description"
                      placeholder="What are you working on?"
                      value={timerDescription}
                      onChange={(e) => setTimerDescription(e.target.value)}
                      rows={3}
                      className="bg-white/[0.04] border-white/[0.06] text-white placeholder-white/30 font-mono text-sm rounded-sm focus:border-[#00F5FF]/40"
                    />
                  </div>
                  <button
                    onClick={handleStartTimer}
                    disabled={loading}
                    className="w-full bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center justify-center gap-2 hover:bg-[#00F5FF]/90 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    Start Timer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Manual Entry Dialog */}
          <Dialog open={manualEntryOpen} onOpenChange={setManualEntryOpen}>
            <DialogTrigger asChild>
              <button className="w-full bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 flex items-center justify-center gap-2 hover:bg-white/[0.06]">
                <Plus className="w-4 h-4" />
                Add Manual Entry
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-[#0a0a0a] border-white/[0.06]">
              <DialogHeader>
                <DialogTitle className="font-mono text-white">Add Manual Time Entry</DialogTitle>
                <DialogDescription className="text-white/40 font-mono text-sm">Enter time manually without using the timer</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    value={manualEntryData.date}
                    onChange={(e) => setManualEntryData({ ...manualEntryData, date: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-sm px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#00F5FF]/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Hours</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="24"
                    placeholder="0.00"
                    value={manualEntryData.hours}
                    onChange={(e) => setManualEntryData({ ...manualEntryData, hours: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-sm px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#00F5FF]/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Description</label>
                  <Textarea
                    placeholder="What did you work on?"
                    value={manualEntryData.description}
                    onChange={(e) => setManualEntryData({ ...manualEntryData, description: e.target.value })}
                    rows={3}
                    className="bg-white/[0.04] border-white/[0.06] text-white placeholder-white/30 font-mono text-sm rounded-sm focus:border-[#00F5FF]/40"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="manual-billable"
                    checked={manualEntryData.billable}
                    onChange={(e) => setManualEntryData({ ...manualEntryData, billable: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="manual-billable" className="text-sm font-mono text-white/60">Billable</label>
                </div>
              </div>
              <DialogFooter>
                <button
                  onClick={() => setManualEntryOpen(false)}
                  className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 hover:bg-white/[0.06]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateManualEntry}
                  disabled={loading}
                  className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 hover:bg-[#00F5FF]/90 disabled:opacity-50"
                >
                  Create Entry
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Filters */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
            <div className="p-4 border-b border-white/[0.06]">
              <h2 className="font-mono text-white font-bold flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white font-mono text-sm rounded-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/[0.06]">
                      <SelectItem value="all" className="text-white font-mono">All</SelectItem>
                      <SelectItem value="pending" className="text-white font-mono">Pending</SelectItem>
                      <SelectItem value="approved" className="text-white font-mono">Approved</SelectItem>
                      <SelectItem value="rejected" className="text-white font-mono">Rejected</SelectItem>
                      <SelectItem value="billed" className="text-white font-mono">Billed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-sm px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#00F5FF]/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-white/40 uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-sm px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#00F5FF]/40"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Time Entries Table */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
            <div className="p-4 border-b border-white/[0.06]">
              <h2 className="font-mono text-white font-bold">Time Entries</h2>
              <p className="text-xs text-white/40 font-mono mt-0.5">
                Showing {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-white/30 font-mono text-sm">Loading...</p>
                </div>
              ) : entries.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-white/30 font-mono text-sm">No time entries found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {['Date', 'Description', 'Hours', 'Type', 'Amount', 'Status', ...(userRole === 'admin' ? ['Actions'] : [])].map((h) => (
                          <th key={h} className="text-left py-3 px-4 font-mono text-xs text-white/40 font-normal">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-white/30" />
                              <span className="font-mono text-sm text-white/60">{format(new Date(entry.date), 'MMM dd, yyyy')}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate font-mono text-sm text-white/60">{entry.description}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-white/30" />
                              <span className="font-mono text-sm text-white/60">{entry.hours.toFixed(2)}h</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-white/10 text-white/40">
                              {entry.entryType}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {entry.totalAmount ? (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-white/30" />
                                <span className="font-mono text-sm text-white/60">${entry.totalAmount.toFixed(2)}</span>
                              </div>
                            ) : (
                              <span className="text-white/30 font-mono text-sm">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(entry.status)}</td>
                          {userRole === 'admin' && (
                            <td className="py-3 px-4">
                              {entry.status === 'pending' && (
                                <div className="flex gap-2">
                                  <button
                                    className="bg-white/[0.04] border border-[#00FF88]/20 text-[#00FF88] rounded-sm p-1.5 hover:bg-[#00FF88]/10"
                                    onClick={() => handleApproveEntry(entry.id)}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    className="bg-white/[0.04] border border-[#FF4444]/20 text-[#FF4444] rounded-sm p-1.5 hover:bg-[#FF4444]/10"
                                    onClick={() => {
                                      const reason = prompt('Rejection reason:');
                                      if (reason) handleRejectEntry(entry.id, reason);
                                    }}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Pending Approvals (Admin Only) */}
          {userRole === 'admin' && pendingApprovals.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
              <div className="p-4 border-b border-white/[0.06]">
                <h2 className="font-mono text-white font-bold">Pending Approvals</h2>
                <p className="text-xs text-white/40 font-mono mt-0.5">
                  {pendingApprovals.length} {pendingApprovals.length === 1 ? 'entry' : 'entries'} awaiting approval
                </p>
              </div>
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {['Staff', 'Date', 'Description', 'Hours', 'Amount', 'Actions'].map((h) => (
                          <th key={h} className="text-left py-3 px-4 font-mono text-xs text-white/40 font-normal">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingApprovals.map((entry) => (
                        <tr key={entry.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-mono text-sm text-white/60">{entry.staffId}</td>
                          <td className="py-3 px-4 font-mono text-sm text-white/60">{format(new Date(entry.date), 'MMM dd, yyyy')}</td>
                          <td className="py-3 px-4 max-w-xs truncate font-mono text-sm text-white/60">{entry.description}</td>
                          <td className="py-3 px-4 font-mono text-sm text-white/60">{entry.hours.toFixed(2)}h</td>
                          <td className="py-3 px-4 font-mono text-sm text-white/60">
                            {entry.totalAmount ? `$${entry.totalAmount.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveEntry(entry.id)}
                                className="bg-[#00FF88] text-[#050505] font-mono text-xs font-bold rounded-sm px-3 py-1.5 flex items-center gap-1 hover:bg-[#00FF88]/90"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Rejection reason:');
                                  if (reason) handleRejectEntry(entry.id, reason);
                                }}
                                className="bg-white/[0.04] border border-[#FF4444]/20 text-[#FF4444] font-mono text-xs rounded-sm px-3 py-1.5 flex items-center gap-1 hover:bg-[#FF4444]/10"
                              >
                                <XCircle className="w-3 h-3" />
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>
    </PageContainer>
  );
}
