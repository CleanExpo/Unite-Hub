'use client';

/**
 * Founder Client Stories Dashboard
 * Phase 74: View all client stories with operational insights
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BookOpen,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
  Star,
  BarChart3,
  Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StorySummaryCard } from '@/ui/components/StorySummaryCard';
import { MilestoneStoryList, MilestoneSummary } from '@/ui/components/MilestoneStoryRow';
import { StoryExportPanel } from '@/ui/components/StoryExportPanel';
import { CalloutHint, NoDataPlaceholder } from '@/ui/components/CalloutHint';
import {
  generateFounderClientStory,
  getStoryHealth,
  GeneratedFounderStory,
  StoryTimeRange,
} from '@/lib/storytelling/storytellingEngine';
import { FounderStoryNarrative } from '@/lib/storytelling/storytellingNarrativeBuilder';

interface ClientStoryItem {
  clientId: string;
  clientName: string;
  industry: string;
  storyHealth: number;
  lastUpdated: string;
}

export default function FounderClientStoriesPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientStoryItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<StoryTimeRange>('last_30_days');
  const [currentStory, setCurrentStory] = useState<GeneratedFounderStory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadClientStory();
    }
  }, [selectedClient, selectedPeriod]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      // In production, fetch from API
      const mockClients: ClientStoryItem[] = [
        {
          clientId: 'client_1',
          clientName: 'Alpha Construction',
          industry: 'Construction',
          storyHealth: 78,
          lastUpdated: '2 hours ago',
        },
        {
          clientId: 'client_2',
          clientName: 'Beta Balustrades',
          industry: 'Manufacturing',
          storyHealth: 52,
          lastUpdated: '1 day ago',
        },
        {
          clientId: 'client_3',
          clientName: 'Gamma Glass',
          industry: 'Glass & Glazing',
          storyHealth: 35,
          lastUpdated: '3 days ago',
        },
      ];

      setClients(mockClients);
      setSelectedClient(mockClients[0]?.clientId || null);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClientStory = async () => {
    if (!selectedClient) return;

    try {
      const story = generateFounderClientStory(
        'ws_demo',
        selectedClient,
        selectedPeriod
      );
      setCurrentStory(story);
    } catch (error) {
      console.error('Failed to load story:', error);
    }
  };

  const getPeriodLabel = (period: StoryTimeRange) => {
    switch (period) {
      case 'last_7_days':
        return 'Last 7 Days';
      case 'last_30_days':
        return 'Last 30 Days';
      case 'last_90_days':
        return 'Last 90 Days';
      case 'all_time':
        return 'All Time';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate aggregate stats
  const avgHealth = Math.round(
    clients.reduce((sum, c) => sum + c.storyHealth, 0) / clients.length
  );
  const healthyClients = clients.filter(c => c.storyHealth >= 75).length;
  const needsDataClients = clients.filter(c => c.storyHealth < 40).length;

  const selectedClientData = clients.find(c => c.clientId === selectedClient);
  const founderNarrative = currentStory?.narrative as FounderStoryNarrative | undefined;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Client Stories</h1>
          <p className="text-muted-foreground">
            View client journey narratives with operational insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/founder/dashboard/story-touchpoints')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Touchpoints
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/founder/dashboard/first-client-journey')}
          >
            <Users className="h-4 w-4 mr-2" />
            Journey View
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/founder/dashboard/alignment')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Alignment
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{avgHealth}%</p>
                <p className="text-xs text-muted-foreground">Avg Story Health</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{healthyClients}</p>
                <p className="text-xs text-muted-foreground">Complete Stories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={needsDataClients > 0 ? 'border-orange-500/50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle
                className={`h-8 w-8 ${
                  needsDataClients > 0 ? 'text-orange-500' : 'text-muted-foreground'
                }`}
              />
              <div>
                <p className="text-2xl font-bold">{needsDataClients}</p>
                <p className="text-xs text-muted-foreground">Need More Data</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client selector and period */}
      <div className="flex items-center gap-4">
        <Select value={selectedClient || ''} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.clientId} value={client.clientId}>
                <div className="flex items-center justify-between w-full">
                  <span>{client.clientName}</span>
                  <Badge
                    variant="outline"
                    className={`ml-2 text-[10px] ${
                      client.storyHealth >= 75
                        ? 'text-green-500'
                        : client.storyHealth >= 40
                        ? 'text-yellow-500'
                        : 'text-orange-500'
                    }`}
                  >
                    {client.storyHealth}%
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedPeriod}
          onValueChange={(v) => setSelectedPeriod(v as StoryTimeRange)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last_7_days">Last 7 Days</SelectItem>
            <SelectItem value="last_30_days">Last 30 Days</SelectItem>
            <SelectItem value="last_90_days">Last 90 Days</SelectItem>
            <SelectItem value="all_time">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Story content */}
      {currentStory && founderNarrative ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main story */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{founderNarrative.title}</CardTitle>
                    <CardDescription>{founderNarrative.subtitle}</CardDescription>
                  </div>
                  <Badge variant="outline">
                    {selectedClientData?.industry}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Executive summary */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Summary</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {founderNarrative.executive_summary}
                  </p>
                </div>

                {/* Operational summary */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <h3 className="text-xs font-medium mb-1">Operational Summary</h3>
                  <p className="text-xs text-muted-foreground">
                    {founderNarrative.operational_summary}
                  </p>
                </div>

                {/* KPIs */}
                {founderNarrative.kpi_highlights.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Key Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {founderNarrative.kpi_highlights.map((kpi, i) => (
                        <div
                          key={i}
                          className="text-center p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="font-medium text-sm">{kpi.value}</div>
                          <div className="text-xs text-muted-foreground">{kpi.name}</div>
                          <div className="text-[10px] text-muted-foreground">{kpi.trend}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk indicators */}
                {founderNarrative.risk_indicators.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Risk Indicators
                    </h3>
                    <ul className="space-y-1">
                      {founderNarrative.risk_indicators.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-orange-600">
                          <span>⚠️</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Opportunity indicators */}
                {founderNarrative.opportunity_indicators.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Opportunities
                    </h3>
                    <ul className="space-y-1">
                      {founderNarrative.opportunity_indicators.map((opp, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span>✨</span>
                          <span>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended actions */}
                {founderNarrative.recommended_actions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Recommended Actions</h3>
                    <ul className="space-y-2">
                      {founderNarrative.recommended_actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0">
                            {i + 1}
                          </div>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Data notice */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Info className="h-3 w-3" />
                  {founderNarrative.data_notice}
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            {currentStory.data.milestones.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Milestones</CardTitle>
                    <MilestoneSummary milestones={currentStory.data.milestones} />
                  </div>
                </CardHeader>
                <CardContent>
                  <MilestoneStoryList
                    milestones={currentStory.data.milestones}
                    maxItems={5}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Export */}
            <StoryExportPanel
              narrative={founderNarrative}
              videoScript={currentStory.videoScript}
              voiceScript={currentStory.voiceScript}
            />

            {/* Client quick stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Client Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry</span>
                  <span>{selectedClientData?.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Story Health</span>
                  <span>{selectedClientData?.storyHealth}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{selectedClientData?.lastUpdated}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <NoDataPlaceholder
          message="Select a client to view their story"
          suggestion="Choose a client from the dropdown above"
        />
      )}
    </div>
  );
}
