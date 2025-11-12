"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Sparkles, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CampaignBuilderProps {
  onSave?: (campaign: any) => void;
  onCancel?: () => void;
}

export function CampaignBuilder({ onSave, onCancel }: CampaignBuilderProps) {
  const [campaignData, setCampaignData] = useState({
    platform: "",
    campaignName: "",
    themes: [] as string[],
    adCopyVariations: [{ variant: "Variation 1", copy: "", cta: "" }],
    status: "draft",
  });

  const [themeInput, setThemeInput] = useState("");

  const addTheme = () => {
    if (themeInput && !campaignData.themes.includes(themeInput)) {
      setCampaignData({
        ...campaignData,
        themes: [...campaignData.themes, themeInput],
      });
      setThemeInput("");
    }
  };

  const removeTheme = (theme: string) => {
    setCampaignData({
      ...campaignData,
      themes: campaignData.themes.filter((t) => t !== theme),
    });
  };

  const addAdVariation = () => {
    setCampaignData({
      ...campaignData,
      adCopyVariations: [
        ...campaignData.adCopyVariations,
        { variant: `Variation ${campaignData.adCopyVariations.length + 1}`, copy: "", cta: "" },
      ],
    });
  };

  const removeAdVariation = (index: number) => {
    setCampaignData({
      ...campaignData,
      adCopyVariations: campaignData.adCopyVariations.filter((_, i) => i !== index),
    });
  };

  const updateAdVariation = (index: number, field: string, value: string) => {
    const updated = [...campaignData.adCopyVariations];
    updated[index] = { ...updated[index], [field]: value };
    setCampaignData({ ...campaignData, adCopyVariations: updated });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Campaign</h2>

      <div className="space-y-6">
        {/* Platform Selection */}
        <div>
          <Label>Platform</Label>
          <Select
            value={campaignData.platform}
            onValueChange={(value) =>
              setCampaignData({ ...campaignData, platform: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campaign Name */}
        <div>
          <Label>Campaign Name</Label>
          <Input
            placeholder="Enter campaign name"
            value={campaignData.campaignName}
            onChange={(e) =>
              setCampaignData({ ...campaignData, campaignName: e.target.value })
            }
          />
        </div>

        {/* Themes */}
        <div>
          <Label>Campaign Themes</Label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add a theme"
              value={themeInput}
              onChange={(e) => setThemeInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addTheme()}
            />
            <Button onClick={addTheme} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {campaignData.themes.map((theme) => (
              <Badge key={theme} variant="secondary" className="gap-1">
                {theme}
                <button onClick={() => removeTheme(theme)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Ad Copy Variations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Ad Copy Variations</Label>
            <Button onClick={addAdVariation} size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Variation
            </Button>
          </div>

          <div className="space-y-4">
            {campaignData.adCopyVariations.map((variation, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{variation.variant}</h4>
                  {campaignData.adCopyVariations.length > 1 && (
                    <Button
                      onClick={() => removeAdVariation(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Ad Copy</Label>
                    <Textarea
                      placeholder="Enter ad copy"
                      value={variation.copy}
                      onChange={(e) => updateAdVariation(index, "copy", e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Call to Action</Label>
                    <Input
                      placeholder="e.g., Shop Now, Learn More"
                      value={variation.cta}
                      onChange={(e) => updateAdVariation(index, "cta", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Generate Button */}
        <Button
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2"
        >
          <Sparkles className="h-5 w-5" />
          AI Generate Campaign Content
        </Button>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <Button onClick={() => onSave?.(campaignData)} className="flex-1">
            Save Campaign
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
