"use client";

import React, { useState } from "react";
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
import { Sparkles, Plus, X } from "lucide-react";

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
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6">
      <h2 className="text-2xl font-bold font-mono text-white mb-6">Create New Campaign</h2>

      <div className="space-y-6">
        {/* Platform Selection */}
        <div>
          <Label className="text-white/60 font-mono text-xs">Platform</Label>
          <Select
            value={campaignData.platform}
            onValueChange={(value) =>
              setCampaignData({ ...campaignData, platform: value })
            }
          >
            <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white rounded-sm font-mono mt-1.5">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0a0a] border-white/[0.08] rounded-sm">
              {["facebook", "instagram", "tiktok", "linkedin"].map((p) => (
                <SelectItem key={p} value={p} className="text-white hover:bg-white/[0.04] font-mono capitalize">
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Campaign Name */}
        <div>
          <Label className="text-white/60 font-mono text-xs">Campaign Name</Label>
          <Input
            placeholder="Enter campaign name"
            value={campaignData.campaignName}
            onChange={(e) =>
              setCampaignData({ ...campaignData, campaignName: e.target.value })
            }
            className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 rounded-sm font-mono mt-1.5"
          />
        </div>

        {/* Themes */}
        <div>
          <Label className="text-white/60 font-mono text-xs">Campaign Themes</Label>
          <div className="flex gap-2 mb-2 mt-1.5">
            <Input
              placeholder="Add a theme"
              value={themeInput}
              onChange={(e) => setThemeInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addTheme()}
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 rounded-sm font-mono"
            />
            <button
              onClick={addTheme}
              className="px-3 py-1.5 text-sm font-mono rounded-sm border transition-all"
              style={{ color: '#00F5FF', backgroundColor: 'rgba(0,245,255,0.08)', borderColor: 'rgba(0,245,255,0.2)' }}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {campaignData.themes.map((theme) => (
              <span
                key={theme}
                className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-sm border border-white/[0.08] text-white/50 bg-white/[0.04]"
              >
                {theme}
                <button onClick={() => removeTheme(theme)} className="hover:text-white/80 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Ad Copy Variations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-white/60 font-mono text-xs">Ad Copy Variations</Label>
            <button
              onClick={addAdVariation}
              className="inline-flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-sm border transition-all border-white/[0.08] text-white/50 bg-white/[0.02] hover:bg-white/[0.06] hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Add Variation
            </button>
          </div>

          <div className="space-y-4">
            {campaignData.adCopyVariations.map((variation, index) => (
              <div key={index} className="p-4 border border-white/[0.06] rounded-sm bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-mono font-medium text-white">{variation.variant}</h4>
                  {campaignData.adCopyVariations.length > 1 && (
                    <button
                      onClick={() => removeAdVariation(index)}
                      className="p-1.5 text-xs font-mono rounded-sm transition-colors hover:bg-white/[0.04]"
                      style={{ color: '#FF4444' }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-white/60 font-mono text-xs">Ad Copy</Label>
                    <Textarea
                      placeholder="Enter ad copy"
                      value={variation.copy}
                      onChange={(e) => updateAdVariation(index, "copy", e.target.value)}
                      rows={3}
                      className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 rounded-sm font-mono mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-white/60 font-mono text-xs">Call to Action</Label>
                    <Input
                      placeholder="e.g., Shop Now, Learn More"
                      value={variation.cta}
                      onChange={(e) => updateAdVariation(index, "cta", e.target.value)}
                      className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 rounded-sm font-mono mt-1.5"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Generate Button */}
        <button
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-mono rounded-sm border transition-all"
          style={{
            color: '#FF00FF',
            backgroundColor: 'rgba(255,0,255,0.08)',
            borderColor: 'rgba(255,0,255,0.25)',
          }}
        >
          <Sparkles className="h-5 w-5" />
          AI Generate Campaign Content
        </button>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
          <button
            onClick={() => onSave?.(campaignData)}
            className="flex-1 py-2 text-sm font-mono rounded-sm border transition-all"
            style={{ color: '#00F5FF', backgroundColor: 'rgba(0,245,255,0.08)', borderColor: 'rgba(0,245,255,0.25)' }}
          >
            Save Campaign
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-sm font-mono rounded-sm border border-white/[0.08] text-white/50 hover:text-white hover:border-white/[0.15] transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
