/**
 * Split Node Component
 *
 * A/B test split or random split
 *
 * @module components/campaigns/builder/nodes/SplitNode
 */

'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Split } from 'lucide-react';

interface SplitNodeData {
  label: string;
  stepId?: string;
  config?: {
    type: 'ab_test' | 'random';
    variants?: Array<{
      id: string;
      name: string;
      percentage: number;
    }>;
  };
}

export const SplitNode = memo(({ data, selected }: NodeProps<SplitNodeData>) => {
  const variants = data.config?.variants || [];
  const isABTest = data.config?.type === 'ab_test';

  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[200px]
        ${selected ? 'border-blue-500 shadow-lg' : 'border-fuchsia-500'}
        transition-all duration-200 hover:shadow-lg
      `}
    >
      {/* Icon */}
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-fuchsia-500 flex items-center justify-center shadow-md">
        <Split className="w-4 h-4 text-white" />
      </div>

      {/* A/B Test Badge */}
      {isABTest && (
        <div className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded bg-fuchsia-600 text-white text-[10px] font-bold shadow-md">
          A/B
        </div>
      )}

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-fuchsia-500 !border-2 !border-white"
      />

      {/* Content */}
      <div className="text-sm font-semibold text-gray-900 mb-1">{data.label}</div>
      <div className="text-xs text-gray-500">
        {variants.length > 0 ? `${variants.length} variants` : 'Not configured'}
      </div>

      {/* Output Handles - one for each variant */}
      {variants.map((variant, index) => {
        const totalVariants = variants.length;
        const leftPosition = ((index + 1) / (totalVariants + 1)) * 100;

        return (
          <Handle
            key={variant.id}
            type="source"
            position={Position.Bottom}
            id={variant.id}
            style={{ left: `${leftPosition}%` }}
            className="w-3 h-3 !bg-fuchsia-500 !border-2 !border-white"
          />
        );
      })}

      {/* Variant labels */}
      {variants.length > 0 && (
        <div
          className="absolute -bottom-6 left-0 right-0 flex justify-around text-[9px] text-gray-400"
          style={{ paddingLeft: '10%', paddingRight: '10%' }}
        >
          {variants.map((v) => (
            <span key={v.id} className="truncate">
              {v.percentage}%
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

SplitNode.displayName = 'SplitNode';
