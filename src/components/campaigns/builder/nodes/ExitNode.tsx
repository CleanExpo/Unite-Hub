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

const ACCENT = '#FF4444';

export const ExitNode = memo(({ data, selected }: NodeProps<ExitNodeData>) => {
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
        <Flag className="w-4 h-4 text-white" />
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
      {data.config?.reason && (
        <div className="font-mono text-xs text-white/40 line-clamp-2">
          {data.config.reason}
        </div>
      )}
    </div>
  );
});

ExitNode.displayName = 'ExitNode';
