'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileText,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  Activity,
  Shield,
} from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase';

interface FinancialDashboardProps {
  orgId: string;
}

interface FinancialReport {
  id: string;
  report_type: string;
  report_name: string;
  period_start: string;
  period_end: string;
  total_revenue: number;
  subscription_revenue: number;
  overage_revenue: number;
  status: string;
  generated_at: string;
}

interface UsageTrend {
  period: string;
  usage: {
    emails: number;
    ai_requests: number;
    contacts: number;
    reports: number;
    campaigns: number;
    api_calls: number;
  };
  growth_rate: number;
}

interface AnomalyDetection {
  workspace_id: string;
  workspace_name: string;
  category: string;
  expected_value: number;
  actual_value: number;
  deviation_percent: number;
  severity: string;
}

interface AuditEvent {
  id: string;
  event_type: string;
  event_category: string;
  severity: string;
  action: string;
  created_at: string;
}

export default function FinancialDashboard({ orgId }: FinancialDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [trends, setTrends] = useState<UsageTrend[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (orgId) {
      fetchDashboardData();
    }
  }, [orgId, selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) return;

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };

      const reportsRes = await fetch(
        `/api/reports/financial?orgId=${orgId}&limit=5`,
        { headers }
      );
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data.reports || []);
      }

      const trendsRes = await fetch(
        `/api/reports/analytics?orgId=${orgId}&type=trends&periods=12&periodType=monthly`,
        { headers }
      );
      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setTrends(data.data || []);
      }

      const anomaliesRes = await fetch(
        `/api/reports/analytics?orgId=${orgId}&type=anomalies&days=${selectedPeriod}`,
        { headers }
      );
      if (anomaliesRes.ok) {
        const data = await anomaliesRes.json();
        setAnomalies(data.data || []);
      }

      const auditRes = await fetch(
        `/api/reports/audit?orgId=${orgId}&type=critical&limit=10`,
        { headers }
      );
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditEvents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType: string) => {
    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) return;

      const now = new Date();
      const periodEnd = now.toISOString();
      let periodStart: string;

      switch (reportType) {
        case 'monthly':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          break;
        case 'quarterly':
          const quarter = Math.floor(now.getMonth() / 3);
          periodStart = new Date(now.getFullYear(), quarter * 3, 1).toISOString();
          break;
        case 'annual':
          periodStart = new Date(now.getFullYear(), 0, 1).toISOString();
          break;
        default:
          periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      const response = await fetch('/api/reports/financial', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId,
          reportType,
          periodStart,
          periodEnd,
        }),
      });

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-[#FF4444]/40 text-[#FF4444]';
      case 'high':
        return 'border-[#FFB800]/40 text-[#FFB800]';
      case 'medium':
        return 'border-[#FFB800]/30 text-[#FFB800]/70';
      case 'low':
        return 'border-[#00F5FF]/30 text-[#00F5FF]';
      default:
        return 'border-white/[0.06] text-white/40';
    }
  };

  const totalRevenue = reports.reduce((sum, r) => sum + (r.total_revenue || 0), 0);
  const latestTrend = trends[trends.length - 1];
  const totalUsage = latestTrend
    ? Object.values(latestTrend.usage).reduce((a, b) => a + b, 0)
    : 0;
  const criticalAnomalies = anomalies.filter((a) => a.severity === 'critical').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-white/20" />
      </div>
    );
  }

  const tabs = ['overview', 'reports', 'trends', 'anomalies', 'audit'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-mono text-white/90">Financial Dashboard</h2>
          <p className="text-white/30 font-mono text-sm">
            Monitor revenue, usage trends, and compliance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32 bg-white/[0.03] border-white/[0.06] rounded-sm font-mono text-sm text-white/90">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => fetchDashboardData()}
            className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-sm text-xs font-mono text-white/60 hover:text-white/90 hover:border-white/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Total Revenue</p>
            <DollarSign className="w-4 h-4 text-white/20" />
          </div>
          <div className="text-2xl font-bold font-mono text-white/90">{formatCurrency(totalRevenue)}</div>
          <p className="text-xs font-mono text-white/20">From {reports.length} reports</p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Total Usage</p>
            <Activity className="w-4 h-4 text-white/20" />
          </div>
          <div className="text-2xl font-bold font-mono text-white/90">{totalUsage.toLocaleString()}</div>
          <p className="text-xs font-mono text-white/20">
            {latestTrend ? `${latestTrend.growth_rate.toFixed(1)}% growth` : 'No data'}
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Anomalies</p>
            <AlertTriangle className="w-4 h-4 text-white/20" />
          </div>
          <div className="text-2xl font-bold font-mono text-white/90">{anomalies.length}</div>
          <p className="text-xs font-mono text-white/20">{criticalAnomalies} critical</p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Audit Events</p>
            <Shield className="w-4 h-4 text-white/20" />
          </div>
          <div className="text-2xl font-bold font-mono text-white/90">{auditEvents.length}</div>
          <p className="text-xs font-mono text-white/20">Critical events</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-white/[0.06]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-widest transition-colors ${
              activeTab === tab
                ? 'text-[#00F5FF] border-b-2 border-[#00F5FF] -mb-px'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
            <div className="p-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-mono font-bold text-white/90">Recent Reports</h3>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Latest generated financial reports</p>
            </div>
            <div className="p-4">
              {reports.length === 0 ? (
                <p className="text-white/30 font-mono text-sm">No reports generated yet</p>
              ) : (
                <div className="space-y-3">
                  {reports.slice(0, 3).map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 bg-white/[0.02] rounded-sm"
                    >
                      <div>
                        <p className="font-mono text-sm text-white/90">{report.report_name}</p>
                        <p className="text-xs font-mono text-white/30">
                          {formatDate(report.period_start)} - {formatDate(report.period_end)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm text-white/90">
                          {formatCurrency(report.total_revenue)}
                        </p>
                        <span className="px-1.5 py-0.5 border border-white/[0.06] rounded-sm text-[10px] font-mono text-white/40">
                          {report.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
            <div className="p-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-mono font-bold text-white/90">Usage Breakdown</h3>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Current period usage by category</p>
            </div>
            <div className="p-4">
              {latestTrend ? (
                <div className="space-y-3">
                  {Object.entries(latestTrend.usage).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="font-mono text-sm text-white/60 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono font-bold text-sm text-white/90">{value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/30 font-mono text-sm">No usage data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => generateReport('monthly')}
              className="flex items-center gap-2 px-3 py-2 bg-[#00F5FF]/10 border border-[#00F5FF]/30 rounded-sm text-xs font-mono text-[#00F5FF] hover:bg-[#00F5FF]/20 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Monthly Report
            </button>
            <button
              onClick={() => generateReport('quarterly')}
              className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-sm text-xs font-mono text-white/60 hover:text-white/90 transition-colors"
            >
              Quarterly Report
            </button>
            <button
              onClick={() => generateReport('annual')}
              className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-sm text-xs font-mono text-white/60 hover:text-white/90 transition-colors"
            >
              Annual Report
            </button>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Report</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Period</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Revenue</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Status</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                    <TableCell className="font-mono text-sm text-white/90">{report.report_name}</TableCell>
                    <TableCell className="font-mono text-sm text-white/60">
                      {formatDate(report.period_start)} - {formatDate(report.period_end)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-white/90">{formatCurrency(report.total_revenue)}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 border border-white/[0.06] rounded-sm text-[10px] font-mono text-white/40">
                        {report.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button className="p-1 text-white/30 hover:text-white/60 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Tab: Trends */}
      {activeTab === 'trends' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-mono font-bold text-white/90">Usage Trends</h3>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Monthly usage patterns over time</p>
          </div>
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Period</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Emails</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">AI Requests</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Contacts</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trends.map((trend, index) => (
                  <TableRow key={index} className="border-white/[0.04] hover:bg-white/[0.02]">
                    <TableCell className="font-mono text-sm text-white/90">{trend.period}</TableCell>
                    <TableCell className="font-mono text-sm text-white/70">{trend.usage.emails.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-sm text-white/70">{trend.usage.ai_requests.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-sm text-white/70">{trend.usage.contacts.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {trend.growth_rate >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-[#00FF88]" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-[#FF4444]" />
                        )}
                        <span
                          className={`font-mono text-sm ${
                            trend.growth_rate >= 0 ? 'text-[#00FF88]' : 'text-[#FF4444]'
                          }`}
                        >
                          {trend.growth_rate.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Tab: Anomalies */}
      {activeTab === 'anomalies' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-mono font-bold text-white/90">Detected Anomalies</h3>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">
              Unusual usage patterns requiring attention
            </p>
          </div>
          <div>
            {anomalies.length === 0 ? (
              <p className="p-4 text-white/30 font-mono text-sm">No anomalies detected</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Workspace</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Category</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Expected</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Actual</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Deviation</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anomalies.map((anomaly, index) => (
                    <TableRow key={index} className="border-white/[0.04] hover:bg-white/[0.02]">
                      <TableCell className="font-mono text-sm text-white/90">
                        {anomaly.workspace_name}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-white/70 capitalize">
                        {anomaly.category.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-white/70">{Math.round(anomaly.expected_value)}</TableCell>
                      <TableCell className="font-mono text-sm text-white/70">{anomaly.actual_value}</TableCell>
                      <TableCell>
                        <span
                          className={`font-mono text-sm ${
                            anomaly.deviation_percent >= 0
                              ? 'text-[#00FF88]'
                              : 'text-[#FF4444]'
                          }`}
                        >
                          {anomaly.deviation_percent >= 0 ? '+' : ''}
                          {anomaly.deviation_percent.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 border rounded-sm text-[10px] font-mono ${getSeverityColor(anomaly.severity)}`}>
                          {anomaly.severity}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* Tab: Audit */}
      {activeTab === 'audit' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-mono font-bold text-white/90">Critical Audit Events</h3>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">
              Important security and compliance events
            </p>
          </div>
          <div>
            {auditEvents.length === 0 ? (
              <p className="p-4 text-white/30 font-mono text-sm">No critical events</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Event</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Category</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Action</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Severity</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditEvents.map((event) => (
                    <TableRow key={event.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                      <TableCell className="font-mono text-sm text-white/90">{event.event_type}</TableCell>
                      <TableCell className="font-mono text-sm text-white/70 capitalize">{event.event_category}</TableCell>
                      <TableCell className="font-mono text-sm text-white/70">{event.action}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 border rounded-sm text-[10px] font-mono ${getSeverityColor(event.severity)}`}>
                          {event.severity}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-white/60">{formatDate(event.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
