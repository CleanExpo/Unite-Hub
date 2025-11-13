"use client";

import React from "react";
import { Check } from "lucide-react";

interface PlatformFilterProps {
  selectedPlatforms: string[];
  onTogglePlatform: (platform: string) => void;
}

const platforms = [
  { id: "facebook", name: "Facebook", color: "#1877F2", icon: "📘" },
  { id: "instagram", name: "Instagram", color: "#E4405F", icon: "📸" },
  { id: "tiktok", name: "TikTok", color: "#000000", icon: "🎵" },
  { id: "linkedin", name: "LinkedIn", color: "#0A66C2", icon: "💼" },
  { id: "blog", name: "Blog", color: "#6B7280", icon: "✍️" },
  { id: "email", name: "Email", color: "#8B5CF6", icon: "📧" },
];

export default function PlatformFilter({
  selectedPlatforms,
  onTogglePlatform,
}: PlatformFilterProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Filter by Platform</h3>
      <div className="space-y-2">
        {platforms.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id);
          return (
            <button
              key={platform.id}
              onClick={() => onTogglePlatform(platform.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                isSelected
                  ? "bg-blue-50 border-2 border-blue-500"
                  : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{platform.icon}</span>
                <span className="text-sm font-medium text-gray-900">
                  {platform.name}
                </span>
              </div>
              {isSelected && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </button>
          );
        })}
      </div>

      {selectedPlatforms.length < platforms.length && (
        <button
          onClick={() => platforms.forEach(p => {
            if (!selectedPlatforms.includes(p.id)) {
              onTogglePlatform(p.id);
            }
          })}
          className="w-full mt-3 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          Select All
        </button>
      )}

      {selectedPlatforms.length > 0 && (
        <button
          onClick={() => selectedPlatforms.forEach(p => onTogglePlatform(p))}
          className="w-full mt-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          Clear All
        </button>
      )}
    </div>
  );
}
