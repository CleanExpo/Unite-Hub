'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, FileText, Package, BookOpen, Briefcase, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SearchService } from '@/lib/services/search';
import { GlobalSearch } from './GlobalSearch';
import type { SearchResult, SearchFilters } from '@/types/search';

interface SearchResultsProps {
  initialQuery: string;
  initialType?: string;
  initialPage: number;
}

const RESULTS_PER_PAGE = 10;

const typeOptions = [
  { value: '', label: 'All Results', icon: Search },
  { value: 'page', label: 'Pages', icon: FileText },
  { value: 'service', label: 'Services', icon: Package },
  { value: 'blog', label: 'Blog Posts', icon: BookOpen },
  { value: 'resource', label: 'Resources', icon: Briefcase },
  { value: 'case_study', label: 'Case Studies', icon: Info },
];

export function SearchResults({ initialQuery, initialType, initialPage }: SearchResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]> 'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, FileText, Package, BookOpen, Briefcase, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SearchService } from '@/lib/services/search';
import { GlobalSearch } from './GlobalSearch';
import type { SearchResult, SearchFilters } from '@/types/search';

interface SearchResultsProps {
  initialQuery: string;
  initialType?: string;
  initialPage: number;
}

const RESULTS_PER_PAGE = 10;

const typeOptions = [
  { value: '', label: 'All Results', icon: Search },
  { value: 'page', label: 'Pages', icon: FileText },
  { value: 'service', label: 'Services', icon: Package },
  { value: 'blog', label: 'Blog Posts', icon: BookOpen },
  { value: 'resource', label: 'Resources', icon: Briefcase },
  { value: 'case_study', label: 'Case Studies', icon: Info },
];

export function SearchResults({ initialQuery, initialType, initialPage }: SearchResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedType, setSelectedType] = useState(initialType || '');
  const [queryId, setQueryId] = useState<string>('');

  // Calculate pagination
  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
  const offset = (currentPage - 1) * RESULTS_PER_PAGE;

  // Perform search
  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setIsLoading(true);
    try {
      const { results: searchResults, totalResults: total, queryId: id } = await SearchService.searchContent({
        query,
        type: selectedType || undefined,
        limit: RESULTS_PER_PAGE,
        offset,
      });

      setResults(searchResults);
      setTotalResults(total);
      setQueryId(id);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedType, offset]);

  // Update URL params
  const updateUrlParams = useCallback((newQuery: string, newType: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newType) params.set('type', newType);
    if (newPage > 1) params.set('page', newPage.toString());
    
    router.push(`/search?${params.toString()}`);
  }, [router]);

  // Handle search from embedded search bar
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setCurrentPage(1);
    updateUrlParams(newQuery, selectedType, 1);
  };

  // Handle type filter change
  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    setCurrentPage(1);
    updateUrlParams(query, newType, 1);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams(query, selectedType, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle result click
  const handleResultClick = async (url: string) => {
    if (queryId) {
      await SearchService.recordClickedResult(queryId, url);
    }
  };

  // Perform search on mount and when params change
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Get icon for result type
  const getTypeIcon = (type: string) => {
    const option = typeOptions.find(opt => opt.value === type);
    return option?.icon || FileText;
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-8">
        <GlobalSearch 
          Unite Group="Search again..."
          className="max-w-2xl"
        />
      </div>

      {/* Filters and Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">Filter by type:</span>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleTypeChange(option.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors',
                    selectedType === option.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {totalResults > 0 && (
          <p className="text-sm text-gray-600">
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-6">
          {results.map((result, index) => {
            const Icon = getTypeIcon(result.type);
            return (
              <motion.article
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'p-2 rounded-lg flex-shrink-0',
                    result.type === 'service' && 'bg-blue-50 text-blue-600',
                    result.type === 'blog' && 'bg-green-50 text-green-600',
                    result.type === 'resource' && 'bg-purple-50 text-purple-600',
                    result.type === 'case_study' && 'bg-orange-50 text-orange-600',
                    result.type === 'page' && 'bg-gray-50 text-gray-600'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <Link
                      href={result.url}
                      onClick={() => handleResultClick(result.url)}
                      className="group"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {result.title}
                      </h3>
                    </Link>

                    {result.meta_description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {result.meta_description}
                      </p>
                    )}

                    <div className="mt-2">
                      <p 
                        className="text-sm text-gray-700"
                        dangerouslySetInnerHTML={{ __html: result.highlight }}
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span className="capitalize">{result.type.replace('_', ' ')}</span>
                      {result.category && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{result.category}</span>
                        </>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex gap-1">
                            {result.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 rounded text-gray-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                )}
                aria-label="Previous page"
                title="Previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first, last, current, and adjacent pages
                    return page === 1 ||
                           page === totalPages ||
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center gap-1">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          'min-w-[40px] h-10 px-3 rounded-lg transition-colors',
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        )}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                )}
                aria-label="Next page"
                title="Next page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      ) : query ? (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            We couldn't find any results for &ldquo;{query}&rdquo;. 
            Try searching with different keywords or browse our services and resources.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/services"
              className="text-primary hover:underline"
            >
              Browse Services
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/resources"
              className="text-primary hover:underline"
            >
              View Resources
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Start searching
          </h3>
          <p className="text-gray-600">
            Enter a search term above to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
.Value -replace "'", "'" <string> 'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, FileText, Package, BookOpen, Briefcase, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SearchService } from '@/lib/services/search';
import { GlobalSearch } from './GlobalSearch';
import type { SearchResult, SearchFilters } from '@/types/search';

interface SearchResultsProps {
  initialQuery: string;
  initialType?: string;
  initialPage: number;
}

const RESULTS_PER_PAGE = 10;

const typeOptions = [
  { value: '', label: 'All Results', icon: Search },
  { value: 'page', label: 'Pages', icon: FileText },
  { value: 'service', label: 'Services', icon: Package },
  { value: 'blog', label: 'Blog Posts', icon: BookOpen },
  { value: 'resource', label: 'Resources', icon: Briefcase },
  { value: 'case_study', label: 'Case Studies', icon: Info },
];

export function SearchResults({ initialQuery, initialType, initialPage }: SearchResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedType, setSelectedType] = useState(initialType || '');
  const [queryId, setQueryId] = useState<string>('');

  // Calculate pagination
  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
  const offset = (currentPage - 1) * RESULTS_PER_PAGE;

  // Perform search
  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setIsLoading(true);
    try {
      const { results: searchResults, totalResults: total, queryId: id } = await SearchService.searchContent({
        query,
        type: selectedType || undefined,
        limit: RESULTS_PER_PAGE,
        offset,
      });

      setResults(searchResults);
      setTotalResults(total);
      setQueryId(id);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedType, offset]);

  // Update URL params
  const updateUrlParams = useCallback((newQuery: string, newType: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newType) params.set('type', newType);
    if (newPage > 1) params.set('page', newPage.toString());
    
    router.push(`/search?${params.toString()}`);
  }, [router]);

  // Handle search from embedded search bar
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setCurrentPage(1);
    updateUrlParams(newQuery, selectedType, 1);
  };

  // Handle type filter change
  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    setCurrentPage(1);
    updateUrlParams(query, newType, 1);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams(query, selectedType, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle result click
  const handleResultClick = async (url: string) => {
    if (queryId) {
      await SearchService.recordClickedResult(queryId, url);
    }
  };

  // Perform search on mount and when params change
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Get icon for result type
  const getTypeIcon = (type: string) => {
    const option = typeOptions.find(opt => opt.value === type);
    return option?.icon || FileText;
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-8">
        <GlobalSearch 
          Unite Group="Search again..."
          className="max-w-2xl"
        />
      </div>

      {/* Filters and Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">Filter by type:</span>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleTypeChange(option.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors',
                    selectedType === option.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {totalResults > 0 && (
          <p className="text-sm text-gray-600">
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-6">
          {results.map((result, index) => {
            const Icon = getTypeIcon(result.type);
            return (
              <motion.article
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'p-2 rounded-lg flex-shrink-0',
                    result.type === 'service' && 'bg-blue-50 text-blue-600',
                    result.type === 'blog' && 'bg-green-50 text-green-600',
                    result.type === 'resource' && 'bg-purple-50 text-purple-600',
                    result.type === 'case_study' && 'bg-orange-50 text-orange-600',
                    result.type === 'page' && 'bg-gray-50 text-gray-600'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <Link
                      href={result.url}
                      onClick={() => handleResultClick(result.url)}
                      className="group"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {result.title}
                      </h3>
                    </Link>

                    {result.meta_description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {result.meta_description}
                      </p>
                    )}

                    <div className="mt-2">
                      <p 
                        className="text-sm text-gray-700"
                        dangerouslySetInnerHTML={{ __html: result.highlight }}
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span className="capitalize">{result.type.replace('_', ' ')}</span>
                      {result.category && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{result.category}</span>
                        </>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex gap-1">
                            {result.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 rounded text-gray-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                )}
                aria-label="Previous page"
                title="Previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first, last, current, and adjacent pages
                    return page === 1 ||
                           page === totalPages ||
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center gap-1">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          'min-w-[40px] h-10 px-3 rounded-lg transition-colors',
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        )}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                )}
                aria-label="Next page"
                title="Next page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      ) : query ? (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            We couldn't find any results for &ldquo;{query}&rdquo;. 
            Try searching with different keywords or browse our services and resources.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/services"
              className="text-primary hover:underline"
            >
              Browse Services
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/resources"
              className="text-primary hover:underline"
            >
              View Resources
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Start searching
          </h3>
          <p className="text-gray-600">
            Enter a search term above to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
.Value -replace "'", "'" <div>
      {/* Search Bar */}
      <div className="mb-8">
        <GlobalSearch 
          Unite Group="Search again..."
          className="max-w-2xl"
        />
      </div>

      {/* Filters and Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">Filter by type:</span>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => 'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, FileText, Package, BookOpen, Briefcase, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SearchService } from '@/lib/services/search';
import { GlobalSearch } from './GlobalSearch';
import type { SearchResult, SearchFilters } from '@/types/search';

interface SearchResultsProps {
  initialQuery: string;
  initialType?: string;
  initialPage: number;
}

const RESULTS_PER_PAGE = 10;

const typeOptions = [
  { value: '', label: 'All Results', icon: Search },
  { value: 'page', label: 'Pages', icon: FileText },
  { value: 'service', label: 'Services', icon: Package },
  { value: 'blog', label: 'Blog Posts', icon: BookOpen },
  { value: 'resource', label: 'Resources', icon: Briefcase },
  { value: 'case_study', label: 'Case Studies', icon: Info },
];

export function SearchResults({ initialQuery, initialType, initialPage }: SearchResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedType, setSelectedType] = useState(initialType || '');
  const [queryId, setQueryId] = useState<string>('');

  // Calculate pagination
  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
  const offset = (currentPage - 1) * RESULTS_PER_PAGE;

  // Perform search
  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setIsLoading(true);
    try {
      const { results: searchResults, totalResults: total, queryId: id } = await SearchService.searchContent({
        query,
        type: selectedType || undefined,
        limit: RESULTS_PER_PAGE,
        offset,
      });

      setResults(searchResults);
      setTotalResults(total);
      setQueryId(id);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedType, offset]);

  // Update URL params
  const updateUrlParams = useCallback((newQuery: string, newType: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newType) params.set('type', newType);
    if (newPage > 1) params.set('page', newPage.toString());
    
    router.push(`/search?${params.toString()}`);
  }, [router]);

  // Handle search from embedded search bar
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setCurrentPage(1);
    updateUrlParams(newQuery, selectedType, 1);
  };

  // Handle type filter change
  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    setCurrentPage(1);
    updateUrlParams(query, newType, 1);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams(query, selectedType, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle result click
  const handleResultClick = async (url: string) => {
    if (queryId) {
      await SearchService.recordClickedResult(queryId, url);
    }
  };

  // Perform search on mount and when params change
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Get icon for result type
  const getTypeIcon = (type: string) => {
    const option = typeOptions.find(opt => opt.value === type);
    return option?.icon || FileText;
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-8">
        <GlobalSearch 
          Unite Group="Search again..."
          className="max-w-2xl"
        />
      </div>

      {/* Filters and Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">Filter by type:</span>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleTypeChange(option.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors',
                    selectedType === option.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {totalResults > 0 && (
          <p className="text-sm text-gray-600">
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-6">
          {results.map((result, index) => {
            const Icon = getTypeIcon(result.type);
            return (
              <motion.article
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'p-2 rounded-lg flex-shrink-0',
                    result.type === 'service' && 'bg-blue-50 text-blue-600',
                    result.type === 'blog' && 'bg-green-50 text-green-600',
                    result.type === 'resource' && 'bg-purple-50 text-purple-600',
                    result.type === 'case_study' && 'bg-orange-50 text-orange-600',
                    result.type === 'page' && 'bg-gray-50 text-gray-600'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <Link
                      href={result.url}
                      onClick={() => handleResultClick(result.url)}
                      className="group"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {result.title}
                      </h3>
                    </Link>

                    {result.meta_description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {result.meta_description}
                      </p>
                    )}

                    <div className="mt-2">
                      <p 
                        className="text-sm text-gray-700"
                        dangerouslySetInnerHTML={{ __html: result.highlight }}
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span className="capitalize">{result.type.replace('_', ' ')}</span>
                      {result.category && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{result.category}</span>
                        </>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex gap-1">
                            {result.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 rounded text-gray-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                )}
                aria-label="Previous page"
                title="Previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first, last, current, and adjacent pages
                    return page === 1 ||
                           page === totalPages ||
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center gap-1">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          'min-w-[40px] h-10 px-3 rounded-lg transition-colors',
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        )}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                )}
                aria-label="Next page"
                title="Next page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      ) : query ? (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            We couldn't find any results for &ldquo;{query}&rdquo;. 
            Try searching with different keywords or browse our services and resources.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/services"
              className="text-primary hover:underline"
            >
              Browse Services
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/resources"
              className="text-primary hover:underline"
            >
              View Resources
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Start searching
          </h3>
          <p className="text-gray-600">
            Enter a search term above to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
.Value -replace "'", "'" <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {totalResults > 0 && (
          <p className="text-sm text-gray-600"> 'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, FileText, Package, BookOpen, Briefcase, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SearchService } from '@/lib/services/search';
import { GlobalSearch } from './GlobalSearch';
import type { SearchResult, SearchFilters } from '@/types/search';

interface SearchResultsProps {
  initialQuery: string;
  initialType?: string;
  initialPage: number;
}

const RESULTS_PER_PAGE = 10;

const typeOptions = [
  { value: '', label: 'All Results', icon: Search },
  { value: 'page', label: 'Pages', icon: FileText },
  { value: 'service', label: 'Services', icon: Package },
  { value: 'blog', label: 'Blog Posts', icon: BookOpen },
  { value: 'resource', label: 'Resources', icon: Briefcase },
  { value: 'case_study', label: 'Case Studies', icon: Info },
];

export function SearchResults({ initialQuery, initialType, initialPage }: SearchResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedType, setSelectedType] = useState(initialType || '');
  const [queryId, setQueryId] = useState<string>('');

  // Calculate pagination
  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
  const offset = (currentPage - 1) * RESULTS_PER_PAGE;

  // Perform search
  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setIsLoading(true);
    try {
      const { results: searchResults, totalResults: total, queryId: id } = await SearchService.searchContent({
        query,
        type: selectedType || undefined,
        limit: RESULTS_PER_PAGE,
        offset,
      });

      setResults(searchResults);
      setTotalResults(total);
      setQueryId(id);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedType, offset]);

  // Update URL params
  const updateUrlParams = useCallback((newQuery: string, newType: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newType) params.set('type', newType);
    if (newPage > 1) params.set('page', newPage.toString());
    
    router.push(`/search?${params.toString()}`);
  }, [router]);

  // Handle search from embedded search bar
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setCurrentPage(1);
    updateUrlParams(newQuery, selectedType, 1);
  };

  // Handle type filter change
  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    setCurrentPage(1);
    updateUrlParams(query, newType, 1);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams(query, selectedType, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle result click
  const handleResultClick = async (url: string) => {
    if (queryId) {
      await SearchService.recordClickedResult(queryId, url);
    }
  };

  // Perform search on mount and when params change
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Get icon for result type
  const getTypeIcon = (type: string) => {
    const option = typeOptions.find(opt => opt.value === type);
    return option?.icon || FileText;
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-8">
        <GlobalSearch 
          Unite Group="Search again..."
          className="max-w-2xl"
        />
      </div>

      {/* Filters and Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">Filter by type:</span>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleTypeChange(option.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors',
                    selectedType === option.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {totalResults > 0 && (
          <p className="text-sm text-gray-600">
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-6">
          {results.map((result, index) => {
            const Icon = getTypeIcon(result.type);
            return (
              <motion.article
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'p-2 rounded-lg flex-shrink-0',
                    result.type === 'service' && 'bg-blue-50 text-blue-600',
                    result.type === 'blog' && 'bg-green-50 text-green-600',
                    result.type === 'resource' && 'bg-purple-50 text-purple-600',
                    result.type === 'case_study' && 'bg-orange-50 text-orange-600',
                    result.type === 'page' && 'bg-gray-50 text-gray-600'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <Link
                      href={result.url}
                      onClick={() => handleResultClick(result.url)}
                      className="group"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {result.title}
                      </h3>
                    </Link>

                    {result.meta_description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {result.meta_description}
                      </p>
                    )}

                    <div className="mt-2">
                      <p 
                        className="text-sm text-gray-700"
                        dangerouslySetInnerHTML={{ __html: result.highlight }}
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span className="capitalize">{result.type.replace('_', ' ')}</span>
                      {result.category && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{result.category}</span>
                        </>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex gap-1">
                            {result.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 rounded text-gray-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                )}
                aria-label="Previous page"
                title="Previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first, last, current, and adjacent pages
                    return page === 1 ||
                           page === totalPages ||
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center gap-1">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          'min-w-[40px] h-10 px-3 rounded-lg transition-colors',
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        )}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                )}
                aria-label="Next page"
                title="Next page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      ) : query ? (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            We couldn't find any results for &ldquo;{query}&rdquo;. 
            Try searching with different keywords or browse our services and resources.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/services"
              className="text-primary hover:underline"
            >
              Browse Services
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/resources"
              className="text-primary hover:underline"
            >
              View Resources
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Start searching
          </h3>
          <p className="text-gray-600">
            Enter a search term above to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
.Value -replace "'", "'" </p>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-6">
          {results.map((result, index) => {
            const Icon = getTypeIcon(result.type);
            return (
              <motion.article
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'p-2 rounded-lg flex-shrink-0',
                    result.type === 'service' && 'bg-blue-50 text-blue-600',
                    result.type === 'blog' && 'bg-green-50 text-green-600',
                    result.type === 'resource' && 'bg-purple-50 text-purple-600',
                    result.type === 'case_study' && 'bg-orange-50 text-orange-600',
                    result.type === 'page' && 'bg-gray-50 text-gray-600'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <Link
                      href={result.url}
                      onClick={() => handleResultClick(result.url)}
                      className="group"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {result.title}
                      </h3>
                    </Link>

                    {result.meta_description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {result.meta_description}
                      </p>
                    )}

                    <div className="mt-2">
                      <p 
                        className="text-sm text-gray-700"
                        dangerouslySetInnerHTML={{ __html: result.highlight }}
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span className="capitalize"> 'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, FileText, Package, BookOpen, Briefcase, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SearchService } from '@/lib/services/search';
import { GlobalSearch } from './GlobalSearch';
import type { SearchResult, SearchFilters } from '@/types/search';

interface SearchResultsProps {
  initialQuery: string;
  initialType?: string;
  initialPage: number;
}

const RESULTS_PER_PAGE = 10;

const typeOptions = [
  { value: '', label: 'All Results', icon: Search },
  { value: 'page', label: 'Pages', icon: FileText },
  { value: 'service', label: 'Services', icon: Package },
  { value: 'blog', label: 'Blog Posts', icon: BookOpen },
  { value: 'resource', label: 'Resources', icon: Briefcase },
  { value: 'case_study', label: 'Case Studies', icon: Info },
];

export function SearchResults({ initialQuery, initialType, initialPage }: SearchResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedType, setSelectedType] = useState(initialType || '');
  const [queryId, setQueryId] = useState<string>('');

  // Calculate pagination
  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
  const offset = (currentPage - 1) * RESULTS_PER_PAGE;

  // Perform search
  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setIsLoading(true);
    try {
      const { results: searchResults, totalResults: total, queryId: id } = await SearchService.searchContent({
        query,
        type: selectedType || undefined,
        limit: RESULTS_PER_PAGE,
        offset,
      });

      setResults(searchResults);
      setTotalResults(total);
      setQueryId(id);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedType, offset]);

  // Update URL params
  const updateUrlParams = useCallback((newQuery: string, newType: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newType) params.set('type', newType);
    if (newPage > 1) params.set('page', newPage.toString());
    
    router.push(`/search?${params.toString()}`);
  }, [router]);

  // Handle search from embedded search bar
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setCurrentPage(1);
    updateUrlParams(newQuery, selectedType, 1);
  };

  // Handle type filter change
  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    setCurrentPage(1);
    updateUrlParams(query, newType, 1);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams(query, selectedType, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle result click
  const handleResultClick = async (url: string) => {
    if (queryId) {
      await SearchService.recordClickedResult(queryId, url);
    }
  };

  // Perform search on mount and when params change
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Get icon for result type
  const getTypeIcon = (type: string) => {
    const option = typeOptions.find(opt => opt.value === type);
    return option?.icon || FileText;
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-8">
        <GlobalSearch 
          Unite Group="Search again..."
          className="max-w-2xl"
        />
      </div>

      {/* Filters and Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">Filter by type:</span>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleTypeChange(option.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors',
                    selectedType === option.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {totalResults > 0 && (
          <p className="text-sm text-gray-600">
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-6">
          {results.map((result, index) => {
            const Icon = getTypeIcon(result.type);
            return (
              <motion.article
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'p-2 rounded-lg flex-shrink-0',
                    result.type === 'service' && 'bg-blue-50 text-blue-600',
                    result.type === 'blog' && 'bg-green-50 text-green-600',
                    result.type === 'resource' && 'bg-purple-50 text-purple-600',
                    result.type === 'case_study' && 'bg-orange-50 text-orange-600',
                    result.type === 'page' && 'bg-gray-50 text-gray-600'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <Link
                      href={result.url}
                      onClick={() => handleResultClick(result.url)}
                      className="group"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {result.title}
                      </h3>
                    </Link>

                    {result.meta_description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {result.meta_description}
                      </p>
                    )}

                    <div className="mt-2">
                      <p 
                        className="text-sm text-gray-700"
                        dangerouslySetInnerHTML={{ __html: result.highlight }}
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span className="capitalize">{result.type.replace('_', ' ')}</span>
                      {result.category && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{result.category}</span>
                        </>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex gap-1">
                            {result.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 rounded text-gray-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                )}
                aria-label="Previous page"
                title="Previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first, last, current, and adjacent pages
                    return page === 1 ||
                           page === totalPages ||
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center gap-1">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          'min-w-[40px] h-10 px-3 rounded-lg transition-colors',
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        )}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                )}
                aria-label="Next page"
                title="Next page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      ) : query ? (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            We couldn't find any results for &ldquo;{query}&rdquo;. 
            Try searching with different keywords or browse our services and resources.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/services"
              className="text-primary hover:underline"
            >
              Browse Services
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/resources"
              className="text-primary hover:underline"
            >
              View Resources
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Start searching
          </h3>
          <p className="text-gray-600">
            Enter a search term above to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
.Value -replace "'", "'" </span>
                      {result.category && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{result.category}</span>
                        </>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex gap-1">
                            {result.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 rounded text-gray-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => 'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, FileText, Package, BookOpen, Briefcase, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SearchService } from '@/lib/services/search';
import { GlobalSearch } from './GlobalSearch';
import type { SearchResult, SearchFilters } from '@/types/search';

interface SearchResultsProps {
  initialQuery: string;
  initialType?: string;
  initialPage: number;
}

const RESULTS_PER_PAGE = 10;

const typeOptions = [
  { value: '', label: 'All Results', icon: Search },
  { value: 'page', label: 'Pages', icon: FileText },
  { value: 'service', label: 'Services', icon: Package },
  { value: 'blog', label: 'Blog Posts', icon: BookOpen },
  { value: 'resource', label: 'Resources', icon: Briefcase },
  { value: 'case_study', label: 'Case Studies', icon: Info },
];

export function SearchResults({ initialQuery, initialType, initialPage }: SearchResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedType, setSelectedType] = useState(initialType || '');
  const [queryId, setQueryId] = useState<string>('');

  // Calculate pagination
  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
  const offset = (currentPage - 1) * RESULTS_PER_PAGE;

  // Perform search
  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setIsLoading(true);
    try {
      const { results: searchResults, totalResults: total, queryId: id } = await SearchService.searchContent({
        query,
        type: selectedType || undefined,
        limit: RESULTS_PER_PAGE,
        offset,
      });

      setResults(searchResults);
      setTotalResults(total);
      setQueryId(id);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedType, offset]);

  // Update URL params
  const updateUrlParams = useCallback((newQuery: string, newType: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newType) params.set('type', newType);
    if (newPage > 1) params.set('page', newPage.toString());
    
    router.push(`/search?${params.toString()}`);
  }, [router]);

  // Handle search from embedded search bar
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setCurrentPage(1);
    updateUrlParams(newQuery, selectedType, 1);
  };

  // Handle type filter change
  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    setCurrentPage(1);
    updateUrlParams(query, newType, 1);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams(query, selectedType, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle result click
  const handleResultClick = async (url: string) => {
    if (queryId) {
      await SearchService.recordClickedResult(queryId, url);
    }
  };

  // Perform search on mount and when params change
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Get icon for result type
  const getTypeIcon = (type: string) => {
    const option = typeOptions.find(opt => opt.value === type);
    return option?.icon || FileText;
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-8">
        <GlobalSearch 
          Unite Group="Search again..."
          className="max-w-2xl"
        />
      </div>

      {/* Filters and Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">Filter by type:</span>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleTypeChange(option.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors',
                    selectedType === option.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {totalResults > 0 && (
          <p className="text-sm text-gray-600">
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-6">
          {results.map((result, index) => {
            const Icon = getTypeIcon(result.type);
            return (
              <motion.article
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'p-2 rounded-lg flex-shrink-0',
                    result.type === 'service' && 'bg-blue-50 text-blue-600',
                    result.type === 'blog' && 'bg-green-50 text-green-600',
                    result.type === 'resource' && 'bg-purple-50 text-purple-600',
                    result.type === 'case_study' && 'bg-orange-50 text-orange-600',
                    result.type === 'page' && 'bg-gray-50 text-gray-600'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <Link
                      href={result.url}
                      onClick={() => handleResultClick(result.url)}
                      className="group"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {result.title}
                      </h3>
                    </Link>

                    {result.meta_description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {result.meta_description}
                      </p>
                    )}

                    <div className="mt-2">
                      <p 
                        className="text-sm text-gray-700"
                        dangerouslySetInnerHTML={{ __html: result.highlight }}
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span className="capitalize">{result.type.replace('_', ' ')}</span>
                      {result.category && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{result.category}</span>
                        </>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex gap-1">
                            {result.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 rounded text-gray-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                )}
                aria-label="Previous page"
                title="Previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first, last, current, and adjacent pages
                    return page === 1 ||
                           page === totalPages ||
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center gap-1">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          'min-w-[40px] h-10 px-3 rounded-lg transition-colors',
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        )}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                )}
                aria-label="Next page"
                title="Next page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      ) : query ? (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            We couldn't find any results for &ldquo;{query}&rdquo;. 
            Try searching with different keywords or browse our services and resources.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/services"
              className="text-primary hover:underline"
            >
              Browse Services
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/resources"
              className="text-primary hover:underline"
            >
              View Resources
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Start searching
          </h3>
          <p className="text-gray-600">
            Enter a search term above to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
.Value -replace "'", "'" <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first, last, current, and adjacent pages
                    return page === 1 ||
                           page === totalPages ||
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center gap-1">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => 'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, FileText, Package, BookOpen, Briefcase, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SearchService } from '@/lib/services/search';
import { GlobalSearch } from './GlobalSearch';
import type { SearchResult, SearchFilters } from '@/types/search';

interface SearchResultsProps {
  initialQuery: string;
  initialType?: string;
  initialPage: number;
}

const RESULTS_PER_PAGE = 10;

const typeOptions = [
  { value: '', label: 'All Results', icon: Search },
  { value: 'page', label: 'Pages', icon: FileText },
  { value: 'service', label: 'Services', icon: Package },
  { value: 'blog', label: 'Blog Posts', icon: BookOpen },
  { value: 'resource', label: 'Resources', icon: Briefcase },
  { value: 'case_study', label: 'Case Studies', icon: Info },
];

export function SearchResults({ initialQuery, initialType, initialPage }: SearchResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedType, setSelectedType] = useState(initialType || '');
  const [queryId, setQueryId] = useState<string>('');

  // Calculate pagination
  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
  const offset = (currentPage - 1) * RESULTS_PER_PAGE;

  // Perform search
  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setIsLoading(true);
    try {
      const { results: searchResults, totalResults: total, queryId: id } = await SearchService.searchContent({
        query,
        type: selectedType || undefined,
        limit: RESULTS_PER_PAGE,
        offset,
      });

      setResults(searchResults);
      setTotalResults(total);
      setQueryId(id);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedType, offset]);

  // Update URL params
  const updateUrlParams = useCallback((newQuery: string, newType: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newType) params.set('type', newType);
    if (newPage > 1) params.set('page', newPage.toString());
    
    router.push(`/search?${params.toString()}`);
  }, [router]);

  // Handle search from embedded search bar
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setCurrentPage(1);
    updateUrlParams(newQuery, selectedType, 1);
  };

  // Handle type filter change
  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    setCurrentPage(1);
    updateUrlParams(query, newType, 1);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams(query, selectedType, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle result click
  const handleResultClick = async (url: string) => {
    if (queryId) {
      await SearchService.recordClickedResult(queryId, url);
    }
  };

  // Perform search on mount and when params change
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Get icon for result type
  const getTypeIcon = (type: string) => {
    const option = typeOptions.find(opt => opt.value === type);
    return option?.icon || FileText;
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-8">
        <GlobalSearch 
          Unite Group="Search again..."
          className="max-w-2xl"
        />
      </div>

      {/* Filters and Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">Filter by type:</span>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleTypeChange(option.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors',
                    selectedType === option.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {totalResults > 0 && (
          <p className="text-sm text-gray-600">
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-6">
          {results.map((result, index) => {
            const Icon = getTypeIcon(result.type);
            return (
              <motion.article
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'p-2 rounded-lg flex-shrink-0',
                    result.type === 'service' && 'bg-blue-50 text-blue-600',
                    result.type === 'blog' && 'bg-green-50 text-green-600',
                    result.type === 'resource' && 'bg-purple-50 text-purple-600',
                    result.type === 'case_study' && 'bg-orange-50 text-orange-600',
                    result.type === 'page' && 'bg-gray-50 text-gray-600'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <Link
                      href={result.url}
                      onClick={() => handleResultClick(result.url)}
                      className="group"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {result.title}
                      </h3>
                    </Link>

                    {result.meta_description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {result.meta_description}
                      </p>
                    )}

                    <div className="mt-2">
                      <p 
                        className="text-sm text-gray-700"
                        dangerouslySetInnerHTML={{ __html: result.highlight }}
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span className="capitalize">{result.type.replace('_', ' ')}</span>
                      {result.category && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{result.category}</span>
                        </>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex gap-1">
                            {result.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 rounded text-gray-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                )}
                aria-label="Previous page"
                title="Previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first, last, current, and adjacent pages
                    return page === 1 ||
                           page === totalPages ||
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center gap-1">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          'min-w-[40px] h-10 px-3 rounded-lg transition-colors',
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        )}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                )}
                aria-label="Next page"
                title="Next page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      ) : query ? (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            We couldn't find any results for &ldquo;{query}&rdquo;. 
            Try searching with different keywords or browse our services and resources.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/services"
              className="text-primary hover:underline"
            >
              Browse Services
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/resources"
              className="text-primary hover:underline"
            >
              View Resources
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Start searching
          </h3>
          <p className="text-gray-600">
            Enter a search term above to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
.Value -replace "'", "'" </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => 'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, FileText, Package, BookOpen, Briefcase, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SearchService } from '@/lib/services/search';
import { GlobalSearch } from './GlobalSearch';
import type { SearchResult, SearchFilters } from '@/types/search';

interface SearchResultsProps {
  initialQuery: string;
  initialType?: string;
  initialPage: number;
}

const RESULTS_PER_PAGE = 10;

const typeOptions = [
  { value: '', label: 'All Results', icon: Search },
  { value: 'page', label: 'Pages', icon: FileText },
  { value: 'service', label: 'Services', icon: Package },
  { value: 'blog', label: 'Blog Posts', icon: BookOpen },
  { value: 'resource', label: 'Resources', icon: Briefcase },
  { value: 'case_study', label: 'Case Studies', icon: Info },
];

export function SearchResults({ initialQuery, initialType, initialPage }: SearchResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedType, setSelectedType] = useState(initialType || '');
  const [queryId, setQueryId] = useState<string>('');

  // Calculate pagination
  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
  const offset = (currentPage - 1) * RESULTS_PER_PAGE;

  // Perform search
  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setIsLoading(true);
    try {
      const { results: searchResults, totalResults: total, queryId: id } = await SearchService.searchContent({
        query,
        type: selectedType || undefined,
        limit: RESULTS_PER_PAGE,
        offset,
      });

      setResults(searchResults);
      setTotalResults(total);
      setQueryId(id);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedType, offset]);

  // Update URL params
  const updateUrlParams = useCallback((newQuery: string, newType: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newType) params.set('type', newType);
    if (newPage > 1) params.set('page', newPage.toString());
    
    router.push(`/search?${params.toString()}`);
  }, [router]);

  // Handle search from embedded search bar
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setCurrentPage(1);
    updateUrlParams(newQuery, selectedType, 1);
  };

  // Handle type filter change
  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    setCurrentPage(1);
    updateUrlParams(query, newType, 1);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams(query, selectedType, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle result click
  const handleResultClick = async (url: string) => {
    if (queryId) {
      await SearchService.recordClickedResult(queryId, url);
    }
  };

  // Perform search on mount and when params change
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Get icon for result type
  const getTypeIcon = (type: string) => {
    const option = typeOptions.find(opt => opt.value === type);
    return option?.icon || FileText;
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-8">
        <GlobalSearch 
          Unite Group="Search again..."
          className="max-w-2xl"
        />
      </div>

      {/* Filters and Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">Filter by type:</span>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleTypeChange(option.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-colors',
                    selectedType === option.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {totalResults > 0 && (
          <p className="text-sm text-gray-600">
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-6">
          {results.map((result, index) => {
            const Icon = getTypeIcon(result.type);
            return (
              <motion.article
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'p-2 rounded-lg flex-shrink-0',
                    result.type === 'service' && 'bg-blue-50 text-blue-600',
                    result.type === 'blog' && 'bg-green-50 text-green-600',
                    result.type === 'resource' && 'bg-purple-50 text-purple-600',
                    result.type === 'case_study' && 'bg-orange-50 text-orange-600',
                    result.type === 'page' && 'bg-gray-50 text-gray-600'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <Link
                      href={result.url}
                      onClick={() => handleResultClick(result.url)}
                      className="group"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {result.title}
                      </h3>
                    </Link>

                    {result.meta_description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {result.meta_description}
                      </p>
                    )}

                    <div className="mt-2">
                      <p 
                        className="text-sm text-gray-700"
                        dangerouslySetInnerHTML={{ __html: result.highlight }}
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span className="capitalize">{result.type.replace('_', ' ')}</span>
                      {result.category && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{result.category}</span>
                        </>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex gap-1">
                            {result.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 rounded text-gray-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                )}
                aria-label="Previous page"
                title="Previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first, last, current, and adjacent pages
                    return page === 1 ||
                           page === totalPages ||
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center gap-1">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          'min-w-[40px] h-10 px-3 rounded-lg transition-colors',
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        )}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                )}
                aria-label="Next page"
                title="Next page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      ) : query ? (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            We couldn't find any results for &ldquo;{query}&rdquo;. 
            Try searching with different keywords or browse our services and resources.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/services"
              className="text-primary hover:underline"
            >
              Browse Services
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/resources"
              className="text-primary hover:underline"
            >
              View Resources
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Start searching
          </h3>
          <p className="text-gray-600">
            Enter a search term above to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
.Value -replace "'", "'" <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      ) : query ? (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            We couldn't find any results for &ldquo;{query}&rdquo;. 
            Try searching with different keywords or browse our services and resources.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/services"
              className="text-primary hover:underline"
            >
              Browse Services
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/resources"
              className="text-primary hover:underline"
            >
              View Resources
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Search className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Start searching
          </h3>
          <p className="text-gray-600">
            Enter a search term above to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
