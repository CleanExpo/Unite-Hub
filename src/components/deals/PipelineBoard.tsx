"use client";

import { useState, useCallback } from "react";
import { DealCard, type Deal } from "./DealCard";
import { Button } from "@/components/ui/button";
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
              className={`flex-shrink-0 w-72 flex flex-col rounded-lg transition-colors duration-200 ${
                dragOverStage === stage.id
                  ? "bg-slate-700/40 ring-2 ring-blue-500/50"
                  : "bg-slate-800/30"
              }`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="text-sm font-semibold text-white">{stage.name}</h3>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">
                    {stageDeals.length}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <DollarSign className="w-3 h-3" />
                  <span>{formatCurrency(stageValue)}</span>
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
                  <div className="text-center py-8 text-slate-600 text-sm">
                    No deals
                  </div>
                )}
              </div>

              {/* Add Deal Button */}
              {!stage.is_won && !stage.is_lost && (
                <div className="p-2 border-t border-slate-700/30">
                  <Button
                    variant="ghost"
                    className="w-full text-slate-500 hover:text-white hover:bg-slate-700/50 h-8 text-xs"
                    onClick={() => onAddDeal(stage.id)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Deal
                  </Button>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
