import { Suspense } from 'react';
import { listFounderBusinesses, getPortfolioStats } from '@/lib/founder/businessVaultService';
import { BusinessVaultCard } from '@/components/founder/BusinessVaultCard';
import { Building2, Plus, BarChart3, Layers } from 'lucide-react';
import Link from 'next/link';

async function BusinessVaultContent() {
  const [businesses, stats] = await Promise.all([
    listFounderBusinesses(),
    getPortfolioStats()
  ]);

  return (
    <>
      {/* Portfolio Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalBusinesses}</p>
              <p className="text-sm text-muted-foreground">Businesses</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info-500/10 text-info-500">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalChannels}</p>
              <p className="text-sm text-muted-foreground">Channels Connected</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success-500/10 text-success-500">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalSnapshots}</p>
              <p className="text-sm text-muted-foreground">AI Snapshots</p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Cards */}
      {businesses.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold">No businesses added yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Start by adding your first business. AI Phill will use this data to generate
            per-business and portfolio-level synopses under Human-Governed Mode.
          </p>
          <Link
            href="/founder/business-vault/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add First Business
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {businesses.map((b: any) => {
            // Find matching stats for this business
            const businessStat = stats.businesses.find(
              (s) => s.business_key === b.business_key
            );

            return (
              <BusinessVaultCard
                key={b.id}
                displayName={b.display_name}
                businessKey={b.business_key}
                primaryDomain={b.primary_domain}
                primaryRegion={b.primary_region}
                industry={b.industry}
                channelCount={businessStat?.channel_count ?? 0}
                latestSnapshotDate={businessStat?.latest_snapshot_date}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 h-20" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border p-4 h-40" />
        ))}
      </div>
    </div>
  );
}

export default function BusinessVaultPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Business Identity Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Central hub for all your companies. AI Phill uses this to generate per-business
            and umbrella synopses under Human-Governed Mode.
          </p>
        </div>
        <Link
          href="/founder/business-vault/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Business
        </Link>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <BusinessVaultContent />
      </Suspense>
    </div>
  );
}
