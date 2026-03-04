'use client';

/**
 * Agent Army Dashboard — /founder/agents/army
 * Monitoring hub for Revenue, Growth, and Authority commanders.
 * Scientific Luxury design system.
 *
 * UNI-1445
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  TrendingUp,
  Star,
  Clock,
  DollarSign,
  ChevronRight,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgentRun {
  id: string;
  agent_id: string;
  commander: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  cost_tokens: number;
  cost_usd: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

interface Costs {
  todayAud:  number;
  weekAud:   number;
  monthAud:  number;
}

interface Opportunity {
  id: string;
  source_agent: string;
  type: string;
  title: string;
  description: string | null;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: string;
  revenue_potential: string | null;
  created_at: string;
}

interface ContentItem {
  id: string;
  platform: string;
  draft_content: string;
  status: string;
  source_agent: string | null;
  scheduled_for: string | null;
  created_at: string;
}

interface Lead {
  id: string;
  source_agent: string;
  company: string | null;
  contact_name: string | null;
  contact_email: string | null;
  industry: string | null;
  score: number;
  status: string;
  created_at: string;
}

// ─── Commanders config ────────────────────────────────────────────────────────

const COMMANDERS = [
  {
    id: 'revenue',
    name: 'Commander Revenue',
    subtitle: 'Senior PM (Sonnet 4)',
    icon: DollarSign,
    colour: '#00FF88',
    agentId: 'commander-revenue',
    task: 'Generate daily revenue opportunity brief',
  },
  {
    id: 'growth',
    name: 'Commander Growth',
    subtitle: 'Senior PM (Sonnet 4)',
    icon: TrendingUp,
    colour: '#00F5FF',
    agentId: 'commander-growth',
    task: 'Generate daily growth intelligence report',
  },
  {
    id: 'authority',
    name: 'Commander Authority',
    subtitle: 'Senior PM (Sonnet 4)',
    icon: Star,
    colour: '#FFB800',
    agentId: 'commander-authority',
    task: 'Generate daily content calendar and publish queue',
  },
];

// ─── Style helpers ────────────────────────────────────────────────────────────

const PRIORITY_COLOURS: Record<string, string> = {
  urgent: '#FF00FF',
  high:   '#FFB800',
  medium: '#00F5FF',
  low:    '#555555',
};

const PLATFORM_COLOURS: Record<string, string> = {
  linkedin: '#0A66C2',
  twitter:  '#1DA1F2',
  blog:     '#00FF88',
  email:    '#FFB800',
};

const STATUS_COLOURS: Record<string, string> = {
  draft:     '#555555',
  approved:  '#00FF88',
  scheduled: '#00F5FF',
  published: '#00FF88',
  rejected:  '#FF4444',
};

const LEAD_STATUS_COLOURS: Record<string, string> = {
  new:        '#00F5FF',
  qualified:  '#00FF88',
  contacted:  '#FFB800',
  converted:  '#00FF88',
  dismissed:  '#555555',
};

function fmt(n: number) {
  return `A$${n.toFixed(2)}`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AgentArmyPage() {
  const { session, currentOrganization } = useAuth();
  const workspaceId = currentOrganization?.org_id || '';

  const [runs,          setRuns]          = useState<AgentRun[]>([]);
  const [costs,         setCosts]         = useState<Costs>({ todayAud: 0, weekAud: 0, monthAud: 0 });
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contentItems,  setContentItems]  = useState<ContentItem[]>([]);
  const [leads,         setLeads]         = useState<Lead[]>([]);
  const [triggering,    setTriggering]    = useState<Record<string, boolean>>({});
  const [loading,       setLoading]       = useState(true);

  // ── Fetch helpers ──────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    if (!workspaceId) return;

    const base = `/api/founder/agents/army`;
    const qs   = `workspaceId=${workspaceId}`;

    try {
      const [runsRes, oppsRes, cqRes, leadsRes] = await Promise.all([
        fetch(`${base}/runs?${qs}&limit=50`),
        fetch(`${base}/opportunities?${qs}&limit=30`),
        fetch(`${base}/content-queue?${qs}&limit=20`),
        fetch(`${base}/leads?${qs}&limit=20`),
      ]);

      if (runsRes.ok) {
        const d = await runsRes.json();
        setRuns(d.runs || []);
        if (d.costs) setCosts(d.costs);
      }
      if (oppsRes.ok)  { const d = await oppsRes.json();  setOpportunities(d.opportunities || []); }
      if (cqRes.ok)    { const d = await cqRes.json();    setContentItems(d.items || []); }
      if (leadsRes.ok) { const d = await leadsRes.json(); setLeads(d.leads || []); }
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ── Actions ────────────────────────────────────────────────────────────────

  async function triggerCommander(commander: typeof COMMANDERS[0]) {
    setTriggering(prev => ({ ...prev, [commander.id]: true }));
    try {
      await fetch('/api/founder/agents/army/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId:     commander.agentId,
          commander:   commander.id,
          task:        commander.task,
          workspaceId,
        }),
      });
      await fetchAll();
    } finally {
      setTriggering(prev => ({ ...prev, [commander.id]: false }));
    }
  }

  async function updateOpportunity(id: string, status: string) {
    await fetch('/api/founder/agents/army/opportunities', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setOpportunities(prev =>
      prev.map(o => o.id === id ? { ...o, status } : o)
    );
  }

  async function updateContentItem(id: string, status: string) {
    await fetch('/api/founder/agents/army/content-queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setContentItems(prev =>
      prev.map(c => c.id === id ? { ...c, status } : c)
    );
  }

  async function updateLead(id: string, status: string) {
    await fetch('/api/founder/agents/army/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setLeads(prev =>
      prev.map(l => l.id === id ? { ...l, status } : l)
    );
  }

  // ── Last run per commander ─────────────────────────────────────────────────

  function lastRunFor(commanderId: string): AgentRun | undefined {
    return runs
      .filter(r => r.commander === commanderId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }

  function commanderStatus(commanderId: string): 'active' | 'idle' | 'error' {
    const run = lastRunFor(commanderId);
    if (!run) return 'idle';
    if (run.status === 'running' || run.status === 'pending') return 'active';
    if (run.status === 'failed')  return 'error';
    const age = Date.now() - new Date(run.created_at).getTime();
    if (age < 3_600_000) return 'active';
    return 'idle';
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!session) {
    return (
      <div className="p-8 text-center" style={{ color: '#FF4444', fontFamily: 'JetBrains Mono, monospace' }}>
        NOT AUTHENTICATED — please log in to access Agent Army.
      </div>
    );
  }

  return (
    <div
      className="space-y-8 min-h-screen pb-12"
      style={{ background: '#050505', fontFamily: 'JetBrains Mono, monospace' }}
    >
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex items-center justify-between pt-2"
      >
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: '#00F5FF', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}
          >
            AGENT ARMY
          </h1>
          <p className="text-sm mt-1" style={{ color: '#666' }}>
            Autonomous commander network — revenue, growth, authority
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="px-3 py-1 text-xs font-bold tracking-widest"
            style={{
              background: 'rgba(0,255,136,0.1)',
              border: '1px solid #00FF88',
              color: '#00FF88',
              borderRadius: '2px',
            }}
          >
            ACTIVE
          </span>
          <button
            onClick={fetchAll}
            className="p-2"
            style={{ border: '1px solid #333', borderRadius: '2px', background: 'transparent', color: '#666', cursor: 'pointer' }}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </motion.div>

      {/* ── Cost Tracker ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: 'Today',      value: costs.todayAud },
          { label: 'This Week',  value: costs.weekAud  },
          { label: 'This Month', value: costs.monthAud },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="p-4"
            style={{
              background: '#0a0a0a',
              border: '1px solid #1a1a1a',
              borderRadius: '2px',
            }}
          >
            <p className="text-xs mb-1" style={{ color: '#555' }}>{label}</p>
            <p className="text-xl font-bold" style={{ color: '#00F5FF' }}>{fmt(value)}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Commander Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COMMANDERS.map((cmd, i) => {
          const Icon      = cmd.icon;
          const run       = lastRunFor(cmd.id);
          const status    = commanderStatus(cmd.id);
          const isBusy    = triggering[cmd.id];

          const statusColour =
            status === 'active' ? '#00FF88' :
            status === 'error'  ? '#FF4444' :
            '#555555';

          return (
            <motion.div
              key={cmd.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07, ease: [0.4, 0, 0.2, 1] }}
              className="p-5 flex flex-col gap-3"
              style={{
                background: '#0a0a0a',
                border: `1px solid ${cmd.colour}22`,
                borderRadius: '2px',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2"
                    style={{ background: `${cmd.colour}15`, borderRadius: '2px' }}
                  >
                    <Icon size={18} style={{ color: cmd.colour }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#e0e0e0' }}>{cmd.name}</p>
                    <p className="text-xs" style={{ color: '#555' }}>{cmd.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-sm"
                    style={{ background: statusColour, boxShadow: status === 'active' ? `0 0 6px ${statusColour}` : 'none' }}
                  />
                  <span className="text-xs" style={{ color: statusColour }}>{status.toUpperCase()}</span>
                </div>
              </div>

              {run && (
                <div
                  className="px-3 py-2 text-xs"
                  style={{ background: '#111', borderRadius: '2px', color: '#555', lineHeight: 1.5 }}
                >
                  <span style={{ color: '#444' }}>Last: </span>
                  <span style={{ color: '#888' }}>{run.task.slice(0, 60)}{run.task.length > 60 ? '…' : ''}</span>
                  <br />
                  <span style={{ color: '#333' }}>{relativeTime(run.created_at)}</span>
                </div>
              )}

              <button
                onClick={() => triggerCommander(cmd)}
                disabled={isBusy}
                className="mt-auto flex items-center justify-center gap-2 py-2 text-xs font-bold tracking-widest transition-all"
                style={{
                  border: `1px solid ${cmd.colour}`,
                  background: isBusy ? `${cmd.colour}15` : 'transparent',
                  color: cmd.colour,
                  borderRadius: '2px',
                  cursor: isBusy ? 'not-allowed' : 'pointer',
                  opacity: isBusy ? 0.6 : 1,
                }}
              >
                {isBusy ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    TRIGGERING…
                  </>
                ) : (
                  <>
                    <Zap size={12} />
                    TRIGGER RUN
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* ── Opportunities + Content Queue ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Opportunities Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold tracking-widest" style={{ color: '#00F5FF' }}>
              OPPORTUNITIES
            </h2>
            <span className="text-xs" style={{ color: '#444' }}>
              {opportunities.filter(o => o.status === 'new').length} new
            </span>
          </div>

          <div
            className="space-y-2 overflow-y-auto"
            style={{ maxHeight: '420px' }}
          >
            <AnimatePresence>
              {opportunities.length === 0 && !loading && (
                <p className="text-xs py-8 text-center" style={{ color: '#333' }}>
                  No opportunities yet — run a commander to populate this feed.
                </p>
              )}
              {opportunities.map((opp, i) => (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, delay: i * 0.04, ease: [0.4, 0, 0.2, 1] }}
                  className="p-3"
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderLeft: `3px solid ${PRIORITY_COLOURS[opp.priority] ?? '#555'}`,
                    borderRadius: '2px',
                    opacity: opp.status === 'dismissed' ? 0.4 : 1,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-1.5 py-0.5 text-xs font-bold tracking-wider"
                          style={{
                            background: `${PRIORITY_COLOURS[opp.priority] ?? '#555'}20`,
                            color: PRIORITY_COLOURS[opp.priority] ?? '#555',
                            borderRadius: '2px',
                            fontSize: '9px',
                          }}
                        >
                          {opp.priority.toUpperCase()}
                        </span>
                        <span
                          className="px-1.5 py-0.5 text-xs"
                          style={{ color: '#444', fontSize: '9px' }}
                        >
                          {opp.type}
                        </span>
                      </div>
                      <p className="text-xs font-medium truncate" style={{ color: '#ccc' }}>{opp.title}</p>
                      {opp.revenue_potential && (
                        <p className="text-xs mt-0.5" style={{ color: '#00FF88' }}>
                          A${Number(opp.revenue_potential).toLocaleString()} potential
                        </p>
                      )}
                      <p className="text-xs mt-1" style={{ color: '#444' }}>
                        {opp.source_agent} · {relativeTime(opp.created_at)}
                      </p>
                    </div>
                    {opp.status === 'new' && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => updateOpportunity(opp.id, 'reviewing')}
                          className="p-1.5"
                          style={{ border: '1px solid #00F5FF44', background: 'transparent', color: '#00F5FF', borderRadius: '2px', cursor: 'pointer' }}
                          title="Review"
                        >
                          <ChevronRight size={11} />
                        </button>
                        <button
                          onClick={() => updateOpportunity(opp.id, 'dismissed')}
                          className="p-1.5"
                          style={{ border: '1px solid #FF444444', background: 'transparent', color: '#FF4444', borderRadius: '2px', cursor: 'pointer' }}
                          title="Dismiss"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}
                    {opp.status === 'reviewing' && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => updateOpportunity(opp.id, 'actioned')}
                          className="p-1.5"
                          style={{ border: '1px solid #00FF8844', background: 'transparent', color: '#00FF88', borderRadius: '2px', cursor: 'pointer' }}
                          title="Actioned"
                        >
                          <Check size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Content Queue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold tracking-widest" style={{ color: '#FFB800' }}>
              CONTENT QUEUE
            </h2>
            <span className="text-xs" style={{ color: '#444' }}>
              {contentItems.filter(c => c.status === 'draft').length} pending review
            </span>
          </div>

          <div
            className="space-y-2 overflow-y-auto"
            style={{ maxHeight: '420px' }}
          >
            <AnimatePresence>
              {contentItems.length === 0 && !loading && (
                <p className="text-xs py-8 text-center" style={{ color: '#333' }}>
                  No content queued yet.
                </p>
              )}
              {contentItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: i * 0.04, ease: [0.4, 0, 0.2, 1] }}
                  className="p-3"
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderRadius: '2px',
                    opacity: item.status === 'rejected' ? 0.4 : 1,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-1.5 py-0.5 text-xs font-bold"
                          style={{
                            background: `${PLATFORM_COLOURS[item.platform] ?? '#555'}20`,
                            color: PLATFORM_COLOURS[item.platform] ?? '#aaa',
                            borderRadius: '2px',
                            fontSize: '9px',
                          }}
                        >
                          {item.platform.toUpperCase()}
                        </span>
                        <span
                          className="px-1.5 py-0.5 text-xs"
                          style={{
                            background: `${STATUS_COLOURS[item.status] ?? '#555'}20`,
                            color: STATUS_COLOURS[item.status] ?? '#aaa',
                            borderRadius: '2px',
                            fontSize: '9px',
                          }}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: '#888', lineHeight: 1.5 }}>
                        {item.draft_content.slice(0, 100)}{item.draft_content.length > 100 ? '…' : ''}
                      </p>
                      {item.source_agent && (
                        <p className="text-xs mt-1" style={{ color: '#444' }}>
                          {item.source_agent} · {relativeTime(item.created_at)}
                        </p>
                      )}
                    </div>
                    {item.status === 'draft' && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => updateContentItem(item.id, 'approved')}
                          className="p-1.5"
                          style={{ border: '1px solid #00FF8844', background: 'transparent', color: '#00FF88', borderRadius: '2px', cursor: 'pointer' }}
                          title="Approve"
                        >
                          <Check size={11} />
                        </button>
                        <button
                          onClick={() => updateContentItem(item.id, 'rejected')}
                          className="p-1.5"
                          style={{ border: '1px solid #FF444444', background: 'transparent', color: '#FF4444', borderRadius: '2px', cursor: 'pointer' }}
                          title="Reject"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ── Leads Pipeline ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold tracking-widest" style={{ color: '#00FF88' }}>
            LEADS PIPELINE
          </h2>
          <span className="text-xs" style={{ color: '#444' }}>
            {leads.filter(l => l.status === 'new').length} new · {leads.filter(l => l.status === 'qualified').length} qualified
          </span>
        </div>

        <div
          style={{
            background: '#0a0a0a',
            border: '1px solid #1a1a1a',
            borderRadius: '2px',
            overflowX: 'auto',
          }}
        >
          {leads.length === 0 && !loading ? (
            <p className="text-xs py-8 text-center" style={{ color: '#333' }}>
              No leads yet — run a commander to source leads.
            </p>
          ) : (
            <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                  {['Company', 'Contact', 'Industry', 'Score', 'Status', 'Source', ''].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium tracking-wider"
                      style={{ color: '#444', fontSize: '10px' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {leads.map((lead, i) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      style={{ borderBottom: '1px solid #111' }}
                    >
                      <td className="px-4 py-3" style={{ color: '#ccc' }}>
                        {lead.company ?? <span style={{ color: '#444' }}>—</span>}
                      </td>
                      <td className="px-4 py-3" style={{ color: '#888' }}>
                        <div>{lead.contact_name ?? '—'}</div>
                        {lead.contact_email && (
                          <div style={{ color: '#444', fontSize: '10px' }}>{lead.contact_email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3" style={{ color: '#666' }}>
                        {lead.industry ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            style={{
                              width: '48px',
                              height: '4px',
                              background: '#1a1a1a',
                              borderRadius: '2px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${lead.score}%`,
                                height: '100%',
                                background: lead.score >= 75 ? '#00FF88' : lead.score >= 50 ? '#00F5FF' : '#FFB800',
                                borderRadius: '2px',
                              }}
                            />
                          </div>
                          <span style={{ color: '#888' }}>{lead.score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 font-bold"
                          style={{
                            background: `${LEAD_STATUS_COLOURS[lead.status] ?? '#555'}15`,
                            color: LEAD_STATUS_COLOURS[lead.status] ?? '#555',
                            borderRadius: '2px',
                            fontSize: '9px',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {lead.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: '#444' }}>
                        {lead.source_agent}
                      </td>
                      <td className="px-4 py-3">
                        {lead.status === 'new' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => updateLead(lead.id, 'qualified')}
                              className="px-2 py-1 text-xs"
                              style={{ border: '1px solid #00F5FF44', color: '#00F5FF', background: 'transparent', borderRadius: '2px', cursor: 'pointer' }}
                            >
                              Qualify
                            </button>
                            <button
                              onClick={() => updateLead(lead.id, 'dismissed')}
                              className="px-2 py-1 text-xs"
                              style={{ border: '1px solid #FF444444', color: '#FF4444', background: 'transparent', borderRadius: '2px', cursor: 'pointer' }}
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                        {lead.status === 'qualified' && (
                          <button
                            onClick={() => updateLead(lead.id, 'contacted')}
                            className="px-2 py-1 text-xs"
                            style={{ border: '1px solid #FFB80044', color: '#FFB800', background: 'transparent', borderRadius: '2px', cursor: 'pointer' }}
                          >
                            Mark Contacted
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* ── Recent Runs Log ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} style={{ color: '#444' }} />
          <h2 className="text-sm font-bold tracking-widest" style={{ color: '#666' }}>
            RECENT RUNS
          </h2>
        </div>

        <div className="space-y-1">
          {runs.slice(0, 10).map((run) => {
            const statusColour =
              run.status === 'completed' ? '#00FF88' :
              run.status === 'running'   ? '#00F5FF' :
              run.status === 'pending'   ? '#FFB800' :
              '#FF4444';

            return (
              <div
                key={run.id}
                className="flex items-center gap-3 px-3 py-2"
                style={{ background: '#0a0a0a', borderRadius: '2px', border: '1px solid #111' }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-sm shrink-0"
                  style={{
                    background: statusColour,
                    boxShadow: run.status === 'running' ? `0 0 4px ${statusColour}` : 'none',
                  }}
                />
                <span className="text-xs font-medium truncate flex-1" style={{ color: '#888' }}>
                  {run.agent_id}
                </span>
                <span className="text-xs truncate" style={{ color: '#555', maxWidth: '300px' }}>
                  {run.task.slice(0, 60)}{run.task.length > 60 ? '…' : ''}
                </span>
                <span className="text-xs shrink-0" style={{ color: '#333' }}>
                  {relativeTime(run.created_at)}
                </span>
                <span
                  className="text-xs shrink-0 font-bold"
                  style={{ color: statusColour, fontSize: '9px', letterSpacing: '0.05em' }}
                >
                  {run.status.toUpperCase()}
                </span>
              </div>
            );
          })}

          {runs.length === 0 && !loading && (
            <p className="text-xs py-4 text-center" style={{ color: '#333' }}>
              No runs logged yet.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
