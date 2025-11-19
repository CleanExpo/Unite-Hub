/**
 * TaskCard Component - Phase 2 Staff Library
 * Display staff task with proof, status, and actions
 */

import React from 'react';
import Badge from '../ui/Badge';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  due_date?: string;
  assigned_to?: string;
  proof?: any;
}

export interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onViewProof?: (taskId: string) => void;
}

export default function TaskCard({ task, onStatusChange, onViewProof }: TaskCardProps) {
  const statusColors = {
    pending: 'default',
    in_progress: 'warning',
    completed: 'success',
  } as const;

  const statusLabels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {task.title}
        </h3>
        <Badge variant={statusColors[task.status]}>
          {statusLabels[task.status]}
        </Badge>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
          {task.due_date && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
          {task.proof && (
            <button
              onClick={() => onViewProof?.(task.id)}
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Proof
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
