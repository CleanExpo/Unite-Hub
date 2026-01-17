'use client';

/**
 * Founder Combat Dashboard
 * Phase 88: Creative Combat Engine for A/B testing
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Swords,
  RefreshCw,
  Play,
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { CombatRoundsTable } from '@/components/creativeCombat/CombatRoundsTable';
import { CombatResultCard } from '@/components/creativeCombat/CombatResultCard';
import { useAuth } from '@/contexts/AuthContext';

interface CombatStats {
  totalRounds: number;
  completed: number;
  running: number;
  pending: number;
  inconclusive: number;
}

interface IntegrationStats {
  winnersPromoted: number;
  losersRetired: number;
  evolutionsTriggered: number;
}

export default function FounderCombatPage() {
  const { currentOrganization, loading: authLoading } = useAuth();
  const router = useRouter();
  const workspaceId = currentOrganization?.org_id;

  const [stats, setStats] = useState<CombatStats | null>(null);
  const [integrationStats, setIntegrationStats] = useState<IntegrationStats | null>(null);
  const [rounds, setRounds] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningCycle, setIsRunningCycle] = useState(false);

  // Redirect to login if no workspace after auth loads
  useEffect(() => {
    if (!authLoading && !workspaceId) {
      router.push('/login');
    }
  }, [authLoading, workspaceId, router]);

  useEffect(() => {
    if (workspaceId) {
      loadDashboardData();
    }
  }, [workspaceId]);

  const loadDashboardData = async () => {
    if (!workspaceId) {
return;
}
    setIsLoading(true);
    try {
      const [statsRes, integrationsRes, roundsRes, resultsRes] = await Promise.all([
        fetch(`/api/combat/rounds?workspaceId=${workspaceId}&type=stats`),
        fetch(`/api/combat/results?workspaceId=${workspaceId}&type=integrations`),
        fetch(`/api/combat/rounds?workspaceId=${workspaceId}&limit=20`),
        fetch(`/api/combat/results?workspaceId=${workspaceId}&limit=10`),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }

      if (integrationsRes.ok) {
        const data = await integrationsRes.json();
        setIntegrationStats(data.data);
      }

      if (roundsRes.ok) {
        const data = await roundsRes.json();
        setRounds(data.data || []);
      }

      if (resultsRes.ok) {
        const data = await resultsRes.json();
        setResults(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runCombatCycle = async () => {
    if (!workspaceId) {
return;
}
    setIsRunningCycle(true);
    try {
      const res = await fetch('/api/combat/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run_cycle',
          workspaceId,
        }),
      });

      if (res.ok) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to run combat cycle:', error);
    } finally {
      setIsRunningCycle(false);
    }
  };

  const handleStartRound = async (roundId: string) => {
    try {
      await fetch('/api/combat/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          roundId,
        }),
      });
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to start round:', error);
    }
  };

  // Show loading while auth is being determined
  if (authLoading || !workspaceId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Swords className="h-6 w-6" />
            Creative Combat Engine
          </h1>
          <p className="text-muted-foreground">
            A/B intelligence layer for creative testing and optimization
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadDashboardData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button onClick={runCombatCycle} disabled={isRunningCycle}>
            <Play className="h-4 w-4 mr-2" />
            Run Combat Cycle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <Swords className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats?.totalRounds || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed</span>
              <CheckCircle className="h-4 w-4 text-success-500" />
            </div>
            <p className="text-2xl font-bold text-success-500">{stats?.completed || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Running</span>
              <Play className="h-4 w-4 text-info-500" />
            </div>
            <p className="text-2xl font-bold text-info-500">{stats?.running || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending</span>
              <Clock className="h-4 w-4 text-warning-500" />
            </div>
            <p className="text-2xl font-bold text-warning-500">{stats?.pending || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Inconclusive</span>
              <AlertTriangle className="h-4 w-4 text-text-tertiary" />
            </div>
            <p className="text-2xl font-bold text-text-tertiary">{stats?.inconclusive || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Stats */}
      {integrationStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Integration Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-success-500">{integrationStats.winnersPromoted}</Badge>
                <span className="text-sm text-muted-foreground">Winners Promoted</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{integrationStats.losersRetired}</Badge>
                <span className="text-sm text-muted-foreground">Losers Retired</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500">{integrationStats.evolutionsTriggered}</Badge>
                <span className="text-sm text-muted-foreground">Evolutions Triggered</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="rounds" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rounds" className="flex items-center gap-2">
            <Swords className="h-4 w-4" />
            Rounds
            {rounds.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {rounds.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Results
            {results.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {results.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rounds">
          <CombatRoundsTable rounds={rounds} onStartRound={handleStartRound} />
        </TabsContent>

        <TabsContent value="results">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map(result => (
              <CombatResultCard key={result.id} result={result} />
            ))}

            {results.length === 0 && (
              <Card className="col-span-2">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No combat results yet. Run a combat cycle to determine winners.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Info Banner */}
      <Card className="border-info-500/30 bg-info-500/5">
        <CardContent className="pt-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-info-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Phase 88:</strong> The Creative Combat Engine runs structured A/B
              matchups and uses Performance Reality adjustments to identify winners with
              statistical confidence. Winners are automatically promoted to orchestration
              pools and losers are retired from rotation.
            </p>
            <p className="mt-2">
              AI is NOT used to decide winners - only to explain results. All decisions
              are based on real, adjusted metrics with confidence thresholds.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
