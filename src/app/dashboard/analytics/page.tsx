"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Mail, Target, Activity, Eye, DollarSign, Megaphone, CheckSquare } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/contexts/AuthContext";

interface AnalyticsData {
  contactsCount: number;
  dealsCount: number;
  pipelineValue: number;
  emailsSent: number;
  activeCampaigns: number;
  tasksCompleted: number;
  tasksTotal: number;
}

export default function AnalyticsPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const { session } = useAuth();
  const [isInTrial, setIsInTrial] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    contactsCount: 0, dealsCount: 0, pipelineValue: 0,
    emailsSent: 0, activeCampaigns: 0, tasksCompleted: 0, tasksTotal: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${session.access_token}` };

      // Fetch real data from existing APIs in parallel
      const [contactsRes, dealsRes, campaignsRes, emailsRes, tasksRes, trialRes] = await Promise.allSettled([
        fetch(`/api/contacts?workspaceId=${workspaceId}&pageSize=1`, { headers }),
        fetch(`/api/deals?workspaceId=${workspaceId}&pageSize=1&status=open`, { headers }),
        fetch(`/api/campaigns?workspaceId=${workspaceId}&pageSize=1&status=active`, { headers }),
        fetch(`/api/v1/emails?workspaceId=${workspaceId}&limit=1&status=sent`, { headers }),
        fetch(`/api/founder/ops/tasks?workspaceId=${workspaceId}`, { headers }),
        fetch(`/api/trial/status?workspaceId=${workspaceId}`, { headers }),
      ]);

      const data: AnalyticsData = {
        contactsCount: 0, dealsCount: 0, pipelineValue: 0,
        emailsSent: 0, activeCampaigns: 0, tasksCompleted: 0, tasksTotal: 0,
      };

      if (contactsRes.status === "fulfilled" && contactsRes.value.ok) {
        const d = await contactsRes.value.json();
        data.contactsCount = d.meta?.totalItems || d.data?.contacts?.length || 0;
      }

      if (dealsRes.status === "fulfilled" && dealsRes.value.ok) {
        const d = await dealsRes.value.json();
        const deals = d.data?.deals || [];
        data.dealsCount = d.meta?.totalItems || deals.length;
        data.pipelineValue = deals.reduce((sum: number, deal: { value?: number }) => sum + (deal.value || 0), 0);
      }

      if (campaignsRes.status === "fulfilled" && campaignsRes.value.ok) {
        const d = await campaignsRes.value.json();
        data.activeCampaigns = d.meta?.totalItems || d.data?.campaigns?.length || 0;
      }

      if (emailsRes.status === "fulfilled" && emailsRes.value.ok) {
        const d = await emailsRes.value.json();
        data.emailsSent = d.pagination?.total || d.emails?.length || 0;
      }

      if (tasksRes.status === "fulfilled" && tasksRes.value.ok) {
        const d = await tasksRes.value.json();
        const tasks = d.tasks || [];
        data.tasksTotal = tasks.length;
        data.tasksCompleted = tasks.filter((t: { status: string }) =>
          t.status === "completed" || t.status === "approved"
        ).length;
      }

      if (trialRes.status === "fulfilled" && trialRes.value.ok) {
        const d = await trialRes.value.json();
        setIsInTrial(d.isTrialActive || false);
      }

      setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, session?.access_token]);

  useEffect(() => {
    if (workspaceId && session?.access_token) fetchAnalytics();
  }, [workspaceId, session?.access_token, fetchAnalytics]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0 }).format(value);

  const metrics = [
    { label: "Total Contacts", value: analytics.contactsCount.toLocaleString(), icon: Users, color: "text-blue-400", bgColor: "bg-blue-500/10" },
    { label: "Open Deals", value: analytics.dealsCount.toLocaleString(), icon: Target, color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
    { label: "Pipeline Value", value: formatCurrency(analytics.pipelineValue), icon: DollarSign, color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
    { label: "Emails Sent", value: analytics.emailsSent.toLocaleString(), icon: Mail, color: "text-purple-400", bgColor: "bg-purple-500/10" },
    { label: "Active Campaigns", value: analytics.activeCampaigns.toLocaleString(), icon: Megaphone, color: "text-orange-400", bgColor: "bg-orange-500/10" },
    { label: "Tasks Done", value: `${analytics.tasksCompleted}/${analytics.tasksTotal}`, icon: CheckSquare, color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
  ];

  if (workspaceLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-800 rounded w-48" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-slate-800 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">Track performance metrics and business insights</p>
        {isInTrial && (
          <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-blue-200">
              <strong>Read-only mode:</strong> During your trial, analytics are viewable but not editable.
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-slate-800/30 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((m) => (
            <Card key={m.label} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${m.bgColor}`}>
                    <m.icon className={`h-5 w-5 ${m.color}`} />
                  </div>
                  <span className="text-xs text-slate-400">{m.label}</span>
                </div>
                <p className="text-2xl font-bold text-white">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Deal Conversion Funnel */}
            <div>
              <p className="text-sm text-slate-400 mb-2">Deal Pipeline Health</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-700/50 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-emerald-500 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(100, analytics.dealsCount * 10)}%` }}
                  />
                </div>
                <span className="text-sm text-white font-medium">{analytics.dealsCount} open deals</span>
              </div>
            </div>

            {/* Task Completion Rate */}
            <div>
              <p className="text-sm text-slate-400 mb-2">Task Completion Rate</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-700/50 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-emerald-500 h-3 rounded-full transition-all"
                    style={{ width: `${analytics.tasksTotal > 0 ? (analytics.tasksCompleted / analytics.tasksTotal) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm text-white font-medium">
                  {analytics.tasksTotal > 0 ? Math.round((analytics.tasksCompleted / analytics.tasksTotal) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Email Activity */}
            <div>
              <p className="text-sm text-slate-400 mb-2">Email Activity</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-700/50 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(100, analytics.emailsSent * 2)}%` }}
                  />
                </div>
                <span className="text-sm text-white font-medium">{analytics.emailsSent} sent</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
