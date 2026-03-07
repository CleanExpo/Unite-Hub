"use client";

import { useState, useEffect } from "react";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceLoading) return;
    loadIntegrations();
  }, [workspaceLoading]);

  const loadIntegrations = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("/api/integrations/list", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to load integrations");
      }
      const { integrations } = await res.json();
      setIntegrations(integrations || []);
    } catch (error) {
      console.error("Failed to load integrations:", error);
      setError(error instanceof Error ? error.message : "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  };

  const connectGmail = async () => {
    try {
      if (!workspaceId) {
        alert("No organization selected");
        return;
      }

      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert("Not authenticated");
        return;
      }

      const res = await fetch("/api/integrations/gmail/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ orgId: workspaceId }),
      });

      const { authUrl } = await res.json();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to connect Gmail:", error);
    }
  };

  const syncEmails = async (integrationId: string) => {
    setSyncing(true);
    try {
      if (!workspaceId) {
        alert("No organization selected");
        return;
      }

      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert("Not authenticated");
        setSyncing(false);
        return;
      }

      const res = await fetch("/api/integrations/gmail/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          integrationId,
          workspaceId,
        }),
      });

      const { imported } = await res.json();
      alert(`Imported ${imported} emails`);
      await loadIntegrations();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Breadcrumbs items={[{ label: "Settings" }]} />
        <div className="mt-6">
          <ErrorState
            title="Failed to Load Settings"
            message={error}
            onRetry={loadIntegrations}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <Breadcrumbs items={[{ label: "Settings" }]} />

        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-white/[0.04]" />
          <Skeleton className="h-4 w-64 bg-white/[0.04]" />
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-6 border-b border-white/[0.06]">
            <Skeleton className="h-4 w-48 bg-white/[0.04]" />
            <Skeleton className="h-3 w-64 mt-2 bg-white/[0.04]" />
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-white/[0.04]" />
                  <Skeleton className="h-3 w-32 bg-white/[0.04]" />
                </div>
                <Skeleton className="h-8 w-24 bg-white/[0.04]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <Breadcrumbs items={[{ label: "Settings" }]} />

      <div>
        <h1 className="text-2xl font-mono font-semibold text-white/90 mb-1">
          Settings
        </h1>
        <p className="text-sm font-mono text-white/40">Manage integrations and account</p>
      </div>

      {/* Email Integrations */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#00F5FF]" />
            <h2 className="text-xs font-mono text-white/40 uppercase tracking-widest">
              Email Integrations
            </h2>
          </div>
          <p className="mt-1 text-sm font-mono text-white/40">Connect your email accounts</p>
        </div>

        <div className="p-6 space-y-3">
          {/* Gmail */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-mono font-semibold text-white/90">Gmail</h4>
              <p className="text-xs font-mono text-white/40 mt-0.5">
                {integrations.find((i) => i.provider === "gmail")
                  ? `Connected: ${integrations.find((i) => i.provider === "gmail")?.account_email}`
                  : "Not connected"}
              </p>
            </div>
            <div className="flex gap-2">
              {integrations.find((i) => i.provider === "gmail") ? (
                <>
                  <button
                    onClick={() =>
                      syncEmails(
                        integrations.find((i) => i.provider === "gmail")?.id
                      )
                    }
                    disabled={syncing}
                    className="flex items-center gap-1.5 bg-[#00F5FF] text-[#050505] font-mono text-sm rounded-sm px-4 py-2 disabled:opacity-40"
                  >
                    {syncing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Sync Now
                  </button>
                  <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-4 py-2">
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={connectGmail}
                  className="bg-[#00F5FF] text-[#050505] font-mono text-sm rounded-sm px-4 py-2"
                >
                  Connect
                </button>
              )}
            </div>
          </div>

          {/* Outlook */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-mono font-semibold text-white/90">Outlook</h4>
              <p className="text-xs font-mono text-white/40 mt-0.5">Not connected</p>
            </div>
            <button
              disabled
              className="bg-white/[0.04] border border-white/[0.06] text-white/20 font-mono text-sm rounded-sm px-4 py-2 cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>

          {/* Slack */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-mono font-semibold text-white/90">Slack</h4>
              <p className="text-xs font-mono text-white/40 mt-0.5">Get notified of hot leads and email events</p>
            </div>
            <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm rounded-sm px-4 py-2">
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
