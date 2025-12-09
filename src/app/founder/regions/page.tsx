'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RegionHealthPanel } from '@/components/globalScaling';
import {
  Globe2,
  AlertTriangle,
  TrendingUp,
  Shield
} from 'lucide-react';
import type {
  RegionHealthSummary,
  GlobalRiskAssessment
} from '@/lib/globalScaling';

export default function RegionsDashboardPage() {
  const router = useRouter();
  const { session } = useAuth();

  const [regions, setRegions] = useState<RegionHealthSummary[]>([]);
  const [globalRisk, setGlobalRisk] = useState<GlobalRiskAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session?.access_token) {
return;
}

    setIsLoading(true);
    try {
      const response = await fetch(
        '/api/regions/health?includeRisk=true',
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRegions(data.regions || []);
        setGlobalRisk(data.globalRisk);
      }
    } catch (error) {
      console.error('Failed to fetch region data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSelectRegion = (regionId: string) => {
    router.push(`/founder/regions/${regionId}`);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading region data...</div>
      </div>
    );
  }

  const frozenCount = regions.filter(r => r.scalingMode === 'frozen').length;
  const criticalCount = regions.filter(r => r.capacityScore < 30).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Globe2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Region Scaling</h1>
          <p className="text-muted-foreground">
            Monitor and manage global region health and scaling
          </p>
        </div>
      </div>

      {/* Global Risk Assessment */}
      {globalRisk && (
        <Card className={globalRisk.riskLevel === 'critical' ? 'border-red-500' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Global Risk Assessment
              </div>
              <Badge className={`${getRiskColor(globalRisk.riskLevel)} text-white`}>
                {globalRisk.riskLevel.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-2xl font-bold">{globalRisk.overallRisk}</div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{regions.length}</div>
                <p className="text-sm text-muted-foreground">Total Regions</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">{frozenCount}</div>
                <p className="text-sm text-muted-foreground">Frozen</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-500">{globalRisk.conflicts.length}</div>
                <p className="text-sm text-muted-foreground">Conflicts</p>
              </div>
            </div>

            {/* Recommendations */}
            {globalRisk.recommendations.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {globalRisk.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {(frozenCount > 0 || criticalCount > 0) && (
        <Card className="border-amber-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              <div>
                {frozenCount > 0 && (
                  <p>{frozenCount} region(s) are frozen and not accepting jobs</p>
                )}
                {criticalCount > 0 && (
                  <p>{criticalCount} region(s) have critical capacity</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Region Health Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Region Health</h2>
        <RegionHealthPanel
          regions={regions}
          onSelectRegion={handleSelectRegion}
        />
      </div>
    </div>
  );
}
