"use client";

import React, { useState } from "react";
import { Star, Copy, CheckCircle2, TrendingUp, Facebook, Instagram, Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Hook {
  _id: string;
  hookText: string;
  platform: string;
  category: string;
  scriptType: string;
  effectivenessScore: number;
  contextExplanation: string;
  suggestedUse: string;
  tags: string[];
  isFavorite: boolean;
  usageCount: number;
}

interface HookCardProps {
  hook: Hook;
  onToggleFavorite?: (hookId: string) => void;
  onUse?: (hookId: string) => void;
}

const platformIcons: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  email: Mail,
};

export function HookCard({ hook, onToggleFavorite, onUse }: HookCardProps) {
  const [copied, setCopied] = useState(false);

  const PlatformIcon = platformIcons[hook.platform] || Mail;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hook.hookText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <PlatformIcon className="h-4 w-4 text-blue-700" />
          </div>
          <div>
            <Badge variant="secondary" className="text-xs capitalize">
              {hook.scriptType.replace(/_/g, " ")}
            </Badge>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-green-700">
                {hook.effectivenessScore}/10
              </span>
            </div>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onToggleFavorite?.(hook._id)}
                className={`p-1.5 rounded-lg transition-colors ${
                  hook.isFavorite
                    ? "bg-amber-100 text-amber-600"
                    : "text-gray-400 hover:bg-gray-100"
                }`}
              >
                <Star
                  className={`h-4 w-4 ${hook.isFavorite ? "fill-current" : ""}`}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {hook.isFavorite ? "Remove from favorites" : "Add to favorites"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Hook Text */}
      <div className="mb-4">
        <p className="text-gray-900 font-medium leading-relaxed line-clamp-3">
          {hook.hookText}
        </p>
      </div>

      {/* Context */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-700 line-clamp-2">{hook.contextExplanation}</p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {hook.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
        {hook.tags.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{hook.tags.length - 3}
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className="flex-1 gap-2"
        >
          {copied ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>
        <Button onClick={() => onUse?.(hook._id)} size="sm" className="flex-1">
          Use Hook
        </Button>
      </div>

      {/* Usage Count */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Used <span className="font-medium text-gray-700">{hook.usageCount}</span> times
        </p>
      </div>
    </div>
  );
}
