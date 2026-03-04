'use client';

/**
 * ActivityTimeline - Step history with timestamps
 * Elite Command Centre component with Australian date formatting
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { getRelativeTimeAU, formatElapsedMs } from '../utils/format-duration';
import type { ActivityTimelineProps, ActivityStep } from '../types';

// Status icon mapping
const STEP_ICONS = {
  completed: CheckCircle2,
  current: Loader2,
  pending: Circle,
  error: XCircle,
} as const;

// Status colours
const STEP_COLOURS = {
  completed: 'text-success',
  current: 'text-brand-primary',
  pending: 'text-muted-foreground',
  error: 'text-error',
} as const;

const ActivityTimeline = React.forwardRef<HTMLDivElement, ActivityTimelineProps>(
  ({ steps, maxVisible = 5, compact = false, className }, ref) => {
    // Show only the most recent steps if limited
    const visibleSteps = maxVisible ? steps.slice(-maxVisible) : steps;
    const hasMore = steps.length > visibleSteps.length;

    if (steps.length === 0) {
      return (
        <div ref={ref} className={cn('text-muted-foreground text-sm italic', className)}>
          No activity yet
        </div>
      );
    }

    if (compact) {
      // Compact single-line mode
      const currentStep = steps.find((s) => s.status === 'current') ?? steps[steps.length - 1];
      const Icon = STEP_ICONS[currentStep.status];

      return (
        <div ref={ref} className={cn('flex items-center gap-2 text-sm', className)}>
          <Icon
            size={14}
            className={cn(
              STEP_COLOURS[currentStep.status],
              currentStep.status === 'current' && 'animate-spin'
            )}
          />
          <span className="truncate">{currentStep.description}</span>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn('relative', className)}>
        {/* Hidden steps indicator */}
        {hasMore && (
          <div className="text-muted-foreground mb-2 pl-6 text-xs">
            +{steps.length - visibleSteps.length} earlier steps
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-0">
          {visibleSteps.map((step, index) => (
            <TimelineStep
              key={step.id}
              step={step}
              isLast={index === visibleSteps.length - 1}
              animationDelay={index * 50}
            />
          ))}
        </div>
      </div>
    );
  }
);

ActivityTimeline.displayName = 'ActivityTimeline';

// Individual timeline step
interface TimelineStepProps {
  step: ActivityStep;
  isLast: boolean;
  animationDelay: number;
}

function TimelineStep({ step, isLast, animationDelay }: TimelineStepProps) {
  const Icon = STEP_ICONS[step.status];
  const isNew = step.status === 'current';

  return (
    <div
      className={cn('relative flex gap-3 pb-4', isNew && 'animate-timeline-entry')}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Vertical connector line */}
      {!isLast && (
        <div
          className={cn(
            'absolute top-5 left-[9px] h-full w-0.5',
            step.status === 'completed'
              ? 'bg-success/30'
              : step.status === 'error'
                ? 'bg-error/30'
                : 'bg-border'
          )}
        />
      )}

      {/* Icon */}
      <div className="relative z-10 flex-shrink-0">
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full',
            step.status === 'completed' && 'bg-success/10',
            step.status === 'current' && 'bg-brand-primary/10',
            step.status === 'pending' && 'bg-muted',
            step.status === 'error' && 'bg-error/10'
          )}
        >
          <Icon
            size={12}
            className={cn(STEP_COLOURS[step.status], step.status === 'current' && 'animate-spin')}
          />
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pt-0.5">
        <p
          className={cn(
            'text-sm leading-tight',
            step.status === 'current'
              ? 'text-foreground font-medium'
              : step.status === 'error'
                ? 'text-error'
                : 'text-muted-foreground'
          )}
        >
          {step.description}
        </p>

        {/* Metadata row */}
        <div className="mt-1 flex items-center gap-2">
          <span className="text-muted-foreground/70 text-xs">
            {getRelativeTimeAU(step.timestamp)}
          </span>
          {step.duration && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span className="text-muted-foreground/70 font-mono text-xs">
                {formatElapsedMs(step.duration)}
              </span>
            </>
          )}
          {step.step_type && step.step_type !== 'task' && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span className="text-muted-foreground/70 text-xs capitalize">{step.step_type}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export { ActivityTimeline };
