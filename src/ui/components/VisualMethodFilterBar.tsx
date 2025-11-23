'use client';

/**
 * Visual Method Filter Bar
 * Phase 69: Filter and search visual generation methods
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  X,
  DollarSign,
  Clock,
  Layers,
} from 'lucide-react';
import { MethodCategoryId, METHOD_CATEGORIES } from '@/lib/visual/methods/categories';
import { CampaignChannel } from '@/lib/visual/campaign/channelProfiles';

export interface FilterState {
  search: string;
  category: MethodCategoryId | 'all';
  channel: CampaignChannel | 'all';
  costTier: 'all' | 'low' | 'medium' | 'high' | 'premium';
  complexity: 'all' | '1' | '2' | '3' | '4' | '5';
  motionOnly: boolean;
}

interface VisualMethodFilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  resultCount?: number;
}

export function VisualMethodFilterBar({
  filters,
  onFiltersChange,
  resultCount,
}: VisualMethodFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      category: 'all',
      channel: 'all',
      costTier: 'all',
      complexity: 'all',
      motionOnly: false,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.category !== 'all' ||
    filters.channel !== 'all' ||
    filters.costTier !== 'all' ||
    filters.complexity !== 'all' ||
    filters.motionOnly;

  const activeFilterCount = [
    filters.category !== 'all',
    filters.channel !== 'all',
    filters.costTier !== 'all',
    filters.complexity !== 'all',
    filters.motionOnly,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Main filter row */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search methods..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category */}
        <Select
          value={filters.category}
          onValueChange={(v) => updateFilter('category', v as any)}
        >
          <SelectTrigger className="w-[150px]">
            <Layers className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.values(METHOD_CATEGORIES).map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced toggle */}
        <Button
          variant={showAdvanced ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="h-4 w-4 mr-1" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Clear */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}

        {/* Result count */}
        {resultCount !== undefined && (
          <span className="text-sm text-muted-foreground ml-auto">
            {resultCount} method{resultCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          {/* Channel */}
          <Select
            value={filters.channel}
            onValueChange={(v) => updateFilter('channel', v as any)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="twitter">X (Twitter)</SelectItem>
              <SelectItem value="pinterest">Pinterest</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="web">Web</SelectItem>
            </SelectContent>
          </Select>

          {/* Cost tier */}
          <Select
            value={filters.costTier}
            onValueChange={(v) => updateFilter('costTier', v as any)}
          >
            <SelectTrigger className="w-[120px]">
              <DollarSign className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Cost" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Cost</SelectItem>
              <SelectItem value="low">$ Low</SelectItem>
              <SelectItem value="medium">$$ Medium</SelectItem>
              <SelectItem value="high">$$$ High</SelectItem>
              <SelectItem value="premium">$$$$ Premium</SelectItem>
            </SelectContent>
          </Select>

          {/* Complexity */}
          <Select
            value={filters.complexity}
            onValueChange={(v) => updateFilter('complexity', v as any)}
          >
            <SelectTrigger className="w-[130px]">
              <Clock className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Complexity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="1">1 - Simple</SelectItem>
              <SelectItem value="2">2 - Easy</SelectItem>
              <SelectItem value="3">3 - Moderate</SelectItem>
              <SelectItem value="4">4 - Complex</SelectItem>
              <SelectItem value="5">5 - Advanced</SelectItem>
            </SelectContent>
          </Select>

          {/* Motion only */}
          <Button
            variant={filters.motionOnly ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => updateFilter('motionOnly', !filters.motionOnly)}
          >
            Motion Only
          </Button>
        </div>
      )}
    </div>
  );
}

export default VisualMethodFilterBar;
