'use client';

import { TaskForm } from '../../task-form';
import { useState, useEffect } from 'react';

type Client = {
  id: string;
  company_name: string;
};

type Project = {
  id: string;
  project_name: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project_id: string | null;
  client_id: string | null;
  due_date: string | null;
  assigned_to: string | null;
};

export default function EditTaskPage({ params }: { params: { id: string } }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [clientsRes, projectsRes, taskRes] = await Promise.all([
          fetch('/api/crm/clients'),
          fetch('/api/crm/projects'),
          fetch(`/api/crm/tasks/${params.id}`)
        ]);
        
        if (!clientsRes.ok || !projectsRes.ok || !taskRes.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const clientsData = await clientsRes.json();
        const projectsData = await projectsRes.json();
        const taskData = await taskRes.json();
        
        setClients(clientsData);
        setProjects(projectsData);
        setTask(taskData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Task</h1>
      </div>
      
      {task ? (
        <TaskForm initialData={task} clients={clients} projects={projects} />
      ) : (
        <p>Task not found</p>
      )}
    </div>
  );
}
