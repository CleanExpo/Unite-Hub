'use client';

/**
 * Agent Overview Stats
 * Phase 83: Founder-level overview of agent operations
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  Zap,
  Clock,
  XCircle,
  Shield,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

interface AgentOverview {
  total_sessions: number;
  active_sessions: number;
  actions_today: number;
  auto_executed_today: number;
  awaiting_approval: number;
  rejection_rate: number;
  avg_risk_score: number;
  truth_compliance_avg: number;
  clients_with_warnings: number;
}

interface AgentOverviewStatsProps {
  overview: AgentOverview;
  className?: string;
}

export function AgentOverviewStats({
  overview,
  className = '',
}: AgentOverviewStatsProps) {
  const getHealthStatus = () => {
    if (overview.rejection_rate > 0.3 || overview.clients_with_warnings > 5) {
      return { label: 'Needs Attention', color: 'text-yellow-500 bg-yellow-500/10' };
    }
    if (overview.rejection_rate > 0.5 || overview.avg_risk_score > 0.6) {
      return { label: 'Critical', color: 'text-red-500 bg-red-500/10' };
    }
    return { label: 'Healthy', color: 'text-green-500 bg-green-500/10' };
  };

  const health = getHealthStatus();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4" />
          Agent Operations Overview
          <Badge className={`ml-auto ${health.color}`}>
            {health.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Zap className="h-4 w-4 text-blue-500" />}
            label="Today"
            value={overview.actions_today}
            subtext={`${overview.auto_executed_today} auto`}
          />
          <StatCard
            icon={<Clock className="h-4 w-4 text-yellow-500" />}
            label="Pending"
            value={overview.awaiting_approval}
            highlight={overview.awaiting_approval > 10}
          />
          <StatCard
            icon={<XCircle className="h-4 w-4 text-red-500" />}
            label="Rejection Rate"
            value={`${Math.round(overview.rejection_rate * 100)}%`}
            highlight={overview.rejection_rate > 0.3}
          />
          <StatCard
            icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
            label="With Warnings"
            value={overview.clients_with_warnings}
            highlight={overview.clients_with_warnings > 5}
          />
        </div>

        {/* Progress bars */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Average Risk
              </span>
              <span className={getRiskColor(overview.avg_risk_score)}>
                {Math.round(overview.avg_risk_score * 100)}%
              </span>
            </div>
            <Progress
              value={overview.avg_risk_score * 100}
              className="h-1.5"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Truth Compliance
              </span>
              <span className={getTruthColor(overview.truth_compliance_avg)}>
                {Math.round(overview.truth_compliance_avg * 100)}%
              </span>
            </div>
            <Progress
              value={overview.truth_compliance_avg * 100}
              className="h-1.5"
            />
          </div>
        </div>

        {/* Session stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>Total Sessions: {overview.total_sessions}</span>
          <span>Active: {overview.active_sessions}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-red-500/10' : 'bg-muted/50'}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-xl font-bold ${highlight ? 'text-red-500' : ''}`}>
        {value}
      </p>
      {subtext && (
        <p className="text-[10px] text-muted-foreground">{subtext}</p>
      )}
    </div>
  );
}

function getRiskColor(score: number): string {
  if (score <= 0.3) return 'text-green-500';
  if (score <= 0.6) return 'text-yellow-500';
  return 'text-red-500';
}

function getTruthColor(score: number): string {
  if (score >= 0.8) return 'text-green-500';
  if (score >= 0.6) return 'text-yellow-500';
  return 'text-red-500';
}
