'use client';

/**
 * Synthex Admin Overview
 * Global admin dashboard with cross-tenant KPIs
 * Phase B25: Global Admin & Cross-Tenant Reporting
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Building2,
  Crown,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GlobalKpis {
  total_tenants: number;
  active_tenants: number;
  trial_tenants: number;
  churned_tenants: number;
  total_revenue_mrr: number;
  total_team_members: number;
  total_contacts: number;
  total_campaigns: number;
  avg_health_score: number;
  tenants_by_plan: {
    FREE: number;
    PRO: number;
    AGENCY: number;
  };
  tenants_by_status: {
    active: number;
    trial: number;
    suspended: number;
    churned: number;
  };
}

interface TenantSummary {
  tenant_id: string;
  business_name: string;
  industry: string;
  tenant_status: string;
  subscription_status: string | null;
  plan_code: string | null;
  plan_name: string | null;
  monthly_price_cents: number | null;
  team_member_count: number;
  current_contacts: number;
  current_emails_sent: number;
  contacts_added_30d: number;
  campaigns_created_30d: number;
  tenant_created_at: string;
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<GlobalKpis | null>(null);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch KPIs
      const kpisRes = await fetch('/api/synthex/admin/overview');
      if (!kpisRes.ok) {
        const errorData = await kpisRes.json();
        throw new Error(errorData.error || 'Failed to fetch KPIs');
      }
      const kpisData = await kpisRes.json();
      setKpis(kpisData.data);

      // Fetch tenant list
      const tenantsRes = await fetch('/api/synthex/admin/tenants?limit=10');
      if (!tenantsRes.ok) {
        const errorData = await tenantsRes.json();
        throw new Error(errorData.error || 'Failed to fetch tenants');
      }
      const tenantsData = await tenantsRes.json();
      setTenants(tenantsData.data);

    } catch (err) {
      console.error('[Admin Overview] Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(cents: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trial: 'secondary',
      suspended: 'destructive',
      churned: 'outline',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  }

  function getPlanBadge(planCode: string | null) {
    if (!planCode) return <Badge variant="outline">None</Badge>;

    const colors: Record<string, string> = {
      FREE: 'bg-gray-600',
      PRO: 'bg-blue-600',
      AGENCY: 'bg-purple-600',
    };

    return (
      <Badge className={colors[planCode] || 'bg-gray-600'}>
        {planCode}
      </Badge>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Admin Overview</h1>
          <p className="text-gray-400 mt-2">Global tenant monitoring and KPIs</p>
        </div>

        <Card className="bg-red-900/20 border-red-800">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Access Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">{error}</p>
            {error.includes('Forbidden') && (
              <p className="text-sm text-gray-400">
                This page requires global admin access. Contact your administrator if you believe this is an error.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!kpis) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            Admin Overview
          </h1>
          <p className="text-gray-400 mt-2">Global tenant monitoring and KPIs</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tenants */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Tenants
            </CardTitle>
            <Building2 className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-100">
              {kpis.total_tenants}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {kpis.active_tenants} active • {kpis.trial_tenants} trial
            </p>
          </CardContent>
        </Card>

        {/* MRR */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Monthly Revenue
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-100">
              {formatCurrency(kpis.total_revenue_mrr)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              MRR from active subscriptions
            </p>
          </CardContent>
        </Card>

        {/* Total Contacts */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Contacts
            </CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-100">
              {kpis.total_contacts.toLocaleString()}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Across all tenants
            </p>
          </CardContent>
        </Card>

        {/* Health Score */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Avg Health Score
            </CardTitle>
            <Activity className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-100">
              {kpis.avg_health_score}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Out of 100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plans */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Plans Distribution</CardTitle>
            <CardDescription>Tenants by subscription plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-600"></div>
                <span className="text-gray-300">Free</span>
              </div>
              <span className="text-gray-100 font-semibold">{kpis.tenants_by_plan.FREE}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                <span className="text-gray-300">Pro</span>
              </div>
              <span className="text-gray-100 font-semibold">{kpis.tenants_by_plan.PRO}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-600"></div>
                <span className="text-gray-300">Agency</span>
              </div>
              <span className="text-gray-100 font-semibold">{kpis.tenants_by_plan.AGENCY}</span>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Status Distribution</CardTitle>
            <CardDescription>Tenants by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-600"></div>
                <span className="text-gray-300">Active</span>
              </div>
              <span className="text-gray-100 font-semibold">{kpis.tenants_by_status.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                <span className="text-gray-300">Trial</span>
              </div>
              <span className="text-gray-100 font-semibold">{kpis.tenants_by_status.trial}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-600"></div>
                <span className="text-gray-300">Suspended</span>
              </div>
              <span className="text-gray-100 font-semibold">{kpis.tenants_by_status.suspended}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-600"></div>
                <span className="text-gray-300">Churned</span>
              </div>
              <span className="text-gray-100 font-semibold">{kpis.tenants_by_status.churned}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tenants Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Recent Tenants</CardTitle>
          <CardDescription>Latest tenant accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400">Business</TableHead>
                <TableHead className="text-gray-400">Industry</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Plan</TableHead>
                <TableHead className="text-gray-400">Contacts</TableHead>
                <TableHead className="text-gray-400">Team</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.tenant_id} className="border-gray-700">
                  <TableCell className="text-gray-100 font-medium">
                    {tenant.business_name}
                  </TableCell>
                  <TableCell className="text-gray-300">{tenant.industry}</TableCell>
                  <TableCell>{getStatusBadge(tenant.tenant_status)}</TableCell>
                  <TableCell>{getPlanBadge(tenant.plan_code)}</TableCell>
                  <TableCell className="text-gray-300">
                    {tenant.current_contacts.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-gray-300">{tenant.team_member_count}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/synthex/admin/tenant/${tenant.tenant_id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
