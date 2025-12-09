'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      if (!session) {
return;
}

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };

      // Fetch reports
      const reportsRes = await fetch(
        `/api/reports/financial?orgId=${orgId}&limit=5`,
        { headers }
      );
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data.reports || []);
      }

      // Fetch trends
      const trendsRes = await fetch(
        `/api/reports/analytics?orgId=${orgId}&type=trends&periods=12&periodType=monthly`,
        { headers }
      );
      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setTrends(data.data || []);
      }

      // Fetch anomalies
      const anomaliesRes = await fetch(
        `/api/reports/analytics?orgId=${orgId}&type=anomalies&days=${selectedPeriod}`,
        { headers }
      );
      if (anomaliesRes.ok) {
        const data = await anomaliesRes.json();
        setAnomalies(data.data || []);
      }

      // Fetch audit events
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
      if (!session) {
return;
}

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
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Calculate summary metrics
  const totalRevenue = reports.reduce((sum, r) => sum + (r.total_revenue || 0), 0);
  const latestTrend = trends[trends.length - 1];
  const totalUsage = latestTrend
    ? Object.values(latestTrend.usage).reduce((a, b) => a + b, 0)
    : 0;
  const criticalAnomalies = anomalies.filter((a) => a.severity === 'critical').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor revenue, usage trends, and compliance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => fetchDashboardData()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {reports.length} reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {latestTrend ? `${latestTrend.growth_rate.toFixed(1)}% growth` : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Anomalies</CardTitle>
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anomalies.length}</div>
            <p className="text-xs text-muted-foreground">
              {criticalAnomalies} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Audit Events</CardTitle>
            <Shield className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditEvents.length}</div>
            <p className="text-xs text-muted-foreground">Critical events</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Reports</CardTitle>
                <CardDescription>Latest generated financial reports</CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No reports generated yet</p>
                ) : (
                  <div className="space-y-3">
                    {reports.slice(0, 3).map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{report.report_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(report.period_start)} - {formatDate(report.period_end)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">
                            {formatCurrency(report.total_revenue)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {report.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Breakdown</CardTitle>
                <CardDescription>Current period usage by category</CardDescription>
              </CardHeader>
              <CardContent>
                {latestTrend ? (
                  <div className="space-y-3">
                    {Object.entries(latestTrend.usage).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium">{value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No usage data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => generateReport('monthly')} size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Monthly Report
            </Button>
            <Button onClick={() => generateReport('quarterly')} size="sm" variant="outline">
              Quarterly Report
            </Button>
            <Button onClick={() => generateReport('annual')} size="sm" variant="outline">
              Annual Report
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.report_name}</TableCell>
                      <TableCell>
                        {formatDate(report.period_start)} - {formatDate(report.period_end)}
                      </TableCell>
                      <TableCell>{formatCurrency(report.total_revenue)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Trends</CardTitle>
              <CardDescription>Monthly usage patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Emails</TableHead>
                    <TableHead>AI Requests</TableHead>
                    <TableHead>Contacts</TableHead>
                    <TableHead>Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trends.map((trend, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{trend.period}</TableCell>
                      <TableCell>{trend.usage.emails.toLocaleString()}</TableCell>
                      <TableCell>{trend.usage.ai_requests.toLocaleString()}</TableCell>
                      <TableCell>{trend.usage.contacts.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {trend.growth_rate >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                          <span
                            className={
                              trend.growth_rate >= 0 ? 'text-green-500' : 'text-red-500'
                            }
                          >
                            {trend.growth_rate.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detected Anomalies</CardTitle>
              <CardDescription>
                Unusual usage patterns requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {anomalies.length === 0 ? (
                <p className="text-muted-foreground">No anomalies detected</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workspace</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Deviation</TableHead>
                      <TableHead>Severity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {anomalies.map((anomaly, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {anomaly.workspace_name}
                        </TableCell>
                        <TableCell className="capitalize">
                          {anomaly.category.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell>{Math.round(anomaly.expected_value)}</TableCell>
                        <TableCell>{anomaly.actual_value}</TableCell>
                        <TableCell>
                          <span
                            className={
                              anomaly.deviation_percent >= 0
                                ? 'text-green-500'
                                : 'text-red-500'
                            }
                          >
                            {anomaly.deviation_percent >= 0 ? '+' : ''}
                            {anomaly.deviation_percent.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(anomaly.severity)}>
                            {anomaly.severity}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Critical Audit Events</CardTitle>
              <CardDescription>
                Important security and compliance events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditEvents.length === 0 ? (
                <p className="text-muted-foreground">No critical events</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.event_type}</TableCell>
                        <TableCell className="capitalize">{event.event_category}</TableCell>
                        <TableCell>{event.action}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(event.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
