'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TenantIndicator } from '@/components/tenancy';
import {
  Building2,
  Users,
  Contact,
  FileText,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import type { TenantContext, TenantStats } from '@/lib/tenancy';

interface PageProps {
  params: Promise<{ agencyId: string }>;
}

export default function AgencyDashboardPage({ params }: PageProps) {
  const { agencyId } = use(params);
  const { session } = useAuth();

  const [context, setContext] = useState<TenantContext | null>(null);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session?.access_token) return;

    setIsLoading(true);
    try {
      // Get tenant context
      const contextRes = await fetch('/api/agency/switch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId: agencyId }),
      });

      if (contextRes.ok) {
        const data = await contextRes.json();
        setContext(data.context);
      }

      // For now, use placeholder stats
      // In production, this would call a stats API
      setStats({
        totalUsers: 0,
        totalContacts: 0,
        activePlaybooks: 0,
        subAgencies: 0,
      });
    } catch (error) {
      console.error('Failed to fetch agency data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [agencyId, session?.access_token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading agency dashboard...</div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12 text-muted-foreground">
          Agency not found or access denied.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{context.tenantName}</h1>
            <TenantIndicator context={context} />
          </div>
        </div>
        {context.isOwner && (
          <Badge className="bg-purple-500">Owner Access</Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active users in this agency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Contact className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalContacts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total contacts managed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Playbooks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activePlaybooks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Autopilot playbooks running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sub-Agencies</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.subAgencies || 0}</div>
            <p className="text-xs text-muted-foreground">
              Franchise/white-label agencies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="/founder/autopilot"
              className="p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <FileText className="h-6 w-6 mb-2 text-primary" />
              <h3 className="font-medium">Autopilot</h3>
              <p className="text-sm text-muted-foreground">
                Manage weekly playbooks
              </p>
            </a>

            <a
              href="/founder/combat"
              className="p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <TrendingUp className="h-6 w-6 mb-2 text-primary" />
              <h3 className="font-medium">Creative Combat</h3>
              <p className="text-sm text-muted-foreground">
                A/B testing engine
              </p>
            </a>

            <a
              href="/founder/intel"
              className="p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <AlertTriangle className="h-6 w-6 mb-2 text-primary" />
              <h3 className="font-medium">Intel & Warnings</h3>
              <p className="text-sm text-muted-foreground">
                Early warning system
              </p>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Info */}
      {context.isManager && (
        <Card>
          <CardHeader>
            <CardTitle>Your Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">View Dashboard</Badge>
              <Badge variant="outline">Manage Contacts</Badge>
              <Badge variant="outline">Run Autopilot</Badge>
              {context.isOwner && (
                <>
                  <Badge variant="outline">Manage Users</Badge>
                  <Badge variant="outline">Agency Settings</Badge>
                  <Badge variant="outline">Billing</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
