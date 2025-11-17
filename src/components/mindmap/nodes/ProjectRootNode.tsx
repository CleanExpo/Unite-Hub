"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FolderKanban } from 'lucide-react';

export default function ProjectRootNode({ data }: NodeProps) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="px-6 py-4 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg min-w-[250px]">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-full bg-blue-500 text-white">
            <FolderKanban className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100">
            {data.label || 'Project Root'}
          </h3>
        </div>

        {data.description && (
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
            {data.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400">
          <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900">
            Root Node
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
