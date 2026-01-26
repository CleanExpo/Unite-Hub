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

export const WaitNode = memo(({ data, selected }: NodeProps<WaitNodeData>) => {
  const isEventBased = data.config?.type === 'until_event';
  const duration = data.config?.value
    ? `${data.config.value} ${data.config.unit}`
    : 'Not configured';

  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[200px]
        ${selected ? 'border-blue-500 shadow-lg' : 'border-amber-500'}
        transition-all duration-200 hover:shadow-lg
      `}
    >
      {/* Icon */}
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
        {isEventBased ? (
          <Zap className="w-4 h-4 text-white" />
        ) : (
          <Clock className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-amber-500 !border-2 !border-white"
      />

      {/* Content */}
      <div className="text-sm font-semibold text-gray-900 mb-1">{data.label}</div>
      <div className="text-xs text-gray-500">
        {isEventBased ? `Wait for: ${data.config.event_type}` : duration}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-amber-500 !border-2 !border-white"
      />
    </div>
  );
});

WaitNode.displayName = 'WaitNode';
