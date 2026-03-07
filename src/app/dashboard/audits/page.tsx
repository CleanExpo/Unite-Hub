"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Globe, CheckCircle, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface Audit {
  id: string;
  url: string;
  status: "pending" | "running" | "completed" | "failed";
  scores: {
    overall: number;
    seo: number;
    technical: number;
    geo: number;
    content: number;
  };
  startedAt: string;
  completedAt?: string;
}

export default function AuditsPage() {
  const { currentOrganization } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [creating, setCreating] = useState(false);

  const workspaceId = currentOrganization?.org_id;

  // Fetch audits
  useEffect(() => {
    const fetchAudits = async () => {
      if (!workspaceId) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(`/api/audits?workspaceId=${workspaceId}`, {
          headers: {
            ...(session && { Authorization: `Bearer ${session.access_token}` }),
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAudits(data.audits || []);
        }
      } catch (error) {
        console.error("Error fetching audits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAudits();
  }, [workspaceId]);

  // Create new audit
  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || !workspaceId) return;

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/audits?workspaceId=${workspaceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          url: newUrl.startsWith("http") ? newUrl : `https://${newUrl}`,
          auditTypes: ["seo", "technical", "geo", "content"],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAudits([data.audit, ...audits]);
        setNewUrl("");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Create audit error:", error);
      alert("Failed to create audit");
    } finally {
      setCreating(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="flex items-center gap-1 text-xs bg-[#00FF88]/10 text-[#00FF88] px-2 py-1 rounded-sm">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        );
      case "running":
        return (
          <span className="flex items-center gap-1 text-xs bg-[#00F5FF]/10 text-[#00F5FF] px-2 py-1 rounded-sm">
            <Clock className="h-3 w-3 animate-spin" />
            Running
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1 text-xs bg-[#FF4444]/10 text-[#FF4444] px-2 py-1 rounded-sm">
            <AlertTriangle className="h-3 w-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs bg-white/[0.04] text-white/40 px-2 py-1 rounded-sm">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#00FF88]";
    if (score >= 60) return "text-[#FFB800]";
    return "text-[#FF4444]";
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-mono text-white/90 flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          Website Audits
        </h1>
        <p className="text-white/40">
          Analyze websites for SEO, technical, and content issues
        </p>
      </div>

      {/* New Audit Form */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
        <div className="mb-3">
          <h2 className="text-sm font-mono font-bold text-white/90">Start New Audit</h2>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mt-1">
            Enter a website URL to begin a comprehensive audit
          </p>
        </div>
        <form onSubmit={handleCreateAudit} className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              type="text"
              placeholder="example.com"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="pl-10"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !newUrl}
            className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 disabled:opacity-40"
          >
            {creating ? (
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                Start Audit
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Start Audit
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Audits List */}
      <div>
        <h2 className="text-lg font-mono font-semibold text-white/90 mb-4">Recent Audits</h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-sm animate-spin" />
          </div>
        ) : audits.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <div className="py-8 text-center text-white/40">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audits yet</p>
              <p className="text-sm">Start your first website audit above</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {audits.map((audit) => (
              <div key={audit.id} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 hover:border-white/[0.12] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-sm bg-primary/10">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-mono font-medium text-white/90">{audit.url}</h3>
                      <p className="text-sm text-white/40">
                        Started {new Date(audit.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {audit.status === "completed" && (
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className={`text-lg font-bold font-mono ${getScoreColor(audit.scores.overall)}`}>
                            {audit.scores.overall}
                          </div>
                          <div className="text-[10px] font-mono uppercase tracking-widest text-white/20">Overall</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-sm font-mono font-medium ${getScoreColor(audit.scores.seo)}`}>
                            {audit.scores.seo}
                          </div>
                          <div className="text-[10px] font-mono uppercase tracking-widest text-white/20">SEO</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-sm font-mono font-medium ${getScoreColor(audit.scores.technical)}`}>
                            {audit.scores.technical}
                          </div>
                          <div className="text-[10px] font-mono uppercase tracking-widest text-white/20">Tech</div>
                        </div>
                      </div>
                    )}

                    {getStatusBadge(audit.status)}

                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/audits/${audit.id}`}>
                        View <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
