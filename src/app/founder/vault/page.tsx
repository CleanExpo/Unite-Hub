"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type VaultCategory = "login" | "api-key" | "banking" | "licence" | "other";

interface VaultItem {
  id: string;
  owner_id: string;
  business_id: string;
  category: VaultCategory;
  label: string;
  url: string | null;
  notes: string | null;
  last_accessed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RevealState {
  itemId: string;
  secret: string;
  expiresAt: number; // unix seconds
  secondsLeft: number;
}

interface FormState {
  business_id: string;
  category: VaultCategory;
  label: string;
  url: string;
  notes: string;
  secret: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUSINESSES = [
  { id: "all", label: "All" },
  { id: "disaster-recovery", label: "Disaster Recovery" },
  { id: "restore-assist", label: "Restore Assist" },
  { id: "ato", label: "ATO" },
  { id: "nrpg", label: "NRPG" },
  { id: "unite-group", label: "Unite Group" },
  { id: "carsi", label: "CARSI" },
];

const CATEGORIES: { id: VaultCategory | "all"; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "🗃️" },
  { id: "login", label: "Login", icon: "🔐" },
  { id: "api-key", label: "API Keys", icon: "🔑" },
  { id: "banking", label: "Banking", icon: "🏦" },
  { id: "licence", label: "Licences", icon: "📄" },
  { id: "other", label: "Other", icon: "📎" },
];

const BLANK_FORM: FormState = {
  business_id: "unite-group",
  category: "login",
  label: "",
  url: "",
  notes: "",
  secret: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function categoryIcon(cat: VaultCategory): string {
  return CATEGORIES.find((c) => c.id === cat)?.icon ?? "📎";
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function businessLabel(id: string): string {
  return BUSINESSES.find((b) => b.id === id)?.label ?? id;
}

// ─── Animation Variants ───────────────────────────────────────────────────────

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, scale: 0.95, y: 12, transition: { duration: 0.14 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, delay: i * 0.04, ease: [0.4, 0, 0.2, 1] },
  }),
};

const revealVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.16 } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.12 } },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function FounderVaultPage() {
  // Data state
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [activeBusiness, setActiveBusiness] = useState<string>("all");
  const [activeCategory, setActiveCategory] = useState<VaultCategory | "all">("all");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Reveal state
  const [reveal, setReveal] = useState<RevealState | null>(null);
  const [revealing, setRevealing] = useState<string | null>(null); // itemId currently being revealed
  const revealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Data fetching ────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeBusiness !== "all") params.set("business", activeBusiness);
      if (activeCategory !== "all") params.set("category", activeCategory);

      const res = await fetch(`/api/founder/vault?${params.toString()}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error ?? "Failed to load vault");
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, activeCategory]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ─── Reveal timer ─────────────────────────────────────────────────────────

  const clearReveal = useCallback(() => {
    setReveal(null);
    if (revealTimerRef.current) {
      clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  const startRevealCountdown = useCallback(
    (state: RevealState) => {
      setReveal(state);
      if (revealTimerRef.current) clearInterval(revealTimerRef.current);

      revealTimerRef.current = setInterval(() => {
        const secondsLeft = Math.max(0, state.expiresAt - Math.floor(Date.now() / 1000));
        setReveal((prev) => (prev ? { ...prev, secondsLeft } : null));
        if (secondsLeft <= 0) clearReveal();
      }, 1000);
    },
    [clearReveal]
  );

  useEffect(() => () => clearReveal(), [clearReveal]);

  // ─── Reveal handler ───────────────────────────────────────────────────────

  const handleReveal = async (itemId: string) => {
    if (revealing) return;
    setRevealing(itemId);
    clearReveal();

    try {
      const res = await fetch(`/api/founder/vault/${itemId}/reveal`, { method: "POST" });
      const data = await res.json();

      if (!data.success) throw new Error(data.error ?? "Failed to reveal secret");

      startRevealCountdown({
        itemId,
        secret: data.secret,
        expiresAt: data.expiresAt,
        secondsLeft: 30,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reveal secret");
    } finally {
      setRevealing(null);
    }
  };

  // ─── Copy to clipboard ────────────────────────────────────────────────────

  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard access denied");
    }
  };

  // ─── Modal helpers ────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingItem(null);
    setForm({
      ...BLANK_FORM,
      business_id: activeBusiness !== "all" ? activeBusiness : "unite-group",
      category: activeCategory !== "all" ? activeCategory : "login",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (item: VaultItem) => {
    setEditingItem(item);
    setForm({
      business_id: item.business_id,
      category: item.category,
      label: item.label,
      url: item.url ?? "",
      notes: item.notes ?? "",
      secret: "", // never pre-fill secret
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setForm(BLANK_FORM);
    setFormError(null);
  };

  // ─── Form submit ──────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.label.trim()) { setFormError("Label is required"); return; }
    if (!editingItem && !form.secret.trim()) { setFormError("Secret is required for new items"); return; }

    setSubmitting(true);
    try {
      if (editingItem) {
        // PUT — update existing
        const body: Record<string, string | null> = {
          label: form.label,
          url: form.url || null,
          notes: form.notes || null,
          category: form.category,
          business_id: form.business_id,
        };
        if (form.secret.trim()) body.secret = form.secret;

        const res = await fetch(`/api/founder/vault/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error ?? "Update failed");
      } else {
        // POST — create new
        const res = await fetch("/api/founder/vault", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            business_id: form.business_id,
            category: form.category,
            label: form.label,
            url: form.url || null,
            notes: form.notes || null,
            secret: form.secret,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error ?? "Create failed");
      }

      closeModal();
      await fetchItems();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete handler ───────────────────────────────────────────────────────

  const handleDelete = async (itemId: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/founder/vault/${itemId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Delete failed");

      setDeleteConfirmId(null);
      if (reveal?.itemId === itemId) clearReveal();
      await fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">

      {/* ── Left Sidebar: Business Filter ── */}
      <aside className="w-52 shrink-0 border-r border-[#00F5FF]/10 flex flex-col gap-1 p-4 sticky top-0 h-screen overflow-y-auto">
        <p className="text-[#00F5FF]/50 text-xs font-mono uppercase tracking-widest mb-3">
          Business
        </p>
        {BUSINESSES.map((biz) => (
          <button
            key={biz.id}
            onClick={() => setActiveBusiness(biz.id)}
            className={[
              "text-left px-3 py-2 rounded-sm text-sm font-mono transition-colors",
              activeBusiness === biz.id
                ? "bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/40"
                : "text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent",
            ].join(" ")}
          >
            {biz.label}
          </button>
        ))}
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0 p-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-mono text-[#00F5FF] tracking-tight">
            Credential Vault
          </h1>
          <p className="text-white/40 text-sm font-mono mt-1">
            Encrypted with pgsodium — secrets never leave the vault unprotected
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 mb-6 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as VaultCategory | "all")}
              className={[
                "px-3 py-1.5 rounded-sm text-sm font-mono border transition-colors",
                activeCategory === cat.id
                  ? "bg-[#00F5FF]/10 text-[#00F5FF] border-[#00F5FF]/40"
                  : "text-white/50 border-white/10 hover:text-white/80 hover:border-white/20",
              ].join(" ")}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-sm border border-[#FF4444]/40 bg-[#FF4444]/10 text-[#FF4444] text-sm font-mono flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 text-white/40 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#00F5FF]/30 border-t-[#00F5FF] rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <span className="text-5xl">🔐</span>
            <p className="text-white/40 font-mono text-sm">No credentials found</p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-[#00F5FF]/10 border border-[#00F5FF]/40 text-[#00F5FF] rounded-sm text-sm font-mono hover:bg-[#00F5FF]/20 transition-colors"
            >
              Add first credential
            </button>
          </div>
        )}

        {/* Card Grid */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-[#0a0a0a] border border-[#00F5FF]/15 rounded-sm p-4 flex flex-col gap-3 hover:border-[#00F5FF]/30 transition-colors"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl shrink-0">{categoryIcon(item.category)}</span>
                    <div className="min-w-0">
                      <p className="font-mono text-sm text-white truncate">{item.label}</p>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#00F5FF]/60 hover:text-[#00F5FF] truncate block"
                        >
                          {item.url}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-white/30 hover:text-white/70 hover:bg-white/5 rounded-sm transition-colors"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-1.5 text-white/30 hover:text-[#FF4444] hover:bg-[#FF4444]/5 rounded-sm transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-sm text-xs font-mono bg-[#00F5FF]/10 text-[#00F5FF]/80 border border-[#00F5FF]/20">
                    {businessLabel(item.business_id)}
                  </span>
                  <span className="px-2 py-0.5 rounded-sm text-xs font-mono bg-white/5 text-white/50 border border-white/10">
                    {item.category}
                  </span>
                </div>

                {/* Notes preview */}
                {item.notes && (
                  <p className="text-xs text-white/30 font-mono leading-relaxed line-clamp-2">
                    {item.notes}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                  <span className="text-xs text-white/25 font-mono">
                    Accessed: {formatDate(item.last_accessed_at)}
                  </span>
                  <button
                    onClick={() => handleReveal(item.id)}
                    disabled={revealing === item.id}
                    className="px-3 py-1 rounded-sm text-xs font-mono border border-[#FFB800]/30 text-[#FFB800] hover:bg-[#FFB800]/10 disabled:opacity-50 transition-colors"
                  >
                    {revealing === item.id ? "Decrypting…" : "Reveal"}
                  </button>
                </div>

                {/* Inline Reveal Panel */}
                <AnimatePresence>
                  {reveal?.itemId === item.id && (
                    <motion.div
                      variants={revealVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="mt-1 p-3 rounded-sm border border-[#FFB800]/30 bg-[#FFB800]/5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#FFB800] text-xs font-mono">
                          Auto-masks in {reveal.secondsLeft}s
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(reveal.secret)}
                            className="text-xs font-mono text-white/50 hover:text-white px-2 py-0.5 rounded-sm border border-white/10 hover:border-white/30 transition-colors"
                          >
                            {copied ? "Copied!" : "Copy"}
                          </button>
                          <button
                            onClick={clearReveal}
                            className="text-xs font-mono text-white/30 hover:text-white/60"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-0.5 bg-white/10 rounded-sm mb-3">
                        <motion.div
                          className="h-full bg-[#FFB800] rounded-sm"
                          style={{ width: `${(reveal.secondsLeft / 30) * 100}%` }}
                          transition={{ duration: 1, ease: "linear" }}
                        />
                      </div>
                      <p className="font-mono text-xs text-[#00FF88] break-all select-all">
                        {reveal.secret}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Delete Confirm */}
                <AnimatePresence>
                  {deleteConfirmId === item.id && (
                    <motion.div
                      variants={revealVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="mt-1 p-3 rounded-sm border border-[#FF4444]/30 bg-[#FF4444]/5"
                    >
                      <p className="text-xs font-mono text-[#FF4444] mb-3">
                        Delete &quot;{item.label}&quot;? This is permanent.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleting}
                          className="px-3 py-1 rounded-sm text-xs font-mono bg-[#FF4444]/20 text-[#FF4444] border border-[#FF4444]/40 hover:bg-[#FF4444]/30 disabled:opacity-50 transition-colors"
                        >
                          {deleting ? "Deleting…" : "Delete"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1 rounded-sm text-xs font-mono text-white/40 border border-white/10 hover:text-white/70 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* ── Floating Action Button ── */}
      <motion.button
        onClick={openAddModal}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        className="fixed bottom-8 right-8 px-5 py-3 bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm shadow-lg shadow-[#00F5FF]/20 hover:bg-[#00F5FF]/90 transition-colors z-40"
      >
        + Add Credential
      </motion.button>

      {/* ── Add/Edit Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="vault-backdrop"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={closeModal}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />

            {/* Modal Panel */}
            <motion.div
              key="vault-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 bg-[#0a0a0a] border border-[#00F5FF]/20 rounded-sm p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-mono text-[#00F5FF] text-base">
                  {editingItem ? "Edit Credential" : "Add Credential"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-white/30 hover:text-white/70 text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* Business Select */}
                <div>
                  <label className="block text-xs font-mono text-white/50 mb-1.5">Business</label>
                  <select
                    value={form.business_id}
                    onChange={(e) => setForm((f) => ({ ...f, business_id: e.target.value }))}
                    className="w-full bg-[#050505] border border-white/15 text-white text-sm font-mono rounded-sm px-3 py-2 focus:outline-none focus:border-[#00F5FF]/50"
                  >
                    {BUSINESSES.filter((b) => b.id !== "all").map((b) => (
                      <option key={b.id} value={b.id}>{b.label}</option>
                    ))}
                  </select>
                </div>

                {/* Category Select */}
                <div>
                  <label className="block text-xs font-mono text-white/50 mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value as VaultCategory }))
                    }
                    className="w-full bg-[#050505] border border-white/15 text-white text-sm font-mono rounded-sm px-3 py-2 focus:outline-none focus:border-[#00F5FF]/50"
                  >
                    {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Label */}
                <div>
                  <label className="block text-xs font-mono text-white/50 mb-1.5">
                    Label <span className="text-[#FF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="e.g. Stripe Production API Key"
                    className="w-full bg-[#050505] border border-white/15 text-white text-sm font-mono rounded-sm px-3 py-2 focus:outline-none focus:border-[#00F5FF]/50 placeholder:text-white/20"
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-xs font-mono text-white/50 mb-1.5">URL (optional)</label>
                  <input
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                    placeholder="https://"
                    className="w-full bg-[#050505] border border-white/15 text-white text-sm font-mono rounded-sm px-3 py-2 focus:outline-none focus:border-[#00F5FF]/50 placeholder:text-white/20"
                  />
                </div>

                {/* Secret */}
                <div>
                  <label className="block text-xs font-mono text-white/50 mb-1.5">
                    Secret
                    {editingItem && (
                      <span className="text-white/30 ml-2">(leave blank to keep current)</span>
                    )}
                    {!editingItem && <span className="text-[#FF4444] ml-1">*</span>}
                  </label>
                  <input
                    type="password"
                    value={form.secret}
                    onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
                    placeholder={editingItem ? "••••••••" : "Password, token, or key…"}
                    className="w-full bg-[#050505] border border-white/15 text-white text-sm font-mono rounded-sm px-3 py-2 focus:outline-none focus:border-[#00F5FF]/50 placeholder:text-white/20"
                    autoComplete="new-password"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-mono text-white/50 mb-1.5">Notes (optional)</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    placeholder="Username, account number, or other context…"
                    className="w-full bg-[#050505] border border-white/15 text-white text-sm font-mono rounded-sm px-3 py-2 focus:outline-none focus:border-[#00F5FF]/50 placeholder:text-white/20 resize-none"
                  />
                </div>

                {/* Form Error */}
                {formError && (
                  <p className="text-[#FF4444] text-xs font-mono">{formError}</p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 bg-[#00F5FF]/10 border border-[#00F5FF]/40 text-[#00F5FF] font-mono text-sm rounded-sm hover:bg-[#00F5FF]/20 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? "Saving…" : editingItem ? "Save Changes" : "Add Credential"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-white/10 text-white/40 font-mono text-sm rounded-sm hover:text-white/70 hover:border-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
