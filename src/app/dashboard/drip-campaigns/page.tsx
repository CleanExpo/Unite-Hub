"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Workflow, Plus, Play, Pause, RefreshCw, Users, CheckCircle2 } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/contexts/AuthContext";

interface DripCampaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  trigger_type?: string;
  created_at: string;
  updated_at: string;
  enrolled_count?: number;
  completed_count?: number;
  completion_rate?: string;
}

export default function DripCampaignsPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const { session } = useAuth();
  const [campaigns, setCampaigns] = useState<DripCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;
    try {
      setLoading(true);
      const res = await fetch("/api/campaigns/drip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "list", workspaceId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error("Failed to fetch drip campaigns:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, session?.access_token]);

  useEffect(() => {
    if (workspaceId && session?.access_token) fetchCampaigns();
  }, [workspaceId, session?.access_token, fetchCampaigns]);

  if (workspaceLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-800 rounded w-48" />
          <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-800 rounded" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Drip Campaigns</h1>
          <p className="text-sm text-slate-400 mt-1">Automated email sequences for lead nurturing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchCampaigns} className="text-slate-400 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Create Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Drips", value: campaigns.length, icon: Workflow, color: "text-cyan-400", bg: "bg-cyan-500/10" },
          { label: "Active", value: campaigns.filter((c) => c.status === "active").length, icon: Play, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Paused", value: campaigns.filter((c) => c.status === "paused").length, icon: Pause, color: "text-yellow-400", bg: "bg-yellow-500/10" },
        ].map((s) => (
          <Card key={s.label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                <div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-800/30 rounded-lg animate-pulse" />)}</div>
      ) : campaigns.length === 0 ? (
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="text-center py-16">
            <Workflow className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No drip campaigns yet</h3>
            <p className="text-sm text-slate-400 mb-6">Create automated email sequences to nurture your leads</p>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white"><Plus className="w-4 h-4 mr-2" /> Create Your First Drip</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Card key={c.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-700 rounded-lg"><Workflow className="h-5 w-5 text-cyan-500" /></div>
                    <div>
                      <h3 className="font-medium text-white">{c.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                        {c.enrolled_count !== undefined && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.enrolled_count} enrolled</span>}
                        {c.completed_count !== undefined && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {c.completed_count} completed</span>}
                        {c.completion_rate && <span>{c.completion_rate} completion</span>}
                        {c.description && <span className="text-slate-500 truncate max-w-[200px]">{c.description}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-[10px] ${
                      c.status === "active" ? "text-emerald-400 border-emerald-400/30" :
                      c.status === "paused" ? "text-yellow-400 border-yellow-400/30" :
                      "text-slate-400 border-slate-600"
                    }`}>{c.status}</Badge>
                    <span className="text-[11px] text-slate-500">{new Date(c.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
