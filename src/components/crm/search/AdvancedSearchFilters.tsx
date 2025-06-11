'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Filter, X, Calendar, DollarSign, 
  Users, Target, FileText, Clock, ChevronDown,
  SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface SearchFilters {
  query: string;
  entityTypes: string[];
  dateRange: DateRange | undefined;
  status: string[];
  priority: string[];
  valueRange: {
    min: number | null;
    max: number | null;
  };
  assignedTo: string[];
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'client' | 'deal' | 'task' | 'invoice';
  title: string;
  description: string;
  status: string;
  value?: number;
  priority?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, any> 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Filter, X, Calendar, DollarSign, 
  Users, Target, FileText, Clock, ChevronDown,
  SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface SearchFilters {
  query: string;
  entityTypes: string[];
  dateRange: DateRange | undefined;
  status: string[];
  priority: string[];
  valueRange: {
    min: number | null;
    max: number | null;
  };
  assignedTo: string[];
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'client' | 'deal' | 'task' | 'invoice';
  title: string;
  description: string;
  status: string;
  value?: number;
  priority?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  facets: {
    entityTypes: { [key: string]: number };
    statuses: { [key: string]: number };
    priorities: { [key: string]: number };
    assignedUsers: { [key: string]: number };
  };
}

const ENTITY_TYPE_ICONS = {
  client: Users,
  deal: Target,
  task: Clock,
  invoice: FileText,
};

const ENTITY_TYPE_COLORS = {
  client: 'bg-blue-100 text-blue-800 border-blue-300',
  deal: 'bg-green-100 text-green-800 border-green-300',
  task: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  invoice: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function AdvancedSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    entityTypes: ['client', 'deal', 'task', 'invoice'],
    dateRange: undefined,
    status: [],
    priority: [],
    valueRange: { min: null, max: null },
    assignedTo: [],
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Trigger search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery.length >= 2 || hasActiveFilters()) {
      performSearch();
    } else {
      setSearchResults(null);
    }
  }, [debouncedQuery, filters]);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.entityTypes.length < 4 ||
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.valueRange.min !== null ||
      filters.valueRange.max !== null ||
      filters.assignedTo.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange
    );
  }, [filters]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      
      if (debouncedQuery) searchParams.set('q', debouncedQuery);
      if (filters.entityTypes.length > 0) {
        searchParams.set('entityTypes', filters.entityTypes.join(','));
      }
      if (filters.status.length > 0) {
        searchParams.set('status', filters.status.join(','));
      }
      if (filters.priority.length > 0) {
        searchParams.set('priority', filters.priority.join(','));
      }
      if (filters.valueRange.min !== null) {
        searchParams.set('minValue', filters.valueRange.min.toString());
      }
      if (filters.valueRange.max !== null) {
        searchParams.set('maxValue', filters.valueRange.max.toString());
      }
      if (filters.assignedTo.length > 0) {
        searchParams.set('assignedTo', filters.assignedTo.join(','));
      }
      if (filters.tags.length > 0) {
        searchParams.set('tags', filters.tags.join(','));
      }
      if (filters.dateRange?.from) {
        searchParams.set('startDate', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        searchParams.set('endDate', filters.dateRange.to.toISOString());
      }
      searchParams.set('sortBy', filters.sortBy);
      searchParams.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/crm/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      entityTypes: ['client', 'deal', 'task', 'invoice'],
      dateRange: undefined,
      status: [],
      priority: [],
      valueRange: { min: null, max: null },
      assignedTo: [],
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const toggleEntityType = (entityType: string) => {
    const current = filters.entityTypes;
    const updated = current.includes(entityType)
      ? current.filter(type => type !== entityType)
      : [...current, entityType];
    updateFilter('entityTypes', updated);
  };

  const toggleFilterArray = (key: 'status' | 'priority' | 'assignedTo' | 'tags', value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const Icon = ENTITY_TYPE_ICONS[result.type];
    const colorClass = ENTITY_TYPE_COLORS[result.type];

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={colorClass}>
                  <Icon className="h-3 w-3 mr-1" />
                  {result.type}
                </Badge>
                <Badge variant="outline">{result.status}</Badge>
                {result.priority && (
                  <Badge variant={result.priority === 'high' ? 'destructive' : 'secondary'}>
                    {result.priority}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{result.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Created: {new Date(result.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(result.updatedAt).toLocaleDateString()}</span>
                {result.assignedTo && <span>Assigned: {result.assignedTo}</span>}
              </div>

              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {result.value && (
              <div className="text-right">
                <div className="font-bold text-lg">{formatCurrency(result.value)}</div>
                <div className="text-xs text-muted-foreground">Value</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <p className="text-muted-foreground">
            Search and filter across all CRM entities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={performSearch}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Query */}
              <div>
                <Label htmlFor="search-query">Search Query</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search-query"
                    placeholder="Search across all data..."
                    value={filters.query}
                    onChange={(e) => updateFilter('query', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Separator />

              {/* Entity Types */}
              <div>
                <Label>Entity Types</Label>
                <div className="space-y-2 mt-2">
                  {['client', 'deal', 'task', 'invoice'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={filters.entityTypes.includes(type)}
                        onCheckedChange={() => toggleEntityType(type)}
                      />
                      <Label htmlFor={type} className="capitalize">
                        {type}s ({searchResults?.facets.entityTypes[type] || 0})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date Range */}
              <div>
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={filters.dateRange}
                  onDateChange={(range) => updateFilter('dateRange', range)}
                />
              </div>

              <Separator />

              {/* Value Range */}
              <div>
                <Label>Value Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valueRange.min || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      min: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valueRange.max || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      max: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                </div>
              </div>

              <Separator />

              {/* Sort Options */}
              <div>
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="updated_at">Date Updated</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'asc')}
                  >
                    <SortAsc className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'desc')}
                  >
                    <SortDesc className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <X className="h-5 w-5" />
                  <span>Search error: {error}</span>
                </div>
                <Button 
                  onClick={performSearch} 
                  variant="outline" 
                  className="mt-4"
                >
                  Retry Search
                </Button>
              </CardContent>
            </Card>
          )}

          {searchResults && (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    Search Results ({searchResults.totalCount})
                  </h2>
                  <p className="text-muted-foreground">
                    Found {searchResults.results.length} results
                  </p>
                </div>
                
                {/* Quick Filters */}
                <div className="flex items-center space-x-2">
                  {Object.entries(searchResults.facets.statuses).map(([status, count]) => (
                    <Badge
                      key={status}
                      variant={filters.status.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleFilterArray('status', status)}
                    >
                      {status} ({count})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Results List */}
              <div>
                {searchResults.results.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search query or filters
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  searchResults.results.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Default State */}
          {!searchResults && !loading && !error && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Search</h3>
                <p className="text-muted-foreground mb-4">
                  Search across clients, deals, tasks, and invoices
                </p>
                <p className="text-sm text-muted-foreground">
                  Enter a search query or apply filters to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" <SearchFilters> 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Filter, X, Calendar, DollarSign, 
  Users, Target, FileText, Clock, ChevronDown,
  SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface SearchFilters {
  query: string;
  entityTypes: string[];
  dateRange: DateRange | undefined;
  status: string[];
  priority: string[];
  valueRange: {
    min: number | null;
    max: number | null;
  };
  assignedTo: string[];
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'client' | 'deal' | 'task' | 'invoice';
  title: string;
  description: string;
  status: string;
  value?: number;
  priority?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  facets: {
    entityTypes: { [key: string]: number };
    statuses: { [key: string]: number };
    priorities: { [key: string]: number };
    assignedUsers: { [key: string]: number };
  };
}

const ENTITY_TYPE_ICONS = {
  client: Users,
  deal: Target,
  task: Clock,
  invoice: FileText,
};

const ENTITY_TYPE_COLORS = {
  client: 'bg-blue-100 text-blue-800 border-blue-300',
  deal: 'bg-green-100 text-green-800 border-green-300',
  task: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  invoice: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function AdvancedSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    entityTypes: ['client', 'deal', 'task', 'invoice'],
    dateRange: undefined,
    status: [],
    priority: [],
    valueRange: { min: null, max: null },
    assignedTo: [],
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Trigger search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery.length >= 2 || hasActiveFilters()) {
      performSearch();
    } else {
      setSearchResults(null);
    }
  }, [debouncedQuery, filters]);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.entityTypes.length < 4 ||
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.valueRange.min !== null ||
      filters.valueRange.max !== null ||
      filters.assignedTo.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange
    );
  }, [filters]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      
      if (debouncedQuery) searchParams.set('q', debouncedQuery);
      if (filters.entityTypes.length > 0) {
        searchParams.set('entityTypes', filters.entityTypes.join(','));
      }
      if (filters.status.length > 0) {
        searchParams.set('status', filters.status.join(','));
      }
      if (filters.priority.length > 0) {
        searchParams.set('priority', filters.priority.join(','));
      }
      if (filters.valueRange.min !== null) {
        searchParams.set('minValue', filters.valueRange.min.toString());
      }
      if (filters.valueRange.max !== null) {
        searchParams.set('maxValue', filters.valueRange.max.toString());
      }
      if (filters.assignedTo.length > 0) {
        searchParams.set('assignedTo', filters.assignedTo.join(','));
      }
      if (filters.tags.length > 0) {
        searchParams.set('tags', filters.tags.join(','));
      }
      if (filters.dateRange?.from) {
        searchParams.set('startDate', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        searchParams.set('endDate', filters.dateRange.to.toISOString());
      }
      searchParams.set('sortBy', filters.sortBy);
      searchParams.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/crm/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      entityTypes: ['client', 'deal', 'task', 'invoice'],
      dateRange: undefined,
      status: [],
      priority: [],
      valueRange: { min: null, max: null },
      assignedTo: [],
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const toggleEntityType = (entityType: string) => {
    const current = filters.entityTypes;
    const updated = current.includes(entityType)
      ? current.filter(type => type !== entityType)
      : [...current, entityType];
    updateFilter('entityTypes', updated);
  };

  const toggleFilterArray = (key: 'status' | 'priority' | 'assignedTo' | 'tags', value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const Icon = ENTITY_TYPE_ICONS[result.type];
    const colorClass = ENTITY_TYPE_COLORS[result.type];

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={colorClass}>
                  <Icon className="h-3 w-3 mr-1" />
                  {result.type}
                </Badge>
                <Badge variant="outline">{result.status}</Badge>
                {result.priority && (
                  <Badge variant={result.priority === 'high' ? 'destructive' : 'secondary'}>
                    {result.priority}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{result.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Created: {new Date(result.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(result.updatedAt).toLocaleDateString()}</span>
                {result.assignedTo && <span>Assigned: {result.assignedTo}</span>}
              </div>

              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {result.value && (
              <div className="text-right">
                <div className="font-bold text-lg">{formatCurrency(result.value)}</div>
                <div className="text-xs text-muted-foreground">Value</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <p className="text-muted-foreground">
            Search and filter across all CRM entities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={performSearch}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Query */}
              <div>
                <Label htmlFor="search-query">Search Query</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search-query"
                    placeholder="Search across all data..."
                    value={filters.query}
                    onChange={(e) => updateFilter('query', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Separator />

              {/* Entity Types */}
              <div>
                <Label>Entity Types</Label>
                <div className="space-y-2 mt-2">
                  {['client', 'deal', 'task', 'invoice'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={filters.entityTypes.includes(type)}
                        onCheckedChange={() => toggleEntityType(type)}
                      />
                      <Label htmlFor={type} className="capitalize">
                        {type}s ({searchResults?.facets.entityTypes[type] || 0})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date Range */}
              <div>
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={filters.dateRange}
                  onDateChange={(range) => updateFilter('dateRange', range)}
                />
              </div>

              <Separator />

              {/* Value Range */}
              <div>
                <Label>Value Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valueRange.min || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      min: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valueRange.max || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      max: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                </div>
              </div>

              <Separator />

              {/* Sort Options */}
              <div>
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="updated_at">Date Updated</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'asc')}
                  >
                    <SortAsc className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'desc')}
                  >
                    <SortDesc className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <X className="h-5 w-5" />
                  <span>Search error: {error}</span>
                </div>
                <Button 
                  onClick={performSearch} 
                  variant="outline" 
                  className="mt-4"
                >
                  Retry Search
                </Button>
              </CardContent>
            </Card>
          )}

          {searchResults && (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    Search Results ({searchResults.totalCount})
                  </h2>
                  <p className="text-muted-foreground">
                    Found {searchResults.results.length} results
                  </p>
                </div>
                
                {/* Quick Filters */}
                <div className="flex items-center space-x-2">
                  {Object.entries(searchResults.facets.statuses).map(([status, count]) => (
                    <Badge
                      key={status}
                      variant={filters.status.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleFilterArray('status', status)}
                    >
                      {status} ({count})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Results List */}
              <div>
                {searchResults.results.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search query or filters
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  searchResults.results.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Default State */}
          {!searchResults && !loading && !error && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Search</h3>
                <p className="text-muted-foreground mb-4">
                  Search across clients, deals, tasks, and invoices
                </p>
                <p className="text-sm text-muted-foreground">
                  Enter a search query or apply filters to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" <SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null> 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Filter, X, Calendar, DollarSign, 
  Users, Target, FileText, Clock, ChevronDown,
  SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface SearchFilters {
  query: string;
  entityTypes: string[];
  dateRange: DateRange | undefined;
  status: string[];
  priority: string[];
  valueRange: {
    min: number | null;
    max: number | null;
  };
  assignedTo: string[];
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'client' | 'deal' | 'task' | 'invoice';
  title: string;
  description: string;
  status: string;
  value?: number;
  priority?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  facets: {
    entityTypes: { [key: string]: number };
    statuses: { [key: string]: number };
    priorities: { [key: string]: number };
    assignedUsers: { [key: string]: number };
  };
}

const ENTITY_TYPE_ICONS = {
  client: Users,
  deal: Target,
  task: Clock,
  invoice: FileText,
};

const ENTITY_TYPE_COLORS = {
  client: 'bg-blue-100 text-blue-800 border-blue-300',
  deal: 'bg-green-100 text-green-800 border-green-300',
  task: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  invoice: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function AdvancedSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    entityTypes: ['client', 'deal', 'task', 'invoice'],
    dateRange: undefined,
    status: [],
    priority: [],
    valueRange: { min: null, max: null },
    assignedTo: [],
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Trigger search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery.length >= 2 || hasActiveFilters()) {
      performSearch();
    } else {
      setSearchResults(null);
    }
  }, [debouncedQuery, filters]);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.entityTypes.length < 4 ||
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.valueRange.min !== null ||
      filters.valueRange.max !== null ||
      filters.assignedTo.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange
    );
  }, [filters]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      
      if (debouncedQuery) searchParams.set('q', debouncedQuery);
      if (filters.entityTypes.length > 0) {
        searchParams.set('entityTypes', filters.entityTypes.join(','));
      }
      if (filters.status.length > 0) {
        searchParams.set('status', filters.status.join(','));
      }
      if (filters.priority.length > 0) {
        searchParams.set('priority', filters.priority.join(','));
      }
      if (filters.valueRange.min !== null) {
        searchParams.set('minValue', filters.valueRange.min.toString());
      }
      if (filters.valueRange.max !== null) {
        searchParams.set('maxValue', filters.valueRange.max.toString());
      }
      if (filters.assignedTo.length > 0) {
        searchParams.set('assignedTo', filters.assignedTo.join(','));
      }
      if (filters.tags.length > 0) {
        searchParams.set('tags', filters.tags.join(','));
      }
      if (filters.dateRange?.from) {
        searchParams.set('startDate', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        searchParams.set('endDate', filters.dateRange.to.toISOString());
      }
      searchParams.set('sortBy', filters.sortBy);
      searchParams.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/crm/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      entityTypes: ['client', 'deal', 'task', 'invoice'],
      dateRange: undefined,
      status: [],
      priority: [],
      valueRange: { min: null, max: null },
      assignedTo: [],
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const toggleEntityType = (entityType: string) => {
    const current = filters.entityTypes;
    const updated = current.includes(entityType)
      ? current.filter(type => type !== entityType)
      : [...current, entityType];
    updateFilter('entityTypes', updated);
  };

  const toggleFilterArray = (key: 'status' | 'priority' | 'assignedTo' | 'tags', value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const Icon = ENTITY_TYPE_ICONS[result.type];
    const colorClass = ENTITY_TYPE_COLORS[result.type];

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={colorClass}>
                  <Icon className="h-3 w-3 mr-1" />
                  {result.type}
                </Badge>
                <Badge variant="outline">{result.status}</Badge>
                {result.priority && (
                  <Badge variant={result.priority === 'high' ? 'destructive' : 'secondary'}>
                    {result.priority}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{result.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Created: {new Date(result.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(result.updatedAt).toLocaleDateString()}</span>
                {result.assignedTo && <span>Assigned: {result.assignedTo}</span>}
              </div>

              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {result.value && (
              <div className="text-right">
                <div className="font-bold text-lg">{formatCurrency(result.value)}</div>
                <div className="text-xs text-muted-foreground">Value</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <p className="text-muted-foreground">
            Search and filter across all CRM entities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={performSearch}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Query */}
              <div>
                <Label htmlFor="search-query">Search Query</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search-query"
                    placeholder="Search across all data..."
                    value={filters.query}
                    onChange={(e) => updateFilter('query', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Separator />

              {/* Entity Types */}
              <div>
                <Label>Entity Types</Label>
                <div className="space-y-2 mt-2">
                  {['client', 'deal', 'task', 'invoice'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={filters.entityTypes.includes(type)}
                        onCheckedChange={() => toggleEntityType(type)}
                      />
                      <Label htmlFor={type} className="capitalize">
                        {type}s ({searchResults?.facets.entityTypes[type] || 0})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date Range */}
              <div>
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={filters.dateRange}
                  onDateChange={(range) => updateFilter('dateRange', range)}
                />
              </div>

              <Separator />

              {/* Value Range */}
              <div>
                <Label>Value Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valueRange.min || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      min: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valueRange.max || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      max: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                </div>
              </div>

              <Separator />

              {/* Sort Options */}
              <div>
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="updated_at">Date Updated</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'asc')}
                  >
                    <SortAsc className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'desc')}
                  >
                    <SortDesc className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <X className="h-5 w-5" />
                  <span>Search error: {error}</span>
                </div>
                <Button 
                  onClick={performSearch} 
                  variant="outline" 
                  className="mt-4"
                >
                  Retry Search
                </Button>
              </CardContent>
            </Card>
          )}

          {searchResults && (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    Search Results ({searchResults.totalCount})
                  </h2>
                  <p className="text-muted-foreground">
                    Found {searchResults.results.length} results
                  </p>
                </div>
                
                {/* Quick Filters */}
                <div className="flex items-center space-x-2">
                  {Object.entries(searchResults.facets.statuses).map(([status, count]) => (
                    <Badge
                      key={status}
                      variant={filters.status.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleFilterArray('status', status)}
                    >
                      {status} ({count})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Results List */}
              <div>
                {searchResults.results.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search query or filters
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  searchResults.results.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Default State */}
          {!searchResults && !loading && !error && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Search</h3>
                <p className="text-muted-foreground mb-4">
                  Search across clients, deals, tasks, and invoices
                </p>
                <p className="text-sm text-muted-foreground">
                  Enter a search query or apply filters to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" < 4 ||
      filters.status.length > 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Filter, X, Calendar, DollarSign, 
  Users, Target, FileText, Clock, ChevronDown,
  SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface SearchFilters {
  query: string;
  entityTypes: string[];
  dateRange: DateRange | undefined;
  status: string[];
  priority: string[];
  valueRange: {
    min: number | null;
    max: number | null;
  };
  assignedTo: string[];
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'client' | 'deal' | 'task' | 'invoice';
  title: string;
  description: string;
  status: string;
  value?: number;
  priority?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  facets: {
    entityTypes: { [key: string]: number };
    statuses: { [key: string]: number };
    priorities: { [key: string]: number };
    assignedUsers: { [key: string]: number };
  };
}

const ENTITY_TYPE_ICONS = {
  client: Users,
  deal: Target,
  task: Clock,
  invoice: FileText,
};

const ENTITY_TYPE_COLORS = {
  client: 'bg-blue-100 text-blue-800 border-blue-300',
  deal: 'bg-green-100 text-green-800 border-green-300',
  task: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  invoice: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function AdvancedSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    entityTypes: ['client', 'deal', 'task', 'invoice'],
    dateRange: undefined,
    status: [],
    priority: [],
    valueRange: { min: null, max: null },
    assignedTo: [],
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Trigger search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery.length >= 2 || hasActiveFilters()) {
      performSearch();
    } else {
      setSearchResults(null);
    }
  }, [debouncedQuery, filters]);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.entityTypes.length < 4 ||
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.valueRange.min !== null ||
      filters.valueRange.max !== null ||
      filters.assignedTo.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange
    );
  }, [filters]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      
      if (debouncedQuery) searchParams.set('q', debouncedQuery);
      if (filters.entityTypes.length > 0) {
        searchParams.set('entityTypes', filters.entityTypes.join(','));
      }
      if (filters.status.length > 0) {
        searchParams.set('status', filters.status.join(','));
      }
      if (filters.priority.length > 0) {
        searchParams.set('priority', filters.priority.join(','));
      }
      if (filters.valueRange.min !== null) {
        searchParams.set('minValue', filters.valueRange.min.toString());
      }
      if (filters.valueRange.max !== null) {
        searchParams.set('maxValue', filters.valueRange.max.toString());
      }
      if (filters.assignedTo.length > 0) {
        searchParams.set('assignedTo', filters.assignedTo.join(','));
      }
      if (filters.tags.length > 0) {
        searchParams.set('tags', filters.tags.join(','));
      }
      if (filters.dateRange?.from) {
        searchParams.set('startDate', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        searchParams.set('endDate', filters.dateRange.to.toISOString());
      }
      searchParams.set('sortBy', filters.sortBy);
      searchParams.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/crm/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      entityTypes: ['client', 'deal', 'task', 'invoice'],
      dateRange: undefined,
      status: [],
      priority: [],
      valueRange: { min: null, max: null },
      assignedTo: [],
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const toggleEntityType = (entityType: string) => {
    const current = filters.entityTypes;
    const updated = current.includes(entityType)
      ? current.filter(type => type !== entityType)
      : [...current, entityType];
    updateFilter('entityTypes', updated);
  };

  const toggleFilterArray = (key: 'status' | 'priority' | 'assignedTo' | 'tags', value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const Icon = ENTITY_TYPE_ICONS[result.type];
    const colorClass = ENTITY_TYPE_COLORS[result.type];

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={colorClass}>
                  <Icon className="h-3 w-3 mr-1" />
                  {result.type}
                </Badge>
                <Badge variant="outline">{result.status}</Badge>
                {result.priority && (
                  <Badge variant={result.priority === 'high' ? 'destructive' : 'secondary'}>
                    {result.priority}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{result.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Created: {new Date(result.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(result.updatedAt).toLocaleDateString()}</span>
                {result.assignedTo && <span>Assigned: {result.assignedTo}</span>}
              </div>

              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {result.value && (
              <div className="text-right">
                <div className="font-bold text-lg">{formatCurrency(result.value)}</div>
                <div className="text-xs text-muted-foreground">Value</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <p className="text-muted-foreground">
            Search and filter across all CRM entities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={performSearch}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Query */}
              <div>
                <Label htmlFor="search-query">Search Query</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search-query"
                    placeholder="Search across all data..."
                    value={filters.query}
                    onChange={(e) => updateFilter('query', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Separator />

              {/* Entity Types */}
              <div>
                <Label>Entity Types</Label>
                <div className="space-y-2 mt-2">
                  {['client', 'deal', 'task', 'invoice'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={filters.entityTypes.includes(type)}
                        onCheckedChange={() => toggleEntityType(type)}
                      />
                      <Label htmlFor={type} className="capitalize">
                        {type}s ({searchResults?.facets.entityTypes[type] || 0})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date Range */}
              <div>
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={filters.dateRange}
                  onDateChange={(range) => updateFilter('dateRange', range)}
                />
              </div>

              <Separator />

              {/* Value Range */}
              <div>
                <Label>Value Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valueRange.min || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      min: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valueRange.max || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      max: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                </div>
              </div>

              <Separator />

              {/* Sort Options */}
              <div>
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="updated_at">Date Updated</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'asc')}
                  >
                    <SortAsc className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'desc')}
                  >
                    <SortDesc className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <X className="h-5 w-5" />
                  <span>Search error: {error}</span>
                </div>
                <Button 
                  onClick={performSearch} 
                  variant="outline" 
                  className="mt-4"
                >
                  Retry Search
                </Button>
              </CardContent>
            </Card>
          )}

          {searchResults && (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    Search Results ({searchResults.totalCount})
                  </h2>
                  <p className="text-muted-foreground">
                    Found {searchResults.results.length} results
                  </p>
                </div>
                
                {/* Quick Filters */}
                <div className="flex items-center space-x-2">
                  {Object.entries(searchResults.facets.statuses).map(([status, count]) => (
                    <Badge
                      key={status}
                      variant={filters.status.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleFilterArray('status', status)}
                    >
                      {status} ({count})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Results List */}
              <div>
                {searchResults.results.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search query or filters
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  searchResults.results.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Default State */}
          {!searchResults && !loading && !error && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Search</h3>
                <p className="text-muted-foreground mb-4">
                  Search across clients, deals, tasks, and invoices
                </p>
                <p className="text-sm text-muted-foreground">
                  Enter a search query or apply filters to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={colorClass}>
                  <Icon className="h-3 w-3 mr-1" />
                  {result.type}
                </Badge>
                <Badge variant="outline">{result.status}</Badge>
                {result.priority && (
                  <Badge variant={result.priority === 'high' ? 'destructive' : 'secondary'}>
                    {result.priority}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{result.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Created: {new Date(result.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(result.updatedAt).toLocaleDateString()}</span>
                {result.assignedTo && <span>Assigned: {result.assignedTo}</span>}
              </div>

              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {result.value && (
              <div className="text-right">
                <div className="font-bold text-lg">{formatCurrency(result.value)}</div>
                <div className="text-xs text-muted-foreground">Value</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <p className="text-muted-foreground">
            Search and filter across all CRM entities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={performSearch}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Query */}
              <div>
                <Label htmlFor="search-query">Search Query</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search-query"
                    placeholder="Search across all data..."
                    value={filters.query}
                    onChange={(e) => 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Filter, X, Calendar, DollarSign, 
  Users, Target, FileText, Clock, ChevronDown,
  SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface SearchFilters {
  query: string;
  entityTypes: string[];
  dateRange: DateRange | undefined;
  status: string[];
  priority: string[];
  valueRange: {
    min: number | null;
    max: number | null;
  };
  assignedTo: string[];
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'client' | 'deal' | 'task' | 'invoice';
  title: string;
  description: string;
  status: string;
  value?: number;
  priority?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  facets: {
    entityTypes: { [key: string]: number };
    statuses: { [key: string]: number };
    priorities: { [key: string]: number };
    assignedUsers: { [key: string]: number };
  };
}

const ENTITY_TYPE_ICONS = {
  client: Users,
  deal: Target,
  task: Clock,
  invoice: FileText,
};

const ENTITY_TYPE_COLORS = {
  client: 'bg-blue-100 text-blue-800 border-blue-300',
  deal: 'bg-green-100 text-green-800 border-green-300',
  task: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  invoice: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function AdvancedSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    entityTypes: ['client', 'deal', 'task', 'invoice'],
    dateRange: undefined,
    status: [],
    priority: [],
    valueRange: { min: null, max: null },
    assignedTo: [],
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Trigger search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery.length >= 2 || hasActiveFilters()) {
      performSearch();
    } else {
      setSearchResults(null);
    }
  }, [debouncedQuery, filters]);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.entityTypes.length < 4 ||
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.valueRange.min !== null ||
      filters.valueRange.max !== null ||
      filters.assignedTo.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange
    );
  }, [filters]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      
      if (debouncedQuery) searchParams.set('q', debouncedQuery);
      if (filters.entityTypes.length > 0) {
        searchParams.set('entityTypes', filters.entityTypes.join(','));
      }
      if (filters.status.length > 0) {
        searchParams.set('status', filters.status.join(','));
      }
      if (filters.priority.length > 0) {
        searchParams.set('priority', filters.priority.join(','));
      }
      if (filters.valueRange.min !== null) {
        searchParams.set('minValue', filters.valueRange.min.toString());
      }
      if (filters.valueRange.max !== null) {
        searchParams.set('maxValue', filters.valueRange.max.toString());
      }
      if (filters.assignedTo.length > 0) {
        searchParams.set('assignedTo', filters.assignedTo.join(','));
      }
      if (filters.tags.length > 0) {
        searchParams.set('tags', filters.tags.join(','));
      }
      if (filters.dateRange?.from) {
        searchParams.set('startDate', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        searchParams.set('endDate', filters.dateRange.to.toISOString());
      }
      searchParams.set('sortBy', filters.sortBy);
      searchParams.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/crm/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      entityTypes: ['client', 'deal', 'task', 'invoice'],
      dateRange: undefined,
      status: [],
      priority: [],
      valueRange: { min: null, max: null },
      assignedTo: [],
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const toggleEntityType = (entityType: string) => {
    const current = filters.entityTypes;
    const updated = current.includes(entityType)
      ? current.filter(type => type !== entityType)
      : [...current, entityType];
    updateFilter('entityTypes', updated);
  };

  const toggleFilterArray = (key: 'status' | 'priority' | 'assignedTo' | 'tags', value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const Icon = ENTITY_TYPE_ICONS[result.type];
    const colorClass = ENTITY_TYPE_COLORS[result.type];

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={colorClass}>
                  <Icon className="h-3 w-3 mr-1" />
                  {result.type}
                </Badge>
                <Badge variant="outline">{result.status}</Badge>
                {result.priority && (
                  <Badge variant={result.priority === 'high' ? 'destructive' : 'secondary'}>
                    {result.priority}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{result.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Created: {new Date(result.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(result.updatedAt).toLocaleDateString()}</span>
                {result.assignedTo && <span>Assigned: {result.assignedTo}</span>}
              </div>

              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {result.value && (
              <div className="text-right">
                <div className="font-bold text-lg">{formatCurrency(result.value)}</div>
                <div className="text-xs text-muted-foreground">Value</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <p className="text-muted-foreground">
            Search and filter across all CRM entities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={performSearch}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Query */}
              <div>
                <Label htmlFor="search-query">Search Query</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search-query"
                    placeholder="Search across all data..."
                    value={filters.query}
                    onChange={(e) => updateFilter('query', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Separator />

              {/* Entity Types */}
              <div>
                <Label>Entity Types</Label>
                <div className="space-y-2 mt-2">
                  {['client', 'deal', 'task', 'invoice'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={filters.entityTypes.includes(type)}
                        onCheckedChange={() => toggleEntityType(type)}
                      />
                      <Label htmlFor={type} className="capitalize">
                        {type}s ({searchResults?.facets.entityTypes[type] || 0})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date Range */}
              <div>
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={filters.dateRange}
                  onDateChange={(range) => updateFilter('dateRange', range)}
                />
              </div>

              <Separator />

              {/* Value Range */}
              <div>
                <Label>Value Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valueRange.min || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      min: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valueRange.max || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      max: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                </div>
              </div>

              <Separator />

              {/* Sort Options */}
              <div>
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="updated_at">Date Updated</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'asc')}
                  >
                    <SortAsc className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'desc')}
                  >
                    <SortDesc className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <X className="h-5 w-5" />
                  <span>Search error: {error}</span>
                </div>
                <Button 
                  onClick={performSearch} 
                  variant="outline" 
                  className="mt-4"
                >
                  Retry Search
                </Button>
              </CardContent>
            </Card>
          )}

          {searchResults && (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    Search Results ({searchResults.totalCount})
                  </h2>
                  <p className="text-muted-foreground">
                    Found {searchResults.results.length} results
                  </p>
                </div>
                
                {/* Quick Filters */}
                <div className="flex items-center space-x-2">
                  {Object.entries(searchResults.facets.statuses).map(([status, count]) => (
                    <Badge
                      key={status}
                      variant={filters.status.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleFilterArray('status', status)}
                    >
                      {status} ({count})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Results List */}
              <div>
                {searchResults.results.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search query or filters
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  searchResults.results.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Default State */}
          {!searchResults && !loading && !error && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Search</h3>
                <p className="text-muted-foreground mb-4">
                  Search across clients, deals, tasks, and invoices
                </p>
                <p className="text-sm text-muted-foreground">
                  Enter a search query or apply filters to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" </div>
              </div>

              <Separator />

              {/* Entity Types */}
              <div>
                <Label>Entity Types</Label>
                <div className="space-y-2 mt-2"> 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Filter, X, Calendar, DollarSign, 
  Users, Target, FileText, Clock, ChevronDown,
  SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface SearchFilters {
  query: string;
  entityTypes: string[];
  dateRange: DateRange | undefined;
  status: string[];
  priority: string[];
  valueRange: {
    min: number | null;
    max: number | null;
  };
  assignedTo: string[];
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'client' | 'deal' | 'task' | 'invoice';
  title: string;
  description: string;
  status: string;
  value?: number;
  priority?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  facets: {
    entityTypes: { [key: string]: number };
    statuses: { [key: string]: number };
    priorities: { [key: string]: number };
    assignedUsers: { [key: string]: number };
  };
}

const ENTITY_TYPE_ICONS = {
  client: Users,
  deal: Target,
  task: Clock,
  invoice: FileText,
};

const ENTITY_TYPE_COLORS = {
  client: 'bg-blue-100 text-blue-800 border-blue-300',
  deal: 'bg-green-100 text-green-800 border-green-300',
  task: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  invoice: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function AdvancedSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    entityTypes: ['client', 'deal', 'task', 'invoice'],
    dateRange: undefined,
    status: [],
    priority: [],
    valueRange: { min: null, max: null },
    assignedTo: [],
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Trigger search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery.length >= 2 || hasActiveFilters()) {
      performSearch();
    } else {
      setSearchResults(null);
    }
  }, [debouncedQuery, filters]);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.entityTypes.length < 4 ||
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.valueRange.min !== null ||
      filters.valueRange.max !== null ||
      filters.assignedTo.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange
    );
  }, [filters]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      
      if (debouncedQuery) searchParams.set('q', debouncedQuery);
      if (filters.entityTypes.length > 0) {
        searchParams.set('entityTypes', filters.entityTypes.join(','));
      }
      if (filters.status.length > 0) {
        searchParams.set('status', filters.status.join(','));
      }
      if (filters.priority.length > 0) {
        searchParams.set('priority', filters.priority.join(','));
      }
      if (filters.valueRange.min !== null) {
        searchParams.set('minValue', filters.valueRange.min.toString());
      }
      if (filters.valueRange.max !== null) {
        searchParams.set('maxValue', filters.valueRange.max.toString());
      }
      if (filters.assignedTo.length > 0) {
        searchParams.set('assignedTo', filters.assignedTo.join(','));
      }
      if (filters.tags.length > 0) {
        searchParams.set('tags', filters.tags.join(','));
      }
      if (filters.dateRange?.from) {
        searchParams.set('startDate', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        searchParams.set('endDate', filters.dateRange.to.toISOString());
      }
      searchParams.set('sortBy', filters.sortBy);
      searchParams.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/crm/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      entityTypes: ['client', 'deal', 'task', 'invoice'],
      dateRange: undefined,
      status: [],
      priority: [],
      valueRange: { min: null, max: null },
      assignedTo: [],
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const toggleEntityType = (entityType: string) => {
    const current = filters.entityTypes;
    const updated = current.includes(entityType)
      ? current.filter(type => type !== entityType)
      : [...current, entityType];
    updateFilter('entityTypes', updated);
  };

  const toggleFilterArray = (key: 'status' | 'priority' | 'assignedTo' | 'tags', value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const Icon = ENTITY_TYPE_ICONS[result.type];
    const colorClass = ENTITY_TYPE_COLORS[result.type];

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={colorClass}>
                  <Icon className="h-3 w-3 mr-1" />
                  {result.type}
                </Badge>
                <Badge variant="outline">{result.status}</Badge>
                {result.priority && (
                  <Badge variant={result.priority === 'high' ? 'destructive' : 'secondary'}>
                    {result.priority}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{result.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Created: {new Date(result.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(result.updatedAt).toLocaleDateString()}</span>
                {result.assignedTo && <span>Assigned: {result.assignedTo}</span>}
              </div>

              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {result.value && (
              <div className="text-right">
                <div className="font-bold text-lg">{formatCurrency(result.value)}</div>
                <div className="text-xs text-muted-foreground">Value</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <p className="text-muted-foreground">
            Search and filter across all CRM entities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={performSearch}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Query */}
              <div>
                <Label htmlFor="search-query">Search Query</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search-query"
                    placeholder="Search across all data..."
                    value={filters.query}
                    onChange={(e) => updateFilter('query', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Separator />

              {/* Entity Types */}
              <div>
                <Label>Entity Types</Label>
                <div className="space-y-2 mt-2">
                  {['client', 'deal', 'task', 'invoice'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={filters.entityTypes.includes(type)}
                        onCheckedChange={() => toggleEntityType(type)}
                      />
                      <Label htmlFor={type} className="capitalize">
                        {type}s ({searchResults?.facets.entityTypes[type] || 0})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date Range */}
              <div>
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={filters.dateRange}
                  onDateChange={(range) => updateFilter('dateRange', range)}
                />
              </div>

              <Separator />

              {/* Value Range */}
              <div>
                <Label>Value Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valueRange.min || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      min: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valueRange.max || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      max: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                </div>
              </div>

              <Separator />

              {/* Sort Options */}
              <div>
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="updated_at">Date Updated</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'asc')}
                  >
                    <SortAsc className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'desc')}
                  >
                    <SortDesc className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <X className="h-5 w-5" />
                  <span>Search error: {error}</span>
                </div>
                <Button 
                  onClick={performSearch} 
                  variant="outline" 
                  className="mt-4"
                >
                  Retry Search
                </Button>
              </CardContent>
            </Card>
          )}

          {searchResults && (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    Search Results ({searchResults.totalCount})
                  </h2>
                  <p className="text-muted-foreground">
                    Found {searchResults.results.length} results
                  </p>
                </div>
                
                {/* Quick Filters */}
                <div className="flex items-center space-x-2">
                  {Object.entries(searchResults.facets.statuses).map(([status, count]) => (
                    <Badge
                      key={status}
                      variant={filters.status.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleFilterArray('status', status)}
                    >
                      {status} ({count})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Results List */}
              <div>
                {searchResults.results.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search query or filters
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  searchResults.results.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Default State */}
          {!searchResults && !loading && !error && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Search</h3>
                <p className="text-muted-foreground mb-4">
                  Search across clients, deals, tasks, and invoices
                </p>
                <p className="text-sm text-muted-foreground">
                  Enter a search query or apply filters to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={filters.entityTypes.includes(type)}
                        onCheckedChange={() => toggleEntityType(type)}
                      />
                      <Label htmlFor={type} className="capitalize">
                        {type}s ({searchResults?.facets.entityTypes[type] || 0})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date Range */}
              <div>
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={filters.dateRange}
                  onDateChange={(range) => 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Filter, X, Calendar, DollarSign, 
  Users, Target, FileText, Clock, ChevronDown,
  SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface SearchFilters {
  query: string;
  entityTypes: string[];
  dateRange: DateRange | undefined;
  status: string[];
  priority: string[];
  valueRange: {
    min: number | null;
    max: number | null;
  };
  assignedTo: string[];
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'client' | 'deal' | 'task' | 'invoice';
  title: string;
  description: string;
  status: string;
  value?: number;
  priority?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  facets: {
    entityTypes: { [key: string]: number };
    statuses: { [key: string]: number };
    priorities: { [key: string]: number };
    assignedUsers: { [key: string]: number };
  };
}

const ENTITY_TYPE_ICONS = {
  client: Users,
  deal: Target,
  task: Clock,
  invoice: FileText,
};

const ENTITY_TYPE_COLORS = {
  client: 'bg-blue-100 text-blue-800 border-blue-300',
  deal: 'bg-green-100 text-green-800 border-green-300',
  task: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  invoice: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function AdvancedSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    entityTypes: ['client', 'deal', 'task', 'invoice'],
    dateRange: undefined,
    status: [],
    priority: [],
    valueRange: { min: null, max: null },
    assignedTo: [],
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Trigger search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery.length >= 2 || hasActiveFilters()) {
      performSearch();
    } else {
      setSearchResults(null);
    }
  }, [debouncedQuery, filters]);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.entityTypes.length < 4 ||
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.valueRange.min !== null ||
      filters.valueRange.max !== null ||
      filters.assignedTo.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange
    );
  }, [filters]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      
      if (debouncedQuery) searchParams.set('q', debouncedQuery);
      if (filters.entityTypes.length > 0) {
        searchParams.set('entityTypes', filters.entityTypes.join(','));
      }
      if (filters.status.length > 0) {
        searchParams.set('status', filters.status.join(','));
      }
      if (filters.priority.length > 0) {
        searchParams.set('priority', filters.priority.join(','));
      }
      if (filters.valueRange.min !== null) {
        searchParams.set('minValue', filters.valueRange.min.toString());
      }
      if (filters.valueRange.max !== null) {
        searchParams.set('maxValue', filters.valueRange.max.toString());
      }
      if (filters.assignedTo.length > 0) {
        searchParams.set('assignedTo', filters.assignedTo.join(','));
      }
      if (filters.tags.length > 0) {
        searchParams.set('tags', filters.tags.join(','));
      }
      if (filters.dateRange?.from) {
        searchParams.set('startDate', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        searchParams.set('endDate', filters.dateRange.to.toISOString());
      }
      searchParams.set('sortBy', filters.sortBy);
      searchParams.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/crm/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      entityTypes: ['client', 'deal', 'task', 'invoice'],
      dateRange: undefined,
      status: [],
      priority: [],
      valueRange: { min: null, max: null },
      assignedTo: [],
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const toggleEntityType = (entityType: string) => {
    const current = filters.entityTypes;
    const updated = current.includes(entityType)
      ? current.filter(type => type !== entityType)
      : [...current, entityType];
    updateFilter('entityTypes', updated);
  };

  const toggleFilterArray = (key: 'status' | 'priority' | 'assignedTo' | 'tags', value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const Icon = ENTITY_TYPE_ICONS[result.type];
    const colorClass = ENTITY_TYPE_COLORS[result.type];

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={colorClass}>
                  <Icon className="h-3 w-3 mr-1" />
                  {result.type}
                </Badge>
                <Badge variant="outline">{result.status}</Badge>
                {result.priority && (
                  <Badge variant={result.priority === 'high' ? 'destructive' : 'secondary'}>
                    {result.priority}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{result.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Created: {new Date(result.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(result.updatedAt).toLocaleDateString()}</span>
                {result.assignedTo && <span>Assigned: {result.assignedTo}</span>}
              </div>

              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {result.value && (
              <div className="text-right">
                <div className="font-bold text-lg">{formatCurrency(result.value)}</div>
                <div className="text-xs text-muted-foreground">Value</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <p className="text-muted-foreground">
            Search and filter across all CRM entities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={performSearch}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Query */}
              <div>
                <Label htmlFor="search-query">Search Query</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search-query"
                    placeholder="Search across all data..."
                    value={filters.query}
                    onChange={(e) => updateFilter('query', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Separator />

              {/* Entity Types */}
              <div>
                <Label>Entity Types</Label>
                <div className="space-y-2 mt-2">
                  {['client', 'deal', 'task', 'invoice'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={filters.entityTypes.includes(type)}
                        onCheckedChange={() => toggleEntityType(type)}
                      />
                      <Label htmlFor={type} className="capitalize">
                        {type}s ({searchResults?.facets.entityTypes[type] || 0})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date Range */}
              <div>
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={filters.dateRange}
                  onDateChange={(range) => updateFilter('dateRange', range)}
                />
              </div>

              <Separator />

              {/* Value Range */}
              <div>
                <Label>Value Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valueRange.min || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      min: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valueRange.max || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      max: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                </div>
              </div>

              <Separator />

              {/* Sort Options */}
              <div>
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="updated_at">Date Updated</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'asc')}
                  >
                    <SortAsc className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'desc')}
                  >
                    <SortDesc className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <X className="h-5 w-5" />
                  <span>Search error: {error}</span>
                </div>
                <Button 
                  onClick={performSearch} 
                  variant="outline" 
                  className="mt-4"
                >
                  Retry Search
                </Button>
              </CardContent>
            </Card>
          )}

          {searchResults && (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    Search Results ({searchResults.totalCount})
                  </h2>
                  <p className="text-muted-foreground">
                    Found {searchResults.results.length} results
                  </p>
                </div>
                
                {/* Quick Filters */}
                <div className="flex items-center space-x-2">
                  {Object.entries(searchResults.facets.statuses).map(([status, count]) => (
                    <Badge
                      key={status}
                      variant={filters.status.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleFilterArray('status', status)}
                    >
                      {status} ({count})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Results List */}
              <div>
                {searchResults.results.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search query or filters
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  searchResults.results.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Default State */}
          {!searchResults && !loading && !error && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Search</h3>
                <p className="text-muted-foreground mb-4">
                  Search across clients, deals, tasks, and invoices
                </p>
                <p className="text-sm text-muted-foreground">
                  Enter a search query or apply filters to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" </div>

              <Separator />

              {/* Value Range */}
              <div>
                <Label>Value Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valueRange.min || ''}
                    onChange={(e) => 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Filter, X, Calendar, DollarSign, 
  Users, Target, FileText, Clock, ChevronDown,
  SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface SearchFilters {
  query: string;
  entityTypes: string[];
  dateRange: DateRange | undefined;
  status: string[];
  priority: string[];
  valueRange: {
    min: number | null;
    max: number | null;
  };
  assignedTo: string[];
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'client' | 'deal' | 'task' | 'invoice';
  title: string;
  description: string;
  status: string;
  value?: number;
  priority?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  facets: {
    entityTypes: { [key: string]: number };
    statuses: { [key: string]: number };
    priorities: { [key: string]: number };
    assignedUsers: { [key: string]: number };
  };
}

const ENTITY_TYPE_ICONS = {
  client: Users,
  deal: Target,
  task: Clock,
  invoice: FileText,
};

const ENTITY_TYPE_COLORS = {
  client: 'bg-blue-100 text-blue-800 border-blue-300',
  deal: 'bg-green-100 text-green-800 border-green-300',
  task: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  invoice: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function AdvancedSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    entityTypes: ['client', 'deal', 'task', 'invoice'],
    dateRange: undefined,
    status: [],
    priority: [],
    valueRange: { min: null, max: null },
    assignedTo: [],
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Trigger search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery.length >= 2 || hasActiveFilters()) {
      performSearch();
    } else {
      setSearchResults(null);
    }
  }, [debouncedQuery, filters]);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.entityTypes.length < 4 ||
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.valueRange.min !== null ||
      filters.valueRange.max !== null ||
      filters.assignedTo.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange
    );
  }, [filters]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      
      if (debouncedQuery) searchParams.set('q', debouncedQuery);
      if (filters.entityTypes.length > 0) {
        searchParams.set('entityTypes', filters.entityTypes.join(','));
      }
      if (filters.status.length > 0) {
        searchParams.set('status', filters.status.join(','));
      }
      if (filters.priority.length > 0) {
        searchParams.set('priority', filters.priority.join(','));
      }
      if (filters.valueRange.min !== null) {
        searchParams.set('minValue', filters.valueRange.min.toString());
      }
      if (filters.valueRange.max !== null) {
        searchParams.set('maxValue', filters.valueRange.max.toString());
      }
      if (filters.assignedTo.length > 0) {
        searchParams.set('assignedTo', filters.assignedTo.join(','));
      }
      if (filters.tags.length > 0) {
        searchParams.set('tags', filters.tags.join(','));
      }
      if (filters.dateRange?.from) {
        searchParams.set('startDate', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        searchParams.set('endDate', filters.dateRange.to.toISOString());
      }
      searchParams.set('sortBy', filters.sortBy);
      searchParams.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/crm/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      entityTypes: ['client', 'deal', 'task', 'invoice'],
      dateRange: undefined,
      status: [],
      priority: [],
      valueRange: { min: null, max: null },
      assignedTo: [],
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const toggleEntityType = (entityType: string) => {
    const current = filters.entityTypes;
    const updated = current.includes(entityType)
      ? current.filter(type => type !== entityType)
      : [...current, entityType];
    updateFilter('entityTypes', updated);
  };

  const toggleFilterArray = (key: 'status' | 'priority' | 'assignedTo' | 'tags', value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const Icon = ENTITY_TYPE_ICONS[result.type];
    const colorClass = ENTITY_TYPE_COLORS[result.type];

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={colorClass}>
                  <Icon className="h-3 w-3 mr-1" />
                  {result.type}
                </Badge>
                <Badge variant="outline">{result.status}</Badge>
                {result.priority && (
                  <Badge variant={result.priority === 'high' ? 'destructive' : 'secondary'}>
                    {result.priority}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{result.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Created: {new Date(result.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(result.updatedAt).toLocaleDateString()}</span>
                {result.assignedTo && <span>Assigned: {result.assignedTo}</span>}
              </div>

              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {result.value && (
              <div className="text-right">
                <div className="font-bold text-lg">{formatCurrency(result.value)}</div>
                <div className="text-xs text-muted-foreground">Value</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <p className="text-muted-foreground">
            Search and filter across all CRM entities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={performSearch}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Query */}
              <div>
                <Label htmlFor="search-query">Search Query</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search-query"
                    placeholder="Search across all data..."
                    value={filters.query}
                    onChange={(e) => updateFilter('query', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Separator />

              {/* Entity Types */}
              <div>
                <Label>Entity Types</Label>
                <div className="space-y-2 mt-2">
                  {['client', 'deal', 'task', 'invoice'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={filters.entityTypes.includes(type)}
                        onCheckedChange={() => toggleEntityType(type)}
                      />
                      <Label htmlFor={type} className="capitalize">
                        {type}s ({searchResults?.facets.entityTypes[type] || 0})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date Range */}
              <div>
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={filters.dateRange}
                  onDateChange={(range) => updateFilter('dateRange', range)}
                />
              </div>

              <Separator />

              {/* Value Range */}
              <div>
                <Label>Value Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valueRange.min || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      min: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valueRange.max || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      max: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                </div>
              </div>

              <Separator />

              {/* Sort Options */}
              <div>
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="updated_at">Date Updated</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'asc')}
                  >
                    <SortAsc className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'desc')}
                  >
                    <SortDesc className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <X className="h-5 w-5" />
                  <span>Search error: {error}</span>
                </div>
                <Button 
                  onClick={performSearch} 
                  variant="outline" 
                  className="mt-4"
                >
                  Retry Search
                </Button>
              </CardContent>
            </Card>
          )}

          {searchResults && (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    Search Results ({searchResults.totalCount})
                  </h2>
                  <p className="text-muted-foreground">
                    Found {searchResults.results.length} results
                  </p>
                </div>
                
                {/* Quick Filters */}
                <div className="flex items-center space-x-2">
                  {Object.entries(searchResults.facets.statuses).map(([status, count]) => (
                    <Badge
                      key={status}
                      variant={filters.status.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleFilterArray('status', status)}
                    >
                      {status} ({count})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Results List */}
              <div>
                {searchResults.results.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search query or filters
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  searchResults.results.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Default State */}
          {!searchResults && !loading && !error && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Search</h3>
                <p className="text-muted-foreground mb-4">
                  Search across clients, deals, tasks, and invoices
                </p>
                <p className="text-sm text-muted-foreground">
                  Enter a search query or apply filters to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valueRange.max || ''}
                    onChange={(e) => 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Filter, X, Calendar, DollarSign, 
  Users, Target, FileText, Clock, ChevronDown,
  SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface SearchFilters {
  query: string;
  entityTypes: string[];
  dateRange: DateRange | undefined;
  status: string[];
  priority: string[];
  valueRange: {
    min: number | null;
    max: number | null;
  };
  assignedTo: string[];
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'client' | 'deal' | 'task' | 'invoice';
  title: string;
  description: string;
  status: string;
  value?: number;
  priority?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  facets: {
    entityTypes: { [key: string]: number };
    statuses: { [key: string]: number };
    priorities: { [key: string]: number };
    assignedUsers: { [key: string]: number };
  };
}

const ENTITY_TYPE_ICONS = {
  client: Users,
  deal: Target,
  task: Clock,
  invoice: FileText,
};

const ENTITY_TYPE_COLORS = {
  client: 'bg-blue-100 text-blue-800 border-blue-300',
  deal: 'bg-green-100 text-green-800 border-green-300',
  task: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  invoice: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function AdvancedSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    entityTypes: ['client', 'deal', 'task', 'invoice'],
    dateRange: undefined,
    status: [],
    priority: [],
    valueRange: { min: null, max: null },
    assignedTo: [],
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Trigger search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery.length >= 2 || hasActiveFilters()) {
      performSearch();
    } else {
      setSearchResults(null);
    }
  }, [debouncedQuery, filters]);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.entityTypes.length < 4 ||
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.valueRange.min !== null ||
      filters.valueRange.max !== null ||
      filters.assignedTo.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange
    );
  }, [filters]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      
      if (debouncedQuery) searchParams.set('q', debouncedQuery);
      if (filters.entityTypes.length > 0) {
        searchParams.set('entityTypes', filters.entityTypes.join(','));
      }
      if (filters.status.length > 0) {
        searchParams.set('status', filters.status.join(','));
      }
      if (filters.priority.length > 0) {
        searchParams.set('priority', filters.priority.join(','));
      }
      if (filters.valueRange.min !== null) {
        searchParams.set('minValue', filters.valueRange.min.toString());
      }
      if (filters.valueRange.max !== null) {
        searchParams.set('maxValue', filters.valueRange.max.toString());
      }
      if (filters.assignedTo.length > 0) {
        searchParams.set('assignedTo', filters.assignedTo.join(','));
      }
      if (filters.tags.length > 0) {
        searchParams.set('tags', filters.tags.join(','));
      }
      if (filters.dateRange?.from) {
        searchParams.set('startDate', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        searchParams.set('endDate', filters.dateRange.to.toISOString());
      }
      searchParams.set('sortBy', filters.sortBy);
      searchParams.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/crm/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      entityTypes: ['client', 'deal', 'task', 'invoice'],
      dateRange: undefined,
      status: [],
      priority: [],
      valueRange: { min: null, max: null },
      assignedTo: [],
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const toggleEntityType = (entityType: string) => {
    const current = filters.entityTypes;
    const updated = current.includes(entityType)
      ? current.filter(type => type !== entityType)
      : [...current, entityType];
    updateFilter('entityTypes', updated);
  };

  const toggleFilterArray = (key: 'status' | 'priority' | 'assignedTo' | 'tags', value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const Icon = ENTITY_TYPE_ICONS[result.type];
    const colorClass = ENTITY_TYPE_COLORS[result.type];

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={colorClass}>
                  <Icon className="h-3 w-3 mr-1" />
                  {result.type}
                </Badge>
                <Badge variant="outline">{result.status}</Badge>
                {result.priority && (
                  <Badge variant={result.priority === 'high' ? 'destructive' : 'secondary'}>
                    {result.priority}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{result.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Created: {new Date(result.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(result.updatedAt).toLocaleDateString()}</span>
                {result.assignedTo && <span>Assigned: {result.assignedTo}</span>}
              </div>

              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {result.value && (
              <div className="text-right">
                <div className="font-bold text-lg">{formatCurrency(result.value)}</div>
                <div className="text-xs text-muted-foreground">Value</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <p className="text-muted-foreground">
            Search and filter across all CRM entities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={performSearch}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Query */}
              <div>
                <Label htmlFor="search-query">Search Query</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search-query"
                    placeholder="Search across all data..."
                    value={filters.query}
                    onChange={(e) => updateFilter('query', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Separator />

              {/* Entity Types */}
              <div>
                <Label>Entity Types</Label>
                <div className="space-y-2 mt-2">
                  {['client', 'deal', 'task', 'invoice'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={filters.entityTypes.includes(type)}
                        onCheckedChange={() => toggleEntityType(type)}
                      />
                      <Label htmlFor={type} className="capitalize">
                        {type}s ({searchResults?.facets.entityTypes[type] || 0})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date Range */}
              <div>
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={filters.dateRange}
                  onDateChange={(range) => updateFilter('dateRange', range)}
                />
              </div>

              <Separator />

              {/* Value Range */}
              <div>
                <Label>Value Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valueRange.min || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      min: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valueRange.max || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      max: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                </div>
              </div>

              <Separator />

              {/* Sort Options */}
              <div>
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="updated_at">Date Updated</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'asc')}
                  >
                    <SortAsc className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'desc')}
                  >
                    <SortDesc className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <X className="h-5 w-5" />
                  <span>Search error: {error}</span>
                </div>
                <Button 
                  onClick={performSearch} 
                  variant="outline" 
                  className="mt-4"
                >
                  Retry Search
                </Button>
              </CardContent>
            </Card>
          )}

          {searchResults && (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    Search Results ({searchResults.totalCount})
                  </h2>
                  <p className="text-muted-foreground">
                    Found {searchResults.results.length} results
                  </p>
                </div>
                
                {/* Quick Filters */}
                <div className="flex items-center space-x-2">
                  {Object.entries(searchResults.facets.statuses).map(([status, count]) => (
                    <Badge
                      key={status}
                      variant={filters.status.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleFilterArray('status', status)}
                    >
                      {status} ({count})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Results List */}
              <div>
                {searchResults.results.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search query or filters
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  searchResults.results.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Default State */}
          {!searchResults && !loading && !error && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Search</h3>
                <p className="text-muted-foreground mb-4">
                  Search across clients, deals, tasks, and invoices
                </p>
                <p className="text-sm text-muted-foreground">
                  Enter a search query or apply filters to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" </div>
              </div>

              <Separator />

              {/* Sort Options */}
              <div>
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Filter, X, Calendar, DollarSign, 
  Users, Target, FileText, Clock, ChevronDown,
  SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface SearchFilters {
  query: string;
  entityTypes: string[];
  dateRange: DateRange | undefined;
  status: string[];
  priority: string[];
  valueRange: {
    min: number | null;
    max: number | null;
  };
  assignedTo: string[];
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'client' | 'deal' | 'task' | 'invoice';
  title: string;
  description: string;
  status: string;
  value?: number;
  priority?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  facets: {
    entityTypes: { [key: string]: number };
    statuses: { [key: string]: number };
    priorities: { [key: string]: number };
    assignedUsers: { [key: string]: number };
  };
}

const ENTITY_TYPE_ICONS = {
  client: Users,
  deal: Target,
  task: Clock,
  invoice: FileText,
};

const ENTITY_TYPE_COLORS = {
  client: 'bg-blue-100 text-blue-800 border-blue-300',
  deal: 'bg-green-100 text-green-800 border-green-300',
  task: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  invoice: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function AdvancedSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    entityTypes: ['client', 'deal', 'task', 'invoice'],
    dateRange: undefined,
    status: [],
    priority: [],
    valueRange: { min: null, max: null },
    assignedTo: [],
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Trigger search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery.length >= 2 || hasActiveFilters()) {
      performSearch();
    } else {
      setSearchResults(null);
    }
  }, [debouncedQuery, filters]);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.entityTypes.length < 4 ||
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.valueRange.min !== null ||
      filters.valueRange.max !== null ||
      filters.assignedTo.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange
    );
  }, [filters]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      
      if (debouncedQuery) searchParams.set('q', debouncedQuery);
      if (filters.entityTypes.length > 0) {
        searchParams.set('entityTypes', filters.entityTypes.join(','));
      }
      if (filters.status.length > 0) {
        searchParams.set('status', filters.status.join(','));
      }
      if (filters.priority.length > 0) {
        searchParams.set('priority', filters.priority.join(','));
      }
      if (filters.valueRange.min !== null) {
        searchParams.set('minValue', filters.valueRange.min.toString());
      }
      if (filters.valueRange.max !== null) {
        searchParams.set('maxValue', filters.valueRange.max.toString());
      }
      if (filters.assignedTo.length > 0) {
        searchParams.set('assignedTo', filters.assignedTo.join(','));
      }
      if (filters.tags.length > 0) {
        searchParams.set('tags', filters.tags.join(','));
      }
      if (filters.dateRange?.from) {
        searchParams.set('startDate', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        searchParams.set('endDate', filters.dateRange.to.toISOString());
      }
      searchParams.set('sortBy', filters.sortBy);
      searchParams.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/crm/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      entityTypes: ['client', 'deal', 'task', 'invoice'],
      dateRange: undefined,
      status: [],
      priority: [],
      valueRange: { min: null, max: null },
      assignedTo: [],
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const toggleEntityType = (entityType: string) => {
    const current = filters.entityTypes;
    const updated = current.includes(entityType)
      ? current.filter(type => type !== entityType)
      : [...current, entityType];
    updateFilter('entityTypes', updated);
  };

  const toggleFilterArray = (key: 'status' | 'priority' | 'assignedTo' | 'tags', value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const Icon = ENTITY_TYPE_ICONS[result.type];
    const colorClass = ENTITY_TYPE_COLORS[result.type];

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={colorClass}>
                  <Icon className="h-3 w-3 mr-1" />
                  {result.type}
                </Badge>
                <Badge variant="outline">{result.status}</Badge>
                {result.priority && (
                  <Badge variant={result.priority === 'high' ? 'destructive' : 'secondary'}>
                    {result.priority}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{result.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Created: {new Date(result.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(result.updatedAt).toLocaleDateString()}</span>
                {result.assignedTo && <span>Assigned: {result.assignedTo}</span>}
              </div>

              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {result.value && (
              <div className="text-right">
                <div className="font-bold text-lg">{formatCurrency(result.value)}</div>
                <div className="text-xs text-muted-foreground">Value</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <p className="text-muted-foreground">
            Search and filter across all CRM entities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={performSearch}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Query */}
              <div>
                <Label htmlFor="search-query">Search Query</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search-query"
                    placeholder="Search across all data..."
                    value={filters.query}
                    onChange={(e) => updateFilter('query', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Separator />

              {/* Entity Types */}
              <div>
                <Label>Entity Types</Label>
                <div className="space-y-2 mt-2">
                  {['client', 'deal', 'task', 'invoice'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={filters.entityTypes.includes(type)}
                        onCheckedChange={() => toggleEntityType(type)}
                      />
                      <Label htmlFor={type} className="capitalize">
                        {type}s ({searchResults?.facets.entityTypes[type] || 0})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date Range */}
              <div>
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={filters.dateRange}
                  onDateChange={(range) => updateFilter('dateRange', range)}
                />
              </div>

              <Separator />

              {/* Value Range */}
              <div>
                <Label>Value Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valueRange.min || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      min: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valueRange.max || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      max: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                </div>
              </div>

              <Separator />

              {/* Sort Options */}
              <div>
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="updated_at">Date Updated</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'asc')}
                  >
                    <SortAsc className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'desc')}
                  >
                    <SortDesc className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <X className="h-5 w-5" />
                  <span>Search error: {error}</span>
                </div>
                <Button 
                  onClick={performSearch} 
                  variant="outline" 
                  className="mt-4"
                >
                  Retry Search
                </Button>
              </CardContent>
            </Card>
          )}

          {searchResults && (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    Search Results ({searchResults.totalCount})
                  </h2>
                  <p className="text-muted-foreground">
                    Found {searchResults.results.length} results
                  </p>
                </div>
                
                {/* Quick Filters */}
                <div className="flex items-center space-x-2">
                  {Object.entries(searchResults.facets.statuses).map(([status, count]) => (
                    <Badge
                      key={status}
                      variant={filters.status.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleFilterArray('status', status)}
                    >
                      {status} ({count})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Results List */}
              <div>
                {searchResults.results.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search query or filters
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  searchResults.results.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Default State */}
          {!searchResults && !loading && !error && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Search</h3>
                <p className="text-muted-foreground mb-4">
                  Search across clients, deals, tasks, and invoices
                </p>
                <p className="text-sm text-muted-foreground">
                  Enter a search query or apply filters to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="updated_at">Date Updated</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Filter, X, Calendar, DollarSign, 
  Users, Target, FileText, Clock, ChevronDown,
  SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface SearchFilters {
  query: string;
  entityTypes: string[];
  dateRange: DateRange | undefined;
  status: string[];
  priority: string[];
  valueRange: {
    min: number | null;
    max: number | null;
  };
  assignedTo: string[];
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'client' | 'deal' | 'task' | 'invoice';
  title: string;
  description: string;
  status: string;
  value?: number;
  priority?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  facets: {
    entityTypes: { [key: string]: number };
    statuses: { [key: string]: number };
    priorities: { [key: string]: number };
    assignedUsers: { [key: string]: number };
  };
}

const ENTITY_TYPE_ICONS = {
  client: Users,
  deal: Target,
  task: Clock,
  invoice: FileText,
};

const ENTITY_TYPE_COLORS = {
  client: 'bg-blue-100 text-blue-800 border-blue-300',
  deal: 'bg-green-100 text-green-800 border-green-300',
  task: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  invoice: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function AdvancedSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    entityTypes: ['client', 'deal', 'task', 'invoice'],
    dateRange: undefined,
    status: [],
    priority: [],
    valueRange: { min: null, max: null },
    assignedTo: [],
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Trigger search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery.length >= 2 || hasActiveFilters()) {
      performSearch();
    } else {
      setSearchResults(null);
    }
  }, [debouncedQuery, filters]);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.entityTypes.length < 4 ||
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.valueRange.min !== null ||
      filters.valueRange.max !== null ||
      filters.assignedTo.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange
    );
  }, [filters]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      
      if (debouncedQuery) searchParams.set('q', debouncedQuery);
      if (filters.entityTypes.length > 0) {
        searchParams.set('entityTypes', filters.entityTypes.join(','));
      }
      if (filters.status.length > 0) {
        searchParams.set('status', filters.status.join(','));
      }
      if (filters.priority.length > 0) {
        searchParams.set('priority', filters.priority.join(','));
      }
      if (filters.valueRange.min !== null) {
        searchParams.set('minValue', filters.valueRange.min.toString());
      }
      if (filters.valueRange.max !== null) {
        searchParams.set('maxValue', filters.valueRange.max.toString());
      }
      if (filters.assignedTo.length > 0) {
        searchParams.set('assignedTo', filters.assignedTo.join(','));
      }
      if (filters.tags.length > 0) {
        searchParams.set('tags', filters.tags.join(','));
      }
      if (filters.dateRange?.from) {
        searchParams.set('startDate', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        searchParams.set('endDate', filters.dateRange.to.toISOString());
      }
      searchParams.set('sortBy', filters.sortBy);
      searchParams.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/crm/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      entityTypes: ['client', 'deal', 'task', 'invoice'],
      dateRange: undefined,
      status: [],
      priority: [],
      valueRange: { min: null, max: null },
      assignedTo: [],
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const toggleEntityType = (entityType: string) => {
    const current = filters.entityTypes;
    const updated = current.includes(entityType)
      ? current.filter(type => type !== entityType)
      : [...current, entityType];
    updateFilter('entityTypes', updated);
  };

  const toggleFilterArray = (key: 'status' | 'priority' | 'assignedTo' | 'tags', value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const Icon = ENTITY_TYPE_ICONS[result.type];
    const colorClass = ENTITY_TYPE_COLORS[result.type];

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={colorClass}>
                  <Icon className="h-3 w-3 mr-1" />
                  {result.type}
                </Badge>
                <Badge variant="outline">{result.status}</Badge>
                {result.priority && (
                  <Badge variant={result.priority === 'high' ? 'destructive' : 'secondary'}>
                    {result.priority}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{result.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Created: {new Date(result.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(result.updatedAt).toLocaleDateString()}</span>
                {result.assignedTo && <span>Assigned: {result.assignedTo}</span>}
              </div>

              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {result.value && (
              <div className="text-right">
                <div className="font-bold text-lg">{formatCurrency(result.value)}</div>
                <div className="text-xs text-muted-foreground">Value</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <p className="text-muted-foreground">
            Search and filter across all CRM entities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={performSearch}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Query */}
              <div>
                <Label htmlFor="search-query">Search Query</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search-query"
                    placeholder="Search across all data..."
                    value={filters.query}
                    onChange={(e) => updateFilter('query', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Separator />

              {/* Entity Types */}
              <div>
                <Label>Entity Types</Label>
                <div className="space-y-2 mt-2">
                  {['client', 'deal', 'task', 'invoice'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={filters.entityTypes.includes(type)}
                        onCheckedChange={() => toggleEntityType(type)}
                      />
                      <Label htmlFor={type} className="capitalize">
                        {type}s ({searchResults?.facets.entityTypes[type] || 0})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date Range */}
              <div>
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={filters.dateRange}
                  onDateChange={(range) => updateFilter('dateRange', range)}
                />
              </div>

              <Separator />

              {/* Value Range */}
              <div>
                <Label>Value Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valueRange.min || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      min: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valueRange.max || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      max: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                </div>
              </div>

              <Separator />

              {/* Sort Options */}
              <div>
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="updated_at">Date Updated</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'asc')}
                  >
                    <SortAsc className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'desc')}
                  >
                    <SortDesc className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <X className="h-5 w-5" />
                  <span>Search error: {error}</span>
                </div>
                <Button 
                  onClick={performSearch} 
                  variant="outline" 
                  className="mt-4"
                >
                  Retry Search
                </Button>
              </CardContent>
            </Card>
          )}

          {searchResults && (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    Search Results ({searchResults.totalCount})
                  </h2>
                  <p className="text-muted-foreground">
                    Found {searchResults.results.length} results
                  </p>
                </div>
                
                {/* Quick Filters */}
                <div className="flex items-center space-x-2">
                  {Object.entries(searchResults.facets.statuses).map(([status, count]) => (
                    <Badge
                      key={status}
                      variant={filters.status.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleFilterArray('status', status)}
                    >
                      {status} ({count})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Results List */}
              <div>
                {searchResults.results.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search query or filters
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  searchResults.results.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Default State */}
          {!searchResults && !loading && !error && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Search</h3>
                <p className="text-muted-foreground mb-4">
                  Search across clients, deals, tasks, and invoices
                </p>
                <p className="text-sm text-muted-foreground">
                  Enter a search query or apply filters to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" <SortAsc className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Filter, X, Calendar, DollarSign, 
  Users, Target, FileText, Clock, ChevronDown,
  SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface SearchFilters {
  query: string;
  entityTypes: string[];
  dateRange: DateRange | undefined;
  status: string[];
  priority: string[];
  valueRange: {
    min: number | null;
    max: number | null;
  };
  assignedTo: string[];
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'client' | 'deal' | 'task' | 'invoice';
  title: string;
  description: string;
  status: string;
  value?: number;
  priority?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  facets: {
    entityTypes: { [key: string]: number };
    statuses: { [key: string]: number };
    priorities: { [key: string]: number };
    assignedUsers: { [key: string]: number };
  };
}

const ENTITY_TYPE_ICONS = {
  client: Users,
  deal: Target,
  task: Clock,
  invoice: FileText,
};

const ENTITY_TYPE_COLORS = {
  client: 'bg-blue-100 text-blue-800 border-blue-300',
  deal: 'bg-green-100 text-green-800 border-green-300',
  task: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  invoice: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function AdvancedSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    entityTypes: ['client', 'deal', 'task', 'invoice'],
    dateRange: undefined,
    status: [],
    priority: [],
    valueRange: { min: null, max: null },
    assignedTo: [],
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Trigger search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery.length >= 2 || hasActiveFilters()) {
      performSearch();
    } else {
      setSearchResults(null);
    }
  }, [debouncedQuery, filters]);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.entityTypes.length < 4 ||
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.valueRange.min !== null ||
      filters.valueRange.max !== null ||
      filters.assignedTo.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange
    );
  }, [filters]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      
      if (debouncedQuery) searchParams.set('q', debouncedQuery);
      if (filters.entityTypes.length > 0) {
        searchParams.set('entityTypes', filters.entityTypes.join(','));
      }
      if (filters.status.length > 0) {
        searchParams.set('status', filters.status.join(','));
      }
      if (filters.priority.length > 0) {
        searchParams.set('priority', filters.priority.join(','));
      }
      if (filters.valueRange.min !== null) {
        searchParams.set('minValue', filters.valueRange.min.toString());
      }
      if (filters.valueRange.max !== null) {
        searchParams.set('maxValue', filters.valueRange.max.toString());
      }
      if (filters.assignedTo.length > 0) {
        searchParams.set('assignedTo', filters.assignedTo.join(','));
      }
      if (filters.tags.length > 0) {
        searchParams.set('tags', filters.tags.join(','));
      }
      if (filters.dateRange?.from) {
        searchParams.set('startDate', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        searchParams.set('endDate', filters.dateRange.to.toISOString());
      }
      searchParams.set('sortBy', filters.sortBy);
      searchParams.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/crm/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      entityTypes: ['client', 'deal', 'task', 'invoice'],
      dateRange: undefined,
      status: [],
      priority: [],
      valueRange: { min: null, max: null },
      assignedTo: [],
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const toggleEntityType = (entityType: string) => {
    const current = filters.entityTypes;
    const updated = current.includes(entityType)
      ? current.filter(type => type !== entityType)
      : [...current, entityType];
    updateFilter('entityTypes', updated);
  };

  const toggleFilterArray = (key: 'status' | 'priority' | 'assignedTo' | 'tags', value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const Icon = ENTITY_TYPE_ICONS[result.type];
    const colorClass = ENTITY_TYPE_COLORS[result.type];

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={colorClass}>
                  <Icon className="h-3 w-3 mr-1" />
                  {result.type}
                </Badge>
                <Badge variant="outline">{result.status}</Badge>
                {result.priority && (
                  <Badge variant={result.priority === 'high' ? 'destructive' : 'secondary'}>
                    {result.priority}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{result.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Created: {new Date(result.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(result.updatedAt).toLocaleDateString()}</span>
                {result.assignedTo && <span>Assigned: {result.assignedTo}</span>}
              </div>

              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {result.value && (
              <div className="text-right">
                <div className="font-bold text-lg">{formatCurrency(result.value)}</div>
                <div className="text-xs text-muted-foreground">Value</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <p className="text-muted-foreground">
            Search and filter across all CRM entities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={performSearch}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Query */}
              <div>
                <Label htmlFor="search-query">Search Query</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search-query"
                    placeholder="Search across all data..."
                    value={filters.query}
                    onChange={(e) => updateFilter('query', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Separator />

              {/* Entity Types */}
              <div>
                <Label>Entity Types</Label>
                <div className="space-y-2 mt-2">
                  {['client', 'deal', 'task', 'invoice'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={filters.entityTypes.includes(type)}
                        onCheckedChange={() => toggleEntityType(type)}
                      />
                      <Label htmlFor={type} className="capitalize">
                        {type}s ({searchResults?.facets.entityTypes[type] || 0})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date Range */}
              <div>
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={filters.dateRange}
                  onDateChange={(range) => updateFilter('dateRange', range)}
                />
              </div>

              <Separator />

              {/* Value Range */}
              <div>
                <Label>Value Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valueRange.min || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      min: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valueRange.max || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      max: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                </div>
              </div>

              <Separator />

              {/* Sort Options */}
              <div>
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="updated_at">Date Updated</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'asc')}
                  >
                    <SortAsc className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'desc')}
                  >
                    <SortDesc className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <X className="h-5 w-5" />
                  <span>Search error: {error}</span>
                </div>
                <Button 
                  onClick={performSearch} 
                  variant="outline" 
                  className="mt-4"
                >
                  Retry Search
                </Button>
              </CardContent>
            </Card>
          )}

          {searchResults && (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    Search Results ({searchResults.totalCount})
                  </h2>
                  <p className="text-muted-foreground">
                    Found {searchResults.results.length} results
                  </p>
                </div>
                
                {/* Quick Filters */}
                <div className="flex items-center space-x-2">
                  {Object.entries(searchResults.facets.statuses).map(([status, count]) => (
                    <Badge
                      key={status}
                      variant={filters.status.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleFilterArray('status', status)}
                    >
                      {status} ({count})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Results List */}
              <div>
                {searchResults.results.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search query or filters
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  searchResults.results.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Default State */}
          {!searchResults && !loading && !error && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Search</h3>
                <p className="text-muted-foreground mb-4">
                  Search across clients, deals, tasks, and invoices
                </p>
                <p className="text-sm text-muted-foreground">
                  Enter a search query or apply filters to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" <SortDesc className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <X className="h-5 w-5" />
                  <span>Search error: {error}</span>
                </div>
                <Button 
                  onClick={performSearch} 
                  variant="outline" 
                  className="mt-4"
                >
                  Retry Search
                </Button>
              </CardContent>
            </Card>
          )}

          {searchResults && (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    Search Results ({searchResults.totalCount})
                  </h2>
                  <p className="text-muted-foreground">
                    Found {searchResults.results.length} results
                  </p>
                </div>
                
                {/* Quick Filters */}
                <div className="flex items-center space-x-2">
                  {Object.entries(searchResults.facets.statuses).map(([status, count]) => (
                    <Badge
                      key={status}
                      variant={filters.status.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => 'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Filter, X, Calendar, DollarSign, 
  Users, Target, FileText, Clock, ChevronDown,
  SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface SearchFilters {
  query: string;
  entityTypes: string[];
  dateRange: DateRange | undefined;
  status: string[];
  priority: string[];
  valueRange: {
    min: number | null;
    max: number | null;
  };
  assignedTo: string[];
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'client' | 'deal' | 'task' | 'invoice';
  title: string;
  description: string;
  status: string;
  value?: number;
  priority?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  facets: {
    entityTypes: { [key: string]: number };
    statuses: { [key: string]: number };
    priorities: { [key: string]: number };
    assignedUsers: { [key: string]: number };
  };
}

const ENTITY_TYPE_ICONS = {
  client: Users,
  deal: Target,
  task: Clock,
  invoice: FileText,
};

const ENTITY_TYPE_COLORS = {
  client: 'bg-blue-100 text-blue-800 border-blue-300',
  deal: 'bg-green-100 text-green-800 border-green-300',
  task: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  invoice: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function AdvancedSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    entityTypes: ['client', 'deal', 'task', 'invoice'],
    dateRange: undefined,
    status: [],
    priority: [],
    valueRange: { min: null, max: null },
    assignedTo: [],
    tags: [],
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.query]);

  // Trigger search when debounced query or filters change
  useEffect(() => {
    if (debouncedQuery.length >= 2 || hasActiveFilters()) {
      performSearch();
    } else {
      setSearchResults(null);
    }
  }, [debouncedQuery, filters]);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.entityTypes.length < 4 ||
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.valueRange.min !== null ||
      filters.valueRange.max !== null ||
      filters.assignedTo.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateRange
    );
  }, [filters]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      
      if (debouncedQuery) searchParams.set('q', debouncedQuery);
      if (filters.entityTypes.length > 0) {
        searchParams.set('entityTypes', filters.entityTypes.join(','));
      }
      if (filters.status.length > 0) {
        searchParams.set('status', filters.status.join(','));
      }
      if (filters.priority.length > 0) {
        searchParams.set('priority', filters.priority.join(','));
      }
      if (filters.valueRange.min !== null) {
        searchParams.set('minValue', filters.valueRange.min.toString());
      }
      if (filters.valueRange.max !== null) {
        searchParams.set('maxValue', filters.valueRange.max.toString());
      }
      if (filters.assignedTo.length > 0) {
        searchParams.set('assignedTo', filters.assignedTo.join(','));
      }
      if (filters.tags.length > 0) {
        searchParams.set('tags', filters.tags.join(','));
      }
      if (filters.dateRange?.from) {
        searchParams.set('startDate', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        searchParams.set('endDate', filters.dateRange.to.toISOString());
      }
      searchParams.set('sortBy', filters.sortBy);
      searchParams.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/crm/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      entityTypes: ['client', 'deal', 'task', 'invoice'],
      dateRange: undefined,
      status: [],
      priority: [],
      valueRange: { min: null, max: null },
      assignedTo: [],
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const toggleEntityType = (entityType: string) => {
    const current = filters.entityTypes;
    const updated = current.includes(entityType)
      ? current.filter(type => type !== entityType)
      : [...current, entityType];
    updateFilter('entityTypes', updated);
  };

  const toggleFilterArray = (key: 'status' | 'priority' | 'assignedTo' | 'tags', value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const Icon = ENTITY_TYPE_ICONS[result.type];
    const colorClass = ENTITY_TYPE_COLORS[result.type];

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={colorClass}>
                  <Icon className="h-3 w-3 mr-1" />
                  {result.type}
                </Badge>
                <Badge variant="outline">{result.status}</Badge>
                {result.priority && (
                  <Badge variant={result.priority === 'high' ? 'destructive' : 'secondary'}>
                    {result.priority}
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{result.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Created: {new Date(result.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(result.updatedAt).toLocaleDateString()}</span>
                {result.assignedTo && <span>Assigned: {result.assignedTo}</span>}
              </div>

              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {result.value && (
              <div className="text-right">
                <div className="font-bold text-lg">{formatCurrency(result.value)}</div>
                <div className="text-xs text-muted-foreground">Value</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <p className="text-muted-foreground">
            Search and filter across all CRM entities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={performSearch}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Query */}
              <div>
                <Label htmlFor="search-query">Search Query</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search-query"
                    placeholder="Search across all data..."
                    value={filters.query}
                    onChange={(e) => updateFilter('query', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Separator />

              {/* Entity Types */}
              <div>
                <Label>Entity Types</Label>
                <div className="space-y-2 mt-2">
                  {['client', 'deal', 'task', 'invoice'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={filters.entityTypes.includes(type)}
                        onCheckedChange={() => toggleEntityType(type)}
                      />
                      <Label htmlFor={type} className="capitalize">
                        {type}s ({searchResults?.facets.entityTypes[type] || 0})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date Range */}
              <div>
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={filters.dateRange}
                  onDateChange={(range) => updateFilter('dateRange', range)}
                />
              </div>

              <Separator />

              {/* Value Range */}
              <div>
                <Label>Value Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valueRange.min || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      min: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valueRange.max || ''}
                    onChange={(e) => updateFilter('valueRange', {
                      ...filters.valueRange,
                      max: e.target.value ? Number(e.target.value) : null
                    })}
                  />
                </div>
              </div>

              <Separator />

              {/* Sort Options */}
              <div>
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="updated_at">Date Updated</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'asc')}
                  >
                    <SortAsc className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('sortOrder', 'desc')}
                  >
                    <SortDesc className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <X className="h-5 w-5" />
                  <span>Search error: {error}</span>
                </div>
                <Button 
                  onClick={performSearch} 
                  variant="outline" 
                  className="mt-4"
                >
                  Retry Search
                </Button>
              </CardContent>
            </Card>
          )}

          {searchResults && (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    Search Results ({searchResults.totalCount})
                  </h2>
                  <p className="text-muted-foreground">
                    Found {searchResults.results.length} results
                  </p>
                </div>
                
                {/* Quick Filters */}
                <div className="flex items-center space-x-2">
                  {Object.entries(searchResults.facets.statuses).map(([status, count]) => (
                    <Badge
                      key={status}
                      variant={filters.status.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleFilterArray('status', status)}
                    >
                      {status} ({count})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Results List */}
              <div>
                {searchResults.results.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search query or filters
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  searchResults.results.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Default State */}
          {!searchResults && !loading && !error && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Search</h3>
                <p className="text-muted-foreground mb-4">
                  Search across clients, deals, tasks, and invoices
                </p>
                <p className="text-sm text-muted-foreground">
                  Enter a search query or apply filters to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" </Badge>
                  ))}
                </div>
              </div>

              {/* Results List */}
              <div>
                {searchResults.results.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search query or filters
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  searchResults.results.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Default State */}
          {!searchResults && !loading && !error && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Search</h3>
                <p className="text-muted-foreground mb-4">
                  Search across clients, deals, tasks, and invoices
                </p>
                <p className="text-sm text-muted-foreground">
                  Enter a search query or apply filters to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
