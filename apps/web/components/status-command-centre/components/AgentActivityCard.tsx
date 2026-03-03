'use client';

/**
 * AgentActivityCard - Individual agent status card
 * Elite Command Centre component with industrial luxury aesthetic
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { STATUS_CONFIG, isActiveStatus } from '../constants';
import { useStatusTransitions } from '../hooks/use-status-transitions';
import { ProgressOrb } from './ProgressOrb';
import { StatusBadge } from './StatusBadge';
import { StatusPulse } from './StatusPulse';
import { ElapsedTimer } from './ElapsedTimer';
import { AgentThinkingIndicator } from './AgentThinkingIndicator';
import { ActivityTimeline } from './ActivityTimeline';
import type { AgentActivityCardProps, ActivityStep } from '../types';

const AgentActivityCard = React.forwardRef<HTMLDivElement, AgentActivityCardProps>(
  ({ run, expanded = false, onSelect, onToggleExpand, animationDelay = 0 }, ref) => {
    const config = STATUS_CONFIG[run.status];
    const { isTransitioning, transitionClass } = useStatusTransitions(run.status);
    const isActive = isActiveStatus(run.status);

    // Convert current step to activity steps for timeline
    const activitySteps: ActivityStep[] = React.useMemo(() => {
      if (!run.current_step) return [];
      return [
        {
          id: 'current',
          timestamp: run.updated_at,
          description: run.current_step,
          status: isActive ? 'current' : 'completed',
        },
      ];
    }, [run.current_step, run.updated_at, isActive]);

    const handleClick = () => {
      onSelect?.(run.id);
    };

    const handleExpandToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleExpand?.(run.id);
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'bg-card relative overflow-hidden rounded-xl border',
          'transition-all duration-300 ease-out',
          // Hover state
          'hover:border-border/80 hover:shadow-lg',
          // Entry animation
          'animate-slide-up',
          // Active state glow
          isActive && 'border-l-2',
          // Transition animation
          isTransitioning && transitionClass
        )}
        style={{
          animationDelay: `${animationDelay}ms`,
          borderLeftColor: isActive ? config.colour.primary : undefined,
          // @ts-expect-error CSS custom properties
          '--status-glow': config.colour.glow.replace('hsl(', '').replace(')', ''),
        }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      >
        {/* Background glow for active agents */}
        {isActive && (
          <div
            className="pointer-events-none absolute inset-0 opacity-5"
            style={{
              background: `radial-gradient(ellipse at top left, ${config.colour.primary}, transparent 70%)`,
            }}
          />
        )}

        {/* Main content */}
        <div className="relative p-4">
          {/* Header row */}
          <div className="mb-3 flex items-start justify-between gap-3">
            {/* Agent info */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                {isActive && <StatusPulse status={run.status} size="sm" />}
                <h3 className="truncate text-sm font-semibold">{run.agent_name}</h3>
              </div>
              <StatusBadge status={run.status} size="sm" />
            </div>

            {/* Progress orb */}
            <ProgressOrb
              value={run.progress_percent}
              status={run.status}
              size="sm"
              glow={isActive}
            />
          </div>

          {/* Current step / thinking indicator */}
          <div className="mb-3">
            {isActive && run.status === 'in_progress' ? (
              <AgentThinkingIndicator active={true} phase={run.current_step} />
            ) : (
              <p className="text-muted-foreground truncate text-sm">
                {run.current_step || 'Initialising...'}
              </p>
            )}
          </div>

          {/* Metadata row */}
          <div className="flex items-center justify-between text-xs">
            <ElapsedTimer startTime={run.started_at} endTime={run.completed_at} size="sm" />

            {/* Verification attempts */}
            {run.verification_attempts !== undefined && run.verification_attempts > 0 && (
              <span className="text-muted-foreground">
                {run.verification_attempts} verification{run.verification_attempts !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Error display */}
          {run.error && (
            <div className="bg-error/10 border-error/20 mt-3 rounded-lg border p-2">
              <p className="text-error line-clamp-2 text-xs">{run.error}</p>
            </div>
          )}

          {/* Expand toggle */}
          {onToggleExpand && (
            <button
              onClick={handleExpandToggle}
              className={cn(
                'absolute right-2 bottom-2 rounded-md p-1',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-muted transition-colors'
              )}
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="bg-muted/30 border-t p-4">
            {/* Activity timeline */}
            <div className="mb-4">
              <h4 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                Activity
              </h4>
              <ActivityTimeline steps={activitySteps} maxVisible={5} />
            </div>

            {/* Result preview */}
            {run.result !== undefined && run.result !== null && (
              <div>
                <h4 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                  Result
                </h4>
                <pre className="bg-muted/50 max-h-32 overflow-x-auto rounded-lg p-2 text-xs">
                  {String(
                    typeof run.result === 'string'
                      ? run.result
                      : JSON.stringify(run.result as Record<string, unknown>, null, 2)
                  )}
                </pre>
              </div>
            )}

            {/* Verification evidence */}
            {run.verification_evidence && run.verification_evidence.length > 0 && (
              <div className="mt-4">
                <h4 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                  Verification Evidence ({run.verification_evidence.length} items)
                </h4>
                <pre className="bg-muted/50 max-h-24 overflow-auto rounded-lg p-2 text-xs">
                  {JSON.stringify(run.verification_evidence, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

AgentActivityCard.displayName = 'AgentActivityCard';

export { AgentActivityCard };
