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

const ACCENT = '#FF00FF';

export const SplitNode = memo(({ data, selected }: NodeProps<SplitNodeData>) => {
  const variants = data.config?.variants || [];
  const isABTest = data.config?.type === 'ab_test';

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
        <Split className="w-4 h-4 text-[#050505]" />
      </div>

      {/* A/B Test badge */}
      {isABTest && (
        <div
          className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-sm font-mono text-[#050505] text-[10px] font-bold"
          style={{ backgroundColor: ACCENT }}
        >
          A/B
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
      <div className="font-mono text-xs text-white/40">
        {variants.length > 0 ? `${variants.length} variants` : 'Not configured'}
      </div>

      {/* Output Handles — one per variant */}
      {variants.map((variant, index) => {
        const totalVariants = variants.length;
        const leftPosition = ((index + 1) / (totalVariants + 1)) * 100;

        return (
          <Handle
            key={variant.id}
            type="source"
            position={Position.Bottom}
            id={variant.id}
            style={{ left: `${leftPosition}%`, background: ACCENT, borderColor: '#050505' }}
            className="w-3 h-3 !border-2"
          />
        );
      })}

      {/* Variant labels */}
      {variants.length > 0 && (
        <div
          className="absolute -bottom-6 left-0 right-0 flex justify-around text-[9px] font-mono text-white/30"
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
