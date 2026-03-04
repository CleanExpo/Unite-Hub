'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Database, X } from 'lucide-react';

interface PageResult {
  id: string;
  title: string;
  icon: string | null;
  page_type: string;
  updated_at: string;
  snippet: string;
}

interface DatabaseResult {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
}

interface SearchResults {
  pages: PageResult[];
  databases: DatabaseResult[];
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ pages: [], databases: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Total result count for keyboard nav
  const totalResults = results.pages.length + results.databases.length;

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults({ pages: [], databases: [] });
      setSelectedIndex(0);
    }
  }, [open]);

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ pages: [], databases: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/nexus/search?q=${encodeURIComponent(q)}&limit=10`);
      if (res.ok) {
        const data: SearchResults = await res.json();
        setResults(data);
        setSelectedIndex(0);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }

  function navigateToResult(index: number) {
    if (index < results.pages.length) {
      const page = results.pages[index];
      router.push(`/founder/page/${page.id}`);
    } else {
      router.push('/founder/workspace');
    }
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(totalResults, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + Math.max(totalResults, 1)) % Math.max(totalResults, 1));
    } else if (e.key === 'Enter' && totalResults > 0) {
      e.preventDefault();
      navigateToResult(selectedIndex);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-[560px] z-[101]"
          >
            <div className="bg-[#0d0d0d] border border-[#222] rounded-sm shadow-2xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#222]">
                <Search className="w-5 h-5 text-[#666] flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages and databases..."
                  className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-[#555] focus:ring-0"
                  style={{ caretColor: '#00F5FF' }}
                />
                {query && (
                  <button
                    onClick={() => { setQuery(''); setResults({ pages: [], databases: [] }); }}
                    className="text-[#666] hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-[#555] border border-[#333] rounded bg-[#111]">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto">
                {loading && (
                  <div className="px-4 py-6 text-center text-[#555] text-sm">
                    Searching...
                  </div>
                )}

                {!loading && query && totalResults === 0 && (
                  <div className="px-4 py-8 text-center text-[#444] text-sm">
                    No results found for &ldquo;{query}&rdquo;
                  </div>
                )}

                {!loading && results.pages.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#555]">
                      Pages
                    </div>
                    {results.pages.map((page, i) => (
                      <button
                        key={page.id}
                        onClick={() => navigateToResult(i)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          selectedIndex === i
                            ? 'bg-[#00F5FF]/10 text-white'
                            : 'text-[#999] hover:bg-[#111]'
                        }`}
                      >
                        <span className="text-lg flex-shrink-0">
                          {page.icon || <FileText className="w-4 h-4 text-[#555]" />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {page.title}
                          </div>
                          {page.snippet && (
                            <div className="text-xs text-[#555] truncate mt-0.5">
                              {page.snippet}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#111] border border-[#222] text-[#555] flex-shrink-0">
                          {page.page_type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {!loading && results.databases.length > 0 && (
                  <div className="py-2 border-t border-[#1a1a1a]">
                    <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#555]">
                      Databases
                    </div>
                    {results.databases.map((db, i) => {
                      const idx = results.pages.length + i;
                      return (
                        <button
                          key={db.id}
                          onClick={() => navigateToResult(idx)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            selectedIndex === idx
                              ? 'bg-[#00F5FF]/10 text-white'
                              : 'text-[#999] hover:bg-[#111]'
                          }`}
                        >
                          <span className="text-lg flex-shrink-0">
                            {db.icon || <Database className="w-4 h-4 text-[#555]" />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {db.name}
                            </div>
                            {db.description && (
                              <div className="text-xs text-[#555] truncate mt-0.5">
                                {db.description}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#111] border border-[#222] text-[#555] flex-shrink-0">
                            database
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer hint */}
              {!loading && totalResults > 0 && (
                <div className="px-4 py-2 border-t border-[#1a1a1a] flex items-center gap-4 text-[10px] text-[#444]">
                  <span>
                    <kbd className="px-1 py-0.5 border border-[#333] rounded bg-[#111] mr-1">&uarr;&darr;</kbd>
                    navigate
                  </span>
                  <span>
                    <kbd className="px-1 py-0.5 border border-[#333] rounded bg-[#111] mr-1">&crarr;</kbd>
                    open
                  </span>
                  <span>
                    <kbd className="px-1 py-0.5 border border-[#333] rounded bg-[#111] mr-1">esc</kbd>
                    close
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
