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
import { PageContainer, Section } from '@/ui/layout/AppGrid';

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
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="text-center">
          <h2 className="text-xl font-mono font-semibold text-white mb-2">Authentication Required</h2>
          <p className="text-white/40 font-mono">Please sign in to access your SEO insights.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="text-center">
          <div className="animate-spin rounded-sm h-12 w-12 border-b-2 border-[#00F5FF] mx-auto mb-4"></div>
          <p className="text-white/40 font-mono">Loading your SEO insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="text-center">
          <h2 className="text-xl font-mono font-semibold mb-2 text-[#FF4444]">Error</h2>
          <p className="text-white/40 font-mono">{error}</p>
        </div>
      </div>
    );
  }

  if (seoProfiles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-mono font-semibold text-white mb-2">No SEO Data Available</h2>
          <p className="text-white/40 font-mono mb-6">
            Your SEO insights will appear here once your account manager has configured them.
          </p>
          <p className="text-sm font-mono text-white/30">
            Contact your account manager for more information.
          </p>
        </div>
      </div>
    );
  }

  const selectedProfile = seoProfiles.find((p) => p.id === selectedProfileId);

  return (
    <PageContainer>
      <Section>
        {/* Profile Selector (only show if multiple profiles) */}
        {seoProfiles.length > 1 && (
          <div className="border-b border-white/[0.06] bg-white/[0.02]">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center gap-4">
                <label htmlFor="profile-select" className="text-sm font-mono font-medium text-white/60">
                  Website:
                </label>
                <select
                  id="profile-select"
                  value={selectedProfileId || ""}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-sm text-sm font-mono text-white focus:outline-none focus:border-[#00F5FF]/40"
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
      </Section>
    </PageContainer>
  );
}
