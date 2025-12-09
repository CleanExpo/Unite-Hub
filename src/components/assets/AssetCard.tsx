"use client";

import React from "react";
import {
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  ExternalLink,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Asset {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: number;
  category?: string;
}

interface AssetCardProps {
  asset: Asset;
  viewMode: "grid" | "list";
  onDelete?: (assetId: string) => void;
  onDownload?: (assetId: string) => void;
}

export function AssetCard({
  asset,
  viewMode,
  onDelete,
  onDownload,
}: AssetCardProps) {
  const isImage = asset.mimeType.startsWith("image/");

  const getIcon = () => {
    if (isImage) {
return ImageIcon;
}
    if (asset.mimeType.includes("pdf")) {
return FileText;
}
    return File;
  };

  const Icon = getIcon();

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
return `${bytes} B`;
}
    if (bytes < 1024 * 1024) {
return `${(bytes / 1024).toFixed(1)} KB`;
}
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (viewMode === "list") {
    return (
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {isImage ? (
            <img
              src={asset.fileUrl}
              alt={asset.fileName}
              className="h-12 w-12 rounded object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center">
              <Icon className="h-6 w-6 text-gray-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{asset.fileName}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Badge variant="secondary" className="text-xs">
                {asset.fileType}
              </Badge>
              <span>{formatFileSize(asset.fileSize)}</span>
              <span>•</span>
              <span>{formatDistanceToNow(asset.uploadedAt, { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDownload?.(asset._id)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(asset.fileUrl, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete?.(asset._id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden group">
      {/* Preview */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {isImage ? (
          <img
            src={asset.fileUrl}
            alt={asset.fileName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="h-16 w-16 text-gray-400" />
          </div>
        )}
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onDownload?.(asset._id)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => window.open(asset.fileUrl, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-medium text-gray-900 truncate mb-2">
          {asset.fileName}
        </p>
        <div className="flex items-center justify-between text-sm">
          <Badge variant="secondary" className="text-xs">
            {asset.fileType}
          </Badge>
          <span className="text-gray-500">{formatFileSize(asset.fileSize)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {formatDistanceToNow(asset.uploadedAt, { addSuffix: true })}
        </p>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => onDownload?.(asset._id)}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete?.(asset._id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
