'use client';

/**
 * DriveImportModal
 *
 * Renders a Scientific Luxury modal for browsing and importing files from
 * Google Drive into the Founder Document Repository.
 *
 * Props:
 *   isOpen   — controls visibility
 *   onClose  — callback to close the modal
 *   onImport — callback fired with the inserted document ID after a successful import
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

interface DriveStatusResponse {
  connected: boolean;
  googleEmail?: string | null;
  connectedAt?: string | null;
  error?: string;
}

interface DriveListResponse {
  connected: boolean;
  googleEmail?: string | null;
  files?: DriveFile[];
  error?: string;
}

interface ImportFormState {
  businessId: string;
  category: string;
  expiryDate: string;
  notes: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (docId: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BIZ: Record<string, string> = {
  'disaster-recovery': 'Disaster Recovery',
  'restore-assist': 'RestoreAssist',
  ato: 'ATO',
  nrpg: 'NRPG',
  'unite-group': 'Unite Group',
  carsi: 'CARSI',
};

const CATEGORIES = [
  'contract',
  'licence',
  'insurance',
  'tax',
  'hr',
  'financial',
  'legal',
  'other',
] as const;

const MIME_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'text/plain': 'TXT',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mimeLabel(mimeType: string): string {
  return MIME_LABELS[mimeType] ?? 'FILE';
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatBytes(bytes?: string): string {
  const n = parseInt(bytes ?? '0', 10);
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Sub-component: ImportForm ────────────────────────────────────────────────

interface ImportFormProps {
  file: DriveFile;
  onSubmit: (form: ImportFormState) => Promise<void>;
  onCancel: () => void;
  importing: boolean;
}

function ImportForm({ file, onSubmit, onCancel, importing }: ImportFormProps) {
  const [form, setForm] = useState<ImportFormState>({
    businessId: Object.keys(BIZ)[0],
    category: 'other',
    expiryDate: '',
    notes: '',
  });

  function update<K extends keyof ImportFormState>(key: K, value: ImportFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="mt-3 border border-white/10 bg-[#0d0d0d] rounded-sm p-4 space-y-3">
      <p className="text-xs text-white/50 truncate">Importing: {file.name}</p>

      {/* Business */}
      <div>
        <label className="block text-xs text-white/60 mb-1">Business</label>
        <select
          value={form.businessId}
          onChange={(e) => update('businessId', e.target.value)}
          className="w-full bg-[#111] border border-white/10 rounded-sm text-white text-sm px-2 py-1.5 focus:outline-none focus:border-[#00F5FF]/50"
        >
          {Object.entries(BIZ).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs text-white/60 mb-1">Category</label>
        <select
          value={form.category}
          onChange={(e) => update('category', e.target.value)}
          className="w-full bg-[#111] border border-white/10 rounded-sm text-white text-sm px-2 py-1.5 focus:outline-none focus:border-[#00F5FF]/50"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Expiry Date (optional) */}
      <div>
        <label className="block text-xs text-white/60 mb-1">
          Expiry Date{' '}
          <span className="text-white/30">(optional)</span>
        </label>
        <input
          type="date"
          value={form.expiryDate}
          onChange={(e) => update('expiryDate', e.target.value)}
          className="w-full bg-[#111] border border-white/10 rounded-sm text-white text-sm px-2 py-1.5 focus:outline-none focus:border-[#00F5FF]/50"
        />
      </div>

      {/* Notes (optional) */}
      <div>
        <label className="block text-xs text-white/60 mb-1">
          Notes{' '}
          <span className="text-white/30">(optional)</span>
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          rows={2}
          className="w-full bg-[#111] border border-white/10 rounded-sm text-white text-sm px-2 py-1.5 resize-none focus:outline-none focus:border-[#00F5FF]/50"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSubmit(form)}
          disabled={importing}
          className="flex-1 bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF] text-sm rounded-sm py-1.5 hover:bg-[#00F5FF]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importing ? 'Importing…' : 'Confirm Import'}
        </button>
        <button
          onClick={onCancel}
          disabled={importing}
          className="px-4 bg-white/5 border border-white/10 text-white/60 text-sm rounded-sm py-1.5 hover:bg-white/10 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DriveImportModal({ isOpen, onClose, onImport }: Props) {
  const [status, setStatus] = useState<DriveStatusResponse | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [search, setSearch] = useState('');
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected file awaiting import form
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // ── Fetch connection status on open ───────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function checkStatus() {
      try {
        const res = await fetch('/api/founder/documents/drive/status');
        const json = (await res.json()) as DriveStatusResponse;
        if (!cancelled) {
          setStatus(json);
          if (json.connected) {
            void loadFiles('');
          }
        }
      } catch {
        if (!cancelled) setError('Failed to check Drive connection status.');
      }
    }

    void checkStatus();

    return () => {
      cancelled = true;
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load files (with optional search) ────────────────────────────────────

  async function loadFiles(query: string) {
    setLoadingFiles(true);
    setError(null);
    try {
      const params = query.trim() ? `?search=${encodeURIComponent(query.trim())}` : '';
      const res = await fetch(`/api/founder/documents/drive${params}`);
      const json = (await res.json()) as DriveListResponse;

      if (!json.connected) {
        setStatus((prev) => ({ ...(prev ?? {}), connected: false, error: json.error }));
        setFiles([]);
      } else {
        setFiles(json.files ?? []);
      }
    } catch {
      setError('Failed to load Drive files.');
    } finally {
      setLoadingFiles(false);
    }
  }

  // ── Debounced search ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!status?.connected) return;
    const timer = setTimeout(() => void loadFiles(search), 400);
    return () => clearTimeout(timer);
  }, [search, status?.connected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Import handler ────────────────────────────────────────────────────────

  async function handleImport(form: ImportFormState) {
    if (!selectedFile) return;
    setImporting(true);
    setImportError(null);

    try {
      const res = await fetch('/api/founder/documents/drive/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driveFileId: selectedFile.id,
          businessId: form.businessId,
          category: form.category,
          expiryDate: form.expiryDate || undefined,
          notes: form.notes || undefined,
        }),
      });

      const json = (await res.json()) as { document?: { id: string }; error?: string };

      if (!res.ok || json.error) {
        setImportError(json.error ?? 'Import failed.');
        return;
      }

      if (json.document?.id) {
        onImport(json.document.id);
      }

      setSelectedFile(null);
      onClose();
    } catch {
      setImportError('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  }

  // ── Reset state when closed ───────────────────────────────────────────────

  function handleClose() {
    setSelectedFile(null);
    setImportError(null);
    setSearch('');
    onClose();
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-40"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-lg bg-[#111] border border-white/10 rounded-sm shadow-2xl flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-[#00F5FF]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 7l9-4 9 4M3 7l9 4m9-4l-9 4M3 7v10l9 4m0-10v10m9-14v10l-9 4"
                    />
                  </svg>
                  <span className="text-white font-medium text-sm">Import from Google Drive</span>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white/40 hover:text-white/70 text-lg leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                {/* Global error */}
                {error && (
                  <p className="text-sm text-[#FF4444] bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-sm px-3 py-2">
                    {error}
                  </p>
                )}

                {/* Not connected */}
                {status && !status.connected && (
                  <div className="space-y-3 text-center py-6">
                    {status.error ? (
                      <p className="text-sm text-[#FFB800]">{status.error}</p>
                    ) : (
                      <p className="text-sm text-white/50">
                        Connect your Google Drive to import documents directly.
                      </p>
                    )}
                    <a
                      href="/api/founder/documents/drive/connect"
                      className="inline-block bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF] text-sm rounded-sm px-5 py-2 hover:bg-[#00F5FF]/20"
                    >
                      Connect Google Drive
                    </a>
                  </div>
                )}

                {/* Connected */}
                {status?.connected && (
                  <>
                    {/* Connected badge */}
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00FF88] shrink-0" />
                      <span className="text-xs text-white/50">
                        Connected as{' '}
                        <span className="text-white/70">{status.googleEmail ?? 'Unknown'}</span>
                      </span>
                    </div>

                    {/* Search */}
                    <input
                      type="text"
                      placeholder="Search files…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-[#0d0d0d] border border-white/10 rounded-sm text-white text-sm px-3 py-2 focus:outline-none focus:border-[#00F5FF]/50 placeholder:text-white/30"
                    />

                    {/* File list */}
                    {loadingFiles ? (
                      <div className="flex items-center justify-center py-8">
                        <span className="text-sm text-white/40">Loading files…</span>
                      </div>
                    ) : files.length === 0 ? (
                      <p className="text-sm text-white/40 text-center py-6">
                        No matching files found.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {files.map((file) => (
                          <li
                            key={file.id}
                            className="border border-white/8 rounded-sm bg-[#0d0d0d] overflow-hidden"
                          >
                            <div className="flex items-start gap-3 px-3 py-2.5">
                              {/* MIME badge */}
                              <span className="mt-0.5 shrink-0 text-[10px] font-mono bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/20 rounded-sm px-1.5 py-0.5">
                                {mimeLabel(file.mimeType)}
                              </span>

                              {/* File info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{file.name}</p>
                                <p className="text-xs text-white/40 mt-0.5">
                                  {formatBytes(file.size)} · Modified {formatDate(file.modifiedTime)}
                                </p>
                              </div>

                              {/* Import button */}
                              {selectedFile?.id !== file.id && (
                                <button
                                  onClick={() => {
                                    setSelectedFile(file);
                                    setImportError(null);
                                  }}
                                  className="shrink-0 text-xs bg-[#00FF88]/10 border border-[#00FF88]/30 text-[#00FF88] rounded-sm px-3 py-1 hover:bg-[#00FF88]/20"
                                >
                                  Import
                                </button>
                              )}
                            </div>

                            {/* Import form (inline) */}
                            {selectedFile?.id === file.id && (
                              <div className="px-3 pb-3">
                                {importError && (
                                  <p className="text-xs text-[#FF4444] mb-2">{importError}</p>
                                )}
                                <ImportForm
                                  file={file}
                                  onSubmit={handleImport}
                                  onCancel={() => {
                                    setSelectedFile(null);
                                    setImportError(null);
                                  }}
                                  importing={importing}
                                />
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}

                {/* Loading state before status arrives */}
                {!status && !error && (
                  <div className="flex items-center justify-center py-10">
                    <span className="text-sm text-white/40">Checking Drive connection…</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
