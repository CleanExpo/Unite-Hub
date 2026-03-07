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

// Scientific Luxury accent per action type
const actionAccents: Record<string, string> = {
  tag:          '#00F5FF',
  score:        '#FFB800',
  field_update: '#00FF88',
  webhook:      '#ffffff60',
  segment:      '#00F5FF',
  notification: '#FF4444',
};

export const ActionNode = memo(({ data, selected }: NodeProps<ActionNodeData>) => {
  const actionType = data.config?.type || 'tag';
  const Icon = actionIcons[actionType] || Zap;
  const accent = actionAccents[actionType] || '#00F5FF';

  return (
    <div
      className="relative px-4 py-3 rounded-sm min-w-[200px] bg-white/[0.04] transition-all duration-200"
      style={{
        border: `2px solid ${selected ? '#00F5FF' : accent}`,
        boxShadow: selected ? `0 0 0 1px #00F5FF40` : undefined,
      }}
    >
      {/* Icon badge */}
      <div
        className="absolute -top-3 -left-3 w-8 h-8 rounded-sm flex items-center justify-center"
        style={{ backgroundColor: accent }}
      >
        <Icon className="w-4 h-4 text-[#050505]" />
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: accent, borderColor: '#050505' }}
        className="w-3 h-3 !border-2"
      />

      {/* Content */}
      <div className="font-mono text-sm font-semibold text-white mb-1">{data.label}</div>
      <div className="font-mono text-xs text-white/40 capitalize">
        {actionType.replace('_', ' ')}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: accent, borderColor: '#050505' }}
        className="w-3 h-3 !border-2"
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';
