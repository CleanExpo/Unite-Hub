'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  User, 
  Phone, 
  Mail, 
  Globe, 
  Briefcase,
  Calendar,
  FileText,
  ArrowLeft,
  Edit,
  Trash2
} from 'lucide-react';

interface Client {
  id: string;
  company_name: string;
  email: string;
  contact_person: string;
  phone: string;
  website: string;
  industry: string;
  company_size: string;
  client_status: string;
  notes: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  created_at: string;
}

interface Project {
  id: string;
  project_name: string;
  status: string;
  start_date: string;
  end_date: string;
  budget: number;
  progress_percentage: number;
}

export default function ClientDetail() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClient();
    fetchProjects();
  }, [id]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setClient(data);
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_name, status, start_date, end_date, budget, progress_percentage')
        .eq('client_id', id);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const deleteClient = async () => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    
    try {
      const response = await fetch(`/api/crm/clients/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      router.push('/dashboard/crm/clients');
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Failed to delete client. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto py-6 text-center">
        <p>Client not found</p>
        <Button onClick={() => router.push('/dashboard/crm/clients')} className="mt-4">
          Back to Clients
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': 
        return <Badge className="bg-green-600 text-white">Active</Badge>;
      case 'lead':
        return <Badge className="bg-blue-600 text-white">Lead</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      case 'archived':
        return <Badge variant="destructive">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/crm/clients')}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => router.push(`/dashboard/crm/clients/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="destructive"
            onClick={deleteClient}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building className="h-6 w-6 mr-2" />
                  {client.company_name}
                </div>
                {getStatusBadge(client.client_status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Contact:</span>
                    <span className="ml-2">{client.contact_person || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <a href={`mailto:${client.email}`} className="ml-2 text-blue-600 hover:underline">
                      {client.email}
                    </a>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Phone:</span>
                    <span className="ml-2">{client.phone || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Website:</span>
                    {client.website ? (
                      <a 
                        href={client.website.startsWith('http') ? client.website : `https://${client.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        {client.website}
                      </a>
                    ) : (
                      <span className="ml-2">N/A</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium">Industry:</span>
                    <span className="ml-2">{client.industry || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium">Company Size:</span>
                    <span className="ml-2">{client.company_size || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-medium mb-2">Address</h3>
                <p>{client.address_line1 || 'N/A'}</p>
                <p>{client.address_line2}</p>
                <p>{client.city}, {client.state} {client.postal_code}</p>
                <p>{client.country}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">
                {client.notes || 'No notes available'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Projects ({projects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map(project => (
                    <div key={project.id} className="border rounded-lg p-4 hover:bg-accent cursor-pointer"
                      onClick={() => router.push(`/dashboard/crm/projects/${project.id}`)}>
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{project.project_name}</h3>
                        <Badge variant="outline">{project.status}</Badge>
                      </div>
                      <div className="mt-2">
                        <div className="text-sm text-muted-foreground">
                          {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No start date'} - 
                          {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'No end date'}
                        </div>
                        <div className="mt-1 text-sm">
                          Budget: ${project.budget?.toLocaleString() || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No projects found</p>
              )}
              <Button 
                variant="outline" 
                className="mt-4 w-full"
                onClick={() => router.push(`/dashboard/crm/projects/new?clientId=${id}`)}
              >
                Add Project
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Upcoming Consultations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">
                No upcoming consultations
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push(`/consultations?clientId=${id}`)}
              >
                Schedule Consultation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">
                No documents
              </div>
              <Button variant="outline" className="w-full">
                Upload Document
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
