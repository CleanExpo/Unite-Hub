"use client";

/**
 * Sequence Stats Component
 * Analytics and performance metrics for email sequences
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Mail, MousePointer, Reply, CheckCircle } from "lucide-react";

interface SequenceStatsProps {
  sequence: {
    name: string;
    metrics: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      replied: number;
      converted: number;
    };
  };
  stepMetrics?: Array<{
    stepNumber: number;
    stepName: string;
    sent: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
  }>;
  recommendations?: Array<{
    type: string;
    message: string;
  }>;
}

export function SequenceStats({
  sequence,
  stepMetrics = [],
  recommendations = [],
}: SequenceStatsProps) {
  const calculateRate = (count: number, total: number) => {
    if (total === 0) {
return "0.0";
}
    return ((count / total) * 100).toFixed(1);
  };

  const openRate = calculateRate(sequence.metrics.opened, sequence.metrics.sent);
  const clickRate = calculateRate(sequence.metrics.clicked, sequence.metrics.sent);
  const replyRate = calculateRate(sequence.metrics.replied, sequence.metrics.sent);
  const conversionRate = calculateRate(sequence.metrics.converted, sequence.metrics.sent);

  const getPerformanceIndicator = (rate: number, type: "open" | "click" | "reply") => {
    const thresholds = {
      open: { good: 25, average: 15 },
      click: { good: 5, average: 2 },
      reply: { good: 3, average: 1 },
    };

    const threshold = thresholds[type];
    if (rate >= threshold.good) {
      return { color: "text-green-600", icon: TrendingUp, label: "Good" };
    } else if (rate >= threshold.average) {
      return { color: "text-yellow-600", icon: TrendingUp, label: "Average" };
    } else {
      return { color: "text-red-600", icon: TrendingDown, label: "Needs Improvement" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Sent</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Mail className="h-6 w-6 text-blue-600" />
              {sequence.metrics.sent}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {sequence.metrics.delivered} delivered ({calculateRate(sequence.metrics.delivered, sequence.metrics.sent)}%)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Open Rate</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <MousePointer className="h-6 w-6 text-purple-600" />
              {openRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {(() => {
                const indicator = getPerformanceIndicator(parseFloat(openRate), "open");
                const Icon = indicator.icon;
                return (
                  <>
                    <Icon className={`h-4 w-4 ${indicator.color}`} />
                    <span className={`text-xs ${indicator.color}`}>{indicator.label}</span>
                  </>
                );
              })()}
            </div>
            <Progress value={parseFloat(openRate)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Reply Rate</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Reply className="h-6 w-6 text-orange-600" />
              {replyRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {(() => {
                const indicator = getPerformanceIndicator(parseFloat(replyRate), "reply");
                const Icon = indicator.icon;
                return (
                  <>
                    <Icon className={`h-4 w-4 ${indicator.color}`} />
                    <span className={`text-xs ${indicator.color}`}>{indicator.label}</span>
                  </>
                );
              })()}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {sequence.metrics.replied} total replies
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Conversion Rate</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              {conversionRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {sequence.metrics.converted} conversions
            </div>
            <Progress value={parseFloat(conversionRate)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Step-by-Step Performance */}
      {stepMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Step Performance</CardTitle>
            <CardDescription>
              Performance breakdown for each email in the sequence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stepMetrics.map((step) => (
                <div key={step.stepNumber} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step {step.stepNumber}</Badge>
                      <span className="font-medium">{step.stepName}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {step.sent} sent
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Open</span>
                        <span className="text-xs font-medium">{step.openRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={step.openRate} />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Click</span>
                        <span className="text-xs font-medium">{step.clickRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={step.clickRate} />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Reply</span>
                        <span className="text-xs font-medium">{step.replyRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={step.replyRate} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Recommendations</CardTitle>
            <CardDescription>
              Insights and suggestions to improve performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                >
                  <Badge variant="outline" className="mt-0.5">
                    {rec.type}
                  </Badge>
                  <p className="text-sm flex-1">{rec.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
