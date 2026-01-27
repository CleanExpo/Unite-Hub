'use client';

/**
 * Synthex Analytics Page
 *
 * Marketing analytics dashboard with:
 * - Job completion metrics
 * - Visual generation stats
 * - SEO performance overview
 * - Usage quotas
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Image,
  Film,
  Palette,
  Zap,
} from 'lucide-react';

interface Capabilities {
  graphicsPerMonth: number;
  graphicsUsed: number;
  videosPerMonth: number;
  videosUsed: number;
  brandKitsPerMonth: number;
  brandKitsUsed: number;
  aiDesignerAccess: boolean;
}

interface Job {
  id: string;
  status: string;
  job_type: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      router.push('/synthex/onboarding');
      return;
    }
    fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers = { Authorization: `Bearer ${session.access_token}` };

      // Fetch jobs and capabilities in parallel
      const [jobsRes, capsRes] = await Promise.all([
        fetch(`/api/synthex/job?tenantId=${tenantId}`, { headers }),
        fetch(`/api/synthex/visual/capabilities?tenantId=${tenantId}`, { headers }),
      ]);

      if (jobsRes.ok) {
        const { jobs: data } = await jobsRes.json();
        setJobs(data || []);
      }

      if (capsRes.ok) {
        const { capabilities: caps } = await capsRes.json();
        setCapabilities(caps);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const completed = jobs.filter(j => j.status === 'completed').length;
  const failed = jobs.filter(j => j.status === 'failed').length;
  const pending = jobs.filter(j => !['completed', 'failed'].includes(j.status)).length;
  const completionRate = jobs.length > 0 ? Math.round((completed / jobs.length) * 100) : 0;

  // Job types breakdown
  const byType = jobs.reduce<Record<string, number>>((acc, j) => {
    acc[j.job_type] = (acc[j.job_type] || 0) + 1;
    return acc;
  }, {});

  const quotaPercent = (used: number, total: number) => {
    if (total === -1) return 0; // Unlimited
    return total > 0 ? Math.round((used / total) * 100) : 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Analytics</h1>
        <p className="text-gray-400 mt-1">Marketing performance overview</p>
      </div>

      {/* Job Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-100">{jobs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-100">{completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-100">{pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-gray-100">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Quotas */}
      {capabilities && (
        <div>
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Visual Generation Quotas</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Image className="h-4 w-4 text-blue-400" />
                  Graphics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-gray-100">
                  {capabilities.graphicsUsed}
                  <span className="text-gray-500 text-sm font-normal">
                    /{capabilities.graphicsPerMonth === -1 ? '∞' : capabilities.graphicsPerMonth}
                  </span>
                </p>
                {capabilities.graphicsPerMonth !== -1 && (
                  <Progress
                    value={quotaPercent(capabilities.graphicsUsed, capabilities.graphicsPerMonth)}
                    className="mt-2"
                  />
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Film className="h-4 w-4 text-purple-400" />
                  Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-gray-100">
                  {capabilities.videosUsed}
                  <span className="text-gray-500 text-sm font-normal">
                    /{capabilities.videosPerMonth === -1 ? '∞' : capabilities.videosPerMonth}
                  </span>
                </p>
                {capabilities.videosPerMonth !== -1 && (
                  <Progress
                    value={quotaPercent(capabilities.videosUsed, capabilities.videosPerMonth)}
                    className="mt-2"
                  />
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-amber-400" />
                  Brand Kits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-gray-100">
                  {capabilities.brandKitsUsed}
                  <span className="text-gray-500 text-sm font-normal">
                    /{capabilities.brandKitsPerMonth === -1 ? '∞' : capabilities.brandKitsPerMonth}
                  </span>
                </p>
                {capabilities.brandKitsPerMonth !== -1 && (
                  <Progress
                    value={quotaPercent(capabilities.brandKitsUsed, capabilities.brandKitsPerMonth)}
                    className="mt-2"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Jobs by Type */}
      {Object.keys(byType).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Jobs by Type</h2>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="space-y-3">
                {Object.entries(byType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300 capitalize">
                        {type.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-blue-500 rounded-full h-2"
                            style={{ width: `${Math.round((count / jobs.length) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
