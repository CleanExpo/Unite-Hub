'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NexusPage {
  id: string;
  parent_id: string | null;
  title: string;
  icon: string | null;
  page_type: string;
  business_id: string | null;
  is_favorite: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface NexusDatabase {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  business_id: string | null;
  created_at: string;
}

interface NexusSidebarProps {
  currentPageId?: string;
  onNavigate?: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NexusSidebar({ currentPageId, onNavigate }: NexusSidebarProps) {
  const router = useRouter();
  const [pages, setPages] = useState<NexusPage[]>([]);
  const [databases, setDatabases] = useState<NexusDatabase[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [pagesRes, dbRes] = await Promise.all([
        fetch('/api/nexus/pages'),
        fetch('/api/nexus/databases'),
      ]);
      const [pagesData, dbData] = await Promise.all([pagesRes.json(), dbRes.json()]);
      setPages(pagesData.pages ?? []);
      setDatabases(dbData.databases ?? []);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Expand parent chain for current page
  useEffect(() => {
    if (!currentPageId || pages.length === 0) return;
    const newExpanded = new Set(expandedIds);
    let current = pages.find(p => p.id === currentPageId);
    while (current?.parent_id) {
      newExpanded.add(current.parent_id);
      current = pages.find(p => p.id === current!.parent_id);
    }
    setExpandedIds(newExpanded);
    // Only run when currentPageId or pages change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageId, pages.length]);

  const navigate = (id: string) => {
    if (onNavigate) {
      onNavigate(id);
    } else {
      router.push(`/founder/page/${id}`);
    }
  };

  const handleNewPage = async () => {
    try {
      const res = await fetch('/api/nexus/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled' }),
      });
      if (res.ok) {
        const data = await res.json();
        navigate(data.page.id);
        await fetchData();
      }
    } catch {
      // Silent fail
    }
  };

  const handleNewSubPage = async (parentId: string) => {
    setMenuOpen(null);
    try {
      const res = await fetch('/api/nexus/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled', parent_id: parentId }),
      });
      if (res.ok) {
        const data = await res.json();
        setExpandedIds(prev => new Set(prev).add(parentId));
        navigate(data.page.id);
        await fetchData();
      }
    } catch {
      // Silent fail
    }
  };

  const handleToggleFavourite = async (page: NexusPage) => {
    setMenuOpen(null);
    try {
      await fetch(`/api/nexus/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: !page.is_favorite }),
      });
      await fetchData();
    } catch {
      // Silent fail
    }
  };

  const handleDelete = async (pageId: string) => {
    setMenuOpen(null);
    if (!confirm('Archive this page?')) return;
    try {
      await fetch(`/api/nexus/pages/${pageId}`, { method: 'DELETE' });
      if (currentPageId === pageId) router.push('/founder');
      await fetchData();
    } catch {
      // Silent fail
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Derived data
  const favourites = useMemo(() => pages.filter(p => p.is_favorite), [pages]);
  const childrenMap = useMemo(() => {
    const map = new Map<string | null, NexusPage[]>();
    for (const p of pages) {
      const key = p.parent_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [pages]);

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return pages.filter(p => p.title.toLowerCase().includes(q));
  }, [searchQuery, pages]);

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderPageItem = (page: NexusPage, depth: number) => {
    const children = childrenMap.get(page.id) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(page.id);
    const isActive = page.id === currentPageId;

    return (
      <div key={page.id}>
        <div
          className={`group flex items-center gap-1 px-2 py-1 cursor-pointer rounded-sm text-sm transition-colors relative ${
            isActive
              ? 'bg-[#00F5FF]/10 text-[#00F5FF]'
              : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => navigate(page.id)}
        >
          {/* Expand arrow */}
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpanded(page.id); }}
              className="w-4 h-4 flex items-center justify-center text-zinc-600 hover:text-zinc-300 shrink-0"
            >
              <motion.span
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.15 }}
                className="text-[10px]"
              >
                ▶
              </motion.span>
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          {/* Icon + title */}
          <span className="shrink-0 text-sm">{page.icon || '📄'}</span>
          <span className="truncate flex-1 text-[13px]">{page.title || 'Untitled'}</span>

          {/* Menu trigger */}
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === page.id ? null : page.id); }}
            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-zinc-300 text-xs px-1 shrink-0"
          >
            ···
          </button>

          {/* Dropdown menu */}
          <AnimatePresence>
            {menuOpen === page.id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full z-30 mt-1 w-36 rounded-sm border border-zinc-700 bg-[#111] py-1 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleNewSubPage(page.id)}
                  className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  Add sub-page
                </button>
                <button
                  onClick={() => handleToggleFavourite(page)}
                  className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  {page.is_favorite ? 'Unfavourite' : 'Favourite'}
                </button>
                <button
                  onClick={() => handleDelete(page.id)}
                  className="w-full px-3 py-1.5 text-left text-xs text-[#FF4444] hover:bg-zinc-800"
                >
                  Archive
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Children */}
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              {children.map(child => renderPageItem(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <aside
      className="w-56 shrink-0 bg-[#0d0d0d] border-r border-zinc-800 flex flex-col h-full overflow-hidden"
      onClick={() => setMenuOpen(null)}
    >
      {/* Header */}
      <div className="px-3 py-3 border-b border-zinc-800/50">
        <span className="text-xs font-mono font-bold text-[#00F5FF] tracking-wider">NEXUS</span>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <input
          type="text"
          placeholder="Search pages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-sm px-2 py-1 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:border-[#00F5FF]/50"
        />
      </div>

      {/* New Page */}
      <div className="px-3 pb-2">
        <button
          onClick={handleNewPage}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#00F5FF]/70 hover:text-[#00F5FF] hover:bg-[#00F5FF]/5 rounded-sm transition-colors"
        >
          <span>+</span>
          <span>New Page</span>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-1">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-4 h-4 border border-[#00F5FF]/30 border-t-[#00F5FF] rounded-full animate-spin" />
          </div>
        )}

        {/* Search results */}
        {filteredPages && (
          <div className="mb-4">
            <div className="px-3 py-1 text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
              Results ({filteredPages.length})
            </div>
            {filteredPages.length === 0 ? (
              <div className="px-3 py-2 text-xs text-zinc-600">No matches</div>
            ) : (
              filteredPages.map(page => (
                <div
                  key={page.id}
                  onClick={() => { navigate(page.id); setSearchQuery(''); }}
                  className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-sm text-sm transition-colors ${
                    page.id === currentPageId
                      ? 'bg-[#00F5FF]/10 text-[#00F5FF]'
                      : 'text-zinc-400 hover:bg-zinc-800/50'
                  }`}
                >
                  <span className="text-sm">{page.icon || '📄'}</span>
                  <span className="truncate text-[13px]">{page.title}</span>
                </div>
              ))
            )}
          </div>
        )}

        {!filteredPages && !loading && (
          <>
            {/* Favourites */}
            {favourites.length > 0 && (
              <div className="mb-3">
                <div className="px-3 py-1 text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
                  Favourites
                </div>
                {favourites.map(page => (
                  <div
                    key={page.id}
                    onClick={() => navigate(page.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-sm text-sm transition-colors ${
                      page.id === currentPageId
                        ? 'bg-[#00F5FF]/10 text-[#00F5FF]'
                        : 'text-zinc-400 hover:bg-zinc-800/50'
                    }`}
                  >
                    <span className="text-sm">{page.icon || '📄'}</span>
                    <span className="truncate text-[13px]">{page.title}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Pages tree */}
            <div className="mb-3">
              <div className="px-3 py-1 text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
                Pages
              </div>
              {(childrenMap.get(null) || []).length === 0 ? (
                <div className="px-3 py-2 text-xs text-zinc-600">No pages yet</div>
              ) : (
                (childrenMap.get(null) || []).map(page => renderPageItem(page, 0))
              )}
            </div>

            {/* Databases */}
            <div className="mb-3">
              <div className="px-3 py-1 text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
                Databases
              </div>
              {databases.length === 0 ? (
                <div className="px-3 py-2 text-xs text-zinc-600">No databases</div>
              ) : (
                databases.map(db => (
                  <div
                    key={db.id}
                    onClick={() => router.push('/founder/workspace')}
                    className="flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-sm text-sm text-zinc-400 hover:bg-zinc-800/50 transition-colors"
                  >
                    <span className="text-sm">{db.icon || '📊'}</span>
                    <span className="truncate text-[13px]">{db.name}</span>
                  </div>
                ))
              )}
            </div>

            {/* AI Links */}
            <div className="mb-3">
              <div className="px-3 py-1 text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
                AI
              </div>
              <div
                onClick={() => router.push('/founder/os?tab=capture')}
                className="flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-sm text-sm text-zinc-400 hover:bg-zinc-800/50 transition-colors"
              >
                <span className="text-sm">💬</span>
                <span className="text-[13px]">Chat</span>
              </div>
              <div
                onClick={() => router.push('/founder/strategy')}
                className="flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-sm text-sm text-zinc-400 hover:bg-zinc-800/50 transition-colors"
              >
                <span className="text-sm">🎯</span>
                <span className="text-[13px]">Strategy Room</span>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
