"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Square } from "lucide-react";

interface EndNodeData {
  label: string;
}

function EndNode({ data, selected }: NodeProps<EndNodeData>) {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 shadow-md min-w-[150px]
        ${
          selected
            ? "border-primary bg-primary/10"
            : "border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600"
        }
      `}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900">
          <Square className="w-4 h-4 text-red-600 dark:text-red-400 fill-current" />
        </div>
        <div>
          <div className="font-semibold text-sm">{data.label}</div>
          <div className="text-xs text-muted-foreground">End</div>
        </div>
      </div>

      {/* Only input handle for end node */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-red-500"
      />
    </div>
  );
}

export default memo(EndNode);
