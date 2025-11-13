"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Globe,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  ExternalLink,
} from "lucide-react";

interface CompetitorCardProps {
  competitor: {
    _id: string;
    competitorName: string;
    website: string;
    description: string;
    category: "direct" | "indirect" | "potential";
    strengths: string[];
    weaknesses: string[];
    pricing?: {
      model: string;
      range: string;
    };
    targetAudience: string[];
    marketingChannels: string[];
    logoUrl?: string;
  };
  onClick?: () => void;
}

export default function CompetitorCard({
  competitor,
  onClick,
}: CompetitorCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "direct":
        return "bg-red-100 text-red-800";
      case "indirect":
        return "bg-yellow-100 text-yellow-800";
      case "potential":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card
      className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {competitor.logoUrl ? (
            <img
              src={competitor.logoUrl}
              alt={competitor.competitorName}
              className="w-12 h-12 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              {competitor.competitorName}
            </h3>
            <Badge className={getCategoryColor(competitor.category)}>
              {competitor.category}
            </Badge>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {competitor.description}
      </p>

      {/* Website */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Globe className="w-4 h-4" />
        <a
          href={competitor.website}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600 truncate flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {competitor.website}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="space-y-3 mb-4">
        {competitor.strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-green-700 mb-2">
              <TrendingUp className="w-4 h-4" />
              Strengths
            </div>
            <div className="pl-6 space-y-1">
              {competitor.strengths.slice(0, 2).map((strength, idx) => (
                <p key={idx} className="text-sm text-gray-600">
                  • {strength}
                </p>
              ))}
              {competitor.strengths.length > 2 && (
                <p className="text-xs text-gray-500">
                  +{competitor.strengths.length - 2} more
                </p>
              )}
            </div>
          </div>
        )}

        {competitor.weaknesses.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-red-700 mb-2">
              <TrendingDown className="w-4 h-4" />
              Weaknesses
            </div>
            <div className="pl-6 space-y-1">
              {competitor.weaknesses.slice(0, 2).map((weakness, idx) => (
                <p key={idx} className="text-sm text-gray-600">
                  • {weakness}
                </p>
              ))}
              {competitor.weaknesses.length > 2 && (
                <p className="text-xs text-gray-500">
                  +{competitor.weaknesses.length - 2} more
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pricing */}
      {competitor.pricing && (
        <div className="flex items-center gap-2 text-sm mb-4 p-3 bg-gray-50 rounded">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <div>
            <span className="text-gray-500">Pricing:</span>{" "}
            <span className="font-medium">
              {competitor.pricing.model} - {competitor.pricing.range}
            </span>
          </div>
        </div>
      )}

      {/* Target Audience */}
      {competitor.targetAudience.length > 0 && (
        <div className="flex items-start gap-2 text-sm mb-3">
          <Users className="w-4 h-4 text-gray-500 mt-0.5" />
          <div>
            <span className="text-gray-500">Target:</span>{" "}
            <span className="font-medium">
              {competitor.targetAudience.slice(0, 2).join(", ")}
              {competitor.targetAudience.length > 2 && "..."}
            </span>
          </div>
        </div>
      )}

      {/* Marketing Channels */}
      {competitor.marketingChannels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {competitor.marketingChannels.slice(0, 3).map((channel) => (
            <Badge key={channel} variant="outline" className="text-xs">
              {channel}
            </Badge>
          ))}
          {competitor.marketingChannels.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{competitor.marketingChannels.length - 3}
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
}
