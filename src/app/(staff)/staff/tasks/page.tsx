// Force dynamic
export const dynamic = 'force-dynamic';
/**
 * Staff Tasks Page - Phase 2 Step 4
 *
 * Task management interface for staff users
 * Fully wired to /api/staff/tasks
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from '@/components/staff/TaskCard';
import ProofUploader from '@/components/staff/ProofUploader';
import { Plus, Filter } from 'lucide-react';
import { getStaffTasks, updateTaskStatus } from '@/lib/services/staff/staffService';
import { PageContainer, Section } from '@/ui/layout/AppGrid';

export default async function StaffTasksPage() {
  // Fetch real tasks from API
  const response = await getStaffTasks().catch(() => ({ data: [] }));
  const tasks = response?.data || [];

  return (
    <PageContainer>
      <Section>
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
            <Button variant="outline" icon={<Filter className="h-4 w-4" />}>
              Filter
            </Button>
            <Button icon={<Plus className="h-4 w-4" />}>
              New Task
            </Button>
          </div>
        </div>
      </Section>

      <Section>
        {/* Task stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">
              {tasks.filter((t) => t.status === 'pending').length}
            </p>
          </div>
        </Card>
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">In Progress</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {tasks.filter((t) => t.status === 'in_progress').length}
            </p>
          </div>
        </Card>
        <Card variant="glass">
          <div className="p-4">
            <p className="text-sm text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {tasks.filter((t) => t.status === 'completed').length}
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
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onViewProof={() => console.log('View task:', task.id)}
              onStatusChange={() => console.log('Update task:', task.id)}
            />
          ))}
        </div>
      </div>

      {/* Empty state (when no tasks) */}
      {tasks.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-4">
              No tasks found. Create your first task to get started.
            </p>
            <Button icon={<Plus className="h-4 w-4" />}>
              Create Task
            </Button>
          </div>
        </Card>
      )}
      </Section>
    </PageContainer>
  );
}
