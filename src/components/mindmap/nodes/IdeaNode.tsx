"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Lightbulb } from 'lucide-react';

export default function IdeaNode({ data }: NodeProps) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="px-4 py-3 rounded-lg border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950 shadow-md min-w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-full bg-yellow-400 text-yellow-900">
            <Lightbulb className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
            {data.label || 'Idea'}
          </h3>
        </div>

        {data.description && (
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 line-clamp-2">
            {data.description}
          </p>
        )}

        {data.metadata?.notes && (
          <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 italic line-clamp-2">
            {data.metadata.notes}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
            {data.status || 'pending'}
          </span>
          {data.ai_generated && (
            <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              AI Generated
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
