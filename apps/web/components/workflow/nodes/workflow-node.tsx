'use client';

/**
 * Unified Workflow Node Component - Scientific Luxury Edition
 *
 * Single node component that handles all node types with spectral colour mapping.
 * Features breathing animations for active states and physics-based transitions.
 *
 * @see docs/DESIGN_SYSTEM.md for styling reference
 */

import { memo, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion, type Easing } from 'framer-motion';
import {
  Play,
  Zap,
  Square,
  Send,
  Brain,
  Bot,
  Wrench,
  MousePointer,
  GitBranch,
  Cog,
  Repeat,
  Database,
  Globe,
  Code,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';
import { SPECTRAL, DURATIONS } from '@/lib/design-tokens';
import {
  NODE_SPECTRAL_COLOURS,
  NODE_STATUS_COLOURS,
  type NodeType,
  type NodeVisualStatus,
} from '@/types/workflow';

// Icon mapping for node types
const NODE_ICONS: Record<NodeType, LucideIcon> = {
  start: Play,
  trigger: Zap,
  end: Square,
  output: Send,
  llm: Brain,
  agent: Bot,
  tool: Wrench,
  action: MousePointer,
  conditional: GitBranch,
  logic: Cog,
  loop: Repeat,
  knowledge: Database,
  http: Globe,
  code: Code,
  verification: CheckCircle,
};

// Node data interface for custom data
interface WorkflowNodeData {
  label: string;
  nodeType: NodeType;
  description?: string;
  status?: NodeVisualStatus;
  config?: Record<string, unknown>;
}

// Proper NodeProps type for @xyflow/react
type WorkflowNodeProps = NodeProps & {
  data: WorkflowNodeData;
};

const EASE_IN_OUT: Easing = 'easeInOut';

function WorkflowNodeInner({ data, selected }: WorkflowNodeProps) {
  const nodeType: NodeType = data.nodeType || 'action';
  const colour = NODE_SPECTRAL_COLOURS[nodeType] || SPECTRAL.grey;
  const status: NodeVisualStatus = data.status || 'idle';
  const statusColour = NODE_STATUS_COLOURS[status];
  const Icon = NODE_ICONS[nodeType] || Cog;

  // Determine if node should show breathing animation
  const isActive = status === 'running';
  const hasStatus = status !== 'idle';

  // Handle visibility based on node type
  const hasInputHandle = !['start', 'trigger'].includes(nodeType);
  const hasOutputHandle = !['end', 'output'].includes(nodeType);

  // Memoize animation config
  const breathingBoxShadow = useMemo(
    () => [`0 0 0 ${statusColour}00`, `0 0 20px ${statusColour}40`, `0 0 0 ${statusColour}00`],
    [statusColour]
  );

  // Border colour: status takes priority over selection
  const borderColour = useMemo(() => {
    if (hasStatus) return `${statusColour}80`;
    if (selected) return `${colour}80`;
    return 'rgba(255, 255, 255, 0.06)';
  }, [hasStatus, statusColour, selected, colour]);

  // Box shadow: status glow for completed/failed, selection glow otherwise
  const staticBoxShadow = useMemo(() => {
    if (status === 'completed') return `0 0 16px ${statusColour}25`;
    if (status === 'failed') return `0 0 16px ${statusColour}25`;
    if (status === 'awaiting') return `0 0 12px ${statusColour}20`;
    if (selected) return `0 0 20px ${colour}30`;
    return 'none';
  }, [status, statusColour, selected, colour]);

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: DURATIONS.normal, ease: [0.19, 1, 0.22, 1] }}
    >
      {/* Input Handle */}
      {hasInputHandle && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-3 !w-3 !rounded-full !border-2 transition-all duration-200"
          style={{
            backgroundColor: '#050505',
            borderColor: selected ? colour : 'rgba(255, 255, 255, 0.2)',
          }}
        />
      )}

      {/* Node Body */}
      <motion.div
        className="min-w-[180px] overflow-hidden rounded-sm border-[0.5px] transition-all duration-300"
        style={{
          backgroundColor: '#050505',
          borderColor: borderColour,
          boxShadow: isActive ? undefined : staticBoxShadow,
        }}
        animate={isActive ? { boxShadow: breathingBoxShadow } : {}}
        transition={
          isActive
            ? {
                duration: DURATIONS.breathing,
                repeat: Infinity,
                ease: EASE_IN_OUT,
              }
            : undefined
        }
      >
        {/* Header with spectral accent */}
        <div
          className="flex items-center gap-3 border-b-[0.5px] px-4 py-3"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.06)',
            background: `linear-gradient(135deg, ${colour}10 0%, transparent 100%)`,
          }}
        >
          {/* Icon Container with Breathing Orb */}
          <motion.div
            className="relative flex h-10 w-10 items-center justify-center rounded-sm border-[0.5px]"
            style={{
              borderColor: `${colour}30`,
              backgroundColor: `${colour}10`,
            }}
            animate={
              isActive
                ? {
                    scale: [1, 1.05, 1],
                    opacity: [1, 0.8, 1],
                  }
                : {}
            }
            transition={
              isActive
                ? {
                    duration: DURATIONS.breathing,
                    repeat: Infinity,
                    ease: EASE_IN_OUT,
                  }
                : undefined
            }
          >
            <Icon className="h-5 w-5" style={{ color: colour }} />

            {/* Status Indicator Dot */}
            {status !== 'idle' && (
              <motion.div
                className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-[#050505]"
                style={{ backgroundColor: statusColour }}
                animate={
                  isActive
                    ? {
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.6, 1],
                      }
                    : {}
                }
                transition={
                  isActive
                    ? {
                        duration: 1,
                        repeat: Infinity,
                        ease: EASE_IN_OUT,
                      }
                    : undefined
                }
              />
            )}
          </motion.div>

          {/* Label and Type */}
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-medium"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              {data.label}
            </p>
            <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: colour }}>
              {nodeType}
            </p>
          </div>
        </div>

        {/* Description / Status */}
        {(data.description || status !== 'idle') && (
          <div className="px-4 py-2">
            {data.description && (
              <p className="truncate text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                {data.description}
              </p>
            )}
            {status !== 'idle' && (
              <div className="mt-1 flex items-center gap-2">
                <motion.div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: statusColour }}
                  animate={
                    isActive
                      ? {
                          opacity: [1, 0.4, 1],
                        }
                      : {}
                  }
                  transition={
                    isActive
                      ? {
                          duration: 0.8,
                          repeat: Infinity,
                          ease: EASE_IN_OUT,
                        }
                      : undefined
                  }
                />
                <span
                  className="text-[10px] tracking-wider uppercase"
                  style={{ color: statusColour }}
                >
                  {status}
                </span>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Output Handle */}
      {hasOutputHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-3 !w-3 !rounded-full !border-2 transition-all duration-200"
          style={{
            backgroundColor: '#050505',
            borderColor: selected ? colour : 'rgba(255, 255, 255, 0.2)',
          }}
        />
      )}

      {/* Conditional Handles for branching nodes */}
      {(nodeType === 'conditional' || nodeType === 'logic') && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="!h-3 !w-3 !rounded-full !border-2"
            style={{
              backgroundColor: '#050505',
              borderColor: SPECTRAL.emerald,
              top: '50%',
            }}
          />
          <Handle
            type="source"
            position={Position.Left}
            id="false"
            className="!h-3 !w-3 !rounded-full !border-2"
            style={{
              backgroundColor: '#050505',
              borderColor: SPECTRAL.red,
              top: '50%',
            }}
          />
        </>
      )}
    </motion.div>
  );
}

// Memoize to prevent unnecessary re-renders
export const WorkflowNodeComponent = memo(WorkflowNodeInner);
