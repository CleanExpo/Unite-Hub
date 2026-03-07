/**
 * Email Node Component
 *
 * Send email action node
 *
 * @module components/campaigns/builder/nodes/EmailNode
 */

'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Mail, Sparkles } from 'lucide-react';

interface EmailNodeData {
  label: string;
  stepId?: string;
  config?: {
    subject?: string;
    body?: string;
    personalization_enabled?: boolean;
  };
}

const ACCENT = '#00F5FF';

export const EmailNode = memo(({ data, selected }: NodeProps<EmailNodeData>) => {
  const hasPersonalization = data.config?.personalization_enabled;

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
        <Mail className="w-4 h-4 text-[#050505]" />
      </div>

      {/* AI Personalisation badge */}
      {hasPersonalization && (
        <div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-sm flex items-center justify-center"
          style={{ backgroundColor: '#FF00FF' }}
        >
          <Sparkles className="w-3 h-3 text-[#050505]" />
        </div>
      )}

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: ACCENT, borderColor: '#050505' }}
        className="w-3 h-3 !border-2"
      />

      {/* Content */}
      <div className="font-mono text-sm font-semibold text-white mb-1">{data.label}</div>
      {data.config?.subject && (
        <div className="font-mono text-xs text-white/40 line-clamp-2">
          {data.config.subject}
        </div>
      )}

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

EmailNode.displayName = 'EmailNode';
