"use client";

/**
 * Sequence Builder Component
 * Visual builder for creating and editing email sequences
 */

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, Sparkles } from "lucide-react";
import { EmailStepCard } from "./EmailStepCard";
import { SequenceTimeline } from "./SequenceTimeline";

interface Step {
  _id?: string;
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
}

interface SequenceBuilderProps {
  sequence?: {
    _id: string;
    name: string;
    description?: string;
    sequenceType: string;
    goal: string;
    totalSteps: number;
  };
  steps: Step[];
  onSave: (data: any) => void;
  onAddStep: () => void;
  onUpdateStep: (stepId: string, data: any) => void;
  onRegenerateStep: (stepId: string) => void;
  onDeleteStep: (stepId: string) => void;
  isEditing?: boolean;
}

export function SequenceBuilder({
  sequence,
  steps,
  onSave,
  onAddStep,
  onUpdateStep,
  onRegenerateStep,
  onDeleteStep,
  isEditing = false,
}: SequenceBuilderProps) {
  const [name, setName] = useState(sequence?.name || "");
  const [description, setDescription] = useState(sequence?.description || "");
  const [sequenceType, setSequenceType] = useState(sequence?.sequenceType || "cold_outreach");
  const [goal, setGoal] = useState(sequence?.goal || "");
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");

  const handleSave = () => {
    onSave({
      name,
      description,
      sequenceType,
      goal,
    });
  };

  return (
    <div className="space-y-6">
      {/* Sequence Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Sequence Settings</CardTitle>
          <CardDescription>
            Configure your email sequence details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Sequence Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., SaaS Cold Outreach"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Sequence Type</Label>
              <Select value={sequenceType} onValueChange={setSequenceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                  <SelectItem value="lead_nurture">Lead Nurture</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="re_engagement">Re-engagement</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this sequence"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Sequence Goal</Label>
            <Textarea
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What do you want to achieve with this sequence?"
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Email Steps ({steps.length})
        </h3>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              List View
            </Button>
            <Button
              variant={viewMode === "timeline" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("timeline")}
            >
              Timeline View
            </Button>
          </div>

          <Button onClick={onAddStep}>
            <Plus className="h-4 w-4 mr-2" />
            Add Step
          </Button>
        </div>
      </div>

      {/* Steps Display */}
      {viewMode === "list" ? (
        <div className="space-y-4">
          {steps.map((step, index) => (
            <EmailStepCard
              key={step._id || index}
              step={step}
              stepNumber={index + 1}
              onUpdate={(data) => onUpdateStep(step._id!, data)}
              onRegenerate={() => onRegenerateStep(step._id!)}
              onDelete={() => onDeleteStep(step._id!)}
            />
          ))}

          {steps.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No steps yet</p>
                <Button onClick={onAddStep}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Step
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <SequenceTimeline
          steps={steps}
          onSelectStep={(stepId) => {
            // Scroll to step or open editor
            console.log("Selected step:", stepId);
          }}
        />
      )}
    </div>
  );
}
