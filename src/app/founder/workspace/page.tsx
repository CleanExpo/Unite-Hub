'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { NexusSidebar } from '@/components/nexus/NexusSidebar';

interface NexusDatabase {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  columns: Array<{ id: string; name: string; type: string }>;
  default_view: string;
  business_id: string | null;
  owner_id: string;
  created_at: string;
}

export default function WorkspacePage() {
  const router = useRouter();
  const [databases, setDatabases] = useState<NexusDatabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchDatabases = useCallback(async () => {
    try {
      const res = await fetch('/api/nexus/databases');
      const data = await res.json();
      if (data.databases) setDatabases(data.databases);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatabases();
  }, [fetchDatabases]);

  const handleNewDatabase = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/nexus/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Untitled Database', icon: '📊' }),
      });
      if (res.ok) {
        await fetchDatabases();
      }
    } catch {
      // Silent fail
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0d0d0d] text-white">
      <NexusSidebar />

      <div className="flex-1 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-mono font-bold tracking-tight">
              <span className="text-[#00F5FF]">NEXUS</span> Workspace
            </h1>
            <p className="text-zinc-500 text-sm mt-1 font-mono">
              {databases.length} database{databases.length !== 1 ? 's' : ''}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNewDatabase}
            disabled={creating}
            className="px-4 py-2 bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF] rounded-sm font-mono text-sm hover:bg-[#00F5FF]/20 transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : '+ New Database'}
          </motion.button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#00F5FF]/30 border-t-[#00F5FF] rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && databases.length === 0 && (
          <div className="text-center py-20">
            <div className="text-zinc-600 text-4xl mb-4">📊</div>
            <p className="text-zinc-500 font-mono">No databases yet</p>
            <p className="text-zinc-600 font-mono text-sm mt-1">Create your first database to get started</p>
          </div>
        )}

        {/* Database cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {databases.map((db) => (
              <motion.div
                key={db.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-sm hover:border-zinc-700 cursor-pointer transition-colors"
                onClick={() => router.push(`/founder/workspace/db/${db.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{db.icon || '📊'}</span>
                    <h3 className="font-mono font-bold text-white">{db.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded-sm font-mono text-[10px] uppercase">
                    {db.default_view}
                  </span>
                </div>

                {db.description && (
                  <p className="text-zinc-500 text-xs font-mono mb-3 line-clamp-2">{db.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 font-mono text-xs">
                    {db.columns?.length ?? 0} column{(db.columns?.length ?? 0) !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/founder/workspace/db/${db.id}`); }}
                    className="px-3 py-1 bg-[#00F5FF]/10 text-[#00F5FF] rounded-sm font-mono text-xs hover:bg-[#00F5FF]/20 transition-colors"
                  >
                    Open
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
