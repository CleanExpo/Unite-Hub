/**
 * Action Node Component
 *
 * Execute actions (tag, score, webhook, etc.)
 *
 * @module components/campaigns/builder/nodes/ActionNode
 */

'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Zap, Tag, TrendingUp, Webhook, RefreshCw, Bell } from 'lucide-react';

interface ActionNodeData {
  label: string;
  stepId?: string;
  config?: {
    type: 'tag' | 'score' | 'field_update' | 'webhook' | 'segment' | 'notification';
    [key: string]: any;
  };
}

const actionIcons = {
  tag: Tag,
  score: TrendingUp,
  field_update: RefreshCw,
  webhook: Webhook,
  segment: Zap,
  notification: Bell,
};

const actionColors = {
  tag: 'bg-cyan-500 border-cyan-500',
  score: 'bg-orange-500 border-orange-500',
  field_update: 'bg-teal-500 border-teal-500',
  webhook: 'bg-slate-500 border-slate-500',
  segment: 'bg-sky-500 border-sky-500',
  notification: 'bg-rose-500 border-rose-500',
};

export const ActionNode = memo(({ data, selected }: NodeProps<ActionNodeData>) => {
  const actionType = data.config?.type || 'tag';
  const Icon = actionIcons[actionType] || Zap;
  const colorClass = actionColors[actionType] || 'bg-cyan-500 border-cyan-500';

  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[200px]
        ${selected ? 'border-blue-500 shadow-lg' : colorClass}
        transition-all duration-200 hover:shadow-lg
      `}
    >
      {/* Icon */}
      <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full ${colorClass.split(' ')[0]} flex items-center justify-center shadow-md`}>
        <Icon className="w-4 h-4 text-white" />
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 !${colorClass.split(' ')[0]} !border-2 !border-white`}
      />

      {/* Content */}
      <div className="text-sm font-semibold text-gray-900 mb-1">{data.label}</div>
      <div className="text-xs text-gray-500 capitalize">
        {actionType.replace('_', ' ')}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 !${colorClass.split(' ')[0]} !border-2 !border-white`}
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';
