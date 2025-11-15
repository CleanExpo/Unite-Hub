"use client";

import { HotLeadsPanel } from "@/components/HotLeadsPanel";
import CalendarWidget from "@/components/CalendarWidget";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function OverviewPage() {
  const { currentOrganization } = useAuth();
  const workspaceId = currentOrganization?.org_id || null;
  const [stats, setStats] = useState({
    totalContacts: 0,
    hotLeads: 0,
    totalCampaigns: 0,
    avgAiScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Check if workspace is available
        if (!workspaceId) {
          console.log("No workspace selected");
          setLoading(false);
          return;
        }

        // Fetch contacts count and stats
        const { data: contacts, error: contactsError } = await supabase
          .from("contacts")
          .select("ai_score, status")
          .eq("workspace_id", workspaceId);  // ✅ Added workspace filter

        if (contactsError) {
          console.error("Error fetching contacts:", contactsError);
          throw contactsError;
        }

        const totalContacts = contacts?.length || 0;
        const hotLeads = contacts?.filter((c) => c.ai_score >= 80).length || 0;
        const avgAiScore = contacts?.length
          ? Math.round(
              contacts.reduce((sum, c) => sum + (c.ai_score || 0), 0) /
                contacts.length
            )
          : 0;

        // Fetch campaigns count
        const { data: campaigns, error: campaignsError } = await supabase
          .from("campaigns")
          .select("id")
          .eq("workspace_id", workspaceId);  // ✅ Added workspace filter

        if (campaignsError) {
          console.error("Error fetching campaigns:", campaignsError);
          throw campaignsError;
        }

        const totalCampaigns = campaigns?.length || 0;

        setStats({
          totalContacts,
          hotLeads,
          totalCampaigns,
          avgAiScore,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="text-white">Loading stats...</div>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <p className="text-slate-400 mb-4">No workspace selected</p>
          <p className="text-sm text-slate-500">Please create or select a workspace to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Overview" }]} />

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Welcome back!</p>
      </div>

      {/* Onboarding Checklist */}
      <OnboardingChecklist />

      {/* Stats - Now using real data from Supabase */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Contacts" value={stats.totalContacts.toString()} icon="📧" />
        <StatCard title="Hot Leads" value={stats.hotLeads.toString()} icon="🔥" />
        <StatCard title="Campaigns" value={stats.totalCampaigns.toString()} icon="✍️" />
        <StatCard title="Avg AI Score" value={stats.avgAiScore.toString()} icon="⭐" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hot Leads */}
        {workspaceId && <HotLeadsPanel workspaceId={workspaceId} />}

        {/* Calendar Widget */}
        {workspaceId && <CalendarWidget workspaceId={workspaceId} />}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <p className="text-slate-400 text-sm">{title}</p>
            <span className="text-2xl">{icon}</span>
          </div>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
