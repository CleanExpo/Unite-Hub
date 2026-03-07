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
  manual:          Play,
  new_contact:     Play,
  tag:             Tag,
  score_threshold: TrendingUp,
  webhook:         Webhook,
  scheduled:       Calendar,
};

const ACCENT = '#00FF88';

export const TriggerNode = memo(({ data, selected }: NodeProps<TriggerNodeData>) => {
  const triggerType = data.config?.trigger_type || 'manual';
  const Icon = triggerIcons[triggerType];

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
        <Icon className="w-4 h-4 text-[#050505]" />
      </div>

      {/* Content */}
      <div className="font-mono text-sm font-semibold text-white mb-1">{data.label}</div>
      <div className="font-mono text-xs text-white/40 capitalize">
        {triggerType.replace('_', ' ')}
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

TriggerNode.displayName = 'TriggerNode';
