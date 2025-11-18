"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Mail,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useToast } from "@/hooks/use-toast";
import { supabaseBrowser } from "@/lib/supabase";

interface GmailIntegration {
  id: string;
  email_address: string;
  account_label: string | null;
  provider: string;
  is_primary: boolean;
  sync_enabled: boolean;
  is_active: boolean;
  last_sync_at: string | null;
  sync_error: string | null;
  created_at: string;
}

export default function IntegrationsPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<GmailIntegration[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editingLabel, setEditingLabel] = useState<{
    id: string;
    label: string;
  } | null>(null);

  useEffect(() => {
    if (workspaceLoading) return;
    loadIntegrations();
  }, [workspaceId, workspaceLoading]);

  const loadIntegrations = async () => {
    if (!workspaceId) return;

    setLoading(true);
    try {
      // Get session for auth
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      const res = await fetch(
        `/api/integrations/gmail/list?workspaceId=${workspaceId}`,
        {
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
          },
        }
      );
      const { integrations: data } = await res.json();
      setIntegrations(data || []);
    } catch (error) {
      console.error("Failed to load integrations:", error);
      toast({
        title: "Error",
        description: "Failed to load Gmail accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const connectGmail = async () => {
    try {
      if (!workspaceId) {
        toast({
          title: "Error",
          description: "No organization selected",
          variant: "destructive",
        });
        return;
      }

      // Get session for auth
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      const res = await fetch("/api/integrations/gmail/connect-multi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ orgId: workspaceId, workspaceId }),
      });

      const { authUrl } = await res.json();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to connect Gmail:", error);
      toast({
        title: "Error",
        description: "Failed to start Gmail connection",
        variant: "destructive",
      });
    }
  };

  const syncAllAccounts = async () => {
    setSyncing(true);
    try {
      if (!workspaceId) {
        toast({
          title: "Error",
          description: "No organization selected",
          variant: "destructive",
        });
        return;
      }

      // Get session for auth
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        setSyncing(false);
        return;
      }

      const res = await fetch("/api/integrations/gmail/sync-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ workspaceId }),
      });

      const { totalImported, hasErrors, errors } = await res.json();

      if (hasErrors) {
        toast({
          title: "Partial Success",
          description: `Imported ${totalImported} emails, but ${errors.length} account(s) had errors`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Imported ${totalImported} emails from all accounts`,
        });
      }

      await loadIntegrations();
    } catch (error) {
      console.error("Sync failed:", error);
      toast({
        title: "Error",
        description: "Failed to sync emails",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const updateLabel = async (integrationId: string, label: string) => {
    try {
      // Get session for auth
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      await fetch("/api/integrations/gmail/update-label", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ integrationId, label }),
      });

      toast({
        title: "Success",
        description: "Account label updated",
      });

      await loadIntegrations();
      setEditingLabel(null);
    } catch (error) {
      console.error("Update label failed:", error);
      toast({
        title: "Error",
        description: "Failed to update label",
        variant: "destructive",
      });
    }
  };

  const setPrimary = async (integrationId: string) => {
    try {
      if (!workspaceId) return;

      // Get session for auth
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      await fetch("/api/integrations/gmail/set-primary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ workspaceId, integrationId }),
      });

      toast({
        title: "Success",
        description: "Primary account updated",
      });

      await loadIntegrations();
    } catch (error) {
      console.error("Set primary failed:", error);
      toast({
        title: "Error",
        description: "Failed to set primary account",
        variant: "destructive",
      });
    }
  };

  const toggleSync = async (integrationId: string, enabled: boolean) => {
    try {
      // Get session for auth
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      await fetch("/api/integrations/gmail/toggle-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ integrationId, enabled }),
      });

      toast({
        title: "Success",
        description: enabled ? "Sync enabled" : "Sync disabled",
      });

      await loadIntegrations();
    } catch (error) {
      console.error("Toggle sync failed:", error);
      toast({
        title: "Error",
        description: "Failed to toggle sync",
        variant: "destructive",
      });
    }
  };

  const disconnectAccount = async (integrationId: string) => {
    if (!confirm("Are you sure you want to disconnect this account?")) return;

    try {
      // Get session for auth
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        toast({
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      await fetch("/api/integrations/gmail/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ integrationId }),
      });

      toast({
        title: "Success",
        description: "Account disconnected",
      });

      await loadIntegrations();
    } catch (error) {
      console.error("Disconnect failed:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect account",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs
        items={[{ label: "Settings" }, { label: "Integrations" }]}
      />

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Email Integrations
          </h1>
          <p className="text-slate-400">
            Connect and manage multiple Gmail accounts
          </p>
        </div>
        <Button
          onClick={syncAllAccounts}
          disabled={syncing || integrations.length === 0}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          {syncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Sync All Accounts
        </Button>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Gmail Accounts
          </CardTitle>
          <CardDescription>
            {integrations.length === 0
              ? "No Gmail accounts connected"
              : `${integrations.length} account${integrations.length > 1 ? "s" : ""} connected`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
            </div>
          ) : integrations.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">No Gmail accounts connected yet</p>
              <Button onClick={connectGmail} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Connect Gmail Account
              </Button>
            </div>
          ) : (
            <>
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="bg-slate-700 border border-slate-600 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-white">
                          {integration.account_label || integration.email_address}
                        </h4>
                        {integration.is_primary && (
                          <Badge variant="default" className="bg-blue-600">
                            <Star className="w-3 h-3 mr-1" />
                            Primary
                          </Badge>
                        )}
                        {integration.sync_error && (
                          <Badge variant="destructive">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Sync Error
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">
                        {integration.email_address}
                      </p>
                      {integration.last_sync_at && (
                        <p className="text-xs text-slate-500 mt-1">
                          Last synced:{" "}
                          {new Date(integration.last_sync_at).toLocaleString()}
                        </p>
                      )}
                      {integration.sync_error && (
                        <p className="text-xs text-red-400 mt-1">
                          Error: {integration.sync_error}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`sync-${integration.id}`}
                          className="text-sm text-slate-300"
                        >
                          Sync
                        </Label>
                        <Switch
                          id={`sync-${integration.id}`}
                          checked={integration.sync_enabled}
                          onCheckedChange={(checked) =>
                            toggleSync(integration.id, checked)
                          }
                        />
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setEditingLabel({
                            id: integration.id,
                            label: integration.account_label || "",
                          })
                        }
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      {!integration.is_primary && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPrimary(integration.id)}
                          title="Set as primary"
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => disconnectAccount(integration.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                onClick={connectGmail}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Gmail Account
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Label Dialog */}
      <Dialog open={!!editingLabel} onOpenChange={() => setEditingLabel(null)}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Account Label</DialogTitle>
            <DialogDescription>
              Give this account a friendly name for easy identification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="label" className="text-slate-300">
                Account Label
              </Label>
              <Input
                id="label"
                value={editingLabel?.label || ""}
                onChange={(e) =>
                  setEditingLabel({
                    ...editingLabel!,
                    label: e.target.value,
                  })
                }
                placeholder="e.g., Personal, Work, Sales"
                className="bg-slate-700 border-slate-600 text-white mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditingLabel(null)}
              className="text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                editingLabel &&
                updateLabel(editingLabel.id, editingLabel.label)
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
