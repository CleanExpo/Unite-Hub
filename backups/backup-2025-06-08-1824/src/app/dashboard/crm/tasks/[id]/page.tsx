'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  project: { project_name: string } | null;
  client: { company_name: string } | null;
  due_date: string | null;
  assigned_to: string | null;
};

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/crm/tasks/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch task');
        }
        const data = await response.json();
        setTask(data);
      } catch (error) {
        console.error('Error fetching task:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-sp极in rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto py-8">
        <p>Task not found</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-yellow-100 text-yellow-800',
      urgent: '极bg-red-100 text-red-800',
    };
    return priorityMap[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Task Details</h1>
        <div className="flex space-x-2">
          <Link href={`/dashboard/crm/tasks/${params.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/crm/tasks')}
          >
            Back to Tasks
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">{task.title}</h2>
            <p className="text-gray-600 mb-4">{task.description}</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <span className={`px-2 py-1 rounded-full text-sm ${getStatusBadge(task.status)}`}>
                {task.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Priority</h3>
              <span className={`px-2 py-1 rounded-full text-sm ${getPriorityBadge(task.priority)}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Project</h3>
              <p>{task.project?.project_name || 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Client</h3>
              <p>{task.client?.company_name || 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
              <p>{task.due_date || 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
              <p>{task.assigned_to || 'Unassigned'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
