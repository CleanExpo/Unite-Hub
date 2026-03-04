'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

type DocumentCategory =
  | 'contract'
  | 'licence'
  | 'insurance'
  | 'tax'
  | 'hr'
  | 'financial'
  | 'legal'
  | 'other';

type BusinessId =
  | 'all'
  | 'disaster-recovery'
  | 'restore-assist'
  | 'ato'
  | 'nrpg'
  | 'unite-group'
  | 'carsi';

interface FounderDocument {
  id: string;
  owner_id: string;
  business_id: string;
  file_name: string;
  file_type: string;
  category: DocumentCategory;
  storage_path: string | null;
  drive_file_id: string | null;
  drive_web_url: string | null;
  file_size_bytes: number | null;
  expiry_date: string | null;
  notes: string | null;
  extracted_text: string | null;
  extracted_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUSINESS_LABELS: Record<string, string> = {
  all: 'All',
  'disaster-recovery': 'Disaster Recovery',
  'restore-assist': 'RestoreAssist',
  ato: 'ATO',
  nrpg: 'NRPG',
  'unite-group': 'Unite Group',
  carsi: 'CARSI',
};

const BUSINESSES: BusinessId[] = [
  'all',
  'disaster-recovery',
  'restore-assist',
  'ato',
  'nrpg',
  'unite-group',
  'carsi',
];

const CATEGORIES: { id: DocumentCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'contract', label: 'Contract' },
  { id: 'licence', label: 'Licence' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'tax', label: 'Tax' },
  { id: 'hr', label: 'HR' },
  { id: 'financial', label: 'Financial' },
  { id: 'legal', label: 'Legal' },
  { id: 'other', label: 'Other' },
];

const CATEGORY_COLOURS: Record<DocumentCategory, string> = {
  contract: '#00F5FF',
  licence: '#00FF88',
  insurance: '#FFB800',
  tax: '#FF4444',
  hr: '#FF00FF',
  financial: '#A855F7',
  legal: '#F97316',
  other: '#6B7280',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function daysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  const exp = new Date(expiryDate);
  const diff = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function fileIcon(fileType: string): { icon: string; colour: string } {
  if (fileType.includes('pdf')) return { icon: '📄', colour: '#FF4444' };
  if (fileType.includes('word') || fileType.includes('document'))
    return { icon: '📝', colour: '#00F5FF' };
  if (fileType.includes('sheet') || fileType.includes('excel'))
    return { icon: '📊', colour: '#00FF88' };
  if (fileType.includes('presentation') || fileType.includes('powerpoint'))
    return { icon: '📑', colour: '#FFB800' };
  if (fileType.includes('image')) return { icon: '🖼️', colour: '#A855F7' };
  return { icon: '📎', colour: '#6B7280' };
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [businessId, setBusinessId] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !businessId || !category) {
      setError('File, business, and category are required.');
      return;
    }
    setUploading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('businessId', businessId);
      fd.append('category', category);
      if (expiryDate) fd.append('expiryDate', expiryDate);
      if (notes) fd.append('notes', notes);

      const res = await fetch('/api/founder/documents', { method: 'POST', body: fd });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Upload failed');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-sm p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-mono text-[#00F5FF] text-lg tracking-wide">Upload Document</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white font-mono text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-colors ${
              dragging ? 'border-[#00F5FF] bg-[#00F5FF]/5' : 'border-white/20 hover:border-white/40'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
            />
            {file ? (
              <div>
                <div className="text-[#00FF88] font-mono text-sm">{file.name}</div>
                <div className="text-white/40 text-xs mt-1">{formatBytes(file.size)}</div>
              </div>
            ) : (
              <div>
                <div className="text-white/60 font-mono text-sm">Drop file here or click to browse</div>
                <div className="text-white/30 text-xs mt-1">PDF, Word, Excel, Images supported</div>
              </div>
            )}
          </div>

          {/* Business select */}
          <div>
            <label className="block text-white/60 text-xs font-mono mb-1">Business *</label>
            <select
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-sm text-white text-sm font-mono px-3 py-2 outline-none focus:border-[#00F5FF]"
              required
            >
              <option value="">Select business…</option>
              {BUSINESSES.filter((b) => b !== 'all').map((b) => (
                <option key={b} value={b}>{BUSINESS_LABELS[b]}</option>
              ))}
            </select>
          </div>

          {/* Category select */}
          <div>
            <label className="block text-white/60 text-xs font-mono mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-sm text-white text-sm font-mono px-3 py-2 outline-none focus:border-[#00F5FF]"
              required
            >
              <option value="">Select category…</option>
              {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Expiry date */}
          <div>
            <label className="block text-white/60 text-xs font-mono mb-1">Expiry Date (optional)</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-sm text-white text-sm font-mono px-3 py-2 outline-none focus:border-[#00F5FF]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-white/60 text-xs font-mono mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-[#111] border border-white/10 rounded-sm text-white text-sm font-mono px-3 py-2 outline-none focus:border-[#00F5FF] resize-none"
              placeholder="Add context or notes…"
            />
          </div>

          {error && (
            <div className="text-[#FF4444] text-xs font-mono border border-[#FF4444]/30 rounded-sm px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-[#00F5FF] text-black font-mono text-sm font-semibold py-2.5 rounded-sm disabled:opacity-50 hover:bg-[#00d4dd]"
          >
            {uploading ? 'Uploading…' : 'Upload Document'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  doc: FounderDocument;
  onClose: () => void;
  onSuccess: () => void;
}

function EditModal({ doc, onClose, onSuccess }: EditModalProps) {
  const [category, setCategory] = useState<string>(doc.category);
  const [expiryDate, setExpiryDate] = useState<string>(doc.expiry_date ?? '');
  const [notes, setNotes] = useState<string>(doc.notes ?? '');
  const [tagsInput, setTagsInput] = useState<string>(doc.tags.join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/founder/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, expiryDate: expiryDate || undefined, notes, tags }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Update failed');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-sm p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-mono text-[#00F5FF] text-lg tracking-wide">Edit Document</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white font-mono text-sm">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/60 text-xs font-mono mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-sm text-white text-sm font-mono px-3 py-2 outline-none focus:border-[#00F5FF]"
            >
              {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white/60 text-xs font-mono mb-1">Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-sm text-white text-sm font-mono px-3 py-2 outline-none focus:border-[#00F5FF]"
            />
          </div>

          <div>
            <label className="block text-white/60 text-xs font-mono mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-[#111] border border-white/10 rounded-sm text-white text-sm font-mono px-3 py-2 outline-none focus:border-[#00F5FF] resize-none"
            />
          </div>

          <div>
            <label className="block text-white/60 text-xs font-mono mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-sm text-white text-sm font-mono px-3 py-2 outline-none focus:border-[#00F5FF]"
              placeholder="renewal, priority, archived…"
            />
          </div>

          {error && (
            <div className="text-[#FF4444] text-xs font-mono border border-[#FF4444]/30 rounded-sm px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#00F5FF] text-black font-mono text-sm font-semibold py-2.5 rounded-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Document Card ────────────────────────────────────────────────────────────

interface DocumentCardProps {
  doc: FounderDocument;
  onEdit: (doc: FounderDocument) => void;
  onDelete: (id: string) => void;
  onDownload: (doc: FounderDocument) => void;
}

function DocumentCard({ doc, onEdit, onDelete, onDownload }: DocumentCardProps) {
  const days = daysUntilExpiry(doc.expiry_date);
  const { icon, colour: iconColour } = fileIcon(doc.file_type);
  const catColour = CATEGORY_COLOURS[doc.category] ?? '#6B7280';

  let expiryBadge: React.ReactNode = null;
  if (doc.expiry_date) {
    if (days !== null && days < 0) {
      expiryBadge = (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm border"
          style={{ color: '#FF4444', borderColor: '#FF4444' + '40' }}>
          EXPIRED
        </span>
      );
    } else if (days !== null && days <= 30) {
      expiryBadge = (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm border"
          style={{ color: '#FFB800', borderColor: '#FFB800' + '40' }}>
          {days}d left
        </span>
      );
    } else {
      expiryBadge = (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm border"
          style={{ color: '#00FF88', borderColor: '#00FF88' + '40' }}>
          {new Date(doc.expiry_date).toLocaleDateString('en-AU')}
        </span>
      );
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="bg-[#0a0a0a] border border-white/10 rounded-sm p-4 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-white text-sm truncate" title={doc.file_name}>
            {doc.file_name}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {/* Business badge */}
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-sm text-white/60">
              {BUSINESS_LABELS[doc.business_id] ?? doc.business_id}
            </span>
            {/* Category badge */}
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm border"
              style={{ color: catColour, borderColor: catColour + '40' }}>
              {doc.category.toUpperCase()}
            </span>
            {/* Expiry badge */}
            {expiryBadge}
          </div>
        </div>
      </div>

      {/* File size + notes */}
      <div className="space-y-1">
        {doc.file_size_bytes && (
          <div className="text-white/40 text-xs font-mono">{formatBytes(doc.file_size_bytes)}</div>
        )}
        {doc.notes && (
          <div className="text-white/60 text-xs font-mono line-clamp-2">{doc.notes}</div>
        )}
      </div>

      {/* Tags */}
      {doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {doc.tags.map((tag) => (
            <span key={tag} className="text-[10px] font-mono px-1.5 py-0.5 bg-white/5 rounded-sm text-white/50">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-white/5">
        <button
          onClick={() => onDownload(doc)}
          disabled={!doc.storage_path}
          className="flex-1 text-xs font-mono py-1.5 rounded-sm border border-white/10 text-white/60 hover:text-[#00F5FF] hover:border-[#00F5FF]/40 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Download
        </button>
        <button
          onClick={() => onEdit(doc)}
          className="flex-1 text-xs font-mono py-1.5 rounded-sm border border-white/10 text-white/60 hover:text-[#FFB800] hover:border-[#FFB800]/40"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(doc.id)}
          className="flex-1 text-xs font-mono py-1.5 rounded-sm border border-white/10 text-white/60 hover:text-[#FF4444] hover:border-[#FF4444]/40"
        >
          Delete
        </button>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FounderDocumentsPage() {
  const [documents, setDocuments] = useState<FounderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBusiness, setActiveBusiness] = useState<BusinessId>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [editingDoc, setEditingDoc] = useState<FounderDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeBusiness !== 'all') params.set('businessId', activeBusiness);
      if (activeCategory !== 'all') params.set('category', activeCategory);

      const res = await fetch(`/api/founder/documents?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      const json = await res.json();
      setDocuments(json.documents ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, activeCategory]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function handleDownload(doc: FounderDocument) {
    try {
      const res = await fetch(`/api/founder/documents/${doc.id}`);
      if (!res.ok) throw new Error('Failed to get download URL');
      const json = await res.json();
      if (json.downloadUrl) {
        window.open(json.downloadUrl, '_blank');
      }
    } catch (err: unknown) {
      console.error('[download]', err);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/founder/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: unknown) {
      console.error('[delete]', err);
    }
  }

  // Expiring-soon count (within 30 days)
  const expiringSoon = documents.filter((d) => {
    const days = daysUntilExpiry(d.expiry_date);
    return days !== null && days >= 0 && days <= 30;
  }).length;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Business Sidebar */}
      <aside className="w-14 flex-shrink-0 border-r border-white/10 flex flex-col items-center py-4 gap-2">
        {BUSINESSES.map((b) => {
          const isActive = activeBusiness === b;
          const label = b === 'all' ? 'ALL' : BUSINESS_LABELS[b].slice(0, 2).toUpperCase();
          return (
            <button
              key={b}
              title={BUSINESS_LABELS[b]}
              onClick={() => setActiveBusiness(b)}
              className="w-9 h-9 rounded-sm border flex items-center justify-center font-mono text-[10px] font-bold transition-none"
              style={{
                borderColor: isActive ? '#00F5FF' : 'rgba(255,255,255,0.1)',
                color: isActive ? '#00F5FF' : 'rgba(255,255,255,0.4)',
                background: isActive ? 'rgba(0,245,255,0.08)' : 'transparent',
              }}
            >
              {label}
            </button>
          );
        })}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-mono text-[#00F5FF] text-xl tracking-wide">Document Repository</h1>
            <p className="text-white/40 text-xs font-mono mt-0.5">
              {activeBusiness === 'all' ? 'All businesses' : BUSINESS_LABELS[activeBusiness]}
              {activeCategory !== 'all' ? ` · ${activeCategory}` : ''}
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-[#00F5FF] text-black font-mono text-sm font-semibold px-4 py-2 rounded-sm hover:bg-[#00d4dd]"
          >
            + Upload
          </button>
        </header>

        {/* Expiring soon banner */}
        <AnimatePresence>
          {expiringSoon > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#FFB800]/10 border-b border-[#FFB800]/30 px-6 py-2"
            >
              <span className="font-mono text-[#FFB800] text-xs">
                ⚠ {expiringSoon} document{expiringSoon > 1 ? 's' : ''} expiring within 30 days
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category tabs */}
        <div className="border-b border-white/10 px-6 flex gap-1 overflow-x-auto py-2">
          {CATEGORIES.map((c) => {
            const isActive = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className="px-3 py-1.5 rounded-sm font-mono text-xs whitespace-nowrap border"
                style={{
                  borderColor: isActive ? '#00F5FF' : 'rgba(255,255,255,0.1)',
                  color: isActive ? '#00F5FF' : 'rgba(255,255,255,0.5)',
                  background: isActive ? 'rgba(0,245,255,0.08)' : 'transparent',
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Document grid */}
        <main className="flex-1 p-6">
          {error && (
            <div className="text-[#FF4444] text-sm font-mono border border-[#FF4444]/30 rounded-sm px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <motion.div
                className="w-6 h-6 border-2 border-[#00F5FF] border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          ) : documents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/10 rounded-sm"
            >
              <div className="text-4xl mb-4">📂</div>
              <div className="font-mono text-white/40 text-sm">No documents found</div>
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 text-[#00F5FF] font-mono text-sm border border-[#00F5FF]/30 rounded-sm px-4 py-2 hover:bg-[#00F5FF]/10"
              >
                Upload your first document
              </button>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onEdit={setEditingDoc}
                    onDelete={handleDelete}
                    onDownload={handleDownload}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showUpload && (
          <UploadModal
            onClose={() => setShowUpload(false)}
            onSuccess={fetchDocuments}
          />
        )}
        {editingDoc && (
          <EditModal
            doc={editingDoc}
            onClose={() => setEditingDoc(null)}
            onSuccess={fetchDocuments}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
