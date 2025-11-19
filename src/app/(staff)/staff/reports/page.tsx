/**
 * Staff Reports Page - Phase 3 Step 9
 * UI for staff to view org-wide and per-project financial performance
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchFinancialSummary,
  fetchOrganizationPnL,
  fetchProjectFinancials,
  fetchAICostBreakdown,
  refreshReports,
} from '@/lib/services/reportsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function StaffReportsPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [pnl, setPnl] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [aiCosts, setAiCosts] = useState<any[]>([]);

  useEffect(() => {
    if (currentOrganization?.org_id) {
      loadReports();
    }
  }, [currentOrganization]);

  const loadReports = async () => {
    if (!currentOrganization?.org_id) return;
    setLoading(true);

    const [summaryRes, pnlRes, projectsRes, aiRes] = await Promise.all([
      fetchFinancialSummary(currentOrganization.org_id),
      fetchOrganizationPnL(currentOrganization.org_id, undefined, undefined, true),
      fetchProjectFinancials(currentOrganization.org_id),
      fetchAICostBreakdown(currentOrganization.org_id),
    ]);

    if (summaryRes.success) setSummary(summaryRes.data);
    if (pnlRes.success) setPnl(pnlRes.data);
    if (projectsRes.success) setProjects(projectsRes.data || []);
    if (aiRes.success) setAiCosts(aiRes.data || []);

    setLoading(false);
  };

  const handleRefresh = async () => {
    if (!currentOrganization?.org_id) return;
    await refreshReports(currentOrganization.org_id);
    await loadReports();
  };

  if (loading) return <div className="p-8">Loading reports...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <Button onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="pnl">P&L</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="ai">AI Costs</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${summary?.totalRevenue?.toFixed(2) || '0.00'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${summary?.grossProfit?.toFixed(2) || '0.00'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.profitMargin?.toFixed(1) || '0.0'}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${summary?.outstandingBalance?.toFixed(2) || '0.00'}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pnl">
          {pnl && (
            <Card>
              <CardHeader>
                <CardTitle>Profit & Loss Statement</CardTitle>
                <CardDescription>{pnl.periodLabel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Revenue</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Billable Time</span>
                      <span>${pnl.revenue?.billableTime?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total Revenue</span>
                      <span>${pnl.revenue?.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Costs</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Labor</span>
                      <span>${pnl.costs?.labor?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Costs</span>
                      <span>${pnl.costs?.aiCosts?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total Costs</span>
                      <span>${pnl.costs?.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Net Profit</span>
                    <span className={pnl.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${pnl.netProfit?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="projects">
          <div className="space-y-4">
            {projects.map((project: any) => (
              <Card key={project.projectId}>
                <CardHeader>
                  <CardTitle>{project.projectName}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 md:grid-cols-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                    <div className="font-semibold">${project.totalRevenue?.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Profit</div>
                    <div className="font-semibold">${project.grossProfit?.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Margin</div>
                    <div className="font-semibold">{project.profitMarginPercent?.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Hours</div>
                    <div className="font-semibold">{project.billableHours?.toFixed(1)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="space-y-4">
            {aiCosts.map((cost: any, idx: number) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle>{cost.provider} - {cost.modelName}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 md:grid-cols-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Requests</div>
                    <div className="font-semibold">{cost.totalRequests}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Input Tokens</div>
                    <div className="font-semibold">{cost.totalInputTokens?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Output Tokens</div>
                    <div className="font-semibold">{cost.totalOutputTokens?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Cost</div>
                    <div className="font-semibold">${cost.totalCost?.toFixed(4)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
