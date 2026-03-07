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
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  RefreshCw,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspace } from "@/hooks/useWorkspace";
import { PipelineBoard, type PipelineStage } from "@/components/deals/PipelineBoard";
import { CreateDealModal } from "@/components/deals/CreateDealModal";
import type { Deal } from "@/components/deals/DealCard";

export default function DealsPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
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
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage_id: newStageId } : d))
    );
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage_id: newStageId }),
      });
      if (!res.ok) {
        fetchDeals();
      } else {
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

  // Derived stats from allDeals
  const openDeals = allDeals.filter((d) => d.status === "open");
  const wonDeals = allDeals.filter((d) => d.status === "won");
  const totalPipeline = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  const stats = [
    {
      label: "Total Deals",
      value: workspaceLoading ? "—" : allDeals.length.toString(),
      icon: Target,
      color: "#00F5FF",
    },
    {
      label: "Active",
      value: workspaceLoading ? "—" : openDeals.length.toString(),
      icon: TrendingUp,
      color: "#FFB800",
    },
    {
      label: "Closed Won",
      value: workspaceLoading ? "—" : wonDeals.length.toString(),
      icon: CheckCircle,
      color: "#00FF88",
    },
    {
      label: "Pipeline Value",
      value: workspaceLoading
        ? "—"
        : new Intl.NumberFormat("en-AU", {
            style: "currency",
            currency: "AUD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(totalPipeline),
      icon: DollarSign,
      color: "#00F5FF",
    },
  ];

  if (workspaceLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/[0.04] rounded-sm w-48" />
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-white/[0.04] rounded-sm" />
            ))}
          </div>
          <div className="h-96 bg-white/[0.04] rounded-sm" />
        </div>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-white/40">
          No workspace selected. Please select a workspace to view your deal pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white/90">Deals Pipeline</h1>
          <p className="text-xs text-white/30 mt-0.5">
            Track and manage your sales pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchDeals(); fetchStages(); }}
            className="p-2 text-white/30 hover:text-white/70 transition-colors rounded-sm hover:bg-white/[0.04]"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Button
            onClick={() => {
              const firstStage = stages.find((s) => !s.is_won && !s.is_lost);
              setDefaultStageId(firstStage?.id || "");
              setCreateModalOpen(true);
            }}
            variant="primary"
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            className="rounded-sm border border-white/[0.06] bg-white/[0.02] p-4"
            style={{ borderLeft: `2px solid ${stat.color}` }}
          >
            <stat.icon className="h-3.5 w-3.5 mb-2" style={{ color: stat.color }} />
            <p className="text-lg font-bold text-white/90 font-mono">{stat.value}</p>
            <p className="text-xs text-white/30 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
          <Input
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm bg-white/[0.02] border-white/[0.06] text-white/80 placeholder:text-white/20 focus-visible:ring-[#00F5FF]/30"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-28 h-8 text-xs bg-white/[0.02] border-white/[0.06] text-white/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#080808] border-white/[0.06]">
            <SelectItem value="open" className="text-sm text-white/70 focus:bg-white/[0.04] focus:text-white/90">Open</SelectItem>
            <SelectItem value="won" className="text-sm text-white/70 focus:bg-white/[0.04] focus:text-white/90">Won</SelectItem>
            <SelectItem value="lost" className="text-sm text-white/70 focus:bg-white/[0.04] focus:text-white/90">Lost</SelectItem>
            <SelectItem value="abandoned" className="text-sm text-white/70 focus:bg-white/[0.04] focus:text-white/90">Abandoned</SelectItem>
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex border border-white/[0.06] rounded-sm overflow-hidden">
          <button
            onClick={() => setViewMode("board")}
            className={`h-8 w-8 flex items-center justify-center transition-colors ${
              viewMode === "board"
                ? "bg-white/[0.06] text-[#00F5FF]"
                : "text-white/30 hover:text-white/60 hover:bg-white/[0.03]"
            }`}
            title="Board view"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`h-8 w-8 flex items-center justify-center transition-colors border-l border-white/[0.06] ${
              viewMode === "list"
                ? "bg-white/[0.06] text-[#00F5FF]"
                : "text-white/30 hover:text-white/60 hover:bg-white/[0.03]"
            }`}
            title="List view"
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Error state */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 flex items-center gap-3 rounded-sm border border-[#FF4444]/20 bg-[#FF4444]/[0.06] px-4 py-3"
          >
            <p className="text-sm text-[#FF4444] flex-1">{error}</p>
            <button
              onClick={fetchDeals}
              className="text-xs text-[#FF4444]/60 hover:text-[#FF4444] underline transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pipeline board */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64 rounded-sm border border-white/[0.04] bg-white/[0.02] p-3"
            >
              <div className="animate-pulse space-y-3">
                <div className="h-3 bg-white/[0.06] rounded-sm w-24" />
                <div className="space-y-2 mt-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-20 bg-white/[0.04] rounded-sm" />
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
        /* List view */
        <div className="rounded-sm border border-white/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider p-3">Deal</th>
                <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider p-3">Contact</th>
                <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider p-3">Stage</th>
                <th className="text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider p-3">Value</th>
                <th className="text-center text-[10px] font-semibold text-white/30 uppercase tracking-wider p-3">Probability</th>
                <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider p-3">Close Date</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
                  onClick={() => (window.location.href = `/dashboard/deals/${deal.id}`)}
                >
                  <td className="p-3">
                    <div className="text-sm font-medium text-white/90">{deal.title}</div>
                    {deal.source && (
                      <div className="text-xs text-white/30 mt-0.5">{deal.source}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-white/60">{deal.contacts?.name || "—"}</div>
                    {deal.contacts?.company && (
                      <div className="text-xs text-white/30">{deal.contacts.company}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: deal.pipeline_stages?.color || "#00F5FF" }}
                      />
                      <span className="text-sm text-white/60">
                        {deal.pipeline_stages?.name || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-sm font-mono font-medium text-[#00FF88]">
                      {new Intl.NumberFormat("en-AU", {
                        style: "currency",
                        currency: deal.currency || "AUD",
                        minimumFractionDigits: 0,
                      }).format(deal.value)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`text-sm font-mono ${
                        deal.probability >= 75
                          ? "text-[#00FF88]"
                          : deal.probability >= 50
                          ? "text-[#FFB800]"
                          : "text-white/40"
                      }`}
                    >
                      {deal.probability}%
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm text-white/40 font-mono">
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
                  <td colSpan={6} className="py-16 text-center text-sm text-white/20">
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
