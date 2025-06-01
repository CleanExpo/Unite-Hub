'use client';

import { useEffect, useState } from 'react';
import TaskForm from '@/components/crm/TaskForm';
import { getTask } from '@/lib/crm/tasks';

export default function EditTaskPage({ params }: { params: { id: string } }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const taskData = await getTask(params.id);
        setTask(taskData);
      } catch (err) {
        console.error('Error loading task:', err);
        setError(err.message || 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTask();
  }, [params.id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!task) {
    return <div>Task not found</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Task</h1>
      <TaskForm task={task} />
    </div>
  );
}
