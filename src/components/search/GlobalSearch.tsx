'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, Clock, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SearchService } from '@/lib/services/search';
import type { SearchSuggestion } from '@/types/search';
import { debounce } from 'lodash';

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  onClose?: () => void;
  isFullScreen?: boolean;
}

export function GlobalSearch({ 
  className, 
  placeholder = 'Search for services, resources, or information...', 
  onClose,
  isFullScreen = false 
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [popularSearches, setPopularSearches] = useState<Array<{ query: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch popular searches on mount
  useEffect(() => {
    SearchService.getPopularSearches(5).then(setPopularSearches);
  }, []);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for suggestions
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await SearchService.getSuggestions(searchQuery);
        setSuggestions(results);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    fetchSuggestions(query);
  }, [query, fetchSuggestions]);

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    // Navigate to search results page
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    
    // Clear and close
    setQuery('');
    setShowDropdown(false);
    if (onClose) onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      if (onClose) onClose();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  return (
    <div ref={searchRef} className={cn('relative', className)}>
      {/* Search Input */}
      <div className={cn(
        'relative flex items-center',
        isFullScreen && 'mx-auto max-w-2xl'
      )}>
        <Search className="absolute left-3 h-5 w-5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setShowDropdown(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-10 py-3 text-sm bg-white border border-gray-200 rounded-xl',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'placeholder:text-gray-400',
            isFullScreen && 'text-lg py-4'
          )}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 p-1 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Clear search"
            title="Clear search"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (query || popularSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50',
              isFullScreen && 'mx-auto max-w-2xl'
            )}
          >
            {/* Loading State */}
            {isLoading && query && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {/* Suggestions */}
            {!isLoading && suggestions.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suggestions
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.term)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <Search className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{suggestion.term}</span>
                    {suggestion.type && (
                      <span className="text-xs text-gray-400 ml-auto">
                        {suggestion.type}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Popular Searches - Show when no query */}
            {!query && popularSearches.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-3 w-3" />
                  Popular Searches
                </div>
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search.query)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{search.query}</span>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {!isLoading && query && suggestions.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500">
                  No suggestions found for &ldquo;{query}&rdquo;
                </p>
                <button
                  onClick={() => handleSearch()}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  Search anyway →
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">Enter</kbd> to search</span>
                <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">Esc</kbd> to close</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
