'use client';

/**
 * Governance Score Bar
 * Phase 63: Display governance score with visual indicator
 */

import { Progress } from '@/components/ui/progress';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface GovernanceScoreBarProps {
  label: string;
  score: number;
  thresholds?: {
    warning: number;
    critical: number;
  };
  showIcon?: boolean;
}

export function GovernanceScoreBar({
  label,
  score,
  thresholds = { warning: 80, critical: 60 },
  showIcon = true,
}: GovernanceScoreBarProps) {
  const getStatus = () => {
    if (score >= thresholds.warning) return 'healthy';
    if (score >= thresholds.critical) return 'warning';
    return 'critical';
  };

  const status = getStatus();

  const getColor = () => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'healthy':
        return '[&>div]:bg-green-500';
      case 'warning':
        return '[&>div]:bg-yellow-500';
      case 'critical':
        return '[&>div]:bg-red-500';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'healthy':
        return <ShieldCheck className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <ShieldAlert className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <ShieldX className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showIcon && getIcon()}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={`text-sm font-bold ${getColor()}`}>{score}%</span>
      </div>
      <Progress value={score} className={`h-2 ${getProgressColor()}`} />
    </div>
  );
}

export default GovernanceScoreBar;
