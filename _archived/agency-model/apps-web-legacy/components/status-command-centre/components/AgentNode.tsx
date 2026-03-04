'use client';

/**
 * AgentNode - Timeline node for agent activity
 * REPLACES: AgentActivityCard (generic card)
 *
 * DESIGN:
 * - Breathing orb with spectral colour based on status
 * - Timeline node layout (not card)
 * - JetBrains Mono for data values
 * - Editorial typography for names
 * - Framer Motion animations
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG, isActiveStatus, isErrorStatus, isSuccessStatus } from '../constants';
import { ElapsedTimer } from './ElapsedTimer';
import type { AgentRun } from '../types';

// Spectral colour mapping for statuses
const SPECTRAL_COLOURS: Record<string, string> = {
  pending: '#6B7280',
  in_progress: '#00F5FF',
  awaiting_verification: '#FFB800',
  verification_in_progress: '#FFB800',
  verification_passed: '#00FF88',
  verification_failed: '#FF4444',
  completed: '#00FF88',
  failed: '#FF4444',
  blocked: '#FF8800',
  escalated_to_human: '#FF00FF',
};

interface AgentNodeProps {
  run: AgentRun;
  index: number;
  expanded?: boolean;
  compact?: boolean;
  onSelect?: (runId: string) => void;
  onToggleExpand?: (runId: string) => void;
}

const AgentNode = React.forwardRef<HTMLDivElement, AgentNodeProps>(
  ({ run, index, expanded = false, compact = false, onSelect, onToggleExpand }, ref) => {
    const config = STATUS_CONFIG[run.status];
    const isActive = isActiveStatus(run.status);
    const isError = isErrorStatus(run.status);
    const isSuccess = isSuccessStatus(run.status);
    const spectralColour = SPECTRAL_COLOURS[run.status] || '#6B7280';

    const handleClick = () => {
      onSelect?.(run.id);
    };

    const handleExpandClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleExpand?.(run.id);
    };

    // Compact mode for sidebar/minimal views
    if (compact) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-3"
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: spectralColour,
              boxShadow: isActive ? `0 0 10px ${spectralColour}60` : 'none',
            }}
          />
          <span className="flex-1 truncate text-sm text-white/70">{run.agent_name}</span>
          <span className="font-mono text-[10px] text-white/30">{run.progress_percent}%</span>
        </motion.div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className="relative flex items-start gap-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          delay: index * 0.1,
          duration: 0.5,
          ease: [0.19, 1, 0.22, 1],
        }}
      >
        {/* Node Orb */}
        <div className="relative flex flex-col items-center">
          {/* Connector line above (for non-first items) */}
          {index > 0 && (
            <div
              className="absolute -top-8 h-8 w-px"
              style={{
                background: `linear-gradient(to bottom, transparent, ${spectralColour}30)`,
              }}
            />
          )}

          {/* The breathing orb */}
          <motion.button
            onClick={handleClick}
            className={cn(
              'relative z-10 flex h-12 w-12 items-center justify-center',
              'rounded-full border-[0.5px]',
              'transition-all duration-300',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]'
            )}
            style={{
              borderColor: isActive ? `${spectralColour}50` : 'rgba(255,255,255,0.1)',
              backgroundColor: isActive ? `${spectralColour}10` : 'rgba(255,255,255,0.02)',
              boxShadow: isActive
                ? `0 0 30px ${spectralColour}40, 0 0 60px ${spectralColour}20, inset 0 0 15px ${spectralColour}15`
                : 'none',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            aria-label={`${run.agent_name} - ${config.label}`}
          >
            {/* Inner breathing core */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  className="absolute inset-2 rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [0.9, 1, 0.9],
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{
                    background: `radial-gradient(circle, ${spectralColour}40 0%, transparent 70%)`,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Progress percentage */}
            <span
              className="relative z-10 font-mono text-xs font-medium"
              style={{ color: spectralColour }}
            >
              {run.progress_percent}%
            </span>

            {/* Active indicator ring */}
            {isActive && (
              <motion.div
                className="absolute -inset-1 rounded-full border-[0.5px]"
                style={{ borderColor: `${spectralColour}40` }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.2, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
          </motion.button>

          {/* Status dot below */}
          <motion.div
            className="mt-2 h-1 w-1 rounded-full"
            style={{
              backgroundColor: isError
                ? '#FF4444'
                : isSuccess
                  ? '#00FF88'
                  : isActive
                    ? spectralColour
                    : 'rgba(255,255,255,0.2)',
            }}
            animate={isActive ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 pt-1">
          {/* Agent name - Editorial */}
          <motion.h3
            className="mb-1 text-2xl font-light tracking-tight"
            style={{
              color: isActive ? spectralColour : 'rgba(255,255,255,0.7)',
              textShadow: isActive ? `0 0 20px ${spectralColour}40` : 'none',
            }}
          >
            {run.agent_name}
          </motion.h3>

          {/* Status label */}
          <p className="mb-2 text-[10px] tracking-[0.2em] text-white/40 uppercase">
            {config.label}
          </p>

          {/* Current step */}
          {run.current_step && (
            <p className="mb-3 font-mono text-xs text-white/50">{run.current_step}</p>
          )}

          {/* Data strip */}
          <div className="flex items-center gap-4">
            <ElapsedTimer startTime={run.started_at} endTime={run.completed_at} size="sm" />

            {run.verification_attempts !== undefined && run.verification_attempts > 0 && (
              <span className="font-mono text-[10px] text-white/30">
                {run.verification_attempts} verification{run.verification_attempts !== 1 ? 's' : ''}
              </span>
            )}

            {onToggleExpand && (
              <button
                onClick={handleExpandClick}
                className="font-mono text-[10px] text-white/30 transition-colors hover:text-white/60"
              >
                {expanded ? '[ collapse ]' : '[ expand ]'}
              </button>
            )}
          </div>

          {/* Error display */}
          {run.error && (
            <div className="mt-3 rounded-sm border-[0.5px] border-red-500/30 bg-red-500/10 px-3 py-2">
              <p className="font-mono text-xs text-red-400">{run.error}</p>
            </div>
          )}

          {/* Expanded content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 overflow-hidden"
              >
                <div className="border-t border-white/[0.06] pt-4">
                  {/* Result preview */}
                  {run.result !== undefined && run.result !== null && (
                    <div className="mb-4">
                      <h4 className="mb-2 text-[10px] tracking-widest text-white/30 uppercase">
                        Result
                      </h4>
                      <pre className="overflow-x-auto rounded-sm border-[0.5px] border-white/10 bg-white/[0.02] p-3 font-mono text-xs text-white/60">
                        {String(
                          typeof run.result === 'string'
                            ? run.result
                            : JSON.stringify(run.result, null, 2)
                        )}
                      </pre>
                    </div>
                  )}

                  {/* Verification evidence */}
                  {run.verification_evidence && run.verification_evidence.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-[10px] tracking-widest text-white/30 uppercase">
                        Verification Evidence ({run.verification_evidence.length})
                      </h4>
                      <pre className="overflow-x-auto rounded-sm border-[0.5px] border-white/10 bg-white/[0.02] p-2 font-mono text-xs text-white/50">
                        {JSON.stringify(run.verification_evidence, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }
);

AgentNode.displayName = 'AgentNode';

export { AgentNode };
