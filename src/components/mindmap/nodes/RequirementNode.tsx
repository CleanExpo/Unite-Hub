"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FileText } from 'lucide-react';

export default function RequirementNode({ data }: NodeProps) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="px-4 py-3 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950 shadow-md min-w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-full bg-red-500 text-white">
            <FileText className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-red-900 dark:text-red-100">
            {data.label || 'Requirement'}
          </h3>
        </div>

        {data.description && (
          <p className="text-xs text-red-700 dark:text-red-300 mt-1 line-clamp-2">
            {data.description}
          </p>
        )}

        {data.metadata?.acceptance_criteria && (
          <div className="mt-2 text-xs text-red-600 dark:text-red-400">
            <span className="font-medium">Acceptance:</span>
            <p className="line-clamp-2">{data.metadata.acceptance_criteria}</p>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
            {data.status || 'pending'}
          </span>
          {data.priority && (
            <span className="font-medium text-red-600 dark:text-red-400">
              P{data.priority}
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
