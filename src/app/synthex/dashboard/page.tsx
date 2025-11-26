'use client';

/**
 * Synthex Client Dashboard
 *
 * Customer-facing dashboard showing:
 * - Current plan and subscription status
 * - Active jobs and their progress
 * - Generated results and content
 * - Usage analytics and quotas
 * - Quick actions to create new jobs
 *
 * Features:
 * - Real-time job status updates
 * - Result previews and export
 * - Plan upgrade/downgrade options
 * - Team member management
 * - Usage analytics
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  Download,
  Plus,
  Settings,
  Loader2,
  ImageIcon,
  Film,
  Sparkles,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import JobCreationModal from '@/components/synthex/JobCreationModal';
import JobProgressCard from '@/components/synthex/JobProgressCard';
import ResultPreviewCard from '@/components/synthex/ResultPreviewCard';
import VisualGenerationPanel from '@/components/synthex/VisualGenerationPanel';
import VideoCreationPanel from '@/components/synthex/VideoCreationPanel';
import SeoAnalysisPanel from '@/components/synthex/SeoAnalysisPanel';

// ============================================================================
// TYPES
// ============================================================================

interface Tenant {
  id: string;
  businessName: string;
  industry: string;
  region: string;
  status: string;
}

interface Subscription {
  id: string;
  planCode: string;
  offerTier: string;
  effectivePriceAud: number;
  billingStatus: string;
  renews_at: string;
}

interface Job {
  id: string;
  jobType: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

interface UsageStats {
  jobsThisMonth: number;
  jobLimit: number;
  brandsActive: number;
  brandsLimit: number;
  costThisMonth: number;
  costBudget: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function SynthexDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);

  // Fetch tenant data on mount
  useEffect(() => {
    if (!tenantId) {
      router.push('/synthex/onboarding');
      return;
    }

    fetchTenantData();
  }, [tenantId, router]);

  const handleCreateJob = async (jobData: any) => {
    setCreatingJob(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/synthex/job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create job');
      }

      // Refresh jobs list
      await fetchTenantData();
      setShowJobModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setCreatingJob(false);
    }
  };

  const fetchTenantData = async () => {
    try {
      setLoading(true);

      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch tenant data from API
      const tenantRes = await fetch(`/api/synthex/tenant?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!tenantRes.ok) {
        throw new Error('Failed to fetch tenant');
      }

      const { tenant: tenantData } = await tenantRes.json();
      setTenant(tenantData);

      // Fetch billing info from API
      const billingRes = await fetch(`/api/synthex/billing?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (billingRes.ok) {
        const billingData = await billingRes.json();
        setSubscription(billingData.subscription);
        calculateUsageStats(tenantData.id, billingData.subscription);
      }

      // Fetch jobs from API
      const jobsRes = await fetch(`/api/synthex/job?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (jobsRes.ok) {
        const { jobs: jobsData } = await jobsRes.json();
        setJobs(jobsData || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const calculateUsageStats = (tenantIdVal: string, subData: Subscription | null) => {
    // Filter jobs from this month
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const jobsThisMonth = jobs.filter((job) => {
      const jobDate = new Date(job.created_at);
      return jobDate >= thirtyDaysAgo;
    });

    // Get plan limits
    const planMap: Record<string, { jobsLimit: number; brandsLimit: number; costBudget: number }> = {
      launch: { jobsLimit: 8, brandsLimit: 2, costBudget: 30 },
      growth: { jobsLimit: 25, brandsLimit: 5, costBudget: 100 },
      scale: { jobsLimit: 999, brandsLimit: 999, costBudget: 500 },
    };

    const planCode = subData?.planCode || 'launch';
    const planLimits = planMap[planCode];

    // Calculate cost from jobs (rough estimate: $0.15 per job)
    const costThisMonth = jobsThisMonth.length * 0.15;

    setUsageStats({
      jobsThisMonth: jobsThisMonth.length,
      jobLimit: planLimits.jobsLimit,
      brandsActive: 1, // TODO: Fetch actual brands count
      brandsLimit: planLimits.brandsLimit,
      costThisMonth,
      costBudget: planLimits.costBudget,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Tenant not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const jobStatusCount = {
    pending: jobs.filter((j) => j.status === 'pending').length,
    running: jobs.filter((j) => j.status === 'running').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{tenant.businessName}</h1>
            <p className="text-sm text-slate-600 mt-1">
              {tenant.industry} • {tenant.region.toUpperCase()}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Settings size={16} className="mr-2" />
              Settings
            </Button>
            <Button onClick={() => setShowJobModal(true)} size="sm" className="gap-2">
              <Plus size={16} />
              New Job
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Subscription Card */}
        {subscription && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Current Plan</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {subscription.planCode.charAt(0).toUpperCase() + subscription.planCode.slice(1)}{' '}
                  Plan • ${subscription.effectivePriceAud.toFixed(2)}/month
                </p>
              </div>
              <Button variant="outline">Upgrade Plan</Button>
            </CardContent>
          </Card>
        )}

        {/* Usage Overview */}
        {usageStats && (
          <div className="grid md:grid-cols-4 gap-4">
            {/* Jobs Used */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Jobs This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats.jobsThisMonth}/{usageStats.jobLimit}
                </div>
                <Progress
                  value={(usageStats.jobsThisMonth / usageStats.jobLimit) * 100}
                  className="mt-3"
                />
                <p className="text-xs text-slate-600 mt-2">
                  {usageStats.jobLimit - usageStats.jobsThisMonth} remaining
                </p>
              </CardContent>
            </Card>

            {/* Brands Used */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Brands</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats.brandsActive}/{usageStats.brandsLimit}
                </div>
                <p className="text-xs text-slate-600 mt-3">
                  {usageStats.brandsLimit - usageStats.brandsActive} available
                </p>
              </CardContent>
            </Card>

            {/* Cost This Month */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Cost This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${usageStats.costThisMonth.toFixed(2)}
                </div>
                <p className="text-xs text-slate-600 mt-3">of ${usageStats.costBudget}/month</p>
              </CardContent>
            </Card>

            {/* Subscription Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  className={`${
                    subscription.billingStatus === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {subscription.billingStatus}
                </Badge>
                <p className="text-xs text-slate-600 mt-3">
                  Renews {new Date(subscription.renews_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs for Jobs and Results */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="bg-slate-200">
            <TabsTrigger value="jobs" className="gap-2">
              <Zap size={16} />
              Jobs ({jobs.length})
            </TabsTrigger>
            <TabsTrigger value="visual" className="gap-2">
              <ImageIcon size={16} />
              Visual Generation
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2">
              <Film size={16} />
              Video Creation
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-2">
              <Sparkles size={16} />
              SEO Intelligence
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <TrendingUp size={16} />
              Results
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp size={16} />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            {/* Job Status Summary */}
            {jobs.length > 0 && (
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Clock size={20} className="text-blue-600" />
                  <div>
                    <div className="text-sm text-slate-600">Pending</div>
                    <div className="text-2xl font-bold">{jobStatusCount.pending}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Loader2 size={20} className="text-yellow-600 animate-spin" />
                  <div>
                    <div className="text-sm text-slate-600">Running</div>
                    <div className="text-2xl font-bold">{jobStatusCount.running}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle size={20} className="text-green-600" />
                  <div>
                    <div className="text-sm text-slate-600">Completed</div>
                    <div className="text-2xl font-bold">{jobStatusCount.completed}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle size={20} className="text-red-600" />
                  <div>
                    <div className="text-sm text-slate-600">Failed</div>
                    <div className="text-2xl font-bold">{jobStatusCount.failed}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Jobs List */}
            {jobs.length > 0 ? (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <JobProgressCard
                    key={job.id}
                    job={job}
                    onViewDetails={() =>
                      router.push(`/synthex/job/${job.id}?tenantId=${tenantId}`)
                    }
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Zap size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No jobs yet</h3>
                  <p className="text-slate-600 mb-6">
                    Create your first job to generate content, research, or reports
                  </p>
                  <Button onClick={() => setShowJobModal(true)}>Create Job</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Visual Generation Tab */}
          <TabsContent value="visual" className="space-y-4">
            <VisualGenerationPanel
              tenantId={tenantId || ''}
              planCode={subscription?.planCode || 'launch'}
            />
          </TabsContent>

          {/* Video Creation Tab */}
          <TabsContent value="videos" className="space-y-4">
            <VideoCreationPanel
              tenantId={tenantId || ''}
              planCode={subscription?.planCode || 'launch'}
              brandName={tenant?.businessName || 'Your Brand'}
            />
          </TabsContent>

          {/* SEO Intelligence Tab */}
          <TabsContent value="seo" className="space-y-4">
            <SeoAnalysisPanel
              tenantId={tenantId || ''}
              planCode={subscription?.planCode || 'launch'}
            />
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generated Results</CardTitle>
                <CardDescription>View and export content generated from completed jobs</CardDescription>
              </CardHeader>
              <CardContent className="min-h-[300px] flex items-center justify-center text-center">
                <div>
                  <Download size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600">
                    Results from completed jobs will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">
                    {jobs.length > 0
                      ? (
                          ((jobStatusCount.completed + jobStatusCount.failed) / jobs.length) *
                          100
                        ).toFixed(0)
                      : 0}
                    %
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    {jobStatusCount.completed + jobStatusCount.failed} of {jobs.length} jobs
                    completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Job Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">
                    {jobs.filter((j) => j.started_at && j.completed_at).length > 0
                      ? (
                          jobs
                            .filter((j) => j.started_at && j.completed_at)
                            .reduce((sum, j) => {
                              const duration =
                                new Date(j.completed_at!).getTime() -
                                new Date(j.started_at!).getTime();
                              return sum + duration;
                            }, 0) /
                          jobs.filter((j) => j.started_at && j.completed_at).length /
                          60000
                        ).toFixed(1)
                      : 0}
                    m
                  </div>
                  <p className="text-sm text-slate-600 mt-2">minutes</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Job Creation Modal */}
      <JobCreationModal
        isOpen={showJobModal}
        onClose={() => setShowJobModal(false)}
        onCreateJob={handleCreateJob}
        tenantId={tenantId || ''}
        isLoading={creatingJob}
      />
    </div>
  );
}
