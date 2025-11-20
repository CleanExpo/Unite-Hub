'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Users,
  DollarSign,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase';

interface EnterpriseOverviewDashboardProps {
  orgId: string;
}

interface EnterpriseSummary {
  org_name: string;
  health_score: number;
  billing: {
    plan_name: string;
    plan_tier: string;
    current_period_cost: number;
    usage_percentage: number;
    days_until_renewal: number;
    overage_risk: string;
  };
  usage: {
    total_events: number;
    emails_sent: number;
    ai_requests: number;
    contacts_created: number;
    growth_rate: number;
  };
  teams: {
    total_teams: number;
    total_members: number;
    active_users_30d: number;
    roles_distribution: { [key: string]: number };
  };
  workspaces: {
    total_workspaces: number;
    active_workspaces: number;
    workspaces_by_usage: Array<{
      id: string;
      name: string;
      usage_percentage: number;
      cost: number;
    }>;
  };
  audit: {
    total_events_30d: number;
    critical_events: number;
    security_incidents: number;
    compliance_status: string;
  };
  alerts: Array<{
    type: string;
    category: string;
    message: string;
    action_required: boolean;
  }>;
}

interface ReadinessReport {
  overall_status: string;
  score: number;
  checks: Array<{
    category: string;
    name: string;
    status: string;
    message: string;
  }>;
  recommendations: string[];
}

export default function EnterpriseOverviewDashboard({ orgId }: EnterpriseOverviewDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<EnterpriseSummary | null>(null);
  const [readiness, setReadiness] = useState<ReadinessReport | null>(null);

  useEffect(() => {
    if (orgId) {
      fetchData();
    }
  }, [orgId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `/api/enterprise/summary?orgId=${orgId}&type=full`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSummary(data.data.summary);
        setReadiness(data.data.readiness);
      }
    } catch (error) {
      console.error('Error fetching enterprise data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
      case 'ready':
      case 'compliant':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'fail':
      case 'not_ready':
      case 'non_compliant':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load enterprise data</p>
        <Button onClick={fetchData} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{summary.org_name}</h2>
          <p className="text-muted-foreground">Enterprise Overview</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Health Score</p>
            <p className={`text-3xl font-bold ${getHealthColor(summary.health_score)}`}>
              {summary.health_score}
            </p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {summary.alerts.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Alerts ({summary.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.alerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                >
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground capitalize">{alert.category}</p>
                  </div>
                  {alert.action_required && (
                    <Badge variant="destructive">Action Required</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.billing.plan_name}</div>
            <p className="text-xs text-muted-foreground">
              {summary.billing.days_until_renewal} days until renewal
            </p>
            <Progress
              value={summary.billing.usage_percentage}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usage</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.usage.total_events.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.usage.growth_rate >= 0 ? '+' : ''}
              {summary.usage.growth_rate.toFixed(1)}% growth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.teams.total_members}</div>
            <p className="text-xs text-muted-foreground">
              {summary.teams.active_users_30d} active in 30d
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Shield className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {summary.audit.compliance_status.replace('_', ' ')}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.audit.critical_events} critical events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workspace Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Workspace Usage
            </CardTitle>
            <CardDescription>
              {summary.workspaces.active_workspaces} of {summary.workspaces.total_workspaces} active
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.workspaces.workspaces_by_usage.length === 0 ? (
              <p className="text-muted-foreground text-sm">No workspace data</p>
            ) : (
              <div className="space-y-3">
                {summary.workspaces.workspaces_by_usage.map((ws) => (
                  <div key={ws.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{ws.name}</span>
                      <span>{ws.usage_percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={ws.usage_percentage} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Usage Breakdown
            </CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Emails Sent</span>
                <span className="font-medium">{summary.usage.emails_sent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">AI Requests</span>
                <span className="font-medium">{summary.usage.ai_requests.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Contacts Created</span>
                <span className="font-medium">{summary.usage.contacts_created.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Structure
            </CardTitle>
            <CardDescription>
              {summary.teams.total_teams} teams, {summary.teams.total_members} members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary.teams.roles_distribution).map(([role, count]) => (
                <div key={role} className="flex justify-between">
                  <span className="text-sm capitalize">{role}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Readiness Checks */}
        {readiness && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Readiness Score
              </CardTitle>
              <CardDescription>
                <Badge className={getStatusColor(readiness.overall_status)}>
                  {readiness.overall_status.replace('_', ' ')}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Score</span>
                  <span className="font-medium">{readiness.score}%</span>
                </div>
                <Progress value={readiness.score} />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Check</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readiness.checks.slice(0, 5).map((check, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-sm">
                        <div>{check.name}</div>
                        <div className="text-xs text-muted-foreground">{check.category}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(check.status)}>
                          {check.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {readiness.recommendations.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Recommendations</p>
                  <ul className="text-sm space-y-1">
                    {readiness.recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="text-muted-foreground">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
