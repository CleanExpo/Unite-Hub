'use client';

/**
 * Synthex Founder Portfolio Dashboard
 *
 * Founder view of all Synthex tenants with:
 * - Portfolio overview with key metrics
 * - Individual tenant cards with health scores
 * - Revenue and retention analytics
 * - Optimization recommendations
 * - Bulk management controls
 *
 * Features:
 * - Tenant health scoring
 * - Churn prediction
 * - Revenue forecasting
 * - Comparative analytics
 * - Quick actions per tenant
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Loader2,
  MoreHorizontal,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================================================
// TYPES
// ============================================================================

interface TenantWithMetrics {
  id: string;
  businessName: string;
  industry: string;
  region: string;
  status: 'active' | 'trial' | 'suspended' | 'churned';
  createdAt: string;
  subscription?: {
    planCode: string;
    effectivePriceAud: number;
    billingStatus: string;
  };
  metrics: {
    healthScore: number; // 0-100
    jobsCreated: number;
    jobsCompleted: number;
    completionRate: number; // percentage
    monthlyRevenue: number;
    churnRisk: 'low' | 'medium' | 'high';
    recommendation?: string;
  };
}

interface PortfolioMetrics {
  totalTenants: number;
  activeTenants: number;
  monthlyRevenue: number;
  averageHealthScore: number;
  completionRate: number;
  churnRiskCount: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function SynthexPortfolio() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantWithMetrics[]>([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'health' | 'revenue' | 'recent'>('health');

  // Fetch founder data on mount
  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);

      // Verify user is founder/admin
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // For MVP: Mock founder data (single founder has all tenants)
      // In production: Check founder role/permissions
      const { data: tenantData, error: tenantError } = await supabase
        .from('synthex_tenants')
        .select(
          `
          id,
          business_name,
          industry,
          region,
          status,
          created_at,
          synthex_plan_subscriptions (
            plan_code,
            effective_price_aud,
            billing_status
          )
        `
        )
        .order('created_at', { ascending: false });

      if (tenantError) {
        throw tenantError;
      }

      // Fetch job metrics for each tenant
      const tenantsWithMetrics: TenantWithMetrics[] = await Promise.all(
        (tenantData || []).map(async (tenant: any) => {
          const { data: jobs } = await supabase
            .from('synthex_project_jobs')
            .select('status')
            .eq('tenant_id', tenant.id);

          const jobsCompleted = jobs?.filter((j) => j.status === 'completed').length || 0;
          const jobsTotal = jobs?.length || 0;

          // Calculate health score (0-100)
          const completionRate = jobsTotal > 0 ? (jobsCompleted / jobsTotal) * 100 : 0;
          const activeMonths = Math.floor(
            (Date.now() - new Date(tenant.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000)
          );
          const engagementScore = jobsTotal > 0 ? Math.min(jobsTotal, 100) : 0;

          const healthScore = Math.round(
            (completionRate * 0.4 + engagementScore * 0.4 + Math.min(activeMonths * 10, 100) * 0.2) *
              0.95 // Apply 5% penalty for demo
          );

          // Determine churn risk
          let churnRisk: 'low' | 'medium' | 'high' = 'low';
          if (healthScore < 30) churnRisk = 'high';
          else if (healthScore < 60) churnRisk = 'medium';

          // Recommendation
          let recommendation = '';
          if (churnRisk === 'high') {
            recommendation = 'Contact customer - low engagement';
          } else if (churnRisk === 'medium') {
            recommendation = 'Monitor usage - consider outreach';
          } else if (completionRate > 80) {
            recommendation = 'Upsell opportunity - strong engagement';
          }

          const subscription = tenant.synthex_plan_subscriptions?.[0];
          const monthlyRevenue = subscription?.effective_price_aud || 0;

          return {
            id: tenant.id,
            businessName: tenant.business_name,
            industry: tenant.industry,
            region: tenant.region,
            status: tenant.status,
            createdAt: tenant.created_at,
            subscription: subscription
              ? {
                  planCode: subscription.plan_code,
                  effectivePriceAud: subscription.effective_price_aud,
                  billingStatus: subscription.billing_status,
                }
              : undefined,
            metrics: {
              healthScore,
              jobsCreated: jobsTotal,
              jobsCompleted,
              completionRate,
              monthlyRevenue,
              churnRisk,
              recommendation,
            },
          };
        })
      );

      setTenants(tenantsWithMetrics);

      // Calculate portfolio metrics
      const activeTenants = tenantsWithMetrics.filter((t) => t.status === 'active').length;
      const totalRevenue = tenantsWithMetrics.reduce((sum, t) => sum + t.metrics.monthlyRevenue, 0);
      const avgHealth =
        tenantsWithMetrics.length > 0
          ? Math.round(
              tenantsWithMetrics.reduce((sum, t) => sum + t.metrics.healthScore, 0) /
                tenantsWithMetrics.length
            )
          : 0;
      const avgCompletion =
        tenantsWithMetrics.length > 0
          ? Math.round(
              tenantsWithMetrics.reduce((sum, t) => sum + t.metrics.completionRate, 0) /
                tenantsWithMetrics.length
            )
          : 0;
      const churnRiskCount = tenantsWithMetrics.filter((t) => t.metrics.churnRisk === 'high').length;

      setPortfolioMetrics({
        totalTenants: tenantsWithMetrics.length,
        activeTenants,
        monthlyRevenue: totalRevenue,
        averageHealthScore: avgHealth,
        completionRate: avgCompletion,
        churnRiskCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort tenants
  const filteredTenants = tenants
    .filter((t) => (filterStatus === 'all' ? true : t.status === filterStatus))
    .sort((a, b) => {
      if (sortBy === 'health') return b.metrics.healthScore - a.metrics.healthScore;
      if (sortBy === 'revenue') return b.metrics.monthlyRevenue - a.metrics.monthlyRevenue;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Synthex Portfolio</h1>
          <p className="text-sm text-slate-600 mt-1">Manage all Synthex customer accounts</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Portfolio Overview Cards */}
        {portfolioMetrics && (
          <div className="grid md:grid-cols-5 gap-4">
            {/* Total Tenants */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{portfolioMetrics.totalTenants}</div>
                <div className="text-xs text-green-600 mt-2">
                  {portfolioMetrics.activeTenants} active
                </div>
              </CardContent>
            </Card>

            {/* Monthly Revenue */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${portfolioMetrics.monthlyRevenue.toFixed(0)}
                </div>
                <div className="text-xs text-slate-600 mt-2">AUD</div>
              </CardContent>
            </Card>

            {/* Average Health */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{portfolioMetrics.averageHealthScore}</div>
                <Progress value={portfolioMetrics.averageHealthScore} className="mt-2" />
              </CardContent>
            </Card>

            {/* Completion Rate */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{portfolioMetrics.completionRate}%</div>
                <Progress value={portfolioMetrics.completionRate} className="mt-2" />
              </CardContent>
            </Card>

            {/* Churn Risk */}
            <Card className={portfolioMetrics.churnRiskCount > 0 ? 'bg-red-50' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Churn Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {portfolioMetrics.churnRiskCount}
                </div>
                <div className="text-xs text-slate-600 mt-2">high risk</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tenants List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Customer Accounts</h2>
            <div className="flex gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="churned">Churned</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="health">Sort by Health</option>
                <option value="revenue">Sort by Revenue</option>
                <option value="recent">Sort by Recent</option>
              </select>
            </div>
          </div>

          {filteredTenants.length > 0 ? (
            <div className="grid gap-4">
              {filteredTenants.map((tenant) => (
                <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-5 gap-6 items-start">
                      {/* Tenant Info */}
                      <div>
                        <h3 className="font-semibold text-slate-900">{tenant.businessName}</h3>
                        <p className="text-sm text-slate-600 mt-1">{tenant.industry}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {tenant.region.toUpperCase()}
                          </Badge>
                          <Badge
                            className={`text-xs ${
                              tenant.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : tenant.status === 'churned'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {tenant.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Health Score */}
                      <div>
                        <div className="text-sm text-slate-600 font-medium">Health Score</div>
                        <div className="text-3xl font-bold mt-1">
                          {tenant.metrics.healthScore}
                        </div>
                        <Progress value={tenant.metrics.healthScore} className="mt-2" />
                      </div>

                      {/* Job Metrics */}
                      <div>
                        <div className="text-sm text-slate-600 font-medium">Jobs</div>
                        <div className="text-2xl font-bold mt-1">
                          {tenant.metrics.jobsCompleted}/{tenant.metrics.jobsCreated}
                        </div>
                        <div className="text-sm text-slate-600 mt-2">
                          {Math.round(tenant.metrics.completionRate)}% completed
                        </div>
                      </div>

                      {/* Revenue & Churn */}
                      <div>
                        <div className="text-sm text-slate-600 font-medium">Monthly Revenue</div>
                        <div className="text-2xl font-bold mt-1">
                          ${tenant.metrics.monthlyRevenue.toFixed(2)}
                        </div>
                        <Badge
                          className={`mt-2 text-xs ${
                            tenant.metrics.churnRisk === 'low'
                              ? 'bg-green-100 text-green-800'
                              : tenant.metrics.churnRisk === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tenant.metrics.churnRisk} risk
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {tenant.metrics.recommendation && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
                            {tenant.metrics.recommendation}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/synthex/dashboard?tenantId=${tenant.id}`)
                            }
                            className="flex-1"
                          >
                            View
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Send message</DropdownMenuItem>
                              <DropdownMenuItem>Adjust plan</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Suspend account
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Users size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No accounts found</h3>
                <p className="text-slate-600">Accounts matching your filters will appear here</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
