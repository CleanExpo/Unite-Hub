 
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Zap, TrendingUp, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseBrowser } from "@/lib/supabase";
import { HotLeadsSkeleton } from "@/components/skeletons/HotLeadsSkeleton";

interface HotLead {
  id: string;
  name: string;
  email?: string;
  job_title?: string;
  company?: string;
  compositeScore: number;
  ai_score: number;
  buying_intent?: string;
  decision_stage?: string;
  role_type?: string;
  sentiment_score: number;
  ai_analysis?: {
    next_best_action?: string;
  };
  opportunity_signals?: string[];
  risk_signals?: string[];
}

export function HotLeadsPanel({ workspaceId }: { workspaceId: string }) {
  const { session } = useAuth();
  const [hotLeads, setHotLeads] = useState<HotLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load hot leads if we have a session and valid workspaceId
    if (!session || !workspaceId) {
      console.log("Skipping hot leads load - no session or workspaceId");
      return;
    }
    loadHotLeads();
  }, [workspaceId, session]);

  const loadHotLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get the current session token
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        throw new Error("No session found. Please sign in again.");
      }

      const res = await fetch("/api/agents/contact-intelligence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "get_hot_leads",
          workspaceId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to load hot leads: ${res.status}`);
      }

      const data = await res.json();
      setHotLeads(data.hotLeads || []);
    } catch (error) {
      console.error("Failed to load hot leads:", error);
      setError(error instanceof Error ? error.message : "Failed to load hot leads");
      setHotLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalysis = async () => {
    setRefreshing(true);
    setError(null);
    try {
      // Get the current session token
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        throw new Error("No session found. Please sign in again.");
      }

      const res = await fetch("/api/agents/contact-intelligence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "analyze_workspace",
          workspaceId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Analysis failed: ${res.status}`);
      }

      await loadHotLeads();
    } catch (error) {
      console.error("Failed to refresh:", error);
      setError(error instanceof Error ? error.message : "Failed to refresh analysis");
    } finally {
      setRefreshing(false);
    }
  };

  // Show skeleton during initial load
  if (loading) {
    return <HotLeadsSkeleton items={3} />;
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            AI-Detected Hot Leads
          </CardTitle>
          <CardDescription>
            Top prospects identified by AI intelligence
          </CardDescription>
        </div>
        <Button
          onClick={refreshAnalysis}
          disabled={refreshing}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {refreshing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Refresh Analysis"
          )}
        </Button>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="bg-red-900/20 border border-red-700/30 rounded p-4 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        {hotLeads.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">No hot leads yet. Analyze contacts to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hotLeads.map((lead) => (
              <div
                key={lead.id}
                className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:border-yellow-500/50 transition"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{lead.name}</h4>
                    <p className="text-sm text-slate-400">
                      {lead.job_title} @ {lead.company}
                    </p>
                  </div>
                  <Badge className="bg-yellow-600 text-white">
                    {lead.compositeScore}
                  </Badge>
                </div>

                {/* Key Indicators */}
                <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                  <div className="bg-slate-800 rounded p-2">
                    <p className="text-slate-400">Intent</p>
                    <p className="font-semibold text-white capitalize">
                      {lead.buying_intent}
                    </p>
                  </div>
                  <div className="bg-slate-800 rounded p-2">
                    <p className="text-slate-400">Stage</p>
                    <p className="font-semibold text-white capitalize">
                      {lead.decision_stage}
                    </p>
                  </div>
                  <div className="bg-slate-800 rounded p-2">
                    <p className="text-slate-400">Role</p>
                    <p className="font-semibold text-white capitalize">
                      {lead.role_type}
                    </p>
                  </div>
                  <div className="bg-slate-800 rounded p-2">
                    <p className="text-slate-400">Sentiment</p>
                    <p className={`font-semibold ${lead.sentiment_score > 50 ? 'text-green-400' : lead.sentiment_score > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {lead.sentiment_score > 0 ? '+' : ''}{lead.sentiment_score}
                    </p>
                  </div>
                </div>

                {/* AI Score Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">AI Score</span>
                    <span className="text-white font-semibold">
                      {lead.ai_score}/100
                    </span>
                  </div>
                  <Progress value={lead.ai_score} className="h-1.5" />
                </div>

                {/* Next Action */}
                <div className="bg-blue-600/10 border border-blue-600/30 rounded p-2 mb-3">
                  <p className="text-xs text-blue-300 font-semibold mb-1">
                    Recommended Action
                  </p>
                  <p className="text-xs text-blue-200">
                    {lead.ai_analysis?.next_best_action ||
                      "Schedule follow-up call"}
                  </p>
                </div>

                {/* Signals */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {lead.opportunity_signals?.length > 0 && (
                    <div className="bg-green-600/10 border border-green-600/30 rounded p-2">
                      <p className="text-green-300 font-semibold mb-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Opportunities
                      </p>
                      <ul className="text-green-200 space-y-1">
                        {lead.opportunity_signals.slice(0, 2).map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lead.risk_signals?.length > 0 && (
                    <div className="bg-amber-600/10 border border-amber-600/30 rounded p-2">
                      <p className="text-amber-300 font-semibold mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Risks
                      </p>
                      <ul className="text-amber-200 space-y-1">
                        {lead.risk_signals.slice(0, 2).map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs"
                  >
                    Send Email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-600 text-xs"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
