'use client';

/**
 * AgentObjectivePanel
 * UI form for entering high-level objectives and generating plans
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react';

export interface AgentObjectivePanelProps {
  workspaceId: string;
  accessToken: string;
  onPlanCreated?: (planId: string) => void;
}

export function AgentObjectivePanel({
  workspaceId,
  accessToken,
  onPlanCreated,
}: AgentObjectivePanelProps) {
  const [objective, setObjective] = useState('');
  const [constraints, setConstraints] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string; plan_id?: string }>({});
  const [allowApprovalCommands, setAllowApprovalCommands] = useState(true);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim()) {
      setResult({ error: 'Objective is required' });
      return;
    }

    setIsLoading(true);
    setResult({});

    try {
      const response = await fetch('/api/agent/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          workspaceId,
          objective: objective.trim(),
          constraints: constraints ? constraints.split('\n').filter((c) => c.trim()) : [],
          allowApprovalCommands,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          error: data.error || 'Failed to generate plan',
        });
        return;
      }

      setResult({
        success: true,
        plan_id: data.plan_id,
      });

      // Clear form
      setObjective('');
      setConstraints('');

      // Notify parent
      if (onPlanCreated && data.plan_id) {
        onPlanCreated(data.plan_id);
      }
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Objective</CardTitle>
        <CardDescription>
          Define what you want Synthex to accomplish, and it will create a structured execution plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGeneratePlan} className="space-y-4">
          {/* Objective Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Objective *
            </label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Enter a high-level objective (e.g., 'Open Notepad, create a file with today's date, and save it to Desktop')"
              className="w-full px-3 py-2 border border-border-base rounded-md bg-bg-card text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              disabled={isLoading}
            />
          </div>

          {/* Constraints Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Constraints (optional, one per line)
            </label>
            <textarea
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="e.g., Do not delete any existing files&#10;Maximum 10 steps"
              className="w-full px-3 py-2 border border-border-base rounded-md bg-bg-card text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Allow Approval Commands */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allowApproval"
              checked={allowApprovalCommands}
              onChange={(e) => setAllowApprovalCommands(e.target.checked)}
              disabled={isLoading}
              className="rounded"
            />
            <label htmlFor="allowApproval" className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Allow commands requiring approval (e.g., open app, navigate URL)
            </label>
          </div>

          {/* Alert Messages */}
          {result.error && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                {result.error}
              </AlertDescription>
            </Alert>
          )}

          {result.success && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Plan generated successfully. Plan ID: {result.plan_id}
              </AlertDescription>
            </Alert>
          )}

          {/* Safety Notice */}
          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Plans are validated for safety before execution. High-risk plans require founder approval.
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !objective.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Plan...
              </>
            ) : (
              'Generate Plan'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
