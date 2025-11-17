"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Flag } from 'lucide-react';

export default function MilestoneNode({ data }: NodeProps) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="px-4 py-3 rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-950 shadow-md min-w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-full bg-amber-500 text-white">
            <Flag className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-amber-900 dark:text-amber-100">
            {data.label || 'Milestone'}
          </h3>
        </div>

        {data.description && (
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 line-clamp-2">
            {data.description}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
            {data.status || 'pending'}
          </span>
          {data.metadata?.date && (
            <span className="text-amber-600 dark:text-amber-400">
              {new Date(data.metadata.date).toLocaleDateString()}
            </span>
          )}
        </div>

        {data.metadata?.progress !== undefined && (
          <div className="mt-2">
            <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-1.5">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all"
                style={{ width: `${data.metadata.progress}%` }}
              />
            </div>
            <span className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              {data.metadata.progress}% complete
            </span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
