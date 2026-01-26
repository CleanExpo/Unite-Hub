/**
 * Trigger Node Component
 *
 * Entry point node for campaign workflows
 *
 * @module components/campaigns/builder/nodes/TriggerNode
 */

'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play, Calendar, Tag, TrendingUp, Webhook } from 'lucide-react';

interface TriggerNodeData {
  label: string;
  stepId?: string;
  config?: {
    trigger_type: 'manual' | 'new_contact' | 'tag' | 'score_threshold' | 'webhook' | 'scheduled';
    trigger_config?: any;
  };
}

const triggerIcons = {
  manual: Play,
  new_contact: Play,
  tag: Tag,
  score_threshold: TrendingUp,
  webhook: Webhook,
  scheduled: Calendar,
};

export const TriggerNode = memo(({ data, selected }: NodeProps<TriggerNodeData>) => {
  const triggerType = data.config?.trigger_type || 'manual';
  const Icon = triggerIcons[triggerType];

  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[200px]
        ${selected ? 'border-blue-500 shadow-lg' : 'border-emerald-500'}
        transition-all duration-200 hover:shadow-lg
      `}
    >
      {/* Icon */}
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
        <Icon className="w-4 h-4 text-white" />
      </div>

      {/* Content */}
      <div className="text-sm font-semibold text-gray-900 mb-1">{data.label}</div>
      <div className="text-xs text-gray-500 capitalize">
        {triggerType.replace('_', ' ')}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-emerald-500 !border-2 !border-white"
      />
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';
