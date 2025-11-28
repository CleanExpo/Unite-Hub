'use client';

/**
 * RiskCard Component
 *
 * Displays a single risk item with severity and mitigation status.
 */

import React from 'react';
import { Shield, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface Risk {
  id: string;
  category: string;
  title: string;
  description: string;
  riskScore: number;
  severityScore: number;
  mitigationStatus: string;
}

interface RiskCardProps {
  risk: Risk;
  onClick?: () => void;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  client_churn: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  revenue_decline: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  delivery_delay: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  team_capacity: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  market_shift: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  competitive_threat: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  operational: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

const MITIGATION_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  unaddressed: { icon: XCircle, color: 'text-red-500', label: 'Unaddressed' },
  monitoring: { icon: Clock, color: 'text-yellow-500', label: 'Monitoring' },
  in_progress: { icon: AlertTriangle, color: 'text-orange-500', label: 'In Progress' },
  mitigated: { icon: CheckCircle2, color: 'text-green-500', label: 'Mitigated' },
  accepted: { icon: Shield, color: 'text-blue-500', label: 'Accepted' },
};

export function RiskCard({ risk, onClick, className = '' }: RiskCardProps) {
  const categoryColor =
    CATEGORY_COLORS[risk.category] ||
    'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';

  const mitigation = MITIGATION_CONFIG[risk.mitigationStatus] || MITIGATION_CONFIG.unaddressed;
  const MitigationIcon = mitigation.icon;

  const getSeverityColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskScoreLabel = (score: number) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 dark:text-red-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div
      className={`group rounded-lg border bg-card p-3 transition-colors hover:border-red-300/50 hover:bg-red-50/30 dark:hover:border-red-700/30 dark:hover:bg-red-900/10 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 shrink-0 text-red-500" />
          <h4 className="line-clamp-1 font-medium">{risk.title}</h4>
        </div>
        <div
          className={`h-2 w-2 rounded-full ${getSeverityColor(risk.severityScore)}`}
          title={`Severity: ${risk.severityScore}`}
        />
      </div>

      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{risk.description}</p>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor}`}>
          {risk.category.replace('_', ' ')}
        </span>

        <div className={`flex items-center gap-1 text-xs font-medium ${getRiskScoreColor(risk.riskScore)}`}>
          <AlertTriangle className="h-3 w-3" />
          {getRiskScoreLabel(risk.riskScore)} ({risk.riskScore})
        </div>

        <div className={`flex items-center gap-1 text-xs ${mitigation.color}`}>
          <MitigationIcon className="h-3 w-3" />
          {mitigation.label}
        </div>
      </div>
    </div>
  );
}

export default RiskCard;
