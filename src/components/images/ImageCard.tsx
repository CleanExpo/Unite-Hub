"use client";

import React from "react";
import { Download, CheckCircle2, Eye, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ImageConcept {
  _id: string;
  conceptType: string;
  platform?: string;
  prompt: string;
  imageUrl: string;
  style: string;
  colorPalette: string[];
  dimensions: {
    width: number;
    height: number;
  };
  usageRecommendations: string;
  isUsed: boolean;
}

interface ImageCardProps {
  image: ImageConcept;
  viewMode: "grid" | "list";
  onDownload?: (imageId: string) => void;
  onUse?: (imageId: string) => void;
}

export function ImageCard({ image, viewMode, onDownload, onUse }: ImageCardProps) {
  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <img
            src={image.imageUrl}
            alt={image.prompt}
            className="w-32 h-32 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="capitalize">
                {image.conceptType.replace(/_/g, " ")}
              </Badge>
              {image.platform && (
                <Badge variant="outline" className="capitalize">
                  {image.platform}
                </Badge>
              )}
              {image.isUsed && (
                <Badge className="bg-green-100 text-green-700 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Used
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-700 line-clamp-2 mb-2">{image.prompt}</p>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>
                {image.dimensions.width} x {image.dimensions.height}
              </span>
              <span className="capitalize">{image.style}</span>
              <div className="flex items-center gap-1">
                <Palette className="h-3 w-3" />
                {image.colorPalette.length} colors
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Image Details</DialogTitle>
                </DialogHeader>
                <ImageDetailView image={image} />
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="outline" onClick={() => onDownload?.(image._id)}>
              <Download className="h-4 w-4" />
            </Button>
            {!image.isUsed && (
              <Button size="sm" onClick={() => onUse?.(image._id)}>
                Use Image
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        <img
          src={image.imageUrl}
          alt={image.prompt}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary">
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Image Details</DialogTitle>
              </DialogHeader>
              <ImageDetailView image={image} />
            </DialogContent>
          </Dialog>
          <Button size="sm" variant="secondary" onClick={() => onDownload?.(image._id)}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
        {image.isUsed && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-green-500 text-white gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Used
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs capitalize">
            {image.conceptType.replace(/_/g, " ")}
          </Badge>
          {image.platform && (
            <Badge variant="outline" className="text-xs capitalize">
              {image.platform}
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-700 line-clamp-2 mb-3">{image.prompt}</p>
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
          <span>
            {image.dimensions.width} x {image.dimensions.height}
          </span>
          <span>•</span>
          <span className="capitalize">{image.style}</span>
        </div>
        {!image.isUsed && (
          <Button onClick={() => onUse?.(image._id)} className="w-full" size="sm">
            Use Image
          </Button>
        )}
      </div>
    </div>
  );
}

function ImageDetailView({ image }: { image: ImageConcept }) {
  return (
    <div className="space-y-4">
      <img
        src={image.imageUrl}
        alt={image.prompt}
        className="w-full rounded-lg"
      />
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Prompt</h4>
        <p className="text-gray-700">{image.prompt}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Style</h4>
          <p className="text-gray-700 capitalize">{image.style}</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Dimensions</h4>
          <p className="text-gray-700">
            {image.dimensions.width} x {image.dimensions.height}
          </p>
        </div>
      </div>
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Color Palette</h4>
        <div className="flex gap-2">
          {image.colorPalette.map((color, index) => (
            <div
              key={index}
              className="w-12 h-12 rounded-lg border border-gray-300"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Usage Recommendations</h4>
        <p className="text-gray-700">{image.usageRecommendations}</p>
      </div>
    </div>
  );
}
