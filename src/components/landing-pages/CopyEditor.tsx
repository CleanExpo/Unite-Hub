"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Save, X } from "lucide-react";

interface CopyEditorProps {
  headline?: string;
  subheadline?: string;
  bodyCopy?: string;
  cta?: string;
  onUpdate: (updates: {
    headline?: string;
    subheadline?: string;
    bodyCopy?: string;
    cta?: string;
  }) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
}

export function CopyEditor({
  headline,
  subheadline,
  bodyCopy,
  cta,
  onUpdate,
  isEditing,
  onToggleEdit,
}: CopyEditorProps) {
  const [editedHeadline, setEditedHeadline] = useState(headline || "");
  const [editedSubheadline, setEditedSubheadline] = useState(subheadline || "");
  const [editedBodyCopy, setEditedBodyCopy] = useState(bodyCopy || "");
  const [editedCta, setEditedCta] = useState(cta || "");

  const handleSave = () => {
    onUpdate({
      headline: editedHeadline,
      subheadline: editedSubheadline,
      bodyCopy: editedBodyCopy,
      cta: editedCta,
    });
  };

  const handleCancel = () => {
    setEditedHeadline(headline || "");
    setEditedSubheadline(subheadline || "");
    setEditedBodyCopy(bodyCopy || "");
    setEditedCta(cta || "");
    onToggleEdit();
  };

  if (!isEditing) {
    return (
      <div className="space-y-3">
        {headline && (
          <div>
            <Label className="text-xs text-muted-foreground">Headline</Label>
            <h3 className="text-xl font-bold mt-1">{headline}</h3>
          </div>
        )}
        {subheadline && (
          <div>
            <Label className="text-xs text-muted-foreground">Subheadline</Label>
            <p className="text-muted-foreground mt-1">{subheadline}</p>
          </div>
        )}
        {bodyCopy && (
          <div>
            <Label className="text-xs text-muted-foreground">Body Copy</Label>
            <p className="text-sm mt-1 whitespace-pre-wrap">{bodyCopy}</p>
          </div>
        )}
        {cta && (
          <div>
            <Label className="text-xs text-muted-foreground">Call to Action</Label>
            <Button className="mt-1" size="sm">
              {cta}
            </Button>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleEdit}
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Copy
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          value={editedHeadline}
          onChange={(e) => setEditedHeadline(e.target.value)}
          placeholder="Enter headline..."
        />
        <p className="text-xs text-muted-foreground">
          {editedHeadline.split(" ").length} words
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subheadline">Subheadline</Label>
        <Input
          id="subheadline"
          value={editedSubheadline}
          onChange={(e) => setEditedSubheadline(e.target.value)}
          placeholder="Enter subheadline..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bodyCopy">Body Copy</Label>
        <Textarea
          id="bodyCopy"
          value={editedBodyCopy}
          onChange={(e) => setEditedBodyCopy(e.target.value)}
          placeholder="Enter body copy..."
          rows={6}
        />
        <p className="text-xs text-muted-foreground">
          {editedBodyCopy.split(" ").filter((w) => w).length} words
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cta">Call to Action</Label>
        <Input
          id="cta"
          value={editedCta}
          onChange={(e) => setEditedCta(e.target.value)}
          placeholder="Enter CTA text..."
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} size="sm" className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          size="sm"
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
