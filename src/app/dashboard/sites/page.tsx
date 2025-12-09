"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Globe, Plus, Search, RefreshCw, ExternalLink, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

interface ClientSite {
  id: string;
  name: string;
  domain: string;
  url: string;
  site_type: string;
  status: string;
  seo_score: number;
  issues_count: number;
  last_scan_at: string | null;
  created_at: string;
}

export default function SitesPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const [sites, setSites] = useState<ClientSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSite, setNewSite] = useState({ name: "", domain: "", url: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (workspaceLoading || !workspaceId) {
return;
}
    loadSites();
  }, [workspaceLoading, workspaceId]);

  const loadSites = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const res = await fetch(`/api/sites?workspaceId=${workspaceId}`, {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });

      if (res.ok) {
        const { sites } = await res.json();
        setSites(sites || []);
      }
    } catch (error) {
      console.error("Failed to load sites:", error);
    } finally {
      setLoading(false);
    }
  };

  const addSite = async () => {
    if (!newSite.name || !newSite.domain || !newSite.url) {
return;
}

    setAdding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const res = await fetch("/api/sites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          workspaceId,
          name: newSite.name,
          domain: newSite.domain,
          url: newSite.url
        })
      });

      if (res.ok) {
        setNewSite({ name: "", domain: "", url: "" });
        setShowAddForm(false);
        await loadSites();
      }
    } catch (error) {
      console.error("Failed to add site:", error);
    } finally {
      setAdding(false);
    }
  };

  const scanSite = async (siteId: string) => {
    setScanning(siteId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
return;
}

      const res = await fetch("/api/sites/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ siteId, workspaceId, scanType: "seo" })
      });

      if (res.ok) {
        await loadSites();
      }
    } catch (error) {
      console.error("Scan failed:", error);
    } finally {
      setScanning(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) {
return "text-green-400";
}
    if (score >= 60) {
return "text-yellow-400";
}
    return "text-red-400";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600/20 text-green-400 border-green-600/50">Active</Badge>;
      case "pending_setup":
        return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/50">Setup Required</Badge>;
      case "error":
        return <Badge className="bg-red-600/20 text-red-400 border-red-600/50">Error</Badge>;
      default:
        return <Badge className="bg-slate-600/20 text-slate-400 border-slate-600/50">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <Breadcrumbs items={[{ label: "Client Sites" }]} />
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Client Sites" }]} />

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
            Client Sites
          </h1>
          <p className="text-slate-400">Manage and optimize your client websites</p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Site
        </Button>
      </div>

      {/* Add Site Form */}
      {showAddForm && (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Add New Client Site</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Site Name (e.g., Disaster Recovery)"
                value={newSite.name}
                onChange={e => setNewSite({ ...newSite, name: e.target.value })}
                className="bg-slate-900/50 border-slate-700/50 text-white"
              />
              <Input
                placeholder="Domain (e.g., disasterrecovery.com.au)"
                value={newSite.domain}
                onChange={e => setNewSite({ ...newSite, domain: e.target.value })}
                className="bg-slate-900/50 border-slate-700/50 text-white"
              />
              <Input
                placeholder="URL (e.g., https://www.disasterrecovery.com.au)"
                value={newSite.url}
                onChange={e => setNewSite({ ...newSite, url: e.target.value })}
                className="bg-slate-900/50 border-slate-700/50 text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="border-slate-700/50">
                Cancel
              </Button>
              <Button onClick={addSite} disabled={adding} className="bg-gradient-to-r from-blue-600 to-purple-600">
                {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Add Site
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sites List */}
      {sites.length === 0 ? (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardContent className="py-12 text-center">
            <Globe className="w-12 h-12 mx-auto mb-4 text-slate-500" />
            <h3 className="text-xl font-semibold text-white mb-2">No sites yet</h3>
            <p className="text-slate-400 mb-4">Add your first client site to start managing SEO</p>
            <Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Site
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sites.map(site => (
            <Card key={site.id} className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{site.name}</h3>
                      <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-blue-400 flex items-center gap-1">
                        {site.domain}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* SEO Score */}
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(site.seo_score)}`}>
                        {site.seo_score || "--"}
                      </div>
                      <div className="text-xs text-slate-400">SEO Score</div>
                    </div>

                    {/* Issues */}
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        {site.issues_count > 0 ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                        <span className="text-lg font-semibold text-white">{site.issues_count}</span>
                      </div>
                      <div className="text-xs text-slate-400">Issues</div>
                    </div>

                    {/* Status */}
                    {getStatusBadge(site.status)}

                    {/* Actions */}
                    <Button
                      onClick={() => scanSite(site.id)}
                      disabled={scanning === site.id}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {scanning === site.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      <span className="ml-2">Scan</span>
                    </Button>
                  </div>
                </div>

                {site.last_scan_at && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50 text-sm text-slate-400">
                    Last scanned: {new Date(site.last_scan_at).toLocaleDateString("en-AU", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
