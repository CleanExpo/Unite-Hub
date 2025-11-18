"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AddCompetitorModalProps {
  clientId: string;
  competitor?: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCompetitorModal({
  clientId,
  competitor,
  onClose,
  onSuccess,
}: AddCompetitorModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    competitorName: "",
    website: "",
    description: "",
    category: "direct" as "direct" | "indirect" | "potential",
    strengths: [] as string[],
    weaknesses: [] as string[],
    pricing: {
      model: "",
      range: "",
    },
    targetAudience: [] as string[],
    marketingChannels: [] as string[],
    contentStrategy: "",
    socialPresence: {
      facebook: "",
      instagram: "",
      linkedin: "",
      tiktok: "",
      twitter: "",
    },
    logoUrl: "",
  });

  const [inputFields, setInputFields] = useState({
    strength: "",
    weakness: "",
    targetAudience: "",
    channel: "",
  });

  useEffect(() => {
    if (competitor) {
      setFormData({
        competitorName: competitor.competitorName || "",
        website: competitor.website || "",
        description: competitor.description || "",
        category: competitor.category || "direct",
        strengths: competitor.strengths || [],
        weaknesses: competitor.weaknesses || [],
        pricing: competitor.pricing || { model: "", range: "" },
        targetAudience: competitor.targetAudience || [],
        marketingChannels: competitor.marketingChannels || [],
        contentStrategy: competitor.contentStrategy || "",
        socialPresence: competitor.socialPresence || {},
        logoUrl: competitor.logoUrl || "",
      });
    }
  }, [competitor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert("Not authenticated");
        setLoading(false);
        return;
      }

      const url = competitor
        ? `/api/competitors/${competitor._id}`
        : "/api/competitors";

      const method = competitor ? "PUT" : "POST";

      const payload = competitor
        ? { updates: formData }
        : { clientId, ...formData };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save competitor");

      onSuccess();
    } catch (error) {
      console.error("Error saving competitor:", error);
      alert("Failed to save competitor");
    } finally {
      setLoading(false);
    }
  };

  const addItem = (field: "strengths" | "weaknesses" | "targetAudience" | "marketingChannels", inputKey: keyof typeof inputFields) => {
    const value = inputFields[inputKey].trim();
    if (value) {
      setFormData({
        ...formData,
        [field]: [...formData[field], value],
      });
      setInputFields({ ...inputFields, [inputKey]: "" });
    }
  };

  const removeItem = (field: "strengths" | "weaknesses" | "targetAudience" | "marketingChannels", index: number) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {competitor ? "Edit Competitor" : "Add Competitor"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div>
              <Label htmlFor="competitorName">Competitor Name *</Label>
              <Input
                id="competitorName"
                value={formData.competitorName}
                onChange={(e) =>
                  setFormData({ ...formData, competitorName: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="website">Website URL *</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                required
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                rows={3}
                placeholder="Brief description of the competitor's business..."
              />
            </div>

            <div>
              <Label>Category *</Label>
              <RadioGroup
                value={formData.category}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="direct" id="direct" />
                  <Label htmlFor="direct">Direct Competitor</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="indirect" id="indirect" />
                  <Label htmlFor="indirect">Indirect Competitor</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="potential" id="potential" />
                  <Label htmlFor="potential">Potential Competitor</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Analysis</h3>

            <div>
              <Label>Strengths</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={inputFields.strength}
                  onChange={(e) =>
                    setInputFields({ ...inputFields, strength: e.target.value })
                  }
                  placeholder="Add a strength..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem("strengths", "strength");
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => addItem("strengths", "strength")}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.strengths.map((strength, idx) => (
                  <Badge key={idx} className="pr-1">
                    {strength}
                    <button
                      type="button"
                      onClick={() => removeItem("strengths", idx)}
                      className="ml-2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Weaknesses</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={inputFields.weakness}
                  onChange={(e) =>
                    setInputFields({ ...inputFields, weakness: e.target.value })
                  }
                  placeholder="Add a weakness..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem("weaknesses", "weakness");
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => addItem("weaknesses", "weakness")}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.weaknesses.map((weakness, idx) => (
                  <Badge key={idx} variant="outline" className="pr-1">
                    {weakness}
                    <button
                      type="button"
                      onClick={() => removeItem("weaknesses", idx)}
                      className="ml-2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pricingModel">Pricing Model</Label>
                <Input
                  id="pricingModel"
                  value={formData.pricing.model}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, model: e.target.value },
                    })
                  }
                  placeholder="e.g., Subscription, One-time"
                />
              </div>
              <div>
                <Label htmlFor="pricingRange">Price Range</Label>
                <Input
                  id="pricingRange"
                  value={formData.pricing.range}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, range: e.target.value },
                    })
                  }
                  placeholder="e.g., $99-$299/mo"
                />
              </div>
            </div>
          </div>

          {/* Target Audience & Channels */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Market & Channels</h3>

            <div>
              <Label>Target Audience</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={inputFields.targetAudience}
                  onChange={(e) =>
                    setInputFields({
                      ...inputFields,
                      targetAudience: e.target.value,
                    })
                  }
                  placeholder="Add target segment..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem("targetAudience", "targetAudience");
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => addItem("targetAudience", "targetAudience")}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.targetAudience.map((audience, idx) => (
                  <Badge key={idx} variant="secondary" className="pr-1">
                    {audience}
                    <button
                      type="button"
                      onClick={() => removeItem("targetAudience", idx)}
                      className="ml-2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Marketing Channels</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={inputFields.channel}
                  onChange={(e) =>
                    setInputFields({ ...inputFields, channel: e.target.value })
                  }
                  placeholder="Add channel..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem("marketingChannels", "channel");
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => addItem("marketingChannels", "channel")}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.marketingChannels.map((channel, idx) => (
                  <Badge key={idx} variant="secondary" className="pr-1">
                    {channel}
                    <button
                      type="button"
                      onClick={() => removeItem("marketingChannels", idx)}
                      className="ml-2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Social Presence */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Social Media</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={formData.socialPresence.facebook}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialPresence: {
                        ...formData.socialPresence,
                        facebook: e.target.value,
                      },
                    })
                  }
                  placeholder="@username or URL"
                />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.socialPresence.instagram}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialPresence: {
                        ...formData.socialPresence,
                        instagram: e.target.value,
                      },
                    })
                  }
                  placeholder="@username or URL"
                />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={formData.socialPresence.linkedin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialPresence: {
                        ...formData.socialPresence,
                        linkedin: e.target.value,
                      },
                    })
                  }
                  placeholder="Company URL"
                />
              </div>
              <div>
                <Label htmlFor="tiktok">TikTok</Label>
                <Input
                  id="tiktok"
                  value={formData.socialPresence.tiktok}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialPresence: {
                        ...formData.socialPresence,
                        tiktok: e.target.value,
                      },
                    })
                  }
                  placeholder="@username or URL"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {competitor ? "Update Competitor" : "Add Competitor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
