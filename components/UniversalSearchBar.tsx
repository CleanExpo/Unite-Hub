'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Wrench, HelpCircle, BookOpen, Sparkles, Clock, TrendingUp, Filter, ChevronRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'page' | 'feature' | 'tutorial' | 'help' | 'tool';
  url: string;
  icon: React.ElementType;
  timeToComplete?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  popular?: boolean;
}

// Comprehensive search data
const searchData: SearchResult[] = [
  // Pages
  { id: '1', title: 'Growth Hacking', description: 'Learn advanced growth strategies', category: 'page', url: '/growth-hacking', icon: TrendingUp },
  { id: '2', title: 'Agile Marketing', description: 'Transform your marketing process', category: 'page', url: '/agile-marketing', icon: Zap },
  { id: '3', title: 'Social Advertising', description: 'Master social media campaigns', category: 'page', url: '/social-advertising', icon: TrendingUp },
  { id: '4', title: 'Competitive Analysis', description: 'Outperform your competition', category: 'page', url: '/competitive-analysis', icon: TrendingUp },
  { id: '5', title: 'Client Showcase', description: 'See what others have built', category: 'page', url: '/showcase', icon: Sparkles, popular: true },
  { id: '6', title: 'Product Roadmap', description: 'Vote on upcoming features', category: 'page', url: '/roadmap', icon: TrendingUp },
  
  // Features
  { id: '7', title: 'Website Builder', description: 'Drag-and-drop website creation', category: 'feature', url: '/tools/website-builder', icon: Wrench, timeToComplete: '45 min', popular: true },
  { id: '8', title: 'Email Marketing', description: 'Automated email campaigns', category: 'feature', url: '/tools/email-marketing', icon: Wrench, timeToComplete: '5 min' },
  { id: '9', title: 'SEO Tools', description: 'Optimize for search engines', category: 'feature', url: '/tools/seo', icon: Wrench, timeToComplete: '15 min', popular: true },
  { id: '10', title: 'Analytics Dashboard', description: 'Track your performance', category: 'feature', url: '/tools/analytics', icon: Wrench, timeToComplete: 'Instant' },
  { id: '11', title: 'CRM System', description: 'Manage customer relationships', category: 'feature', url: '/tools/crm', icon: Wrench, timeToComplete: '20 min' },
  
  // Tutorials
  { id: '12', title: 'How to Build a Landing Page', description: 'Step-by-step guide', category: 'tutorial', url: '/tutorials/landing-page', icon: BookOpen, difficulty: 'beginner', timeToComplete: '10 min', popular: true },
  { id: '13', title: 'Setting Up Email Automation', description: 'Create automated sequences', category: 'tutorial', url: '/tutorials/email-automation', icon: BookOpen, difficulty: 'intermediate', timeToComplete: '15 min' },
  { id: '14', title: 'Advanced SEO Strategies', description: 'Rank higher on Google', category: 'tutorial', url: '/tutorials/advanced-seo', icon: BookOpen, difficulty: 'advanced', timeToComplete: '30 min' },
  { id: '15', title: 'Creating Your First Campaign', description: 'Launch marketing campaigns', category: 'tutorial', url: '/tutorials/first-campaign', icon: BookOpen, difficulty: 'beginner', timeToComplete: '20 min' },
  
  // Help Articles
  { id: '16', title: 'Getting Started Guide', description: 'Everything you need to begin', category: 'help', url: '/help/getting-started', icon: HelpCircle, popular: true },
  { id: '17', title: 'Billing & Pricing', description: 'Understand our pricing model', category: 'help', url: '/help/billing', icon: HelpCircle },
  { id: '18', title: 'Account Settings', description: 'Manage your account', category: 'help', url: '/help/account', icon: HelpCircle },
  { id: '19', title: 'Troubleshooting', description: 'Fix common issues', category: 'help', url: '/help/troubleshooting', icon: HelpCircle },
  
  // Tools
  { id: '20', title: 'ROI Calculator', description: 'Calculate your return on investment', category: 'tool', url: '/tools/roi-calculator', icon: Wrench, timeToComplete: 'Instant', popular: true },
  { id: '21', title: 'Competitor Analyzer', description: 'Analyze your competition', category: 'tool', url: '/tools/competitor-analyzer', icon: Wrench, timeToComplete: '2 min' },
  { id: '22', title: 'Keyword Research', description: 'Find profitable keywords', category: 'tool', url: '/tools/keyword-research', icon: Wrench, timeToComplete: '5 min' },
  { id: '23', title: 'Content Generator', description: 'AI-powered content creation', category: 'tool', url: '/tools/content-generator', icon: Wrench, timeToComplete: '1 min', popular: true }
];

interface UniversalSearchBarProps {
  variant?: 'header' | 'hero' | 'inline';
  placeholder?: string;
  autoFocus?: boolean;
  onSearch?: (query: string) => void;
}

export default function UniversalSearchBar({
  variant = 'header',
  placeholder = 'Search for features, tutorials, tools, or help...',
  autoFocus = false,
  onSearch
}: UniversalSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Handle search
  useEffect(() => {
    if (query.length > 0) {
      const filtered = searchData.filter(item => {
        const matchesQuery = 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase());
        
        const matchesCategory = !selectedCategory || item.category === selectedCategory;
        
        return matchesQuery && matchesCategory;
      });
      
      // Sort by relevance and popularity
      filtered.sort((a, b) => {
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        return 0;
      });
      
      setResults(filtered.slice(0, 8));
    } else if (selectedCategory) {
      const filtered = searchData.filter(item => item.category === selectedCategory);
      setResults(filtered.slice(0, 8));
    } else {
      // Show popular items when no query
      setResults(searchData.filter(item => item.popular).slice(0, 5));
    }
  }, [query, selectedCategory]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    
    // Save to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    handleSearch(result.title);
    setIsOpen(false);
  };

  const categories = [
    { id: 'feature', label: 'Features', icon: Wrench, count: searchData.filter(i => i.category === 'feature').length },
    { id: 'tutorial', label: 'Tutorials', icon: BookOpen, count: searchData.filter(i => i.category === 'tutorial').length },
    { id: 'help', label: 'Help', icon: HelpCircle, count: searchData.filter(i => i.category === 'help').length },
    { id: 'tool', label: 'Tools', icon: Wrench, count: searchData.filter(i => i.category === 'tool').length }
  ];

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return '';
    }
  };

  return (
    <div ref={searchRef} className="relative">
      {/* Search Input */}
      <div className={`
        relative
        ${variant === 'hero' ? 'max-w-2xl mx-auto' : ''}
        ${variant === 'inline' ? 'w-full' : 'w-96'}
      `}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`
              w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${variant === 'hero' ? 'text-lg' : 'text-sm'}
            `}
          />
          
          {/* Quick Actions */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Keyboard Shortcut Hint */}
        {!isOpen && variant === 'header' && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
            ⌘K
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
            style={{ minWidth: '500px' }}
          >
            {/* Category Filters */}
            <div className="border-b border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Filter by:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      !selectedCategory ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                        selectedCategory === cat.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <cat.icon className="w-3 h-3" />
                      {cat.label}
                      <span className="text-gray-400">({cat.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto">
              {query === '' && recentSearches.length > 0 && !selectedCategory && (
                <div className="p-3 border-b border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-2">Recent Searches</p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuery(search)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.length > 0 ? (
                <div className="p-2">
                  {results.map((result) => (
                    <Link
                      key={result.id}
                      href={result.url}
                      onClick={() => handleResultClick(result)}
                      className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                    >
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                        ${result.category === 'feature' ? 'bg-blue-100 text-blue-600' :
                          result.category === 'tutorial' ? 'bg-green-100 text-green-600' :
                          result.category === 'help' ? 'bg-purple-100 text-purple-600' :
                          result.category === 'tool' ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-100 text-gray-600'}
                      `}>
                        <result.icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {result.title}
                              {result.popular && (
                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                  Popular
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-600 mt-0.5">{result.description}</p>
                            
                            <div className="flex items-center gap-3 mt-2">
                              {result.timeToComplete && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  {result.timeToComplete}
                                </span>
                              )}
                              {result.difficulty && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(result.difficulty)}`}>
                                  {result.difficulty}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors mt-1" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No results found for "{query}"</p>
                  <p className="text-sm text-gray-400 mt-1">Try searching for something else</p>
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="border-t border-gray-200 p-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="font-mono bg-gray-200 px-1 rounded">↑↓</span>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-mono bg-gray-200 px-1 rounded">Enter</span>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-mono bg-gray-200 px-1 rounded">Esc</span>
                    Close
                  </span>
                </div>
                
                <Link
                  href="/help"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Need help? Visit our help center →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Global keyboard shortcut hook
export function useGlobalSearch() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Trigger search bar focus
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}