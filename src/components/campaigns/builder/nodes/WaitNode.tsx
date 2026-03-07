/**
 * Wait Node Component
 *
 * Delay execution (duration or event-based)
 *
 * @module components/campaigns/builder/nodes/WaitNode
 */

'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Clock, Zap } from 'lucide-react';

interface WaitNodeData {
  label: string;
  stepId?: string;
  config?: {
    type: 'duration' | 'until_event' | 'until_time';
    value?: number;
    unit?: 'minutes' | 'hours' | 'days' | 'weeks';
    event_type?: string;
  };
}

const ACCENT = '#FFB800';

export const WaitNode = memo(({ data, selected }: NodeProps<WaitNodeData>) => {
  const isEventBased = data.config?.type === 'until_event';
  const duration = data.config?.value
    ? `${data.config.value} ${data.config.unit}`
    : 'Not configured';

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
        {isEventBased ? (
          <Zap className="w-4 h-4 text-[#050505]" />
        ) : (
          <Clock className="w-4 h-4 text-[#050505]" />
        )}
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
      <div className="font-mono text-xs text-white/40">
        {isEventBased ? `Wait for: ${data.config?.event_type}` : duration}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: ACCENT, borderColor: '#050505' }}
        className="w-3 h-3 !border-2"
      />
    </div>
  );
});

WaitNode.displayName = 'WaitNode';
