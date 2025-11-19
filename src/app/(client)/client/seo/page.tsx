/**
 * Client SEO Insights Page
 * Phase 4 Step 4: Dual-Mode SEO UI Shell
 *
 * Simplified SEO insights for clients with:
 * - Standard Mode: High-level performance metrics (read-only)
 * - Hypnotic Mode: Content performance and engagement hooks
 *
 * Depth: Surface-level insights only (no detailed configuration)
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import SeoDashboardShell from "@/components/seo/SeoDashboardShell";
import type { SeoProfile } from "@/lib/seo/seoTypes";

export default function ClientSeoPage() {
  const { user, currentOrganization } = useAuth();
  const [seoProfiles, setSeoProfiles] = useState<SeoProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSeoProfiles() {
      if (!user || !currentOrganization?.org_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch SEO profiles accessible to this client
        // Note: In production, this should be filtered by client access permissions
        const { data, error: fetchError } = await supabase
          .from("seo_profiles")
          .select("*")
          .eq("organization_id", currentOrganization.org_id)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        setSeoProfiles(data || []);

        // Auto-select first profile if available
        if (data && data.length > 0 && !selectedProfileId) {
          setSelectedProfileId(data[0].id);
        }
      } catch (err) {
        console.error("Error loading SEO profiles:", err);
        setError(err instanceof Error ? err.message : "Failed to load SEO profiles");
      } finally {
        setLoading(false);
      }
    }

    loadSeoProfiles();
  }, [user, currentOrganization?.org_id, selectedProfileId]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to access your SEO insights.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your SEO insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-destructive">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (seoProfiles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold mb-2">No SEO Data Available</h2>
          <p className="text-muted-foreground mb-6">
            Your SEO insights will appear here once your account manager has configured them.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact your account manager for more information.
          </p>
        </div>
      </div>
    );
  }

  const selectedProfile = seoProfiles.find((p) => p.id === selectedProfileId);

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Selector (only show if multiple profiles) */}
      {seoProfiles.length > 1 && (
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <label htmlFor="profile-select" className="text-sm font-medium">
                Website:
              </label>
              <select
                id="profile-select"
                value={selectedProfileId || ""}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="px-3 py-1.5 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {seoProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.domain}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Shell (Client View - Read-Only) */}
      {selectedProfile && currentOrganization && (
        <SeoDashboardShell
          seoProfile={selectedProfile}
          organizationId={currentOrganization.org_id}
          userRole="client"
        />
      )}
    </div>
  );
}
