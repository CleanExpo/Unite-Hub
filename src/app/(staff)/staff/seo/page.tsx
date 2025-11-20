"use client";

// Force dynamic
export const dynamic = 'force-dynamic';

/**
 * Staff SEO Dashboard Page
 * Phase 4 Step 4: Dual-Mode SEO UI Shell
 *
 * Full-depth SEO console for staff with:
 * - Standard Mode: Rational analysis (GSC/Bing/Brave metrics)
 * - Hypnotic Mode: Content velocity and retention engineering
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import SeoDashboardShell from "@/components/seo/SeoDashboardShell";
import type { SeoProfile } from "@/lib/seo/seoTypes";

export default function StaffSeoPage() {
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

        // Fetch all SEO profiles for this organization
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
          <p className="text-muted-foreground">Please sign in to access the SEO dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading SEO profiles...</p>
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
          <h2 className="text-2xl font-semibold mb-2">No SEO Profiles Found</h2>
          <p className="text-muted-foreground mb-6">
            Create an SEO profile to start tracking your search performance.
          </p>
          <button
            onClick={() => {
              // TODO: Navigate to SEO profile creation page
              console.log("Create SEO profile");
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Create SEO Profile
          </button>
        </div>
      </div>
    );
  }

  const selectedProfile = seoProfiles.find((p) => p.id === selectedProfileId);

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Selector */}
      {seoProfiles.length > 1 && (
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <label htmlFor="profile-select" className="text-sm font-medium">
                SEO Profile:
              </label>
              <select
                id="profile-select"
                value={selectedProfileId || ""}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="px-3 py-1.5 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {seoProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.profile_name} ({profile.domain})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Shell */}
      {selectedProfile && currentOrganization && (
        <SeoDashboardShell
          seoProfile={selectedProfile}
          organizationId={currentOrganization.org_id}
          userRole="staff"
        />
      )}
    </div>
  );
}
