'use client';

/**
 * Founder Alignment Dashboard
 * Phase 73: Multi-client comparison with risk and opportunity detection
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Target,
  ArrowRight,
} from 'lucide-react';
import { AlignmentScoreCard, AlignmentIndicator } from '@/ui/components/AlignmentScoreCard';
import { AlignmentOpportunitiesPanel, OpportunityCount } from '@/ui/components/AlignmentOpportunitiesPanel';
import { AlignmentBlockersPanel, BlockerCount } from '@/ui/components/AlignmentBlockersPanel';
import {
  generateAlignmentReport,
  AlignmentReport,
  AlignmentDataInput,
} from '@/lib/alignment/alignmentEngine';
import {
  generateFounderNarrative,
  generateStatusLine,
  AlignmentNarrative,
} from '@/lib/alignment/alignmentNarrative';

interface ClientAlignmentData {
  clientId: string;
  report: AlignmentReport;
  narrative: AlignmentNarrative;
  statusLine: string;
}

export default function FounderAlignmentPage() {
  const [clients, setClients] = useState<ClientAlignmentData[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlignmentData();
  }, []);

  const loadAlignmentData = async () => {
    setIsLoading(true);
    try {
      // Simulate multiple soft-launch clients
      const clientInputs: (AlignmentDataInput & { clientId: string })[] = [
        {
          clientId: 'client_1',
          workspaceId: 'ws_1',
          clientName: 'Alpha Construction',
          journeyDay: 52,
          journeyPhase: 'optimization',
          milestonesCompleted: 8,
          totalMilestones: 12,
          productionJobsCompleted: 10,
          profileCompleted: true,
          brandKitUploaded: true,
          lastCommunicationDays: 2,
          pendingProduction: 3,
          completedProduction: 10,
          pendingApprovals: 2,
          successScore: 72,
          brandAlignmentScore: 78,
          revisionRate: 0.08,
          engagementRate: 0.055,
          clientLoginDays: 1,
          feedbackCount: 8,
        },
        {
          clientId: 'client_2',
          workspaceId: 'ws_2',
          clientName: 'Beta Balustrades',
          journeyDay: 38,
          journeyPhase: 'activation',
          milestonesCompleted: 6,
          totalMilestones: 12,
          productionJobsCompleted: 5,
          profileCompleted: true,
          brandKitUploaded: true,
          lastCommunicationDays: 5,
          pendingProduction: 4,
          completedProduction: 5,
          pendingApprovals: 3,
          successScore: 58,
          brandAlignmentScore: 65,
          revisionRate: 0.18,
          engagementRate: 0.032,
          clientLoginDays: 3,
          feedbackCount: 4,
        },
        {
          clientId: 'client_3',
          workspaceId: 'ws_3',
          clientName: 'Gamma Glass',
          journeyDay: 22,
          journeyPhase: 'activation',
          milestonesCompleted: 4,
          totalMilestones: 12,
          productionJobsCompleted: 2,
          profileCompleted: true,
          brandKitUploaded: false, // Blocker!
          lastCommunicationDays: 8,
          pendingProduction: 1,
          completedProduction: 2,
          pendingApprovals: 0,
          engagementRate: 0.02,
          clientLoginDays: 5,
          feedbackCount: 1,
        },
        {
          clientId: 'client_4',
          workspaceId: 'ws_4',
          clientName: 'Delta Decks',
          journeyDay: 12,
          journeyPhase: 'foundation',
          milestonesCompleted: 3,
          totalMilestones: 12,
          productionJobsCompleted: 0,
          profileCompleted: true,
          brandKitUploaded: true,
          lastCommunicationDays: 1,
          pendingProduction: 2,
          completedProduction: 0,
          pendingApprovals: 0,
          clientLoginDays: 0,
          feedbackCount: 2,
        },
      ];

      const clientData = clientInputs.map(input => {
        const report = generateAlignmentReport(input);
        const narrative = generateFounderNarrative(report);
        const statusLine = generateStatusLine(report);
        return {
          clientId: input.clientId,
          report,
          narrative,
          statusLine,
        };
      });

      setClients(clientData);
      setSelectedClient(clientData[0]?.clientId || null);
    } catch (error) {
      console.error('Failed to load alignment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate aggregate stats
  const avgScore = Math.round(
    clients.reduce((sum, c) => sum + c.report.overall_score, 0) / clients.length
  );
  const totalBlockers = clients.reduce(
    (sum, c) => sum + c.report.blockers.filter(b => b.severity === 'critical' || b.severity === 'high').length,
    0
  );
  const totalOpportunities = clients.reduce(
    (sum, c) => sum + c.report.opportunities.filter(o => o.potential === 'high').length,
    0
  );
  const needsAttention = clients.filter(
    c => c.report.overall_status === 'needs_attention' || c.report.overall_status === 'misaligned'
  ).length;

  const selectedClientData = clients.find(c => c.clientId === selectedClient);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Alignment Overview</h1>
        <p className="text-muted-foreground">
          Multi-client alignment status with risk and opportunity detection
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{avgScore}%</p>
                <p className="text-xs text-muted-foreground">Avg Alignment</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-info-500" />
              <div>
                <p className="text-2xl font-bold">{clients.length}</p>
                <p className="text-xs text-muted-foreground">Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={totalBlockers > 0 ? 'border-error-500/50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-8 w-8 ${totalBlockers > 0 ? 'text-error-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-2xl font-bold">{totalBlockers}</p>
                <p className="text-xs text-muted-foreground">Critical Blockers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={totalOpportunities > 0 ? 'border-success-500/50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Sparkles className={`h-8 w-8 ${totalOpportunities > 0 ? 'text-success-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-2xl font-bold">{totalOpportunities}</p>
                <p className="text-xs text-muted-foreground">High Opportunities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client list and detail view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client list */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-medium">Clients by Alignment</h3>
          {clients
            .sort((a, b) => a.report.overall_score - b.report.overall_score) // Show lowest first
            .map((client) => (
              <Card
                key={client.clientId}
                className={`cursor-pointer transition-colors ${
                  selectedClient === client.clientId
                    ? 'ring-2 ring-primary'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedClient(client.clientId)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{client.report.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Day {client.report.journey_day} • {client.report.journey_phase}
                      </p>
                    </div>
                    <AlignmentIndicator
                      score={client.report.overall_score}
                      status={client.report.overall_status}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{client.statusLine}</p>
                  <div className="flex gap-3 mt-2">
                    <BlockerCount blockers={client.report.blockers} />
                    <OpportunityCount count={client.report.opportunities.filter(o => o.potential === 'high').length} />
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Client detail */}
        <div className="lg:col-span-2">
          {selectedClientData ? (
            <div className="space-y-4">
              {/* Narrative */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{selectedClientData.narrative.headline}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {selectedClientData.narrative.summary}
                  </p>

                  {/* Dimension highlights */}
                  <div className="space-y-1">
                    {selectedClientData.narrative.dimension_highlights.map((highlight, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        • {highlight}
                      </p>
                    ))}
                  </div>

                  {/* Next steps */}
                  {selectedClientData.narrative.next_steps.length > 0 && (
                    <div className="pt-2 border-t space-y-1">
                      <p className="text-xs font-medium">Next Steps:</p>
                      {selectedClientData.narrative.next_steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <Target className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                          <span className={step.startsWith('[URGENT]') ? 'text-error-500' : ''}>
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground">
                    {selectedClientData.narrative.data_notice}
                  </p>
                </CardContent>
              </Card>

              {/* Tabs for details */}
              <Tabs defaultValue="score">
                <TabsList>
                  <TabsTrigger value="score">Score</TabsTrigger>
                  <TabsTrigger value="blockers">
                    Blockers ({selectedClientData.report.blockers.length})
                  </TabsTrigger>
                  <TabsTrigger value="opportunities">
                    Opportunities ({selectedClientData.report.opportunities.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="score" className="mt-4">
                  <AlignmentScoreCard report={selectedClientData.report} />
                </TabsContent>

                <TabsContent value="blockers" className="mt-4">
                  <AlignmentBlockersPanel blockers={selectedClientData.report.blockers} />
                </TabsContent>

                <TabsContent value="opportunities" className="mt-4">
                  <AlignmentOpportunitiesPanel opportunities={selectedClientData.report.opportunities} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Select a client to view alignment details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
