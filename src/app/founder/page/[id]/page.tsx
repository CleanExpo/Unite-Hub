'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BlockEditor } from '@/components/nexus/BlockEditor';
import { NexusSidebar } from '@/components/nexus/NexusSidebar';
import type { JSONContent } from '@tiptap/react';

interface NexusPage {
  id: string;
  parent_id: string | null;
  title: string;
  icon: string | null;
  cover_url: string | null;
  body: JSONContent;
  properties: Record<string, unknown>;
  business_id: string | null;
  page_type: string;
  is_favorite: boolean;
  is_template: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface SubPage {
  id: string;
  title: string;
  icon: string | null;
  page_type: string;
  sort_order: number;
  updated_at: string;
}

interface Breadcrumb {
  id: string;
  title: string;
  icon: string | null;
}

const PAGE_TYPES = ['page', 'strategy', 'daily', 'template'];
const BUSINESSES = ['DR', 'RestoreAssist', 'ATO', 'NRPG', 'Unite-Group', 'CARSI'];
const EMOJI_QUICK = ['📄', '📝', '🚀', '💡', '🎯', '📊', '🔥', '⚡', '🏢', '✅', '📌', '🧠', '💰', '🤝', '📋', '🔒'];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function PageEditorPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.id as string;

  const [page, setPage] = useState<NexusPage | null>(null);
  const [subPages, setSubPages] = useState<SubPage[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showProperties, setShowProperties] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch page data
  useEffect(() => {
    async function fetchPage() {
      try {
        const res = await fetch(`/api/nexus/pages/${pageId}`);
        if (!res.ok) {
          router.push('/founder');
          return;
        }
        const data = await res.json();
        setPage(data.page);
        setSubPages(data.subPages ?? []);
        setBreadcrumbs(data.breadcrumbs ?? []);
      } catch {
        router.push('/founder');
      } finally {
        setLoading(false);
      }
    }
    fetchPage();
  }, [pageId, router]);

  // Debounced auto-save
  const debouncedSave = useCallback(
    (updates: Partial<NexusPage>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus('saving');
      saveTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/nexus/pages/${pageId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (res.ok) {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
          } else {
            setSaveStatus('error');
          }
        } catch {
          setSaveStatus('error');
        }
      }, 500);
    },
    [pageId],
  );

  const handleTitleChange = (newTitle: string) => {
    if (!page) return;
    setPage({ ...page, title: newTitle });
    debouncedSave({ title: newTitle });
  };

  const handleBodyChange = (json: JSONContent) => {
    if (!page) return;
    setPage({ ...page, body: json });
    debouncedSave({ body: json } as Partial<NexusPage>);
  };

  const handleIconChange = (icon: string) => {
    if (!page) return;
    setPage({ ...page, icon });
    setShowIconPicker(false);
    debouncedSave({ icon } as Partial<NexusPage>);
  };

  const handleToggleFavorite = () => {
    if (!page) return;
    const updated = { ...page, is_favorite: !page.is_favorite };
    setPage(updated);
    debouncedSave({ is_favorite: updated.is_favorite } as Partial<NexusPage>);
  };

  const handlePropertyChange = (key: string, value: unknown) => {
    if (!page) return;
    const updated = { ...page, [key]: value };
    setPage(updated);
    debouncedSave({ [key]: value } as Partial<NexusPage>);
  };

  const handleNewSubPage = async () => {
    try {
      const res = await fetch('/api/nexus/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: pageId, title: 'Untitled' }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/founder/page/${data.page.id}`);
      }
    } catch {
      // Silent fail
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d]">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[#00F5FF] font-mono text-sm"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] text-white">
        Page not found
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0d0d0d] text-white">
      {/* Sidebar */}
      <NexusSidebar currentPageId={pageId} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1a1a1a] bg-[#0d0d0d]/95 px-4 py-2 backdrop-blur-sm">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm text-[#666] overflow-hidden">
          <button
            onClick={() => router.push('/founder')}
            className="hover:text-[#00F5FF] transition-colors shrink-0"
          >
            NEXUS
          </button>
          {breadcrumbs.map((bc) => (
            <span key={bc.id} className="flex items-center gap-1 shrink-0">
              <span className="text-[#333]">/</span>
              <button
                onClick={() => router.push(`/founder/page/${bc.id}`)}
                className="hover:text-[#00F5FF] transition-colors truncate max-w-[120px]"
              >
                {bc.icon && <span className="mr-1">{bc.icon}</span>}
                {bc.title}
              </button>
            </span>
          ))}
          <span className="text-[#333] shrink-0">/</span>
          <span className="text-[#999] truncate max-w-[200px]">
            {page.icon && <span className="mr-1">{page.icon}</span>}
            {page.title}
          </span>
        </nav>

        {/* Save status + actions */}
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            <motion.span
              key={saveStatus}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className={`text-xs font-mono ${
                saveStatus === 'saving'
                  ? 'text-[#FFB800]'
                  : saveStatus === 'saved'
                    ? 'text-[#00FF88]'
                    : saveStatus === 'error'
                      ? 'text-[#FF4444]'
                      : 'text-transparent'
              }`}
            >
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && 'Saved'}
              {saveStatus === 'error' && 'Save failed'}
              {saveStatus === 'idle' && '.'}
            </motion.span>
          </AnimatePresence>

          <button
            onClick={handleToggleFavorite}
            className={`text-lg transition-colors ${page.is_favorite ? 'text-[#FFB800]' : 'text-[#333] hover:text-[#FFB800]'}`}
            title={page.is_favorite ? 'Remove from favourites' : 'Add to favourites'}
          >
            {page.is_favorite ? '★' : '☆'}
          </button>

          <button
            onClick={() => setShowProperties(!showProperties)}
            className={`rounded-sm px-2 py-1 text-xs font-mono transition-colors ${showProperties ? 'bg-[#00F5FF]/10 text-[#00F5FF]' : 'text-[#666] hover:text-white'}`}
          >
            Properties
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Main editor area */}
        <div className="flex-1 mx-auto max-w-3xl px-6 py-8">
          {/* Icon */}
          <div className="relative mb-2">
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="text-4xl hover:bg-[#1a1a1a] rounded-sm p-1 transition-colors"
            >
              {page.icon || '📄'}
            </button>
            {showIconPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-full left-0 mt-1 grid grid-cols-8 gap-1 rounded-sm border border-[#222] bg-[#111] p-2 shadow-lg z-20"
              >
                {EMOJI_QUICK.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleIconChange(emoji)}
                    className="rounded-sm p-1 text-xl hover:bg-[#1a1a1a] transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Title */}
          <input
            type="text"
            value={page.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="mb-4 w-full bg-transparent text-4xl font-bold text-white placeholder-[#333] outline-none"
          />

          {/* Block editor */}
          <BlockEditor
            initialContent={page.body}
            onUpdate={handleBodyChange}
            placeholder="Type '/' for commands..."
          />

          {/* Sub-pages */}
          {(subPages.length > 0 || true) && (
            <div className="mt-12 border-t border-[#1a1a1a] pt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-mono text-[#666] uppercase tracking-wider">Sub-pages</h3>
                <button
                  onClick={handleNewSubPage}
                  className="rounded-sm border border-[#222] px-3 py-1 text-xs font-mono text-[#00F5FF] hover:bg-[#00F5FF]/10 transition-colors"
                >
                  + New sub-page
                </button>
              </div>
              {subPages.length === 0 ? (
                <p className="text-sm text-[#444]">No sub-pages yet</p>
              ) : (
                <div className="space-y-1">
                  {subPages.map((sp) => (
                    <motion.button
                      key={sp.id}
                      onClick={() => router.push(`/founder/page/${sp.id}`)}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm hover:bg-[#1a1a1a] transition-colors"
                      whileHover={{ x: 4 }}
                    >
                      <span>{sp.icon || '📄'}</span>
                      <span className="flex-1 truncate">{sp.title}</span>
                      <span className="text-xs text-[#444]">{sp.page_type}</span>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Properties sidebar */}
        <AnimatePresence>
          {showProperties && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden"
            >
              <div className="w-[280px] p-4 space-y-4">
                <h3 className="text-xs font-mono text-[#666] uppercase tracking-wider">Properties</h3>

                {/* Page type */}
                <div>
                  <label className="mb-1 block text-xs text-[#666]">Type</label>
                  <select
                    value={page.page_type}
                    onChange={(e) => handlePropertyChange('page_type', e.target.value)}
                    className="w-full rounded-sm border border-[#222] bg-[#111] px-2 py-1.5 text-sm text-white outline-none focus:border-[#00F5FF]"
                  >
                    {PAGE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Business */}
                <div>
                  <label className="mb-1 block text-xs text-[#666]">Business</label>
                  <select
                    value={page.business_id ?? ''}
                    onChange={(e) => handlePropertyChange('business_id', e.target.value || null)}
                    className="w-full rounded-sm border border-[#222] bg-[#111] px-2 py-1.5 text-sm text-white outline-none focus:border-[#00F5FF]"
                  >
                    <option value="">None</option>
                    {BUSINESSES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Template */}
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[#666]">Template</label>
                  <button
                    onClick={() => handlePropertyChange('is_template', !page.is_template)}
                    className={`rounded-sm px-2 py-0.5 text-xs font-mono transition-colors ${
                      page.is_template
                        ? 'bg-[#00F5FF]/20 text-[#00F5FF]'
                        : 'bg-[#111] text-[#444]'
                    }`}
                  >
                    {page.is_template ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Metadata */}
                <div className="border-t border-[#1a1a1a] pt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#666]">Created</span>
                    <span className="text-[#999] font-mono">{new Date(page.created_at).toLocaleDateString('en-AU')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#666]">Updated</span>
                    <span className="text-[#999] font-mono">{new Date(page.updated_at).toLocaleDateString('en-AU')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#666]">ID</span>
                    <span className="text-[#555] font-mono truncate max-w-[140px]">{page.id}</span>
                  </div>
                </div>

                {/* Delete */}
                <div className="border-t border-[#1a1a1a] pt-4">
                  <button
                    onClick={async () => {
                      if (!confirm('Archive this page?')) return;
                      await fetch(`/api/nexus/pages/${pageId}`, { method: 'DELETE' });
                      if (page.parent_id) {
                        router.push(`/founder/page/${page.parent_id}`);
                      } else {
                        router.push('/founder');
                      }
                    }}
                    className="w-full rounded-sm border border-[#FF4444]/30 px-3 py-1.5 text-xs text-[#FF4444] hover:bg-[#FF4444]/10 transition-colors"
                  >
                    Archive page
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
