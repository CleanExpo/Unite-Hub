"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, Minus, ExternalLink } from "lucide-react";

interface Competitor {
  _id: string;
  competitorName: string;
  website: string;
  category: "direct" | "indirect" | "potential";
  strengths: string[];
  weaknesses: string[];
  pricing?: {
    model: string;
    range: string;
  };
  targetAudience: string[];
  marketingChannels: string[];
  socialPresence: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
    twitter?: string;
  };
}

interface ComparisonMatrixProps {
  competitors: Competitor[];
  yourBusiness?: {
    name: string;
    pricing?: { model: string; range: string };
    channels?: string[];
  };
}

export default function ComparisonMatrix({
  competitors,
  yourBusiness,
}: ComparisonMatrixProps) {
  if (competitors.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">
          Select at least 2 competitors to compare
        </p>
      </Card>
    );
  }

  // Get all unique channels
  const allChannels = Array.from(
    new Set(
      competitors.flatMap((c) => c.marketingChannels).concat(yourBusiness?.channels || [])
    )
  );

  // Get all social platforms
  const socialPlatforms = ["facebook", "instagram", "linkedin", "tiktok", "twitter"];

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
    <div className="space-y-6">
      {/* Overview Comparison */}
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">Feature</TableHead>
              {yourBusiness && (
                <TableHead className="bg-blue-50">
                  <div className="font-semibold">{yourBusiness.name}</div>
                  <Badge className="mt-1 bg-blue-600">You</Badge>
                </TableHead>
              )}
              {competitors.map((comp) => (
                <TableHead key={comp._id}>
                  <div className="font-semibold">{comp.competitorName}</div>
                  <Badge className={`mt-1 ${getCategoryColor(comp.category)}`}>
                    {comp.category}
                  </Badge>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Website */}
            <TableRow>
              <TableCell className="font-medium">Website</TableCell>
              {yourBusiness && <TableCell className="bg-blue-50">-</TableCell>}
              {competitors.map((comp) => (
                <TableCell key={comp._id}>
                  <a
                    href={comp.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm"
                  >
                    Visit
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </TableCell>
              ))}
            </TableRow>

            {/* Pricing Model */}
            <TableRow>
              <TableCell className="font-medium">Pricing Model</TableCell>
              {yourBusiness && (
                <TableCell className="bg-blue-50">
                  {yourBusiness.pricing?.model || "-"}
                </TableCell>
              )}
              {competitors.map((comp) => (
                <TableCell key={comp._id}>
                  {comp.pricing?.model || "-"}
                </TableCell>
              ))}
            </TableRow>

            {/* Price Range */}
            <TableRow>
              <TableCell className="font-medium">Price Range</TableCell>
              {yourBusiness && (
                <TableCell className="bg-blue-50">
                  {yourBusiness.pricing?.range || "-"}
                </TableCell>
              )}
              {competitors.map((comp) => (
                <TableCell key={comp._id}>
                  {comp.pricing?.range || "-"}
                </TableCell>
              ))}
            </TableRow>

            {/* Target Audiences */}
            <TableRow>
              <TableCell className="font-medium">Target Audience</TableCell>
              {yourBusiness && <TableCell className="bg-blue-50">-</TableCell>}
              {competitors.map((comp) => (
                <TableCell key={comp._id}>
                  <div className="text-sm space-y-1">
                    {comp.targetAudience.slice(0, 2).map((audience, idx) => (
                      <div key={idx}>{audience}</div>
                    ))}
                    {comp.targetAudience.length > 2 && (
                      <div className="text-gray-500 text-xs">
                        +{comp.targetAudience.length - 2} more
                      </div>
                    )}
                  </div>
                </TableCell>
              ))}
            </TableRow>

            {/* Strengths Count */}
            <TableRow>
              <TableCell className="font-medium">Key Strengths</TableCell>
              {yourBusiness && <TableCell className="bg-blue-50">-</TableCell>}
              {competitors.map((comp) => (
                <TableCell key={comp._id}>
                  <Badge variant="outline">{comp.strengths.length} identified</Badge>
                </TableCell>
              ))}
            </TableRow>

            {/* Weaknesses Count */}
            <TableRow>
              <TableCell className="font-medium">Weaknesses</TableCell>
              {yourBusiness && <TableCell className="bg-blue-50">-</TableCell>}
              {competitors.map((comp) => (
                <TableCell key={comp._id}>
                  <Badge variant="outline">{comp.weaknesses.length} identified</Badge>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {/* Marketing Channels Comparison */}
      <Card className="overflow-x-auto">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Marketing Channels</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">Channel</TableHead>
              {yourBusiness && (
                <TableHead className="bg-blue-50">{yourBusiness.name}</TableHead>
              )}
              {competitors.map((comp) => (
                <TableHead key={comp._id}>{comp.competitorName}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {allChannels.map((channel) => (
              <TableRow key={channel}>
                <TableCell className="font-medium capitalize">{channel}</TableCell>
                {yourBusiness && (
                  <TableCell className="bg-blue-50 text-center">
                    {yourBusiness.channels?.includes(channel) ? (
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                    )}
                  </TableCell>
                )}
                {competitors.map((comp) => (
                  <TableCell key={comp._id} className="text-center">
                    {comp.marketingChannels.includes(channel) ? (
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Social Media Presence */}
      <Card className="overflow-x-auto">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Social Media Presence</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">Platform</TableHead>
              {yourBusiness && (
                <TableHead className="bg-blue-50">{yourBusiness.name}</TableHead>
              )}
              {competitors.map((comp) => (
                <TableHead key={comp._id}>{comp.competitorName}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {socialPlatforms.map((platform) => (
              <TableRow key={platform}>
                <TableCell className="font-medium capitalize">{platform}</TableCell>
                {yourBusiness && (
                  <TableCell className="bg-blue-50 text-center">
                    <Minus className="w-5 h-5 text-gray-300 mx-auto" />
                  </TableCell>
                )}
                {competitors.map((comp) => (
                  <TableCell key={comp._id} className="text-center">
                    {comp.socialPresence[platform as keyof typeof comp.socialPresence] ? (
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
