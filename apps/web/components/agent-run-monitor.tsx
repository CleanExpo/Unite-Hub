"use client";

import { useAgentRun, type AgentRunStatus } from "@/hooks/use-agent-runs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import type { AgentRun } from "@/types/prd";

interface AgentRunMonitorProps {
  runId: string;
}

const statusConfig: Record<
  AgentRunStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof Loader2;
  }
> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    variant: "default",
    icon: Loader2,
  },
  awaiting_verification: {
    label: "Awaiting Verification",
    variant: "outline",
    icon: AlertCircle,
  },
  verification_in_progress: {
    label: "Verifying",
    variant: "outline",
    icon: Loader2,
  },
  verification_passed: {
    label: "Verification Passed",
    variant: "default",
    icon: CheckCircle2,
  },
  verification_failed: {
    label: "Verification Failed",
    variant: "destructive",
    icon: XCircle,
  },
  completed: {
    label: "Completed",
    variant: "default",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    icon: XCircle,
  },
  blocked: {
    label: "Blocked",
    variant: "secondary",
    icon: AlertCircle,
  },
  escalated_to_human: {
    label: "Escalated to Human",
    variant: "outline",
    icon: AlertCircle,
  },
};

export function AgentRunMonitor({ runId }: AgentRunMonitorProps) {
  const { run, loading, error } = useAgentRun(runId);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading agent run...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8">
          <div className="flex items-center text-destructive">
            <XCircle className="h-5 w-5 mr-2" />
            <span className="text-sm">Error loading agent run: {error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!run) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">Agent run not found</p>
        </CardContent>
      </Card>
    );
  }

  const config = statusConfig[run.status];
  const Icon = config.icon;
  const isActive = ["in_progress", "verification_in_progress"].includes(run.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{run.agent_name}</CardTitle>
            <CardDescription className="mt-1">Run ID: {run.id}</CardDescription>
          </div>
          <Badge variant={config.variant} className="flex items-center gap-1">
            <Icon className={`h-3 w-3 ${isActive ? "animate-spin" : ""}`} />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{run.progress_percent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all duration-300"
              style={{ width: `${run.progress_percent}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        {run.current_step && (
          <div>
            <p className="text-sm font-medium mb-1">Current Step</p>
            <p className="text-sm text-muted-foreground">{run.current_step}</p>
          </div>
        )}

        {/* Verification Info */}
        {run.verification_attempts > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Verification</p>
            <p className="text-sm text-muted-foreground">
              Attempts: {run.verification_attempts}
              {run.verification_evidence?.length > 0 &&
                ` • Evidence: ${run.verification_evidence.length} items`}
            </p>
          </div>
        )}

        {/* Error Message */}
        {run.error && (
          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-sm font-medium text-destructive mb-1">Error</p>
            <p className="text-sm text-destructive/80">{run.error}</p>
          </div>
        )}

        {/* Result */}
        {run.result && run.status === "completed" && (
          <div className="rounded-md bg-primary/10 p-3">
            <p className="text-sm font-medium mb-1">Result</p>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(run.result, null, 2)}
            </pre>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>Started: {new Date(run.started_at).toLocaleString()}</span>
          {run.completed_at && (
            <span>Completed: {new Date(run.completed_at).toLocaleString()}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for displaying multiple agent runs
 */
export function AgentRunCard({ run }: { run: AgentRun }) {
  const config = statusConfig[run.status as AgentRunStatus];
  const Icon = config.icon;
  const isActive = ["in_progress", "verification_in_progress"].includes(run.status);

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium truncate">{run.agent_name}</p>
          <Badge variant={config.variant} className="flex items-center gap-1 text-xs">
            <Icon className={`h-3 w-3 ${isActive ? "animate-spin" : ""}`} />
            {config.label}
          </Badge>
        </div>
        {run.current_step && (
          <p className="text-xs text-muted-foreground truncate">{run.current_step}</p>
        )}
        <div className="mt-2">
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div
              className="bg-primary rounded-full h-1.5 transition-all duration-300"
              style={{ width: `${run.progress_percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
