"use client";

import { Heart, Eye, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ComponentCardProps {
  component: {
    id: string;
    name: string;
    description: string;
    category: string;
    style_tag: string;
    is_featured: boolean;
    view_count: number;
    rating: number | null;
    has_dark_mode: boolean;
    has_mobile_variant: boolean;
  };
  isFavorited: boolean;
  onFavoriteToggle: (id: string) => void;
  onPreviewClick: (component: any) => void;
}

export default function ComponentCard({
  component,
  isFavorited,
  onFavoriteToggle,
  onPreviewClick,
}: ComponentCardProps) {
  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      header: "bg-blue-100 text-blue-800",
      hero: "bg-purple-100 text-purple-800",
      card: "bg-pink-100 text-pink-800",
      form: "bg-green-100 text-green-800",
      footer: "bg-gray-100 text-gray-800",
      navigation: "bg-indigo-100 text-indigo-800",
    };
    return colors[cat] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Header with featured badge */}
      <div className="relative bg-gradient-to-r from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-900 h-32">
        {component.is_featured && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-amber-500 text-white">Featured</Badge>
          </div>
        )}
      </div>

      <CardContent className="flex-grow pt-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{component.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{component.description}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className={getCategoryColor(component.category)}>{component.category}</Badge>
          <Badge variant="outline" className="text-xs">
            {component.style_tag}
          </Badge>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{component.view_count}</span>
          </div>
          {component.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{component.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Variants */}
        {(component.has_dark_mode || component.has_mobile_variant) && (
          <div className="mt-3 text-xs text-gray-500">
            {component.has_dark_mode && <span>✓ Dark Mode </span>}
            {component.has_mobile_variant && <span>✓ Mobile</span>}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onPreviewClick(component)}>
          Preview
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFavoriteToggle(component.id)}
          className={isFavorited ? "text-red-500" : ""}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
        </Button>
      </CardFooter>
    </Card>
  );
}
