"use client";

import React, { useState } from "react";
import { HookCard } from "./HookCard";
import { HookSearch } from "./HookSearch";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Hook {
  _id: string;
  hookText: string;
  platform: string;
  category: string;
  scriptType: string;
  effectivenessScore: number;
  contextExplanation: string;
  suggestedUse: string;
  tags: string[];
  isFavorite: boolean;
  usageCount: number;
}

interface HooksLibraryProps {
  hooks: Hook[];
  onGenerateNew?: () => void;
  onToggleFavorite?: (hookId: string) => void;
  onUseHook?: (hookId: string) => void;
}

export function HooksLibrary({
  hooks,
  onGenerateNew,
  onToggleFavorite,
  onUseHook,
}: HooksLibraryProps) {
  const [filteredHooks, setFilteredHooks] = useState(hooks);
  const [viewMode, setViewMode] = useState<"all" | "favorites">("all");

  const displayedHooks = viewMode === "favorites"
    ? filteredHooks.filter((h) => h.isFavorite)
    : filteredHooks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hooks & Scripts Library</h2>
          <p className="text-gray-600 mt-1">
            AI-generated marketing hooks optimized for your audience
          </p>
        </div>
        <Button
          onClick={onGenerateNew}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2"
        >
          <Sparkles className="h-5 w-5" />
          Generate New Hooks
        </Button>
      </div>

      {/* Search & Filter */}
      <HookSearch
        hooks={hooks}
        onFilterChange={setFilteredHooks}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Hooks" value={hooks.length} color="blue" />
        <StatCard
          label="Favorites"
          value={hooks.filter((h) => h.isFavorite).length}
          color="purple"
        />
        <StatCard
          label="High Performers"
          value={hooks.filter((h) => h.effectivenessScore >= 8).length}
          color="green"
        />
        <StatCard
          label="Most Used"
          value={Math.max(...hooks.map((h) => h.usageCount), 0)}
          color="orange"
        />
      </div>

      {/* Hooks Grid */}
      {displayedHooks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No hooks found matching your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedHooks.map((hook) => (
            <HookCard
              key={hook._id}
              hook={hook}
              onToggleFavorite={onToggleFavorite}
              onUse={onUseHook}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    green: "bg-green-50 text-green-700 border-green-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <div className={`p-4 rounded-lg border ${colorMap[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
