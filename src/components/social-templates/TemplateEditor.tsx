"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { CharacterCounter } from "./CharacterCounter";
import { HashtagSuggester } from "./HashtagSuggester";
import { CopyPreview } from "./CopyPreview";

interface TemplateEditorProps {
  template: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: any) => Promise<void>;
}

const platforms = ["facebook", "instagram", "tiktok", "linkedin", "twitter"];
const categories = [
  "promotional",
  "educational",
  "engagement",
  "brand_story",
  "user_generated",
  "behind_scenes",
  "product_launch",
  "seasonal",
  "testimonial",
  "how_to",
];

export function TemplateEditor({
  template,
  isOpen,
  onClose,
  onSave,
}: TemplateEditorProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    templateName: template?.templateName || "",
    platform: template?.platform || "facebook",
    category: template?.category || "promotional",
    copyText: template?.copyText || "",
    hashtags: template?.hashtags || [],
    emojiSuggestions: template?.emojiSuggestions || [],
    callToAction: template?.callToAction || "",
    tags: template?.tags || [],
  });

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave({
        ...template,
        ...formData,
      });
      onClose();
    } catch (error) {
      console.error("Error saving template:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit Template" : "Create Template"}
          </DialogTitle>
          <DialogDescription>
            {template ? "Update your template" : "Create a new social copy template"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Template Name */}
              <div className="col-span-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={formData.templateName}
                  onChange={(e) =>
                    setFormData({ ...formData, templateName: e.target.value })
                  }
                  placeholder="e.g., Summer Product Launch"
                />
              </div>

              {/* Platform */}
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) =>
                    setFormData({ ...formData, platform: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c
                          .split("_")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Copy Text */}
              <div className="col-span-2">
                <Label htmlFor="copyText">Copy Text</Label>
                <Textarea
                  id="copyText"
                  value={formData.copyText}
                  onChange={(e) =>
                    setFormData({ ...formData, copyText: e.target.value })
                  }
                  placeholder="Write your engaging copy here..."
                  className="min-h-32"
                />
                <CharacterCounter
                  text={formData.copyText}
                  platform={formData.platform}
                />
              </div>

              {/* Hashtags */}
              <div className="col-span-2">
                <Label>Hashtags</Label>
                <HashtagSuggester
                  hashtags={formData.hashtags}
                  onChange={(hashtags) => setFormData({ ...formData, hashtags })}
                />
              </div>

              {/* Call to Action */}
              <div className="col-span-2">
                <Label htmlFor="callToAction">Call to Action</Label>
                <Input
                  id="callToAction"
                  value={formData.callToAction}
                  onChange={(e) =>
                    setFormData({ ...formData, callToAction: e.target.value })
                  }
                  placeholder="e.g., Shop Now, Learn More, Sign Up"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="flex justify-center p-4">
              <CopyPreview
                platform={formData.platform}
                copyText={formData.copyText}
                hashtags={formData.hashtags}
                emojis={formData.emojiSuggestions}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Template"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
