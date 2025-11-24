'use client';

/**
 * Safety Banner
 * Phase 83: Display safety status and warnings for agent operations
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface SafetyInfo {
  total_risk_score: number;
  actions_auto_executed: number;
  actions_awaiting_approval: number;
  early_warning_active: boolean;
  truth_compliance: number;
  disclaimers: string[];
}

interface SafetyBannerProps {
  safetyInfo?: SafetyInfo;
  warningsCount?: number;
  highWarningsCount?: number;
  className?: string;
}

export function SafetyBanner({
  safetyInfo,
  warningsCount = 0,
  highWarningsCount = 0,
  className = '',
}: SafetyBannerProps) {
  // Determine overall safety status
  const getSafetyStatus = () => {
    if (highWarningsCount > 0) {
      return 'critical';
    }
    if (warningsCount > 2 || (safetyInfo && safetyInfo.total_risk_score > 0.6)) {
      return 'warning';
    }
    if (safetyInfo && safetyInfo.actions_awaiting_approval > 5) {
      return 'attention';
    }
    return 'safe';
  };

  const status = getSafetyStatus();

  const statusConfig = {
    critical: {
      icon: ShieldAlert,
      title: 'High-Risk Situation',
      description: `${highWarningsCount} high-severity warning(s) active. Agent operations paused for safety.`,
      variant: 'destructive' as const,
      color: 'text-red-500',
    },
    warning: {
      icon: AlertTriangle,
      title: 'Elevated Risk',
      description: 'Multiple warnings or high risk score detected. Review recommended.',
      variant: 'default' as const,
      color: 'text-yellow-500',
    },
    attention: {
      icon: Info,
      title: 'Actions Pending',
      description: `${safetyInfo?.actions_awaiting_approval || 0} actions awaiting approval.`,
      variant: 'default' as const,
      color: 'text-blue-500',
    },
    safe: {
      icon: ShieldCheck,
      title: 'Normal Operations',
      description: 'All systems operating within safety parameters.',
      variant: 'default' as const,
      color: 'text-green-500',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Alert variant={config.variant} className={className}>
      <Icon className={`h-4 w-4 ${config.color}`} />
      <AlertTitle className="flex items-center gap-2">
        {config.title}
        {safetyInfo && (
          <div className="flex gap-1 ml-auto">
            <Badge variant="outline" className="text-[10px]">
              Risk: {Math.round(safetyInfo.total_risk_score * 100)}%
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              Truth: {Math.round(safetyInfo.truth_compliance * 100)}%
            </Badge>
          </div>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>{config.description}</p>

        {safetyInfo && safetyInfo.disclaimers.length > 0 && (
          <div className="text-xs space-y-1 mt-2 pt-2 border-t">
            {safetyInfo.disclaimers.map((disclaimer, i) => (
              <p key={i} className="text-muted-foreground">
                • {disclaimer}
              </p>
            ))}
          </div>
        )}

        {safetyInfo && (
          <div className="flex gap-4 text-xs mt-2">
            <span>
              Auto-executed: {safetyInfo.actions_auto_executed}
            </span>
            <span>
              Pending: {safetyInfo.actions_awaiting_approval}
            </span>
            {safetyInfo.early_warning_active && (
              <span className="text-yellow-500">
                • Early warnings active
              </span>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Compact safety indicator for headers
 */
export function SafetyIndicator({
  riskScore,
  truthCompliance,
  className = '',
}: {
  riskScore: number;
  truthCompliance: number;
  className?: string;
}) {
  const getColor = (score: number, inverse = false) => {
    if (inverse) {
      if (score <= 0.3) return 'text-green-500';
      if (score <= 0.6) return 'text-yellow-500';
      return 'text-red-500';
    }
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <Shield className="h-3 w-3" />
      <span className={getColor(riskScore, true)}>
        Risk: {Math.round(riskScore * 100)}%
      </span>
      <span className={getColor(truthCompliance)}>
        Truth: {Math.round(truthCompliance * 100)}%
      </span>
    </div>
  );
}
