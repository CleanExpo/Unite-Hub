"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, XCircle, AlertCircle, Shield, Lock } from 'lucide-react';

interface VerificationStatusPanelProps {
  steps: any[];
}

export function VerificationStatusPanel({ steps }: VerificationStatusPanelProps) {
  if (!steps || steps.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No verification data available
        </CardContent>
      </Card>
    );
  }

  const verifiedCount = steps.filter((s) => s.verified).length;
  const failedCount = steps.filter((s) => s.status === 'failed').length;
  const blockedStep = steps.find((s) => s.status === 'failed' && !s.verified);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Verification Status
          </CardTitle>
          <CardDescription>
            Independent verification results for each step (all-or-nothing enforcement)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Verified Steps</p>
              <p className="text-2xl font-bold text-green-500">
                {verifiedCount} / {steps.length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Failed Steps</p>
              <p className="text-2xl font-bold text-red-500">{failedCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Verification Rate</p>
              <p className="text-2xl font-bold">
                {steps.length > 0 ? Math.round((verifiedCount / steps.length) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* All-or-Nothing Indicator */}
          {blockedStep && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <Lock className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Task Blocked by Step {blockedStep.stepIndex}</p>
                  <p className="text-sm">
                    All-or-nothing policy: Task cannot complete until this step is verified
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Table */}
      <Card>
        <CardHeader>
          <CardTitle>Step-by-Step Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Step</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Evidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {steps.map((step) => {
                const verificationIcon = step.verified ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : step.verificationAttempts > 0 ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                );

                return (
                  <TableRow key={step.stepIndex}>
                    <TableCell className="font-medium">#{step.stepIndex + 1}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{step.assignedAgent}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          step.status === 'completed'
                            ? 'default'
                            : step.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {step.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {verificationIcon}
                        <span className="text-sm">
                          {step.verified ? 'Verified' : 'Not Verified'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={step.verificationAttempts >= 3 ? 'destructive' : 'outline'}>
                        {step.verificationAttempts || 0} / 3
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {step.verificationEvidence && step.verificationEvidence.length > 0 ? (
                        <div className="space-y-1">
                          {step.verificationEvidence.map((evidence: any, idx: number) => (
                            <div key={idx} className="text-xs">
                              <Badge
                                variant={evidence.result === 'pass' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {evidence.criterion}: {evidence.result}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No evidence</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Retry History */}
      {steps.some((s) => s.retryHistory && s.retryHistory.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Retry History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {steps
                .filter((s) => s.retryHistory && s.retryHistory.length > 0)
                .map((step) => (
                  <div key={step.stepIndex} className="border rounded-lg p-3">
                    <p className="font-semibold text-sm mb-2">
                      Step {step.stepIndex + 1}: {step.assignedAgent}
                    </p>
                    <div className="space-y-1">
                      {step.retryHistory.map((retry: any, idx: number) => (
                        <div key={idx} className="text-xs text-muted-foreground flex gap-2">
                          <span>{new Date(retry.timestamp).toLocaleString()}</span>
                          <span>-</span>
                          <span>{retry.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
