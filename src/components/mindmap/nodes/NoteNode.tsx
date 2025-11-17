"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { StickyNote } from 'lucide-react';

export default function NoteNode({ data }: NodeProps) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="px-4 py-3 rounded-lg border-2 border-gray-400 bg-gray-50 dark:bg-gray-900 shadow-md min-w-[180px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-full bg-gray-400 text-white">
            <StickyNote className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            {data.label || 'Note'}
          </h3>
        </div>

        {data.description && (
          <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-3">
            {data.description}
          </p>
        )}

        {data.metadata?.author && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span>by {data.metadata.author}</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
