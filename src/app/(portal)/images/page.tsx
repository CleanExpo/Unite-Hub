"use client";

import React from "react";
import { ImageGallery } from "@/components/images/ImageGallery";
import { ImageGenerator } from "@/components/images/ImageGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image as ImageIcon, Wand2 } from "lucide-react";

export default function ImagesPage() {
  // TODO: Replace with actual Convex data
  const mockImages = [
    {
      _id: "1",
      conceptType: "social_post",
      platform: "instagram",
      prompt:
        "Modern minimalist product showcase with gradient blue and purple background",
      imageUrl: "https://via.placeholder.com/1080x1080",
      style: "modern",
      colorPalette: ["#3B82F6", "#8B5CF6", "#EC4899"],
      dimensions: { width: 1080, height: 1080 },
      usageRecommendations:
        "Perfect for Instagram feed posts, especially for product announcements or brand awareness campaigns.",
      isUsed: false,
      createdAt: Date.now() - 86400000,
    },
    {
      _id: "2",
      conceptType: "ad_creative",
      platform: "facebook",
      prompt:
        "Professional team collaboration in bright modern office with natural lighting",
      imageUrl: "https://via.placeholder.com/1200x628",
      style: "professional",
      colorPalette: ["#10B981", "#3B82F6", "#F59E0B"],
      dimensions: { width: 1200, height: 628 },
      usageRecommendations:
        "Ideal for Facebook ads targeting B2B audiences. Works well for recruitment or team culture messaging.",
      isUsed: true,
      createdAt: Date.now() - 172800000,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Image Generation</h1>
        <p className="text-gray-600 mt-1">
          Create custom marketing visuals with DALL-E AI
        </p>
      </div>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate" className="gap-2">
            <Wand2 className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="gallery" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Gallery ({mockImages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6">
          <div className="max-w-3xl">
            <ImageGenerator
              onGenerate={async (params) => {
                console.log("Generate image:", params);
                // TODO: Implement DALL-E generation
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="mt-6">
          <ImageGallery
            images={mockImages}
            onDownload={(imageId) => console.log("Download:", imageId)}
            onUse={(imageId) => console.log("Use:", imageId)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
