"use client";

/**
 * GEO Settings Panel
 * Phase 7 Week 19: GEO Onboarding UI
 *
 * Post-onboarding editing interface for GEO configuration.
 * Allows users to update radius, re-run suburb discovery, trigger audits.
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  DollarSign,
  Download,
  Loader2,
  MapPin,
  Play,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function GeoSettingsPage() {
  const { user, currentOrganization } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [saving, setIsSaving] = React.useState(false);
  const [clientId, setClientId] = React.useState<string | null>(null);
  const [currentRadius, setCurrentRadius] = React.useState(10);
  const [newRadius, setNewRadius] = React.useState(10);
  const [tier, setTier] = React.useState("Pro");
  const [domain, setDomain] = React.useState("");

  React.useEffect(() => {
    fetchGeoConfig();
  }, [currentOrganization]);

  const fetchGeoConfig = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("seo_client_profiles")
        .select("client_id, domain, subscription_tier, geo_radius_km")
        .eq("organization_id", currentOrganization.org_id)
        .single() as { data: { client_id: string; domain: string; subscription_tier: string; geo_radius_km: number | null } | null; error: unknown };

      if (data) {
        setClientId(data.client_id);
        setDomain(data.domain);
        setTier(data.subscription_tier);
        setCurrentRadius(data.geo_radius_km || 10);
        setNewRadius(data.geo_radius_km || 10);
      }
    } catch (error) {
      console.error("Failed to fetch GEO config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRadius = async () => {
    if (!clientId) return;

    setIsSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Not authenticated. Please log in again.");
        return;
      }

      const response = await fetch("/api/client/geo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          geo_radius: newRadius,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update GEO radius");
      }

      const data = await response.json();
      console.log("GEO radius updated:", data);

      setCurrentRadius(newRadius);
      alert("GEO radius updated successfully!");
    } catch (error) {
      console.error("Failed to update GEO radius:", error);
      alert("Failed to update radius. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerAudit = async () => {
    if (!clientId) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Not authenticated. Please log in again.");
        return;
      }

      const response = await fetch("/api/autonomy/queue", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          task: "geo",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to queue GEO audit");
      }

      const data = await response.json();
      alert(`GEO audit queued successfully! Queue ID: ${data.queueId}`);
    } catch (error) {
      console.error("Failed to trigger GEO audit:", error);
      alert("Failed to trigger audit. Please try again.");
    }
  };

  const getCostMultiplier = (radius: number): number => {
    const multipliers: Record<number, number> = {
      3: 1.0,
      5: 1.1,
      10: 1.25,
      15: 1.4,
      20: 1.5,
      25: 1.7,
      50: 2.0,
    };
    return multipliers[radius] || 1.0;
  };

  const tierLimits: Record<string, number[]> = {
    Free: [3, 5],
    Starter: [3, 5, 10],
    Pro: [3, 5, 10, 15, 20],
    Enterprise: [3, 5, 10, 15, 20, 25, 50],
  };

  const allowedRadii = tierLimits[tier] || [3, 5];
  const maxRadius = Math.max(...allowedRadii);
  const costMultiplier = getCostMultiplier(newRadius);
  const hasChanges = newRadius !== currentRadius;

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GEO Targeting Settings</h1>
          <p className="text-muted-foreground">
            Manage your local SEO service area and suburb targeting
          </p>
        </div>

        {/* Current Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current GEO Configuration</CardTitle>
                <CardDescription>Domain: {domain}</CardDescription>
              </div>
              <Badge variant="outline">{tier} Tier</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-primary/10">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Service Radius</p>
                      <p className="text-2xl font-bold">{currentRadius} km</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-950">
                      <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cost Multiplier</p>
                      <p className="text-2xl font-bold">
                        {getCostMultiplier(currentRadius).toFixed(2)}x
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-950">
                      <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Cost</p>
                      <p className="text-2xl font-bold">
                        ${(getCostMultiplier(currentRadius) * 15).toFixed(0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Update Radius */}
        <Card>
          <CardHeader>
            <CardTitle>Update Service Radius</CardTitle>
            <CardDescription>
              Adjust your service area coverage (changes will trigger re-discovery)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>New Service Radius (km)</Label>
                <Badge variant="outline" className="text-lg font-bold">
                  {newRadius} km
                </Badge>
              </div>
              <Slider
                value={[newRadius]}
                onValueChange={(values: number[]) => setNewRadius(values[0])}
                min={3}
                max={maxRadius}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>3 km</span>
                <span>{maxRadius} km (max for {tier})</span>
              </div>
            </div>

            {hasChanges && (
              <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        Radius Change Detected
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        Changing from {currentRadius} km to {newRadius} km will affect your cost
                        multiplier ({getCostMultiplier(currentRadius).toFixed(2)}x →{" "}
                        {costMultiplier.toFixed(2)}x) and may require suburb re-discovery.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setNewRadius(currentRadius)}
                disabled={!hasChanges}
              >
                Reset
              </Button>
              <Button onClick={handleUpdateRadius} disabled={!hasChanges || saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>GEO Actions</CardTitle>
            <CardDescription>
              Manage your GEO targeting and generate reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Button variant="outline" onClick={handleTriggerAudit} className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Trigger GEO Audit
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <RefreshCw className="mr-2 h-4 w-4" />
                Re-discover Suburbs
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <Download className="mr-2 h-4 w-4" />
                Download Suburb CSV
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <MapPin className="mr-2 h-4 w-4" />
                View GEO Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
