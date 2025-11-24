'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Radar,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Info,
  BarChart3
} from 'lucide-react';
import { OpportunityRadar } from '@/components/opportunities/OpportunityRadar';
import { OpportunitySignalBreakdown } from '@/components/opportunities/OpportunitySignalBreakdown';
import { supabase } from '@/lib/supabase';
import type { OpportunityWindow, FounderOpportunityReport } from '@/lib/predictive';

export default function OpportunitiesDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [windows, setWindows] = useState<OpportunityWindow[]>([]);
  const [report, setReport] = useState<FounderOpportunityReport | null>(null);
  const [selectedWindow, setSelectedWindow] = useState<OpportunityWindow | null>(null);
  const [selectedSignals, setSelectedSignals] = useState<Array<{
    id: string;
    signalType: string;
    signalValue: number;
    signalLabel: string | null;
    sourceNodeId: string | null;
    weight: number;
  }>>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    fetchTenantAndOpportunities();
  }, []);

  const fetchTenantAndOpportunities = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user's tenant
      const { data: orgs } = await supabase
        .from('user_organizations')
        .select('org_id')
        .eq('user_id', session.user.id)
        .limit(1);

      if (orgs && orgs.length > 0) {
        const tid = orgs[0].org_id;
        setTenantId(tid);
        await fetchOpportunities(tid, session.access_token);
      }
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOpportunities = async (tid: string, token: string) => {
    const response = await fetch(`/api/opportunities/list?tenantId=${tid}&includeReport=true`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setWindows(data.windows || []);
      setReport(data.report || null);
    }
  };

  const handleGenerate = async () => {
    if (!tenantId) return;

    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/opportunities/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });

      if (response.ok) {
        await fetchOpportunities(tenantId, session.access_token);
      }
    } catch (error) {
      console.error('Failed to generate:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleViewDetails = async (windowId: string) => {
    const window = windows.find(w => w.id === windowId);
    if (!window) return;

    setSelectedWindow(window);

    // Fetch signals
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: signals } = await supabase
        .from('opportunity_signals')
        .select('*')
        .eq('opportunity_id', windowId)
        .order('weight', { ascending: false });

      setSelectedSignals((signals || []).map(s => ({
        id: s.id,
        signalType: s.signal_type,
        signalValue: s.signal_value,
        signalLabel: s.signal_label,
        sourceNodeId: s.source_node_id,
        weight: s.weight,
      })));
    } catch (error) {
      console.error('Failed to fetch signals:', error);
    }
  };

  const handleDismiss = async (windowId: string) => {
    try {
      const { error } = await supabase
        .from('opportunity_windows')
        .update({ status: 'dismissed' })
        .eq('id', windowId);

      if (!error) {
        setWindows(prev => prev.filter(w => w.id !== windowId));
      }
    } catch (error) {
      console.error('Failed to dismiss:', error);
    }
  };

  const handleAct = async (windowId: string) => {
    try {
      const { error } = await supabase
        .from('opportunity_windows')
        .update({ status: 'acted_upon' })
        .eq('id', windowId);

      if (!error) {
        setWindows(prev => prev.filter(w => w.id !== windowId));
      }
    } catch (error) {
      console.error('Failed to mark as acted:', error);
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
            <Radar className="h-8 w-8" />
            Predictive Opportunities
          </h1>
          <p className="text-muted-foreground mt-1">
            Truth-layer compliant opportunity detection
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
          Generate New
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="radar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="radar" className="flex items-center gap-2">
            <Radar className="h-4 w-4" />
            Opportunity Radar
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Insights
          </TabsTrigger>
          {selectedWindow && (
            <TabsTrigger value="details" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Signal Details
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="radar">
          <OpportunityRadar
            windows={windows}
            onViewDetails={handleViewDetails}
            onDismiss={handleDismiss}
            onAct={handleAct}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {report ? (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Active</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{report.totalOpportunities}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">7-Day</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{report.byWindow['7_day']}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">14-Day</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{report.byWindow['14_day']}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">30-Day</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{report.byWindow['30_day']}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Momentum Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Momentum Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {report.momentumInsights.length > 0 ? (
                    <ul className="space-y-2">
                      {report.momentumInsights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No momentum patterns detected
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* By Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">By Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(report.byCategory)
                      .filter(([, count]) => count > 0)
                      .map(([cat, count]) => (
                        <Badge key={cat} variant="outline">
                          {cat}: {count}
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Uncertainty Disclaimer */}
              <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <CardContent className="py-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <div className="font-medium mb-1">Important Disclaimer</div>
                      <p>{report.uncertaintyDisclaimer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No report data available
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {selectedWindow && (
          <TabsContent value="details">
            <OpportunitySignalBreakdown
              window={selectedWindow}
              signals={selectedSignals}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
