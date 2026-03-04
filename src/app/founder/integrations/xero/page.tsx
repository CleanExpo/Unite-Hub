'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Link2,
  Settings,
  Database,
  Play,
  ChevronRight,
  Loader2,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface XeroTenant {
  tenantId: string;
  tenantName: string;
  tenantType: string;
}

interface BusinessTenant {
  id: string;
  business_key: string;
  xero_tenant_id: string;
  xero_org_name: string | null;
  sync_enabled: boolean;
  last_synced_at: string | null;
  confirmed_at: string | null;
}

interface LicenceInfo {
  status: string;
  connected_at: string | null;
  mapped_businesses: BusinessTenant[];
}

interface XeroStatus {
  carsi: LicenceInfo;
  dr_nrpg: LicenceInfo;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CARSI_BUSINESSES = [
  { key: 'unite-group', label: 'Unite Group' },
  { key: 'restore-assist', label: 'RestoreAssist' },
  { key: 'ato', label: 'ATO' },
  { key: 'carsi', label: 'CARSI' },
  { key: 'synthex', label: 'Synthex' },
];

const DR_BUSINESSES = [
  { key: 'disaster-recovery', label: 'Disaster Recovery' },
  { key: 'nrpg', label: 'NRPG' },
];

const ALL_BUSINESSES = [...CARSI_BUSINESSES, ...DR_BUSINESSES];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isConnected = status === 'connected';
  const isError = status === 'error';

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-sm border',
        isConnected
          ? 'border-[#00FF88]/40 bg-[#00FF88]/10 text-[#00FF88]'
          : isError
            ? 'border-[#FF4444]/40 bg-[#FF4444]/10 text-[#FF4444]'
            : 'border-[#00F5FF]/20 bg-[#00F5FF]/5 text-[#888]',
      ].join(' ')}
    >
      {isConnected ? (
        <CheckCircle2 size={12} />
      ) : isError ? (
        <XCircle size={12} />
      ) : (
        <AlertCircle size={12} />
      )}
      {status.toUpperCase().replace('_', ' ')}
    </span>
  );
}

function StepHeader({
  step,
  title,
  active,
}: {
  step: number;
  title: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className={[
          'w-8 h-8 rounded-sm flex items-center justify-center text-sm font-mono font-bold border',
          active
            ? 'border-[#00F5FF] bg-[#00F5FF]/10 text-[#00F5FF]'
            : 'border-[#00F5FF]/20 text-[#555]',
        ].join(' ')}
      >
        {step}
      </div>
      <h2
        className={[
          'text-base font-mono font-semibold',
          active ? 'text-[#00F5FF]' : 'text-[#555]',
        ].join(' ')}
      >
        {title}
      </h2>
    </div>
  );
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={[
        'border border-[#00F5FF]/20 bg-[#080808] rounded-sm p-5',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 p-3 border border-[#FF4444]/30 bg-[#FF4444]/5 rounded-sm text-[#FF4444] text-sm font-mono">
      <XCircle size={14} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 p-3 border border-[#00FF88]/30 bg-[#00FF88]/5 rounded-sm text-[#00FF88] text-sm font-mono">
      <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function XeroSetupPage() {
  // ── URL param feedback (from OAuth callback redirects) ──
  const [urlFeedback, setUrlFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ── App credentials (Step 1) ──
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [appSaving, setAppSaving] = useState(false);
  const [appSaved, setAppSaved] = useState(false);
  const [appError, setAppError] = useState('');

  // ── Licence status (Step 2 / 4 top badges) ──
  const [xeroStatus, setXeroStatus] = useState<XeroStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // ── Tenant lists (Steps 3 / 5) ──
  const [carsiTenants, setCarsiTenants] = useState<XeroTenant[]>([]);
  const [drTenants, setDrTenants] = useState<XeroTenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState<Record<string, boolean>>({});
  const [tenantsError, setTenantsError] = useState<Record<string, string>>({});

  // ── Mapping selections ──
  // businessKey → xeroTenantId being selected in the UI
  const [mappingSelections, setMappingSelections] = useState<Record<string, string>>({});
  const [mappingErrors, setMappingErrors] = useState<Record<string, string>>({});
  const [mappingSaving, setMappingSaving] = useState(false);
  const [mappingSuccess, setMappingSuccess] = useState('');

  // ── Confirm mappings ──
  const [confirmingLicence, setConfirmingLicence] = useState<string | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState<Record<string, boolean>>({});

  // ── Sync ──
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [syncResults, setSyncResults] = useState<Record<string, { records: number; errors: number; at: string }>>({});

  // ─── Load status on mount ─────────────────────────────────────────────────

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/founder/xero/status');
      if (res.ok) {
        const data = await res.json() as XeroStatus;
        setXeroStatus(data);
      }
    } catch {
      // silently fail — status badges will show disconnected
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  // ─── Parse URL feedback from OAuth callback ───────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const xeroParam = params.get('xero');
    const licence = params.get('licence');
    const message = params.get('message');

    if (xeroParam === 'connected') {
      setUrlFeedback({
        type: 'success',
        message: `${licence === 'dr_nrpg' ? 'DR/NRPG' : 'CARSI'} licence connected successfully. Fetch tenants below to map your businesses.`,
      });
      void loadStatus();
      // Auto-fetch tenants for the connected licence
      if (licence === 'carsi') void fetchTenants('carsi');
      if (licence === 'dr_nrpg') void fetchTenants('dr_nrpg');
    } else if (xeroParam === 'error') {
      setUrlFeedback({
        type: 'error',
        message: decodeURIComponent(message ?? 'Xero OAuth failed. Please try again.'),
      });
    }

    // Clean URL params without reload
    if (xeroParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete('xero');
      url.searchParams.delete('licence');
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Step 1: Save app credentials ────────────────────────────────────────

  async function saveAppCredentials() {
    setAppSaving(true);
    setAppError('');
    setAppSaved(false);
    try {
      const res = await fetch('/api/founder/xero/setup-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (res.ok && data.success) {
        setAppSaved(true);
        setClientId('');
        setClientSecret('');
      } else {
        setAppError(data.error ?? 'Failed to save credentials.');
      }
    } catch {
      setAppError('Network error saving credentials.');
    } finally {
      setAppSaving(false);
    }
  }

  // ─── Fetch tenants ────────────────────────────────────────────────────────

  async function fetchTenants(licence: 'carsi' | 'dr_nrpg') {
    setTenantsLoading((prev) => ({ ...prev, [licence]: true }));
    setTenantsError((prev) => ({ ...prev, [licence]: '' }));
    try {
      const res = await fetch(`/api/founder/xero/tenants/${licence}`);
      const data = await res.json() as { tenants?: XeroTenant[]; error?: string };
      if (res.ok && data.tenants) {
        if (licence === 'carsi') setCarsiTenants(data.tenants);
        else setDrTenants(data.tenants);
      } else {
        setTenantsError((prev) => ({ ...prev, [licence]: data.error ?? 'Failed to fetch tenants.' }));
      }
    } catch {
      setTenantsError((prev) => ({ ...prev, [licence]: 'Network error fetching tenants.' }));
    } finally {
      setTenantsLoading((prev) => ({ ...prev, [licence]: false }));
    }
  }

  // ─── Save a single mapping ─────────────────────────────────────────────────

  async function saveMapping(
    businessKey: string,
    licenceName: 'carsi' | 'dr_nrpg',
    tenants: XeroTenant[]
  ) {
    const tenantId = mappingSelections[businessKey];
    if (!tenantId) {
      setMappingErrors((prev) => ({ ...prev, [businessKey]: 'Select a Xero org first.' }));
      return;
    }
    const tenant = tenants.find((t) => t.tenantId === tenantId);
    setMappingSaving(true);
    setMappingErrors((prev) => ({ ...prev, [businessKey]: '' }));
    try {
      const res = await fetch('/api/founder/xero/map-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_key: businessKey,
          licence_name: licenceName,
          xero_tenant_id: tenantId,
          xero_org_name: tenant?.tenantName ?? '',
        }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (res.ok) {
        setMappingSuccess(`Mapped '${businessKey}' → '${tenant?.tenantName ?? tenantId}'.`);
        void loadStatus();
      } else {
        setMappingErrors((prev) => ({ ...prev, [businessKey]: data.error ?? 'Mapping failed.' }));
      }
    } catch {
      setMappingErrors((prev) => ({ ...prev, [businessKey]: 'Network error saving mapping.' }));
    } finally {
      setMappingSaving(false);
    }
  }

  // ─── Confirm all mappings for a licence ───────────────────────────────────

  async function confirmMappings(licenceName: 'carsi' | 'dr_nrpg') {
    setConfirmingLicence(licenceName);
    try {
      const res = await fetch('/api/founder/xero/confirm-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licence_name: licenceName }),
      });
      if (res.ok) {
        setConfirmSuccess((prev) => ({ ...prev, [licenceName]: true }));
        void loadStatus();
      }
    } catch {
      // silently fail; user can retry
    } finally {
      setConfirmingLicence(null);
    }
  }

  // ─── Sync a business ──────────────────────────────────────────────────────

  async function syncBusiness(businessKey: string) {
    setSyncing((prev) => ({ ...prev, [businessKey]: true }));
    try {
      const res = await fetch(`/api/founder/xero/sync/${businessKey}`, { method: 'POST' });
      const data = await res.json() as {
        records_synced?: number;
        errors?: unknown[];
        completed_at?: string;
        error?: string;
      };
      if (res.ok) {
        setSyncResults((prev) => ({
          ...prev,
          [businessKey]: {
            records: data.records_synced ?? 0,
            errors: data.errors?.length ?? 0,
            at: data.completed_at ?? new Date().toISOString(),
          },
        }));
      }
    } catch {
      // silently fail; results won't update
    } finally {
      setSyncing((prev) => ({ ...prev, [businessKey]: false }));
      void loadStatus();
    }
  }

  async function syncAll() {
    const mapped = xeroStatus
      ? [
          ...xeroStatus.carsi.mapped_businesses,
          ...xeroStatus.dr_nrpg.mapped_businesses,
        ].filter((b) => b.sync_enabled)
      : [];
    for (const b of mapped) {
      await syncBusiness(b.business_key);
    }
  }

  // ─── Derived state ─────────────────────────────────────────────────────────

  const carsiConnected = xeroStatus?.carsi.status === 'connected';
  const drConnected = xeroStatus?.dr_nrpg.status === 'connected';

  const carsiMapped = xeroStatus?.carsi.mapped_businesses ?? [];
  const drMapped = xeroStatus?.dr_nrpg.mapped_businesses ?? [];
  const allMapped = [...carsiMapped, ...drMapped];

  const totalMapped = allMapped.length;
  const totalEnabled = allMapped.filter((b) => b.sync_enabled).length;
  const syncReady = totalEnabled > 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#050505] text-[#ccc] p-6 font-mono">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#00F5FF] tracking-tight">
              Xero Two-Licence Setup
            </h1>
            <p className="text-[#666] text-sm mt-1">
              CARSI developer app · Two licence groups · 7 businesses total
            </p>
          </div>
          <button
            onClick={() => void loadStatus()}
            disabled={statusLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs border border-[#00F5FF]/30 text-[#00F5FF] rounded-sm hover:bg-[#00F5FF]/10 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={statusLoading ? 'animate-spin' : ''} />
            Refresh Status
          </button>
        </div>

        {/* URL feedback banner */}
        {urlFeedback && (
          urlFeedback.type === 'success'
            ? <SuccessMessage message={urlFeedback.message} />
            : <ErrorMessage message={urlFeedback.message} />
        )}

        {/* Licence status badges */}
        <SectionCard>
          <p className="text-xs text-[#555] mb-3 uppercase tracking-widest">Licence Status</p>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#888]">CARSI Licence</span>
              <StatusBadge status={xeroStatus?.carsi.status ?? 'disconnected'} />
              {xeroStatus?.carsi.connected_at && (
                <span className="text-xs text-[#444]">
                  since {new Date(xeroStatus.carsi.connected_at).toLocaleDateString('en-AU')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#888]">DR/NRPG Licence</span>
              <StatusBadge status={xeroStatus?.dr_nrpg.status ?? 'disconnected'} />
              {xeroStatus?.dr_nrpg.connected_at && (
                <span className="text-xs text-[#444]">
                  since {new Date(xeroStatus.dr_nrpg.connected_at).toLocaleDateString('en-AU')}
                </span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-[#555]">
              <Database size={12} />
              {totalMapped}/7 mapped · {totalEnabled} sync-enabled
            </div>
          </div>
        </SectionCard>

        {/* ── Step 1: App Credentials ── */}
        <SectionCard>
          <StepHeader step={1} title="CARSI Developer App Credentials" active />
          <p className="text-[#666] text-sm mb-4">
            CARSI holds the Xero developer app. Enter the client_id and client_secret
            once — both licences share these credentials.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[#888] mb-1 uppercase tracking-wider">
                Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full bg-[#0a0a0a] border border-[#00F5FF]/20 rounded-sm px-3 py-2 text-sm text-[#ccc] placeholder-[#333] focus:outline-none focus:border-[#00F5FF]/60"
              />
            </div>
            <div>
              <label className="block text-xs text-[#888] mb-1 uppercase tracking-wider">
                Client Secret
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-[#0a0a0a] border border-[#00F5FF]/20 rounded-sm px-3 py-2 text-sm text-[#ccc] placeholder-[#333] focus:outline-none focus:border-[#00F5FF]/60"
              />
            </div>
            {appError && <ErrorMessage message={appError} />}
            {appSaved && <SuccessMessage message="Credentials saved. Both licences can now use these to connect." />}
            <button
              onClick={() => void saveAppCredentials()}
              disabled={appSaving || !clientId || !clientSecret}
              className="flex items-center gap-2 px-4 py-2 bg-[#00F5FF]/10 border border-[#00F5FF]/40 text-[#00F5FF] text-sm rounded-sm hover:bg-[#00F5FF]/20 transition-colors disabled:opacity-40"
            >
              {appSaving ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />}
              Save Credentials
            </button>
          </div>
        </SectionCard>

        {/* ── Step 2: Connect CARSI Licence ── */}
        <SectionCard>
          <StepHeader step={2} title="Connect CARSI Licence" active={!carsiConnected} />
          <p className="text-[#666] text-sm mb-4">
            Authorises access for: CARSI, RestoreAssist, Unite-Group, ATO, Synthex.
          </p>
          <div className="flex items-center gap-4">
            <StatusBadge status={xeroStatus?.carsi.status ?? 'disconnected'} />
            {carsiConnected ? (
              <span className="text-[#00FF88] text-sm">Connected — fetch tenants in Step 3</span>
            ) : (
              <a
                href="/api/founder/xero/connect?licence=carsi"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#00F5FF]/10 border border-[#00F5FF]/40 text-[#00F5FF] text-sm rounded-sm hover:bg-[#00F5FF]/20 transition-colors"
              >
                <Link2 size={14} />
                Connect CARSI Licence
                <ChevronRight size={12} />
              </a>
            )}
          </div>
        </SectionCard>

        {/* ── Step 3: Map CARSI Tenants ── */}
        <SectionCard>
          <StepHeader step={3} title="Map CARSI Tenants" active={carsiConnected} />
          {!carsiConnected ? (
            <p className="text-[#555] text-sm">Connect CARSI licence first (Step 2).</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => void fetchTenants('carsi')}
                  disabled={tenantsLoading.carsi}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs border border-[#00F5FF]/30 text-[#00F5FF] rounded-sm hover:bg-[#00F5FF]/10 transition-colors disabled:opacity-40"
                >
                  {tenantsLoading.carsi
                    ? <Loader2 size={12} className="animate-spin" />
                    : <RefreshCw size={12} />}
                  Fetch CARSI Tenants
                </button>
                {carsiTenants.length > 0 && (
                  <span className="text-xs text-[#555]">{carsiTenants.length} orgs found</span>
                )}
              </div>
              {tenantsError.carsi && <ErrorMessage message={tenantsError.carsi} />}

              {carsiTenants.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-[#555] uppercase tracking-widest mb-2">
                    Map each business to a Xero org
                  </p>
                  {CARSI_BUSINESSES.map(({ key, label }) => {
                    const existing = carsiMapped.find((m) => m.business_key === key);
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-3 p-3 border border-[#00F5FF]/10 bg-[#0a0a0a] rounded-sm"
                      >
                        <span className="w-36 text-sm text-[#ccc] shrink-0">{label}</span>
                        <ChevronRight size={12} className="text-[#444] shrink-0" />
                        <select
                          value={mappingSelections[key] ?? existing?.xero_tenant_id ?? ''}
                          onChange={(e) =>
                            setMappingSelections((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          className="flex-1 bg-[#0d0d0d] border border-[#00F5FF]/20 rounded-sm px-2 py-1.5 text-sm text-[#ccc] focus:outline-none focus:border-[#00F5FF]/50"
                        >
                          <option value="">— Select Xero org —</option>
                          {carsiTenants.map((t) => (
                            <option key={t.tenantId} value={t.tenantId}>
                              {t.tenantName}
                            </option>
                          ))}
                        </select>
                        {existing?.xero_tenant_id && (
                          <CheckCircle2 size={14} className="text-[#00FF88] shrink-0" />
                        )}
                        <button
                          onClick={() => void saveMapping(key, 'carsi', carsiTenants)}
                          disabled={mappingSaving}
                          className="px-3 py-1.5 text-xs border border-[#00F5FF]/30 text-[#00F5FF] rounded-sm hover:bg-[#00F5FF]/10 transition-colors disabled:opacity-40"
                        >
                          Save
                        </button>
                        {mappingErrors[key] && (
                          <span className="text-[#FF4444] text-xs">{mappingErrors[key]}</span>
                        )}
                      </div>
                    );
                  })}

                  {mappingSuccess && <SuccessMessage message={mappingSuccess} />}

                  <div className="pt-2 border-t border-[#00F5FF]/10">
                    <p className="text-xs text-[#FFB800] mb-3">
                      Review all mappings carefully before confirming. Confirming enables sync.
                    </p>
                    <button
                      onClick={() => void confirmMappings('carsi')}
                      disabled={confirmingLicence === 'carsi' || carsiMapped.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-[#00FF88]/10 border border-[#00FF88]/40 text-[#00FF88] text-sm rounded-sm hover:bg-[#00FF88]/20 transition-colors disabled:opacity-40"
                    >
                      {confirmingLicence === 'carsi'
                        ? <Loader2 size={14} className="animate-spin" />
                        : <CheckCircle2 size={14} />}
                      Confirm CARSI Mappings & Enable Sync
                    </button>
                    {confirmSuccess.carsi && (
                      <SuccessMessage message="CARSI mappings confirmed. Sync enabled for mapped businesses." />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* ── Step 4: Connect DR/NRPG Licence ── */}
        <SectionCard>
          <StepHeader step={4} title="Connect DR/NRPG Licence" active={!drConnected} />
          <p className="text-[#666] text-sm mb-4">
            Authorises access for: Disaster Recovery, NRPG.
          </p>
          <div className="flex items-center gap-4">
            <StatusBadge status={xeroStatus?.dr_nrpg.status ?? 'disconnected'} />
            {drConnected ? (
              <span className="text-[#00FF88] text-sm">Connected — fetch tenants in Step 5</span>
            ) : (
              <a
                href="/api/founder/xero/connect?licence=dr_nrpg"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#00F5FF]/10 border border-[#00F5FF]/40 text-[#00F5FF] text-sm rounded-sm hover:bg-[#00F5FF]/20 transition-colors"
              >
                <Link2 size={14} />
                Connect DR/NRPG Licence
                <ChevronRight size={12} />
              </a>
            )}
          </div>
        </SectionCard>

        {/* ── Step 5: Map DR/NRPG Tenants ── */}
        <SectionCard>
          <StepHeader step={5} title="Map DR/NRPG Tenants" active={drConnected} />
          {!drConnected ? (
            <p className="text-[#555] text-sm">Connect DR/NRPG licence first (Step 4).</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => void fetchTenants('dr_nrpg')}
                  disabled={tenantsLoading.dr_nrpg}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs border border-[#00F5FF]/30 text-[#00F5FF] rounded-sm hover:bg-[#00F5FF]/10 transition-colors disabled:opacity-40"
                >
                  {tenantsLoading.dr_nrpg
                    ? <Loader2 size={12} className="animate-spin" />
                    : <RefreshCw size={12} />}
                  Fetch DR/NRPG Tenants
                </button>
                {drTenants.length > 0 && (
                  <span className="text-xs text-[#555]">{drTenants.length} orgs found</span>
                )}
              </div>
              {tenantsError.dr_nrpg && <ErrorMessage message={tenantsError.dr_nrpg} />}

              {drTenants.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-[#555] uppercase tracking-widest mb-2">
                    Map each business to a Xero org
                  </p>
                  {DR_BUSINESSES.map(({ key, label }) => {
                    const existing = drMapped.find((m) => m.business_key === key);
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-3 p-3 border border-[#00F5FF]/10 bg-[#0a0a0a] rounded-sm"
                      >
                        <span className="w-36 text-sm text-[#ccc] shrink-0">{label}</span>
                        <ChevronRight size={12} className="text-[#444] shrink-0" />
                        <select
                          value={mappingSelections[key] ?? existing?.xero_tenant_id ?? ''}
                          onChange={(e) =>
                            setMappingSelections((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          className="flex-1 bg-[#0d0d0d] border border-[#00F5FF]/20 rounded-sm px-2 py-1.5 text-sm text-[#ccc] focus:outline-none focus:border-[#00F5FF]/50"
                        >
                          <option value="">— Select Xero org —</option>
                          {drTenants.map((t) => (
                            <option key={t.tenantId} value={t.tenantId}>
                              {t.tenantName}
                            </option>
                          ))}
                        </select>
                        {existing?.xero_tenant_id && (
                          <CheckCircle2 size={14} className="text-[#00FF88] shrink-0" />
                        )}
                        <button
                          onClick={() => void saveMapping(key, 'dr_nrpg', drTenants)}
                          disabled={mappingSaving}
                          className="px-3 py-1.5 text-xs border border-[#00F5FF]/30 text-[#00F5FF] rounded-sm hover:bg-[#00F5FF]/10 transition-colors disabled:opacity-40"
                        >
                          Save
                        </button>
                        {mappingErrors[key] && (
                          <span className="text-[#FF4444] text-xs">{mappingErrors[key]}</span>
                        )}
                      </div>
                    );
                  })}

                  <div className="pt-2 border-t border-[#00F5FF]/10">
                    <p className="text-xs text-[#FFB800] mb-3">
                      Review all mappings carefully before confirming. Confirming enables sync.
                    </p>
                    <button
                      onClick={() => void confirmMappings('dr_nrpg')}
                      disabled={confirmingLicence === 'dr_nrpg' || drMapped.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-[#00FF88]/10 border border-[#00FF88]/40 text-[#00FF88] text-sm rounded-sm hover:bg-[#00FF88]/20 transition-colors disabled:opacity-40"
                    >
                      {confirmingLicence === 'dr_nrpg'
                        ? <Loader2 size={14} className="animate-spin" />
                        : <CheckCircle2 size={14} />}
                      Confirm DR/NRPG Mappings & Enable Sync
                    </button>
                    {confirmSuccess.dr_nrpg && (
                      <SuccessMessage message="DR/NRPG mappings confirmed. Sync enabled for mapped businesses." />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* ── Step 6: Validate & Enable Sync ── */}
        <SectionCard>
          <StepHeader step={6} title="Validate & Enable Sync" active={syncReady} />
          <p className="text-[#666] text-sm mb-4">
            All 7 businesses must be mapped and confirmed before bulk sync is available.
          </p>

          {/* Status table */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#00F5FF]/10">
                  <th className="text-left py-2 px-3 text-xs text-[#555] uppercase tracking-wider">Business</th>
                  <th className="text-left py-2 px-3 text-xs text-[#555] uppercase tracking-wider">Licence</th>
                  <th className="text-left py-2 px-3 text-xs text-[#555] uppercase tracking-wider">Xero Org</th>
                  <th className="text-left py-2 px-3 text-xs text-[#555] uppercase tracking-wider">Sync</th>
                  <th className="text-left py-2 px-3 text-xs text-[#555] uppercase tracking-wider">Last Sync</th>
                  <th className="text-right py-2 px-3 text-xs text-[#555] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {ALL_BUSINESSES.map(({ key, label }) => {
                  const mapping = allMapped.find((m) => m.business_key === key);
                  const licence = CARSI_BUSINESSES.some((b) => b.key === key) ? 'carsi' : 'dr_nrpg';
                  const result = syncResults[key];

                  return (
                    <tr
                      key={key}
                      className="border-b border-[#00F5FF]/5 hover:bg-[#00F5FF]/3 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-[#ccc]">{label}</td>
                      <td className="py-2.5 px-3 text-[#666] uppercase text-xs">
                        {licence === 'carsi' ? 'CARSI' : 'DR/NRPG'}
                      </td>
                      <td className="py-2.5 px-3 text-[#888]">
                        {mapping?.xero_org_name ?? (
                          <span className="text-[#444] italic">not mapped</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {mapping?.sync_enabled ? (
                          <span className="text-[#00FF88] text-xs flex items-center gap-1">
                            <CheckCircle2 size={11} /> Enabled
                          </span>
                        ) : mapping ? (
                          <span className="text-[#FFB800] text-xs flex items-center gap-1">
                            <AlertCircle size={11} /> Pending confirm
                          </span>
                        ) : (
                          <span className="text-[#444] text-xs flex items-center gap-1">
                            <XCircle size={11} /> Not mapped
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[#555] text-xs">
                        {result
                          ? `${result.records} records · ${new Date(result.at).toLocaleTimeString('en-AU')}`
                          : mapping?.last_synced_at
                            ? new Date(mapping.last_synced_at).toLocaleString('en-AU')
                            : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => void syncBusiness(key)}
                          disabled={!mapping?.sync_enabled || syncing[key]}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-[#00F5FF]/30 text-[#00F5FF] rounded-sm hover:bg-[#00F5FF]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {syncing[key]
                            ? <Loader2 size={10} className="animate-spin" />
                            : <Play size={10} />}
                          Sync
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Sync All button */}
          <button
            onClick={() => void syncAll()}
            disabled={!syncReady}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00F5FF]/10 border border-[#00F5FF]/40 text-[#00F5FF] text-sm rounded-sm hover:bg-[#00F5FF]/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Play size={14} />
            Sync All Enabled Businesses
            {syncReady && (
              <span className="text-xs text-[#00F5FF]/60">({totalEnabled} enabled)</span>
            )}
          </button>
          {!syncReady && (
            <p className="text-xs text-[#555] mt-2">
              Map and confirm tenant mappings above to enable sync.
            </p>
          )}
        </SectionCard>

      </div>
    </div>
  );
}
