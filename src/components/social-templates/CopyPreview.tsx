"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";

interface CopyPreviewProps {
  platform: string;
  copyText: string;
  hashtags: string[];
  emojis: string[];
  businessName?: string;
}

const platformStyles: Record<string, any> = {
  facebook: {
    bg: "bg-white",
    accent: "text-blue-600",
    headerBg: "bg-white",
  },
  instagram: {
    bg: "bg-white",
    accent: "text-pink-600",
    headerBg: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400",
  },
  tiktok: {
    bg: "bg-black",
    accent: "text-white",
    headerBg: "bg-black",
  },
  linkedin: {
    bg: "bg-white",
    accent: "text-blue-700",
    headerBg: "bg-white",
  },
  twitter: {
    bg: "bg-white",
    accent: "text-sky-500",
    headerBg: "bg-white",
  },
};

export function CopyPreview({
  platform,
  copyText,
  hashtags,
  emojis,
  businessName = "Your Business",
}: CopyPreviewProps) {
  const styles = platformStyles[platform] || platformStyles.facebook;

  // Facebook Preview
  if (platform === "facebook") {
    return (
      <Card className="max-w-2xl">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10 bg-blue-500 text-white flex items-center justify-center">
              {businessName.charAt(0)}
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{businessName}</p>
              <p className="text-xs text-gray-500">Just now · Public</p>
            </div>
          </div>

          {/* Content */}
          <div className="mb-3">
            <p className="text-sm whitespace-pre-wrap">{copyText}</p>
            {hashtags.length > 0 && (
              <p className="text-sm text-blue-600 mt-2">
                {hashtags.map((tag) => `#${tag}`).join(" ")}
              </p>
            )}
          </div>

          {/* Mock Image */}
          <div className="bg-gray-100 h-64 rounded flex items-center justify-center mb-3">
            <span className="text-gray-400">Image Preview</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-around border-t pt-2">
            <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded">
              <Heart className="h-5 w-5" />
              <span className="text-sm">Like</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">Comment</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded">
              <Share2 className="h-5 w-5" />
              <span className="text-sm">Share</span>
            </button>
          </div>
        </div>
      </Card>
    );
  }

  // Instagram Preview
  if (platform === "instagram") {
    return (
      <Card className="max-w-md">
        <div className="bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center">
                {businessName.charAt(0)}
              </Avatar>
              <p className="font-semibold text-sm">{businessName}</p>
            </div>
            <MoreHorizontal className="h-5 w-5 text-gray-600" />
          </div>

          {/* Mock Image */}
          <div className="bg-gray-100 aspect-square flex items-center justify-center">
            <span className="text-gray-400">Image Preview</span>
          </div>

          {/* Actions */}
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Heart className="h-6 w-6" />
                <MessageCircle className="h-6 w-6" />
                <Share2 className="h-6 w-6" />
              </div>
            </div>

            {/* Content */}
            <div>
              <p className="text-sm">
                <span className="font-semibold">{businessName}</span>{" "}
                {copyText.length > 100 ? copyText.slice(0, 100) + "..." : copyText}
              </p>
              {hashtags.length > 0 && (
                <p className="text-sm text-blue-600 mt-1">
                  {hashtags.map((tag) => `#${tag}`).join(" ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // TikTok Preview
  if (platform === "tiktok") {
    return (
      <Card className="max-w-md bg-black text-white">
        <div className="relative aspect-[9/16] bg-gradient-to-b from-gray-900 to-black flex items-end">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-600">Video Preview</span>
          </div>
          <div className="p-4 w-full">
            <p className="font-semibold text-sm mb-1">@{businessName.toLowerCase().replace(/\s+/g, "")}</p>
            <p className="text-sm whitespace-pre-wrap mb-2">{copyText}</p>
            {hashtags.length > 0 && (
              <p className="text-sm">
                {hashtags.map((tag) => `#${tag}`).join(" ")}
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // LinkedIn Preview
  if (platform === "linkedin") {
    return (
      <Card className="max-w-2xl">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-12 w-12 bg-blue-700 text-white flex items-center justify-center">
              {businessName.charAt(0)}
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{businessName}</p>
              <p className="text-xs text-gray-500">Just now · Public</p>
            </div>
          </div>

          {/* Content */}
          <div className="mb-3">
            <p className="text-sm whitespace-pre-wrap">{copyText}</p>
            {hashtags.length > 0 && (
              <p className="text-sm text-blue-700 mt-2">
                {hashtags.map((tag) => `#${tag}`).join(" ")}
              </p>
            )}
          </div>

          {/* Mock Image */}
          <div className="bg-gray-100 h-64 rounded flex items-center justify-center mb-3">
            <span className="text-gray-400">Image Preview</span>
          </div>

          {/* Stats */}
          <div className="text-xs text-gray-600 mb-2 border-b pb-2">
            <span>0 likes · 0 comments</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-around">
            <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded">
              <Heart className="h-5 w-5" />
              <span className="text-sm">Like</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">Comment</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded">
              <Share2 className="h-5 w-5" />
              <span className="text-sm">Share</span>
            </button>
          </div>
        </div>
      </Card>
    );
  }

  // Twitter Preview
  if (platform === "twitter") {
    return (
      <Card className="max-w-2xl">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 bg-sky-500 text-white flex items-center justify-center">
              {businessName.charAt(0)}
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm">{businessName}</p>
                <p className="text-xs text-gray-500">
                  @{businessName.toLowerCase().replace(/\s+/g, "")} · Just now
                </p>
              </div>

              {/* Content */}
              <p className="text-sm whitespace-pre-wrap mb-2">{copyText}</p>
              {hashtags.length > 0 && (
                <p className="text-sm text-sky-500">
                  {hashtags.map((tag) => `#${tag}`).join(" ")}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-3 max-w-md">
                <button className="flex items-center gap-1 text-gray-500 hover:text-sky-500">
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-xs">0</span>
                </button>
                <button className="flex items-center gap-1 text-gray-500 hover:text-green-500">
                  <Share2 className="h-5 w-5" />
                  <span className="text-xs">0</span>
                </button>
                <button className="flex items-center gap-1 text-gray-500 hover:text-red-500">
                  <Heart className="h-5 w-5" />
                  <span className="text-xs">0</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}
