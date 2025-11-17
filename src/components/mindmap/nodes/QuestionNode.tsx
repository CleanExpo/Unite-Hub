"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { HelpCircle } from 'lucide-react';

export default function QuestionNode({ data }: NodeProps) {
  const isResolved = data.status === 'completed';

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="px-4 py-3 rounded-lg border-2 border-orange-500 bg-orange-50 dark:bg-orange-950 shadow-md min-w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-full bg-orange-500 text-white">
            <HelpCircle className="h-4 w-4" />
          </div>
          <h3 className={`font-semibold text-orange-900 dark:text-orange-100 ${isResolved ? 'line-through opacity-60' : ''}`}>
            {data.label || 'Question'}
          </h3>
        </div>

        {data.description && (
          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1 line-clamp-2">
            {data.description}
          </p>
        )}

        {isResolved && data.metadata?.answer && (
          <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900 p-2 rounded">
            <span className="font-medium">Answer: </span>
            {data.metadata.answer}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={`px-2 py-0.5 rounded-full ${isResolved ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'}`}>
            {isResolved ? 'Resolved' : 'Open'}
          </span>
          {data.priority && (
            <span className="font-medium text-orange-600 dark:text-orange-400">
              P{data.priority}
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
