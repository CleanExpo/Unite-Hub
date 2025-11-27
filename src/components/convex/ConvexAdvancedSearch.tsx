'use client';

/**
 * CONVEX Advanced Search Component
 *
 * Provides comprehensive search and filtering with:
 * - Multi-field filtering with 7+ operators
 * - Full-text relevance search
 * - Saved search filters with usage tracking
 * - Search history and analytics
 * - Real-time result count
 */

import React, { useState, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FilterX,
  Plus,
  Search,
  Trash2,
  TrendingUp,
} from 'lucide-react';

interface FilterOption {
  field: string;
  label: string;
  type: 'enum' | 'numeric' | 'date' | 'text';
  values?: any[];
}

interface SearchFilter {
  id: string;
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in' | 'between';
  value: any;
}

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  filters: SearchFilter[];
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
}

interface SearchAnalytics {
  totalSearches: number;
  averageResults: number;
  topSearchTerms: Array<{ term: string; count: number }>;
  topFilters: Array<{ field: string; count: number }>;
  successRate: number;
}

interface AdvancedSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterOptions: FilterOption[];
  savedSearches: SavedSearch[];
  searchAnalytics?: SearchAnalytics;
  onSearch?: (
    searchText: string,
    filters: SearchFilter[],
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ) => Promise<void>;
  onSaveSearch?: (
    name: string,
    description: string,
    filters: SearchFilter[]
  ) => Promise<void>;
  onLoadSavedSearch?: (searchId: string) => Promise<void>;
  onDeleteSavedSearch?: (searchId: string) => Promise<void>;
}

export function ConvexAdvancedSearch({
  open,
  onOpenChange,
  filterOptions,
  savedSearches,
  searchAnalytics,
  onSearch,
  onSaveSearch,
  onLoadSavedSearch,
  onDeleteSavedSearch,
}: AdvancedSearchProps) {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [sortBy, setSortBy] = useState<string>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!onSearch) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      await onSearch(searchText, filters, sortBy, sortOrder);
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : 'Search failed'
      );
    } finally {
      setIsSearching(false);
    }
  }, [searchText, filters, sortBy, sortOrder, onSearch]);

  const handleAddFilter = (field: string) => {
    const option = filterOptions.find((o) => o.field === field);
    if (!option) return;

    const newFilter: SearchFilter = {
      id: `${field}-${Date.now()}`,
      field,
      operator: 'eq',
      value: option.type === 'numeric' ? 0 : '',
    };

    setFilters([...filters, newFilter]);
  };

  const handleRemoveFilter = (filterId: string) => {
    setFilters(filters.filter((f) => f.id !== filterId));
  };

  const handleUpdateFilter = (
    filterId: string,
    updates: Partial<SearchFilter>
  ) => {
    setFilters(
      filters.map((f) => (f.id === filterId ? { ...f, ...updates } : f))
    );
  };

  const handleSaveSearch = async () => {
    if (!saveName.trim() || !onSaveSearch) return;

    setIsSaving(true);
    try {
      await onSaveSearch(saveName, saveDescription, filters);
      setSaveName('');
      setSaveDescription('');
      setShowSaveDialog(false);
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : 'Failed to save search'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSavedSearch = async (searchId: string) => {
    if (!onLoadSavedSearch) return;
    try {
      await onLoadSavedSearch(searchId);
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : 'Failed to load search'
      );
    }
  };

  const getFilterLabel = (field: string) => {
    const option = filterOptions.find((o) => o.field === field);
    return option?.label || field;
  };

  const getOperatorLabel = (operator: string) => {
    const labels: Record<string, string> = {
      eq: 'equals',
      gt: 'greater than',
      lt: 'less than',
      gte: 'greater or equal',
      lte: 'less or equal',
      contains: 'contains',
      in: 'is one of',
      between: 'between',
    };
    return labels[operator] || operator;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Advanced Search & Filtering</SheetTitle>
          <SheetDescription>
            Build complex queries with multiple filters
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="search" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="saved">Saved ({savedSearches.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            {searchError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{searchError}</AlertDescription>
              </Alert>
            )}

            {/* Full Text Search */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Search Text</label>
              <Input
                placeholder="Search by business name, keyword..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                disabled={isSearching}
              />
            </div>

            {/* Sorting */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">Relevance Score</SelectItem>
                    <SelectItem value="date">Created Date</SelectItem>
                    <SelectItem value="name">Business Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Order</label>
                <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Filters</label>
                {filters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters([])}
                    className="text-xs text-destructive hover:text-destructive"
                  >
                    <FilterX className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              {filters.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No filters applied
                </p>
              ) : (
                <div className="space-y-2">
                  {filters.map((filter) => (
                    <Card key={filter.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">
                            {getFilterLabel(filter.field)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFilter(filter.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={filter.operator}
                            onValueChange={(value: any) =>
                              handleUpdateFilter(filter.id, { operator: value })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="eq">Equals</SelectItem>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="gt">Greater than</SelectItem>
                              <SelectItem value="lt">Less than</SelectItem>
                              <SelectItem value="gte">≥</SelectItem>
                              <SelectItem value="lte">≤</SelectItem>
                              <SelectItem value="between">Between</SelectItem>
                            </SelectContent>
                          </Select>

                          <Input
                            placeholder="Value"
                            value={filter.value}
                            onChange={(e) =>
                              handleUpdateFilter(filter.id, {
                                value: e.target.value,
                              })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Add Filter Button */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Add Filter</label>
                <Select onValueChange={handleAddFilter}>
                  <SelectTrigger>
                    <Plus className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Select field to filter..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.map((option) => (
                      <SelectItem key={option.field} value={option.field}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="flex-1"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>

              {(searchText.trim() || filters.length > 0) && (
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(true)}
                  disabled={isSaving}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Save Search
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Saved Searches Tab */}
          <TabsContent value="saved" className="space-y-3">
            {savedSearches.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">
                No saved searches yet
              </p>
            ) : (
              <div className="space-y-2">
                {savedSearches.map((search) => (
                  <Card key={search.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold">{search.name}</h4>
                          {search.description && (
                            <p className="text-xs text-muted-foreground">
                              {search.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onDeleteSavedSearch?.(search.id)
                          }
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{search.filters.length} filters</Badge>
                        {search.lastUsed && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-2 w-2 mr-1" />
                            {new Date(search.lastUsed).toLocaleDateString()}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          Used {search.usageCount} times
                        </Badge>
                      </div>

                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => handleLoadSavedSearch(search.id)}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Load Search
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            {!searchAnalytics ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">
                No search analytics available
              </p>
            ) : (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold">
                        {searchAnalytics.totalSearches}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Searches</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold">
                        {searchAnalytics.averageResults.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg Results</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold">
                        {searchAnalytics.successRate.toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Success Rate</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold">
                        {searchAnalytics.topSearchTerms.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Top Terms</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Search Terms */}
                {searchAnalytics.topSearchTerms.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Top Search Terms</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {searchAnalytics.topSearchTerms.slice(0, 5).map((term) => (
                        <div
                          key={term.term}
                          className="flex items-center justify-between text-sm"
                        >
                          <p className="truncate">{term.term}</p>
                          <Badge variant="outline">{term.count}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Top Filters */}
                {searchAnalytics.topFilters.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Popular Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {searchAnalytics.topFilters.slice(0, 5).map((filter) => (
                        <div
                          key={filter.field}
                          className="flex items-center justify-between text-sm"
                        >
                          <p>{getFilterLabel(filter.field)}</p>
                          <Badge variant="outline">{filter.count}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Save Search Dialog */}
        {showSaveDialog && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/30 space-y-3">
            <h4 className="text-sm font-semibold">Save This Search</h4>
            <Input
              placeholder="Search name (e.g., 'High scoring brand positions')"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={saveDescription}
              onChange={(e) => setSaveDescription(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveSearch}
                disabled={isSaving || !saveName.trim()}
                className="flex-1"
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
