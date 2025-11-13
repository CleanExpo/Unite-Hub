"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Star, TrendingUp } from "lucide-react";

interface TemplateFiltersProps {
  selectedPlatform: string | null;
  selectedCategory: string | null;
  showFavorites: boolean;
  sortBy: string;
  onPlatformChange: (platform: string | null) => void;
  onCategoryChange: (category: string | null) => void;
  onToggleFavorites: () => void;
  onSortChange: (sort: string) => void;
  onClearFilters: () => void;
}

const platforms = [
  { value: "facebook", label: "Facebook", icon: "📘" },
  { value: "instagram", label: "Instagram", icon: "📷" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "linkedin", label: "LinkedIn", icon: "💼" },
  { value: "twitter", label: "Twitter", icon: "🐦" },
];

const categories = [
  { value: "promotional", label: "Promotional" },
  { value: "educational", label: "Educational" },
  { value: "engagement", label: "Engagement" },
  { value: "brand_story", label: "Brand Story" },
  { value: "user_generated", label: "User Generated" },
  { value: "behind_scenes", label: "Behind the Scenes" },
  { value: "product_launch", label: "Product Launch" },
  { value: "seasonal", label: "Seasonal" },
  { value: "testimonial", label: "Testimonial" },
  { value: "how_to", label: "How To" },
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "most_used", label: "Most Used" },
  { value: "least_used", label: "Least Used" },
  { value: "alphabetical", label: "A-Z" },
];

export function TemplateFilters({
  selectedPlatform,
  selectedCategory,
  showFavorites,
  sortBy,
  onPlatformChange,
  onCategoryChange,
  onToggleFavorites,
  onSortChange,
  onClearFilters,
}: TemplateFiltersProps) {
  const hasActiveFilters = selectedPlatform || selectedCategory || showFavorites;

  return (
    <div className="space-y-4">
      {/* Platform Filters */}
      <div>
        <label className="text-sm font-medium mb-2 block">Platform</label>
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <Button
              key={platform.value}
              variant={selectedPlatform === platform.value ? "default" : "outline"}
              size="sm"
              onClick={() =>
                onPlatformChange(
                  selectedPlatform === platform.value ? null : platform.value
                )
              }
            >
              <span className="mr-1">{platform.icon}</span>
              {platform.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <label className="text-sm font-medium mb-2 block">Category</label>
        <Select value={selectedCategory || ""} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort and Favorites */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Sort By</label>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Filter</label>
          <Button
            variant={showFavorites ? "default" : "outline"}
            onClick={onToggleFavorites}
            className="w-full"
          >
            <Star className="h-4 w-4 mr-2" />
            Favorites
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          {selectedPlatform && (
            <Badge variant="secondary" className="gap-1">
              {platforms.find((p) => p.value === selectedPlatform)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onPlatformChange(null)}
              />
            </Badge>
          )}
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1">
              {categories.find((c) => c.value === selectedCategory)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onCategoryChange(null)}
              />
            </Badge>
          )}
          {showFavorites && (
            <Badge variant="secondary" className="gap-1">
              Favorites
              <X className="h-3 w-3 cursor-pointer" onClick={onToggleFavorites} />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
