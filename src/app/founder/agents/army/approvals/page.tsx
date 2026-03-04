'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface Approval {
  id: string;
  agent_id: string;
  commander: string;
  action_type: string;
  title: string;
  description: string;
  priority: string;
  created_at: string;
  expires_at: string;
  status: string;
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: '#FF4444',
  high:   '#FFB800',
  medium: '#00F5FF',
  low:    '#666',
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/founder/agents/army/approvals');
      const data = await res.json();
      setApprovals(data.approvals ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setActing(id + action);
    await fetch('/api/founder/agents/army/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    setActing(null);
    load();
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">APPROVAL QUEUE</h1>
            <p className="text-zinc-500 text-sm mt-1">Human-in-the-loop review for high-value agent actions</p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 border border-[#1a1a1a] rounded-sm text-zinc-400 hover:text-white hover:border-[#00F5FF]/30 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-zinc-600 text-sm">Loading approvals...</div>
        ) : approvals.length === 0 ? (
          <div className="border border-[#1a1a1a] rounded-sm p-12 text-center">
            <CheckCircle className="w-10 h-10 text-[#00FF88] mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">No pending approvals — all clear.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {approvals.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className="border border-[#1a1a1a] rounded-sm p-5 bg-[#0a0a0a]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span
                          className="text-xs font-mono px-2 py-0.5 rounded-sm border"
                          style={{
                            color: PRIORITY_COLOR[a.priority] ?? '#666',
                            borderColor: (PRIORITY_COLOR[a.priority] ?? '#666') + '40',
                            background: (PRIORITY_COLOR[a.priority] ?? '#666') + '10',
                          }}
                        >
                          {(a.priority ?? 'medium').toUpperCase()}
                        </span>
                        <span className="text-xs text-zinc-600 font-mono">{a.agent_id}</span>
                        <span className="text-xs text-zinc-600">·</span>
                        <span className="text-xs text-zinc-600">{a.action_type}</span>
                      </div>
                      <h3 className="text-white text-sm font-medium mb-1">{a.title}</h3>
                      {a.description && (
                        <p className="text-zinc-500 text-xs leading-relaxed">{a.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-zinc-700 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>Expires {new Date(a.expires_at).toLocaleString('en-AU')}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => act(a.id, 'reject')}
                        disabled={acting !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#FF4444]/30 rounded-sm text-[#FF4444] text-xs hover:bg-[#FF4444]/10 disabled:opacity-40 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                      <button
                        onClick={() => act(a.id, 'approve')}
                        disabled={acting !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-sm text-[#00FF88] text-xs hover:bg-[#00FF88]/20 disabled:opacity-40 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
