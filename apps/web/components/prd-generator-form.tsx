"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import type { PRDGenerationRequest } from "@/hooks/use-prd-generation";

interface PRDGeneratorFormProps {
  onSubmit: (request: PRDGenerationRequest) => void;
  isGenerating: boolean;
}

export function PRDGeneratorForm({ onSubmit, isGenerating }: PRDGeneratorFormProps) {
  const [requirements, setRequirements] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [timeline, setTimeline] = useState("");
  const [teamSize, setTeamSize] = useState("2");
  const [existingStack, setExistingStack] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const request: PRDGenerationRequest = {
      requirements,
      context: {
        target_users: targetUsers || undefined,
        timeline: timeline || undefined,
        team_size: teamSize ? parseInt(teamSize) : undefined,
        existing_stack: existingStack || undefined,
      },
    };

    onSubmit(request);
  };

  const isValid = requirements.trim().length >= 50;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Project Requirements
          </CardTitle>
          <CardDescription>
            Describe your project in detail. The AI will analyze your requirements and
            generate comprehensive documentation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="requirements">
              Project Description *
              <span className="text-sm text-muted-foreground ml-2">
                (minimum 50 characters)
              </span>
            </Label>
            <Textarea
              id="requirements"
              placeholder="Example: Build a task management application for remote teams. Users should be able to create projects, assign tasks to team members, track progress with Kanban boards, and receive real-time notifications. The app should support 100+ concurrent users and integrate with Slack for team communication."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              disabled={isGenerating}
              rows={8}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              {requirements.length} / 50 characters minimum
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Context (Optional)</CardTitle>
          <CardDescription>
            Provide additional context to help the AI generate more accurate specifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetUsers">Target Users</Label>
              <Input
                id="targetUsers"
                placeholder="e.g., Remote teams, developers, project managers"
                value={targetUsers}
                onChange={(e) => setTargetUsers(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline</Label>
              <Input
                id="timeline"
                placeholder="e.g., 3 months, Q2 2025"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamSize">Team Size</Label>
              <Input
                id="teamSize"
                type="number"
                placeholder="2"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                disabled={isGenerating}
                min="1"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="existingStack">Existing Stack</Label>
              <Input
                id="existingStack"
                placeholder="e.g., Next.js, FastAPI, Supabase"
                value={existingStack}
                onChange={(e) => setExistingStack(e.target.value)}
                disabled={isGenerating}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Generation typically takes 1-2 minutes
        </p>
        <Button
          type="submit"
          disabled={!isValid || isGenerating}
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating PRD...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate PRD
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
