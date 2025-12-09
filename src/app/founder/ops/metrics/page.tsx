'use client';

/**
 * Founder Metrics Tab
 * Phase D02: Founder Ops Console
 *
 * Overview of business health metrics and Synthex performance.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Users,
  Mail,
  Zap,
  Loader2,
} from 'lucide-react';

interface HealthDomain {
  domain: string;
  health: number;
  trend: 'improving' | 'stable' | 'declining';
  riskCount: number;
  opportunityCount: number;
}

interface MetricsSummary {
  avgHealth: number;
  domainCount: number;
  criticalCount: number;
  warningCount: number;
  healthyCount: number;
  domains: HealthDomain[];
}

export default function FounderMetricsPage() {
  const { currentOrganization } = useAuth();
  const tenantId = currentOrganization?.org_id;

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [profile, setProfile] = useState<{ company_name: string; company_stage: string } | null>(null);

  useEffect(() => {
    if (tenantId) {
      fetchMetrics();
    }
  }, [tenantId]);

  const fetchMetrics = async () => {
    if (!tenantId) {
return;
}

    try {
      setLoading(true);

      // Fetch profile for context
      const profileRes = await fetch(`/api/founder/twin/profile?tenantId=${tenantId}`);
      const profileData = await profileRes.json();
      setProfile(profileData.profile);

      // For now, create mock metrics based on profile
      // In production, this would come from cognitive twin service
      const mockDomains: HealthDomain[] = [
        { domain: 'marketing', health: 75, trend: 'improving', riskCount: 1, opportunityCount: 3 },
        { domain: 'sales', health: 68, trend: 'stable', riskCount: 2, opportunityCount: 2 },
        { domain: 'product', health: 82, trend: 'improving', riskCount: 0, opportunityCount: 4 },
        { domain: 'operations', health: 55, trend: 'declining', riskCount: 3, opportunityCount: 1 },
        { domain: 'finance', health: 70, trend: 'stable', riskCount: 1, opportunityCount: 2 },
        { domain: 'team', health: 78, trend: 'improving', riskCount: 0, opportunityCount: 2 },
      ];

      const avgHealth = mockDomains.reduce((sum, d) => sum + d.health, 0) / mockDomains.length;
      const criticalCount = mockDomains.filter((d) => d.health < 40).length;
      const warningCount = mockDomains.filter((d) => d.health >= 40 && d.health < 70).length;
      const healthyCount = mockDomains.filter((d) => d.health >= 70).length;

      setMetrics({
        avgHealth,
        domainCount: mockDomains.length,
        criticalCount,
        warningCount,
        healthyCount,
        domains: mockDomains,
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 70) {
return 'text-green-500';
}
    if (health >= 40) {
return 'text-yellow-500';
}
    return 'text-destructive';
  };

  const getHealthBg = (health: number) => {
    if (health >= 70) {
return 'bg-green-500';
}
    if (health >= 40) {
return 'bg-yellow-500';
}
    return 'bg-destructive';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!tenantId) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Please select an organization to continue.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Health</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(metrics?.avgHealth || 0)}`}>
              {(metrics?.avgHealth || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across {metrics?.domainCount || 0} domains
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{metrics?.healthyCount || 0}</div>
            <p className="text-xs text-muted-foreground">Performing well</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{metrics?.warningCount || 0}</div>
            <p className="text-xs text-muted-foreground">Monitor closely</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics?.criticalCount || 0}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Domain Health Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Health</CardTitle>
          <CardDescription>
            Health scores across key business domains
            {profile?.company_name && ` for ${profile.company_name}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metrics?.domains.map((domain) => (
              <div key={domain.domain} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{domain.domain}</span>
                    {getTrendIcon(domain.trend)}
                  </div>
                  <span className={`text-lg font-bold ${getHealthColor(domain.health)}`}>
                    {domain.health}%
                  </span>
                </div>

                <Progress
                  value={domain.health}
                  className="h-2"
                />

                <div className="flex items-center gap-4 text-sm">
                  {domain.riskCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {domain.riskCount} risk{domain.riskCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {domain.opportunityCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {domain.opportunityCount} opportunit{domain.opportunityCount > 1 ? 'ies' : 'y'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Team health metrics will appear here when connected to HR systems.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" />
              Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Campaign performance will sync from Synthex.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" />
              Automation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automation efficiency metrics will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
