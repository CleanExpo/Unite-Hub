"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

/* ----------------------------------------
   Types
   ---------------------------------------- */

export interface SearchResult {
  id: string;
  title: string;
  type?: string;
  snippet: string;
  relevance: number;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  limit: number;
  offset: number;
}

interface SearchFilters {
  type?: string;
  created_after?: string;
  created_before?: string;
}

type SearchState = "idle" | "loading" | "results" | "empty" | "error";

export interface SearchInterfaceProps {
  onResultsChange?: (results: SearchResult[]) => void;
  className?: string;
}

/* ----------------------------------------
   Component
   ---------------------------------------- */

export function SearchInterface({
  onResultsChange,
  className,
}: SearchInterfaceProps) {
  // Search input and state
  const [query, setQuery] = useState<string>("");
  const [state, setState] = useState<SearchState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<SearchFilters>({});

  // Results
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState<number>(0);

  // Pagination
  const [limit, setLimit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);

  // Document types (can be expanded based on API)
  const documentTypes = [
    { value: "contract", label: "Contract" },
    { value: "policy", label: "Policy" },
    { value: "agreement", label: "Agreement" },
    { value: "document", label: "Document" },
  ];

  /**
   * Perform search
   */
  const handleSearch = useCallback(
    async (newOffset: number = 0) => {
      if (!query.trim()) {
        setState("idle");
        setResults([]);
        setTotal(0);
        return;
      }

      setState("loading");
      setError(null);
      setOffset(newOffset);

      try {
        const searchParams = {
          query: query.trim(),
          limit,
          offset: newOffset,
          ...(filters.type && { type: filters.type }),
        };

        const response = await apiClient.post<SearchResponse>(
          "/api/search",
          searchParams
        );

        setResults(response.results);
        setTotal(response.total);

        if (response.results.length === 0) {
          setState("empty");
        } else {
          setState("results");
          onResultsChange?.(response.results);
        }
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "An error occurred while searching. Please try again.";
        setError(message);
        setState("error");
        setResults([]);
      }
    },
    [query, limit, filters, onResultsChange]
  );

  /**
   * Clear all filters
   */
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setQuery("");
    setState("idle");
    setResults([]);
    setTotal(0);
    setOffset(0);
  }, []);

  /**
   * Clear search input
   */
  const handleClearSearch = useCallback(() => {
    setQuery("");
    setState("idle");
    setResults([]);
    setTotal(0);
    setOffset(0);
  }, []);

  /**
   * Navigate to previous page
   */
  const handlePrevious = useCallback(() => {
    const newOffset = Math.max(0, offset - limit);
    handleSearch(newOffset);
  }, [offset, limit, handleSearch]);

  /**
   * Navigate to next page
   */
  const handleNext = useCallback(() => {
    if (offset + limit < total) {
      handleSearch(offset + limit);
    }
  }, [offset, limit, total, handleSearch]);

  /**
   * Calculate current page
   */
  const currentPage = offset / limit + 1;
  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Search Input Section */}
      <Card>
        <CardHeader>
          <CardDescription>Search for documents in the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative flex gap-2">
            <Input
              placeholder="Search documents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(0);
                }
              }}
              className="flex-1"
              aria-label="Search query"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={() => handleSearch(0)}
              disabled={state === "loading" || !query.trim()}
              loading={state === "loading"}
              loadingText="Searching..."
            >
              Search
            </Button>
          </div>

          {/* Filter Controls */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground">
              Filters
            </Label>
            <div className="flex flex-wrap gap-3">
              {/* Document Type Filter */}
              <div className="flex-1 min-w-[200px]">
                <Select
                  value={filters.type || ""}
                  onValueChange={(value) => {
                    setFilters((prev) => ({
                      ...prev,
                      type: value || undefined,
                    }));
                  }}
                >
                  <SelectTrigger className="w-full" aria-label="Filter by document type">
                    <SelectValue placeholder="Document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  aria-label="Clear all filters"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {filters.type && (
                  <Badge variant="secondary" className="cursor-pointer">
                    Type: {filters.type}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, type: undefined }))
                      }
                      className="ml-1 hover:opacity-70"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {state === "idle" && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Enter a search query to find documents
            </p>
          </CardContent>
        </Card>
      )}

      {state === "loading" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <p className="text-sm text-muted-foreground">Searching...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {state === "error" && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {state === "empty" && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No documents found matching your search. Try different keywords.
            </p>
          </CardContent>
        </Card>
      )}

      {state === "results" && results.length > 0 && (
        <div className="space-y-4">
          {/* Results Info */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {offset + 1} to {Math.min(offset + limit, total)} of{" "}
              {total} results
            </p>

            {/* Results Per Page Selector */}
            <Select value={limit.toString()} onValueChange={(value) => {
              setLimit(parseInt(value));
              setOffset(0);
            }}>
              <SelectTrigger className="w-32" aria-label="Results per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {results.map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {/* Title and Type */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold line-clamp-2">
                          {result.title}
                        </h3>
                      </div>
                      {result.type && (
                        <Badge variant="outline" className="shrink-0">
                          {result.type}
                        </Badge>
                      )}
                    </div>

                    {/* Snippet */}
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {result.snippet}
                    </p>

                    {/* Relevance Score */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${Math.round(result.relevance * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {Math.round(result.relevance * 100)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={offset === 0}
                aria-label="Previous page"
              >
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={offset + limit >= total}
                aria-label="Next page"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

