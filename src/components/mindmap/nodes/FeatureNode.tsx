"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Zap } from 'lucide-react';

export default function FeatureNode({ data }: NodeProps) {
  const priorityColor = data.priority >= 7 ? 'text-red-500' : data.priority >= 4 ? 'text-yellow-500' : 'text-green-500';

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="px-4 py-3 rounded-lg border-2 border-violet-500 bg-violet-50 dark:bg-violet-950 shadow-md min-w-[220px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-full bg-violet-500 text-white">
            <Zap className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-violet-900 dark:text-violet-100">
            {data.label || 'Feature'}
          </h3>
        </div>

        {data.description && (
          <p className="text-xs text-violet-700 dark:text-violet-300 mt-1 line-clamp-2">
            {data.description}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={`px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300`}>
            {data.status || 'pending'}
          </span>
          {data.priority && (
            <span className={`font-medium ${priorityColor}`}>
              P{data.priority}
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
