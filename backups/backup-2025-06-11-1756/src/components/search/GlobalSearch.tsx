'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, Clock, TrendingUp } from 'lucide-react';

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    // Handle search logic here
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
    <div ref={searchRef} className={`relative ${className || ''}`}>
      {/* Search Input */}
      <div className={`relative flex items-center ${isFullScreen ? 'mx-auto max-w-2xl' : ''}`}>
        <Search className="absolute left-3 h-5 w-5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 ${isFullScreen ? 'text-lg py-4' : ''}`}
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
      {showDropdown && query && (
        <div className={`absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 ${isFullScreen ? 'mx-auto max-w-2xl' : ''}`}>
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          )}

          {/* No Results */}
          {!isLoading && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">
                Search for "{query}"
              </p>
              <button
                onClick={() => handleSearch()}
                className="mt-2 text-sm text-blue-500 hover:underline"
              >
                Search â†’
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Press Enter to search</span>
              <span>Press Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
