'use client';

/**
 * StatusCommandCentre - Main dashboard container
 * REFACTORED: Timeline/orbital layout with spectral colours
 *
 * DESTROYED:
 * - Generic 2x2/3x3 card grid
 * - Standard rounded corners
 * - Metric tiles grid
 *
 * IMPLEMENTED:
 * - OLED Black (#050505) background
 * - Timeline layout with breathing nodes
 * - Horizontal data strip for metrics
 * - Framer Motion animations
 * - Spectral colours for statuses
 * - Editorial typography with JetBrains Mono
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DEFAULTS, isActiveStatus, isErrorStatus, isSuccessStatus } from '../constants';
import { AgentNode } from './AgentNode';
import { DataStrip } from './DataStrip';
import { NotificationStream } from './NotificationStream';
import type { StatusCommandCentreProps, AgentRun, Notification, ConnectionStatus } from '../types';

const StatusCommandCentre = React.forwardRef<HTMLDivElement, StatusCommandCentreProps>(
  (
    {
      taskId: _taskId,
      agentName: _agentName,
      variant = 'full',
      maxAgents = DEFAULTS.maxAgents,
      showNotifications = true,
      className,
    },
    ref
  ) => {
    const [runs, _setRuns] = React.useState<AgentRun[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [connectionStatus, _setConnectionStatus] = React.useState<ConnectionStatus>('connected');
    const [expandedRunId, setExpandedRunId] = React.useState<string | null>(null);
    const [_selectedRunId, setSelectedRunId] = React.useState<string | null>(null);

    // Derived state
    const activeRuns = React.useMemo(() => runs.filter((r) => isActiveStatus(r.status)), [runs]);
    const completedRuns = React.useMemo(
      () => runs.filter((r) => isSuccessStatus(r.status)),
      [runs]
    );
    const failedRuns = React.useMemo(() => runs.filter((r) => isErrorStatus(r.status)), [runs]);

    // Convert runs to notifications
    const notifications: Notification[] = React.useMemo(() => {
      return runs.slice(-DEFAULTS.maxNotifications).map((run) => ({
        id: run.id,
        timestamp: run.updated_at,
        type: isErrorStatus(run.status)
          ? 'error'
          : isSuccessStatus(run.status)
            ? 'complete'
            : run.status === 'escalated_to_human'
              ? 'escalation'
              : run.status.includes('verification')
                ? 'verification'
                : 'progress',
        agentName: run.agent_name,
        message: run.current_step || `Status: ${run.status}`,
        runId: run.id,
      }));
    }, [runs]);

    // Handlers
    const handleRunSelect = (runId: string) => {
      setSelectedRunId(runId);
    };

    const handleRunExpandToggle = (runId: string) => {
      setExpandedRunId((prev) => (prev === runId ? null : runId));
    };

    const handleNotificationClick = (runId: string) => {
      setSelectedRunId(runId);
      setExpandedRunId(runId);
    };

    // Mock data loading (replace with actual hook integration)
    React.useEffect(() => {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }, []);

    // Loading state
    if (loading) {
      return (
        <div
          ref={ref}
          className={cn(
            'relative min-h-[600px] overflow-hidden rounded-sm border-[0.5px] border-white/[0.06] bg-[#050505] p-8',
            className
          )}
        >
          <LoadingSkeleton />
        </div>
      );
    }

    // Minimal variant
    if (variant === 'minimal') {
      return (
        <div ref={ref} className={cn('flex items-center gap-4', className)}>
          <ConnectionIndicator status={connectionStatus} />
          <span className="font-mono text-xs text-white/40">
            {activeRuns.length} active · {completedRuns.length} completed
          </span>
        </div>
      );
    }

    // Compact variant
    if (variant === 'compact') {
      return (
        <div
          ref={ref}
          className={cn(
            'rounded-sm border-[0.5px] border-white/[0.06] bg-[#050505] p-6',
            className
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-light tracking-tight text-white">Agent Activity</h3>
            <ConnectionIndicator status={connectionStatus} />
          </div>

          {runs.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {runs.slice(0, 3).map((run, index) => (
                <AgentNode key={run.id} run={run} index={index} compact />
              ))}
              {runs.length > 3 && (
                <p className="pt-2 text-center font-mono text-[10px] text-white/30">
                  +{runs.length - 3} more agents
                </p>
              )}
            </div>
          )}
        </div>
      );
    }

    // Full variant - TIMELINE LAYOUT
    return (
      <div
        ref={ref}
        className={cn(
          'relative min-h-[600px] overflow-hidden rounded-sm border-[0.5px] border-white/[0.06] bg-[#050505]',
          className
        )}
      >
        {/* Ambient glow for active agents */}
        <AnimatePresence>
          {activeRuns.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse at 20% 10%, hsl(217 91% 60% / 0.15) 0%, transparent 50%)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="border-b border-white/[0.06] px-8 py-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-1 text-[10px] tracking-[0.3em] text-white/30 uppercase"
              >
                Real-Time Monitoring
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-extralight tracking-tight text-white lg:text-5xl"
              >
                Command Centre
              </motion.h1>
            </div>
            <ConnectionIndicator status={connectionStatus} />
          </div>

          {/* Horizontal Data Strip - REPLACED GRID */}
          <DataStrip
            metrics={[
              { label: 'Total', value: runs.length },
              { label: 'Active', value: activeRuns.length, variant: 'info' },
              { label: 'Completed', value: completedRuns.length, variant: 'success' },
              { label: 'Failed', value: failedRuns.length, variant: 'error' },
            ]}
          />
        </header>

        {/* Main content - TIMELINE LAYOUT */}
        <div className="flex min-h-[400px]">
          {/* Agent timeline */}
          <div
            className={cn(
              'flex-1 overflow-y-auto p-8',
              showNotifications && 'border-r border-white/[0.06]'
            )}
          >
            {runs.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="relative pl-4">
                {/* Vertical Timeline Spine */}
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.3, duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
                  className="absolute top-0 bottom-0 left-8 w-px origin-top bg-gradient-to-b from-white/10 via-white/5 to-transparent"
                />

                {/* Agent Nodes - TIMELINE, NOT GRID */}
                <div className="space-y-8">
                  {runs.slice(0, maxAgents).map((run, index) => (
                    <AgentNode
                      key={run.id}
                      run={run}
                      index={index}
                      expanded={expandedRunId === run.id}
                      onSelect={handleRunSelect}
                      onToggleExpand={handleRunExpandToggle}
                    />
                  ))}
                </div>

                {runs.length > maxAgents && (
                  <p className="mt-6 text-center font-mono text-[10px] text-white/30">
                    Showing {maxAgents} of {runs.length} agents
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notification stream sidebar */}
          {showNotifications && (
            <div className="w-80 flex-shrink-0 bg-white/[0.01]">
              <NotificationStream
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                className="h-full"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute right-8 bottom-4 left-8 flex items-center justify-between"
        >
          <p className="font-mono text-[10px] text-white/20">GENESIS PROTOCOL v2.0.1</p>
          <p className="font-mono text-[10px] text-white/20">
            {new Date().toLocaleDateString('en-AU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </p>
        </motion.footer>
      </div>
    );
  }
);

StatusCommandCentre.displayName = 'StatusCommandCentre';

// Connection status indicator
function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const statusConfig = {
    connected: { colour: '#00FF88', label: 'Live' },
    reconnecting: { colour: '#FFB800', label: 'Reconnecting' },
    disconnected: { colour: '#FF4444', label: 'Offline' },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 rounded-sm border-[0.5px] border-white/10 px-3 py-1.5"
    >
      <motion.span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config.colour }}
        animate={
          status === 'connected'
            ? { opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }
            : status === 'reconnecting'
              ? { opacity: [1, 0.5, 1] }
              : {}
        }
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span
        className="font-mono text-[10px] tracking-wider uppercase"
        style={{ color: config.colour }}
      >
        {config.label}
      </span>
    </motion.div>
  );
}

// Empty state
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-[0.5px] border-white/10 bg-white/[0.02]">
        <motion.div
          className="h-3 w-3 rounded-full bg-white/20"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <h3 className="mb-2 text-xl font-light text-white">No Active Agents</h3>
      <p className="max-w-xs text-center font-mono text-xs text-white/40">
        When agents start working, their activity will appear here in real-time.
      </p>
    </motion.div>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-4">
        <motion.div
          className="h-3 w-32 rounded-sm bg-white/5"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div
          className="h-10 w-64 rounded-sm bg-white/5"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
        />
      </div>

      {/* Data strip skeleton */}
      <div className="flex gap-8">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="h-6 w-20 rounded-sm bg-white/5"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
      </div>

      {/* Timeline skeleton */}
      <div className="relative pl-4">
        <div className="absolute top-0 bottom-0 left-8 w-px bg-white/5" />
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-6">
              <motion.div
                className="h-12 w-12 rounded-full bg-white/5"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
              />
              <div className="flex-1 space-y-2">
                <motion.div
                  className="h-6 w-48 rounded-sm bg-white/5"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                />
                <motion.div
                  className="h-4 w-32 rounded-sm bg-white/5"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 + 0.05 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { StatusCommandCentre };
