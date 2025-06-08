'use client';

export const dynamic = 'force-dynamic'

import { TaskForm } from '../task-form';
import { useState, useEffect } from 'react';

type Client = {
  id: string;
  company_name: string;
};

type Project = {
  id: string;
  project_name: string;
};

export default function NewTaskPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientsRes = await fetch('/api/crm/clients');
        const projectsRes = await fetch('/api/crm/projects');
        
        if (!clientsRes.ok || !projectsRes.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const clientsData = await clientsRes.json();
        const projectsData = await projectsRes.json();
        
        setClients(clientsData);
        setProjects(projectsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        <h1 className="text-2xl font-bold">Create New Task</h1>
      </div>
      
      <TaskForm clients={clients} projects={projects} />
    </div>
  );
}
