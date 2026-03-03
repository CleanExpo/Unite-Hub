"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { MessageSquare } from "lucide-react";

interface LLMNodeData {
  label: string;
  model?: string;
}

function LLMNode({ data, selected }: NodeProps<LLMNodeData>) {
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
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500"
      />

      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900">
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <div className="font-semibold text-sm">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            {data.model || "LLM"}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500"
      />
    </div>
  );
}

export default memo(LLMNode);
