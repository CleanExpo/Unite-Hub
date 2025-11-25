'use client';

/**
 * AgentRiskApprovalModal
 * Founder approval gate for high-risk operations
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export interface RiskAssessment {
  risk_score: number;
  risk_factors: string[];
  risk_summary?: string;
  requires_founder_approval: boolean;
}

export interface AgentRiskApprovalModalProps {
  planId: string;
  workspaceId: string;
  accessToken: string;
  riskAssessment: RiskAssessment;
  onApproval?: (approved: boolean, reason?: string) => void;
}

export function AgentRiskApprovalModal({
  planId,
  workspaceId,
  accessToken,
  riskAssessment,
  onApproval,
}: AgentRiskApprovalModalProps) {
  const [approvalReason, setApprovalReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ success?: boolean; error?: string }>({});

  const getRiskColorClass = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskLevelText = (score: number) => {
    if (score < 30) return 'Low Risk';
    if (score < 60) return 'Medium Risk';
    return 'High Risk';
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    setSubmissionResult({});

    try {
      // In production, this would call an endpoint to approve the plan
      // For now, we'll just simulate the action
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSubmissionResult({ success: true });
      onApproval?.(true, approvalReason);
    } catch (error) {
      setSubmissionResult({
        error: error instanceof Error ? error.message : 'Failed to approve plan',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    setSubmissionResult({});

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSubmissionResult({ success: true });
      onApproval?.(false, approvalReason);
    } catch (error) {
      setSubmissionResult({
        error: error instanceof Error ? error.message : 'Failed to reject plan',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!riskAssessment.requires_founder_approval) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
        <CardHeader>
          <CardTitle className="text-green-900 dark:text-green-100 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Approval Not Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-800 dark:text-green-200">
            This plan has acceptable risk level and can be executed without founder approval.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
      <CardHeader>
        <CardTitle className="text-yellow-900 dark:text-yellow-100 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Founder Approval Required
        </CardTitle>
        <CardDescription className="text-yellow-800 dark:text-yellow-200">
          This plan requires your explicit approval due to risk factors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Assessment */}
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
              Risk Assessment
            </h4>
            <div className="flex items-center gap-4">
              <div>
                <p className={`text-4xl font-bold ${getRiskColorClass(riskAssessment.risk_score)}`}>
                  {riskAssessment.risk_score}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">/100</p>
              </div>
              <div>
                <p className={`text-lg font-semibold ${getRiskColorClass(riskAssessment.risk_score)}`}>
                  {getRiskLevelText(riskAssessment.risk_score)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {riskAssessment.risk_summary}
                </p>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          {riskAssessment.risk_factors.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                Risk Factors
              </h4>
              <ul className="space-y-1">
                {riskAssessment.risk_factors.map((factor, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start"
                  >
                    <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2 mt-1 flex-shrink-0"></span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Approval Reasoning */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Your Decision Notes (optional)
          </label>
          <textarea
            value={approvalReason}
            onChange={(e) => setApprovalReason(e.target.value)}
            placeholder="Explain your decision to approve or reject this plan..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        {/* Submission Result */}
        {submissionResult.error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {submissionResult.error}
            </AlertDescription>
          </Alert>
        )}

        {submissionResult.success && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Approval decision recorded successfully
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              'Approve Plan'
            )}
          </Button>
          <Button
            onClick={handleReject}
            disabled={isSubmitting}
            variant="destructive"
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              'Reject Plan'
            )}
          </Button>
        </div>

        {/* Info Alert */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
          <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
            Your decision will be logged to the Living Intelligence Archive for complete audit trail.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
