"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Play } from "lucide-react";

interface StartNodeData {
  label: string;
}

function StartNode({ data, selected }: NodeProps<StartNodeData>) {
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
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900">
          <Play className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <div className="font-semibold text-sm">{data.label}</div>
          <div className="text-xs text-muted-foreground">Start</div>
        </div>
      </div>

      {/* Only output handle for start node */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-500"
      />
    </div>
  );
}

export default memo(StartNode);
