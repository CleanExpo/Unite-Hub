'use client';

/**
 * Synthex Campaigns Page
 *
 * Manage marketing campaigns across channels.
 * Campaigns group related jobs (content, SEO, social, email).
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Megaphone,
  Plus,
  Loader2,
  Mail,
  Search,
  FileText,
  Film,
  TrendingUp,
} from 'lucide-react';

interface Job {
  id: string;
  job_type: string;
  status: string;
  created_at: string;
}

const JOB_TYPE_ICONS: Record<string, typeof Mail> = {
  email_sequence: Mail,
  seo_launch: Search,
  content_batch: FileText,
  initial_launch_pack: Megaphone,
  monthly_report: TrendingUp,
};

export default function CampaignsPage() {
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
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter campaign-type jobs
  const campaignTypes = ['initial_launch_pack', 'content_batch', 'seo_launch', 'email_sequence', 'review_campaign'];
  const campaignJobs = jobs.filter(j => campaignTypes.includes(j.job_type));

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
          <h1 className="text-2xl font-bold text-gray-100">Campaigns</h1>
          <p className="text-gray-400 mt-1">
            Multi-channel marketing campaigns
          </p>
        </div>
        <Button
          onClick={() => router.push(`/synthex/dashboard?tenantId=${tenantId}`)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Launch Campaign
        </Button>
      </div>

      {/* Campaign type cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaignTypes.map(type => {
          const typeJobs = campaignJobs.filter(j => j.job_type === type);
          const Icon = JOB_TYPE_ICONS[type] || Megaphone;
          const completed = typeJobs.filter(j => j.status === 'completed').length;

          return (
            <Card key={type} className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-100 capitalize text-base">
                      {type.replace(/_/g, ' ')}
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                      {typeJobs.length} total &middot; {completed} completed
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {typeJobs.length > 0 ? (
                  <div className="space-y-2">
                    {typeJobs.slice(0, 3).map(job => (
                      <div key={job.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300 truncate">
                          {job.id.slice(0, 8)}...
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            job.status === 'completed'
                              ? 'border-green-500/30 text-green-400'
                              : job.status === 'failed'
                              ? 'border-red-500/30 text-red-400'
                              : 'border-yellow-500/30 text-yellow-400'
                          }
                        >
                          {job.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No campaigns yet</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {campaignJobs.length === 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-12 pb-12 text-center">
            <Megaphone className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-200 mb-2">No campaigns yet</h3>
            <p className="text-gray-400 mb-6">
              Launch your first marketing campaign from the dashboard
            </p>
            <Button onClick={() => router.push(`/synthex/dashboard?tenantId=${tenantId}`)}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
