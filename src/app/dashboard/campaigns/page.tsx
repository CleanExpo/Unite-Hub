"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Mail, TrendingUp, Pause, Play, Trash2, Send, Eye, MousePointerClick, Sparkles } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/lib/supabase";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function CampaignsPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        if (workspaceLoading) {
          return;
        }

        if (!workspaceId) {
          console.log("No workspace selected for campaigns");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("campaigns")
          .select("*")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching campaigns:", error);
          throw error;
        }
        setCampaigns(data || []);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCampaigns();
  }, [workspaceId, workspaceLoading]);

  // Calculate stats from campaigns
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const totalSent = campaigns.reduce((sum, c) => sum + (c.sent || 0), 0);
  const avgOpenRate =
    campaigns.length > 0
      ? (campaigns.reduce((sum, c) => sum + (c.sent > 0 ? ((c.opened || 0) / c.sent) * 100 : 0), 0) /
          campaigns.length).toFixed(1)
      : "0";
  const conversions = campaigns.reduce((sum, c) => sum + (c.replied || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Campaigns" }]} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
            Email Campaigns
          </h1>
          <p className="text-slate-400">Create, manage, and track your marketing campaigns</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 transition-all gap-2">
          <Plus className="w-4 h-4" />
          New Campaign
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Campaigns"
          value={activeCampaigns}
          icon={Mail}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatCard
          title="Total Sent"
          value={totalSent.toLocaleString()}
          icon={Send}
          gradient="from-green-500 to-emerald-500"
        />
        <StatCard
          title="Avg Open Rate"
          value={`${avgOpenRate}%`}
          icon={Eye}
          gradient="from-purple-500 to-pink-500"
        />
        <StatCard
          title="Conversions"
          value={conversions}
          icon={MousePointerClick}
          gradient="from-orange-500 to-red-500"
        />
      </div>

      {/* Campaigns Table */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white text-xl font-semibold">All Campaigns</CardTitle>
          <CardDescription className="text-slate-400">View and manage your email campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse"></div>
                <p className="text-slate-400">Loading campaigns...</p>
              </div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 mb-4">
                <Sparkles className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No campaigns yet</h3>
              <p className="text-slate-400 mb-4">Create your first campaign to start engaging with your contacts</p>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2">
                <Plus className="w-4 h-4" />
                Create Campaign
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50 hover:bg-slate-700/30">
                    <TableHead className="text-slate-300 font-semibold">Campaign</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Status</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Performance</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Sent</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => {
                    const openRate = campaign.sent > 0 ? ((campaign.opened / campaign.sent) * 100).toFixed(1) : 0;
                    return (
                      <TableRow key={campaign.id} className="border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                        <TableCell className="text-white font-semibold">{campaign.name}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              campaign.status === "active"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : campaign.status === "scheduled"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                            }
                          >
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Open: {openRate}%</span>
                            </div>
                            <Progress
                              value={parseFloat(openRate as string)}
                              className="h-2 w-24 bg-slate-700"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-white font-semibold">{campaign.sent.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {campaign.status === "active" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                              >
                                <Pause className="w-4 h-4" />
                              </Button>
                            )}
                            {campaign.status === "scheduled" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
}: {
  title: string;
  value: string | number;
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
        </div>
      </CardContent>
    </Card>
  );
}
