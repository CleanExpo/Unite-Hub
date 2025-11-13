"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Heart,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  TrendingUp,
  Clock,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";

interface TemplateCardProps {
  template: {
    _id: string;
    templateName: string;
    copyText: string;
    platform: string;
    category: string;
    hashtags: string[];
    emojiSuggestions: string[];
    characterCount: number;
    callToAction?: string;
    isFavorite: boolean;
    usageCount: number;
    performancePrediction: {
      estimatedReach: string;
      estimatedEngagement: string;
      bestTimeToPost: string;
    };
    tags: string[];
  };
  onFavorite: (id: string) => void;
  onEdit: (template: any) => void;
  onDelete: (id: string) => void;
  onCopy: (text: string) => void;
  onViewVariations: (template: any) => void;
}

const platformColors: Record<string, string> = {
  facebook: "bg-blue-500",
  instagram: "bg-pink-500",
  tiktok: "bg-black",
  linkedin: "bg-blue-700",
  twitter: "bg-sky-500",
};

const platformIcons: Record<string, string> = {
  facebook: "📘",
  instagram: "📷",
  tiktok: "🎵",
  linkedin: "💼",
  twitter: "🐦",
};

export function TemplateCard({
  template,
  onFavorite,
  onEdit,
  onDelete,
  onCopy,
  onViewVariations,
}: TemplateCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(template.copyText);
    onCopy(template.copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{platformIcons[template.platform]}</span>
            <div>
              <h3 className="font-semibold text-sm">{template.templateName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={`${platformColors[template.platform]} text-white text-xs`}
                >
                  {template.platform}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {template.category}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onFavorite(template._id)}
              className="h-8 w-8"
            >
              <Heart
                className={`h-4 w-4 ${
                  template.isFavorite ? "fill-red-500 text-red-500" : ""
                }`}
              />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(template)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewVariations(template)}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Variations
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(template._id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Copy Text Preview */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <p className="line-clamp-3 text-gray-700">{template.copyText}</p>
        </div>

        {/* Hashtags and Emojis */}
        <div className="flex flex-wrap gap-2">
          {template.hashtags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-xs text-blue-600">
              #{tag}
            </span>
          ))}
          {template.hashtags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{template.hashtags.length - 3} more
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3 text-gray-500" />
            <span className="text-gray-600">{template.characterCount} chars</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-gray-500" />
            <span className="text-gray-600">
              {template.performancePrediction.estimatedReach}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-gray-500" />
            <span className="text-gray-600">Used {template.usageCount}x</span>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="bg-green-50 border border-green-200 rounded p-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-green-700">
              Est. Engagement: {template.performancePrediction.estimatedEngagement}
            </span>
            <span className="text-green-600">
              Best: {template.performancePrediction.bestTimeToPost}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleCopy}
            className="flex-1"
            variant={copied ? "default" : "outline"}
          >
            <Copy className="h-4 w-4 mr-2" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            onClick={() => onViewVariations(template)}
            variant="outline"
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            Variations ({template.variations?.length || 0})
          </Button>
        </div>
      </div>
    </Card>
  );
}
