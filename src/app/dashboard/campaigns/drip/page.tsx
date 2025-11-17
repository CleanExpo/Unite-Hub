"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Clock, Users, TrendingUp, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function DripCampaignsPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workspaceLoading) return;
    if (workspaceId) {
      fetchDripCampaigns();
    }
  }, [workspaceId, workspaceLoading]);

  const fetchDripCampaigns = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call when drip campaigns API is ready
      setCampaigns([]);
    } catch (error) {
      console.error("Error fetching drip campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Campaigns", href: "/dashboard/campaigns" }, { label: "Drip Campaigns" }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
            Drip Campaigns
          </h1>
          <p className="text-slate-400 mt-2">
            Automate your email sequences and nurture leads
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 gap-2">
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard
          title="Total Campaigns"
          value="0"
          subtitle="Active sequences"
          icon={Mail}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatCard
          title="Enrolled Contacts"
          value="0"
          subtitle="In active campaigns"
          icon={Users}
          gradient="from-green-500 to-emerald-500"
        />
        <StatCard
          title="Avg. Open Rate"
          value="0%"
          subtitle="Across all campaigns"
          icon={TrendingUp}
          gradient="from-purple-500 to-pink-500"
        />
        <StatCard
          title="Scheduled"
          value="0"
          subtitle="Emails queued"
          icon={Clock}
          gradient="from-orange-500 to-red-500"
        />
      </div>

      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white text-xl font-semibold">Your Drip Campaigns</CardTitle>
          <CardDescription className="text-slate-400">
            Automated email sequences to engage your contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 mb-4">
              <Sparkles className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No drip campaigns yet</h3>
            <p className="text-slate-400 mb-4 max-w-md">
              Create your first drip campaign to automatically nurture leads with
              personalized email sequences.
            </p>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Campaign
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-slate-400 font-medium">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}
