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

export const EmailNode = memo(({ data, selected }: NodeProps<EmailNodeData>) => {
  const hasPersonalization = data.config?.personalization_enabled;

  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[200px]
        ${selected ? 'border-blue-500 shadow-lg' : 'border-indigo-500'}
        transition-all duration-200 hover:shadow-lg
      `}
    >
      {/* Icon */}
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-md">
        <Mail className="w-4 h-4 text-white" />
      </div>

      {/* AI Badge */}
      {hasPersonalization && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shadow-md">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-indigo-500 !border-2 !border-white"
      />

      {/* Content */}
      <div className="text-sm font-semibold text-gray-900 mb-1">{data.label}</div>
      {data.config?.subject && (
        <div className="text-xs text-gray-500 line-clamp-2">
          {data.config.subject}
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-indigo-500 !border-2 !border-white"
      />
    </div>
  );
});

EmailNode.displayName = 'EmailNode';
