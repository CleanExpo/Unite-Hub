"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Star, Grid } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Hook {
  _id: string;
  hookText: string;
  platform: string;
  category: string;
  scriptType: string;
  effectivenessScore: number;
  tags: string[];
  isFavorite: boolean;
}

interface HookSearchProps {
  hooks: Hook[];
  onFilterChange: (filtered: Hook[]) => void;
  viewMode: "all" | "favorites";
  onViewModeChange: (mode: "all" | "favorites") => void;
}

export function HookSearch({
  hooks,
  onFilterChange,
  viewMode,
  onViewModeChange,
}: HookSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    let filtered = [...hooks];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (hook) =>
          hook.hookText.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hook.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Platform filter
    if (platformFilter !== "all") {
      filtered = filtered.filter((hook) => hook.platform === platformFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((hook) => hook.category === categoryFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((hook) => hook.scriptType === typeFilter);
    }

    onFilterChange(filtered);
  }, [searchQuery, platformFilter, categoryFilter, typeFilter, hooks, onFilterChange]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search hooks and tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="awareness">Awareness</SelectItem>
              <SelectItem value="consideration">Consideration</SelectItem>
              <SelectItem value="conversion">Conversion</SelectItem>
              <SelectItem value="retention">Retention</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="hook">Hook</SelectItem>
              <SelectItem value="email_subject">Email Subject</SelectItem>
              <SelectItem value="social_caption">Social Caption</SelectItem>
              <SelectItem value="ad_copy">Ad Copy</SelectItem>
              <SelectItem value="video_script">Video Script</SelectItem>
              <SelectItem value="cta">CTA</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange("all")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === "all"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange("favorites")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === "favorites"
                  ? "bg-amber-100 text-amber-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Star className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
