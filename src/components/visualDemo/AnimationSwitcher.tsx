'use client';

/**
 * Animation Switcher Component
 *
 * Allows visitors to cycle through different animation styles
 * on any section of the website. Perfect for client inspiration.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Shuffle, Info, Copy, Check } from 'lucide-react';
import { animationStyles } from '@/lib/visual/animationStyles';

// ============================================================================
// TYPES
// ============================================================================

interface AnimationOption {
  id: string;
  name: string;
  description: string;
  mood: string;
}

interface AnimationSwitcherProps {
  /** ID of the section this controls */
  sectionId: string;
  /** Available animation options for this section */
  options?: AnimationOption[];
  /** Callback when animation changes */
  onAnimationChange?: (animationId: string) => void;
  /** Initial animation ID */
  initialAnimation?: string;
  /** Position of the switcher */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Whether to show style name */
  showStyleName?: boolean;
  /** Compact mode */
  compact?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AnimationSwitcher({
  sectionId,
  options = animationStyles.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    mood: s.mood,
  })),
  onAnimationChange,
  initialAnimation,
  position = 'bottom-right',
  showStyleName = true,
  compact = false,
}: AnimationSwitcherProps) {
  const [currentIndex, setCurrentIndex] = useState(
    initialAnimation ? options.findIndex(o => o.id === initialAnimation) : 0
  );
  const [showInfo, setShowInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentOption = options[currentIndex];

  // Navigate to previous animation
  const goToPrevious = useCallback(() => {
    const newIndex = currentIndex === 0 ? options.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    onAnimationChange?.(options[newIndex].id);
  }, [currentIndex, options, onAnimationChange]);

  // Navigate to next animation
  const goToNext = useCallback(() => {
    const newIndex = currentIndex === options.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    onAnimationChange?.(options[newIndex].id);
  }, [currentIndex, options, onAnimationChange]);

  // Random animation
  const goToRandom = useCallback(() => {
    let newIndex = Math.floor(Math.random() * options.length);
    while (newIndex === currentIndex && options.length > 1) {
      newIndex = Math.floor(Math.random() * options.length);
    }
    setCurrentIndex(newIndex);
    onAnimationChange?.(options[newIndex].id);
  }, [currentIndex, options, onAnimationChange]);

  // Copy style name
  const copyStyleName = useCallback(async () => {
    await navigator.clipboard.writeText(currentOption.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentOption.name]);

  // Position classes
  const positionClasses: Record<typeof position, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} z-50`}
      data-section-id={sectionId}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          bg-black/80 backdrop-blur-md rounded-xl border border-white/10
          ${compact ? 'p-2' : 'p-3'}
        `}
      >
        {/* Style Name Display */}
        {showStyleName && !compact && (
          <div className="mb-3 pb-2 border-b border-white/10">
            <div className="flex items-center justify-between gap-2">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentOption.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-sm font-medium text-white truncate max-w-[180px]"
                >
                  {currentOption.name}
                </motion.p>
              </AnimatePresence>
              <button
                onClick={copyStyleName}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Copy style name"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-white/60" />
                )}
              </button>
            </div>
            <p className="text-xs text-white/50 mt-1 capitalize">{currentOption.mood}</p>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevious}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Previous animation"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>

          <div className="text-xs text-white/60 min-w-[50px] text-center">
            {currentIndex + 1} / {options.length}
          </div>

          <button
            onClick={goToNext}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Next animation"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          <button
            onClick={goToRandom}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Random animation"
          >
            <Shuffle className="w-4 h-4 text-white" />
          </button>

          {!compact && (
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-2 rounded-lg transition-colors ${
                showInfo ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              title="Show info"
            >
              <Info className="w-4 h-4 text-white" />
            </button>
          )}
        </div>

        {/* Info Panel */}
        <AnimatePresence>
          {showInfo && !compact && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-2 border-t border-white/10"
            >
              <p className="text-xs text-white/70 leading-relaxed">
                {currentOption.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ============================================================================
// ANIMATION PREVIEW CARD
// ============================================================================

interface AnimationPreviewCardProps {
  style: AnimationOption;
  isActive?: boolean;
  onClick?: () => void;
}

export function AnimationPreviewCard({
  style,
  isActive = false,
  onClick,
}: AnimationPreviewCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        w-full p-4 rounded-xl text-left transition-all
        ${isActive
          ? 'bg-indigo-500/20 border-2 border-indigo-500'
          : 'bg-white/5 border border-white/10 hover:border-white/20'
        }
      `}
    >
      <h4 className="font-medium text-white mb-1">{style.name}</h4>
      <p className="text-sm text-white/60 line-clamp-2">{style.description}</p>
      <div className="mt-2">
        <span className={`
          inline-block px-2 py-0.5 rounded-full text-xs capitalize
          ${isActive ? 'bg-indigo-500/30 text-indigo-300' : 'bg-white/10 text-white/50'}
        `}>
          {style.mood}
        </span>
      </div>
    </motion.button>
  );
}

// ============================================================================
// DEMO MODE CONTEXT
// ============================================================================

interface DemoModeContextValue {
  enabled: boolean;
  activeAnimations: Record<string, string>;
  setAnimation: (sectionId: string, animationId: string) => void;
  randomizeAll: () => void;
}

const DemoModeContext = React.createContext<DemoModeContextValue | null>(null);

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [activeAnimations, setActiveAnimations] = useState<Record<string, string>>({});

  const setAnimation = useCallback((sectionId: string, animationId: string) => {
    setActiveAnimations(prev => ({ ...prev, [sectionId]: animationId }));
  }, []);

  const randomizeAll = useCallback(() => {
    const randomized: Record<string, string> = {};
    Object.keys(activeAnimations).forEach(sectionId => {
      const randomStyle = animationStyles[Math.floor(Math.random() * animationStyles.length)];
      randomized[sectionId] = randomStyle.id;
    });
    setActiveAnimations(randomized);
  }, [activeAnimations]);

  return (
    <DemoModeContext.Provider value={{ enabled, activeAnimations, setAnimation, randomizeAll }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = React.useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within DemoModeProvider');
  }
  return context;
}

export default AnimationSwitcher;
