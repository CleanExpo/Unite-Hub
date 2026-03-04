"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApprovalStatus = "pending" | "approved" | "rejected" | "deferred" | "executed";
type ApprovalType = "email" | "linear" | "pr" | "content" | "contract" | "agent_output";

interface ApprovalItem {
  id: string;
  type: ApprovalType;
  title: string;
  summary: string | null;
  content_json: Record<string, any>;
  status: ApprovalStatus;
  priority: number;
  agent_source: string | null;
  review_notes: any[] | null;
  execution_config: Record<string, any> | null;
  execution_result: Record<string, any> | null;
  callback_url: string | null;
  owner_id: string;
  workspace_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface ApprovalComment {
  id: string;
  approval_id: string;
  author: string;
  body: string;
  created_at: string;
}

interface Counts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
  deferred: number;
  executed: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const TYPE_FILTERS: { key: ApprovalType | "all"; label: string; colour: string }[] = [
  { key: "all", label: "All Types", colour: "#888" },
  { key: "email", label: "Email", colour: "#00F5FF" },
  { key: "linear", label: "Linear", colour: "#6366F1" },
  { key: "pr", label: "PR", colour: "#00FF88" },
  { key: "content", label: "Content", colour: "#FFB800" },
  { key: "agent_output", label: "Agent Output", colour: "#A78BFA" },
];

const TYPE_COLOURS: Record<string, string> = {
  email: "#00F5FF",
  linear: "#6366F1",
  pr: "#00FF88",
  content: "#FFB800",
  contract: "#F472B6",
  agent_output: "#A78BFA",
};

const PRIORITY_LABELS: Record<number, { label: string; colour: string }> = {
  1: { label: "URGENT", colour: "#FF4444" },
  2: { label: "NORMAL", colour: "#FFB800" },
  3: { label: "LOW", colour: "#555" },
};

const AGENT_COLOURS: Record<string, string> = {
  bron: "#00F5FF",
  quill: "#FFB800",
  sage: "#00FF88",
  vex: "#FF4444",
  forge: "#A78BFA",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatJson(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [counts, setCounts] = useState<Counts>({ all: 0, pending: 0, approved: 0, rejected: 0, deferred: 0, executed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [comments, setComments] = useState<ApprovalComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ─── Fetch items ──────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/founder/approvals`);
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.items ?? []);
      setCounts(json.counts ?? { all: 0, pending: 0, approved: 0, rejected: 0, deferred: 0, executed: 0 });
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ─── Fetch detail with comments ───────────────────────────────────────────

  const openDetail = useCallback(async (item: ApprovalItem) => {
    setSelectedItem(item);
    setComments([]);
    setCommentText("");
    try {
      const res = await fetch(`/api/founder/approvals/${item.id}`);
      if (res.ok) {
        const json = await res.json();
        setSelectedItem(json.item);
        setComments(json.comments ?? []);
      }
    } catch {
      // keep the item we already have
    }
  }, []);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const updateStatus = useCallback(async (id: string, status: ApprovalStatus, comment?: string) => {
    setActionLoading(id);

    // Optimistic update
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, status, resolved_at: ['approved', 'rejected'].includes(status) ? new Date().toISOString() : i.resolved_at } : i
    ));
    if (selectedItem?.id === id) {
      setSelectedItem(prev => prev ? { ...prev, status } : null);
    }

    // Update counts optimistically
    setCounts(prev => {
      const oldStatus = items.find(i => i.id === id)?.status ?? 'pending';
      return {
        ...prev,
        [oldStatus]: Math.max(0, (prev as any)[oldStatus] - 1),
        [status]: ((prev as any)[status] ?? 0) + 1,
      };
    });

    try {
      const res = await fetch(`/api/founder/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, comment }),
      });
      if (!res.ok) {
        fetchItems();
      }
    } catch {
      fetchItems();
    } finally {
      setActionLoading(null);
    }
  }, [items, selectedItem, fetchItems]);

  const executeItem = useCallback(async (id: string) => {
    setActionLoading(id);

    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, status: 'executed' as ApprovalStatus } : i
    ));

    try {
      const res = await fetch(`/api/founder/approvals/${id}/execute`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        setItems(prev => prev.map(i => i.id === id ? json.item : i));
        if (selectedItem?.id === id) setSelectedItem(json.item);
      } else {
        fetchItems();
      }
    } catch {
      fetchItems();
    } finally {
      setActionLoading(null);
    }
  }, [selectedItem, fetchItems]);

  // ─── Filtered list ────────────────────────────────────────────────────────

  const filtered = items.filter(i => {
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (typeFilter !== "all" && i.type !== typeFilter) return false;
    return true;
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: "#050505", color: "#E0E0E0" }}>
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-mono font-bold tracking-tight" style={{ color: "#00F5FF" }}>
              Approval Queue
            </h1>
            {counts.pending > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center justify-center h-7 min-w-[28px] px-2 rounded-sm text-xs font-mono font-bold"
                style={{ background: "#00F5FF", color: "#050505" }}
              >
                {counts.pending}
              </motion.span>
            )}
          </div>
          <span className="text-xs font-mono" style={{ color: "#555" }}>
            Human-in-the-Loop
          </span>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 mb-4">
          {STATUS_TABS.map(tab => {
            const count = (counts as any)[tab.key] ?? 0;
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className="px-3 py-1.5 rounded-sm text-xs font-mono font-medium transition-all duration-150"
                style={{
                  background: active ? "#00F5FF" : "#111",
                  color: active ? "#050505" : "#888",
                  border: `1px solid ${active ? "#00F5FF" : "#222"}`,
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span className="ml-1.5 opacity-70">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Type filter pills */}
        <div className="flex gap-1 mb-6 flex-wrap">
          {TYPE_FILTERS.map(tf => {
            const active = typeFilter === tf.key;
            return (
              <button
                key={tf.key}
                onClick={() => setTypeFilter(tf.key)}
                className="px-2.5 py-1 rounded-sm text-xs font-mono transition-all duration-150"
                style={{
                  background: active ? tf.colour + "22" : "#0A0A0A",
                  color: active ? tf.colour : "#555",
                  border: `1px solid ${active ? tf.colour : "#1A1A1A"}`,
                }}
              >
                {tf.label}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 rounded-full"
              style={{ borderColor: "#00F5FF", borderTopColor: "transparent" }}
            />
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div
              className="w-16 h-16 rounded-sm flex items-center justify-center text-2xl"
              style={{ background: "#00FF8815", border: "1px solid #00FF8833" }}
            >
              &#10003;
            </div>
            <p className="text-sm font-mono" style={{ color: "#00FF88" }}>
              Queue is clear
            </p>
            <p className="text-xs font-mono" style={{ color: "#444" }}>
              No items require your attention
            </p>
          </motion.div>
        )}

        {/* Items list */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.03 }}
                  className="rounded-sm p-4 cursor-pointer transition-all duration-150"
                  style={{
                    background: "#0A0A0A",
                    border: "1px solid #1A1A1A",
                  }}
                  onClick={() => openDetail(item)}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = TYPE_COLOURS[item.type] ?? "#333";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#1A1A1A";
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Type badge */}
                      <span
                        className="px-2 py-0.5 rounded-sm text-xs font-mono font-bold uppercase shrink-0"
                        style={{
                          background: (TYPE_COLOURS[item.type] ?? "#555") + "20",
                          color: TYPE_COLOURS[item.type] ?? "#555",
                          border: `1px solid ${(TYPE_COLOURS[item.type] ?? "#555")}33`,
                        }}
                      >
                        {item.type.replace("_", " ")}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: "#E0E0E0" }}>
                          {item.title}
                        </p>
                        {item.summary && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: "#666" }}>
                            {item.summary}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Agent source */}
                      {item.agent_source && (
                        <span
                          className="px-1.5 py-0.5 rounded-sm text-xs font-mono"
                          style={{
                            background: (AGENT_COLOURS[item.agent_source] ?? "#555") + "15",
                            color: AGENT_COLOURS[item.agent_source] ?? "#555",
                          }}
                        >
                          {item.agent_source}
                        </span>
                      )}

                      {/* Priority */}
                      {item.priority === 1 && (
                        <span
                          className="px-1.5 py-0.5 rounded-sm text-xs font-mono font-bold animate-pulse"
                          style={{ color: PRIORITY_LABELS[1].colour }}
                        >
                          {PRIORITY_LABELS[1].label}
                        </span>
                      )}

                      {/* Status badge */}
                      <span
                        className="px-2 py-0.5 rounded-sm text-xs font-mono"
                        style={{
                          background: item.status === "pending" ? "#FFB80020" :
                                     item.status === "approved" ? "#00FF8820" :
                                     item.status === "rejected" ? "#FF444420" :
                                     item.status === "executed" ? "#00F5FF20" : "#55555520",
                          color: item.status === "pending" ? "#FFB800" :
                                 item.status === "approved" ? "#00FF88" :
                                 item.status === "rejected" ? "#FF4444" :
                                 item.status === "executed" ? "#00F5FF" : "#555",
                        }}
                      >
                        {item.status}
                      </span>

                      {/* Time */}
                      <span className="text-xs font-mono" style={{ color: "#444" }}>
                        {relativeTime(item.created_at)}
                      </span>

                      {/* Quick actions */}
                      <div className="flex gap-1 ml-2" onClick={e => e.stopPropagation()}>
                        {item.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateStatus(item.id, "approved")}
                              disabled={actionLoading === item.id}
                              className="px-2 py-1 rounded-sm text-xs font-mono font-bold transition-all duration-150 hover:brightness-125"
                              style={{ background: "#00FF8820", color: "#00FF88", border: "1px solid #00FF8833" }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateStatus(item.id, "rejected")}
                              disabled={actionLoading === item.id}
                              className="px-2 py-1 rounded-sm text-xs font-mono font-bold transition-all duration-150 hover:brightness-125"
                              style={{ background: "#FF444420", color: "#FF4444", border: "1px solid #FF444433" }}
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => updateStatus(item.id, "deferred")}
                              disabled={actionLoading === item.id}
                              className="px-2 py-1 rounded-sm text-xs font-mono font-bold transition-all duration-150 hover:brightness-125"
                              style={{ background: "#FFB80020", color: "#FFB800", border: "1px solid #FFB80033" }}
                            >
                              Defer
                            </button>
                          </>
                        )}
                        {item.status === "approved" && (
                          <button
                            onClick={() => executeItem(item.id)}
                            disabled={actionLoading === item.id}
                            className="px-2 py-1 rounded-sm text-xs font-mono font-bold transition-all duration-150 hover:brightness-125"
                            style={{ background: "#00F5FF20", color: "#00F5FF", border: "1px solid #00F5FF33" }}
                          >
                            Execute
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ─── Detail Panel (slide-in) ───────────────────────────────────────── */}

      <AnimatePresence>
        {selectedItem && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.6)" }}
              onClick={() => setSelectedItem(null)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full z-50 overflow-y-auto"
              style={{
                width: "min(560px, 90vw)",
                background: "#0A0A0A",
                borderLeft: "1px solid #1A1A1A",
              }}
            >
              <div className="p-6 space-y-6">
                {/* Close */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-sm text-xs font-mono font-bold uppercase"
                      style={{
                        background: (TYPE_COLOURS[selectedItem.type] ?? "#555") + "20",
                        color: TYPE_COLOURS[selectedItem.type] ?? "#555",
                      }}
                    >
                      {selectedItem.type.replace("_", " ")}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-sm text-xs font-mono"
                      style={{
                        color: PRIORITY_LABELS[selectedItem.priority]?.colour ?? "#555",
                      }}
                    >
                      {PRIORITY_LABELS[selectedItem.priority]?.label ?? "NORMAL"}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-xl font-mono px-2 py-1 rounded-sm transition-colors hover:bg-white/5"
                    style={{ color: "#555" }}
                  >
                    &#10005;
                  </button>
                </div>

                {/* Title */}
                <h2 className="text-lg font-mono font-bold" style={{ color: "#E0E0E0" }}>
                  {selectedItem.title}
                </h2>

                {/* Summary */}
                {selectedItem.summary && (
                  <p className="text-sm font-mono" style={{ color: "#888" }}>
                    {selectedItem.summary}
                  </p>
                )}

                {/* Meta row */}
                <div className="flex items-center gap-4 text-xs font-mono" style={{ color: "#555" }}>
                  {selectedItem.agent_source && (
                    <span>
                      Agent: <span style={{ color: AGENT_COLOURS[selectedItem.agent_source] ?? "#888" }}>{selectedItem.agent_source}</span>
                    </span>
                  )}
                  <span>Status: <span style={{
                    color: selectedItem.status === "pending" ? "#FFB800" :
                           selectedItem.status === "approved" ? "#00FF88" :
                           selectedItem.status === "rejected" ? "#FF4444" :
                           selectedItem.status === "executed" ? "#00F5FF" : "#555"
                  }}>{selectedItem.status}</span></span>
                  <span>{relativeTime(selectedItem.created_at)}</span>
                </div>

                {/* Content preview */}
                <div>
                  <h3 className="text-xs font-mono font-bold mb-2 uppercase tracking-wider" style={{ color: "#555" }}>
                    Content
                  </h3>
                  <pre
                    className="text-xs font-mono p-4 rounded-sm overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap"
                    style={{ background: "#111", color: "#888", border: "1px solid #1A1A1A" }}
                  >
                    {formatJson(selectedItem.content_json)}
                  </pre>
                </div>

                {/* Review notes */}
                {selectedItem.review_notes && selectedItem.review_notes.length > 0 && (
                  <div>
                    <h3 className="text-xs font-mono font-bold mb-2 uppercase tracking-wider" style={{ color: "#555" }}>
                      Review Notes
                    </h3>
                    <div className="space-y-2">
                      {selectedItem.review_notes.map((note: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-sm text-xs font-mono"
                          style={{ background: "#111", border: "1px solid #1A1A1A" }}
                        >
                          <span style={{ color: AGENT_COLOURS[note.agent] ?? "#888" }}>{note.agent}</span>
                          {note.score !== undefined && <span style={{ color: "#555" }}> ({note.score}/10)</span>}
                          <p className="mt-1" style={{ color: "#888" }}>{note.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Execution result */}
                {selectedItem.execution_result && (
                  <div>
                    <h3 className="text-xs font-mono font-bold mb-2 uppercase tracking-wider" style={{ color: "#555" }}>
                      Execution Result
                    </h3>
                    <pre
                      className="text-xs font-mono p-4 rounded-sm overflow-x-auto whitespace-pre-wrap"
                      style={{ background: "#00F5FF08", color: "#00F5FF", border: "1px solid #00F5FF22" }}
                    >
                      {formatJson(selectedItem.execution_result)}
                    </pre>
                  </div>
                )}

                {/* Comments thread */}
                <div>
                  <h3 className="text-xs font-mono font-bold mb-2 uppercase tracking-wider" style={{ color: "#555" }}>
                    Comments ({comments.length})
                  </h3>
                  {comments.length === 0 && (
                    <p className="text-xs font-mono" style={{ color: "#333" }}>No comments yet</p>
                  )}
                  <div className="space-y-2 mb-3">
                    {comments.map(c => (
                      <div
                        key={c.id}
                        className="p-3 rounded-sm text-xs font-mono"
                        style={{ background: "#111", border: "1px solid #1A1A1A" }}
                      >
                        <div className="flex justify-between mb-1">
                          <span style={{ color: c.author === "phill" ? "#00F5FF" : "#FFB800" }}>
                            {c.author}
                          </span>
                          <span style={{ color: "#333" }}>{relativeTime(c.created_at)}</span>
                        </div>
                        <p style={{ color: "#888" }}>{c.body}</p>
                      </div>
                    ))}
                  </div>
                  <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-3 rounded-sm text-xs font-mono resize-none focus:outline-none"
                    style={{
                      background: "#111",
                      color: "#E0E0E0",
                      border: "1px solid #1A1A1A",
                      minHeight: "60px",
                    }}
                    onFocus={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#00F5FF33";
                    }}
                    onBlur={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#1A1A1A";
                    }}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  {selectedItem.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateStatus(selectedItem.id, "approved", commentText || undefined)}
                        disabled={actionLoading === selectedItem.id}
                        className="flex-1 py-2.5 rounded-sm text-sm font-mono font-bold transition-all duration-150 hover:brightness-125"
                        style={{ background: "#00FF8830", color: "#00FF88", border: "1px solid #00FF8844" }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(selectedItem.id, "rejected", commentText || undefined)}
                        disabled={actionLoading === selectedItem.id}
                        className="flex-1 py-2.5 rounded-sm text-sm font-mono font-bold transition-all duration-150 hover:brightness-125"
                        style={{ background: "#FF444430", color: "#FF4444", border: "1px solid #FF444444" }}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => updateStatus(selectedItem.id, "deferred", commentText || undefined)}
                        disabled={actionLoading === selectedItem.id}
                        className="py-2.5 px-4 rounded-sm text-sm font-mono font-bold transition-all duration-150 hover:brightness-125"
                        style={{ background: "#FFB80020", color: "#FFB800", border: "1px solid #FFB80033" }}
                      >
                        Defer
                      </button>
                    </>
                  )}
                  {selectedItem.status === "approved" && (
                    <button
                      onClick={() => executeItem(selectedItem.id)}
                      disabled={actionLoading === selectedItem.id}
                      className="flex-1 py-2.5 rounded-sm text-sm font-mono font-bold transition-all duration-150 hover:brightness-125"
                      style={{ background: "#00F5FF30", color: "#00F5FF", border: "1px solid #00F5FF44" }}
                    >
                      Execute Action
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
