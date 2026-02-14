"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, LayoutGrid, List, RefreshCw } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { PipelineBoard, type PipelineStage } from "@/components/deals/PipelineBoard";
import { PipelineMetrics } from "@/components/deals/PipelineMetrics";
import { CreateDealModal } from "@/components/deals/CreateDealModal";
import type { Deal } from "@/components/deals/DealCard";

export default function DealsPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [allDeals, setAllDeals] = useState<Deal[]>([]); // For metrics (includes won/lost)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [defaultStageId, setDefaultStageId] = useState("");

  const fetchStages = useCallback(async () => {
    if (!workspaceId) return;

    try {
      const res = await fetch(
        `/api/pipeline/stages?workspaceId=${workspaceId}&includeDealCounts=true`
      );
      if (!res.ok) throw new Error("Failed to fetch stages");
      const data = await res.json();
      setStages(data.data?.stages || []);
    } catch (err) {
      console.error("Error fetching stages:", err);
    }
  }, [workspaceId]);

  const fetchDeals = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch open deals for the board
      const params = new URLSearchParams({
        workspaceId,
        pageSize: "200",
        status: statusFilter,
      });
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`/api/deals?${params}`);
      if (!res.ok) throw new Error("Failed to fetch deals");
      const data = await res.json();
      setDeals(data.data?.deals || []);

      // Also fetch all deals for metrics
      const allRes = await fetch(`/api/deals?workspaceId=${workspaceId}&pageSize=500`);
      if (allRes.ok) {
        const allData = await allRes.json();
        setAllDeals(allData.data?.deals || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch deals");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, statusFilter, searchTerm]);

  useEffect(() => {
    if (workspaceId) {
      fetchStages();
      fetchDeals();
    }
  }, [workspaceId, fetchStages, fetchDeals]);

  const handleDealMove = async (dealId: string, newStageId: string) => {
    // Optimistic update
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId ? { ...d, stage_id: newStageId } : d
      )
    );

    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage_id: newStageId }),
      });

      if (!res.ok) {
        // Revert on failure
        fetchDeals();
      } else {
        // Update stages counts
        fetchStages();
      }
    } catch {
      fetchDeals();
    }
  };

  const handleAddDeal = (stageId: string) => {
    setDefaultStageId(stageId);
    setCreateModalOpen(true);
  };

  const handleDealCreated = () => {
    fetchDeals();
    fetchStages();
  };

  if (workspaceLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-800 rounded w-48" />
          <div className="grid grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-800 rounded" />
            ))}
          </div>
          <div className="h-96 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-20 text-slate-400">
          No workspace selected. Please select a workspace to view your deal pipeline.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Deal Pipeline</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track and manage your deals through the sales pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { fetchDeals(); fetchStages(); }}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => {
              const firstStage = stages.find((s) => !s.is_won && !s.is_lost);
              setDefaultStageId(firstStage?.id || "");
              setCreateModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-6">
        <PipelineMetrics deals={allDeals} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="open" className="text-white hover:bg-slate-700">Open</SelectItem>
            <SelectItem value="won" className="text-white hover:bg-slate-700">Won</SelectItem>
            <SelectItem value="lost" className="text-white hover:bg-slate-700">Lost</SelectItem>
            <SelectItem value="abandoned" className="text-white hover:bg-slate-700">Abandoned</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex border border-slate-700 rounded-md overflow-hidden">
          <Button
            variant={viewMode === "board" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("board")}
            className={`rounded-none h-9 w-9 ${
              viewMode === "board" ? "bg-slate-700 text-white" : "text-slate-400"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            className={`rounded-none h-9 w-9 ${
              viewMode === "list" ? "bg-slate-700 text-white" : "text-slate-400"
            }`}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 rounded-md px-4 py-3 mb-4">
          {error}
          <Button
            variant="link"
            className="text-red-400 underline ml-2 p-0 h-auto"
            onClick={fetchDeals}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Pipeline Board */}
      {loading ? (
        <div className="flex gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72 bg-slate-800/30 rounded-lg p-3">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-slate-700 rounded w-24" />
                <div className="h-3 bg-slate-700 rounded w-16" />
                <div className="space-y-2 mt-4">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="h-24 bg-slate-700/50 rounded" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === "board" ? (
        <PipelineBoard
          stages={stages}
          deals={deals}
          onDealMove={handleDealMove}
          onAddDeal={handleAddDeal}
        />
      ) : (
        /* Simple List View */
        <div className="bg-slate-800/30 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-xs text-slate-400 font-medium p-3">Deal</th>
                <th className="text-left text-xs text-slate-400 font-medium p-3">Contact</th>
                <th className="text-left text-xs text-slate-400 font-medium p-3">Stage</th>
                <th className="text-right text-xs text-slate-400 font-medium p-3">Value</th>
                <th className="text-center text-xs text-slate-400 font-medium p-3">Probability</th>
                <th className="text-left text-xs text-slate-400 font-medium p-3">Expected Close</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="border-b border-slate-700/30 hover:bg-slate-800/40 cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/deals/${deal.id}`}
                >
                  <td className="p-3">
                    <div className="text-sm font-medium text-white">{deal.title}</div>
                    {deal.source && (
                      <div className="text-xs text-slate-500">{deal.source}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-slate-300">
                      {deal.contacts?.name || "—"}
                    </div>
                    {deal.contacts?.company && (
                      <div className="text-xs text-slate-500">{deal.contacts.company}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: deal.pipeline_stages?.color || "#3B82F6" }}
                      />
                      <span className="text-sm text-slate-300">
                        {deal.pipeline_stages?.name || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-sm font-medium text-emerald-400">
                      {new Intl.NumberFormat("en-AU", {
                        style: "currency",
                        currency: deal.currency || "AUD",
                        minimumFractionDigits: 0,
                      }).format(deal.value)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-sm ${
                      deal.probability >= 75 ? "text-emerald-400" :
                      deal.probability >= 50 ? "text-yellow-400" :
                      "text-slate-400"
                    }`}>
                      {deal.probability}%
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm text-slate-400">
                      {deal.expected_close_date
                        ? new Date(deal.expected_close_date).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "short",
                          })
                        : "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {deals.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No {statusFilter} deals found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Deal Modal */}
      <CreateDealModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        stages={stages}
        defaultStageId={defaultStageId}
        workspaceId={workspaceId}
        onDealCreated={handleDealCreated}
      />
    </div>
  );
}
