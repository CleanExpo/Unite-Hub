'use client';

// Force dynamic
export const dynamic = 'force-dynamic';

/**
 * Staff Reports Page - Phase 3 Step 9
 * UI for staff to view org-wide and per-project financial performance
 */

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
import { PageContainer, Section } from '@/ui/layout/AppGrid';

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

  if (loading) return (
    <div className="p-8 text-white/40 font-mono text-sm">Loading reports...</div>
  );

  return (
    <PageContainer>
      <Section>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white font-mono">Financial Reports</h1>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm hover:bg-[#00F5FF]/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </Section>

      <Section>
        <Tabs defaultValue="summary">
        <TabsList className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-1">
          <TabsTrigger value="summary" className="font-mono text-sm rounded-sm data-[state=active]:bg-white/[0.04] data-[state=active]:text-[#00F5FF]">Summary</TabsTrigger>
          <TabsTrigger value="pnl" className="font-mono text-sm rounded-sm data-[state=active]:bg-white/[0.04] data-[state=active]:text-[#00F5FF]">P&amp;L</TabsTrigger>
          <TabsTrigger value="projects" className="font-mono text-sm rounded-sm data-[state=active]:bg-white/[0.04] data-[state=active]:text-[#00F5FF]">Projects</TabsTrigger>
          <TabsTrigger value="ai" className="font-mono text-sm rounded-sm data-[state=active]:bg-white/[0.04] data-[state=active]:text-[#00F5FF]">AI Costs</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <p className="text-sm text-white/40 font-mono mb-1">Total Revenue</p>
              <div className="text-2xl font-bold text-white font-mono">${summary?.totalRevenue?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <p className="text-sm text-white/40 font-mono mb-1">Gross Profit</p>
              <div className="text-2xl font-bold text-white font-mono">${summary?.grossProfit?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <p className="text-sm text-white/40 font-mono mb-1">Profit Margin</p>
              <div className="text-2xl font-bold text-white font-mono">{summary?.profitMargin?.toFixed(1) || '0.0'}%</div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <p className="text-sm text-white/40 font-mono mb-1">Outstanding</p>
              <div className="text-2xl font-bold text-white font-mono">${summary?.outstandingBalance?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pnl">
          {pnl && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6 space-y-4">
              <div>
                <h3 className="text-white font-mono font-semibold mb-0.5">Profit &amp; Loss Statement</h3>
                <p className="text-sm text-white/40 font-mono">{pnl.periodLabel}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-white font-mono text-sm">Revenue</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm font-mono">
                    <span className="text-white/60">Billable Time</span>
                    <span className="text-white">${pnl.revenue?.billableTime?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between font-bold font-mono text-sm">
                    <span className="text-white/80">Total Revenue</span>
                    <span className="text-white">${pnl.revenue?.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-white font-mono text-sm">Costs</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm font-mono">
                    <span className="text-white/60">Labour</span>
                    <span className="text-white">${pnl.costs?.labor?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm font-mono">
                    <span className="text-white/60">AI Costs</span>
                    <span className="text-white">${pnl.costs?.aiCosts?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between font-bold font-mono text-sm">
                    <span className="text-white/80">Total Costs</span>
                    <span className="text-white">${pnl.costs?.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/[0.06] pt-4">
                <div className="flex justify-between text-xl font-bold font-mono">
                  <span className="text-white">Net Profit</span>
                  <span className={pnl.netProfit >= 0 ? 'text-[#00FF88]' : 'text-[#FF4444]'}>
                    ${pnl.netProfit?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects">
          <div className="space-y-4">
            {projects.map((project: any) => (
              <div key={project.projectId} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-5">
                <h3 className="text-white font-mono font-semibold mb-3">{project.projectName}</h3>
                <div className="grid gap-2 md:grid-cols-4">
                  <div>
                    <div className="text-sm text-white/40 font-mono">Revenue</div>
                    <div className="font-semibold text-white font-mono">${project.totalRevenue?.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-white/40 font-mono">Profit</div>
                    <div className="font-semibold text-white font-mono">${project.grossProfit?.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-white/40 font-mono">Margin</div>
                    <div className="font-semibold text-white font-mono">{project.profitMarginPercent?.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-white/40 font-mono">Hours</div>
                    <div className="font-semibold text-white font-mono">{project.billableHours?.toFixed(1)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="space-y-4">
            {aiCosts.map((cost: any, idx: number) => (
              <div key={idx} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-5">
                <h3 className="text-white font-mono font-semibold mb-3">{cost.provider} — {cost.modelName}</h3>
                <div className="grid gap-2 md:grid-cols-4">
                  <div>
                    <div className="text-sm text-white/40 font-mono">Requests</div>
                    <div className="font-semibold text-white font-mono">{cost.totalRequests}</div>
                  </div>
                  <div>
                    <div className="text-sm text-white/40 font-mono">Input Tokens</div>
                    <div className="font-semibold text-white font-mono">{cost.totalInputTokens?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-white/40 font-mono">Output Tokens</div>
                    <div className="font-semibold text-white font-mono">{cost.totalOutputTokens?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-white/40 font-mono">Total Cost</div>
                    <div className="font-semibold text-white font-mono">${cost.totalCost?.toFixed(4)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        </Tabs>
      </Section>
    </PageContainer>
  );
}
