"use client";

/**
 * Sequence Timeline Component
 * Visual timeline view of email sequence steps
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, TrendingUp } from "lucide-react";

interface Step {
  _id?: string;
  stepNumber: number;
  stepName: string;
  dayDelay: number;
  subjectLine: string;
  emailBody: string;
  metrics?: {
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
  };
}

interface SequenceTimelineProps {
  steps: Step[];
  onSelectStep: (stepId: string) => void;
}

export function SequenceTimeline({ steps, onSelectStep }: SequenceTimelineProps) {
  const calculateOpenRate = (step: Step) => {
    if (!step.metrics || step.metrics.sent === 0) {
return 0;
}
    return ((step.metrics.opened / step.metrics.sent) * 100).toFixed(0);
  };

  const getTotalDays = () => {
    return steps.reduce((total, step) => total + step.dayDelay, 0);
  };

  if (steps.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground">No steps to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{getTotalDays()} Day Sequence</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Mail className="h-4 w-4" />
            {steps.length} Emails
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => {
            const cumulativeDays = steps
              .slice(0, index + 1)
              .reduce((total, s) => total + s.dayDelay, 0);

            return (
              <div
                key={step._id || index}
                className="relative pl-16 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => step._id && onSelectStep(step._id)}
              >
                {/* Timeline Node */}
                <div className="absolute left-6 -ml-2 h-5 w-5 rounded-full bg-primary border-4 border-background" />

                {/* Day Badge */}
                <div className="absolute left-0 top-0">
                  <Badge variant="outline" className="text-xs">
                    Day {cumulativeDays}
                  </Badge>
                </div>

                {/* Step Card */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{step.stepName}</p>
                          <Badge variant="secondary" className="text-xs">
                            Step {step.stepNumber}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-primary mb-1">
                          {step.subjectLine}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {step.emailBody}
                        </p>
                      </div>

                      {step.metrics && step.metrics.sent > 0 && (
                        <div className="flex items-center gap-3 ml-4">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Open Rate</p>
                            <p className="text-sm font-bold">{calculateOpenRate(step)}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Replies</p>
                            <p className="text-sm font-bold">{step.metrics.replied}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Delay Info */}
                    {index < steps.length - 1 && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>
                          Next email in {steps[index + 1].dayDelay} day(s)
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* End Node */}
        <div className="relative pl-16 mt-8">
          <div className="absolute left-6 -ml-2 h-5 w-5 rounded-full bg-green-500 border-4 border-background" />
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="font-medium text-green-900">Sequence Complete</p>
            <p className="text-sm text-green-700">
              Lead has completed the {steps.length}-step sequence
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
