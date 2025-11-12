"use client";

import React, { useState } from "react";
import { ImageCard } from "./ImageCard";
import { Search, Filter, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImageConcept {
  _id: string;
  conceptType: string;
  platform?: string;
  prompt: string;
  imageUrl: string;
  style: string;
  colorPalette: string[];
  dimensions: {
    width: number;
    height: number;
  };
  usageRecommendations: string;
  isUsed: boolean;
  createdAt: number;
}

interface ImageGalleryProps {
  images: ImageConcept[];
  onDownload?: (imageId: string) => void;
  onUse?: (imageId: string) => void;
}

export function ImageGallery({ images, onDownload, onUse }: ImageGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredImages = images.filter((image) => {
    const matchesSearch =
      image.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.style.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || image.conceptType === typeFilter;
    const matchesPlatform =
      platformFilter === "all" || image.platform === platformFilter;
    return matchesSearch && matchesType && matchesPlatform;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="social_post">Social Post</SelectItem>
              <SelectItem value="product_mockup">Product Mockup</SelectItem>
              <SelectItem value="marketing_visual">Marketing Visual</SelectItem>
              <SelectItem value="ad_creative">Ad Creative</SelectItem>
              <SelectItem value="brand_concept">Brand Concept</SelectItem>
            </SelectContent>
          </Select>

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
              <SelectItem value="general">General</SelectItem>
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

      {/* Image Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredImages.length} of {images.length} images
      </div>

      {/* Images Grid/List */}
      {filteredImages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No images found</p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-4"
          }
        >
          {filteredImages.map((image) => (
            <ImageCard
              key={image._id}
              image={image}
              viewMode={viewMode}
              onDownload={onDownload}
              onUse={onUse}
            />
          ))}
        </div>
      )}
    </div>
  );
}
