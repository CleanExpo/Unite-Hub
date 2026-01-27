'use client';

/**
 * Synthex Content Library Page
 *
 * Browse and manage all generated content:
 * - Blog posts, social media copy
 * - Graphics and visual assets
 * - Video content
 * - SEO reports
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Image,
  Film,
  Search,
  Loader2,
  Download,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface ContentItem {
  id: string;
  job_type: string;
  status: string;
  prompt: string;
  created_at: string;
  result?: Record<string, unknown>;
}

export default function ContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  const [visualJobs, setVisualJobs] = useState<ContentItem[]>([]);
  const [videoJobs, setVideoJobs] = useState<ContentItem[]>([]);
  const [contentJobs, setContentJobs] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      router.push('/synthex/onboarding');
      return;
    }
    fetchContent();
  }, [tenantId]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [visualRes, videoRes, jobsRes] = await Promise.all([
        fetch(`/api/synthex/visual/jobs?tenantId=${tenantId}`, { headers }),
        fetch(`/api/synthex/video/jobs?tenantId=${tenantId}`, { headers }),
        fetch(`/api/synthex/job?tenantId=${tenantId}`, { headers }),
      ]);

      if (visualRes.ok) {
        const { jobs } = await visualRes.json();
        setVisualJobs(jobs || []);
      }
      if (videoRes.ok) {
        const { jobs } = await videoRes.json();
        setVideoJobs(jobs || []);
      }
      if (jobsRes.ok) {
        const { jobs } = await jobsRes.json();
        // Filter to content-type jobs
        setContentJobs(
          (jobs || []).filter((j: ContentItem) =>
            ['content_batch', 'email_sequence', 'monthly_report'].includes(j.job_type)
          )
        );
      }
    } catch (err) {
      console.error('Failed to fetch content:', err);
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

  const totalContent = visualJobs.length + videoJobs.length + contentJobs.length;

  const renderContentList = (items: ContentItem[], emptyIcon: typeof FileText, emptyText: string) => {
    if (items.length === 0) {
      return (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-12 pb-12 text-center">
            {(() => { const Icon = emptyIcon; return <Icon className="h-10 w-10 text-gray-600 mx-auto mb-3" />; })()}
            <p className="text-gray-400">{emptyText}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <Card key={item.id} className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-200 truncate capitalize">
                  {item.job_type?.replace(/_/g, ' ') || 'Content'}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={
                    item.status === 'completed'
                      ? 'border-green-500/30 text-green-400'
                      : 'border-yellow-500/30 text-yellow-400'
                  }
                >
                  {item.status}
                </Badge>
              </div>
              <CardDescription className="text-gray-500 truncate text-xs">
                {item.prompt || 'No description'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
                {item.status === 'completed' && item.result && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-gray-400">
                    <Download className="h-3 w-3 mr-1" />
                    View
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Content Library</h1>
        <p className="text-gray-400 mt-1">
          {totalContent} total content pieces across all channels
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="all" className="gap-1.5 text-sm">
            All ({totalContent})
          </TabsTrigger>
          <TabsTrigger value="visuals" className="gap-1.5 text-sm">
            <Image className="h-3.5 w-3.5" />
            Graphics ({visualJobs.length})
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-1.5 text-sm">
            <Film className="h-3.5 w-3.5" />
            Videos ({videoJobs.length})
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-1.5 text-sm">
            <FileText className="h-3.5 w-3.5" />
            Written ({contentJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderContentList(
            [...visualJobs, ...videoJobs, ...contentJobs].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ),
            FileText,
            'No content generated yet. Start by creating a job from the dashboard.'
          )}
        </TabsContent>

        <TabsContent value="visuals">
          {renderContentList(visualJobs, Image, 'No visual content yet')}
        </TabsContent>

        <TabsContent value="videos">
          {renderContentList(videoJobs, Film, 'No video content yet')}
        </TabsContent>

        <TabsContent value="content">
          {renderContentList(contentJobs, FileText, 'No written content yet')}
        </TabsContent>
      </Tabs>
    </div>
  );
}
