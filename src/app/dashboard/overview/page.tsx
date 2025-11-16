"use client";

import { HotLeadsPanel } from "@/components/HotLeadsPanel";
import CalendarWidget from "@/components/CalendarWidget";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Users, Flame, Mail, TrendingUp, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function OverviewPage() {
  const { user, currentOrganization, loading: authLoading } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalContacts: 0,
    hotLeads: 0,
    totalCampaigns: 0,
    avgAiScore: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch workspace ID for current organization
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!currentOrganization?.org_id) {
        setWorkspaceId(null);
        return;
      }

      const { data, error } = await supabase
        .from('workspaces')
        .select('id')
        .eq('org_id', currentOrganization.org_id)
        .single();

      if (!error && data) {
        setWorkspaceId(data.id);
      } else {
        console.error('Error fetching workspace:', error);
        setWorkspaceId(null);
      }
    };

    fetchWorkspace();
  }, [currentOrganization?.org_id]);

  useEffect(() => {
    async function fetchStats() {
      try {
        if (authLoading) {
          console.log("Waiting for auth to complete...");
          return;
        }

        if (!workspaceId) {
          if (currentOrganization) {
            console.log("Workspace still loading for org:", currentOrganization.org_id);
          }
          setLoading(false);
          return;
        }

        console.log("Fetching stats for workspace:", workspaceId);

        // Fetch contacts count and stats
        const { data: contacts, error: contactsError } = await supabase
          .from("contacts")
          .select("ai_score, status")
          .eq("workspace_id", workspaceId);

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
          .eq("workspace_id", workspaceId);

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
  }, [workspaceId, authLoading]);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse"></div>
            <p className="text-slate-400">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="text-slate-400">Redirecting to login...</div>
      </div>
    );
  }

  // Show loading while fetching stats
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse"></div>
            <p className="text-slate-400">Loading stats...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 mb-4">
            <Sparkles className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No workspace selected</h3>
          <p className="text-slate-400">Please create or select a workspace to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Overview" }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
            Dashboard Overview
          </h1>
          <p className="text-slate-400">Welcome back! Here's what's happening with your contacts.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Contacts"
          value={stats.totalContacts.toString()}
          icon={Users}
          gradient="from-blue-500 to-cyan-500"
          change="+12%"
          trending="up"
        />
        <StatCard
          title="Hot Leads"
          value={stats.hotLeads.toString()}
          icon={Flame}
          gradient="from-orange-500 to-red-500"
          change="+8%"
          trending="up"
        />
        <StatCard
          title="Active Campaigns"
          value={stats.totalCampaigns.toString()}
          icon={Mail}
          gradient="from-purple-500 to-pink-500"
          change="+5%"
          trending="up"
        />
        <StatCard
          title="Avg AI Score"
          value={stats.avgAiScore.toString()}
          icon={TrendingUp}
          gradient="from-green-500 to-emerald-500"
          change="+3 pts"
          trending="up"
        />
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
  icon: Icon,
  gradient,
  change,
  trending,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  gradient: string;
  change?: string;
  trending?: "up" | "down";
}) {
  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {change && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${trending === "up" ? "text-green-400" : "text-red-400"}`}>
              {trending === "up" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {change}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-slate-400 font-medium">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
