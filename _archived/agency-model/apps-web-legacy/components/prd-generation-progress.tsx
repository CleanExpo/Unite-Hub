"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface PRDGenerationProgressProps {
  progress: number;
  currentStep: string | null;
}

const GENERATION_PHASES = [
  { name: "Analyzing requirements", percentage: 20 },
  { name: "Decomposing features into user stories", percentage: 40 },
  { name: "Generating technical specification", percentage: 60 },
  { name: "Creating test plan", percentage: 80 },
  { name: "Planning implementation roadmap", percentage: 100 },
];

export function PRDGenerationProgress({ progress, currentStep }: PRDGenerationProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generation Progress</CardTitle>
        <CardDescription>
          AI is analyzing your requirements and generating comprehensive documentation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current step */}
        {currentStep && (
          <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
            <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Current Step</p>
              <p className="text-sm text-muted-foreground">{currentStep}</p>
            </div>
          </div>
        )}

        {/* Phase checklist */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Generation Phases</p>
          {GENERATION_PHASES.map((phase) => {
            const isCompleted = progress >= phase.percentage;
            const isCurrent = progress < phase.percentage && progress >= (phase.percentage - 20);

            return (
              <div key={phase.name} className="flex items-center gap-3">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    isCompleted
                      ? "text-foreground line-through"
                      : isCurrent
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {phase.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Estimated time */}
        <div className="text-sm text-muted-foreground pt-4 border-t">
          ⏱️ Estimated time: 1-2 minutes
        </div>
      </CardContent>
    </Card>
  );
}
