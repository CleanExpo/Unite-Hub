import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBusinessWithChannels } from '@/lib/founder/businessVaultService';
import {
  Building2,
  Globe,
  MapPin,
  ArrowLeft,
  Layers,
  Activity,
  FileText,
  Plus,
  ExternalLink
} from 'lucide-react';

interface PageProps {
  params: Promise<{ businessKey: string }>;
}

async function BusinessDetailContent({ businessKey }: { businessKey: string }) {
  const data = await getBusinessWithChannels(businessKey);

  if (!data) {
    notFound();
  }

  const { business, channels, snapshots } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{business.display_name}</h1>
            <p className="text-sm text-muted-foreground font-mono">{business.business_key}</p>
          </div>
        </div>
        <Link
          href={`/founder/business-vault/${businessKey}/edit`}
          className="px-4 py-2 rounded-lg border hover:bg-muted transition-colors"
        >
          Edit Business
        </Link>
      </div>

      {/* Business Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {business.primary_domain && (
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Globe className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Domain</span>
            </div>
            <p className="font-medium">{business.primary_domain}</p>
          </div>
        )}
        {business.primary_region && (
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MapPin className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Region</span>
            </div>
            <p className="font-medium">{business.primary_region}</p>
          </div>
        )}
        {business.industry && (
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Industry</span>
            </div>
            <p className="font-medium">{business.industry}</p>
          </div>
        )}
        {business.legal_name && (
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Legal Name</span>
            </div>
            <p className="font-medium">{business.legal_name}</p>
          </div>
        )}
      </div>

      {/* Channels Section */}
      <div className="rounded-xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Connected Channels</h2>
            <span className="text-sm text-muted-foreground">({channels.length})</span>
          </div>
          <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border hover:bg-muted transition-colors">
            <Plus className="h-4 w-4" />
            Add Channel
          </button>
        </div>
        {channels.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No channels connected yet</p>
            <p className="text-sm mt-1">Connect search, social, ads, or analytics platforms</p>
          </div>
        ) : (
          <div className="divide-y">
            {channels.map((channel: any) => (
              <div key={channel.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{channel.account_label || channel.provider}</p>
                  <p className="text-sm text-muted-foreground">
                    {channel.channel_type} via {channel.provider}
                  </p>
                </div>
                {channel.external_id && (
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {channel.external_id}
                  </code>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Snapshots Section */}
      <div className="rounded-xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">AI Snapshots</h2>
            <span className="text-sm text-muted-foreground">({snapshots.length})</span>
          </div>
          <Link
            href={`/founder/ai-phill?business=${businessKey}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Generate New Snapshot
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
        {snapshots.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No AI snapshots yet</p>
            <p className="text-sm mt-1">
              Ask AI Phill to analyze this business using Google Leak doctrine signals
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {snapshots.map((snapshot: any) => (
              <div key={snapshot.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                      {snapshot.snapshot_type}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(snapshot.created_at).toLocaleString()}
                    </span>
                  </div>
                  {/* Score indicators */}
                  <div className="flex gap-2 text-xs">
                    {snapshot.eeat_strength_score !== null && (
                      <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-600">
                        E-E-A-T: {snapshot.eeat_strength_score}
                      </span>
                    )}
                    {snapshot.navboost_risk_score !== null && (
                      <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-600">
                        NavBoost Risk: {snapshot.navboost_risk_score}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {snapshot.summary_markdown.substring(0, 300)}...
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {business.notes && (
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold mb-2">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{business.notes}</p>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 rounded-xl bg-muted" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-48 rounded-xl bg-muted" />
      <div className="h-48 rounded-xl bg-muted" />
    </div>
  );
}

export default async function BusinessDetailPage({ params }: PageProps) {
  const { businessKey } = await params;

  return (
    <div className="space-y-6">
      <Link
        href="/founder/business-vault"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Business Vault
      </Link>

      <Suspense fallback={<LoadingSkeleton />}>
        <BusinessDetailContent businessKey={businessKey} />
      </Suspense>
    </div>
  );
}
