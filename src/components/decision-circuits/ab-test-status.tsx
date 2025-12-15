'use client';

/**
 * A/B Test Status Badge & Confidence Meter
 * Visual indicators for test status, decision, and statistical confidence
 */

import React from 'react';

type TestStatus = 'running' | 'paused' | 'completed' | 'terminated';
type TestDecision = 'promote' | 'continue_test' | 'terminate';

interface TestStatusBadgeProps {
  status: TestStatus;
  decision?: TestDecision;
}

export function TestStatusBadge({ status, decision }: TestStatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'running':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'completed':
        return 'bg-success-50 text-success-600 border border-success-200';
      case 'paused':
        return 'bg-warning-50 text-warning-600 border border-warning-200';
      case 'terminated':
        return 'bg-error-50 text-error-600 border border-error-200';
      default:
        return 'bg-bg-card text-text-secondary';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return '▶';
      case 'completed':
        return '✓';
      case 'paused':
        return '⏸';
      case 'terminated':
        return '✕';
      default:
        return '○';
    }
  };

  const getDecisionLabel = () => {
    switch (decision) {
      case 'promote':
        return '🏆 Promote';
      case 'terminate':
        return '❌ Terminate';
      case 'continue_test':
        return '⏳ Continue';
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusStyles()}`}>
        {getStatusIcon()} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
      {decision && (
        <span className="px-2 py-1 rounded text-xs font-medium bg-bg-card text-text-primary">{getDecisionLabel()}</span>
      )}
    </div>
  );
}

interface ConfidenceMeterProps {
  score: number; // 0-1
  threshold?: number; // 0-1, default 0.95
  label?: string;
}

export function ConfidenceMeter({ score, threshold = 0.95, label }: ConfidenceMeterProps) {
  const percentage = Math.round(score * 100);
  const isMet = score >= threshold;

  const getColor = () => {
    if (score >= 0.95) {
      return 'bg-success-500';
    }
    if (score >= 0.90) {
      return 'bg-blue-500';
    }
    if (score >= 0.80) {
      return 'bg-warning-500';
    }
    return 'bg-error-500';
  };

  return (
    <div className="space-y-1">
      {label && <p className="text-sm font-medium text-text-primary">{label}</p>}
      <div className="space-y-2">
        <div className="w-full bg-bg-card rounded-full h-3 overflow-hidden border border-border-subtle">
          <div
            className={`h-full transition-all ${getColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-text-secondary">{percentage}% Confident</span>
          {isMet ? (
            <span className="text-xs font-medium text-success-600">✓ Above threshold</span>
          ) : (
            <span className="text-xs font-medium text-warning-600">⚠ Below threshold ({Math.round(threshold * 100)}%)</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface PerformanceDeltaProps {
  delta: number; // Percentage point difference
  label?: string;
}

export function PerformanceDelta({ delta, label }: PerformanceDeltaProps) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  const color = isPositive ? 'text-success-600' : isNeutral ? 'text-text-secondary' : 'text-error-600';
  const icon = isPositive ? '↑' : isNeutral ? '→' : '↓';

  return (
    <div className="flex flex-col items-start gap-1">
      {label && <p className="text-sm font-medium text-text-primary">{label}</p>}
      <div className={`text-sm font-semibold ${color} flex items-center gap-1`}>
        {icon} {Math.abs(delta).toFixed(2)}% {isPositive ? 'better' : isNeutral ? 'same' : 'worse'}
      </div>
    </div>
  );
}

interface VariantComparisonProps {
  variants: Array<{
    variant_id: string;
    engagement_rate: number;
    click_through_rate: number;
    sample_size: number;
  }>;
  winningVariantId?: string;
}

export function VariantComparison({ variants, winningVariantId }: VariantComparisonProps) {
  if (variants.length === 0) {
    return <p className="text-text-muted">No variant data available</p>;
  }

  return (
    <div className="space-y-3">
      {variants.map((variant) => {
        const isWinner = variant.variant_id === winningVariantId;
        return (
          <div
            key={variant.variant_id}
            className={`p-3 rounded border ${
              isWinner
                ? 'bg-success-50 border-success-200'
                : 'bg-bg-card border-border-subtle'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <p className="font-medium text-text-primary">{variant.variant_id}</p>
                {isWinner && <span className="text-xs px-2 py-1 bg-success-100 text-success-700 rounded">🏆 Winner</span>}
              </div>
              <p className="text-xs text-text-secondary">n={variant.sample_size}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-text-secondary">Engagement</p>
                <p className="text-sm font-semibold text-text-primary">{variant.engagement_rate.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">CTR</p>
                <p className="text-sm font-semibold text-text-primary">{variant.click_through_rate.toFixed(2)}%</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
