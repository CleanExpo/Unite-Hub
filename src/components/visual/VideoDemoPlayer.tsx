'use client';

/**
 * Video Demo Player Component
 *
 * Displays animation demo videos with controls and metadata.
 * Supports placeholder mode when video URLs are not yet available.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  Clock,
  Tag,
  Layers,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface VideoDemo {
  id: string;
  styleId: string;
  title: string;
  description: string;
  durationSec: number;
  aspectRatio: string;
  personaTags: string[];
  useCases: string[];
  category: string;
  primaryModel: string;
  presetPromptId: string;
  thumbnailUrl: string | null;
  demoUrl: string | null;
  status: 'pending' | 'generating' | 'ready' | 'error';
}

interface VideoDemoPlayerProps {
  demo: VideoDemo;
  autoPlay?: boolean;
  showControls?: boolean;
  showMetadata?: boolean;
  onPlay?: () => void;
  onComplete?: () => void;
}

// ============================================================================
// PLACEHOLDER ANIMATION
// ============================================================================

function PlaceholderAnimation({ demo }: { demo: VideoDemo }) {
  // Generate different placeholder animations based on category
  const getAnimation = () => {
    switch (demo.category.toLowerCase()) {
      case 'hero':
        return (
          <motion.div
            className="w-full h-full flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-transparent to-purple-500/20"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            <div className="text-center z-10">
              <div className="text-2xl font-bold text-white/80 mb-2">Hero Section</div>
              <div className="text-white/40">Beam sweep animation</div>
            </div>
          </motion.div>
        );

      case 'cards':
        return (
          <div className="w-full h-full flex items-center justify-center gap-4 p-8">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-24 h-32 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/10"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -5 }}
              />
            ))}
          </div>
        );

      case 'transitions':
        return (
          <motion.div
            className="w-full h-full"
            initial={{ clipPath: 'circle(0% at 50% 50%)' }}
            animate={{ clipPath: 'circle(100% at 50% 50%)' }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          >
            <div className="w-full h-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center">
              <span className="text-white/60">Transition Preview</span>
            </div>
          </motion.div>
        );

      case 'background fx':
        return (
          <div className="w-full h-full relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/60">Ambient Background</span>
            </div>
          </div>
        );

      case 'interactive':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <motion.div
              className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="absolute text-white/60">Cursor Effect</div>
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <motion.div
              className="text-white/40"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Animation Preview
            </motion.div>
          </div>
        );
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-900">
      {getAnimation()}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VideoDemoPlayer({
  demo,
  autoPlay = false,
  showControls = true,
  showMetadata = true,
  onPlay,
  onComplete,
}: VideoDemoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);

  const hasVideo = demo.status === 'ready' && demo.demoUrl;

  // Auto-hide controls
  useEffect(() => {
    if (!showControls) return;

    let timeout: NodeJS.Timeout;
    const hideControls = () => {
      timeout = setTimeout(() => {
        if (isPlaying) setShowControlsOverlay(false);
      }, 3000);
    };

    hideControls();
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  const handlePlayPause = () => {
    if (hasVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
        onPlay?.();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);

      if (progress >= 100) {
        onComplete?.();
      }
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-xl overflow-hidden bg-slate-900 border border-white/10">
      {/* Video Container */}
      <div
        className="relative aspect-video bg-slate-950"
        onMouseEnter={() => setShowControlsOverlay(true)}
        onMouseLeave={() => isPlaying && setShowControlsOverlay(false)}
      >
        {/* Video or Placeholder */}
        {hasVideo ? (
          <video
            ref={videoRef}
            src={demo.demoUrl!}
            className="w-full h-full object-cover"
            muted={isMuted}
            loop
            playsInline
            onTimeUpdate={handleTimeUpdate}
          />
        ) : (
          <PlaceholderAnimation demo={demo} />
        )}

        {/* Status Badge */}
        {demo.status !== 'ready' && (
          <div className="absolute top-4 left-4 z-20">
            <span className={`
              px-3 py-1 rounded-full text-xs font-medium
              ${demo.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : ''}
              ${demo.status === 'generating' ? 'bg-blue-500/20 text-blue-300' : ''}
              ${demo.status === 'error' ? 'bg-red-500/20 text-red-300' : ''}
            `}>
              {demo.status === 'pending' && 'Demo Coming Soon'}
              {demo.status === 'generating' && 'Generating...'}
              {demo.status === 'error' && 'Generation Failed'}
            </span>
          </div>
        )}

        {/* Controls Overlay */}
        {showControls && (
          <AnimatePresence>
            {showControlsOverlay && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
              >
                {/* Center Play Button */}
                <button
                  onClick={handlePlayPause}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </div>
                </button>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {/* Progress Bar */}
                  <div className="h-1 bg-white/20 rounded-full mb-3 overflow-hidden">
                    <motion.div
                      className="h-full bg-indigo-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handlePlayPause}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white" />
                        )}
                      </button>

                      <button
                        onClick={handleRestart}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <RotateCcw className="w-5 h-5 text-white" />
                      </button>

                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        {isMuted ? (
                          <VolumeX className="w-5 h-5 text-white" />
                        ) : (
                          <Volume2 className="w-5 h-5 text-white" />
                        )}
                      </button>

                      <span className="text-sm text-white/60">
                        {formatDuration(demo.durationSec)}
                      </span>
                    </div>

                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <Maximize className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Metadata Section */}
      {showMetadata && (
        <div className="p-4">
          <h3 className="font-semibold text-white mb-1">{demo.title}</h3>
          <p className="text-sm text-white/50 mb-3">{demo.description}</p>

          <div className="flex flex-wrap gap-2">
            {/* Category */}
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs">
              <Layers className="w-3 h-3" />
              {demo.category}
            </span>

            {/* Duration */}
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-white/60 text-xs">
              <Clock className="w-3 h-3" />
              {formatDuration(demo.durationSec)}
            </span>

            {/* Persona Tags */}
            {demo.personaTags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 text-white/40 text-xs"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoDemoPlayer;
