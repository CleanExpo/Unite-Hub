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

export const ConditionNode = memo(({ data, selected }: NodeProps<ConditionNodeData>) => {
  const branchCount = data.config?.branches?.length || 2;

  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[200px]
        ${selected ? 'border-blue-500 shadow-lg' : 'border-violet-500'}
        transition-all duration-200 hover:shadow-lg
      `}
    >
      {/* Icon */}
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center shadow-md">
        <GitBranch className="w-4 h-4 text-white" />
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-violet-500 !border-2 !border-white"
      />

      {/* Content */}
      <div className="text-sm font-semibold text-gray-900 mb-1">{data.label}</div>
      <div className="text-xs text-gray-500">{branchCount} branches</div>

      {/* Output Handles - True (left) and False (right) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '33%' }}
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '66%' }}
        className="w-3 h-3 !bg-red-500 !border-2 !border-white"
      />

      {/* Labels for outputs */}
      <div className="absolute -bottom-5 left-0 right-0 flex justify-around text-[10px] text-gray-400">
        <span className="text-green-600">Yes</span>
        <span className="text-red-600">No</span>
      </div>
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
