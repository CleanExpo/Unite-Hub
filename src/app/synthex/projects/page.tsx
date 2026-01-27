'use client';

/**
 * Synthex Projects Page
 *
 * View and manage AI marketing projects grouped by brand/domain.
 * Each project contains jobs, content, and analytics.
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FolderKanban,
  Plus,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface Job {
  id: string;
  job_type: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      router.push('/synthex/onboarding');
      return;
    }
    fetchJobs();
  }, [tenantId]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/synthex/job?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const { jobs: data } = await res.json();
        setJobs(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group jobs by type as "projects"
  const projectGroups = jobs.reduce<Record<string, Job[]>>((acc, job) => {
    const type = job.job_type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(job);
    return acc;
  }, {});

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Projects</h1>
          <p className="text-gray-400 mt-1">
            AI marketing projects grouped by type
          </p>
        </div>
        <Button
          onClick={() => router.push(`/synthex/dashboard?tenantId=${tenantId}`)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Job
        </Button>
      </div>

      {Object.keys(projectGroups).length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-12 pb-12 text-center">
            <FolderKanban className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-200 mb-2">No projects yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first AI job to start a project
            </p>
            <Button onClick={() => router.push(`/synthex/dashboard?tenantId=${tenantId}`)}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(projectGroups).map(([type, typeJobs]) => {
            const completed = typeJobs.filter(j => j.status === 'completed').length;
            const total = typeJobs.length;
            return (
              <Card key={type} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-100 capitalize">
                      {type.replace(/_/g, ' ')}
                    </CardTitle>
                    <Badge variant="outline" className="text-gray-400 border-gray-700">
                      {total} jobs
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      {completed} done
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-yellow-500" />
                      {total - completed} pending
                    </span>
                  </div>
                  <div className="space-y-2">
                    {typeJobs.slice(0, 3).map(job => (
                      <div key={job.id} className="flex items-center gap-2 text-sm text-gray-300">
                        {statusIcon(job.status)}
                        <span className="truncate">{job.id.slice(0, 8)}...</span>
                        <span className="text-gray-500 ml-auto">
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-gray-400 hover:text-gray-100"
                    onClick={() => router.push(`/synthex/dashboard?tenantId=${tenantId}`)}
                  >
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
