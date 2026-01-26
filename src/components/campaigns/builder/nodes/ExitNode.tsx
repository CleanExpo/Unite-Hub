/**
 * Exit Node Component
 *
 * Campaign exit point
 *
 * @module components/campaigns/builder/nodes/ExitNode
 */

'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Flag } from 'lucide-react';

interface ExitNodeData {
  label: string;
  stepId?: string;
  config?: {
    reason?: string;
  };
}

export const ExitNode = memo(({ data, selected }: NodeProps<ExitNodeData>) => {
  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[200px]
        ${selected ? 'border-blue-500 shadow-lg' : 'border-red-500'}
        transition-all duration-200 hover:shadow-lg
      `}
    >
      {/* Icon */}
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-md">
        <Flag className="w-4 h-4 text-white" />
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-red-500 !border-2 !border-white"
      />

      {/* Content */}
      <div className="text-sm font-semibold text-gray-900 mb-1">{data.label}</div>
      {data.config?.reason && (
        <div className="text-xs text-gray-500 line-clamp-2">
          {data.config.reason}
        </div>
      )}
    </div>
  );
});

ExitNode.displayName = 'ExitNode';
