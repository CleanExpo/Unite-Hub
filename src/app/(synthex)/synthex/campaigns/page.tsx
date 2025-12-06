/**
 * Synthex Campaigns
 *
 * Campaign management for email and drip campaigns:
 * - Campaign list with status
 * - Create new campaign wizard
 * - Campaign performance metrics
 * - Drip campaign builder
 *
 * IMPLEMENTED[PHASE_B3]: Wire up campaign APIs
 * IMPLEMENTED[PHASE_B4]: AI sequence generation via agent
 * IMPLEMENTED[PHASE_B5]: Campaign scheduling + timelines
 * TODO[PHASE_B6]: Delivery integration connectors
 *
 * Backlog: SYNTHEX-003
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Megaphone,
  Plus,
  Mail,
  Clock,
  BarChart3,
  Play,
  Pause,
  Users,
  TrendingUp,
  Loader2,
  Search,
  Calendar,
  CalendarDays,
  Target,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Send,
  Sparkles,
  Wand2,
  Timer,
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: 'email' | 'drip' | 'newsletter' | 'promotional' | 'transactional';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  steps: Array<{
    type: string;
    content?: string;
    delay?: number;
    condition?: string;
  }>;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  created_at: string;
  updated_at: string;
}

interface CampaignStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  totalEmailsSent: number;
  totalOpened: number;
  totalClicked: number;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  scheduled: 'bg-blue-500',
  active: 'bg-green-500',
  paused: 'bg-yellow-500',
  completed: 'bg-purple-500',
  cancelled: 'bg-red-500',
};

const typeLabels: Record<string, string> = {
  email: 'Email Campaign',
  drip: 'Drip Sequence',
  newsletter: 'Newsletter',
  promotional: 'Promotional',
  transactional: 'Transactional',
};

export default function SynthexCampaignsPage() {
  const [tenantId, setTenantId] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  // AI sequence generation state
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedSequence, setGeneratedSequence] = useState<{
    campaignName: string;
    emails: Array<{
      subject: string;
      body: string;
      delayDays: number;
    }>;
  } | null>(null);
  const [generateForm, setGenerateForm] = useState({
    campaignType: 'drip' as 'drip' | 'email' | 'newsletter',
    goal: '',
    emailCount: 5,
  });

  // Scheduling state
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    startDate: '',
    startTime: '09:00',
    intervalDays: 1,
  });

  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    type: 'email' as Campaign['type'],
  });

  const loadCampaigns = async (statusFilter?: string) => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tenantId,
        includeStats: 'true',
        limit: '50',
      });

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const res = await fetch(`/api/synthex/campaigns?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load campaigns');
      }

      setCampaigns(data.campaigns || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!tenantId || !newCampaign.name.trim()) return;

    setCreating(true);

    try {
      const res = await fetch('/api/synthex/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: newCampaign.name.trim(),
          description: newCampaign.description.trim() || null,
          type: newCampaign.type,
          steps: [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create campaign');
      }

      // Add new campaign to list
      setCampaigns((prev) => [data.campaign, ...prev]);

      // Update stats
      if (stats) {
        setStats({
          ...stats,
          total: stats.total + 1,
          byStatus: {
            ...stats.byStatus,
            draft: (stats.byStatus.draft || 0) + 1,
          },
          byType: {
            ...stats.byType,
            [newCampaign.type]: (stats.byType[newCampaign.type] || 0) + 1,
          },
        });
      }

      // Reset form and close dialog
      setNewCampaign({ name: '', description: '', type: 'email' });
      setShowCreateDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    loadCampaigns(value);
  };

  // AI Sequence Generation
  const handleGenerateSequence = async () => {
    if (!tenantId || !generateForm.goal.trim()) return;

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/synthex/agent/generate-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          campaignType: generateForm.campaignType,
          goal: generateForm.goal.trim(),
          emailCount: generateForm.emailCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate sequence');
      }

      setGeneratedSequence({
        campaignName: data.campaignName || `AI ${generateForm.campaignType} campaign`,
        emails: data.emails || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate sequence');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveGeneratedSequence = async () => {
    if (!generatedSequence || !tenantId) return;

    setCreating(true);

    try {
      // Convert emails to campaign steps
      const steps = generatedSequence.emails.map((email, index) => ({
        type: 'email',
        subject: email.subject,
        content: email.body,
        delay: index === 0 ? 0 : email.delayDays * 24 * 60 * 60, // Convert days to seconds
      }));

      const res = await fetch('/api/synthex/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: generatedSequence.campaignName,
          description: `AI-generated ${generateForm.campaignType} campaign: ${generateForm.goal}`,
          type: generateForm.campaignType,
          steps,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save campaign');
      }

      // Add new campaign to list
      setCampaigns((prev) => [data.campaign, ...prev]);

      // Update stats
      if (stats) {
        setStats({
          ...stats,
          total: stats.total + 1,
          byStatus: {
            ...stats.byStatus,
            draft: (stats.byStatus.draft || 0) + 1,
          },
          byType: {
            ...stats.byType,
            [generateForm.campaignType]: (stats.byType[generateForm.campaignType] || 0) + 1,
          },
        });
      }

      // Reset and close
      setGeneratedSequence(null);
      setGenerateForm({ campaignType: 'drip', goal: '', emailCount: 5 });
      setShowGenerateDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save campaign');
    } finally {
      setCreating(false);
    }
  };

  // Open schedule dialog for a campaign
  const openScheduleDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleForm({
      startDate: tomorrow.toISOString().split('T')[0],
      startTime: '09:00',
      intervalDays: 1,
    });
    setShowScheduleDialog(true);
  };

  // Schedule a campaign
  const handleScheduleCampaign = async () => {
    if (!selectedCampaign || !tenantId || !scheduleForm.startDate) return;

    setScheduling(true);
    setError(null);

    try {
      // Generate schedule steps based on campaign steps
      const steps = selectedCampaign.steps.map((step, index) => {
        const sendDate = new Date(`${scheduleForm.startDate}T${scheduleForm.startTime}`);
        sendDate.setDate(sendDate.getDate() + (index * scheduleForm.intervalDays));
        return {
          stepIndex: index,
          sendAt: sendDate.toISOString(),
        };
      });

      // If no steps, create at least one schedule
      if (steps.length === 0) {
        steps.push({
          stepIndex: 0,
          sendAt: new Date(`${scheduleForm.startDate}T${scheduleForm.startTime}`).toISOString(),
        });
      }

      const res = await fetch('/api/synthex/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: selectedCampaign.id,
          tenantId,
          steps,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to schedule campaign');
      }

      // Update local campaign status
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === selectedCampaign.id
            ? { ...c, status: 'scheduled', scheduled_at: scheduleForm.startDate }
            : c
        )
      );

      // Update stats
      if (stats) {
        setStats({
          ...stats,
          byStatus: {
            ...stats.byStatus,
            draft: Math.max(0, (stats.byStatus.draft || 0) - 1),
            scheduled: (stats.byStatus.scheduled || 0) + 1,
          },
        });
      }

      setShowScheduleDialog(false);
      setSelectedCampaign(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule campaign');
    } finally {
      setScheduling(false);
    }
  };

  // Filter campaigns by search query
  const filteredCampaigns = campaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate rates
  const openRate =
    stats && stats.totalEmailsSent > 0
      ? ((stats.totalOpened / stats.totalEmailsSent) * 100).toFixed(1)
      : '0';
  const clickRate =
    stats && stats.totalEmailsSent > 0
      ? ((stats.totalClicked / stats.totalEmailsSent) * 100).toFixed(1)
      : '0';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Campaigns</h1>
          <p className="text-gray-400 mt-2">
            Manage your email and marketing campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowGenerateDialog(true)}
            disabled={!tenantId}
            variant="outline"
            className="gap-2 border-purple-600 text-purple-400 hover:bg-purple-950"
          >
            <Wand2 className="h-4 w-4" />
            Generate with AI
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            disabled={!tenantId}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Tenant ID Input (temporary - will auto-populate from session) */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm text-gray-400 mb-2 block">Tenant ID</label>
              <Input
                placeholder="Enter your tenant ID..."
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
            <Button
              onClick={() => loadCampaigns(activeTab)}
              disabled={!tenantId || loading}
              variant="outline"
              className="border-gray-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Load Campaigns
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Megaphone className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">
                  {stats?.byStatus.active || 0}
                </p>
                <p className="text-sm text-gray-400">Active Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">
                  {stats?.totalEmailsSent?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-400">Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">{openRate}%</p>
                <p className="text-sm text-gray-400">Open Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">{clickRate}%</p>
                <p className="text-sm text-gray-400">Click Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      {tenantId && campaigns.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-gray-100"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Campaigns Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-gray-700">
            All ({stats?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-gray-700">
            Active ({stats?.byStatus.active || 0})
          </TabsTrigger>
          <TabsTrigger value="draft" className="data-[state=active]:bg-gray-700">
            Drafts ({stats?.byStatus.draft || 0})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-gray-700">
            Completed ({stats?.byStatus.completed || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {!tenantId ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-16 text-center">
                <Megaphone className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  Enter Tenant ID to View Campaigns
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Enter your tenant ID above to load and manage your campaigns.
                </p>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-16 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Loading campaigns...</p>
              </CardContent>
            </Card>
          ) : filteredCampaigns.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-100">
                  {searchQuery ? 'No Matching Campaigns' : 'No Campaigns Yet'}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Create your first campaign to get started'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Megaphone className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                  {!searchQuery && (
                    <Button
                      onClick={() => setShowCreateDialog(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Your First Campaign
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <Card
                  key={campaign.id}
                  className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-100">
                            {campaign.name}
                          </h3>
                          <Badge
                            className={`${statusColors[campaign.status]} text-white`}
                          >
                            {campaign.status}
                          </Badge>
                          <Badge variant="outline" className="text-gray-400">
                            {typeLabels[campaign.type] || campaign.type}
                          </Badge>
                        </div>
                        {campaign.description && (
                          <p className="text-gray-400 text-sm mb-4">
                            {campaign.description}
                          </p>
                        )}
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Created{' '}
                            {new Date(campaign.created_at).toLocaleDateString()}
                          </div>
                          {campaign.scheduled_at && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Scheduled{' '}
                              {new Date(campaign.scheduled_at).toLocaleDateString()}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            {campaign.emails_sent.toLocaleString()} sent
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            {campaign.emails_opened.toLocaleString()} opened
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            {campaign.emails_clicked.toLocaleString()} clicked
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {campaign.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openScheduleDialog(campaign)}
                            className="border-blue-600 text-blue-400 hover:bg-blue-950"
                          >
                            <CalendarDays className="h-4 w-4 mr-2" />
                            Schedule
                          </Button>
                        )}
                        {campaign.status === 'scheduled' && (
                          <Badge className="bg-blue-500 text-white">
                            <Timer className="h-3 w-3 mr-1" />
                            Scheduled
                          </Badge>
                        )}
                        {campaign.status === 'active' && (
                          <Button variant="outline" size="sm" disabled>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" disabled>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" disabled>
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Campaign Types Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-400" />
              Email Campaigns
            </CardTitle>
            <CardDescription className="text-gray-400">
              One-time email blasts to your audience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Newsletter announcements
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Promotional offers
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Product updates
              </li>
            </ul>
            <Badge variant="secondary" className="mt-4">
              Available Now
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-400" />
              Drip Campaigns
            </CardTitle>
            <CardDescription className="text-gray-400">
              Automated email sequences over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                Welcome series
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                Lead nurturing
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                Re-engagement flows
              </li>
            </ul>
            <Badge variant="secondary" className="mt-4">
              Sequence Editor in Phase B5
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Create New Campaign</DialogTitle>
            <DialogDescription className="text-gray-400">
              Set up a new email or drip campaign for your audience.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-200">
                Campaign Name
              </Label>
              <Input
                id="name"
                placeholder="e.g., Welcome Series"
                value={newCampaign.name}
                onChange={(e) =>
                  setNewCampaign({ ...newCampaign, name: e.target.value })
                }
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-gray-200">
                Campaign Type
              </Label>
              <Select
                value={newCampaign.type}
                onValueChange={(value: Campaign['type']) =>
                  setNewCampaign({ ...newCampaign, type: value })
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="email">Email Campaign</SelectItem>
                  <SelectItem value="drip">Drip Sequence</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-200">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Brief description of this campaign..."
                value={newCampaign.description}
                onChange={(e) =>
                  setNewCampaign({ ...newCampaign, description: e.target.value })
                }
                className="bg-gray-800 border-gray-700 text-gray-100 resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCampaign}
              disabled={creating || !newCampaign.name.trim()}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Sequence Generation Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Generate Campaign Sequence with AI
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Describe your campaign goal and AI will generate a complete email sequence.
            </DialogDescription>
          </DialogHeader>

          {!generatedSequence ? (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-gray-200">Campaign Type</Label>
                  <Select
                    value={generateForm.campaignType}
                    onValueChange={(value: 'drip' | 'email' | 'newsletter') =>
                      setGenerateForm({ ...generateForm, campaignType: value })
                    }
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="drip">Drip Sequence</SelectItem>
                      <SelectItem value="email">Email Campaign</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Campaign Goal</Label>
                  <Textarea
                    placeholder="e.g., Welcome new subscribers and introduce them to our product features over 5 emails..."
                    value={generateForm.goal}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, goal: e.target.value })
                    }
                    className="bg-gray-800 border-gray-700 text-gray-100 resize-none min-h-[100px]"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Number of Emails</Label>
                  <Select
                    value={String(generateForm.emailCount)}
                    onValueChange={(value) =>
                      setGenerateForm({ ...generateForm, emailCount: Number(value) })
                    }
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                      <SelectValue placeholder="Select count" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="3">3 emails</SelectItem>
                      <SelectItem value="5">5 emails</SelectItem>
                      <SelectItem value="7">7 emails</SelectItem>
                      <SelectItem value="10">10 emails</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowGenerateDialog(false)}
                  className="border-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateSequence}
                  disabled={generating || !generateForm.goal.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Sequence
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="p-4 bg-purple-900/20 border border-purple-800 rounded-lg">
                  <h4 className="font-medium text-purple-300 mb-2">
                    {generatedSequence.campaignName}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {generatedSequence.emails.length} emails generated
                  </p>
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                  {generatedSequence.emails.map((email, index) => (
                    <Card key={index} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-purple-400">
                            Email {index + 1}
                          </Badge>
                          {email.delayDays > 0 && (
                            <Badge variant="secondary" className="text-gray-400">
                              <Clock className="h-3 w-3 mr-1" />
                              Day {email.delayDays}
                            </Badge>
                          )}
                        </div>
                        <h5 className="font-medium text-gray-100 mb-2">
                          {email.subject}
                        </h5>
                        <p className="text-sm text-gray-400 whitespace-pre-wrap line-clamp-3">
                          {email.body}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedSequence(null);
                    setGenerateForm({ campaignType: 'drip', goal: '', emailCount: 5 });
                  }}
                  className="border-gray-700"
                >
                  Start Over
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGenerateSequence}
                  disabled={generating}
                  className="border-gray-700"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Regenerate</span>
                </Button>
                <Button
                  onClick={handleSaveGeneratedSequence}
                  disabled={creating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Save as Campaign
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Campaign Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-100 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-400" />
              Schedule Campaign
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedCampaign
                ? `Schedule "${selectedCampaign.name}" for delivery`
                : 'Set when to send your campaign'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-200">Start Date</Label>
              <Input
                type="date"
                value={scheduleForm.startDate}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, startDate: e.target.value })
                }
                min={new Date().toISOString().split('T')[0]}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">Send Time</Label>
              <Input
                type="time"
                value={scheduleForm.startTime}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, startTime: e.target.value })
                }
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>

            {selectedCampaign && selectedCampaign.steps.length > 1 && (
              <div className="space-y-2">
                <Label className="text-gray-200">Days Between Emails</Label>
                <Select
                  value={String(scheduleForm.intervalDays)}
                  onValueChange={(value) =>
                    setScheduleForm({ ...scheduleForm, intervalDays: Number(value) })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="1">Every day</SelectItem>
                    <SelectItem value="2">Every 2 days</SelectItem>
                    <SelectItem value="3">Every 3 days</SelectItem>
                    <SelectItem value="7">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedCampaign && scheduleForm.startDate && (
              <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-300 mb-2 flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Schedule Preview
                </h4>
                <div className="space-y-1 text-sm text-gray-400">
                  {selectedCampaign.steps.length > 0 ? (
                    selectedCampaign.steps.slice(0, 5).map((_, index) => {
                      const sendDate = new Date(`${scheduleForm.startDate}T${scheduleForm.startTime}`);
                      sendDate.setDate(sendDate.getDate() + (index * scheduleForm.intervalDays));
                      return (
                        <div key={index} className="flex justify-between">
                          <span>Email {index + 1}</span>
                          <span>{sendDate.toLocaleDateString()} at {scheduleForm.startTime}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex justify-between">
                      <span>Campaign</span>
                      <span>
                        {new Date(`${scheduleForm.startDate}T${scheduleForm.startTime}`).toLocaleDateString()}{' '}
                        at {scheduleForm.startTime}
                      </span>
                    </div>
                  )}
                  {selectedCampaign.steps.length > 5 && (
                    <div className="text-gray-500">
                      + {selectedCampaign.steps.length - 5} more emails...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowScheduleDialog(false);
                setSelectedCampaign(null);
              }}
              className="border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleScheduleCampaign}
              disabled={scheduling || !scheduleForm.startDate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {scheduling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Schedule Campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
