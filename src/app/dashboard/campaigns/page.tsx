"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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
    draft: "text-white/40 border-white/[0.08]",
    scheduled: "text-purple-400 border-purple-400/30",
    active: "text-emerald-400 border-emerald-400/30",
    completed: "text-[#00FF88] border-[#00FF88]/30",
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
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/[0.03] rounded-sm w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/[0.03] rounded-sm" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={[{ label: "Campaigns" }]} />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white/90">Campaigns</h1>
          <p className="text-sm text-white/40 mt-1">Create and manage your email campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCampaigns}
            className="p-2 text-white/40 hover:text-white/90 rounded-sm transition-none"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm rounded-sm px-4 py-2 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: total, icon: Megaphone, color: "text-[#00F5FF]", bg: "bg-[#00F5FF]/10" },
          { label: "Active", value: active, icon: Play, color: "text-[#00FF88]", bg: "bg-[#00FF88]/10" },
          { label: "Drafts", value: drafts, icon: Mail, color: "text-white/40", bg: "bg-white/[0.04]" },
          { label: "Completed", value: done, icon: BarChart3, color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-sm ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-white/90">{s.value}</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white/[0.02] border-white/[0.06] text-white/90 placeholder:text-white/40 rounded-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-white/[0.02] border-white/[0.06] text-white/90 rounded-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0a0a0a] border-white/[0.06] rounded-sm">
            {["all", "draft", "scheduled", "active", "completed", "paused"].map((v) => (
              <SelectItem key={v} value={v} className="text-white/90 hover:bg-white/[0.04] font-mono text-sm">
                {v === "all" ? "All Status" : v.charAt(0).toUpperCase() + v.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campaign list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white/[0.03] rounded-sm animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/[0.02] border border-white/[0.06] rounded-sm"
        >
          <div className="text-center py-16 px-4">
            <Megaphone className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-mono font-semibold text-white/90 mb-2">No campaigns yet</h3>
            <p className="text-sm text-white/40 mb-6">
              Create your first email campaign to start reaching your contacts
            </p>
            <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm rounded-sm px-4 py-2 flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" /> Create Campaign
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="bg-white/[0.02] border border-white/[0.06] rounded-sm hover:bg-white/[0.03] cursor-pointer"
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="p-2 bg-white/[0.04] rounded-sm flex-shrink-0 text-white/40">
                      {statusIcons[c.status] || <Mail className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-mono font-medium text-white/90 truncate">{c.name}</h3>
                      <p className="text-xs text-white/40 truncate mt-0.5">Subject: {c.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {c.scheduled_at && (
                      <span className="text-xs text-white/40 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(c.scheduled_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono uppercase tracking-widest rounded-sm ${statusColors[c.status] || "text-white/40 border-white/[0.08]"}`}
                    >
                      {c.status}
                    </Badge>
                    <span className="text-[11px] font-mono text-white/40">
                      {new Date(c.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
