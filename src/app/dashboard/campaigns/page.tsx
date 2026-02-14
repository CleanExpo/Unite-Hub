"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Megaphone, Plus, Search, RefreshCw, Mail, BarChart3, Clock,
  Play, Pause, Calendar,
} from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/contexts/AuthContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export default function CampaignsPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const { session } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCampaigns = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({ workspaceId, pageSize: "100" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchTerm) params.set("name", `%${searchTerm}%`);

      const res = await fetch(`/api/campaigns?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.data?.campaigns || []);
      }
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, session?.access_token, statusFilter, searchTerm]);

  useEffect(() => {
    if (workspaceId && session?.access_token) {
      fetchCampaigns();
    }
  }, [workspaceId, session?.access_token, fetchCampaigns]);

  const statusColors: Record<string, string> = {
    draft: "text-slate-400 border-slate-600",
    scheduled: "text-purple-400 border-purple-400/30",
    active: "text-emerald-400 border-emerald-400/30",
    completed: "text-blue-400 border-blue-400/30",
    paused: "text-yellow-400 border-yellow-400/30",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    draft: <Mail className="w-4 h-4" />,
    scheduled: <Clock className="w-4 h-4" />,
    active: <Play className="w-4 h-4" />,
    completed: <BarChart3 className="w-4 h-4" />,
    paused: <Pause className="w-4 h-4" />,
  };

  const total = campaigns.length;
  const active = campaigns.filter((c) => c.status === "active").length;
  const drafts = campaigns.filter((c) => c.status === "draft").length;
  const done = campaigns.filter((c) => c.status === "completed").length;

  if (workspaceLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-800 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-800 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <Breadcrumbs items={[{ label: "Campaigns" }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-sm text-slate-400 mt-1">Create and manage your email campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchCampaigns} className="text-slate-400 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> New Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: total, icon: Megaphone, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Active", value: active, icon: Play, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Drafts", value: drafts, icon: Mail, color: "text-slate-400", bg: "bg-slate-500/10" },
          { label: "Completed", value: done, icon: BarChart3, color: "text-purple-400", bg: "bg-purple-500/10" },
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

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input placeholder="Search campaigns..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {["all","draft","scheduled","active","completed","paused"].map((v) => (
              <SelectItem key={v} value={v} className="text-white hover:bg-slate-700">
                {v === "all" ? "All Status" : v.charAt(0).toUpperCase() + v.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-800/30 rounded-lg animate-pulse" />)}</div>
      ) : campaigns.length === 0 ? (
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="text-center py-16">
            <Megaphone className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No campaigns yet</h3>
            <p className="text-sm text-slate-400 mb-6">Create your first email campaign to start reaching your contacts</p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-2" /> Create Campaign</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Card key={c.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="p-2 bg-slate-700/50 rounded-lg flex-shrink-0">
                      {statusIcons[c.status] || <Mail className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-white truncate">{c.name}</h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">Subject: {c.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {c.scheduled_at && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(c.scheduled_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                      </span>
                    )}
                    <Badge variant="outline" className={`text-[10px] ${statusColors[c.status] || "text-slate-400 border-slate-600"}`}>{c.status}</Badge>
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
