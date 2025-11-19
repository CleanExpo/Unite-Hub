/**
 * SEO Dashboard Shell - Dual-Mode Layout
 * Phase 4 Step 4: Dual-Mode SEO UI Shell
 *
 * Shared layout component that manages:
 * - Mode state ('standard' or 'hypnotic')
 * - Panel rendering based on mode and user role
 * - Credential state management
 * - Error boundaries
 */

"use client";

import { useState, useEffect } from "react";
import type { SeoProfile } from "@/lib/seo/seoTypes";
import SeoModeToggle from "./SeoModeToggle";
import GscOverviewPanel from "./panels/GscOverviewPanel";
import BingIndexNowPanel from "./panels/BingIndexNowPanel";
import BravePresencePanel from "./panels/BravePresencePanel";
import KeywordOpportunitiesPanel from "./panels/KeywordOpportunitiesPanel";
import TechHealthPanel from "./panels/TechHealthPanel";
import VelocityQueuePanel from "./panels/VelocityQueuePanel";
import HookLabPanel from "./panels/HookLabPanel";

export type SeoMode = "standard" | "hypnotic";
export type UserRole = "staff" | "client";

interface SeoDashboardShellProps {
  seoProfile: SeoProfile;
  organizationId: string;
  userRole: UserRole;
}

export default function SeoDashboardShell({
  seoProfile,
  organizationId,
  userRole,
}: SeoDashboardShellProps) {
  const [mode, setMode] = useState<SeoMode>("standard");
  const [hasGscCredential, setHasGscCredential] = useState(false);
  const [hasBingCredential, setHasBingCredential] = useState(false);
  const [hasBraveCredential, setHasBraveCredential] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkCredentials() {
      setLoading(true);

      try {
        // TODO: Replace with actual credential check API calls
        // For now, assume no credentials (will show CTAs)
        setHasGscCredential(false);
        setHasBingCredential(false);
        setHasBraveCredential(false);
      } catch (error) {
        console.error("Error checking credentials:", error);
      } finally {
        setLoading(false);
      }
    }

    checkCredentials();
  }, [seoProfile.id, organizationId]);

  // Determine which panels to show based on mode and role
  const panelConfig = getPanelConfig(mode, userRole);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Mode Toggle */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">
                {mode === "standard" ? "SEO Console" : "Hypnotic Velocity"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {seoProfile.domain}
              </p>
            </div>
            <SeoModeToggle mode={mode} onModeChange={setMode} />
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Standard Mode Panels */}
            {mode === "standard" && (
              <>
                {panelConfig.showGscOverview && (
                  <GscOverviewPanel
                    seoProfileId={seoProfile.id}
                    organizationId={organizationId}
                    hasCredential={hasGscCredential}
                    userRole={userRole}
                  />
                )}
                {panelConfig.showBingIndexNow && (
                  <BingIndexNowPanel
                    seoProfileId={seoProfile.id}
                    organizationId={organizationId}
                    hasCredential={hasBingCredential}
                    userRole={userRole}
                  />
                )}
                {panelConfig.showBravePresence && (
                  <BravePresencePanel
                    seoProfileId={seoProfile.id}
                    organizationId={organizationId}
                    hasCredential={hasBraveCredential}
                    userRole={userRole}
                  />
                )}
                {panelConfig.showKeywordOpportunities && (
                  <KeywordOpportunitiesPanel
                    seoProfileId={seoProfile.id}
                    organizationId={organizationId}
                    userRole={userRole}
                  />
                )}
                {panelConfig.showTechHealth && (
                  <TechHealthPanel
                    seoProfileId={seoProfile.id}
                    organizationId={organizationId}
                    userRole={userRole}
                  />
                )}
              </>
            )}

            {/* Hypnotic Mode Panels */}
            {mode === "hypnotic" && (
              <>
                {panelConfig.showVelocityQueue && (
                  <VelocityQueuePanel
                    seoProfileId={seoProfile.id}
                    organizationId={organizationId}
                    userRole={userRole}
                  />
                )}
                {panelConfig.showHookLab && (
                  <HookLabPanel
                    seoProfileId={seoProfile.id}
                    organizationId={organizationId}
                    userRole={userRole}
                  />
                )}
                {/* Show GSC/Bing/Brave in Hypnotic mode for staff only */}
                {userRole === "staff" && (
                  <>
                    {panelConfig.showGscOverview && (
                      <GscOverviewPanel
                        seoProfileId={seoProfile.id}
                        organizationId={organizationId}
                        hasCredential={hasGscCredential}
                        userRole={userRole}
                      />
                    )}
                    {panelConfig.showBingIndexNow && (
                      <BingIndexNowPanel
                        seoProfileId={seoProfile.id}
                        organizationId={organizationId}
                        hasCredential={hasBingCredential}
                        userRole={userRole}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Determine which panels to show based on mode and role
 */
function getPanelConfig(mode: SeoMode, userRole: UserRole) {
  if (mode === "standard") {
    return {
      // Standard mode: All rational SEO panels
      showGscOverview: true,
      showBingIndexNow: true,
      showBravePresence: true,
      showKeywordOpportunities: true,
      showTechHealth: userRole === "staff", // Staff only
      showVelocityQueue: false,
      showHookLab: false,
    };
  } else {
    // Hypnotic mode: Content velocity and retention focus
    return {
      showGscOverview: userRole === "staff", // Staff can see metrics in Hypnotic mode
      showBingIndexNow: userRole === "staff",
      showBravePresence: false,
      showKeywordOpportunities: false,
      showTechHealth: false,
      showVelocityQueue: true,
      showHookLab: true,
    };
  }
}
