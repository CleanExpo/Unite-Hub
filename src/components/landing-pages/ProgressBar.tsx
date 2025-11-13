"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";

interface ProgressBarProps {
  completed: number;
  total: number;
  percentage: number;
}

export function ProgressBar({ completed, total, percentage }: ProgressBarProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Checklist Progress</h3>
              <span className="text-2xl font-bold">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {total - completed}
              </div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>

          {/* Status Message */}
          <div className="rounded-lg bg-muted p-4 text-center">
            {percentage === 100 ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">All sections completed!</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Circle className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Keep going! {total - completed} sections left
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
