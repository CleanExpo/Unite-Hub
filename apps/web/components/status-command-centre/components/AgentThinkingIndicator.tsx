'use client';

/**
 * AgentThinkingIndicator - AI thinking animation with dots
 * Elite Command Centre component
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { AgentThinkingIndicatorProps } from '../types';

const AgentThinkingIndicator = React.forwardRef<HTMLDivElement, AgentThinkingIndicatorProps>(
  ({ active, phase, className }, ref) => {
    if (!active) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn('text-muted-foreground inline-flex items-center gap-2 text-sm', className)}
      >
        {/* Animated dots */}
        <div className="flex items-center gap-1">
          <span
            className="bg-brand-primary animate-thinking-wave h-1.5 w-1.5 rounded-full"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="bg-brand-primary animate-thinking-wave h-1.5 w-1.5 rounded-full"
            style={{ animationDelay: '100ms' }}
          />
          <span
            className="bg-brand-primary animate-thinking-wave h-1.5 w-1.5 rounded-full"
            style={{ animationDelay: '200ms' }}
          />
        </div>

        {/* Optional phase label */}
        {phase && <span className="text-muted-foreground text-xs font-medium">{phase}</span>}
      </div>
    );
  }
);

AgentThinkingIndicator.displayName = 'AgentThinkingIndicator';

export { AgentThinkingIndicator };
