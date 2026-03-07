"use client";

/**
 * GEO Settings Panel
 * Phase 7 Week 19: GEO Onboarding UI
 *
 * Post-onboarding editing interface for GEO configuration.
 * Allows users to update radius, re-run suburb discovery, trigger audits.
 */

import React from "react";
import { Slider } from "@/components/ui/slider";
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
        .single();

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
          <Loader2 className="h-12 w-12 animate-spin text-[#00F5FF]" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight text-white/90">GEO Targeting Settings</h1>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mt-1">
            Manage your local SEO service area and suburb targeting
          </p>
        </div>

        {/* Current Configuration */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-mono font-bold text-white/90">Current GEO Configuration</h3>
              <p className="text-[10px] font-mono text-white/30 mt-0.5">Domain: {domain}</p>
            </div>
            <span className="px-2 py-0.5 border border-[#00F5FF]/30 rounded-sm text-[10px] font-mono text-[#00F5FF]">
              {tier} Tier
            </span>
          </div>
          <div className="p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 border border-[#00F5FF]/20 bg-[#00F5FF]/[0.06] rounded-sm">
                    <MapPin className="h-6 w-6 text-[#00F5FF]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Service Radius</p>
                    <p className="text-2xl font-bold font-mono text-white/90">{currentRadius} km</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 border border-[#00FF88]/20 bg-[#00FF88]/[0.06] rounded-sm">
                    <DollarSign className="h-6 w-6 text-[#00FF88]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Cost Multiplier</p>
                    <p className="text-2xl font-bold font-mono text-white/90">
                      {getCostMultiplier(currentRadius).toFixed(2)}x
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 border border-[#FFB800]/20 bg-[#FFB800]/[0.06] rounded-sm">
                    <TrendingUp className="h-6 w-6 text-[#FFB800]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Monthly Cost</p>
                    <p className="text-2xl font-bold font-mono text-white/90">
                      ${(getCostMultiplier(currentRadius) * 15).toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Update Radius */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-mono font-bold text-white/90">Update Service Radius</h3>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mt-0.5">
              Adjust your service area coverage (changes will trigger re-discovery)
            </p>
          </div>
          <div className="p-4 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">New Service Radius (km)</label>
                <span className="px-2 py-0.5 border border-[#00F5FF]/30 rounded-sm text-sm font-mono font-bold text-[#00F5FF]">
                  {newRadius} km
                </span>
              </div>
              <Slider
                value={[newRadius]}
                onValueChange={(values) => setNewRadius(values[0])}
                min={3}
                max={maxRadius}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] font-mono text-white/20">
                <span>3 km</span>
                <span>{maxRadius} km (max for {tier})</span>
              </div>
            </div>

            {hasChanges && (
              <div className="border border-[#FFB800]/20 bg-[#FFB800]/[0.04] rounded-sm p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-[#FFB800] mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-mono font-bold text-[#FFB800]">
                      Radius Change Detected
                    </p>
                    <p className="text-xs font-mono text-[#FFB800]/70">
                      Changing from {currentRadius} km to {newRadius} km will affect your cost
                      multiplier ({getCostMultiplier(currentRadius).toFixed(2)}x →{" "}
                      {costMultiplier.toFixed(2)}x) and may require suburb re-discovery.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setNewRadius(currentRadius)}
                disabled={!hasChanges}
                className="px-4 py-2 border border-white/[0.06] rounded-sm text-xs font-mono text-white/60 hover:text-white/90 hover:border-white/20 transition-colors disabled:opacity-50"
              >
                Reset
              </button>
              <button
                onClick={handleUpdateRadius}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#00F5FF]/10 border border-[#00F5FF]/30 rounded-sm text-xs font-mono text-[#00F5FF] hover:bg-[#00F5FF]/20 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-mono font-bold text-white/90">GEO Actions</h3>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mt-0.5">
              Manage your GEO targeting and generate reports
            </p>
          </div>
          <div className="p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <button
                onClick={handleTriggerAudit}
                className="flex items-center justify-center gap-2 py-2 border border-white/[0.06] rounded-sm text-xs font-mono text-white/60 hover:text-white/90 hover:border-white/20 transition-colors w-full"
              >
                <Play className="h-4 w-4" />
                Trigger GEO Audit
              </button>
              <button
                disabled
                className="flex items-center justify-center gap-2 py-2 border border-white/[0.06] rounded-sm text-xs font-mono text-white/30 disabled:opacity-50 w-full"
              >
                <RefreshCw className="h-4 w-4" />
                Re-discover Suburbs
              </button>
              <button
                disabled
                className="flex items-center justify-center gap-2 py-2 border border-white/[0.06] rounded-sm text-xs font-mono text-white/30 disabled:opacity-50 w-full"
              >
                <Download className="h-4 w-4" />
                Download Suburb CSV
              </button>
              <button
                disabled
                className="flex items-center justify-center gap-2 py-2 border border-white/[0.06] rounded-sm text-xs font-mono text-white/30 disabled:opacity-50 w-full"
              >
                <MapPin className="h-4 w-4" />
                View GEO Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
