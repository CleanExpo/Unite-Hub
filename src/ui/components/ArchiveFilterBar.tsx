'use client';

/**
 * Archive Filter Bar
 * Phase 78: Filter controls for archive queries
 */

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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter, Calendar, X } from 'lucide-react';
import {
  ArchiveEventType,
  SourceEngine,
  ArchiveCategory,
  ArchiveFilters,
} from '@/lib/archive/archiveTypes';

interface ArchiveFilterBarProps {
  filters: ArchiveFilters;
  onChange: (filters: ArchiveFilters) => void;
  showClientFilter?: boolean;
  clients?: Array<{ id: string; name: string }>;
  className?: string;
}

const EVENT_TYPE_OPTIONS: Array<{ value: ArchiveEventType; label: string }> = [
  { value: 'weekly_report', label: 'Weekly Reports' },
  { value: 'monthly_report', label: 'Monthly Reports' },
  { value: 'ninety_day_report', label: '90-Day Reports' },
  { value: 'story', label: 'Stories' },
  { value: 'touchpoint', label: 'Touchpoints' },
  { value: 'success_event', label: 'Success Events' },
  { value: 'performance_event', label: 'Performance' },
  { value: 'creative_event', label: 'Creative' },
  { value: 'production_event', label: 'Production' },
  { value: 'director_alert', label: 'Director Alerts' },
];

const SOURCE_OPTIONS: Array<{ value: SourceEngine; label: string }> = [
  { value: 'reports', label: 'Reports' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'touchpoints', label: 'Touchpoints' },
  { value: 'performance', label: 'Performance' },
  { value: 'success', label: 'Success' },
  { value: 'creative_ops', label: 'Creative Ops' },
  { value: 'production', label: 'Production' },
  { value: 'director', label: 'Director' },
];

const CATEGORY_OPTIONS: Array<{ value: ArchiveCategory; label: string }> = [
  { value: 'reports', label: 'Reports' },
  { value: 'stories', label: 'Stories' },
  { value: 'events', label: 'Events' },
  { value: 'alerts', label: 'Alerts' },
  { value: 'milestones', label: 'Milestones' },
];

export function ArchiveFilterBar({
  filters,
  onChange,
  showClientFilter = false,
  clients = [],
  className = '',
}: ArchiveFilterBarProps) {
  const handleTimeframeChange = (value: string) => {
    const now = new Date();
    let from: string | undefined;

    switch (value) {
      case '7d':
        from = new Date(now.setDate(now.getDate() - 7)).toISOString();
        break;
      case '30d':
        from = new Date(now.setDate(now.getDate() - 30)).toISOString();
        break;
      case '90d':
        from = new Date(now.setDate(now.getDate() - 90)).toISOString();
        break;
      case 'all':
        from = undefined;
        break;
    }

    onChange({ ...filters, from, to: undefined });
  };

  const handleTypeToggle = (type: ArchiveEventType, checked: boolean) => {
    const current = filters.types || [];
    const updated = checked
      ? [...current, type]
      : current.filter(t => t !== type);
    onChange({ ...filters, types: updated.length > 0 ? updated : undefined });
  };

  const handleSourceToggle = (source: SourceEngine, checked: boolean) => {
    const current = filters.sources || [];
    const updated = checked
      ? [...current, source]
      : current.filter(s => s !== source);
    onChange({ ...filters, sources: updated.length > 0 ? updated : undefined });
  };

  const handleCategoryToggle = (category: ArchiveCategory, checked: boolean) => {
    const current = filters.categories || [];
    const updated = checked
      ? [...current, category]
      : current.filter(c => c !== category);
    onChange({ ...filters, categories: updated.length > 0 ? updated : undefined });
  };

  const clearFilters = () => {
    onChange({
      clientId: filters.clientId,
      workspaceId: filters.workspaceId,
    });
  };

  const hasActiveFilters =
    filters.from ||
    filters.to ||
    (filters.types && filters.types.length > 0) ||
    (filters.sources && filters.sources.length > 0) ||
    (filters.categories && filters.categories.length > 0) ||
    filters.importanceMin;

  const getCurrentTimeframe = () => {
    if (!filters.from) return 'all';
    const days = Math.ceil(
      (Date.now() - new Date(filters.from).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days <= 7) return '7d';
    if (days <= 30) return '30d';
    if (days <= 90) return '90d';
    return 'all';
  };

  return (
    <div className={`flex items-center gap-3 flex-wrap ${className}`}>
      {/* Client filter */}
      {showClientFilter && clients.length > 0 && (
        <Select
          value={filters.clientId || 'all'}
          onValueChange={(v) =>
            onChange({ ...filters, clientId: v === 'all' ? undefined : v })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Timeframe */}
      <Select value={getCurrentTimeframe()} onValueChange={handleTimeframeChange}>
        <SelectTrigger className="w-[140px]">
          <Calendar className="h-4 w-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
          <SelectItem value="all">All time</SelectItem>
        </SelectContent>
      </Select>

      {/* Event types */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Types
            {filters.types && filters.types.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {filters.types.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Event Types</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {EVENT_TYPE_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={filters.types?.includes(option.value)}
              onCheckedChange={(checked) =>
                handleTypeToggle(option.value, checked)
              }
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sources */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Sources
            {filters.sources && filters.sources.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {filters.sources.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuLabel>Sources</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SOURCE_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={filters.sources?.includes(option.value)}
              onCheckedChange={(checked) =>
                handleSourceToggle(option.value, checked)
              }
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Categories */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Categories
            {filters.categories && filters.categories.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {filters.categories.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuLabel>Categories</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {CATEGORY_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={filters.categories?.includes(option.value)}
              onCheckedChange={(checked) =>
                handleCategoryToggle(option.value, checked)
              }
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}

/**
 * Quick filter presets
 */
export function ArchiveQuickFilters({
  onSelect,
  className = '',
}: {
  onSelect: (filters: Partial<ArchiveFilters>) => void;
  className?: string;
}) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          onSelect({
            types: ['weekly_report', 'monthly_report', 'ninety_day_report'],
          })
        }
      >
        Reports Only
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSelect({ categories: ['alerts'] })}
      >
        Alerts Only
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSelect({ importanceMin: 70 })}
      >
        High Priority
      </Button>
    </div>
  );
}

export default ArchiveFilterBar;
