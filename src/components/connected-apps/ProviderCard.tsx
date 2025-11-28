'use client';

/**
 * Provider Card
 *
 * Card component for displaying a connected app provider.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ConnectionStatusBadge, type ConnectionStatus } from './ConnectionStatusBadge';
import {
  Mail,
  Calendar,
  HardDrive,
  Unlink,
  RefreshCw,
  ExternalLink,
  Loader2,
} from 'lucide-react';

// Provider icons as SVG (inline for simplicity)
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const MicrosoftIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6">
    <path fill="#F25022" d="M1 1h10v10H1z" />
    <path fill="#00A4EF" d="M13 1h10v10H13z" />
    <path fill="#7FBA00" d="M1 13h10v10H1z" />
    <path fill="#FFB900" d="M13 13h10v10H13z" />
  </svg>
);

interface ProviderCardProps {
  provider: 'google' | 'microsoft';
  displayName: string;
  description: string;
  isConnected: boolean;
  status?: ConnectionStatus;
  email?: string | null;
  lastSyncAt?: Date | null;
  activeServices?: string[];
  onConnect: () => void;
  onDisconnect: () => void;
  onSync?: () => void;
  isLoading?: boolean;
  isSyncing?: boolean;
}

const serviceIcons: Record<string, React.ElementType> = {
  gmail: Mail,
  outlook: Mail,
  google_calendar: Calendar,
  microsoft_calendar: Calendar,
  google_drive: HardDrive,
  onedrive: HardDrive,
};

const serviceLabels: Record<string, string> = {
  gmail: 'Gmail',
  outlook: 'Outlook',
  google_calendar: 'Calendar',
  microsoft_calendar: 'Calendar',
  google_drive: 'Drive',
  onedrive: 'OneDrive',
};

export function ProviderCard({
  provider,
  displayName,
  description,
  isConnected,
  status = 'active',
  email,
  lastSyncAt,
  activeServices = [],
  onConnect,
  onDisconnect,
  onSync,
  isLoading = false,
  isSyncing = false,
}: ProviderCardProps) {
  const Icon = provider === 'google' ? GoogleIcon : MicrosoftIcon;

  return (
    <div
      className={cn(
        'relative rounded-lg border bg-card p-6 transition-all',
        isConnected
          ? 'border-green-200 dark:border-green-800'
          : 'border-border hover:border-primary/50'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            <Icon />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{displayName}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {isConnected && <ConnectionStatusBadge status={status} size="sm" />}
      </div>

      {/* Connected Info */}
      {isConnected && (
        <div className="mt-4 space-y-3">
          {/* Connected Account */}
          {email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Account:</span>
              <span>{email}</span>
            </div>
          )}

          {/* Active Services */}
          {activeServices.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeServices.map((service) => {
                const ServiceIcon = serviceIcons[service] || Mail;
                return (
                  <span
                    key={service}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium"
                  >
                    <ServiceIcon className="h-3 w-3" />
                    {serviceLabels[service] || service}
                  </span>
                );
              })}
            </div>
          )}

          {/* Last Sync */}
          {lastSyncAt && (
            <div className="text-xs text-muted-foreground">
              Last synced: {lastSyncAt.toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {isConnected ? (
          <>
            {onSync && (
              <button
                onClick={onSync}
                disabled={isSyncing}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
            <button
              onClick={onDisconnect}
              disabled={isLoading}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
                'border border-destructive text-destructive hover:bg-destructive/10',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Unlink className="h-4 w-4" />
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={onConnect}
            disabled={isLoading}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
        )}
      </div>
    </div>
  );
}

export default ProviderCard;
