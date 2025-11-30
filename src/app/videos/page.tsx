"use client";

/**
 * Video Library Page
 * Phase 11: Video Explanations System
 *
 * Displays all available videos organized by category with search and filtering.
 */

import React, { useState, useMemo } from "react";
import { ExplainerVideo } from "@/components/video/ExplainerVideo";
import { VIDEO_LIBRARY, type VideoEntry } from "@/lib/video/content-library";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Play, Clock, Filter } from "lucide-react";

// Define categories locally
const VIDEO_CATEGORIES = [
  { id: "onboarding", label: "Onboarding", icon: "🚀" },
  { id: "features", label: "Features", icon: "✨" },
  { id: "tutorials", label: "Tutorials", icon: "📚" },
  { id: "marketing", label: "Marketing", icon: "📢" },
];

export default function VideoLibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVideo, setSelectedVideo] = useState<VideoEntry | null>(null);

  // Get all videos from library
  const allVideos = useMemo(() => {
    return Object.values(VIDEO_LIBRARY).flat();
  }, []);

  // Filter videos based on search and category
  const filteredVideos = useMemo(() => {
    return allVideos.filter(video => {
      const matchesSearch = searchQuery === "" ||
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === "all" || video.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [allVideos, searchQuery, selectedCategory]);

  // Group filtered videos by category
  const groupedVideos = useMemo(() => {
    return filteredVideos.reduce((acc, video) => {
      if (!acc[video.category]) {
        acc[video.category] = [];
      }
      acc[video.category].push(video);
      return acc;
    }, {} as Record<string, VideoEntry[]>);
  }, [filteredVideos]);

  const handleVideoSelect = (video: VideoEntry) => {
    setSelectedVideo(video);
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold mb-2">Video Library</h1>
          <p className="text-muted-foreground">
            Learn how to use Unite-Hub with our comprehensive video tutorials
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="flex flex-wrap h-auto gap-2">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              All Videos
            </TabsTrigger>
            {VIDEO_CATEGORIES.map(category => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Video Grid */}
        {selectedCategory === "all" ? (
          // Show all categories grouped
          <div className="space-y-12">
            {Object.entries(groupedVideos).map(([category, videos]) => {
              const categoryInfo = VIDEO_CATEGORIES.find(c => c.id === category);
              return (
                <section key={category}>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-2xl">{categoryInfo?.icon}</span>
                    <h2 className="text-2xl font-semibold">{categoryInfo?.label || category}</h2>
                    <Badge variant="secondary" className="ml-2">
                      {videos.length} video{videos.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map(video => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onSelect={handleVideoSelect}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          // Show filtered category
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                onSelect={handleVideoSelect}
              />
            ))}
          </div>
        )}

        {/* No Results */}
        {filteredVideos.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">No videos found matching your search.</p>
            <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </main>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{selectedVideo.title}</h2>
                  <p className="text-muted-foreground text-sm mt-1">{selectedVideo.description}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCloseVideo}>
                  Close
                </Button>
              </div>
              <ExplainerVideo
                videoId={selectedVideo.id}
                title={selectedVideo.title}
                description={selectedVideo.description}
                thumbnail={selectedVideo.thumbnail}
                autoPlay
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {(selectedVideo.tags || []).map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Format duration from seconds to mm:ss
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Video Card Component
function VideoCard({ video, onSelect }: { video: VideoEntry; onSelect: (video: VideoEntry) => void }) {
  const tags = video.tags || [];

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow group"
      onClick={() => onSelect(video)}
    >
      <CardHeader className="pb-3">
        <div className="relative aspect-video bg-muted rounded-md overflow-hidden mb-3">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Play className="h-12 w-12 text-primary/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              <Play className="h-8 w-8 text-primary ml-1" />
            </div>
          </div>
          {video.duration && (
            <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
              <Clock className="h-3 w-3 mr-1" />
              {formatDuration(video.duration)}
            </Badge>
          )}
        </div>
        <CardTitle className="text-base line-clamp-2">{video.title}</CardTitle>
        <CardDescription className="line-clamp-2">{video.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
