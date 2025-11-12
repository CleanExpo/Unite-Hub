"use client";

import React, { useState } from "react";
import { AssetCard } from "./AssetCard";
import { Grid, List, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Asset {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: number;
  category?: string;
}

interface AssetGalleryProps {
  assets: Asset[];
  onDelete?: (assetId: string) => void;
  onDownload?: (assetId: string) => void;
}

export function AssetGallery({ assets, onDelete, onDownload }: AssetGalleryProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.fileName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || asset.fileType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter & View Controls */}
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="logo">Logo</SelectItem>
              <SelectItem value="photo">Photo</SelectItem>
              <SelectItem value="business_card">Business Card</SelectItem>
              <SelectItem value="marketing_material">Marketing Material</SelectItem>
              <SelectItem value="brand_guidelines">Brand Guidelines</SelectItem>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded ${
                viewMode === "grid"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded ${
                viewMode === "list"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Asset Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredAssets.length} of {assets.length} assets
      </div>

      {/* Assets Grid/List */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No assets found</p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-2"
          }
        >
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset._id}
              asset={asset}
              viewMode={viewMode}
              onDelete={onDelete}
              onDownload={onDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
}
