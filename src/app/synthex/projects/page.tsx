'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSynthexTenant } from '@/hooks/useSynthexTenant';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Sparkles } from 'lucide-react';
import { SynthexProjectsBoard } from '@/ui/synthex/SynthexProjectsBoard';

interface TenantSummary {
  id: string;
  business_name?: string;
  name?: string;
}

export default function SynthexProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const { tenantId, loading: tenantLoading, setTenantId } = useSynthexTenant();
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTenants = async (): Promise<void> => {
      if (!user) return;
      setLoadingTenants(true);
      setError(null);

      try {
        const res = await fetch('/api/synthex/tenant');
        const json = (await res.json()) as { tenants?: TenantSummary[]; error?: string };
        if (!res.ok) throw new Error(json.error || 'Failed to load tenants');
        const list = json.tenants ?? [];
        setTenants(list);
        if (!tenantId && list.length > 0) {
          setTenantId(list[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoadingTenants(false);
      }
    };

    if (!authLoading && user && !tenantLoading) {
      loadTenants();
    }
  }, [authLoading, user, tenantLoading, tenantId, setTenantId]);

  if (authLoading || tenantLoading || loadingTenants) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-accent-500 animate-pulse mx-auto mb-4" />
          <p className="text-text-secondary">Loading projects…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-bg-card border-border-subtle">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Sign in required</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-bg-card border-border-subtle">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reload
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-bg-card border-border-subtle">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-text-secondary">Select a tenant to continue</span>
            </div>
            <Select value="" onValueChange={setTenantId}>
              <SelectTrigger className="w-[320px]">
                <SelectValue placeholder="Choose tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.business_name || t.name || t.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-950">
      <div className="border-b border-border-subtle bg-bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Synthex Projects</h1>
          </div>
          <Select value={tenantId} onValueChange={setTenantId}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Tenant" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.business_name || t.name || t.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <SynthexProjectsBoard tenantId={tenantId} />
      </div>
    </div>
  );
}

