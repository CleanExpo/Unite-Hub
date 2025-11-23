'use client';

/**
 * Founder First Client Journey Dashboard
 * Phase 72: Cross-client view for soft-launch clients (1-5)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlayCircle,
  Target,
  Zap,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { JourneyTimeline, JourneyIndicator } from '@/ui/components/JourneyTimeline';
import { CalloutHint, DemoBanner } from '@/ui/components/CalloutHint';
import { GuidedTourStepper, useGuidedTour } from '@/ui/components/GuidedTourStepper';
import {
  calculateJourneyState,
  getPhaseConfig,
  getMilestoneDisplayName,
  JOURNEY_PHASES,
  JourneyState,
  JourneyPhase,
} from '@/lib/guides/firstClientJourneyConfig';
import { FOUNDER_GUIDED_TOUR } from '@/lib/guides/roleGuidedTourConfig';

interface ClientJourneyData {
  clientId: string;
  clientName: string;
  industry: string;
  journeyState: JourneyState;
  successScore?: number;
  activationScore?: number;
  lastActivity: string;
  needsAttention: boolean;
  attentionReason?: string;
}

export default function FounderFirstClientJourneyPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientJourneyData[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const tour = useGuidedTour(FOUNDER_GUIDED_TOUR);

  useEffect(() => {
    loadClientsData();
  }, []);

  const loadClientsData = async () => {
    setIsLoading(true);
    try {
      // Simulate loading first 1-5 soft-launch clients
      // In production, fetch from API
      const mockClients: ClientJourneyData[] = [
        {
          clientId: 'client_1',
          clientName: 'Alpha Construction',
          industry: 'Construction',
          journeyState: calculateJourneyState({
            createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            profileCompleted: true,
            brandKitUploaded: true,
            vifGenerated: true,
            productionJobs: 8,
            contentDelivered: 20,
            performanceReports: 2,
            reactiveEngineActive: true,
            optimizationCycles: 1,
          }),
          successScore: 68,
          activationScore: 85,
          lastActivity: '2 hours ago',
          needsAttention: false,
        },
        {
          clientId: 'client_2',
          clientName: 'Beta Balustrades',
          industry: 'Manufacturing',
          journeyState: calculateJourneyState({
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            profileCompleted: true,
            brandKitUploaded: true,
            vifGenerated: true,
            productionJobs: 4,
            contentDelivered: 10,
            performanceReports: 1,
          }),
          successScore: 52,
          activationScore: 72,
          lastActivity: '1 day ago',
          needsAttention: false,
        },
        {
          clientId: 'client_3',
          clientName: 'Gamma Glass',
          industry: 'Glass & Glazing',
          journeyState: calculateJourneyState({
            createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
            profileCompleted: true,
            brandKitUploaded: true,
            vifGenerated: true,
            productionJobs: 2,
          }),
          activationScore: 58,
          lastActivity: '3 days ago',
          needsAttention: true,
          attentionReason: 'No content delivered in 10 days',
        },
        {
          clientId: 'client_4',
          clientName: 'Delta Decks',
          industry: 'Outdoor Living',
          journeyState: calculateJourneyState({
            createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            profileCompleted: true,
            brandKitUploaded: false,
          }),
          activationScore: 35,
          lastActivity: '5 days ago',
          needsAttention: true,
          attentionReason: 'Brand kit not uploaded - blocking VIF generation',
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
  const totalClients = clients.length;
  const avgProgress = Math.round(
    clients.reduce((sum, c) => sum + c.journeyState.progressPercent, 0) / totalClients
  );
  const clientsNeedingAttention = clients.filter(c => c.needsAttention).length;
  const avgActivationScore = Math.round(
    clients.reduce((sum, c) => sum + (c.activationScore || 0), 0) / totalClients
  );

  // Phase distribution
  const phaseDistribution = JOURNEY_PHASES.map(phase => ({
    phase: phase.phase,
    name: phase.name,
    count: clients.filter(c => c.journeyState.currentPhase === phase.phase).length,
  }));

  const selectedClientData = clients.find(c => c.clientId === selectedClient);

  return (
    <div className="p-6 space-y-6">
      {/* Demo mode banner */}
      {isDemoMode && <DemoBanner onExit={() => setIsDemoMode(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">First Client Journeys</h1>
          <p className="text-muted-foreground">
            Monitor soft-launch client progress and identify intervention points
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/founder/dashboard/client-stories')}>
            <BookOpen className="h-4 w-4 mr-2" />
            Client Stories
          </Button>
          <Button variant="outline" onClick={() => router.push('/founder/dashboard/alignment')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Alignment
          </Button>
          <Button variant="outline" onClick={tour.startTour}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Operations Tour
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalClients}</p>
                <p className="text-xs text-muted-foreground">Soft Launch Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{avgProgress}%</p>
                <p className="text-xs text-muted-foreground">Avg Journey Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{avgActivationScore}</p>
                <p className="text-xs text-muted-foreground">Avg Activation Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={clientsNeedingAttention > 0 ? 'border-orange-500/50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-8 w-8 ${clientsNeedingAttention > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-2xl font-bold">{clientsNeedingAttention}</p>
                <p className="text-xs text-muted-foreground">Need Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Journey Phase Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {phaseDistribution.map((item) => (
              <div key={item.phase} className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(item.count / totalClients) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Client list and detail view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client list */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-medium">Clients</h3>
          {clients.map((client) => (
            <Card
              key={client.clientId}
              className={`cursor-pointer transition-colors ${
                selectedClient === client.clientId
                  ? 'ring-2 ring-primary'
                  : 'hover:bg-muted/50'
              } ${client.needsAttention ? 'border-orange-500/50' : ''}`}
              onClick={() => setSelectedClient(client.clientId)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{client.clientName}</p>
                    <p className="text-xs text-muted-foreground">{client.industry}</p>
                  </div>
                  {client.needsAttention && (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                </div>
                <JourneyIndicator journeyState={client.journeyState} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Client detail */}
        <div className="lg:col-span-2">
          {selectedClientData ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedClientData.clientName}</CardTitle>
                    <CardDescription>
                      {selectedClientData.industry} • Last active {selectedClientData.lastActivity}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {selectedClientData.activationScore && (
                      <Badge variant="outline">
                        Activation: {selectedClientData.activationScore}
                      </Badge>
                    )}
                    {selectedClientData.successScore && (
                      <Badge variant="outline">
                        Success: {selectedClientData.successScore}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Attention alert */}
                {selectedClientData.needsAttention && selectedClientData.attentionReason && (
                  <CalloutHint
                    variant="action"
                    title="Needs Attention"
                    description={selectedClientData.attentionReason}
                    actionLabel="View Details"
                    onAction={() => {}}
                    dismissible={false}
                  />
                )}

                {/* Journey timeline */}
                <JourneyTimeline
                  journeyState={selectedClientData.journeyState}
                  showDetails={true}
                />

                {/* Next milestone info */}
                {selectedClientData.journeyState.nextMilestone && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Target className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Next: {getMilestoneDisplayName(selectedClientData.journeyState.nextMilestone)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Select a client to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Guided tour overlay */}
      {tour.isActive && (
        <GuidedTourStepper
          tour={FOUNDER_GUIDED_TOUR}
          currentStepIndex={tour.currentStepIndex}
          onNext={tour.nextStep}
          onBack={tour.prevStep}
          onSkip={tour.skipTour}
          onComplete={tour.completeTour}
        />
      )}
    </div>
  );
}
