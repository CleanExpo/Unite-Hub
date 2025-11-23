'use client';

/**
 * Production Dashboard Page
 * Phase 50: Client production job management
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ProductionJobCard } from '@/ui/components/ProductionJobCard';
import { ProductionSafetyBadge } from '@/ui/components/ProductionSafetyBadge';
import { ProductionOutputCard } from '@/ui/components/ProductionOutputCard';
import { ProductionJobTimeline } from '@/ui/components/ProductionJobTimeline';
import { ProductionJobActions } from '@/ui/components/ProductionJobActions';
import {
  Plus, RefreshCw, Filter, FileText, Image, Palette, Share2, Search, Globe, Mic
} from 'lucide-react';

interface ProductionJob {
  id: string;
  client_id: string;
  job_type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  safety_score: number;
  safety_flags: string[];
  truth_layer_verified: boolean;
  created_at: string;
  production_outputs?: any[];
  production_job_history?: any[];
}

const JOB_TYPES = [
  { value: 'content', label: 'Content', icon: FileText },
  { value: 'visual', label: 'Visual', icon: Image },
  { value: 'brand', label: 'Brand', icon: Palette },
  { value: 'social', label: 'Social', icon: Share2 },
  { value: 'seo', label: 'SEO', icon: Search },
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'voice', label: 'Voice', icon: Mic },
];

export default function ProductionPage() {
  const { user, currentOrganization } = useAuth();
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<ProductionJob | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    jobType: 'content',
    title: '',
    description: '',
    priority: 'normal',
  });

  const clientId = currentOrganization?.org_id || 'default';

  useEffect(() => {
    if (clientId) {
      fetchJobs();
    }
  }, [clientId, filterStatus, filterType]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      let url = `/api/production/jobs?clientId=${clientId}`;
      if (filterStatus !== 'all') {
        url += `&status=${filterStatus}`;
      }
      if (filterType !== 'all') {
        url += `&jobType=${filterType}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/production/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          clientId,
          jobType: newJob.jobType,
          title: newJob.title,
          description: newJob.description,
          priority: newJob.priority,
          autoProcess: true,
        }),
      });

      if (response.ok) {
        setIsCreateOpen(false);
        setNewJob({ jobType: 'content', title: '', description: '', priority: 'normal' });
        fetchJobs();
      }
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  const handleJobAction = async (jobId: string, action: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/production/jobs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ jobId, action }),
      });

      if (response.ok) {
        fetchJobs();
        if (selectedJob?.id === jobId) {
          const data = await response.json();
          setSelectedJob(data.job);
        }
      }
    } catch (error) {
      console.error('Error updating job:', error);
    }
  };

  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      pending: 0,
      processing: 0,
      review: 0,
      approved: 0,
      completed: 0,
    };

    jobs.forEach((job) => {
      if (counts[job.status] !== undefined) {
        counts[job.status]++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Production Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your automated content production pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchJobs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Production Job</DialogTitle>
                <DialogDescription>
                  Start a new automated production job
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Job Type</Label>
                  <Select
                    value={newJob.jobType}
                    onValueChange={(v) => setNewJob({ ...newJob, jobType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    placeholder="Enter job title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    placeholder="Describe what you need..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newJob.priority}
                    onValueChange={(v) => setNewJob({ ...newJob, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateJob} disabled={!newJob.title}>
                  Create Job
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-5 gap-4">
        {['pending', 'processing', 'review', 'approved', 'completed'].map((status) => (
          <Card key={status} className="cursor-pointer hover:bg-muted/50" onClick={() => setFilterStatus(status)}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{statusCounts[status]}</div>
              <div className="text-sm text-muted-foreground capitalize">{status}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="review">In Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {JOB_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job List */}
        <div className="space-y-4">
          <h2 className="font-semibold">Production Jobs</h2>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No jobs found. Create your first production job to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`cursor-pointer transition-all ${
                    selectedJob?.id === job.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <ProductionJobCard
                    id={job.id}
                    jobType={job.job_type}
                    title={job.title}
                    description={job.description}
                    status={job.status}
                    priority={job.priority}
                    safetyScore={job.safety_score}
                    createdAt={job.created_at}
                    onApprove={(id) => handleJobAction(id, 'approve')}
                    onRevision={(id) => handleJobAction(id, 'revision')}
                    onCancel={(id) => handleJobAction(id, 'cancel')}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job Details */}
        <div className="space-y-4">
          <h2 className="font-semibold">Job Details</h2>
          {selectedJob ? (
            <div className="space-y-4">
              {/* Safety Badge */}
              <ProductionSafetyBadge
                safetyScore={selectedJob.safety_score}
                truthLayerVerified={selectedJob.truth_layer_verified}
                safetyFlags={selectedJob.safety_flags}
                showDetails
              />

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductionJobActions
                    jobId={selectedJob.id}
                    status={selectedJob.status}
                    onApprove={(id) => handleJobAction(id, 'approve')}
                    onReject={(id) => handleJobAction(id, 'reject')}
                    onRevision={(id) => handleJobAction(id, 'revision')}
                    onCancel={(id) => handleJobAction(id, 'cancel')}
                  />
                </CardContent>
              </Card>

              {/* Outputs */}
              {selectedJob.production_outputs && selectedJob.production_outputs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Outputs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedJob.production_outputs.map((output: any) => (
                      <ProductionOutputCard
                        key={output.id}
                        id={output.id}
                        outputType={output.output_type}
                        title={output.title}
                        content={output.content}
                        fileUrl={output.file_url}
                        thumbnailUrl={output.thumbnail_url}
                        status={output.status}
                        metadata={output.metadata}
                        createdAt={output.created_at}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              {selectedJob.production_job_history && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProductionJobTimeline
                      events={selectedJob.production_job_history.map((h: any) => ({
                        id: h.id,
                        status: h.status,
                        timestamp: h.changed_at,
                        notes: h.notes,
                      }))}
                      currentStatus={selectedJob.status}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Select a job to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
