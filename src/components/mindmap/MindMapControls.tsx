"use client";

import React from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  RefreshCw,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MindMapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  onAIExpand?: () => void;
  autoExpandEnabled?: boolean;
  version?: number;
}

export function MindMapControls({
  onZoomIn,
  onZoomOut,
  onFitView,
  onExport,
  onRefresh,
  onAIExpand,
  autoExpandEnabled = true,
  version,
}: MindMapControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      {/* Version Badge */}
      {version && (
        <Badge variant="secondary" className="self-end">
          Version {version}
        </Badge>
      )}

      {/* Control Panel */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex flex-col gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onZoomIn}
          className="w-full justify-start gap-2"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onZoomOut}
          className="w-full justify-start gap-2"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onFitView}
          className="w-full justify-start gap-2"
          title="Fit to View"
        >
          <Maximize className="h-4 w-4" />
        </Button>
        <div className="h-px bg-gray-200 my-1" />
        <Button
          size="sm"
          variant="ghost"
          onClick={onRefresh}
          className="w-full justify-start gap-2"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onExport}
          className="w-full justify-start gap-2"
          title="Export"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* AI Expand Button */}
      {autoExpandEnabled && (
        <Button
          onClick={onAIExpand}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all gap-2"
        >
          <Sparkles className="h-4 w-4" />
          AI Expand
        </Button>
      )}
    </div>
  );
}
