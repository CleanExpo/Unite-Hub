"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { GitBranch } from "lucide-react";

interface ConditionalNodeData {
  label: string;
  condition?: string;
}

function ConditionalNode({ data, selected }: NodeProps<ConditionalNodeData>) {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 shadow-md min-w-[180px]
        ${
          selected
            ? "border-primary bg-primary/10"
            : "border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600"
        }
      `}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-yellow-500" />

      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900">
          <GitBranch className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <div className="font-semibold text-sm">{data.label}</div>
          <div className="text-xs text-muted-foreground">If/Else</div>
        </div>
      </div>

      {/* Two output handles for true/false */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="w-3 h-3 !bg-green-500 !left-[30%]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 !bg-red-500 !left-[70%]"
      />
    </div>
  );
}

export default memo(ConditionalNode);
