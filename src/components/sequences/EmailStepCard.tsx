"use client";

/**
 * Email Step Card Component
 * Individual email step in a sequence with editing capabilities
 */

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Save, X, Sparkles, Eye, Trash2, Calendar } from "lucide-react";

interface EmailStepCardProps {
  step: {
    stepNumber: number;
    stepName: string;
    dayDelay: number;
    subjectLine: string;
    preheaderText?: string;
    emailBody: string;
    cta: {
      text: string;
      url?: string;
      type: "button" | "link" | "reply" | "calendar";
    };
    aiGenerated: boolean;
    aiReasoning?: string;
    personalizationTags: string[];
    metrics?: {
      sent: number;
      opened: number;
      clicked: number;
      replied: number;
    };
  };
  stepNumber: number;
  onUpdate: (data: any) => void;
  onRegenerate: () => void;
  onDelete: () => void;
}

export function EmailStepCard({
  step,
  stepNumber,
  onUpdate,
  onRegenerate,
  onDelete,
}: EmailStepCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    stepName: step.stepName,
    dayDelay: step.dayDelay,
    subjectLine: step.subjectLine,
    preheaderText: step.preheaderText || "",
    emailBody: step.emailBody,
    ctaText: step.cta.text,
    ctaUrl: step.cta.url || "",
    ctaType: step.cta.type || "button", // ✅ Default to "button" if undefined
  });

  const handleSave = () => {
    onUpdate({
      stepName: formData.stepName,
      dayDelay: formData.dayDelay,
      subjectLine: formData.subjectLine,
      preheaderText: formData.preheaderText,
      emailBody: formData.emailBody,
      cta: {
        text: formData.ctaText,
        url: formData.ctaUrl,
        type: formData.ctaType,
      },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      stepName: step.stepName,
      dayDelay: step.dayDelay,
      subjectLine: step.subjectLine,
      preheaderText: step.preheaderText || "",
      emailBody: step.emailBody,
      ctaText: step.cta.text,
      ctaUrl: step.cta.url || "",
      ctaType: step.cta.type || "button", // ✅ Default to "button" if undefined
    });
    setIsEditing(false);
  };

  const calculateOpenRate = () => {
    if (!step.metrics || step.metrics.sent === 0) return "0%";
    return ((step.metrics.opened / step.metrics.sent) * 100).toFixed(1) + "%";
  };

  const calculateClickRate = () => {
    if (!step.metrics || step.metrics.sent === 0) return "0%";
    return ((step.metrics.clicked / step.metrics.sent) * 100).toFixed(1) + "%";
  };

  return (
    <Card className={isEditing ? "border-primary" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Step {stepNumber}</Badge>
              <Badge variant="outline">
                <Calendar className="h-3 w-3 mr-1" />
                Day {step.dayDelay}
              </Badge>
              {step.aiGenerated && (
                <Badge variant="outline" className="text-purple-600">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Generated
                </Badge>
              )}
            </div>

            {isEditing ? (
              <Input
                value={formData.stepName}
                onChange={(e) => setFormData({ ...formData, stepName: e.target.value })}
                placeholder="Step name"
                className="max-w-md"
              />
            ) : (
              <CardTitle>{step.stepName}</CardTitle>
            )}

            {step.aiReasoning && !isEditing && (
              <CardDescription className="text-xs italic">
                {step.aiReasoning}
              </CardDescription>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRegenerate}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}

            {isEditing && (
              <>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label>Day Delay</Label>
              <Input
                type="number"
                value={formData.dayDelay}
                onChange={(e) => setFormData({ ...formData, dayDelay: parseInt(e.target.value) })}
                min={0}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Days after previous step (0 for first email)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                value={formData.subjectLine}
                onChange={(e) => setFormData({ ...formData, subjectLine: e.target.value })}
                placeholder="Compelling subject line..."
              />
              <p className="text-xs text-muted-foreground">
                {formData.subjectLine.length} characters (40-50 optimal)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Preheader Text (Optional)</Label>
              <Input
                value={formData.preheaderText}
                onChange={(e) => setFormData({ ...formData, preheaderText: e.target.value })}
                placeholder="Preview text shown in inbox..."
              />
            </div>

            <div className="space-y-2">
              <Label>Email Body</Label>
              <Textarea
                value={formData.emailBody}
                onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                placeholder="Email content with personalization tags like {firstName}..."
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use personalization: {"{firstName}"}, {"{company}"}, {"{industry}"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>CTA Text</Label>
                <Input
                  value={formData.ctaText}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  placeholder="e.g., Schedule a call"
                />
              </div>

              <div className="space-y-2">
                <Label>CTA URL</Label>
                <Input
                  value={formData.ctaUrl}
                  onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>CTA Type</Label>
                <Select value={formData.ctaType} onValueChange={(value: any) => setFormData({ ...formData, ctaType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="button">Button</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="reply">Reply</SelectItem>
                    <SelectItem value="calendar">Calendar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Subject Line</p>
              <p className="font-medium">{step.subjectLine}</p>
              {step.preheaderText && (
                <p className="text-sm text-muted-foreground mt-1">{step.preheaderText}</p>
              )}
            </div>

            {showPreview && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{step.emailBody}</p>
                <div className="mt-4">
                  <Button variant="default" size="sm">
                    {step.cta.text}
                  </Button>
                </div>
              </div>
            )}

            {!showPreview && (
              <div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {step.emailBody}
                </p>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{step.cta.type}</Badge>
                <span className="text-sm">{step.cta.text}</span>
              </div>

              {step.personalizationTags.length > 0 && (
                <div className="flex items-center gap-1">
                  {step.personalizationTags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {"{" + tag + "}"}
                    </Badge>
                  ))}
                  {step.personalizationTags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{step.personalizationTags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {step.metrics && step.metrics.sent > 0 && (
              <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Sent</p>
                  <p className="text-lg font-bold">{step.metrics.sent}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Open Rate</p>
                  <p className="text-lg font-bold">{calculateOpenRate()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Click Rate</p>
                  <p className="text-lg font-bold">{calculateClickRate()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Replies</p>
                  <p className="text-lg font-bold">{step.metrics.replied}</p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
