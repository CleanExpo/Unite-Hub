'use client';

import { useEffect } from 'react';
import { AlertCircle, Bell, ShieldAlert, Zap, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import useSWR from 'swr';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useGuardianRealtime } from '@/hooks/useGuardianRealtime';

/**
 * Guardian Alerts Dashboard (G43)
 * /guardian/alerts/dashboard
 *
 * Real-time dashboard with live updates via Supabase Realtime
 * Auto-refreshes data via SWR every 30s
 */

interface AlertEventItem {
  id: string;
  rule_id: string;
  severity: string;
  source: string;
  message: string;
  created_at: string;
}

interface IncidentItem {
  id: string;
  severity: string;
  status: string;
  title: string;
  created_at: string;
}

interface NotificationItem {
  id: string;
  type: string;
  severity: string | null;
  channel: string;
  status: string;
  created_at: string;
}

interface ActivityResponse {
  alerts?: AlertEventItem[];
  incidents?: IncidentItem[];
  notifications?: NotificationItem[];
  error?: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref
}: {
  icon: typeof AlertCircle;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="py-12 text-center px-4">
      <Icon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Button size="sm" variant="outline" asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}

export default function GuardianAlertsDashboardPage() {
  const { user } = useAuth();
  const { stats, isConnected } = useGuardianRealtime(user?.id || null);

  const { data, error, isLoading, mutate } = useSWR<ActivityResponse>(
    '/api/guardian/activity',
    fetcher,
    {
      refreshInterval: 30000,      // Auto-refresh every 30s
      dedupingInterval: 5000,       // Dedupe requests within 5s
      revalidateOnFocus: true,      // Refresh on tab focus
    }
  );

  // Auto-refresh when realtime events occur
  useEffect(() => {
    if (stats.lastUpdate) {
      mutate();
    }
  }, [stats.lastUpdate, mutate]);

  const alerts = data?.alerts ?? [];
  const incidents = data?.incidents ?? [];
  const notifications = data?.notifications ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Guardian Alerts Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Unified view of Guardian alerts, incidents, and notifications for this workspace.
        </p>
      </header>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Live updates enabled. Data refreshes automatically.
          </p>
          <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
            <Wifi className={`h-3 w-3 mr-1 ${isConnected ? 'animate-pulse' : ''}`} />
            {isConnected ? 'Live' : 'Connecting...'}
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={() => mutate()}
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error?.error || data?.error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h3 className="text-sm font-medium mb-2">Guardian activity feed unavailable</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {error?.error || data?.error}
          </p>
          <Button size="sm" onClick={() => mutate()}>
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <LoadingSkeleton />
          <LoadingSkeleton />
          <LoadingSkeleton />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Alerts Column */}
          <section className="rounded-xl border bg-card overflow-hidden">
            <header className="border-b bg-muted/40 px-4 py-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium">Recent Alerts</span>
              {alerts.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {alerts.length}
                </span>
              )}
            </header>
            {alerts.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No alerts yet"
                description="Guardian alerts will appear here when rules are triggered by telemetry events or simulations."
                actionLabel="Run Simulation"
                actionHref="/guardian/admin/simulation"
              />
            ) : (
              <div className="max-h-[380px] overflow-auto">
                <ul className="divide-y text-xs">
                  {alerts.map((a) => (
                    <li key={a.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            a.severity === 'critical'
                              ? 'bg-error-500/10 text-error-400 border border-error-500/20'
                              : a.severity === 'high'
                              ? 'bg-accent-500/10 text-accent-400 border border-accent-500/20'
                              : a.severity === 'medium'
                              ? 'bg-warning-500/10 text-warning-400 border border-warning-500/20'
                              : 'bg-info-500/10 text-info-400 border border-info-500/20'
                          }`}
                        >
                          {a.severity.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(a.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-[11px] mb-1">{a.message}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Source: {a.source}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Incidents Column */}
          <section className="rounded-xl border bg-card overflow-hidden">
            <header className="border-b bg-muted/40 px-4 py-3 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium">Incidents</span>
              {incidents.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {incidents.length}
                </span>
              )}
            </header>
            {incidents.length === 0 ? (
              <EmptyState
                icon={ShieldAlert}
                title="No incidents"
                description="Correlated alert groups will appear here as incidents when patterns are detected."
                actionLabel="View Rules"
                actionHref="/guardian/rules"
              />
            ) : (
              <div className="max-h-[380px] overflow-auto">
                <ul className="divide-y text-xs">
                  {incidents.map((i) => (
                    <li key={i.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            i.severity === 'critical'
                              ? 'bg-error-500/10 text-error-400 border border-error-500/20'
                              : i.severity === 'high'
                              ? 'bg-accent-500/10 text-accent-400 border border-accent-500/20'
                              : 'bg-info-500/10 text-info-400 border border-info-500/20'
                          }`}
                        >
                          {i.severity.toUpperCase()} · {i.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(i.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-[11px]">{i.title}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Notifications Column */}
          <section className="rounded-xl border bg-card overflow-hidden">
            <header className="border-b bg-muted/40 px-4 py-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium">Notifications</span>
              {notifications.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {notifications.length}
                </span>
              )}
            </header>
            {notifications.length === 0 ? (
              <EmptyState
                icon={Zap}
                title="No notifications"
                description="Guardian notification events will be tracked here when alerts trigger configured notification channels."
              />
            ) : (
              <div className="max-h-[380px] overflow-auto">
                <table className="w-full text-[11px]">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Channel</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((n) => (
                      <tr key={n.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2">{n.type}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1">
                            {n.channel}
                            {n.severity && (
                              <span className="text-[9px] text-muted-foreground">
                                ({n.severity})
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              n.status === 'sent'
                                ? 'bg-success-500/10 text-success-400 border border-success-500/20'
                                : n.status === 'failed'
                                ? 'bg-error-500/10 text-error-400 border border-error-500/20'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {n.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
