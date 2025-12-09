"use client";

import React, { useState, useCallback } from "react";
import { Upload, FileVideo, FileAudio, FileText, Image as ImageIcon, Pencil, X, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface MediaUploaderProps {
  workspaceId: string;
  orgId: string;
  projectId?: string;
  onUploadComplete?: (media: any) => void;
  allowedTypes?: ("video" | "audio" | "document" | "image" | "sketch")[];
  maxSizeMB?: number;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: "uploading" | "processing" | "transcribing" | "analyzing" | "completed" | "failed";
  error?: string;
  mediaId?: string;
}

export function MediaUploader({
  workspaceId,
  orgId,
  projectId,
  onUploadComplete,
  allowedTypes = ["video", "audio", "document", "image", "sketch"],
  maxSizeMB = 100,
}: MediaUploaderProps) {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // File type detection
  const detectFileType = (file: File): "video" | "audio" | "document" | "image" | "sketch" | null => {
    const mimeType = file.type;

    if (mimeType.startsWith("video/")) {
return "video";
}
    if (mimeType.startsWith("audio/")) {
return "audio";
}
    if (mimeType.startsWith("image/")) {
return "image";
}
    if (["application/pdf", "application/msword", "text/plain", "text/markdown"].includes(mimeType)) {
return "document";
}

    // Sketch detection (usually SVG or specific canvas exports)
    if (mimeType === "image/svg+xml") {
return "sketch";
}

    return null;
  };

  // Handle file upload
  const uploadFile = async (file: File) => {
    const fileType = detectFileType(file);

    if (!fileType) {
      alert(`Unsupported file type: ${file.type}`);
      return;
    }

    if (!allowedTypes.includes(fileType)) {
      alert(`File type ${fileType} is not allowed`);
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    // Add to uploads list
    const uploadProgress: UploadProgress = {
      file,
      progress: 0,
      status: "uploading",
    };

    setUploads((prev) => [...prev, uploadProgress]);

    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      // Create FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workspace_id", workspaceId);
      formData.append("org_id", orgId);
      if (projectId) {
formData.append("project_id", projectId);
}
      formData.append("file_type", fileType);
      if (tags.length > 0) {
formData.append("tags", JSON.stringify(tags));
}

      // Upload via API
      const response = await fetch("/api/media/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();

      // Update progress
      setUploads((prev) =>
        prev.map((u) =>
          u.file === file
            ? { ...u, status: "processing", progress: 50, mediaId: data.media.id }
            : u
        )
      );

      // Poll for completion
      pollStatus(data.media.id, file);

      if (onUploadComplete) {
        onUploadComplete(data.media);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploads((prev) =>
        prev.map((u) =>
          u.file === file
            ? { ...u, status: "failed", error: error.message }
            : u
        )
      );
    }
  };

  // Poll upload status
  const pollStatus = async (mediaId: string, file: File) => {
    const interval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(
          `/api/media/upload?workspace_id=${workspaceId}`,
          {
            headers: {
              "Authorization": `Bearer ${session?.access_token}`,
            },
          }
        );

        const data = await response.json();
        const mediaFile = data.media_files.find((m: any) => m.id === mediaId);

        if (mediaFile) {
          setUploads((prev) =>
            prev.map((u) =>
              u.file === file
                ? {
                    ...u,
                    status: mediaFile.status,
                    progress: mediaFile.progress,
                  }
                : u
            )
          );

          if (mediaFile.status === "completed" || mediaFile.status === "failed") {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => uploadFile(file));
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => uploadFile(file));
  }, []);

  // Handle tag addition
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Get icon for file type
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "video":
        return <FileVideo className="h-5 w-5 text-blue-500" />;
      case "audio":
        return <FileAudio className="h-5 w-5 text-purple-500" />;
      case "document":
        return <FileText className="h-5 w-5 text-green-500" />;
      case "image":
        return <ImageIcon className="h-5 w-5 text-yellow-500" />;
      case "sketch":
        return <Pencil className="h-5 w-5 text-pink-500" />;
      default:
        return <Upload className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-border-base hover:border-gray-400 dark:hover:border-gray-600"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 mx-auto text-text-muted mb-4" />
        <p className="text-lg font-medium text-text-secondary mb-2">
          Drag and drop files here
        </p>
        <p className="text-sm text-text-secondary mb-4">
          or click to browse (max {maxSizeMB}MB)
        </p>
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
        >
          Select Files
        </label>
      </div>

      {/* Tags Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">
          Tags (optional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTag()}
            placeholder="Add tags..."
            className="flex-1 px-3 py-2 border border-border-base rounded-lg bg-bg-card text-gray-900 dark:text-gray-100"
          />
          <button
            onClick={addTag}
            className="px-4 py-2 bg-bg-hover hover:bg-bg-hover rounded-lg"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-blue-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-text-secondary">
            Uploads ({uploads.length})
          </h3>
          {uploads.map((upload, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-bg-raised rounded-lg"
            >
              {getFileIcon(detectFileType(upload.file) || "")}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {upload.file.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-bg-hover rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        upload.status === "failed"
                          ? "bg-red-500"
                          : upload.status === "completed"
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-secondary capitalize">
                    {upload.status}
                  </span>
                </div>
                {upload.error && (
                  <p className="text-xs text-red-500 mt-1">{upload.error}</p>
                )}
              </div>
              {upload.status === "completed" && (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              )}
              {upload.status === "failed" && (
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
