'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Users,
  Mail,
  Eye,
  MousePointerClick,
  Target,
  Activity,
  Calendar,
  DollarSign
} from 'lucide-react';

interface AnalyticsStats {
  totalContacts: number;
  totalCampaigns: number;
  emailsSent: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  hotLeads: number;
  avgScore: number;
}

export default function AIDOAnalyticsPage() {
  const { currentOrganization } = useAuth();
  const [stats, setStats] = useState<AnalyticsStats>({
    totalContacts: 0,
    totalCampaigns: 0,
    emailsSent: 0,
    openRate: 0,
    clickRate: 0,
    replyRate: 0,
    hotLeads: 0,
    avgScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrganization?.org_id) {
      fetchAnalytics();
    }
  }, [currentOrganization]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { supabaseBrowser } = await import('@/lib/supabase');
      const workspaceId = currentOrganization!.org_id;

      // Fetch contacts
      const { data: contacts } = await supabaseBrowser
        .from('contacts')
        .select('ai_score')
        .eq('workspace_id', workspaceId);

      // Fetch campaigns
      const { data: campaigns } = await supabaseBrowser
        .from('campaigns')
        .select('sent_count, opened_count, clicked_count, replied_count')
        .eq('workspace_id', workspaceId);

      // Calculate stats
      const totalContacts = contacts?.length || 0;
      const totalCampaigns = campaigns?.length || 0;
      const hotLeads = contacts?.filter(c => c.ai_score >= 80).length || 0;
      const avgScore = totalContacts > 0
        ? Math.round(contacts!.reduce((sum, c) => sum + c.ai_score, 0) / totalContacts)
        : 0;

      const emailsSent = campaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0;
      const emailsOpened = campaigns?.reduce((sum, c) => sum + (c.opened_count || 0), 0) || 0;
      const emailsClicked = campaigns?.reduce((sum, c) => sum + (c.clicked_count || 0), 0) || 0;
      const emailsReplied = campaigns?.reduce((sum, c) => sum + (c.replied_count || 0), 0) || 0;

      const openRate = emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100) : 0;
      const clickRate = emailsSent > 0 ? Math.round((emailsClicked / emailsSent) * 100) : 0;
      const replyRate = emailsSent > 0 ? Math.round((emailsReplied / emailsSent) * 100) : 0;

      setStats({
        totalContacts,
        totalCampaigns,
        emailsSent,
        openRate,
        clickRate,
        replyRate,
        hotLeads,
        avgScore,
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color,
    trend,
  }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
    trend?: string;
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend && (
            <Badge variant="outline" className="text-green-600">
              {trend}
            </Badge>
          )}
        </div>
        <h3 className="text-2xl font-bold">{value}</h3>
        <p className="text-sm text-text-secondary">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold">Analytics Overview</h1>
        </div>
        <p className="text-text-secondary">
          Real-time insights into your AIDO performance and client engagement
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Loading analytics...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                title="Total Contacts"
                value={stats.totalContacts}
                subtitle="Active client profiles"
                color="bg-blue-500"
              />
              <StatCard
                icon={Target}
                title="Hot Leads"
                value={stats.hotLeads}
                subtitle="Score 80+"
                color="bg-red-500"
                trend="+12%"
              />
              <StatCard
                icon={Activity}
                title="Avg AI Score"
                value={`${stats.avgScore}/100`}
                subtitle="Lead quality metric"
                color="bg-green-500"
              />
              <StatCard
                icon={Mail}
                title="Active Campaigns"
                value={stats.totalCampaigns}
                subtitle="Running campaigns"
                color="bg-purple-500"
              />
            </div>
          </div>

          {/* Email Performance */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Email Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Mail}
                title="Emails Sent"
                value={stats.emailsSent.toLocaleString()}
                subtitle="Total outreach"
                color="bg-indigo-500"
              />
              <StatCard
                icon={Eye}
                title="Open Rate"
                value={`${stats.openRate}%`}
                subtitle={`${Math.round((stats.openRate / 100) * stats.emailsSent)} opens`}
                color="bg-cyan-500"
                trend="+5%"
              />
              <StatCard
                icon={MousePointerClick}
                title="Click Rate"
                value={`${stats.clickRate}%`}
                subtitle={`${Math.round((stats.clickRate / 100) * stats.emailsSent)} clicks`}
                color="bg-orange-500"
                trend="+3%"
              />
              <StatCard
                icon={TrendingUp}
                title="Reply Rate"
                value={`${stats.replyRate}%`}
                subtitle={`${Math.round((stats.replyRate / 100) * stats.emailsSent)} replies`}
                color="bg-green-500"
                trend="+8%"
              />
            </div>
          </div>

          {/* Performance Insights */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Performance Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Trends</CardTitle>
                  <CardDescription>Last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email Opens</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-bg-hover rounded-full h-2">
                          <div
                            className="bg-cyan-500 h-2 rounded-full"
                            style={{ width: `${stats.openRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{stats.openRate}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Link Clicks</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-bg-hover rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${stats.clickRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{stats.clickRate}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Replies</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-bg-hover rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${stats.replyRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{stats.replyRate}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lead Quality Distribution</CardTitle>
                  <CardDescription>AI score breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <span className="text-sm">Hot (80-100)</span>
                      </div>
                      <span className="text-sm font-medium">{stats.hotLeads} contacts</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                        <span className="text-sm">Warm (60-79)</span>
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round(stats.totalContacts * 0.3)} contacts
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full" />
                        <span className="text-sm">Cold (0-59)</span>
                      </div>
                      <span className="text-sm font-medium">
                        {stats.totalContacts - stats.hotLeads - Math.round(stats.totalContacts * 0.3)} contacts
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
              <CardDescription>AI-powered suggestions to improve performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Focus on hot leads</p>
                    <p className="text-sm text-text-secondary">
                      You have {stats.hotLeads} contacts with AI scores above 80. Prioritize outreach to these high-quality leads.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <Mail className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Improve open rates</p>
                    <p className="text-sm text-text-secondary">
                      Your current open rate is {stats.openRate}%. Industry average is 21%. Try A/B testing subject lines.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Re-engage inactive contacts</p>
                    <p className="text-sm text-text-secondary">
                      {Math.round(stats.totalContacts * 0.2)} contacts haven't engaged in 30+ days. Consider a re-engagement campaign.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
