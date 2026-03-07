'use client';

import { useState, useEffect } from 'react';
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
    if (score >= 80) return 'text-[#00FF88]';
    if (score >= 60) return 'text-[#FFB800]';
    return 'text-[#FF4444]';
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pass':
      case 'ready':
      case 'compliant':
        return 'border-[#00FF88]/30 text-[#00FF88]';
      case 'warning':
        return 'border-[#FFB800]/30 text-[#FFB800]';
      case 'fail':
      case 'not_ready':
      case 'non_compliant':
        return 'border-[#FF4444]/30 text-[#FF4444]';
      default:
        return 'border-white/[0.06] text-white/40';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-[#FF4444]" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-[#FFB800]" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-[#FFB800]/70" />;
      default:
        return <CheckCircle className="w-4 h-4 text-[#00F5FF]" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-white/20" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <p className="text-white/30 font-mono text-sm">Unable to load enterprise data</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-[#00F5FF]/10 border border-[#00F5FF]/30 rounded-sm text-xs font-mono text-[#00F5FF] hover:bg-[#00F5FF]/20 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-mono text-white/90">{summary.org_name}</h2>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Enterprise Overview</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Health Score</p>
            <p className={`text-3xl font-bold font-mono ${getHealthColor(summary.health_score)}`}>
              {summary.health_score}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-sm text-xs font-mono text-white/60 hover:text-white/90 hover:border-white/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {summary.alerts.length > 0 && (
        <div className="bg-white/[0.02] border border-[#FFB800]/20 rounded-sm">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-mono font-bold text-white/90 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FFB800]" />
              Alerts ({summary.alerts.length})
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {summary.alerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-sm"
              >
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <p className="font-mono text-sm text-white/90">{alert.message}</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 capitalize">{alert.category}</p>
                </div>
                {alert.action_required && (
                  <span className="px-2 py-0.5 border border-[#FF4444]/30 rounded-sm text-[10px] font-mono text-[#FF4444]">
                    Action Required
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Plan</p>
            <DollarSign className="w-4 h-4 text-white/20" />
          </div>
          <div className="text-2xl font-bold font-mono text-white/90">{summary.billing.plan_name}</div>
          <p className="text-xs font-mono text-white/20">
            {summary.billing.days_until_renewal} days until renewal
          </p>
          <div className="mt-2 h-1.5 bg-white/[0.06] rounded-sm overflow-hidden">
            <div
              className="h-full bg-[#00F5FF] rounded-sm"
              style={{ width: `${Math.min(summary.billing.usage_percentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Usage</p>
            <Activity className="w-4 h-4 text-white/20" />
          </div>
          <div className="text-2xl font-bold font-mono text-white/90">
            {summary.usage.total_events.toLocaleString()}
          </div>
          <p className="text-xs font-mono text-white/20">
            {summary.usage.growth_rate >= 0 ? '+' : ''}
            {summary.usage.growth_rate.toFixed(1)}% growth
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Team</p>
            <Users className="w-4 h-4 text-white/20" />
          </div>
          <div className="text-2xl font-bold font-mono text-white/90">{summary.teams.total_members}</div>
          <p className="text-xs font-mono text-white/20">
            {summary.teams.active_users_30d} active in 30d
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Security</p>
            <Shield className="w-4 h-4 text-white/20" />
          </div>
          <div className="text-2xl font-bold font-mono text-white/90 capitalize">
            {summary.audit.compliance_status.replace('_', ' ')}
          </div>
          <p className="text-xs font-mono text-white/20">
            {summary.audit.critical_events} critical events
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workspace Usage */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-white/30" />
              <h3 className="text-sm font-mono font-bold text-white/90">Workspace Usage</h3>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mt-1">
              {summary.workspaces.active_workspaces} of {summary.workspaces.total_workspaces} active
            </p>
          </div>
          <div className="p-4">
            {summary.workspaces.workspaces_by_usage.length === 0 ? (
              <p className="text-white/30 font-mono text-sm">No workspace data</p>
            ) : (
              <div className="space-y-3">
                {summary.workspaces.workspaces_by_usage.map((ws) => (
                  <div key={ws.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-mono text-sm text-white/90">{ws.name}</span>
                      <span className="font-mono text-sm text-white/60">{ws.usage_percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-[#00F5FF] rounded-sm"
                        style={{ width: `${Math.min(ws.usage_percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Usage Breakdown */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-white/30" />
              <h3 className="text-sm font-mono font-bold text-white/90">Usage Breakdown</h3>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mt-1">Last 30 days</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-xs font-mono text-white/40">Emails Sent</span>
              <span className="font-mono font-bold text-sm text-white/90">{summary.usage.emails_sent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-mono text-white/40">AI Requests</span>
              <span className="font-mono font-bold text-sm text-white/90">{summary.usage.ai_requests.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-mono text-white/40">Contacts Created</span>
              <span className="font-mono font-bold text-sm text-white/90">{summary.usage.contacts_created.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Team Roles */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-white/30" />
              <h3 className="text-sm font-mono font-bold text-white/90">Team Structure</h3>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mt-1">
              {summary.teams.total_teams} teams, {summary.teams.total_members} members
            </p>
          </div>
          <div className="p-4 space-y-3">
            {Object.entries(summary.teams.roles_distribution).map(([role, count]) => (
              <div key={role} className="flex justify-between">
                <span className="text-xs font-mono text-white/40 capitalize">{role}</span>
                <span className="px-2 py-0.5 border border-white/[0.06] rounded-sm text-[10px] font-mono text-white/60">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Readiness Checks */}
        {readiness && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
            <div className="p-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-white/30" />
                <h3 className="text-sm font-mono font-bold text-white/90">Readiness Score</h3>
              </div>
              <span className={`mt-1 px-2 py-0.5 border rounded-sm text-[10px] font-mono inline-block ${getStatusBadgeClass(readiness.overall_status)}`}>
                {readiness.overall_status.replace('_', ' ')}
              </span>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/20">Score</span>
                  <span className="font-mono font-bold text-sm text-white/90">{readiness.score}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-[#00F5FF] rounded-sm"
                    style={{ width: `${Math.min(readiness.score, 100)}%` }}
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Check</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readiness.checks.slice(0, 5).map((check, index) => (
                    <TableRow key={index} className="border-white/[0.04] hover:bg-white/[0.02]">
                      <TableCell className="font-mono text-sm">
                        <div className="text-white/90">{check.name}</div>
                        <div className="text-[10px] font-mono text-white/20">{check.category}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 border rounded-sm text-[10px] font-mono ${getStatusBadgeClass(check.status)}`}>
                          {check.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {readiness.recommendations.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">Recommendations</p>
                  <ul className="font-mono text-xs space-y-1">
                    {readiness.recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="text-white/40">· {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
