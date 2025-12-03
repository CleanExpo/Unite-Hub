"use client";

import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

const connectionTypeStyles = {
  depends_on: {
    stroke: '#000000',
    strokeWidth: 2,
    strokeDasharray: 'none',
    label: 'depends on',
  },
  relates_to: {
    stroke: '#9ca3af',
    strokeWidth: 1.5,
    strokeDasharray: '5,5',
    label: 'relates to',
  },
  leads_to: {
    stroke: '#3b82f6',
    strokeWidth: 2,
    strokeDasharray: 'none',
    label: 'leads to',
  },
  part_of: {
    stroke: '#10b981',
    strokeWidth: 3,
    strokeDasharray: 'none',
    label: 'part of',
  },
  inspired_by: {
    stroke: '#fbbf24',
    strokeWidth: 1.5,
    strokeDasharray: '2,2',
    label: 'inspired by',
  },
  conflicts_with: {
    stroke: '#ef4444',
    strokeWidth: 2,
    strokeDasharray: '10,5',
    label: 'conflicts with',
  },
};

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const connectionType = data?.connectionType || 'relates_to';
  const style = connectionTypeStyles[connectionType as keyof typeof connectionTypeStyles] || connectionTypeStyles.relates_to;

  // Adjust stroke width based on strength (1-10)
  const strength = data?.strength || 5;
  const strokeWidth = style.strokeWidth * (strength / 5);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: style.stroke,
          strokeWidth,
          strokeDasharray: style.strokeDasharray,
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="px-2 py-1 bg-bg-card border border-border-base rounded text-xs font-medium shadow-sm">
            {data?.label || style.label}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
