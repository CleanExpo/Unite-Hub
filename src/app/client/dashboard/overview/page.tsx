"use client";

/**
 * Client Dashboard Overview
 * Phase 32: Agency Experience Layer
 *
 * Elite agency experience with AI support
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AgencyPresencePanel from "@/components/client/AgencyPresencePanel";
import AgencyActivityFeed from "@/components/client/AgencyActivityFeed";
import ProgressAndImpactGraphs from "@/components/client/ProgressAndImpactGraphs";
import JustDroppedIdeasPanel from "@/components/client/JustDroppedIdeasPanel";
import { TrialCapabilityBanner } from "@/components/trial/TrialCapabilityBanner";
import { AlertTriangle, Clock, Compass, ArrowRight } from "lucide-react";
import type { TrialState } from "@/lib/trial/trialExperienceEngine";

interface TrialInfo {
  isTrialing: boolean;
  daysRemaining: number;
  trialEnd: string | null;
}

export default function ClientDashboardOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [trialState, setTrialState] = useState<TrialState | null>(null);
  const [isInTrial, setIsInTrial] = useState(false);
  const [trialInfo, setTrialInfo] = useState<TrialInfo>({
    isTrialing: false,
    daysRemaining: 0,
    trialEnd: null,
  });

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push("/login");
          return;
        }

        // Get user profile and workspace
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("full_name, workspace_id")
          .eq("user_id", session.user.id)
          .single();

        if (profile) {
          setUserName(profile.full_name || session.user.email?.split("@")[0] || "there");
          if (profile.workspace_id) {
            setWorkspaceId(profile.workspace_id);

            // Load trial state from API
            try {
              const profileResponse = await fetch(
                `/api/trial/profile?workspaceId=${profile.workspace_id}`,
                {
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                  },
                }
              );

              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                if (profileData.isTrialActive) {
                  setIsInTrial(true);
                  if (profileData.trialState) {
                    setTrialState(profileData.trialState);
                  }
                }
              }
            } catch (err) {
              console.error("Error loading trial profile:", err);
            }
          }
        }

        // Check subscription status (legacy)
        const response = await fetch("/api/billing/subscription", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();

          if (data.subscription?.status === "trialing" && data.subscription?.trialEnd) {
            const trialEnd = new Date(data.subscription.trialEnd);
            const now = new Date();
            const daysRemaining = Math.ceil(
              (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            setTrialInfo({
              isTrialing: true,
              daysRemaining,
              trialEnd: data.subscription.trialEnd,
            });
          }
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-raised">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trial Capability Banner */}
        {isInTrial && trialState && (
          <div className="mb-8">
            <TrialCapabilityBanner
              trialState={trialState}
              onUpgradeClick={() => router.push("/pricing")}
            />
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            Welcome back, {userName}
          </h1>
          <p className="text-text-secondary mt-1">
            Here&apos;s what your team has been working on
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Team & Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agency Presence Panel */}
            <AgencyPresencePanel />

            {/* Progress & Impact */}
            <ProgressAndImpactGraphs />

            {/* Activity Feed */}
            <AgencyActivityFeed />
          </div>

          {/* Right Column - Ideas */}
          <div className="space-y-6">
            {/* Journey Entry Point */}
            <div
              onClick={() => router.push("/client/dashboard/journey")}
              className="bg-gradient-to-br from-accent-50 to-blue-50 dark:from-accent-900/20 dark:to-blue-900/20 rounded-lg border border-accent-200 dark:border-accent-800 p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-accent-100 dark:bg-accent-800 rounded-lg">
                  <Compass className="w-5 h-5 text-accent-600 dark:text-accent-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Your 90-Day Journey
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Track your progress from onboarding to optimization
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-accent-600 dark:text-accent-400">
                    View Journey <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>

            <JustDroppedIdeasPanel />

            {/* Quick Actions */}
            <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-bg-hover text-sm text-text-secondary">
                  Request a new audit
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-bg-hover text-sm text-text-secondary">
                  Schedule a strategy call
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-bg-hover text-sm text-text-secondary">
                  View all reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
