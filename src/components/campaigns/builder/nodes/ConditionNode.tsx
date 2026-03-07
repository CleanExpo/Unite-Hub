/**
 * Condition Node Component
 *
 * Conditional branching (if/else logic)
 *
 * @module components/campaigns/builder/nodes/ConditionNode
 */

'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';

interface ConditionNodeData {
  label: string;
  stepId?: string;
  config?: {
    branches?: Array<{
      id: string;
      condition: any;
      target_node_id: string;
      label?: string;
    }>;
  };
}

const ACCENT = '#FF00FF';

export const ConditionNode = memo(({ data, selected }: NodeProps<ConditionNodeData>) => {
  const branchCount = data.config?.branches?.length || 2;

  return (
    <div
      className="relative px-4 py-3 rounded-sm min-w-[200px] bg-white/[0.04] transition-all duration-200"
      style={{
        border: `2px solid ${selected ? '#00F5FF' : ACCENT}`,
        boxShadow: selected ? `0 0 0 1px #00F5FF40` : undefined,
      }}
    >
      {/* Icon badge */}
      <div
        className="absolute -top-3 -left-3 w-8 h-8 rounded-sm flex items-center justify-center"
        style={{ backgroundColor: ACCENT }}
      >
        <GitBranch className="w-4 h-4 text-[#050505]" />
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: ACCENT, borderColor: '#050505' }}
        className="w-3 h-3 !border-2"
      />

      {/* Content */}
      <div className="font-mono text-sm font-semibold text-white mb-1">{data.label}</div>
      <div className="font-mono text-xs text-white/40">{branchCount} branches</div>

      {/* Output Handles — True (left) and False (right) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '33%', background: '#00FF88', borderColor: '#050505' }}
        className="w-3 h-3 !border-2"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '66%', background: '#FF4444', borderColor: '#050505' }}
        className="w-3 h-3 !border-2"
      />

      {/* Labels for outputs */}
      <div className="absolute -bottom-5 left-0 right-0 flex justify-around text-[10px] font-mono">
        <span style={{ color: '#00FF88' }}>Yes</span>
        <span style={{ color: '#FF4444' }}>No</span>
      </div>
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
