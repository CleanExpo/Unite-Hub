'use client';

/**
 * Video Demo Grid Component
 *
 * Displays a filterable grid of animation video demos.
 * Integrates with VideoDemoPlayer for playback.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Grid3X3,
  LayoutGrid,
  X,
  Play,
} from 'lucide-react';
import { VideoDemoPlayer, VideoDemo } from './VideoDemoPlayer';
import videoDemosData from '@/data/videoDemos.json';

// ============================================================================
// TYPES
// ============================================================================

interface VideoDemoGridProps {
  initialCategory?: string;
  initialPersona?: string;
  showFilters?: boolean;
  columns?: 2 | 3 | 4;
  maxItems?: number;
  onDemoSelect?: (demo: VideoDemo) => void;
}

type Category = {
  id: string;
  name: string;
  description: string;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VideoDemoGrid({
  initialCategory,
  initialPersona,
  showFilters = true,
  columns = 3,
  maxItems,
  onDemoSelect,
}: VideoDemoGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(initialPersona || null);
  const [selectedDemo, setSelectedDemo] = useState<VideoDemo | null>(null);
  const [gridLayout, setGridLayout] = useState<2 | 3>(columns === 2 ? 2 : 3);

  const demos = videoDemosData.demos as VideoDemo[];
  const categories = videoDemosData.categories as Category[];

  // Get unique personas from demos
  const personas = useMemo(() => {
    const allTags = demos.flatMap((d) => d.personaTags);
    return [...new Set(allTags)].sort();
  }, [demos]);

  // Filter demos
  const filteredDemos = useMemo(() => {
    let result = demos;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(query) ||
          d.description.toLowerCase().includes(query) ||
          d.styleId.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter(
        (d) => d.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Persona filter
    if (selectedPersona) {
      result = result.filter((d) => d.personaTags.includes(selectedPersona));
    }

    // Limit results
    if (maxItems) {
      result = result.slice(0, maxItems);
    }

    return result;
  }, [demos, searchQuery, selectedCategory, selectedPersona, maxItems]);

  const handleDemoClick = (demo: VideoDemo) => {
    setSelectedDemo(demo);
    onDemoSelect?.(demo);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedPersona(null);
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedPersona;

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      {showFilters && (
        <div className="space-y-4">
          {/* Search and Layout Toggle */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search demos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
              <button
                onClick={() => setGridLayout(2)}
                className={`p-2 rounded transition-colors ${
                  gridLayout === 2 ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGridLayout(3)}
                className={`p-2 rounded transition-colors ${
                  gridLayout === 3 ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category and Persona Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Category Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-white/40 flex items-center gap-1">
                <Filter className="w-4 h-4" />
                Category:
              </span>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  !selectedCategory
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === cat.name
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Persona Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-white/40">Audience:</span>
              <button
                onClick={() => setSelectedPersona(null)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  !selectedPersona
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                All
              </button>
              {personas.slice(0, 6).map((persona) => (
                <button
                  key={persona}
                  onClick={() => setSelectedPersona(persona)}
                  className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                    selectedPersona === persona
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {persona}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters and Clear */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/40">
                {filteredDemos.length} demo{filteredDemos.length !== 1 ? 's' : ''} found
              </span>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2 py-1 rounded text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Demo Grid */}
      <div
        className={`grid gap-6 ${
          gridLayout === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        <AnimatePresence mode="popLayout">
          {filteredDemos.map((demo, index) => (
            <motion.div
              key={demo.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <DemoCard demo={demo} onClick={() => handleDemoClick(demo)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredDemos.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <Search className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No demos found</h3>
          <p className="text-white/50 mb-4">Try adjusting your filters or search query</p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Demo Modal */}
      <AnimatePresence>
        {selectedDemo && (
          <DemoModal demo={selectedDemo} onClose={() => setSelectedDemo(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// DEMO CARD COMPONENT
// ============================================================================

function DemoCard({ demo, onClick }: { demo: VideoDemo; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left rounded-xl overflow-hidden bg-slate-900/50 border border-white/10 hover:border-white/20 transition-colors"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-950">
        {demo.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={demo.thumbnailUrl}
            alt={demo.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
          </div>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-6 h-6 text-white ml-0.5" />
          </div>
        </div>

        {/* Status Badge */}
        {demo.status !== 'ready' && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-300">
              Coming Soon
            </span>
          </div>
        )}

        {/* Duration */}
        <div className="absolute bottom-2 right-2">
          <span className="px-2 py-0.5 rounded text-xs bg-black/60 text-white/80">
            {Math.floor(demo.durationSec / 60)}:{(demo.durationSec % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-white mb-1 truncate">{demo.title}</h3>
        <p className="text-sm text-white/50 line-clamp-2">{demo.description}</p>

        <div className="flex items-center gap-2 mt-3">
          <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-300">
            {demo.category}
          </span>
          {demo.personaTags[0] && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-white/40 capitalize">
              {demo.personaTags[0]}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ============================================================================
// DEMO MODAL COMPONENT
// ============================================================================

function DemoModal({ demo, onClose }: { demo: VideoDemo; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Player */}
        <VideoDemoPlayer
          demo={demo}
          autoPlay={true}
          showControls={true}
          showMetadata={true}
        />

        {/* Use Cases */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900/50 border border-white/10">
          <h4 className="text-sm font-medium text-white/60 mb-2">Best For:</h4>
          <div className="flex flex-wrap gap-2">
            {demo.useCases.map((useCase) => (
              <span
                key={useCase}
                className="px-3 py-1 rounded-full text-sm bg-white/5 text-white/70"
              >
                {useCase}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default VideoDemoGrid;
