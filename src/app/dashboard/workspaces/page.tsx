"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Settings, BarChart3, Briefcase, RefreshCw } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

interface Workspace {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  contacts: number;
  campaigns: number;
  members: number;
}

export default function WorkspacesPage() {
  const { session, currentOrganization } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  const orgId = currentOrganization?.org_id;

  const fetchWorkspaces = useCallback(async () => {
    if (!orgId || !session?.access_token) return;
    setLoading(true);
    setError(null);

    try {
      const { supabaseBrowser } = await import("@/lib/supabase");

      // Fetch workspaces for this org
      const { data: wsData, error: wsError } = await supabaseBrowser
        .from("workspaces")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: true });

      if (wsError) throw wsError;

      // For each workspace, get contact/campaign counts
      const enriched: Workspace[] = await Promise.all(
        (wsData || []).map(async (ws: any) => {
          const [contactsRes, campaignsRes] = await Promise.allSettled([
            supabaseBrowser.from("contacts").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id),
            supabaseBrowser.from("campaigns").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id),
          ]);

          const contacts = contactsRes.status === "fulfilled" ? (contactsRes.value.count ?? 0) : 0;
          const campaigns = campaignsRes.status === "fulfilled" ? (campaignsRes.value.count ?? 0) : 0;

          return {
            id: ws.id,
            name: ws.name || "Untitled Workspace",
            description: ws.description || "",
            status: ws.status || "active",
            created_at: ws.created_at,
            contacts,
            campaigns,
            members: 0,
          };
        })
      );

      setWorkspaces(enriched);
    } catch (err: unknown) {
      console.error("Failed to fetch workspaces:", err);
      setError((err as any).message || "Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  }, [orgId, session?.access_token]);

  useEffect(() => {
    if (orgId && session?.access_token) fetchWorkspaces();
  }, [orgId, session?.access_token, fetchWorkspaces]);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <Breadcrumbs items={[{ label: "Workspaces" }]} />
        <ErrorState
          title="Failed to Load Workspaces"
          message={error}
          onRetry={fetchWorkspaces}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <Breadcrumbs items={[{ label: "Workspaces" }]} />
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-8 w-12" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <Breadcrumbs items={[{ label: "Workspaces" }]} />
        <EmptyState
          icon={Briefcase}
          title="No Workspaces Yet"
          description="Create your first workspace to organize your clients and projects."
          actionLabel="Create Workspace"
          onAction={() => setIsCreateOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Workspaces" }]} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Workspaces
          </h1>
          <p className="text-white/50">Manage all your client accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchWorkspaces}
            className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Workspace
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#050505] border border-white/[0.06] rounded-sm">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Workspace</DialogTitle>
                <DialogDescription className="text-white/50">Add a new client workspace</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-white/70 mb-2 block">Workspace Name</Label>
                  <Input
                    placeholder="Client name or project"
                    className="bg-[#050505] border border-white/[0.06] text-white placeholder:text-white/30 rounded-sm"
                  />
                </div>
                <div>
                  <Label className="text-white/70 mb-2 block">Description</Label>
                  <Input
                    placeholder="What is this workspace for?"
                    className="bg-[#050505] border border-white/[0.06] text-white placeholder:text-white/30 rounded-sm"
                  />
                </div>
                <button className="w-full bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2">
                  Create Workspace
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Workspaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.map((workspace) => (
          <div key={workspace.id} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 hover:border-[#00F5FF]/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-white font-semibold group-hover:text-[#00F5FF] transition-colors">{workspace.name}</h3>
                <p className="text-white/50 text-sm mt-1">{workspace.description}</p>
              </div>
              <span className="bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20 text-xs px-2 py-0.5 rounded-sm font-mono">{workspace.status}</span>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-white/40 mb-1">Contacts</p>
                  <p className="text-2xl font-bold text-white">{workspace.contacts}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">Campaigns</p>
                  <p className="text-2xl font-bold text-white">{workspace.campaigns}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">Members</p>
                  <p className="text-2xl font-bold text-white">{workspace.members}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex-1 flex items-center justify-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Open
                </button>
                <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Stats */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
        <div className="mb-4">
          <h3 className="text-white text-xl font-semibold">Account Usage</h3>
          <p className="text-white/50 text-sm mt-1">Current plan: Professional</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-white/40 text-sm mb-2">Workspaces Used</p>
            <div className="text-3xl font-bold text-[#00F5FF]">
              {workspaces.length}
            </div>
          </div>
          <div>
            <p className="text-white/40 text-sm mb-2">Total Contacts</p>
            <div className="text-3xl font-bold text-[#00FF88]">
              {workspaces.reduce((sum, ws) => sum + ws.contacts, 0)}
            </div>
          </div>
          <div>
            <p className="text-white/40 text-sm mb-2">Total Campaigns</p>
            <div className="text-3xl font-bold text-[#FF00FF]">
              {workspaces.reduce((sum, ws) => sum + ws.campaigns, 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
