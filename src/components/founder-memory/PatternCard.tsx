'use client';

/**
 * PatternCard Component
 *
 * Displays a detected cross-client pattern with strength indicator.
 */

import React from 'react';
import { Sparkles, TrendingUp, RefreshCw, AlertCircle, Lightbulb } from 'lucide-react';

interface Pattern {
  id: string;
  patternType: string;
  title: string;
  description: string;
  strengthScore: number;
  recurrenceCount: number;
}

interface PatternCardProps {
  pattern: Pattern;
  onClick?: () => void;
  className?: string;
}

const PATTERN_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  communication: {
    icon: RefreshCw,
    color: 'text-blue-500',
    label: 'Communication',
  },
  buying_signal: {
    icon: TrendingUp,
    color: 'text-green-500',
    label: 'Buying Signal',
  },
  churn_risk: {
    icon: AlertCircle,
    color: 'text-red-500',
    label: 'Churn Risk',
  },
  opportunity: {
    icon: Lightbulb,
    color: 'text-amber-500',
    label: 'Opportunity',
  },
  engagement: {
    icon: Sparkles,
    color: 'text-purple-500',
    label: 'Engagement',
  },
  seasonal: {
    icon: RefreshCw,
    color: 'text-cyan-500',
    label: 'Seasonal',
  },
};

export function PatternCard({ pattern, onClick, className = '' }: PatternCardProps) {
  const typeConfig = PATTERN_TYPE_CONFIG[pattern.patternType] || {
    icon: Sparkles,
    color: 'text-primary',
    label: pattern.patternType,
  };
  const TypeIcon = typeConfig.icon;

  const getStrengthLabel = (score: number) => {
    if (score >= 0.8) {
return 'Strong';
}
    if (score >= 0.6) {
return 'Moderate';
}
    if (score >= 0.4) {
return 'Emerging';
}
    return 'Weak';
  };

  const getStrengthColor = (score: number) => {
    if (score >= 0.8) {
return 'bg-green-500';
}
    if (score >= 0.6) {
return 'bg-yellow-500';
}
    if (score >= 0.4) {
return 'bg-orange-500';
}
    return 'bg-gray-400';
  };

  return (
    <div
      className={`group rounded-lg border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-accent/50 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <TypeIcon className={`h-4 w-4 shrink-0 ${typeConfig.color}`} />
          <h4 className="line-clamp-1 text-sm font-medium">{pattern.title}</h4>
        </div>
      </div>

      <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{pattern.description}</p>

      <div className="flex items-center justify-between">
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {typeConfig.label}
        </span>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${getStrengthColor(pattern.strengthScore)}`}
                style={{ width: `${pattern.strengthScore * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {getStrengthLabel(pattern.strengthScore)}
            </span>
          </div>

          {pattern.recurrenceCount > 1 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              {pattern.recurrenceCount}x
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default PatternCard;
