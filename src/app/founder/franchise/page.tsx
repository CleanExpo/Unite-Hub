'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TierBadge, HierarchyTree } from '@/components/franchise';
import {
  Building2,
  Users,
  MapPin,
  TrendingUp,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import type {
  LicenseDetails,
  AgencyWithLicense,
  FranchiseRollup
} from '@/lib/franchise';

export default function FranchiseDashboardPage() {
  const router = useRouter();
  const { currentOrganization, session } = useAuth();
  const agencyId = currentOrganization?.org_id;

  const [tree, setTree] = useState<any>(null);
  const [license, setLicense] = useState<LicenseDetails | null>(null);
  const [children, setChildren] = useState<AgencyWithLicense[]>([]);
  const [rollup, setRollup] = useState<FranchiseRollup | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!agencyId || !session?.access_token) {
return;
}

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/franchise/agency-tree?agencyId=${agencyId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTree(data.tree);
        setLicense(data.license);
        setChildren(data.children || []);
        setRollup(data.rollup);
      }
    } catch (error) {
      console.error('Failed to fetch franchise data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [agencyId, session?.access_token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectChild = (childAgencyId: string) => {
    router.push(`/founder/franchise/${childAgencyId}`);
  };

  if (!agencyId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12 text-muted-foreground">
          Please select an agency to view franchise details.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading franchise data...</div>
      </div>
    );
  }

  const isExpiringSoon = license && new Date(license.expiresOn) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const isNearLimit = license && license.maxClients > 0 && license.currentClients >= license.maxClients * 0.9;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Franchise Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your agency hierarchy, regions, and licenses
          </p>
        </div>
      </div>

      {/* Warnings */}
      {(isExpiringSoon || isNearLimit) && (
        <Card className="border-warning-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-warning-500">
              <AlertTriangle className="h-5 w-5" />
              <div>
                {isExpiringSoon && (
                  <p>License expires on {license?.expiresOn}</p>
                )}
                {isNearLimit && (
                  <p>Approaching client limit ({license?.currentClients}/{license?.maxClients})</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* License Details */}
      {license && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">License Tier</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <TierBadge tierName={license.tierName} />
              <p className="text-xs text-muted-foreground mt-2">
                Expires: {new Date(license.expiresOn).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Region</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{license.regionName}</div>
              <p className="text-xs text-muted-foreground">
                Licensed territory
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {license.currentClients}
                {license.maxClients > 0 && (
                  <span className="text-sm text-muted-foreground">
                    /{license.maxClients}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {license.maxClients === -1 ? 'Unlimited' : 'Client limit'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {license.currentUsers}
                {license.maxUsers > 0 && (
                  <span className="text-sm text-muted-foreground">
                    /{license.maxUsers}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {license.maxUsers === -1 ? 'Unlimited' : 'User limit'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rollup Stats (if has children) */}
      {rollup && rollup.totalAgencies > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Network Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-2xl font-bold">{rollup.totalAgencies}</div>
                <p className="text-sm text-muted-foreground">Sub-agencies</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{rollup.totalClients}</div>
                <p className="text-sm text-muted-foreground">Total clients</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  ${(rollup.totalRevenue / 100).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Total revenue</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {rollup.avgHealth.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Avg health</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hierarchy Tree */}
      {tree && (
        <Card>
          <CardHeader>
            <CardTitle>Agency Hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            <HierarchyTree
              root={tree}
              children={children}
              onSelect={handleSelectChild}
            />
          </CardContent>
        </Card>
      )}

      {!license && (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No License Assigned</h3>
            <p className="text-muted-foreground">
              Contact your administrator to assign a region and license tier.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
