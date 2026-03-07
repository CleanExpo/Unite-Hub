"use client";

import { useState, useCallback } from "react";
import { DealCard, type Deal } from "./DealCard";
import { Plus, DollarSign } from "lucide-react";

export interface PipelineStage {
  id: string;
  name: string;
  position: number;
  color: string;
  is_won: boolean;
  is_lost: boolean;
  deal_count?: number;
  total_value?: number;
}

interface PipelineBoardProps {
  stages: PipelineStage[];
  deals: Deal[];
  onDealMove: (dealId: string, newStageId: string) => void;
  onAddDeal: (stageId: string) => void;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function PipelineBoard({ stages, deals, onDealMove, onAddDeal }: PipelineBoardProps) {
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const getDealsForStage = useCallback(
    (stageId: string) => deals.filter((d) => d.stage_id === stageId && d.status === "open"),
    [deals]
  );

  const getStageValue = useCallback(
    (stageId: string) => {
      return getDealsForStage(stageId).reduce((sum, d) => sum + (d.value || 0), 0);
    },
    [getDealsForStage]
  );

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("dealId", dealId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    if (dealId) {
      onDealMove(dealId, stageId);
    }
    setDragOverStage(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-280px)]">
      {stages
        .sort((a, b) => a.position - b.position)
        .map((stage) => {
          const stageDeals = getDealsForStage(stage.id);
          const stageValue = getStageValue(stage.id);

          return (
            <div
              key={stage.id}
              className={`flex-shrink-0 w-72 flex flex-col rounded-sm transition-colors duration-200 ${
                dragOverStage === stage.id
                  ? "bg-white/[0.04] ring-2 ring-[#00F5FF]/30"
                  : "bg-white/[0.02]"
              }`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-sm"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="text-sm font-semibold font-mono text-white">{stage.name}</h3>
                  </div>
                  <span className="text-xs font-mono text-white/40 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-sm">
                    {stageDeals.length}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-white/30">
                  <DollarSign className="w-3 h-3" />
                  <span className="font-mono">{formatCurrency(stageValue)}</span>
                </div>
              </div>

              {/* Deal Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-380px)]">
                {stageDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onDragStart={handleDragStart}
                  />
                ))}

                {stageDeals.length === 0 && (
                  <div className="text-center py-8 text-white/20 text-sm font-mono">
                    No deals
                  </div>
                )}
              </div>

              {/* Add Deal Button */}
              {!stage.is_won && !stage.is_lost && (
                <div className="p-2 border-t border-white/[0.04]">
                  <button
                    className="w-full text-white/30 hover:text-white/70 hover:bg-white/[0.04] h-8 text-xs font-mono
                               flex items-center justify-center gap-1 rounded-sm transition-colors duration-200"
                    onClick={() => onAddDeal(stage.id)}
                  >
                    <Plus className="w-3 h-3" />
                    Add Deal
                  </button>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
