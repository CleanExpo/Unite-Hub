'use client';

/**
 * Animation Inspiration Library
 *
 * A full visual catalogue of animation styles.
 * Clients can browse, preview, and reference animations by name.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Search,
  Filter,
  Play,
  Copy,
  Check,
  ChevronRight,
  Zap,
  Palette,
  MousePointer2,
  Layers,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { animationStyles, stylesByMood } from '@/lib/visual/animationStyles';
import animationLibrary from '@/data/animationStyleLibrary.json';
import { FlashlightCursor } from '@/components/visual/FlashlightCursor';

// ============================================================================
// TYPES
// ============================================================================

interface StylePreview {
  id: string;
  name: string;
  category: string;
  description: string;
  mood: string;
  intensity: string;
  bestFor: string[];
  industries: string[];
  previewDescription: string;
}

// ============================================================================
// ANIMATION PREVIEW COMPONENT
// ============================================================================

function AnimationPreviewBox({ styleId, mood }: { styleId: string; mood: string }) {
  const moodColors: Record<string, string> = {
    professional: 'from-blue-500/20 to-cyan-500/20',
    playful: 'from-amber-500/20 to-orange-500/20',
    calm: 'from-emerald-500/20 to-teal-500/20',
    bold: 'from-red-500/20 to-rose-500/20',
    futuristic: 'from-violet-500/20 to-purple-500/20',
    immersive: 'from-pink-500/20 to-fuchsia-500/20',
    elegant: 'from-indigo-500/20 to-blue-500/20',
    dynamic: 'from-orange-500/20 to-amber-500/20',
    modern: 'from-cyan-500/20 to-sky-500/20',
    cinematic: 'from-purple-500/20 to-violet-500/20',
  };

  return (
    <div className={`
      aspect-video rounded-xl overflow-hidden relative
      bg-gradient-to-br ${moodColors[mood] || 'from-gray-500/20 to-slate-500/20'}
    `}>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0.5 }}
        animate={{
          opacity: [0.5, 1, 0.5],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="absolute bottom-3 left-3 right-3">
        <span className="text-xs text-white/60">Live Preview</span>
      </div>
    </div>
  );
}

// ============================================================================
// STYLE CARD COMPONENT
// ============================================================================

function StyleCard({
  style,
  onSelect,
  isSelected,
}: {
  style: StylePreview;
  onSelect: (style: StylePreview) => void;
  isSelected: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copyName = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(style.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layoutId={`card-${style.id}`}
      onClick={() => onSelect(style)}
      whileHover={{ y: -4 }}
      className={`
        group cursor-pointer rounded-2xl overflow-hidden
        bg-slate-900/50 border transition-all duration-300
        ${isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/20'
          : 'border-white/10 hover:border-white/20'
        }
      `}
    >
      {/* Preview */}
      <AnimationPreviewBox styleId={style.id} mood={style.mood} />

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
            {style.name}
          </h3>
          <button
            onClick={copyName}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Copy style name"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-white/50" />
            )}
          </button>
        </div>

        <p className="text-sm text-white/60 line-clamp-2 mb-3">
          {style.description}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`
            px-2 py-0.5 rounded-full text-xs capitalize
            bg-indigo-500/20 text-indigo-300
          `}>
            {style.mood}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/50">
            {style.intensity}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// DETAIL MODAL
// ============================================================================

function StyleDetailModal({
  style,
  onClose,
}: {
  style: StylePreview;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyName = async () => {
    await navigator.clipboard.writeText(style.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        layoutId={`card-${style.id}`}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 rounded-3xl overflow-hidden max-w-2xl w-full border border-white/10"
      >
        {/* Large Preview */}
        <div className="aspect-video relative">
          <AnimationPreviewBox styleId={style.id} mood={style.mood} />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{style.name}</h2>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-300 capitalize">
                  {style.mood}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/50">
                  {style.category}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/50">
                  {style.intensity}
                </span>
              </div>
            </div>
            <button
              onClick={copyName}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-colors text-white"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Name</span>
                </>
              )}
            </button>
          </div>

          <p className="text-white/70 mb-6">{style.description}</p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-2">
                Best For
              </h4>
              <ul className="space-y-1">
                {style.bestFor.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                    <ChevronRight className="w-3 h-3 text-indigo-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-2">
                Industries
              </h4>
              <div className="flex flex-wrap gap-2">
                {style.industries.map((industry, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-lg text-xs bg-white/5 text-white/60"
                  >
                    {industry}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-2">
              How to Request
            </h4>
            <p className="text-sm text-white/60">
              Simply tell us: &ldquo;I want the <span className="text-indigo-300 font-medium">{style.name}</span> effect&rdquo;
              and we&apos;ll implement it for your website.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function InspirationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StylePreview | null>(null);
  const [showFlashlight, setShowFlashlight] = useState(true);

  // Get styles from JSON
  const styles = animationLibrary.styles as StylePreview[];
  const moods = animationLibrary.moods;
  const categories = animationLibrary.categories;

  // Filter styles
  const filteredStyles = useMemo(() => {
    return styles.filter(style => {
      const matchesSearch = !searchQuery ||
        style.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        style.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMood = !selectedMood || style.mood === selectedMood;
      const matchesCategory = !selectedCategory || style.category === selectedCategory;

      return matchesSearch && matchesMood && matchesCategory;
    });
  }, [styles, searchQuery, selectedMood, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Flashlight Effect */}
      {showFlashlight && <FlashlightCursor variant="gradient" />}

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-indigo-300">Animation Inspiration Library</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Find Your Perfect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                Animation Style
              </span>
            </h1>

            <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
              Browse our collection of {styles.length} carefully crafted animation styles.
              Click any style to see details and copy the name for your project.
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search animations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-b border-white/10">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-white/60">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter by:</span>
          </div>

          {/* Mood Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMood(null)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                !selectedMood
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              All Moods
            </button>
            {moods.slice(0, 6).map((mood) => (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(selectedMood === mood.id ? null : mood.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedMood === mood.id
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {mood.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <p className="text-white/60">
            Showing <span className="text-white font-medium">{filteredStyles.length}</span> animations
          </p>
          <button
            onClick={() => setShowFlashlight(!showFlashlight)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showFlashlight
                ? 'bg-indigo-500/20 text-indigo-300'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <MousePointer2 className="w-4 h-4" />
            Flashlight Effect
          </button>
        </div>

        <motion.div
          layout
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredStyles.map((style) => (
              <StyleCard
                key={style.id}
                style={style}
                onSelect={setSelectedStyle}
                isSelected={selectedStyle?.id === style.id}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredStyles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/40">No animations match your filters</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-slate-900/50 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{styles.length}</div>
              <div className="text-sm text-white/60">Animation Styles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{categories.length}</div>
              <div className="text-sm text-white/60">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{moods.length}</div>
              <div className="text-sm text-white/60">Mood Options</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">100%</div>
              <div className="text-sm text-white/60">Accessible</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Found a style you love?
        </h2>
        <p className="text-white/60 mb-8 max-w-lg mx-auto">
          Copy the style name and share it with us. We&apos;ll bring your vision to life.
        </p>
        <a
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-colors text-white font-medium"
        >
          Get Started
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedStyle && (
          <StyleDetailModal
            style={selectedStyle}
            onClose={() => setSelectedStyle(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
