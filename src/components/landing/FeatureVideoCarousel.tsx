'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { FeatureVideo } from '@/data/feature-videos-data';

/* eslint-disable no-undef */

export interface FeatureVideoCarouselProps {
  videos: FeatureVideo[];
  title?: string;
  subtitle?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showCategory?: boolean;
  className?: string;
}

/**
 * Feature Video Carousel Component
 * Displays product demo videos in a carousel format with navigation
 */
export function FeatureVideoCarousel({
  videos,
  title = 'See It In Action',
  subtitle = 'Watch how Synthex transforms your lead generation and marketing automation',
  autoPlay = true,
  autoPlayInterval = 8000,
  showCategory = true,
  className = '',
}: FeatureVideoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || videos.length === 0) {
return;
}

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, autoPlayInterval, videos.length]);

  if (videos.length === 0) {
return null;
}

  const currentVideo = videos[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      email: 'bg-blue-100 text-blue-800',
      content: 'bg-purple-100 text-purple-800',
      automation: 'bg-green-100 text-green-800',
      scoring: 'bg-orange-100 text-orange-800',
      integrations: 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`w-full py-16 px-4 md:px-8 ${className}`}>
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        {title && <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>}
        {subtitle && <p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>}
      </div>

      {/* Main Carousel */}
      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardContent className="p-0 relative bg-black/95">
            {/* Video Container */}
            <div className="relative w-full bg-black aspect-video flex items-center justify-center overflow-hidden">
              {/* Placeholder - In production, this would be an actual video player */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block mb-4 p-4 rounded-full bg-white/10">
                    <Play className="w-12 h-12 text-white fill-white" />
                  </div>
                  <p className="text-white/70 text-sm">
                    {currentVideo.title}
                  </p>
                </div>
              </div>

              {/* Video Thumbnail Background */}
              {(currentVideo.thumbnail || currentVideo.thumbnailUrl) && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${currentVideo.thumbnail || currentVideo.thumbnailUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.3,
                  }}
                />
              )}

              {/* Navigation Buttons */}
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Previous video"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Next video"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Video Info */}
            <div className="p-6 bg-gradient-to-b from-gray-900 to-black">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {currentVideo.title}
                  </h3>
                  {showCategory && (
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getCategoryColor(
                        currentVideo.category
                      )}`}
                    >
                      {currentVideo.category}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  {Math.floor(currentVideo.duration / 60)}:{(currentVideo.duration % 60)
                    .toString()
                    .padStart(2, '0')}
                </div>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed">
                {currentVideo.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Thumbnail Navigation */}
        <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
          {videos.map((video, index) => (
            <button
              key={video.id}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 relative overflow-hidden rounded-lg transition-all ${
                index === currentIndex
                  ? 'ring-2 ring-blue-500 w-32 h-20'
                  : 'w-24 h-16 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-black flex items-center justify-center">
                <Play className="w-5 h-5 text-white/70" />
              </div>
              {(video.thumbnail || video.thumbnailUrl) && (
                <img
                  src={video.thumbnail || video.thumbnailUrl}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>

        {/* Progress Indicators */}
        <div className="mt-4 flex justify-center gap-2">
          {videos.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all rounded-full ${
                index === currentIndex
                  ? 'bg-blue-500 w-8 h-2'
                  : 'bg-gray-300 w-2 h-2 hover:bg-gray-400'
              }`}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
