"use client";

import React, { useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  X,
  Mail,
  Users,
  Rocket,
  User,
  Sparkles,
} from "lucide-react";
import { OnboardingWizard } from "./OnboardingWizard";

interface ChecklistItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  completed: boolean;
  stepNumber: number;
  onClick: () => void;
}

function ChecklistItem({ icon, title, description, completed, stepNumber, onClick }: ChecklistItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
    >
      <div className="mt-0.5">
        {completed ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground">{icon}</div>
          <h4 className={`font-medium text-sm ${completed ? "text-muted-foreground" : ""}`}>
            {title}
          </h4>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      {!completed && (
        <Badge variant="secondary" className="text-xs">
          Step {stepNumber}
        </Badge>
      )}
    </button>
  );
}

export function OnboardingChecklist() {
  const { status, completionPercentage, isComplete, goToStep, skipOnboarding } = useOnboarding();
  const [isExpanded, setIsExpanded] = useState(!isComplete);
  const [showWizard, setShowWizard] = useState(false);

  // Don't show if onboarding is complete or skipped
  if (!status || isComplete) {
    return null;
  }

  const handleItemClick = (step: number) => {
    goToStep(step);
    setShowWizard(true);
  };

  const handleDismiss = async () => {
    if (confirm("Are you sure you want to skip the onboarding process?")) {
      await skipOnboarding();
    }
  };

  const steps = [
    {
      icon: <User className="h-4 w-4" />,
      title: "Set up your profile",
      description: "Add your business details and preferences",
      completed: status.step_1_complete,
      stepNumber: 1,
    },
    {
      icon: <Mail className="h-4 w-4" />,
      title: "Connect your email",
      description: "Link Gmail or Outlook to start syncing",
      completed: status.step_2_complete,
      stepNumber: 2,
    },
    {
      icon: <Users className="h-4 w-4" />,
      title: "Import contacts",
      description: "Automatically extract contacts from emails",
      completed: status.step_3_complete,
      stepNumber: 3,
    },
    {
      icon: <Rocket className="h-4 w-4" />,
      title: "Create first campaign",
      description: "Launch your first email campaign (optional)",
      completed: status.step_4_complete,
      stepNumber: 4,
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      title: "Take a tour",
      description: "Learn about key dashboard features",
      completed: status.step_5_complete,
      stepNumber: 5,
    },
  ];

  const completedSteps = steps.filter((s) => s.completed).length;
  const totalSteps = 5;

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Get Started with Unite-Hub</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {completedSteps}/{totalSteps}
                </Badge>
              </div>
              <CardDescription className="mt-1">
                Complete these steps to get the most out of your account
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-1">
              {steps.map((step) => (
                <ChecklistItem
                  key={step.stepNumber}
                  {...step}
                  onClick={() => handleItemClick(step.stepNumber)}
                />
              ))}
            </div>

            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {completedSteps === totalSteps
                  ? "All done! You're ready to go."
                  : `${totalSteps - completedSteps} step${totalSteps - completedSteps > 1 ? "s" : ""} remaining`}
              </p>
              <Button
                size="sm"
                onClick={() => {
                  // Go to first incomplete step
                  const firstIncomplete = steps.find((s) => !s.completed);
                  if (firstIncomplete) {
                    goToStep(firstIncomplete.stepNumber);
                    setShowWizard(true);
                  }
                }}
              >
                Continue Setup
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <OnboardingWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
      />
    </>
  );
}
