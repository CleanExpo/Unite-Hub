"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { formatDuration } from '@/lib/orchestrator/dashboard-service';

interface ExecutionTimelineProps {
  timeline: any[];
}

export function ExecutionTimeline({ timeline }: ExecutionTimelineProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (stepIndex: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepIndex)) {
      newExpanded.delete(stepIndex);
    } else {
      newExpanded.add(stepIndex);
    }
    setExpandedSteps(newExpanded);
  };

  if (!timeline || timeline.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No execution steps recorded
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execution Timeline</CardTitle>
        <CardDescription>
          Step-by-step execution flow with timing and verification status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {timeline.map((step, idx) => {
            const isExpanded = expandedSteps.has(step.stepIndex);
            const statusIcon =
              step.status === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : step.status === 'failed' ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : step.status === 'running' ? (
                <Clock className="h-5 w-5 text-blue-500 animate-spin" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              );

            return (
              <div
                key={step.stepIndex}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                {/* Step Header */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleStep(step.stepIndex)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    {statusIcon}
                    <div>
                      <p className="font-semibold text-sm">
                        Step {step.stepIndex + 1}: {step.assignedAgent}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className={`${step.statusColor}-500 text-xs`}>
                          {step.status}
                        </Badge>
                        {step.verified && (
                          <Badge variant="default" className="bg-green-500 text-xs">
                            ✓ Verified
                          </Badge>
                        )}
                        {step.verificationAttempts > 0 && !step.verified && (
                          <Badge variant="destructive" className="text-xs">
                            {step.verificationAttempts} attempts
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {step.duration !== null && (
                      <p className="font-mono">{step.durationFormatted}</p>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pl-11 space-y-3 border-l-2 border-muted ml-2">
                    <div className="pl-4 space-y-2">
                      {/* Timing */}
                      {step.startTime && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Started:</span>{' '}
                          <span className="font-mono">
                            {new Date(step.startTime).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                      {step.endTime && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Completed:</span>{' '}
                          <span className="font-mono">
                            {new Date(step.endTime).toLocaleTimeString()}
                          </span>
                        </div>
                      )}

                      {/* Output Summary */}
                      {step.outputSummary && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Output:</span>{' '}
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {step.outputSummary}
                          </code>
                        </div>
                      )}

                      {/* Verification Status */}
                      {step.verificationAttempts > 0 && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">
                            Verification Attempts:
                          </span>{' '}
                          <span className={step.verified ? 'text-green-500' : 'text-red-500'}>
                            {step.verificationAttempts} / 3
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Timeline Visualization */}
        <div className="mt-6 relative">
          <div className="flex items-center justify-between">
            {timeline.slice(0, 10).map((step, idx) => {
              const bgColor =
                step.status === 'completed'
                  ? 'bg-green-500'
                  : step.status === 'failed'
                  ? 'bg-red-500'
                  : step.status === 'running'
                  ? 'bg-blue-500'
                  : 'bg-gray-300';

              return (
                <div key={step.stepIndex} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-3 h-3 rounded-full ${bgColor}`}
                    title={`Step ${step.stepIndex + 1}: ${step.assignedAgent} - ${step.status}`}
                  />
                  {idx < timeline.length - 1 && (
                    <div className="h-1 w-full bg-muted" />
                  )}
                </div>
              );
            })}
          </div>
          {timeline.length > 10 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Showing first 10 of {timeline.length} steps
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
