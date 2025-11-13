"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Check, AlertCircle } from "lucide-react";

interface SEOOptimizerProps {
  seoData: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
  onUpdate: (updates: any) => void;
}

export function SEOOptimizer({ seoData, onUpdate }: SEOOptimizerProps) {
  const [metaTitle, setMetaTitle] = useState(seoData.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(
    seoData.metaDescription || ""
  );
  const [keywords, setKeywords] = useState(seoData.keywords.join(", "));
  const [ogTitle, setOgTitle] = useState(seoData.ogTitle || "");
  const [ogDescription, setOgDescription] = useState(seoData.ogDescription || "");

  const handleSave = () => {
    onUpdate({
      metaTitle,
      metaDescription,
      keywords: keywords.split(",").map((k) => k.trim()),
      ogTitle,
      ogDescription,
    });
  };

  const metaTitleLength = metaTitle.length;
  const metaDescLength = metaDescription.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          SEO Optimization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Meta Title */}
        <div className="space-y-2">
          <Label htmlFor="metaTitle">Meta Title</Label>
          <Input
            id="metaTitle"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="Enter meta title..."
            maxLength={60}
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {metaTitleLength}/60 characters
            </span>
            {metaTitleLength > 0 && metaTitleLength <= 60 ? (
              <Badge variant="success" className="gap-1">
                <Check className="h-3 w-3" />
                Optimal
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Too long
              </Badge>
            )}
          </div>
        </div>

        {/* Meta Description */}
        <div className="space-y-2">
          <Label htmlFor="metaDescription">Meta Description</Label>
          <Textarea
            id="metaDescription"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Enter meta description..."
            rows={3}
            maxLength={160}
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {metaDescLength}/160 characters
            </span>
            {metaDescLength >= 120 && metaDescLength <= 160 ? (
              <Badge variant="success" className="gap-1">
                <Check className="h-3 w-3" />
                Optimal
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {metaDescLength < 120 ? "Too short" : "Too long"}
              </Badge>
            )}
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <Label htmlFor="keywords">Focus Keywords</Label>
          <Input
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="keyword1, keyword2, keyword3..."
          />
          <p className="text-xs text-muted-foreground">
            Separate keywords with commas
          </p>
        </div>

        {/* Open Graph */}
        <div className="rounded-lg border p-4 space-y-4">
          <h4 className="font-medium text-sm">Social Media Preview (Open Graph)</h4>

          <div className="space-y-2">
            <Label htmlFor="ogTitle">OG Title</Label>
            <Input
              id="ogTitle"
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              placeholder="Same as meta title or custom..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogDescription">OG Description</Label>
            <Textarea
              id="ogDescription"
              value={ogDescription}
              onChange={(e) => setOgDescription(e.target.value)}
              placeholder="Same as meta description or custom..."
              rows={2}
            />
          </div>
        </div>

        {/* SEO Tips */}
        <div className="rounded-lg bg-muted p-4">
          <h4 className="font-medium text-sm mb-2">SEO Tips</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Include primary keyword in title and description</li>
            <li>• Keep title under 60 characters</li>
            <li>• Keep description between 120-160 characters</li>
            <li>• Make it compelling to increase click-through rate</li>
            <li>• Use unique titles for each page</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSave} className="gap-2">
            <Check className="h-4 w-4" />
            Save SEO Settings
          </Button>
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
