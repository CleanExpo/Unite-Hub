"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CheckSquare, Square } from 'lucide-react';

export default function TaskNode({ data }: NodeProps) {
  const isCompleted = data.status === 'completed';

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="px-4 py-3 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950 shadow-md min-w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-full bg-green-500 text-white">
            {isCompleted ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </div>
          <h3 className={`font-semibold text-green-900 dark:text-green-100 ${isCompleted ? 'line-through opacity-60' : ''}`}>
            {data.label || 'Task'}
          </h3>
        </div>

        {data.description && (
          <p className="text-xs text-green-700 dark:text-green-300 mt-1 line-clamp-2">
            {data.description}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
            {data.status || 'pending'}
          </span>
          {data.metadata?.assignee && (
            <span className="text-green-600 dark:text-green-400">
              {data.metadata.assignee}
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
