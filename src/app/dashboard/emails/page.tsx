"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail, Send, Inbox, Star, Clock, ArrowRight, RefreshCw,
  Search, ExternalLink, Reply, Trash2, Archive, Plus, Link2, Unlink
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/contexts/AuthContext";

interface GmailIntegration {
  id: string;
  email_address: string;
  account_label: string;
  provider: string;
  is_primary: boolean;
  sync_enabled: boolean;
  is_active: boolean;
  last_sync_at: string | null;
  sync_error: string | null;
  created_at: string;
}

interface EmailRecord {
  id: string;
  to: string;
  subject: string;
  status: string;
  created_at: string;
  scheduled_at: string | null;
  contact?: { id: string; email: string; full_name: string } | null;
  campaign?: { id: string; name: string } | null;
}

export default function EmailsPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const { session } = useAuth();
  const [integrations, setIntegrations] = useState<GmailIntegration[]>([]);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [emailStats, setEmailStats] = useState({ sent: 0, queued: 0, failed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchIntegrations = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;
    try {
      const res = await fetch(`/api/integrations/gmail/list?workspaceId=${workspaceId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
      }
    } catch (err) {
      console.error("Failed to fetch integrations:", err);
    }
  }, [workspaceId, session?.access_token]);

  const fetchEmails = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({ workspaceId, limit: "50" });
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`/api/v1/emails?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const allEmails: EmailRecord[] = data.emails || [];
        setEmails(allEmails);

        // Compute stats from real data
        const sent = allEmails.filter((e) => e.status === "sent").length;
        const queued = allEmails.filter((e) => e.status === "queued" || e.status === "sending").length;
        const failed = allEmails.filter((e) => e.status === "failed" || e.status === "bounced").length;
        setEmailStats({ sent, queued, failed, total: allEmails.length });
      }
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, session?.access_token, searchTerm]);

  useEffect(() => {
    if (workspaceId && session?.access_token) {
      fetchIntegrations();
      fetchEmails();
    }
  }, [workspaceId, session?.access_token, fetchIntegrations, fetchEmails]);

  const handleSyncAll = async () => {
    if (!workspaceId || !session?.access_token) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/integrations/gmail/sync-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ workspaceId }),
      });
      if (res.ok) {
        await fetchEmails();
        await fetchIntegrations();
      }
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleConnectGmail = async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch("/api/integrations/gmail/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ orgId: workspaceId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        }
      }
    } catch (err) {
      console.error("Connect failed:", err);
    }
  };

  const stats = [
    { label: "Sent", value: emailStats.sent.toString(), icon: Send, color: "text-blue-400", bgColor: "bg-blue-500/10" },
    { label: "Queued", value: emailStats.queued.toString(), icon: Clock, color: "text-purple-400", bgColor: "bg-purple-500/10" },
    { label: "Failed", value: emailStats.failed.toString(), icon: Mail, color: "text-red-400", bgColor: "bg-red-500/10" },
    { label: "Total", value: emailStats.total.toString(), icon: Inbox, color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  ];

  if (workspaceLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-800 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-800 rounded" />)}
          </div>
          <div className="h-96 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your email integrations, send emails, and track performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSyncAll}
            disabled={syncing}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/dashboard/emails/sequences">
              View Sequences <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gmail Integrations */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Mail className="w-5 h-5" /> Gmail Accounts
            </CardTitle>
            <Button size="sm" onClick={handleConnectGmail} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-1" /> Connect Gmail
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Mail className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No Gmail accounts connected</p>
              <p className="text-xs mt-1">Connect your Gmail to sync emails and send from Unite-Hub</p>
            </div>
          ) : (
            <div className="space-y-3">
              {integrations.map((integ) => (
                <div
                  key={integ.id}
                  className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${integ.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {integ.account_label || integ.email_address}
                      </p>
                      <p className="text-xs text-slate-500">{integ.email_address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {integ.is_primary && (
                      <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-400/30">Primary</Badge>
                    )}
                    {integ.sync_enabled ? (
                      <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-400/30">Sync On</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-600">Sync Off</Badge>
                    )}
                    {integ.last_sync_at && (
                      <span className="text-[11px] text-slate-500">
                        Last sync: {new Date(integ.last_sync_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                    {integ.sync_error && (
                      <span className="text-[11px] text-red-400">{integ.sync_error}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Emails */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">Recent Emails</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 h-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-700/30 rounded animate-pulse" />
              ))}
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Send className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No emails found</p>
              <p className="text-xs mt-1">Send your first email or sync your Gmail account</p>
            </div>
          ) : (
            <div className="space-y-1">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      email.status === "sent" ? "bg-emerald-400" :
                      email.status === "queued" || email.status === "sending" ? "bg-yellow-400" :
                      email.status === "failed" || email.status === "bounced" ? "bg-red-400" :
                      "bg-slate-400"
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{email.subject || "(No subject)"}</p>
                      <p className="text-xs text-slate-500 truncate">
                        To: {email.contact?.full_name || email.to}
                        {email.campaign && <span className="ml-2">• {email.campaign.name}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        email.status === "sent" ? "text-emerald-400 border-emerald-400/30" :
                        email.status === "queued" ? "text-yellow-400 border-yellow-400/30" :
                        email.status === "failed" ? "text-red-400 border-red-400/30" :
                        "text-slate-400 border-slate-600"
                      }`}
                    >
                      {email.status}
                    </Badge>
                    <span className="text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(email.created_at).toLocaleDateString("en-AU", {
                        day: "numeric", month: "short",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Mail className="h-5 w-5" /> Email Sequences
            </CardTitle>
            <CardDescription className="text-slate-400">
              Create automated email sequences for lead nurturing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full border-slate-700 text-slate-300 hover:text-white">
              <Link href="/dashboard/emails/sequences">Manage Sequences</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Archive className="h-5 w-5" /> Email Templates
            </CardTitle>
            <CardDescription className="text-slate-400">
              Browse and create reusable email templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full border-slate-700 text-slate-300 hover:text-white">
              <Link href="/dashboard/email-templates">View Templates</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
