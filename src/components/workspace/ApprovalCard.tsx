/* eslint-disable no-console */
"use client";

import React, { useState } from "react";
import { MoreHorizontal, Play, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ContentType = "video" | "banner" | "blog";

export interface ApprovalCardProps {
  id: string;
  title: string;
  type: ContentType;
  platform?: string;
  thumbnailUrl?: string;
  previewText?: string;
  isHighlighted?: boolean;
  onApprove: (id: string) => Promise<void>;
  onIterate: (id: string) => void;
}

export function ApprovalCard({
  id,
  title,
  type,
  platform,
  thumbnailUrl,
  previewText,
  isHighlighted = false,
  onApprove,
  onIterate,
}: ApprovalCardProps) {
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(id);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <article
      className={`min-w-[300px] max-w-[300px] bg-bg-card/60 backdrop-blur-md border rounded-2xl p-4 flex flex-col transition-all duration-300 hover:bg-bg-card/80 ${
        isHighlighted
          ? "border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.15)]"
          : "border-cyan-900/30 hover:border-cyan-700/50"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <span className="text-white font-medium text-sm leading-tight pr-2 flex-1">
          {title}
        </span>
        <button className="text-gray-500 hover:text-cyan-400 transition-colors flex-shrink-0">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Content Preview */}
      <div className="h-[280px] rounded-xl mb-4 overflow-hidden relative">
        {type === "video" && (
          <div
            className="w-full h-full bg-gradient-to-br from-[#1a3a5c] to-[#0d2137] flex flex-col items-center justify-center relative"
            style={
              thumbnailUrl
                ? { backgroundImage: `url(${thumbnailUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : {}
            }
          >
            {/* Video overlay content */}
            {previewText && (
              <div className="absolute top-3 left-3 right-3 bg-white/95 text-gray-900 p-2.5 rounded-lg text-[11px] font-medium shadow-lg">
                <div className="text-[10px] text-gray-500 mb-1">Generated ad text:</div>
                {previewText}
              </div>
            )}

            {/* Play button */}
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex justify-center items-center border border-white/30 hover:bg-white/30 transition-colors cursor-pointer">
              <Play className="w-6 h-6 text-white fill-white ml-1" />
            </div>

            {/* Platform badge */}
            {platform && (
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white font-medium uppercase">
                {platform}
              </div>
            )}
          </div>
        )}

        {type === "banner" && (
          <div
            className="w-full h-full bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500 flex flex-col items-center justify-center p-4 relative"
            style={
              thumbnailUrl
                ? { backgroundImage: `url(${thumbnailUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : {}
            }
          >
            {!thumbnailUrl && (
              <>
                {/* Banana illustration placeholder */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-32 h-20 bg-yellow-500/50 rounded-full transform -rotate-12 relative">
                    <div className="absolute inset-2 bg-yellow-400 rounded-full"></div>
                  </div>
                  <div className="w-28 h-16 bg-yellow-500/50 rounded-full transform rotate-6 relative -mt-4">
                    <div className="absolute inset-2 bg-yellow-400 rounded-full"></div>
                  </div>
                </div>
                <div className="absolute bottom-4 text-yellow-800/80 text-xs font-semibold">
                  Omni-channel Banner Set
                </div>
              </>
            )}

            {/* Platform badge */}
            {platform && (
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white font-medium uppercase">
                {platform}
              </div>
            )}
          </div>
        )}

        {type === "blog" && (
          <div className="w-full h-full bg-bg-card border border-cyan-900/30 p-4 flex flex-col gap-3 rounded-xl">
            {/* Blog header image */}
            <div
              className="w-full h-24 bg-gradient-to-br from-cyan-900/50 to-[#0d2137] rounded-lg flex items-center justify-center"
              style={
                thumbnailUrl
                  ? { backgroundImage: `url(${thumbnailUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : {}
              }
            >
              {!thumbnailUrl && (
                <ImageIcon className="w-8 h-8 text-cyan-700/50" />
              )}
            </div>

            {/* Blog title */}
            <div className="font-semibold text-white text-sm leading-tight">
              {previewText || "10 Tips for Summer Marketing Success"}
            </div>

            {/* Content lines placeholder */}
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-2 bg-cyan-900/30 rounded w-full" />
              <div className="h-2 bg-cyan-900/30 rounded w-full" />
              <div className="h-2 bg-cyan-900/30 rounded w-4/5" />
              <div className="h-2 bg-cyan-900/30 rounded w-full mt-2" />
              <div className="h-2 bg-cyan-900/30 rounded w-3/4" />
            </div>

            {/* SEO tag */}
            <div className="flex gap-2">
              <span className="bg-cyan-500/20 text-cyan-400 text-[10px] px-2 py-1 rounded font-medium">
                SEO Optimized
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-1 rounded font-medium">
                AI Images
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto flex flex-col gap-2">
        <Button
          onClick={handleApprove}
          disabled={isApproving}
          className="w-full bg-lime-400 hover:bg-lime-300 text-gray-900 font-semibold py-2.5 text-sm rounded-lg transition-all duration-200 shadow-lg shadow-lime-400/20 hover:shadow-lime-400/40"
        >
          {isApproving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Deploying...
            </>
          ) : (
            "APPROVE & DEPLOY"
          )}
        </Button>
        <Button
          onClick={() => onIterate(id)}
          variant="outline"
          className="w-full py-2.5 text-sm font-medium border-cyan-800/50 text-gray-300 hover:bg-cyan-900/30 hover:text-white hover:border-cyan-700/50 bg-transparent rounded-lg transition-all duration-200"
        >
          REQUEST ITERATION
        </Button>
      </div>
    </article>
  );
}
