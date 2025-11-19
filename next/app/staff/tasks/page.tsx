/**
 * Staff Tasks Page - Phase 2 Step 3
 *
 * Task management interface for staff users
 * Will be wired to /api/staff/tasks in Phase 2 Step 4
 */

import { Card } from '@/next/components/ui/Card';
import { Button } from '@/next/components/ui/Button';
import { Badge } from '@/next/components/ui/Badge';
import { TaskCard } from '@/next/components/staff/TaskCard';
import { Plus, Filter } from 'lucide-react';

export default function StaffTasksPage() {
  // TODO: Fetch real tasks from /api/staff/tasks in Phase 2 Step 4
  const mockTasks = [
    {
      id: '1',
      title: 'Complete homepage redesign',
      status: 'in_progress' as const,
      due_date: '2025-11-25',
      proof: null,
    },
    {
      id: '2',
      title: 'Review client proposal',
      status: 'pending' as const,
      due_date: '2025-11-22',
      proof: null,
    },
    {
      id: '3',
      title: 'Deploy production build',
      status: 'completed' as const,
      due_date: '2025-11-20',
      proof: {
        screenshots: ['https://example.com/screenshot1.png'],
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">
            Tasks
          </h1>
          <p className="text-gray-400 mt-2">
            Manage your tasks and track progress
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
            Filter
          </Button>
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            New Task
          </Button>
        </div>
      </div>

      {/* Task stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">
              {mockTasks.filter((t) => t.status === 'pending').length}
            </p>
          </div>
        </Card>
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">In Progress</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {mockTasks.filter((t) => t.status === 'in_progress').length}
            </p>
          </div>
        </Card>
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {mockTasks.filter((t) => t.status === 'completed').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Task list */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-100">
          All Tasks
        </h2>

        <div className="space-y-3">
          {mockTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onViewDetails={() => console.log('View task:', task.id)}
              onUpdateStatus={() => console.log('Update task:', task.id)}
            />
          ))}
        </div>
      </div>

      {/* Empty state (when no tasks) */}
      {mockTasks.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-4">
              No tasks found. Create your first task to get started.
            </p>
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              Create Task
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
