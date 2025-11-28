'use client';

/**
 * CriticalPointBanner Component
 *
 * Displays a prominent banner when a critical point requires approval.
 * Shows action details, risk level, and approve/reject buttons.
 */

import { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, XCircle, Clock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CriticalPointData {
  id: string;
  category: string;
  description: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  action: {
    type: string;
    target?: string;
    confidence: number;
    reasoning: string;
  };
  context: {
    pageUrl: string;
    pageTitle?: string;
    hasScreenshot?: boolean;
  };
  createdAt: string;
}

interface CriticalPointBannerProps {
  criticalPoint: CriticalPointData;
  onApprove: (id: string, note?: string) => void;
  onReject: (id: string, note?: string) => void;
  timeoutSeconds?: number;
  className?: string;
}

const riskConfig = {
  low: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  medium: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
  },
  high: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  critical: {
    icon: ShieldAlert,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
};

export function CriticalPointBanner({
  criticalPoint,
  onApprove,
  onReject,
  timeoutSeconds = 300,
  className,
}: CriticalPointBannerProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeoutSeconds);

  const config = riskConfig[criticalPoint.risk];
  const RiskIcon = config.icon;

  // Countdown timer
  useState(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  });

  const handleApprove = async () => {
    setIsSubmitting(true);
    await onApprove(criticalPoint.id, note || undefined);
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    await onReject(criticalPoint.id, note || undefined);
    setIsSubmitting(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCategory = (category: string): string => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div
      className={cn(
        'rounded-lg border-2 p-4',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-full', config.bgColor)}>
            <RiskIcon className={cn('w-6 h-6', config.color)} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Approval Required</h3>
            <p className="text-sm text-muted-foreground">
              {formatCategory(criticalPoint.category)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className={cn('font-mono', timeLeft < 60 && 'text-red-500')}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-foreground">{criticalPoint.description}</p>
      </div>

      {/* Details */}
      <div className="bg-card rounded-md p-3 mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Action Type:</span>
          <span className="font-medium">{criticalPoint.action.type}</span>
        </div>
        {criticalPoint.action.target && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Target:</span>
            <span className="font-medium truncate max-w-[200px]">
              {criticalPoint.action.target}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Confidence:</span>
          <span className="font-medium">
            {Math.round(criticalPoint.action.confidence * 100)}%
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Risk Level:</span>
          <span className={cn('font-medium capitalize', config.color)}>
            {criticalPoint.risk}
          </span>
        </div>
        {criticalPoint.context.pageTitle && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Page:</span>
            <span className="font-medium truncate max-w-[200px]">
              {criticalPoint.context.pageTitle}
            </span>
          </div>
        )}
      </div>

      {/* Reasoning */}
      <div className="bg-card rounded-md p-3 mb-4">
        <p className="text-sm text-muted-foreground mb-1">AI Reasoning:</p>
        <p className="text-sm">{criticalPoint.action.reasoning}</p>
      </div>

      {/* Note Input */}
      <div className="mb-4">
        <label className="text-sm text-muted-foreground mb-1 block">
          Add a note (optional):
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for approval or rejection..."
          className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleReject}
          disabled={isSubmitting}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md',
            'bg-red-500/10 text-red-500 border border-red-500/30',
            'hover:bg-red-500/20 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <XCircle className="w-4 h-4" />
          Reject
        </button>
        <button
          onClick={handleApprove}
          disabled={isSubmitting}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md',
            'bg-green-500/10 text-green-500 border border-green-500/30',
            'hover:bg-green-500/20 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <CheckCircle className="w-4 h-4" />
          Approve
        </button>
      </div>

      {/* Warning */}
      <p className="text-xs text-muted-foreground mt-3 text-center">
        This action will be auto-rejected in {formatTime(timeLeft)} if no response is provided.
      </p>
    </div>
  );
}

export default CriticalPointBanner;
