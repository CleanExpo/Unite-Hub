'use client';

/**
 * Execution Panel — Scientific Luxury Edition
 *
 * Real-time workflow execution monitoring with:
 * - Spectral colour status indicators
 * - Breathing orb animations for running state
 * - Per-node execution logs with timing
 * - Scientific Luxury OLED black styling
 *
 * @see docs/DESIGN_SYSTEM.md
 */

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type ExecutionDetailResponse,
  type ExecutionLogEntry,
  type ExecutionResponse,
  type ExecutionStatus,
  useWorkflowExecution,
} from '@/hooks/use-workflow-execution';
import { formatAustralianDateTime } from '@/types/workflow';

// Status to spectral colour mapping
const STATUS_COLOURS: Record<ExecutionStatus, string> = {
  pending: '#6B7280',
  running: '#00F5FF',
  completed: '#00FF88',
  failed: '#FF4444',
  cancelled: '#6B7280',
};

const STATUS_LABELS: Record<ExecutionStatus, string> = {
  pending: 'Pending',
  running: 'Executing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

interface ExecutionPanelProps {
  workflowId: string;
  onNodeStatusChange?: (nodeStatuses: Map<string, ExecutionStatus>) => void;
}

export function ExecutionPanel({ workflowId, onNodeStatusChange }: ExecutionPanelProps) {
  const {
    execution,
    isRunning,
    error,
    nodeStatuses,
    currentNodeId,
    startExecution,
    history,
    loadHistory,
  } = useWorkflowExecution({ workflowId });

  const [showHistory, setShowHistory] = useState(false);
  const [inputData, setInputData] = useState('{}');

  // Notify parent of node status changes
  useEffect(() => {
    onNodeStatusChange?.(nodeStatuses);
  }, [nodeStatuses, onNodeStatusChange]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleExecute = useCallback(async () => {
    try {
      const parsed = JSON.parse(inputData);
      await startExecution(parsed);
    } catch {
      await startExecution({});
    }
  }, [inputData, startExecution]);

  return (
    <div className="flex h-full flex-col border-l border-white/[0.06] bg-[#050505]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <h3 className="font-mono text-sm tracking-wide text-white/80 uppercase">Execution</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="font-mono text-xs text-white/40 transition-colors hover:text-white/70"
          >
            {showHistory ? 'Live' : 'History'}
          </button>
        </div>
      </div>

      {showHistory ? (
        <ExecutionHistory history={history} />
      ) : (
        <>
          {/* Execute Button + Input */}
          <div className="space-y-2 border-b border-white/[0.06] px-4 py-3">
            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder='{"key": "value"}'
              className="h-16 w-full resize-none rounded-sm border border-white/[0.06] bg-[#0A0A0A] px-3 py-2 font-mono text-xs text-white/70 placeholder:text-white/20 focus:border-[#00F5FF]/30 focus:outline-none"
            />
            <motion.button
              onClick={handleExecute}
              disabled={isRunning}
              whileTap={{ scale: 0.97 }}
              className={`w-full rounded-sm border border-white/[0.06] py-2 font-mono text-xs tracking-wider uppercase transition-colors ${
                isRunning
                  ? 'cursor-not-allowed bg-[#00F5FF]/10 text-[#00F5FF]/60'
                  : 'bg-[#00FF88]/10 text-[#00FF88] hover:bg-[#00FF88]/20'
              }`}
            >
              {isRunning ? 'Executing...' : 'Execute Workflow'}
            </motion.button>
          </div>

          {/* Execution Status */}
          <AnimatePresence mode="wait">
            {execution && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="border-b border-white/[0.06] px-4 py-3"
              >
                <ExecutionStatusBar execution={execution} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="border-b border-[#FF4444]/20 px-4 py-2">
              <p className="font-mono text-xs text-[#FF4444]">{error}</p>
            </div>
          )}

          {/* Node Execution Logs */}
          <div className="flex-1 overflow-y-auto">
            {execution?.logs && execution.logs.length > 0 ? (
              <ExecutionLogList logs={execution.logs} currentNodeId={currentNodeId} />
            ) : (
              <div className="flex h-32 items-center justify-center">
                <p className="font-mono text-xs text-white/20">No execution data</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Status bar with breathing orb animation */
function ExecutionStatusBar({ execution }: { execution: ExecutionDetailResponse }) {
  const colour = STATUS_COLOURS[execution.status] || '#6B7280';
  const label = STATUS_LABELS[execution.status] || execution.status;
  const isActive = execution.status === 'running';

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* Breathing orb */}
        <motion.div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: colour }}
          animate={
            isActive
              ? {
                  opacity: [1, 0.4, 1],
                  scale: [1, 1.2, 1],
                }
              : {}
          }
          transition={
            isActive
              ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : {}
          }
        />
        <span className="font-mono text-xs tracking-wider uppercase" style={{ color: colour }}>
          {label}
        </span>
      </div>

      {execution.duration_ms != null && (
        <span className="font-mono text-xs text-white/30">{execution.duration_ms}ms</span>
      )}
    </div>
  );
}

/** List of per-node execution logs */
function ExecutionLogList({
  logs,
  currentNodeId,
}: {
  logs: ExecutionLogEntry[];
  currentNodeId: string | null;
}) {
  return (
    <div className="divide-y divide-white/[0.04]">
      {logs.map((log, idx) => (
        <ExecutionLogItem
          key={log.id}
          log={log}
          isCurrentNode={log.node_id === currentNodeId}
          index={idx}
        />
      ))}
    </div>
  );
}

/** Single node execution log entry */
function ExecutionLogItem({
  log,
  isCurrentNode,
  index,
}: {
  log: ExecutionLogEntry;
  isCurrentNode: boolean;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const colour = STATUS_COLOURS[log.status as ExecutionStatus] || '#6B7280';
  const isActive = log.status === 'running';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={`cursor-pointer px-4 py-2 transition-colors hover:bg-white/[0.02] ${isCurrentNode ? 'bg-[#00F5FF]/[0.04]' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Status dot */}
          <motion.div
            className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: colour }}
            animate={
              isActive
                ? {
                    opacity: [1, 0.3, 1],
                  }
                : {}
            }
            transition={
              isActive
                ? {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
                : {}
            }
          />
          <span className="max-w-[160px] truncate font-mono text-xs text-white/60">
            {log.node_id.slice(0, 8)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {log.duration_ms != null && (
            <span className="font-mono text-[10px] text-white/25">{log.duration_ms}ms</span>
          )}
          <span className="font-mono text-[10px] uppercase" style={{ color: colour }}>
            {log.status}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1">
              {log.error_message && (
                <div className="rounded-sm bg-[#FF4444]/[0.06] px-2 py-1">
                  <p className="font-mono text-[10px] text-[#FF4444]">{log.error_message}</p>
                </div>
              )}
              {log.output_data && (
                <pre className="max-h-24 overflow-x-auto rounded-sm bg-white/[0.02] px-2 py-1 font-mono text-[10px] text-white/30">
                  {JSON.stringify(log.output_data, null, 2)}
                </pre>
              )}
              {log.started_at && (
                <p className="font-mono text-[10px] text-white/15">
                  Started: {formatAustralianDateTime(log.started_at)}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Execution history list */
function ExecutionHistory({ history }: { history: ExecutionResponse[] }) {
  if (history.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="font-mono text-xs text-white/20">No execution history</p>
      </div>
    );
  }

  return (
    <div className="flex-1 divide-y divide-white/[0.04] overflow-y-auto">
      {history.map((exec) => {
        const colour = STATUS_COLOURS[exec.status] || '#6B7280';
        return (
          <div key={exec.id} className="px-4 py-3 transition-colors hover:bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colour }} />
                <span className="font-mono text-xs text-white/50">{exec.id.slice(0, 8)}</span>
              </div>
              <span className="font-mono text-[10px] uppercase" style={{ color: colour }}>
                {exec.status}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-[10px] text-white/20">
                {exec.created_at ? formatAustralianDateTime(exec.created_at) : '—'}
              </span>
              {exec.duration_ms != null && (
                <span className="font-mono text-[10px] text-white/15">{exec.duration_ms}ms</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
