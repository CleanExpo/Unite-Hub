"use client";

import React, { useState } from "react";
import { MoreHorizontal, Play, Loader2 } from "lucide-react";
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
      className={`min-w-[320px] bg-white border rounded-2xl p-5 flex flex-col ${
        isHighlighted
          ? "border-2 border-[#B6F232] shadow-[0_4px_20px_rgba(182,242,50,0.15)]"
          : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between mb-4 text-gray-900 font-semibold text-sm">
        <span className="truncate pr-2">{title}</span>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Content Preview */}
      <div className="h-[350px] rounded-xl mb-5 overflow-hidden relative flex justify-center items-center">
        {type === "video" && (
          <div
            className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center text-white"
            style={
              thumbnailUrl
                ? { backgroundImage: `url(${thumbnailUrl})`, backgroundSize: "cover" }
                : {}
            }
          >
            {previewText && (
              <div className="absolute top-4 left-4 right-4 bg-white/90 text-black p-3 rounded-lg text-xs font-semibold shadow-lg">
                {previewText}
              </div>
            )}
            <div className="w-12 h-12 bg-white/30 rounded-full flex justify-center items-center mb-5 backdrop-blur-sm">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="text-sm opacity-80">Video Preview</span>
          </div>
        )}

        {type === "banner" && (
          <div
            className="w-full h-full bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 flex items-center justify-center text-gray-900 text-center p-5"
            style={
              thumbnailUrl
                ? { backgroundImage: `url(${thumbnailUrl})`, backgroundSize: "cover" }
                : {}
            }
          >
            {!thumbnailUrl && (
              <div>
                <div className="font-semibold mb-2">Creative Assets Preview</div>
                <div className="text-sm text-gray-600">(Banner Variations Layout)</div>
              </div>
            )}
          </div>
        )}

        {type === "blog" && (
          <div className="w-full h-full bg-white border border-gray-100 p-5 flex flex-col gap-3">
            <div
              className="w-full h-28 bg-gray-200 rounded-lg"
              style={
                thumbnailUrl
                  ? { backgroundImage: `url(${thumbnailUrl})`, backgroundSize: "cover" }
                  : {}
              }
            />
            <div className="font-semibold text-gray-900 text-sm">
              {previewText || "Generative Blog Post Title"}
            </div>
            <div className="h-2.5 bg-gray-100 rounded w-full" />
            <div className="h-2.5 bg-gray-100 rounded w-full" />
            <div className="h-2.5 bg-gray-100 rounded w-3/5" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto flex flex-col gap-2.5">
        <Button
          onClick={handleApprove}
          disabled={isApproving}
          className="w-full bg-[#B6F232] hover:bg-[#A3D92D] text-gray-900 font-semibold py-3"
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
          className="w-full py-3 font-semibold"
        >
          REQUEST ITERATION
        </Button>
      </div>
    </article>
  );
}
