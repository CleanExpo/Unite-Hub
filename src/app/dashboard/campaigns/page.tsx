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
import { Plus, MailIcon, TrendingUp, Pause, Play, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function CampaignsPage() {
  const { currentOrganization } = useAuth();
  const workspaceId = currentOrganization?.org_id || null;
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        // Check if workspace is available
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
  }, [workspaceId]);

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
          <h1 className="text-3xl font-bold text-white mb-2">Campaigns</h1>
          <p className="text-slate-400">Manage all your marketing campaigns</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="w-4 h-4" />
          New Campaign
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Campaigns"
          value={activeCampaigns}
          icon={<MailIcon className="w-5 h-5" />}
          color="bg-blue-600"
        />
        <StatCard
          title="Total Sent"
          value={totalSent}
          icon={<MailIcon className="w-5 h-5" />}
          color="bg-green-600"
        />
        <StatCard
          title="Avg Open Rate"
          value={`${avgOpenRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-purple-600"
        />
        <StatCard
          title="Conversions"
          value={conversions}
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-orange-600"
        />
      </div>

      {/* Campaigns Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">All Campaigns</CardTitle>
          <CardDescription>View and manage your campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-slate-400">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center text-slate-400">No campaigns yet. Create your first campaign!</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-300">Campaign</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Performance</TableHead>
                  <TableHead className="text-slate-300">Sent</TableHead>
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const openRate = campaign.sent > 0 ? ((campaign.opened / campaign.sent) * 100).toFixed(1) : 0;
                  return (
                    <TableRow key={campaign.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-semibold">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            campaign.status === "active"
                              ? "bg-green-600"
                              : campaign.status === "scheduled"
                              ? "bg-blue-600"
                              : "bg-slate-600"
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
                          <Progress value={parseFloat(openRate as string)} className="h-1 w-20" />
                        </div>
                      </TableCell>
                      <TableCell className="text-white font-semibold">{campaign.sent}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {campaign.status === "active" && (
                            <Button size="sm" variant="ghost" className="text-amber-400 hover:text-amber-300">
                              <Pause className="w-4 h-4" />
                            </Button>
                          )}
                          {campaign.status === "scheduled" && (
                            <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300">
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className={`${color}/10 border-${color}/30 border`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-sm">{title}</p>
            <p className="text-3xl font-bold text-white mt-2">{value}</p>
          </div>
          <div className={`${color} p-3 rounded text-white`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
