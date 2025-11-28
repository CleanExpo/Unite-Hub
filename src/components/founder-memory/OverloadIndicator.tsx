'use client';

/**
 * OverloadIndicator Component
 *
 * Displays founder overload/fatigue warning with recommendations.
 */

import React from 'react';
import { AlertTriangle, Battery, BatteryLow, BatteryWarning, BatteryFull, X } from 'lucide-react';

interface OverloadAnalysis {
  overallSeverity: string;
  overallScore: number;
  recommendations: string[];
}

interface OverloadIndicatorProps {
  analysis: OverloadAnalysis;
  onDismiss?: () => void;
  className?: string;
}

const SEVERITY_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
    label: string;
    description: string;
  }
> = {
  none: {
    icon: BatteryFull,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-800 dark:text-green-200',
    iconColor: 'text-green-500',
    label: 'All Good',
    description: 'Your workload is well-balanced.',
  },
  low: {
    icon: Battery,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-800 dark:text-blue-200',
    iconColor: 'text-blue-500',
    label: 'Manageable',
    description: 'Workload is elevated but sustainable.',
  },
  moderate: {
    icon: BatteryWarning,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    iconColor: 'text-yellow-500',
    label: 'Elevated Load',
    description: 'Consider delegating or prioritizing.',
  },
  high: {
    icon: BatteryLow,
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-800 dark:text-orange-200',
    iconColor: 'text-orange-500',
    label: 'High Load Warning',
    description: 'Risk of burnout detected. Take action.',
  },
  critical: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-500',
    label: 'Critical Overload',
    description: 'Immediate action required to prevent burnout.',
  },
};

export function OverloadIndicator({
  analysis,
  onDismiss,
  className = '',
}: OverloadIndicatorProps) {
  const config = SEVERITY_CONFIG[analysis.overallSeverity] || SEVERITY_CONFIG.moderate;
  const SeverityIcon = config.icon;

  // Don't show if severity is "none"
  if (analysis.overallSeverity === 'none') {
    return null;
  }

  return (
    <div
      className={`rounded-lg border ${config.bgColor} ${config.borderColor} p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <SeverityIcon className={`h-5 w-5 shrink-0 ${config.iconColor}`} />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`font-medium ${config.textColor}`}>{config.label}</h3>
              <p className={`mt-1 text-sm ${config.textColor} opacity-80`}>
                {config.description}
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`shrink-0 ${config.textColor} opacity-60 hover:opacity-100`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Score Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className={config.textColor}>Overload Score</span>
              <span className={`font-medium ${config.textColor}`}>{analysis.overallScore}/100</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/50 dark:bg-black/20">
              <div
                className={`h-full transition-all ${
                  analysis.overallScore >= 80
                    ? 'bg-red-500'
                    : analysis.overallScore >= 60
                      ? 'bg-orange-500'
                      : analysis.overallScore >= 40
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                }`}
                style={{ width: `${analysis.overallScore}%` }}
              />
            </div>
          </div>

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="mt-3">
              <p className={`text-xs font-medium ${config.textColor}`}>Recommendations:</p>
              <ul className={`mt-1 space-y-1 text-xs ${config.textColor} opacity-80`}>
                {analysis.recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index} className="flex items-start gap-1.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OverloadIndicator;
