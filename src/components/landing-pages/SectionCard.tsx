"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Image as ImageIcon,
  StickyNote
} from "lucide-react";
import { CopyEditor } from "./CopyEditor";

interface SectionCardProps {
  section: any;
  sectionIndex: number;
  onUpdate: (updates: any) => void;
  onRegenerate: () => void;
  onToggleComplete: (completed: boolean) => void;
}

export function SectionCard({
  section,
  sectionIndex,
  onUpdate,
  onRegenerate,
  onToggleComplete,
}: SectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card className={section.completed ? "opacity-75" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={section.completed}
              onCheckedChange={(checked) => onToggleComplete(!!checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">
                  {sectionIndex + 1}. {section.sectionName}
                </CardTitle>
                {section.aiGenerated && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI
                  </Badge>
                )}
              </div>
              {section.headline && !isExpanded && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                  {section.headline}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Copy Editor */}
          <CopyEditor
            headline={section.headline}
            subheadline={section.subheadline}
            bodyCopy={section.bodyCopy}
            cta={section.cta}
            onUpdate={(updates) => {
              onUpdate(updates);
              setIsEditing(false);
            }}
            isEditing={isEditing}
            onToggleEdit={() => setIsEditing(!isEditing)}
          />

          {/* Image Prompt */}
          {section.imagePrompt && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Image Suggestion</span>
              </div>
              <p className="text-sm text-muted-foreground">{section.imagePrompt}</p>
              <Button variant="outline" size="sm" className="mt-2">
                Generate Image
              </Button>
            </div>
          )}

          {/* Notes */}
          {section.notes && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Notes</span>
              </div>
              <p className="text-sm text-muted-foreground">{section.notes}</p>
            </div>
          )}

          {/* Alternatives */}
          {section.alternatives && section.alternatives.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Alternative Variations</h4>
              {section.alternatives.map((alt: any, idx: number) => (
                <Card key={idx} className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="font-medium text-sm mb-1">{alt.headline}</p>
                    <p className="text-sm text-muted-foreground">{alt.subheadline}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        onUpdate({
                          headline: alt.headline,
                          subheadline: alt.subheadline,
                          bodyCopy: alt.bodyCopy,
                          cta: alt.cta,
                        })
                      }
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      Use This
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate AI Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Generate alternatives
              }}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate Alternatives
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
