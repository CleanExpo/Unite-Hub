'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Link2,
  Settings,
  Wallet,
  Calendar,
  Key,
  Loader2,
  BookOpen,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type XeroStatus = 'connected' | 'mapped' | 'disconnected';
type BinaryStatus = 'connected' | 'disconnected';

interface IntegrationStatus {
  xero: Record<string, XeroStatus>;
  stripe: Record<string, BinaryStatus>;
  google: Record<string, BinaryStatus>;
  openclaw: BinaryStatus;
}

interface XeroLicenceInfo {
  status: string;
  connected_at: string | null;
  mapped_businesses: { business_key: string; confirmed_at: string | null }[];
}

interface XeroLicenceStatus {
  carsi: XeroLicenceInfo;
  dr_nrpg: XeroLicenceInfo;
}

interface ObsidianStatus {
  connected: boolean;
  enabled: boolean;
  vaultName: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUSINESSES = [
  { key: 'disaster-recovery', label: 'Disaster Recovery' },
  { key: 'restore-assist', label: 'RestoreAssist' },
  { key: 'ato', label: 'ATO' },
  { key: 'nrpg', label: 'NRPG' },
  { key: 'unite-group', label: 'Unite Group' },
] as const;

const INTEGRATIONS = [
  { key: 'xero', label: 'Xero' },
  { key: 'stripe', label: 'Stripe' },
  { key: 'google', label: 'Google' },
  { key: 'openclaw', label: 'OpenClaw' },
] as const;

// ─── Colour helpers ───────────────────────────────────────────────────────────

const STATUS_COLOURS: Record<string, { dot: string; text: string; border: string; bg: string }> = {
  connected: {
    dot: 'bg-[#00FF88]',
    text: 'text-[#00FF88]',
    border: 'border-[#00FF88]/30',
    bg: 'bg-[#00FF88]/10',
  },
  mapped: {
    dot: 'bg-[#FFB800]',
    text: 'text-[#FFB800]',
    border: 'border-[#FFB800]/30',
    bg: 'bg-[#FFB800]/10',
  },
  disconnected: {
    dot: 'bg-[#FF4444]',
    text: 'text-[#FF4444]',
    border: 'border-[#FF4444]/30',
    bg: 'bg-[#FF4444]/10',
  },
};

function getColours(status: string) {
  return STATUS_COLOURS[status] ?? STATUS_COLOURS.disconnected;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const c = getColours(status);
  return (
    <span
      className={[
        'inline-block w-2 h-2 rounded-full shrink-0',
        c.dot,
        status === 'connected' ? 'shadow-[0_0_6px_currentColor]' : '',
      ].join(' ')}
    />
  );
}

function LicenceBadge({
  label,
  status,
  connectedAt,
  onConnect,
}: {
  label: string;
  status: string;
  connectedAt: string | null;
  onConnect: () => void;
}) {
  const isConnected = status === 'connected';
  const c = getColours(isConnected ? 'connected' : 'disconnected');

  return (
    <div
      className={[
        'flex items-center gap-3 px-4 py-3 border rounded-sm',
        c.border,
        c.bg,
      ].join(' ')}
    >
      {isConnected ? (
        <CheckCircle2 size={14} className={c.text} />
      ) : (
        <XCircle size={14} className={c.text} />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono font-medium text-[#ccc]">{label}</p>
        {connectedAt ? (
          <p className="text-xs text-[#555] mt-0.5">
            Connected {new Date(connectedAt).toLocaleDateString('en-AU')}
          </p>
        ) : (
          <p className={['text-xs mt-0.5', c.text].join(' ')}>
            {isConnected ? 'Active' : 'Not connected'}
          </p>
        )}
      </div>
      {!isConnected && (
        <button
          onClick={onConnect}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#00F5FF]/40 text-[#00F5FF] rounded-sm hover:bg-[#00F5FF]/10 transition-colors whitespace-nowrap"
        >
          <Link2 size={11} />
          Connect
        </button>
      )}
    </div>
  );
}

function SkeletonCell() {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 animate-pulse">
      <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]" />
      <div className="h-2.5 w-16 bg-[#1a1a1a] rounded-sm" />
    </div>
  );
}

function IntegrationCell({
  status,
  integration,
  businessKey,
}: {
  status: string;
  integration: string;
  businessKey: string;
}) {
  const c = getColours(status);
  const label =
    status === 'connected'
      ? 'Connected'
      : status === 'mapped'
        ? 'Mapped'
        : 'Not set';

  const configureHref =
    integration === 'xero'
      ? '/founder/integrations/xero'
      : integration === 'stripe'
        ? '/founder/vault'
        : integration === 'google'
          ? '/founder/vault'
          : null;

  return (
    <td className="px-3 py-3 border-b border-[#00F5FF]/5">
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-1.5">
          <StatusDot status={status} />
          <span className={['text-xs font-mono', c.text].join(' ')}>{label}</span>
        </div>
        {status !== 'connected' && configureHref && (
          <a
            href={configureHref}
            className="text-[10px] text-[#00F5FF]/60 hover:text-[#00F5FF] transition-colors flex items-center gap-0.5 mt-0.5"
          >
            Configure <span className="text-[8px]">→</span>
          </a>
        )}
      </div>
    </td>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  external,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  external?: boolean;
}) {
  const Tag = external ? 'a' : 'a';
  const props = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <Tag
      href={href}
      {...props}
      className="flex items-center gap-2.5 px-4 py-3 border border-[#00F5FF]/20 bg-[#080808] rounded-sm text-sm text-[#aaa] font-mono hover:border-[#00F5FF]/50 hover:text-[#00F5FF] hover:bg-[#00F5FF]/5 transition-all group"
    >
      <Icon size={14} className="text-[#00F5FF]/60 group-hover:text-[#00F5FF] transition-colors" />
      {label}
      {external && (
        <ExternalLink size={10} className="ml-auto text-[#444] group-hover:text-[#00F5FF]/60" />
      )}
    </Tag>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IntegrationHubPage() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [xeroLicences, setXeroLicences] = useState<XeroLicenceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [obsidianStatus, setObsidianStatus] = useState<ObsidianStatus | null>(null);
  const [obsidianLoading, setObsidianLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setObsidianLoading(true);
    setError('');
    try {
      const [statusRes, licenceRes, obsidianRes] = await Promise.all([
        fetch('/api/founder/integrations/status'),
        fetch('/api/founder/xero/status'),
        fetch('/api/founder/obsidian/status'),
      ]);

      if (statusRes.ok) {
        const data = (await statusRes.json()) as IntegrationStatus;
        setStatus(data);
      } else {
        setError('Failed to load integration status.');
      }

      if (licenceRes.ok) {
        const data = (await licenceRes.json()) as XeroLicenceStatus;
        setXeroLicences(data);
      }

      if (obsidianRes.ok) {
        const data = (await obsidianRes.json()) as ObsidianStatus;
        setObsidianStatus(data);
      }
    } catch {
      setError('Network error loading integration data.');
    } finally {
      setLoading(false);
      setObsidianLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleObsidianSetup = async () => {
    setObsidianLoading(true);
    try {
      const res = await fetch('/api/founder/obsidian/setup', { method: 'POST' });
      if (res.ok) {
        const obsidianRes = await fetch('/api/founder/obsidian/status');
        if (obsidianRes.ok) {
          const data = (await obsidianRes.json()) as ObsidianStatus;
          setObsidianStatus(data);
        }
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'Failed to set up Obsidian vault.');
      }
    } catch {
      setError('Network error setting up Obsidian vault.');
    } finally {
      setObsidianLoading(false);
    }
  };

  const handleSyncAllContacts = async () => {
    setObsidianLoading(true);
    try {
      await fetch('/api/founder/obsidian/contacts/sync-all', { method: 'POST' });
    } catch {
      // non-fatal — sync runs in background
    } finally {
      setObsidianLoading(false);
    }
  };

  const carsiStatus = xeroLicences?.carsi.status ?? 'disconnected';
  const drStatus = xeroLicences?.dr_nrpg.status ?? 'disconnected';
  const openclawConnected = status?.openclaw === 'connected';

  const openclawUrl =
    process.env.NEXT_PUBLIC_OPENCLAW_URL ?? 'https://openclaw.io';

  return (
    <div className="min-h-screen bg-[#050505] text-[#ccc] p-6 font-mono">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* ── Page header ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#00F5FF] tracking-tight">
              Integration Hub
            </h1>
            <p className="text-[#666] text-sm mt-1">
              Manage connections across all businesses
            </p>
          </div>
          <button
            onClick={() => void loadData()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs border border-[#00F5FF]/30 text-[#00F5FF] rounded-sm hover:bg-[#00F5FF]/10 transition-colors disabled:opacity-40"
          >
            {loading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            Refresh
          </button>
        </div>

        {/* ── Error banner ────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 p-3 border border-[#FF4444]/30 bg-[#FF4444]/5 rounded-sm text-[#FF4444] text-sm">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        {/* ── Xero licence status badges ──────────────────────────────────────── */}
        <section>
          <p className="text-xs text-[#555] uppercase tracking-widest mb-3">
            Xero Licence Status
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LicenceBadge
              label="CARSI Licence"
              status={carsiStatus}
              connectedAt={xeroLicences?.carsi.connected_at ?? null}
              onConnect={() => {
                window.location.href = '/api/founder/xero/connect?licence=carsi';
              }}
            />
            <LicenceBadge
              label="DR/NRPG Licence"
              status={drStatus}
              connectedAt={xeroLicences?.dr_nrpg.connected_at ?? null}
              onConnect={() => {
                window.location.href = '/api/founder/xero/connect?licence=dr_nrpg';
              }}
            />
          </div>
        </section>

        {/* ── Integration grid ─────────────────────────────────────────────────── */}
        <section>
          <p className="text-xs text-[#555] uppercase tracking-widest mb-3">
            Business Integration Matrix
          </p>
          <div className="border border-[#00F5FF]/20 bg-[#080808] rounded-sm overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#00F5FF]/20">
                  <th className="text-left px-4 py-3 text-xs text-[#555] uppercase tracking-wider w-40">
                    Business
                  </th>
                  {INTEGRATIONS.map(({ key, label }) => (
                    <th
                      key={key}
                      className="text-left px-3 py-3 text-xs text-[#555] uppercase tracking-wider"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BUSINESSES.map(({ key, label }, rowIdx) => (
                  <tr
                    key={key}
                    className={[
                      'border-b border-[#00F5FF]/5 hover:bg-[#00F5FF]/3 transition-colors',
                      rowIdx === BUSINESSES.length - 1 ? 'border-b-0' : '',
                    ].join(' ')}
                  >
                    {/* Business name cell */}
                    <td className="px-4 py-3 border-b border-[#00F5FF]/5">
                      <span className="text-[#aaa] text-sm font-medium">{label}</span>
                    </td>

                    {/* Xero cell */}
                    {loading ? (
                      <td className="border-b border-[#00F5FF]/5">
                        <SkeletonCell />
                      </td>
                    ) : (
                      <IntegrationCell
                        status={status?.xero?.[key] ?? 'disconnected'}
                        integration="xero"
                        businessKey={key}
                      />
                    )}

                    {/* Stripe cell */}
                    {loading ? (
                      <td className="border-b border-[#00F5FF]/5">
                        <SkeletonCell />
                      </td>
                    ) : (
                      <IntegrationCell
                        status={status?.stripe?.[key] ?? 'disconnected'}
                        integration="stripe"
                        businessKey={key}
                      />
                    )}

                    {/* Google cell */}
                    {loading ? (
                      <td className="border-b border-[#00F5FF]/5">
                        <SkeletonCell />
                      </td>
                    ) : (
                      <IntegrationCell
                        status={status?.google?.[key] ?? 'disconnected'}
                        integration="google"
                        businessKey={key}
                      />
                    )}

                    {/* OpenClaw cell — same value for all rows (account-level) */}
                    {loading ? (
                      <td className="border-b border-[#00F5FF]/5">
                        <SkeletonCell />
                      </td>
                    ) : (
                      <IntegrationCell
                        status={status?.openclaw ?? 'disconnected'}
                        integration="openclaw"
                        businessKey={key}
                      />
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Quick links ─────────────────────────────────────────────────────── */}
        <section>
          <p className="text-xs text-[#555] uppercase tracking-widest mb-3">
            Quick Links
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickLink
              href="/founder/integrations/xero"
              icon={Settings}
              label="Configure Xero"
            />
            <QuickLink
              href="/founder/vault"
              icon={Key}
              label="Credential Vault"
            />
            <QuickLink
              href="/founder/dashboard/financials"
              icon={Wallet}
              label="Financials"
            />
            <QuickLink
              href="/founder/calendar"
              icon={Calendar}
              label="Calendar"
            />
          </div>
        </section>

        {/* ── Obsidian Vault ───────────────────────────────────────────────────── */}
        <section>
          <p className="text-xs text-[#555] uppercase tracking-widest mb-3">
            Obsidian Vault
          </p>
          <div className="border border-[#7C3AED]/20 bg-[#080808] rounded-sm p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-block w-2 h-2 rounded-full shrink-0 bg-[#7C3AED]" />
                <span className="text-sm font-bold text-[#ccc] font-mono">Obsidian Vault</span>
                {obsidianLoading ? (
                  <Loader2 size={12} className="animate-spin text-[#555]" />
                ) : obsidianStatus?.connected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] border border-[#00FF88]/30 bg-[#00FF88]/10 text-[#00FF88] rounded-sm">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00FF88] shadow-[0_0_4px_currentColor]" />
                    Vault Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] border border-[#FF4444]/30 bg-[#FF4444]/10 text-[#FF4444] rounded-sm">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF4444]" />
                    Not Connected
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {!obsidianLoading && !obsidianStatus?.connected && (
                  <button
                    onClick={() => void handleObsidianSetup()}
                    disabled={obsidianLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#7C3AED]/40 text-[#a78bfa] rounded-sm hover:bg-[#7C3AED]/10 transition-colors disabled:opacity-40"
                  >
                    <BookOpen size={11} />
                    Set Up Vault
                  </button>
                )}
                {!obsidianLoading && obsidianStatus?.connected && (
                  <>
                    <button
                      onClick={() => void handleSyncAllContacts()}
                      disabled={obsidianLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#00F5FF]/40 text-[#00F5FF] rounded-sm hover:bg-[#00F5FF]/10 transition-colors disabled:opacity-40"
                    >
                      <RefreshCw size={11} />
                      Sync All Contacts
                    </button>
                  </>
                )}
              </div>
            </div>

            {obsidianStatus?.connected && (
              <div className="mt-4 pt-4 border-t border-[#7C3AED]/10 space-y-1.5">
                <p className="text-xs text-[#555]">
                  Vault: <span className="text-[#aaa] font-mono">{obsidianStatus.vaultName}</span>
                </p>
                <p className="text-xs text-[#444] italic">
                  Requires Google Drive connection
                </p>
              </div>
            )}

            {!obsidianStatus?.connected && !obsidianLoading && (
              <p className="mt-3 text-xs text-[#444] italic">
                Requires Google Drive connection
              </p>
            )}
          </div>
        </section>

        {/* ── OpenClaw panel (conditional) ──────────────────────────────────── */}
        {openclawConnected && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="border border-[#00FF88]/20 bg-[#080808] rounded-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-[#00FF88] font-mono">
                      OpenClaw
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] border border-[#00FF88]/30 bg-[#00FF88]/10 text-[#00FF88] rounded-sm">
                      <StatusDot status="connected" />
                      CONNECTED
                    </span>
                  </div>
                  <p className="text-[#666] text-sm leading-relaxed">
                    AI-powered legal intelligence platform. Access contract analysis,
                    risk scoring, and automated compliance checks across all Unite
                    Group businesses.
                  </p>
                </div>
                <a
                  href={openclawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#00FF88]/10 border border-[#00FF88]/40 text-[#00FF88] text-sm rounded-sm hover:bg-[#00FF88]/20 transition-colors whitespace-nowrap shrink-0"
                >
                  Open OpenClaw
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </motion.section>
        )}
      </motion.div>
    </div>
  );
}
