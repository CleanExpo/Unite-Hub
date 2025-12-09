'use client';

/**
 * Connected Apps Grid
 *
 * Grid layout for displaying connected app providers.
 */

import React, { useState, useEffect } from 'react';
import { ProviderCard } from './ProviderCard';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ConnectedApp {
  id: string;
  provider: 'google' | 'microsoft';
  providerEmail: string | null;
  status: 'active' | 'expired' | 'revoked' | 'error';
  lastSyncAt: string | null;
  activeServices: string[];
}

interface Provider {
  id: 'google' | 'microsoft';
  displayName: string;
  description: string;
}

export function ConnectedAppsGrid() {
  const { currentOrganization, session } = useAuth();
  const [apps, setApps] = useState<ConnectedApp[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [syncingApp, setSyncingApp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const workspaceId = currentOrganization?.org_id;

  // Fetch connected apps
  useEffect(() => {
    if (!workspaceId || !session?.access_token) {
return;
}

    const fetchApps = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/connected-apps?workspaceId=${workspaceId}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch connected apps');
        }

        const data = await response.json();
        setApps(data.apps || []);
        setProviders(data.availableProviders || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApps();
  }, [workspaceId, session?.access_token]);

  // Check for OAuth callback success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      const provider = params.get('provider');
      setSuccessMessage(`Successfully connected to ${provider === 'google' ? 'Google Workspace' : 'Microsoft 365'}`);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      // Auto-dismiss success message
      setTimeout(() => setSuccessMessage(null), 5000);
    }
    if (params.get('error')) {
      setError(params.get('error_description') || params.get('error') || 'Connection failed');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnect = async (provider: 'google' | 'microsoft') => {
    if (!workspaceId || !session?.access_token) {
return;
}

    try {
      setConnectingProvider(provider);
      setError(null);

      const response = await fetch('/api/connected-apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          provider,
          workspaceId,
          returnUrl: window.location.pathname,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to initiate connection');
      }

      const { authUrl } = await response.json();
      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (appId: string) => {
    if (!workspaceId || !session?.access_token) {
return;
}

    if (!confirm('Are you sure you want to disconnect this app? This will remove all synced emails.')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/connected-apps/${appId}?workspaceId=${workspaceId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to disconnect app');
      }

      setApps((prev) => prev.filter((a) => a.id !== appId));
      setSuccessMessage('App disconnected successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    }
  };

  const handleSync = async (appId: string) => {
    if (!workspaceId || !session?.access_token) {
return;
}

    try {
      setSyncingApp(appId);
      setError(null);

      const response = await fetch('/api/email-intel/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workspaceId,
          connectedAppId: appId,
          syncType: 'incremental',
        }),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const { progress } = await response.json();
      setSuccessMessage(
        `Synced ${progress.threadsSynced} threads, ${progress.messagesSynced} messages`
      );
      setTimeout(() => setSuccessMessage(null), 5000);

      // Update last sync time
      setApps((prev) =>
        prev.map((a) =>
          a.id === appId ? { ...a, lastSyncAt: new Date().toISOString() } : a
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncingApp(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getConnectedApp = (providerId: string) =>
    apps.find((a) => a.provider === providerId);

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500 bg-green-500/10 p-4 text-green-700 dark:text-green-400">
          <CheckCircle className="h-5 w-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Provider Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {providers.map((provider) => {
          const connectedApp = getConnectedApp(provider.id);
          return (
            <ProviderCard
              key={provider.id}
              provider={provider.id}
              displayName={provider.displayName}
              description={provider.description}
              isConnected={!!connectedApp}
              status={connectedApp?.status}
              email={connectedApp?.providerEmail}
              lastSyncAt={
                connectedApp?.lastSyncAt
                  ? new Date(connectedApp.lastSyncAt)
                  : null
              }
              activeServices={connectedApp?.activeServices || []}
              onConnect={() => handleConnect(provider.id)}
              onDisconnect={() =>
                connectedApp && handleDisconnect(connectedApp.id)
              }
              onSync={() => connectedApp && handleSync(connectedApp.id)}
              isLoading={connectingProvider === provider.id}
              isSyncing={syncingApp === connectedApp?.id}
            />
          );
        })}
      </div>

      {/* Empty State */}
      {providers.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No providers available. Please check your configuration.
          </p>
        </div>
      )}
    </div>
  );
}

export default ConnectedAppsGrid;
