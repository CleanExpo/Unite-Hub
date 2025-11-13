"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Plus, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface VariationsModalProps {
  template: {
    _id: string;
    templateName: string;
    copyText: string;
    platform: string;
    variations: Array<{ copy: string; tone: string }>;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerateMore: (templateId: string, tones: string[]) => Promise<void>;
}

const availableTones = [
  { value: "professional", label: "Professional", description: "Formal and polished" },
  { value: "casual", label: "Casual", description: "Friendly and relaxed" },
  { value: "inspirational", label: "Inspirational", description: "Motivating and uplifting" },
  { value: "humorous", label: "Humorous", description: "Fun and entertaining" },
  { value: "urgent", label: "Urgent", description: "Time-sensitive and action-driven" },
  { value: "educational", label: "Educational", description: "Informative and teaching" },
  { value: "emotional", label: "Emotional", description: "Heartfelt and touching" },
];

export function VariationsModal({
  template,
  isOpen,
  onClose,
  onGenerateMore,
}: VariationsModalProps) {
  const [generating, setGenerating] = useState(false);
  const [selectedTones, setSelectedTones] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleGenerateMore = async () => {
    if (!template || selectedTones.length === 0) return;

    setGenerating(true);
    try {
      await onGenerateMore(template._id, selectedTones);
      setSelectedTones([]);
    } catch (error) {
      console.error("Error generating variations:", error);
    } finally {
      setGenerating(false);
    }
  };

  const toggleTone = (tone: string) => {
    setSelectedTones((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone]
    );
  };

  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template.templateName}</DialogTitle>
          <DialogDescription>
            View and generate tone variations for this template
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="variations" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="variations">
              Variations ({template.variations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="generate">Generate More</TabsTrigger>
          </TabsList>

          <TabsContent value="variations" className="space-y-4">
            {/* Original Copy */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Original Copy</h4>
                <Badge variant="outline">Original</Badge>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 relative">
                <p className="text-sm text-gray-700">{template.copyText}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => handleCopy(template.copyText, -1)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Variations */}
            {template.variations && template.variations.length > 0 ? (
              <div className="space-y-3">
                {template.variations.map((variation, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm capitalize">
                        {variation.tone} Tone
                      </h4>
                      <Badge variant="secondary">{variation.tone}</Badge>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 relative">
                      <p className="text-sm text-gray-700">{variation.copy}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => handleCopy(variation.copy, index)}
                      >
                        <Copy
                          className={`h-4 w-4 ${
                            copiedIndex === index ? "text-green-600" : ""
                          }`}
                        />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No variations yet. Generate some in the next tab!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-3">Select Tones</h4>
              <div className="grid grid-cols-2 gap-3">
                {availableTones.map((tone) => (
                  <div
                    key={tone.value}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedTones.includes(tone.value)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => toggleTone(tone.value)}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={selectedTones.includes(tone.value)}
                        onCheckedChange={() => toggleTone(tone.value)}
                      />
                      <div>
                        <p className="font-medium text-sm">{tone.label}</p>
                        <p className="text-xs text-gray-600">{tone.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerateMore}
              disabled={generating || selectedTones.length === 0}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Variations...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate {selectedTones.length} Variation
                  {selectedTones.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
