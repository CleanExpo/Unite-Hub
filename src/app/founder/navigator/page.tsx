'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Compass,
  RefreshCw,
  LayoutDashboard,
  List,
  AlertTriangle
} from 'lucide-react';
import { NavigatorOverview } from '@/components/navigator/NavigatorOverview';
import { NavigatorInsightPanel } from '@/components/navigator/NavigatorInsightPanel';
import { supabase } from '@/lib/supabase';
import type { NavigatorSnapshot, NavigatorInsight } from '@/lib/navigator';

export default function NavigatorPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [snapshot, setSnapshot] = useState<NavigatorSnapshot | null>(null);
  const [insights, setInsights] = useState<NavigatorInsight[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      // Get tenant
      const { data: orgs } = await supabase
        .from('user_organizations')
        .select('org_id')
        .eq('user_id', session.user.id)
        .limit(1);

      if (orgs && orgs.length > 0) {
        const tid = orgs[0].org_id;
        setTenantId(tid);

        // Fetch snapshot
        const response = await fetch(`/api/navigator/snapshot?tenantId=${tid}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setSnapshot(data.snapshot);
          setInsights(data.insights || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!tenantId) {
return;
}

    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const response = await fetch('/api/navigator/snapshot', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSnapshot(data.snapshot);
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Failed to generate:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Compass className="h-8 w-8" />
            AI Navigator
          </h1>
          <p className="text-muted-foreground mt-1">
            Executive copilot for strategic decision-making
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
          Generate Snapshot
        </Button>
      </div>

      {snapshot ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Insights ({insights.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <NavigatorOverview snapshot={snapshot} />
          </TabsContent>

          <TabsContent value="insights">
            <NavigatorInsightPanel insights={insights} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Compass className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Snapshot Available</h3>
            <p className="text-muted-foreground mb-4">
              Generate a snapshot to see your executive summary.
            </p>
            <Button onClick={handleGenerate} disabled={generating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              Generate First Snapshot
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <div className="font-medium mb-1">Advisory Only</div>
              <p>
                All insights are advisory suggestions based on available data.
                They do not constitute deterministic predictions. Always verify
                with domain expertise before acting on recommendations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
