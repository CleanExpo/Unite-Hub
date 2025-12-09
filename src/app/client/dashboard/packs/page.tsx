'use client';

/**
 * Client Packs Dashboard
 * Phase 54: View and manage strategy and execution packs
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Calendar, FileText, TrendingUp } from 'lucide-react';
import { StrategyPackCard } from '@/ui/components/StrategyPackCard';
import { ExecutionPackCard } from '@/ui/components/ExecutionPackCard';

interface Pack {
  id: string;
  title: string;
  pack_type: string;
  status: string;
  period_start?: string;
  period_end?: string;
  generated_at?: string;
  approved_at?: string;
  deliverables: any[];
}

export default function ClientPacksPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [strategyPacks, setStrategyPacks] = useState<Pack[]>([]);
  const [executionPacks, setExecutionPacks] = useState<Pack[]>([]);
  const [selectedTab, setSelectedTab] = useState('strategy');

  useEffect(() => {
    if (currentOrganization?.org_id) {
      fetchPacks();
    }
  }, [currentOrganization]);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/production/packs?organizationId=${currentOrganization?.org_id}`
      );
      const data = await response.json();

      if (data.packs) {
        setStrategyPacks(data.packs.filter((p: Pack) => p.pack_type === 'monthly_strategy'));
        setExecutionPacks(data.packs.filter((p: Pack) => p.pack_type === 'weekly_execution'));
      }
    } catch (err) {
      console.error('Failed to fetch packs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPeriod = (start?: string, end?: string) => {
    if (!start) {
return 'No period set';
}
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;

    if (endDate) {
      return `${startDate.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return startDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
  };

  const handleViewPack = (packId: string) => {
    // Navigate to pack detail view
    window.location.href = `/client/dashboard/packs/${packId}`;
  };

  const handleApprovePack = async (packId: string) => {
    try {
      await fetch(`/api/production/packs/${packId}/approve`, {
        method: 'POST',
      });
      fetchPacks();
    } catch (err) {
      console.error('Failed to approve pack:', err);
    }
  };

  const handleDownloadPack = (packId: string) => {
    window.open(`/api/production/packs/${packId}/download`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading packs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Packs</h1>
          <p className="text-muted-foreground">
            Your marketing strategy and execution deliverables
          </p>
        </div>
        <Badge variant="outline">
          {strategyPacks.length + executionPacks.length} total packs
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Strategy Packs</span>
            </div>
            <div className="text-2xl font-bold mt-1">{strategyPacks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Execution Packs</span>
            </div>
            <div className="text-2xl font-bold mt-1">{executionPacks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Pending Review</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {[...strategyPacks, ...executionPacks].filter(p => p.status === 'pending_review').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Delivered</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {[...strategyPacks, ...executionPacks].filter(p => p.status === 'delivered').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="strategy">
            Monthly Strategy ({strategyPacks.length})
          </TabsTrigger>
          <TabsTrigger value="execution">
            Weekly Execution ({executionPacks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="strategy" className="mt-6">
          {strategyPacks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  No strategy packs yet. Your first monthly strategy will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {strategyPacks.map((pack) => (
                <StrategyPackCard
                  key={pack.id}
                  id={pack.id}
                  title={pack.title}
                  period={formatPeriod(pack.period_start, pack.period_end)}
                  status={pack.status as any}
                  deliverables={pack.deliverables || []}
                  generatedAt={pack.generated_at}
                  approvedAt={pack.approved_at}
                  onView={() => handleViewPack(pack.id)}
                  onApprove={() => handleApprovePack(pack.id)}
                  onDownload={() => handleDownloadPack(pack.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="execution" className="mt-6">
          {executionPacks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  No execution packs yet. Your weekly content will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {executionPacks.map((pack) => (
                <ExecutionPackCard
                  key={pack.id}
                  id={pack.id}
                  title={pack.title}
                  weekRange={formatPeriod(pack.period_start, pack.period_end)}
                  status={pack.status as any}
                  deliverables={pack.deliverables || []}
                  onView={() => handleViewPack(pack.id)}
                  onDownload={() => handleDownloadPack(pack.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer note */}
      <div className="bg-muted/30 border rounded-lg p-4 text-center text-sm text-muted-foreground">
        All content is AI-generated and marked as draft until you approve it.
        Review carefully before publishing.
      </div>
    </div>
  );
}
