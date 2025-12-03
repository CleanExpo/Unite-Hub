"use client";

import React, { useEffect, useState } from "react";
import { FileVideo, FileAudio, FileText, Image as ImageIcon, Pencil, Calendar, User, Tag, Loader2, Search, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface MediaFile {
  id: string;
  filename: string;
  original_filename: string;
  file_type: "video" | "audio" | "document" | "image" | "sketch";
  mime_type: string;
  file_size_bytes: number;
  storage_path: string;
  public_url: string | null;
  status: string;
  progress: number;
  duration_seconds: number | null;
  transcript: any;
  ai_analysis: any;
  tags: string[];
  created_at: string;
  uploaded_by: string;
}

interface MediaGalleryProps {
  workspaceId: string;
  projectId?: string;
  onSelect?: (media: MediaFile) => void;
  filterType?: "video" | "audio" | "document" | "image" | "sketch" | null;
}

export function MediaGallery({
  workspaceId,
  projectId,
  onSelect,
  filterType = null,
}: MediaGalleryProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(filterType);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Fetch media files
  const fetchMediaFiles = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();

      let url = `/api/media/upload?workspace_id=${workspaceId}`;
      if (projectId) url += `&project_id=${projectId}`;
      if (selectedType) url += `&file_type=${selectedType}`;
      if (selectedStatus) url += `&status=${selectedStatus}`;

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${session?.access_token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMediaFiles(data.media_files);
      }
    } catch (error) {
      console.error("Failed to fetch media files:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMediaFiles();
  }, [workspaceId, projectId, selectedType, selectedStatus]);

  // Filter media files by search query
  const filteredMedia = mediaFiles.filter((media) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      media.original_filename.toLowerCase().includes(searchLower) ||
      media.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
      (media.ai_analysis?.summary?.toLowerCase().includes(searchLower))
    );
  });

  // Get icon for file type
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "video":
        return <FileVideo className="h-8 w-8 text-blue-500" />;
      case "audio":
        return <FileAudio className="h-8 w-8 text-purple-500" />;
      case "document":
        return <FileText className="h-8 w-8 text-green-500" />;
      case "image":
        return <ImageIcon className="h-8 w-8 text-yellow-500" />;
      case "sketch":
        return <Pencil className="h-8 w-8 text-pink-500" />;
      default:
        return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format duration
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files, tags, or content..."
            className="w-full pl-10 pr-4 py-2 border border-border-base rounded-lg bg-bg-card text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Type Filter */}
        <select
          value={selectedType || ""}
          onChange={(e) => setSelectedType(e.target.value || null)}
          className="px-4 py-2 border border-border-base rounded-lg bg-bg-card text-gray-900 dark:text-gray-100"
        >
          <option value="">All Types</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
          <option value="document">Document</option>
          <option value="image">Image</option>
          <option value="sketch">Sketch</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus || ""}
          onChange={(e) => setSelectedStatus(e.target.value || null)}
          className="px-4 py-2 border border-border-base rounded-lg bg-bg-card text-gray-900 dark:text-gray-100"
        >
          <option value="">All Status</option>
          <option value="uploading">Uploading</option>
          <option value="processing">Processing</option>
          <option value="transcribing">Transcribing</option>
          <option value="analyzing">Analyzing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredMedia.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-secondary">
            {searchQuery ? "No media files match your search" : "No media files yet"}
          </p>
        </div>
      )}

      {/* Media Grid */}
      {!loading && filteredMedia.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMedia.map((media) => (
            <div
              key={media.id}
              onClick={() => onSelect?.(media)}
              className="group relative bg-bg-card border border-border-subtle rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-bg-raised flex items-center justify-center relative">
                {media.file_type === "image" && media.public_url ? (
                  <img
                    src={media.public_url}
                    alt={media.original_filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    {getFileIcon(media.file_type)}
                    {media.duration_seconds && (
                      <span className="text-xs text-text-secondary">
                        {formatDuration(media.duration_seconds)}
                      </span>
                    )}
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  {media.status === "completed" && (
                    <span className="px-2 py-1 text-xs bg-green-500 text-white rounded-full">
                      Ready
                    </span>
                  )}
                  {media.status === "processing" && (
                    <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
                      {media.progress}%
                    </span>
                  )}
                  {media.status === "failed" && (
                    <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                      Failed
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-3 space-y-2">
                {/* Filename */}
                <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                  {media.original_filename}
                </h3>

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span className="capitalize">{media.file_type}</span>
                  <span>•</span>
                  <span>{formatFileSize(media.file_size_bytes)}</span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1 text-xs text-text-secondary">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(media.created_at)}</span>
                </div>

                {/* Tags */}
                {media.tags && media.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {media.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                      </span>
                    ))}
                    {media.tags.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{media.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {/* AI Analysis Summary (if available) */}
                {media.ai_analysis?.summary && (
                  <p className="text-xs text-text-secondary line-clamp-2">
                    {media.ai_analysis.summary}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
