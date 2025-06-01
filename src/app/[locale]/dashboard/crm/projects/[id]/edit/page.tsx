'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProjectForm, projectSchema } from '../../project-form';
import * as z from 'zod';

type Project = z.infer<typeof projectSchema> & { id: string };


export default function EditProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [clients, setClients] = useState<{ id: string; company_name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
    fetchClients();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crm/projects/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/crm/clients');
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-6 text-center">
        <p>Project not found</p>
        <button 
          onClick={() => router.push('/dashboard/crm/projects')} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Project: {project.project_name}</h1>
      </div>
      
      <ProjectForm initialData={project} clients={clients} />
    </div>
  );
}
