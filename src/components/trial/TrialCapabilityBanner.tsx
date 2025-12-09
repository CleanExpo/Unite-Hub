'use client';

/**
 * Trial Capability Banner
 * Shows trial-specific limits at top of dashboard
 * Displays AI tokens, VIF generations, blueprints, time remaining, and upgrade CTA
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Clock, Zap, Image as ImageIcon, LayoutGrid } from 'lucide-react';
import { TrialState } from '@/lib/trial/trialExperienceEngine';

interface TrialCapabilityBannerProps {
  trialState: TrialState;
  onUpgradeClick?: () => void;
}

export function TrialCapabilityBanner({
  trialState,
  onUpgradeClick,
}: TrialCapabilityBannerProps) {
  if (!trialState?.isTrialActive) {
return null;
}

  const getUrgencyColor = (percentUsed: number): string => {
    if (percentUsed >= 100) {
return 'text-red-600 dark:text-red-400';
}
    if (percentUsed >= 80) {
return 'text-orange-600 dark:text-orange-400';
}
    if (percentUsed >= 50) {
return 'text-yellow-600 dark:text-yellow-400';
}
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressColor = (percentUsed: number): string => {
    if (percentUsed >= 100) {
return 'bg-red-500';
}
    if (percentUsed >= 80) {
return 'bg-orange-500';
}
    if (percentUsed >= 50) {
return 'bg-yellow-500';
}
    return 'bg-green-500';
  };

  return (
    <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 mb-6">
      <CardContent className="pt-6 space-y-4">
        {/* Header with trial info and upgrade CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="font-semibold text-orange-900 dark:text-orange-100">
                Trial Account ({trialState.daysRemaining} days remaining)
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                You're using 25% capacity. Upgrade to unlock full features.
              </p>
            </div>
          </div>
          <Button onClick={onUpgradeClick} className="whitespace-nowrap">
            Upgrade Now
          </Button>
        </div>

        {/* Capacity Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* AI Tokens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium">AI Tokens</span>
              </div>
              <Badge
                variant={trialState.aiTokens.percentUsed > 100 ? 'destructive' : 'default'}
                className="text-xs"
              >
                {trialState.aiTokens.percentUsed > 100 ? 'Over limit' : `${trialState.aiTokens.percentUsed}%`}
              </Badge>
            </div>
            <Progress
              value={Math.min(100, trialState.aiTokens.percentUsed)}
              className="h-2"
            />
            <p className={`text-xs ${getUrgencyColor(trialState.aiTokens.percentUsed)}`}>
              {trialState.aiTokens.used.toLocaleString()} / {trialState.aiTokens.cap.toLocaleString()} tokens
            </p>
            {trialState.aiTokens.percentUsed > 100 && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                ℹ️ Soft cap exceeded (warning only)
              </p>
            )}
          </div>

          {/* VIF Generations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium">VIF Visuals</span>
              </div>
              <Badge
                variant={trialState.vifGenerations.hardCapReached ? 'destructive' : 'default'}
                className="text-xs"
              >
                {trialState.vifGenerations.hardCapReached ? 'Max reached' : `${trialState.vifGenerations.remaining} left`}
              </Badge>
            </div>
            <Progress
              value={(trialState.vifGenerations.used / trialState.vifGenerations.cap) * 100}
              className="h-2"
            />
            <p
              className={`text-xs ${
                trialState.vifGenerations.hardCapReached
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {trialState.vifGenerations.used} / {trialState.vifGenerations.cap} generated
            </p>
            {trialState.vifGenerations.hardCapReached && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                ⚠️ Hard cap reached
              </p>
            )}
          </div>

          {/* Blueprints */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium">Blueprints</span>
              </div>
              <Badge
                variant={trialState.blueprints.hardCapReached ? 'destructive' : 'default'}
                className="text-xs"
              >
                {trialState.blueprints.hardCapReached ? 'Max reached' : `${trialState.blueprints.remaining} left`}
              </Badge>
            </div>
            <Progress
              value={(trialState.blueprints.created / trialState.blueprints.cap) * 100}
              className="h-2"
            />
            <p
              className={`text-xs ${
                trialState.blueprints.hardCapReached
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {trialState.blueprints.created} / {trialState.blueprints.cap} created
            </p>
            {trialState.blueprints.hardCapReached && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                ⚠️ Hard cap reached
              </p>
            )}
          </div>

          {/* Time Remaining */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium">Time Left</span>
              </div>
              <Badge variant="default" className="text-xs">
                {trialState.daysRemaining > 0 ? `${trialState.daysRemaining}d` : 'Expiring'}
              </Badge>
            </div>
            <Progress
              value={Math.max(0, Math.min(100, (trialState.daysRemaining / 14) * 100))}
              className="h-2"
            />
            <p
              className={`text-xs ${
                trialState.daysRemaining <= 3
                  ? 'text-red-600 dark:text-red-400 font-medium'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {trialState.daysRemaining} days, {trialState.hoursRemaining % 24} hours
            </p>
            {trialState.daysRemaining <= 3 && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                ⏰ Trial ending soon!
              </p>
            )}
          </div>
        </div>

        {/* Module Access Summary */}
        {(trialState.limitedModules.length > 0 || trialState.disabledModules.length > 0) && (
          <div className="pt-2 border-t border-orange-200 dark:border-orange-800 space-y-2">
            <p className="text-xs font-semibold text-orange-900 dark:text-orange-100">
              Feature Restrictions
            </p>
            <div className="flex flex-wrap gap-2">
              {trialState.limitedModules.length > 0 && (
                <div className="text-xs">
                  <Badge variant="secondary">
                    {trialState.limitedModules.length} Limited Features
                  </Badge>
                  <p className="text-orange-700 dark:text-orange-300 mt-1">
                    Some features have reduced capacity in trial
                  </p>
                </div>
              )}
              {trialState.disabledModules.length > 0 && (
                <div className="text-xs">
                  <Badge variant="destructive">
                    {trialState.disabledModules.length} Disabled Features
                  </Badge>
                  <p className="text-orange-700 dark:text-orange-300 mt-1">
                    These features require an upgrade
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Truth Layer Message */}
        <div className="pt-2 border-t border-orange-200 dark:border-orange-800">
          <p className="text-xs text-orange-700 dark:text-orange-300">
            ℹ️ <strong>Trial Details:</strong> 14-day free trial with 25% capacity. AI tokens use a soft
            cap (we warn but don't block). Visual generations and blueprints have hard caps. No credit
            card required. Upgrade anytime to unlock full features.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
