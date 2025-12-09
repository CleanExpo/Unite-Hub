"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ImageGeneratorProps {
  onGenerate?: (params: any) => Promise<void>;
}

export function ImageGenerator({ onGenerate }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("modern");
  const [platform, setPlatform] = useState("general");
  const [conceptType, setConceptType] = useState("social_post");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) {
return;
}

    setIsGenerating(true);
    try {
      await onGenerate?.({
        prompt,
        style,
        platform,
        conceptType,
      });
      setPrompt("");
    } finally {
      setIsGenerating(false);
    }
  };

  const suggestedPrompts = [
    "Modern minimalist product showcase with gradient background",
    "Professional business team collaboration in bright office",
    "Vibrant social media post with abstract geometric shapes",
    "Lifestyle product photography with natural lighting",
  ];

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 rounded-lg border border-purple-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
          <Wand2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">AI Image Generator</h3>
          <p className="text-sm text-gray-600">Create custom images with DALL-E</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Prompt */}
        <div>
          <Label>Describe your image</Label>
          <Textarea
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Suggested Prompts */}
        <div>
          <Label className="text-xs text-gray-600">Quick Ideas:</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestedPrompts.map((suggested, index) => (
              <button
                key={index}
                onClick={() => setPrompt(suggested)}
                className="text-xs px-2 py-1 bg-white border border-purple-200 rounded hover:bg-purple-50 transition-colors text-left"
              >
                {suggested}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Concept Type</Label>
            <Select value={conceptType} onValueChange={setConceptType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="social_post">Social Post</SelectItem>
                <SelectItem value="product_mockup">Product Mockup</SelectItem>
                <SelectItem value="marketing_visual">Marketing Visual</SelectItem>
                <SelectItem value="ad_creative">Ad Creative</SelectItem>
                <SelectItem value="brand_concept">Brand Concept</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="minimalist">Minimalist</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
                <SelectItem value="elegant">Elegant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!prompt || isGenerating}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2 h-12"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Generate Image
            </>
          )}
        </Button>

        {/* Info */}
        <div className="text-xs text-gray-600 text-center">
          AI-powered by DALL-E. Generation takes 10-30 seconds.
        </div>
      </div>
    </div>
  );
}
