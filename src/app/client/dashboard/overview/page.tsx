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
import { AlertTriangle, Clock, Compass, ArrowRight } from "lucide-react";

interface TrialInfo {
  isTrialing: boolean;
  daysRemaining: number;
  trialEnd: string | null;
}

export default function ClientDashboardOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
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

        // Get user profile
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("full_name")
          .eq("user_id", session.user.id)
          .single();

        if (profile) {
          setUserName(profile.full_name || session.user.email?.split("@")[0] || "there");
        }

        // Check subscription status
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trial Banner */}
        {trialInfo.isTrialing && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Trial Period Active
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {trialInfo.daysRemaining} days remaining. Upgrade to continue using all features.
                </p>
              </div>
              <button
                onClick={() => router.push("/pricing")}
                className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {userName}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
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
              className="bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-lg border border-teal-200 dark:border-teal-800 p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-teal-100 dark:bg-teal-800 rounded-lg">
                  <Compass className="w-5 h-5 text-teal-600 dark:text-teal-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Your 90-Day Journey
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Track your progress from onboarding to optimization
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-teal-600 dark:text-teal-400">
                    View Journey <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>

            <JustDroppedIdeasPanel />

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">
                  Request a new audit
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">
                  Schedule a strategy call
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">
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
