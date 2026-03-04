"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Bot } from "lucide-react";

interface AgentNodeData {
  label: string;
  agent_name?: string;
}

function AgentNode({ data, selected }: NodeProps<AgentNodeData>) {
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
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-purple-500" />

      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900">
          <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <div className="font-semibold text-sm">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            {data.agent_name || "Agent"}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-purple-500" />
    </div>
  );
}

export default memo(AgentNode);
