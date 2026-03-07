"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Mail, Send, Inbox, Clock, ArrowRight, RefreshCw,
  Search, Archive, Plus,
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
    { label: "Sent", value: emailStats.sent.toString(), icon: Send, color: "text-[#00F5FF]", bgColor: "bg-[#00F5FF]/10" },
    { label: "Queued", value: emailStats.queued.toString(), icon: Clock, color: "text-purple-400", bgColor: "bg-purple-500/10" },
    { label: "Failed", value: emailStats.failed.toString(), icon: Mail, color: "text-[#FF4444]", bgColor: "bg-[#FF4444]/10" },
    { label: "Total", value: emailStats.total.toString(), icon: Inbox, color: "text-[#00FF88]", bgColor: "bg-[#00FF88]/10" },
  ];

  if (workspaceLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/[0.03] rounded-sm w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-white/[0.03] rounded-sm" />
            ))}
          </div>
          <div className="h-96 bg-white/[0.03] rounded-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-mono font-bold text-white/90">Email Management</h1>
          <p className="text-sm text-white/40 mt-1">
            Manage your email integrations, send emails, and track performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSyncAll}
            disabled={syncing}
            className="text-white/40 hover:text-white/90"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          </Button>
          <Link
            href="/dashboard/emails/sequences"
            className="bg-[#00F5FF] text-[#050505] font-mono text-sm rounded-sm px-4 py-2 flex items-center gap-2 hover:bg-[#00F5FF]/90 transition-colors"
          >
            View Sequences <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-sm ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white/90">{stat.value}</p>
                  <p className="text-xs text-white/40">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Gmail Integrations */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white/90 text-base font-mono flex items-center gap-2">
                <Mail className="w-5 h-5" /> Gmail Accounts
              </CardTitle>
              <button
                onClick={handleConnectGmail}
                className="bg-[#00F5FF] text-[#050505] font-mono text-sm rounded-sm px-4 py-2 flex items-center gap-1.5 hover:bg-[#00F5FF]/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Connect Gmail
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {integrations.length === 0 ? (
              <div className="text-center py-8 text-white/40">
                <Mail className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No Gmail accounts connected</p>
                <p className="text-xs mt-1 text-white/20">
                  Connect your Gmail to sync emails and send from Unite-Group
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {integrations.map((integ) => (
                  <div
                    key={integ.id}
                    className="flex items-center justify-between p-3 bg-white/[0.02] rounded-sm border border-white/[0.06]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          integ.is_active ? "bg-[#00FF88]" : "bg-[#FF4444]"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-white/90">
                          {integ.account_label || integ.email_address}
                        </p>
                        <p className="text-xs text-white/40">{integ.email_address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {integ.is_primary && (
                        <Badge variant="outline" className="text-[10px] text-[#00F5FF] border-[#00F5FF]/30">
                          Primary
                        </Badge>
                      )}
                      {integ.sync_enabled ? (
                        <Badge variant="outline" className="text-[10px] text-[#00FF88] border-[#00FF88]/30">
                          Sync On
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-white/40 border-white/[0.08]">
                          Sync Off
                        </Badge>
                      )}
                      {integ.last_sync_at && (
                        <span className="text-[11px] text-white/40">
                          Last sync:{" "}
                          {new Date(integ.last_sync_at).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      {integ.sync_error && (
                        <span className="text-[11px] text-[#FF4444]">{integ.sync_error}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Emails */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white/90 text-base font-mono">Recent Emails</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white/[0.04] border border-white/[0.06] text-white/90 placeholder:text-white/20 rounded-sm h-8 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 bg-white/[0.03] rounded-sm animate-pulse" />
                ))}
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <Send className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No emails found</p>
                <p className="text-xs mt-1 text-white/20">
                  Send your first email or sync your Gmail account
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className="flex items-center justify-between p-3 rounded-sm border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          email.status === "sent"
                            ? "bg-[#00FF88]"
                            : email.status === "queued" || email.status === "sending"
                            ? "bg-[#FFB800]"
                            : email.status === "failed" || email.status === "bounced"
                            ? "bg-[#FF4444]"
                            : "bg-white/40"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white/90 truncate">
                          {email.subject || "(No subject)"}
                        </p>
                        <p className="text-xs text-white/40 truncate">
                          To: {email.contact?.full_name || email.to}
                          {email.campaign && (
                            <span className="ml-2">• {email.campaign.name}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          email.status === "sent"
                            ? "text-[#00FF88] border-[#00FF88]/30"
                            : email.status === "queued"
                            ? "text-[#FFB800] border-[#FFB800]/30"
                            : email.status === "failed"
                            ? "text-[#FF4444] border-[#FF4444]/30"
                            : "text-white/40 border-white/[0.08]"
                        }`}
                      >
                        {email.status}
                      </Badge>
                      <span className="text-[11px] text-white/40 whitespace-nowrap">
                        {new Date(email.created_at).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Card className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white/90 font-mono text-base">
              <Mail className="h-5 w-5" /> Email Sequences
            </CardTitle>
            <CardDescription className="text-white/40">
              Create automated email sequences for lead nurturing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/emails/sequences"
              className="block w-full text-center bg-white/[0.04] border border-white/[0.06] text-white/60 rounded-sm px-4 py-2 font-mono text-sm hover:text-white/90 hover:bg-white/[0.06] transition-colors"
            >
              Manage Sequences
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white/90 font-mono text-base">
              <Archive className="h-5 w-5" /> Email Templates
            </CardTitle>
            <CardDescription className="text-white/40">
              Browse and create reusable email templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/email-templates"
              className="block w-full text-center bg-white/[0.04] border border-white/[0.06] text-white/60 rounded-sm px-4 py-2 font-mono text-sm hover:text-white/90 hover:bg-white/[0.06] transition-colors"
            >
              View Templates
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
