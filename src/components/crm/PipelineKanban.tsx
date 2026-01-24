'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import { useWorkspace } from '@/hooks/useWorkspace';

// ============================================================================
// Types
// ============================================================================

interface Deal {
  id: string;
  company: string;
  name: string;
  email: string;
  description: string;
  dueDate: string | null;
  stage: string;
  aiScore: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface PipelineStage {
  id: string;
  label: string;
  count: number;
  deals: Deal[];
}

interface PipelineStats {
  totalDeals: number;
  newThisWeek: number;
  conversionRate: number;
  avgAiScore: number;
}

interface PipelineData {
  stages: PipelineStage[];
  stats: PipelineStats;
  stageConfig: { id: string; label: string }[];
}

// ============================================================================
// Hooks
// ============================================================================

function usePipelineData() {
  const { workspaceId } = useWorkspace();
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (search?: string) => {
    if (!workspaceId) {
return;
}

    try {
      setLoading(true);
      const url = new URL('/api/crm/pipeline', window.location.origin);
      url.searchParams.set('workspaceId', workspaceId);
      if (search) {
url.searchParams.set('search', search);
}

      const res = await fetch(url.toString());
      if (!res.ok) {
throw new Error('Failed to fetch pipeline data');
}

      const json = await res.json();
      setData(json.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const updateStage = useCallback(async (contactId: string, newStage: string) => {
    if (!workspaceId) {
return false;
}

    try {
      const res = await fetch('/api/crm/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, newStage, workspaceId }),
      });

      if (!res.ok) {
throw new Error('Failed to update stage');
}

      // Optimistically update local state
      setData(prev => {
        if (!prev) {
return prev;
}
        const updated = { ...prev };
        updated.stages = updated.stages.map(stage => ({
          ...stage,
          deals: stage.deals.map(deal =>
            deal.id === contactId ? { ...deal, stage: newStage } : deal
          ).filter(deal => deal.stage === stage.id),
        }));
        return updated;
      });

      return true;
    } catch {
      return false;
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, updateStage };
}

// ============================================================================
// UI Components
// ============================================================================

function StatCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

function BarChart({ data, label }: { data: number[]; label: string }) {
  const max = Math.max(...data, 1);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-3">{label}</p>
      <div className="flex items-end gap-2 h-16">
        {data.map((value, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div
              className="w-full bg-gray-800 rounded-t-sm transition-all"
              style={{ height: `${(value / max) * 100}%` }}
            />
            <span className="text-[10px] text-gray-400 mt-1">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CircularProgress({ value, label }: { value: number; label: string }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <svg className="w-20 h-20 -rotate-90">
        <circle cx="40" cy="40" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle
          cx="40" cy="40" r="40" fill="none"
          stroke="#1f2937" strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div>
        <p className="text-2xl font-semibold">{value}%</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function DealCard({
  deal,
  onDragStart,
}: {
  deal: Deal;
  onDragStart?: () => void;
}) {
  const hasDate = deal.dueDate && deal.dueDate !== 'null';
  const formattedDate = hasDate
    ? new Date(deal.dueDate!).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
    : 'No due date';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      draggable
      onDragStart={onDragStart}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900">{deal.company}</h4>
        <div className="flex items-center gap-2">
          {deal.aiScore > 0 && (
            <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">
              {Math.round(deal.aiScore * 100)}%
            </span>
          )}
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-1">{deal.name}</p>
      <p className="text-xs text-gray-400 mb-3 truncate">{deal.email}</p>

      {deal.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{deal.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded-full ${
          !hasDate
            ? 'bg-red-50 text-red-600'
            : 'bg-amber-50 text-amber-700'
        }`}>
          {formattedDate}
        </span>

        {deal.tags.length > 0 && (
          <div className="flex gap-1">
            {deal.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PipelineColumn({
  stage,
  onDrop,
}: {
  stage: PipelineStage;
  onDrop: (dealId: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={`flex-1 min-w-[280px] p-2 rounded-lg transition-colors ${
        isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const dealId = e.dataTransfer.getData('dealId');
        if (dealId) {
onDrop(dealId);
}
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">{stage.label}</h3>
        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <span className="bg-gray-100 px-2 py-0.5 rounded-full">{stage.count}</span>
        </div>
      </div>

      <div className="space-y-0">
        {stage.deals.map(deal => (
          <div
            key={deal.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('dealId', deal.id);
            }}
          >
            <DealCard deal={deal} />
          </div>
        ))}

        {stage.deals.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No deals in this stage
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex gap-4 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex-1 min-w-[280px]">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4" />
          <div className="space-y-3">
            <div className="h-32 bg-gray-100 rounded-xl" />
            <div className="h-32 bg-gray-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PipelineKanban() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data, loading, error, refetch, updateStage } = usePipelineData();

  const handleSearch = useCallback(() => {
    refetch(searchQuery);
  }, [refetch, searchQuery]);

  const handleDrop = useCallback(async (stageId: string, dealId: string) => {
    const success = await updateStage(dealId, stageId);
    if (success) {
      refetch(searchQuery);
    }
  }, [updateStage, refetch, searchQuery]);

  // Default stats if no data
  const stats = data?.stats || {
    totalDeals: 0,
    newThisWeek: 0,
    conversionRate: 0,
    avgAiScore: 0,
  };

  // Generate weekly chart data based on new deals
  const weeklyData = [
    Math.floor(stats.newThisWeek * 0.6),
    Math.floor(stats.newThisWeek * 0.8),
    Math.floor(stats.newThisWeek * 0.4),
    Math.floor(stats.newThisWeek * 1.2),
    stats.newThisWeek,
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <button
              onClick={handleSearch}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-200 rounded-lg"
            >
              Search
            </button>

            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add contact
            </button>
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-4 gap-4">
          <StatCard>
            <BarChart data={weeklyData} label="New contacts" />
          </StatCard>

          <StatCard>
            <CircularProgress value={stats.conversionRate} label="Conversion rate" />
          </StatCard>

          <StatCard className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl font-semibold">{stats.totalDeals}</p>
              <p className="text-sm text-gray-500">Total contacts</p>
            </div>
          </StatCard>

          <StatCard className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl font-semibold">{stats.avgAiScore}%</p>
              <p className="text-sm text-gray-500">Avg. AI Score</p>
            </div>
          </StatCard>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button onClick={() => refetch()} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="flex gap-4">
            {data?.stages.map(stage => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                onDrop={(dealId) => handleDrop(stage.id, dealId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PipelineKanban;
