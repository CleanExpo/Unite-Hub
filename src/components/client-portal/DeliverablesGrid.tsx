"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { FileText, Image as ImageIcon, Video, File, Download } from "lucide-react";

interface Deliverable {
  id: string;
  name: string;
  type: "pdf" | "image" | "video" | "zip" | "other";
  size: string;
  url?: string;
}

interface DeliverablesGridProps {
  deliverables: Deliverable[];
  className?: string;
  onDownload?: (deliverable: Deliverable) => void;
}

const typeConfig = {
  pdf: {
    icon: FileText,
    bgClass: "bg-gradient-to-br from-red-500 to-red-600",
  },
  image: {
    icon: ImageIcon,
    bgClass: "bg-gradient-to-br from-purple-500 to-purple-600",
  },
  video: {
    icon: Video,
    bgClass: "bg-gradient-to-br from-blue-500 to-blue-600",
  },
  zip: {
    icon: File,
    bgClass: "bg-gradient-to-br from-unite-teal to-unite-blue",
  },
  other: {
    icon: File,
    bgClass: "bg-gradient-to-br from-gray-500 to-gray-600",
  },
};

export function DeliverablesGrid({ deliverables, className, onDownload }: DeliverablesGridProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      {deliverables.map((deliverable) => {
        const config = typeConfig[deliverable.type];
        const Icon = config.icon;

        return (
          <div
            key={deliverable.id}
            onClick={() => onDownload?.(deliverable)}
            className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3 cursor-pointer hover:border-unite-teal hover:bg-unite-teal/5 transition-all group"
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
              config.bgClass
            )}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{deliverable.name}</div>
              <div className="text-xs text-gray-500">{deliverable.type.toUpperCase()} • {deliverable.size}</div>
            </div>
            <Download className="h-4 w-4 text-gray-400 group-hover:text-unite-teal transition-colors" />
          </div>
        );
      })}
    </div>
  );
}
