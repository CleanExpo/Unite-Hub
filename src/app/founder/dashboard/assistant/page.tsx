'use client';

/**
 * Founder Executive Assistant Dashboard
 * Phase 51: AI-powered founder command center
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FounderBriefingCard } from '@/ui/components/FounderBriefingCard';
import { FounderMemoryGraph } from '@/ui/components/FounderMemoryGraph';
import { StaffActivityCard } from '@/ui/components/StaffActivityCard';
import { ClientCommsTimeline } from '@/ui/components/ClientCommsTimeline';
import {
  Mic, MicOff, RefreshCw, Brain, Mail, Users, DollarSign,
  Calendar, Send, Loader2
} from 'lucide-react';

export default function FounderAssistantPage() {
  const { user, currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandResult, setCommandResult] = useState<any>(null);
  const [memoryNodes, setMemoryNodes] = useState<any[]>([]);
  const [staffInsights, setStaffInsights] = useState<any[]>([]);

  const organizationId = currentOrganization?.org_id || '';

  useEffect(() => {
    if (organizationId) {
      fetchDashboardData();
    }
  }, [organizationId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `/api/founder/assistant?action=dashboard&organizationId=${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }

      // Fetch memory nodes
      const memoryResponse = await fetch(
        `/api/founder/assistant?action=memory&organizationId=${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (memoryResponse.ok) {
        const memoryData = await memoryResponse.json();
        setMemoryNodes(memoryData.nodes || []);
      }

      // Fetch staff insights
      const staffResponse = await fetch(
        `/api/founder/assistant?action=staff&organizationId=${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        setStaffInsights(staffData.insights || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBriefing = async () => {
    try {
      setIsProcessing(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/founder/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'generateBriefing',
          organizationId,
        }),
      });

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error generating briefing:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceCommand = async () => {
    if (!voiceCommand.trim()) return;

    try {
      setIsProcessing(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/founder/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'voiceCommand',
          organizationId,
          command: voiceCommand,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCommandResult(data.result);
      }

      setVoiceCommand('');
    } catch (error) {
      console.error('Error executing command:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMemorySearch = async (query: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `/api/founder/assistant?action=search&query=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMemoryNodes(data.results || []);
      }
    } catch (error) {
      console.error('Error searching memory:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Executive Assistant</h1>
          <p className="text-muted-foreground">
            AI-powered command center for founder oversight
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleGenerateBriefing} disabled={isProcessing}>
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="mr-2 h-4 w-4" />
            )}
            Generate Briefing
          </Button>
        </div>
      </div>

      {/* Voice Command Input */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mic className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter voice command... (e.g., 'show briefing', 'summarise emails', 'list clients')"
                value={voiceCommand}
                onChange={(e) => setVoiceCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVoiceCommand()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleVoiceCommand} disabled={isProcessing || !voiceCommand.trim()}>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {commandResult && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <p className="text-sm">{commandResult.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {dashboardData?.emailSummary?.total || 0}
                </div>
                <div className="text-xs text-muted-foreground">Emails This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {dashboardData?.memoryStats?.totalNodes || 0}
                </div>
                <div className="text-xs text-muted-foreground">Memory Nodes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {dashboardData?.staffOverview?.totalStaff || 0}
                </div>
                <div className="text-xs text-muted-foreground">Team Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-500" />
              <div>
                <div className="text-2xl font-bold">
                  ${(dashboardData?.financial?.netPosition || 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Net Position</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="briefing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="briefing">Briefing</TabsTrigger>
          <TabsTrigger value="memory">Memory Graph</TabsTrigger>
          <TabsTrigger value="staff">Staff Activity</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
        </TabsList>

        <TabsContent value="briefing" className="space-y-4">
          {dashboardData?.briefing ? (
            <FounderBriefingCard
              briefing={dashboardData.briefing}
              onMarkRead={async (id) => {
                const { data: { session } } = await supabase.auth.getSession();
                await fetch('/api/founder/assistant', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`,
                  },
                  body: JSON.stringify({
                    action: 'markBriefingRead',
                    briefingId: id,
                  }),
                });
                fetchDashboardData();
              }}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No briefing available. Click "Generate Briefing" to create one.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="memory">
          <FounderMemoryGraph
            nodes={memoryNodes}
            stats={dashboardData?.memoryStats || {
              totalNodes: 0,
              byType: {},
              avgImportance: 0,
              recentlyAccessed: 0,
            }}
            onSearch={handleMemorySearch}
          />
        </TabsContent>

        <TabsContent value="staff">
          <StaffActivityCard
            insights={staffInsights}
            overview={dashboardData?.staffOverview || {
              totalStaff: 0,
              avgProductivity: 0,
              avgEngagement: 0,
              totalTasks: 0,
              totalHours: 0,
              topPerformers: [],
            }}
          />
        </TabsContent>

        <TabsContent value="financials">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Count</span>
                    <span className="font-medium">
                      {dashboardData?.financial?.invoices?.count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">
                      ${(dashboardData?.financial?.invoices?.total || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Outstanding</span>
                    <span className="font-medium text-amber-500">
                      ${(dashboardData?.financial?.invoices?.outstanding || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Receipts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Count</span>
                    <span className="font-medium">
                      {dashboardData?.financial?.receipts?.count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">
                      ${(dashboardData?.financial?.receipts?.total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
