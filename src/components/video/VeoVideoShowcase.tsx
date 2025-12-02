'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Grid, List } from 'lucide-react';
import { VeoVideoPlayer } from './VeoVideoPlayer';
import { VeoVideoCard } from './VeoVideoCard';
import type { VeoVideo } from '@/data/veo-videos-data';
import { veoVideoCategories } from '@/data/veo-videos-data';

export interface VeoVideoShowcaseProps {
  videos: VeoVideo[];
  title?: string;
  subtitle?: string;
  defaultView?: 'carousel' | 'grid';
  showFilters?: boolean;
  autoPlay?: boolean;
  className?: string;
}

/**
 * VEO Video Showcase Component
 * Displays VEO videos in either carousel or grid layout
 * with category filtering and view switching
 */
export function VeoVideoShowcase({
  videos,
  title = 'See Synthex In Action',
  subtitle = 'Real problems. Real solutions. 30 seconds each.',
  defaultView = 'carousel',
  showFilters = true,
  autoPlay = false,
  className = '',
}: VeoVideoShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>(defaultView);
  const [selectedVideo, setSelectedVideo] = useState<VeoVideo | null>(null);

  // Filter videos by category
  const filteredVideos =
    selectedCategory === 'all'
      ? videos
      : videos.filter((video) => video.category === selectedCategory);

  const currentVideo = filteredVideos[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? filteredVideos.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredVideos.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleVideoClick = (video: VeoVideo) => {
    setSelectedVideo(video);
  };

  const handleCloseModal = () => {
    setSelectedVideo(null);
  };

  if (filteredVideos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          No videos found for this category.
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="text-center mb-12">
        {title && (
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>

      {/* Filters and View Toggle */}
      {showFilters && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-2">
            {veoVideoCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setCurrentIndex(0);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-[#347bf7] to-[#5a9dff] text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('carousel')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'carousel'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              aria-label="Carousel view"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              aria-label="Grid view"
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Carousel View */}
      {viewMode === 'carousel' && currentVideo && (
        <div className="max-w-4xl mx-auto">
          {/* Main Video */}
          <div className="relative mb-8">
            <VeoVideoPlayer
              video={currentVideo}
              autoPlay={autoPlay}
              controls={true}
              className="w-full"
            />

            {/* Navigation Arrows */}
            {filteredVideos.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white transition-colors"
                  aria-label="Previous video"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white transition-colors"
                  aria-label="Next video"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Navigation */}
          {filteredVideos.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {filteredVideos.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => goToSlide(index)}
                  className={`flex-shrink-0 relative overflow-hidden rounded-lg transition-all ${
                    index === currentIndex
                      ? 'ring-2 ring-blue-500 w-40 h-24'
                      : 'w-32 h-20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                </button>
              ))}
            </div>
          )}

          {/* Progress Indicators */}
          {filteredVideos.length > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {filteredVideos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all rounded-full ${
                    index === currentIndex
                      ? 'bg-blue-500 w-8 h-2'
                      : 'bg-gray-300 dark:bg-gray-700 w-2 h-2 hover:bg-gray-400 dark:hover:bg-gray-600'
                  }`}
                  aria-label={`Go to video ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <VeoVideoCard
              key={video.id}
              video={video}
              onClick={handleVideoClick}
              showCategory={true}
              showTags={true}
            />
          ))}
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <div
            className="max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <VeoVideoPlayer
              video={selectedVideo}
              autoPlay={true}
              controls={true}
              className="w-full"
            />
            <div className="mt-4 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">
                {selectedVideo.title}
              </h3>
              <p className="text-gray-300">{selectedVideo.description}</p>
              <button
                onClick={handleCloseModal}
                className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
