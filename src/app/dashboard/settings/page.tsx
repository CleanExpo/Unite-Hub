"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function SettingsPage() {
  const { currentOrganization } = useAuth();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/list");
      const { integrations } = await res.json();
      setIntegrations(integrations || []);
    } catch (error) {
      console.error("Failed to load integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const connectGmail = async () => {
    try {
      const orgId = currentOrganization?.org_id;
      if (!orgId) {
        alert("No organization selected");
        return;
      }

      const res = await fetch("/api/integrations/gmail/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
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
      const workspaceId = currentOrganization?.org_id;
      if (!workspaceId) {
        alert("No organization selected");
        return;
      }

      const res = await fetch("/api/integrations/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Settings" }]} />

      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
          Settings
        </h1>
        <p className="text-slate-400">Manage integrations and account</p>
      </div>

      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white text-xl font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Integrations
          </CardTitle>
          <CardDescription className="text-slate-400">Connect your email accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 flex justify-between items-center hover:border-slate-600/50 transition-all">
            <div>
              <h4 className="font-semibold text-white">Gmail</h4>
              <p className="text-sm text-slate-400">
                {integrations.find((i) => i.provider === "gmail")
                  ? `Connected: ${integrations.find((i) => i.provider === "gmail")?.account_email}`
                  : "Not connected"}
              </p>
            </div>
            <div className="flex gap-2">
              {integrations.find((i) => i.provider === "gmail") ? (
                <>
                  <Button
                    onClick={() =>
                      syncEmails(
                        integrations.find((i) => i.provider === "gmail")?.id
                      )
                    }
                    disabled={syncing}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 gap-2"
                  >
                    {syncing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Sync Now
                  </Button>
                  <Button size="sm" variant="outline" className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm text-slate-300 hover:bg-slate-700/50 hover:border-slate-600/50">
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  onClick={connectGmail}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50"
                >
                  Connect
                </Button>
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 flex justify-between items-center hover:border-slate-600/50 transition-all">
            <div>
              <h4 className="font-semibold text-white">Outlook</h4>
              <p className="text-sm text-slate-400">Not connected</p>
            </div>
            <Button size="sm" className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-400" disabled>
              Coming Soon
            </Button>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 flex justify-between items-center hover:border-slate-600/50 transition-all">
            <div>
              <h4 className="font-semibold text-white">Slack</h4>
              <p className="text-sm text-slate-400">Get notified of hot leads and email events</p>
            </div>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50">
              Connect
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
