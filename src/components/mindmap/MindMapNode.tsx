"use client";

import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import { Plus, ChevronRight } from "lucide-react";

interface MindMapNodeData {
  label: string;
  category: string;
  color: string;
  isRoot?: boolean;
  isSubNode?: boolean;
  nodeCount?: number;
  details?: string;
}

export const MindMapNode = memo(({ data }: { data: MindMapNodeData }) => {
  const { label, category, color, isRoot, isSubNode, nodeCount } = data;

  if (isRoot) {
    return (
      <div className="relative">
        <Handle type="source" position={Position.Bottom} className="opacity-0" />
        <div
          className="px-6 py-4 rounded-2xl shadow-lg font-bold text-white text-center min-w-[180px]"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, ${adjustBrightness(color, -20)} 100%)`,
          }}
        >
          <div className="text-lg">{label}</div>
          <div className="text-xs mt-1 opacity-90">Business Core</div>
        </div>
      </div>
    );
  }

  if (isSubNode) {
    return (
      <div className="relative">
        <Handle type="target" position={Position.Top} className="opacity-0" />
        <div
          className="px-4 py-2 rounded-lg shadow-md text-sm font-medium text-gray-900 bg-white border-2 min-w-[140px]"
          style={{ borderColor: color }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="line-clamp-2">{label}</span>
          </div>
        </div>
      </div>
    );
  }

  // Branch node
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <div
        className="px-5 py-3 rounded-xl shadow-lg text-white font-semibold min-w-[160px] group hover:shadow-xl transition-shadow"
        style={{
          backgroundColor: color,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span>{label}</span>
          {nodeCount !== undefined && nodeCount > 0 && (
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
              <span className="text-xs">{nodeCount}</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          )}
        </div>
        <div className="text-xs mt-1 opacity-90 capitalize">{category}</div>

        {/* Expand Button */}
        <button className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110">
          <Plus className="h-4 w-4 text-gray-700" />
        </button>
      </div>
    </div>
  );
});

MindMapNode.displayName = "MindMapNode";

// Helper function to adjust color brightness
function adjustBrightness(color: string, amount: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
