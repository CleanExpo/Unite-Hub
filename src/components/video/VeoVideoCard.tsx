'use client';

import { useState } from 'react';
import { Play, Clock, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { VeoVideo } from '@/data/veo-videos-data';

export interface VeoVideoCardProps {
  video: VeoVideo;
  onClick?: (video: VeoVideo) => void;
  showCategory?: boolean;
  showTags?: boolean;
  className?: string;
}

/**
 * VEO Video Card Component
 * Displays a single video with thumbnail, title, and metadata
 * Optimized for grid layouts and carousels
 */
export function VeoVideoCard({
  video,
  onClick,
  showCategory = true,
  showTags = false,
  className = '',
}: VeoVideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getCategoryColor = (category: VeoVideo['category']) => {
    const colors: Record<VeoVideo['category'], string> = {
      'lead-management': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'sales-automation': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'analytics': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'workflow': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'onboarding': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (category: VeoVideo['category']) => {
    const labels: Record<VeoVideo['category'], string> = {
      'lead-management': 'Lead Management',
      'sales-automation': 'Sales Automation',
      'analytics': 'Analytics',
      'workflow': 'Workflow',
      'onboarding': 'Quick Start',
    };
    return labels[category];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card
      className={`overflow-hidden transition-all duration-300 cursor-pointer group ${
        isHovered ? 'shadow-xl scale-[1.02]' : 'shadow-lg'
      } ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(video)}
    >
      <CardContent className="p-0">
        {/* Thumbnail Container */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-gray-800 to-black overflow-hidden">
          {/* Thumbnail Image */}
          <img
            src={video.thumbnail}
            alt={video.title}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Play Button Overlay */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </div>

          {/* Duration Badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(video.duration)}</span>
          </div>

          {/* Category Badge */}
          {showCategory && (
            <div className="absolute top-3 left-3">
              <span
                className={`inline-block px-2 py-1 rounded-md text-xs font-medium capitalize ${getCategoryColor(
                  video.category
                )}`}
              >
                {getCategoryLabel(video.category)}
              </span>
            </div>
          )}

          {/* Resolution Badge */}
          <div className="absolute bottom-3 right-3 bg-gradient-to-r from-[#347bf7] to-[#5a9dff] text-white text-xs px-2 py-1 rounded-md font-bold">
            {video.resolution}
          </div>
        </div>

        {/* Video Info */}
        <div className="p-4 bg-white dark:bg-gray-900">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {video.title}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {video.description}
          </p>

          {/* Tags */}
          {showTags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {video.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{video.metadata.views?.toLocaleString() || 0} views</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${
                  video.metadata.approvalStatus === 'approved'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}
              >
                {video.metadata.approvalStatus}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
