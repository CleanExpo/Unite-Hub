'use client';

import Link from 'next/link';
import { Building2, Globe, MapPin, ExternalLink, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  displayName: string;
  businessKey: string;
  primaryDomain?: string | null;
  primaryRegion?: string | null;
  industry?: string | null;
  latestSnapshotSummary?: string | null;
  latestSnapshotDate?: string | null;
  channelCount?: number;
  className?: string;
};

export function BusinessVaultCard({
  displayName,
  businessKey,
  primaryDomain,
  primaryRegion,
  industry,
  latestSnapshotSummary,
  latestSnapshotDate,
  channelCount = 0,
  className
}: Props) {
  return (
    <Link
      href={`/founder/business-vault/${businessKey}`}
      className={cn(
        'group block border rounded-xl p-4 hover:border-primary/50 hover:bg-muted/30 transition-all',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
              {displayName}
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              {businessKey}
            </span>
          </div>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="mt-4 space-y-2">
        {primaryDomain && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            <span>{primaryDomain}</span>
          </div>
        )}
        {primaryRegion && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{primaryRegion}</span>
          </div>
        )}
        {industry && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            <span>{industry}</span>
          </div>
        )}
      </div>

      {latestSnapshotSummary && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2 border-t pt-3">
          {latestSnapshotSummary}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{channelCount} channel{channelCount !== 1 ? 's' : ''} connected</span>
        {latestSnapshotDate && (
          <span>Last snapshot: {new Date(latestSnapshotDate).toLocaleDateString()}</span>
        )}
      </div>
    </Link>
  );
}
