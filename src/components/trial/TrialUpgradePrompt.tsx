'use client';

/**
 * Trial Upgrade Prompt
 * Honest, non-pushy messaging about limits and upgrade options
 * Shown contextually when user hits a limit or approaches capacity
 */

import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Check } from 'lucide-react';
import { TrialState } from '@/lib/trial/trialExperienceEngine';

interface TrialUpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeClick?: () => void;
  message: string;
  trialState: TrialState;
  urgency: 'low' | 'medium' | 'high';
  reason?: string;
  showAsDialog?: boolean; // true = modal, false = inline card
}

export function TrialUpgradePrompt({
  isOpen,
  onClose,
  onUpgradeClick,
  message,
  trialState,
  urgency,
  reason,
  showAsDialog = true,
}: TrialUpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed && showAsDialog) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onClose();
  };

  const handleUpgrade = () => {
    onUpgradeClick?.();
  };

  const getUrgencyIcon = () => {
    switch (urgency) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'medium':
        return <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
      default:
        return <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (urgency) {
      case 'high':
        return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
    }
  };

  const upgradeContent = (
    <div className="space-y-4">
      {/* Main Message */}
      <div className="flex gap-3">
        {getUrgencyIcon()}
        <div className="flex-1">
          <p className="font-semibold text-text-primary">{message}</p>
          {reason && (
            <p className="text-sm text-text-secondary mt-1">
              <strong>Reason:</strong> {reason}
            </p>
          )}
        </div>
      </div>

      {/* Current Usage Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-3 space-y-2">
        <p className="text-sm font-semibold">Your Trial Usage</p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-text-secondary">AI Tokens</p>
            <p className="font-bold">
              {trialState.aiTokens.percentUsed > 100
                ? `${trialState.aiTokens.percentUsed}%`
                : `${Math.round(trialState.aiTokens.percentUsed)}%`}
            </p>
          </div>
          <div>
            <p className="text-text-secondary">VIF Visuals</p>
            <p className="font-bold">
              {trialState.vifGenerations.used} / {trialState.vifGenerations.cap}
            </p>
          </div>
          <div>
            <p className="text-text-secondary">Blueprints</p>
            <p className="font-bold">
              {trialState.blueprints.created} / {trialState.blueprints.cap}
            </p>
          </div>
        </div>
      </div>

      {/* What You Get with Upgrade */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Upgrade to Unlock</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-600" />
            <span>Unlimited AI tokens (from 50k limit)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-600" />
            <span>Unlimited visual generations (from 10 limit)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-600" />
            <span>Unlimited blueprint creation (from 5 limit)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-600" />
            <span>Production job scheduling</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-600" />
            <span>Advanced automation features</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-600" />
            <span>24/7 support</span>
          </div>
        </div>
      </div>

      {/* Trial Info */}
      <div className="bg-gray-100 dark:bg-slate-800 rounded p-2 text-xs text-text-secondary">
        <p>
          <strong>No hidden fees.</strong> Trial ends in {trialState.daysRemaining} day
          {trialState.daysRemaining !== 1 ? 's' : ''}. Upgrade anytime during or after trial. No credit
          card required to start.
        </p>
      </div>
    </div>
  );

  if (showAsDialog) {
    return (
      <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
        <AlertDialogContent className={getBackgroundColor()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {urgency === 'high' ? 'Feature Limit Reached' : 'Ready to Unlock More?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              Upgrade your trial account for unlimited features
            </AlertDialogDescription>
          </AlertDialogHeader>

          {upgradeContent}

          <div className="flex gap-2 pt-4">
            <AlertDialogCancel onClick={handleDismiss}>
              {urgency === 'high' ? 'Close' : 'Maybe Later'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUpgrade}>
              Upgrade to Pro
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Inline card format
  return (
    <Card className={getBackgroundColor()}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getUrgencyIcon()}
            <div>
              <CardTitle className="text-base">
                {urgency === 'high' ? 'Feature Limit Reached' : 'Ready to Unlock More?'}
              </CardTitle>
              <CardDescription>{message}</CardDescription>
            </div>
          </div>
          <Badge variant={urgency === 'high' ? 'destructive' : 'default'}>
            {urgency === 'high' ? 'Blocked' : 'Available'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {upgradeContent}

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={handleDismiss}>
            {urgency === 'high' ? 'Close' : 'Dismiss'}
          </Button>
          <Button onClick={handleUpgrade} className="flex-1">
            Upgrade to Pro
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Simpler version: Inline banner for warnings
 */
export function TrialUpgradeBannerSimple({
  message,
  urgency,
  onUpgradeClick,
  onDismiss,
}: {
  message: string;
  urgency: 'low' | 'medium' | 'high';
  onUpgradeClick?: () => void;
  onDismiss?: () => void;
}) {
  const getBackgroundClass = () => {
    switch (urgency) {
      case 'high':
        return 'bg-red-50 dark:bg-red-950 border-l-4 border-red-500';
      case 'medium':
        return 'bg-orange-50 dark:bg-orange-950 border-l-4 border-orange-500';
      default:
        return 'bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500';
    }
  };

  const getTextClass = () => {
    switch (urgency) {
      case 'high':
        return 'text-red-900 dark:text-red-100';
      case 'medium':
        return 'text-orange-900 dark:text-orange-100';
      default:
        return 'text-blue-900 dark:text-blue-100';
    }
  };

  return (
    <div className={`${getBackgroundClass()} p-3 rounded mb-4`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-sm font-medium ${getTextClass()}`}>{message}</p>
        <div className="flex gap-2">
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="h-8"
            >
              Dismiss
            </Button>
          )}
          {onUpgradeClick && (
            <Button
              size="sm"
              onClick={onUpgradeClick}
              className="h-8"
            >
              Upgrade
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
