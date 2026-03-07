"use client";

// Force dynamic
export const dynamic = 'force-dynamic';

/**
 * Staff SEO Dashboard Page
 * Phase 4 Step 4: Dual-Mode SEO UI Shell
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import SeoDashboardShell from "@/components/seo/SeoDashboardShell";
import type { SeoProfile } from "@/lib/seo/seoTypes";
import { PageContainer, Section } from '@/ui/layout/AppGrid';

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

        const { data, error: fetchError } = await supabase
          .from("seo_profiles")
          .select("*")
          .eq("organization_id", currentOrganization.org_id)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        setSeoProfiles(data || []);

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
          <p className="text-white/40 font-mono text-sm">Please sign in to access the SEO dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#00F5FF]/20 border-t-[#00F5FF] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/40 font-mono text-sm">Loading SEO profiles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="text-center">
          <h2 className="text-xl font-mono font-semibold mb-2" style={{ color: '#FF4444' }}>Error</h2>
          <p className="text-white/40 font-mono text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (seoProfiles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-mono font-semibold text-white mb-2">No SEO Profiles Found</h2>
          <p className="text-white/40 font-mono text-sm mb-6">
            Create an SEO profile to start tracking your search performance.
          </p>
          <button
            onClick={() => {
              console.log("Create SEO profile");
            }}
            className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 hover:bg-[#00F5FF]/90"
          >
            Create SEO Profile
          </button>
        </div>
      </div>
    );
  }

  const selectedProfile = seoProfiles.find((p) => p.id === selectedProfileId);

  return (
    <PageContainer>
      <Section>
        <div className="bg-[#050505]">
          {/* Profile Selector */}
          {seoProfiles.length > 1 && (
            <div className="border-b border-white/[0.06] bg-white/[0.02]">
              <div className="container mx-auto px-4 py-3">
                <div className="flex items-center gap-4">
                  <label htmlFor="profile-select" className="text-xs font-mono text-white/40 uppercase tracking-wider">
                    SEO Profile:
                  </label>
                  <select
                    id="profile-select"
                    value={selectedProfileId || ""}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    className="bg-white/[0.04] border border-white/[0.06] rounded-sm px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-[#00F5FF]/40 appearance-none"
                  >
                    {seoProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id} className="bg-[#050505]">
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
      </Section>
    </PageContainer>
  );
}
