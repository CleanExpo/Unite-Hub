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
import { X } from "lucide-react";

interface ComponentFiltersProps {
  selectedCategory: string | null;
  selectedStyle: string | null;
  sortBy: "newest" | "popular" | "rating" | "alphabetical";
  categories: string[];
  styles: string[];
  onCategoryChange: (category: string | null) => void;
  onStyleChange: (style: string | null) => void;
  onSortChange: (sort: "newest" | "popular" | "rating" | "alphabetical") => void;
  onClearFilters: () => void;
}

export default function ComponentFilters({
  selectedCategory,
  selectedStyle,
  sortBy,
  categories,
  styles,
  onCategoryChange,
  onStyleChange,
  onSortChange,
  onClearFilters,
}: ComponentFiltersProps) {
  const hasActiveFilters = selectedCategory || selectedStyle || sortBy !== "newest";

  return (
    <div className="space-y-4 mb-6">
      {/* Sort Dropdown */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-text-secondary">Sort by:</span>
        <Select
          value={sortBy}
          onValueChange={(value: any) => onSortChange(value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Filters */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-text-secondary">Categories:</span>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onCategoryChange(selectedCategory === category ? null : category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Style Filters */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-text-secondary">Style:</span>
        <div className="flex flex-wrap gap-2">
          {styles.map((style) => (
            <Badge
              key={style}
              variant={selectedStyle === style ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onStyleChange(selectedStyle === style ? null : style)}
            >
              {style}
            </Badge>
          ))}
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="gap-2"
        >
          <X className="w-4 h-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
