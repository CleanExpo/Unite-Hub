'use client';

/**
 * DataStrip - Horizontal metrics display
 * REPLACES: MetricTile grid (grid-cols-4)
 *
 * DESIGN:
 * - Horizontal inline strip (not grid)
 * - Single pixel borders
 * - JetBrains Mono for values
 * - Spectral colours for variants
 * - No cards, just clean data
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Spectral colours for variants
const VARIANT_COLOURS = {
  default: '#FFFFFF',
  info: '#00F5FF',
  success: '#00FF88',
  warning: '#FFB800',
  error: '#FF4444',
};

interface Metric {
  label: string;
  value: number | string;
  variant?: keyof typeof VARIANT_COLOURS;
}

interface DataStripProps {
  metrics: Metric[];
  className?: string;
}

const DataStrip = React.forwardRef<HTMLDivElement, DataStripProps>(
  ({ metrics, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          'flex items-center gap-8',
          'rounded-sm border-[0.5px] border-white/[0.06]',
          'bg-white/[0.01] px-6 py-3',
          className
        )}
      >
        {metrics.map((metric, index) => {
          const colour = VARIANT_COLOURS[metric.variant || 'default'];
          const isHighlighted = metric.variant && metric.variant !== 'default';

          return (
            <React.Fragment key={metric.label}>
              {/* Separator */}
              {index > 0 && <div className="h-4 w-px bg-white/10" />}

              {/* Metric */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="flex items-baseline gap-2"
              >
                <span className="text-[10px] tracking-widest text-white/30 uppercase">
                  {metric.label}
                </span>
                <motion.span
                  className="font-mono text-lg font-medium tabular-nums"
                  style={{
                    color: isHighlighted ? colour : 'rgba(255,255,255,0.8)',
                    textShadow: isHighlighted ? `0 0 15px ${colour}40` : 'none',
                  }}
                  animate={
                    isHighlighted && Number(metric.value) > 0 ? { opacity: [1, 0.7, 1] } : {}
                  }
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {metric.value}
                </motion.span>
              </motion.div>
            </React.Fragment>
          );
        })}
      </motion.div>
    );
  }
);

DataStrip.displayName = 'DataStrip';

export { DataStrip };
