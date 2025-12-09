"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/layout/Container";
import { Tabs } from "@/components/patterns/Tabs";
import { Alert } from "@/components/patterns/Alert";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceLoading) {
return;
}
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
      <Container size="lg" padding="lg" className="space-y-8">
        <Breadcrumbs items={[{ label: "Settings" }]} />
        <ErrorState
          title="Failed to Load Settings"
          message={error}
          onRetry={loadIntegrations}
        />
      </Container>
    );
  }

  if (loading) {
    return (
      <Container size="lg" padding="lg" className="space-y-8">
        <Breadcrumbs items={[{ label: "Settings" }]} />

        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      </Container>
    );
  }

  const tabItems = [
    {
      id: "integrations",
      label: "Integrations",
      content: (
        <>
          {/* Gmail Integration */}
          <Card className="bg-bg-card border border-border-subtle">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center hover:bg-bg-card/50 transition-colors p-4 rounded-lg">
                <div>
                  <h4 className="font-semibold text-text-primary">Gmail</h4>
                  <p className="text-sm text-text-secondary">
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
                        className="gap-2"
                        variant="primary"
                      >
                        {syncing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Sync Now
                      </Button>
                      <Button size="sm" variant="secondary">
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={connectGmail}
                      size="sm"
                      variant="primary"
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outlook Integration */}
          <Card className="bg-bg-card border border-border-subtle">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center hover:bg-bg-card/50 transition-colors p-4 rounded-lg">
                <div>
                  <h4 className="font-semibold text-text-primary">Outlook</h4>
                  <p className="text-sm text-text-secondary">Not connected</p>
                </div>
                <Button size="sm" variant="secondary" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Slack Integration */}
          <Card className="bg-bg-card border border-border-subtle">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center hover:bg-bg-card/50 transition-colors p-4 rounded-lg">
                <div>
                  <h4 className="font-semibold text-text-primary">Slack</h4>
                  <p className="text-sm text-text-secondary">Get notified of hot leads and email events</p>
                </div>
                <Button size="sm" variant="primary">
                  Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ),
    },
    {
      id: "account",
      label: "Account",
      content: (
        <Card className="bg-bg-card border border-border-subtle">
          <CardContent className="pt-6">
            <Alert
              type="info"
              title="Account Settings"
              description="Additional account settings will be available here in future updates."
            />
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <Container size="lg" padding="lg" className="space-y-8">
      <Breadcrumbs items={[{ label: "Settings" }]} />

      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
          Settings
        </h1>
        <p className="text-text-secondary">Manage integrations and preferences</p>
      </div>

      {/* Tabs for different settings sections */}
      <Tabs items={tabItems} />
    </Container>
  );
}
