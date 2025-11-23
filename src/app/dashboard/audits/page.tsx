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
          <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        );
      case "running":
        return (
          <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            <Clock className="h-3 w-3 animate-spin" />
            Running
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
            <AlertTriangle className="h-3 w-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          Website Audits
        </h1>
        <p className="text-muted-foreground">
          Analyze websites for SEO, technical, and content issues
        </p>
      </div>

      {/* New Audit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Start New Audit</CardTitle>
          <CardDescription>
            Enter a website URL to begin a comprehensive audit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAudit} className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={creating || !newUrl}>
              {creating ? (
                <Clock className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Start Audit
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Audits List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Audits</h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : audits.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audits yet</p>
              <p className="text-sm">Start your first website audit above</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {audits.map((audit) => (
              <Card key={audit.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{audit.url}</h3>
                        <p className="text-sm text-muted-foreground">
                          Started {new Date(audit.startedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {audit.status === "completed" && (
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className={`text-lg font-bold ${getScoreColor(audit.scores.overall)}`}>
                              {audit.scores.overall}
                            </div>
                            <div className="text-xs text-muted-foreground">Overall</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-sm font-medium ${getScoreColor(audit.scores.seo)}`}>
                              {audit.scores.seo}
                            </div>
                            <div className="text-xs text-muted-foreground">SEO</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-sm font-medium ${getScoreColor(audit.scores.technical)}`}>
                              {audit.scores.technical}
                            </div>
                            <div className="text-xs text-muted-foreground">Tech</div>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
