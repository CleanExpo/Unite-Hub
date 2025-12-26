'use client';

/**
 * Enhanced Integration Card
 * Shows integration with required/optional badge, consequences, and tooltips
 * Pattern 3: "I don't know what's required vs optional" (3 users)
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RequiredOptionalBadge, IntegrationPriorityTooltip } from './RequiredOptionalBadge';
import { CheckCircle2, HelpCircle, ExternalLink } from 'lucide-react';
import type { IntegrationPriority } from './RequiredOptionalBadge';

export interface IntegrationCardProps {
  integrationKey: string;
  integrationName: string;
  priority: IntegrationPriority;
  shortDescription: string;
  enablesFeatures: string[];
  consequenceIfSkipped: string;
  connected: boolean;
  setupTimeMinutes: number;
  category: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onConfigure?: () => void;
}

export function IntegrationCard({
  integrationKey,
  integrationName,
  priority,
  shortDescription,
  enablesFeatures,
  consequenceIfSkipped,
  connected,
  setupTimeMinutes,
  category,
  onConnect,
  onDisconnect,
  onConfigure,
}: IntegrationCardProps) {
  return (
    <Card className={`transition-colors ${
      connected
        ? 'border-green-500/30 bg-green-50/5 dark:bg-green-950/10'
        : priority === 'required'
        ? 'border-red-500/30 bg-red-50/5 dark:bg-red-950/10'
        : 'border-border-base hover:border-accent-500/30'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Integration Icon/Logo */}
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              connected ? 'bg-green-100 dark:bg-green-900' : 'bg-bg-raised'
            }`}>
              {connected ? (
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <div className="text-2xl">{getIntegrationEmoji(integrationKey)}</div>
              )}
            </div>

            {/* Name & Description */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-text-primary">{integrationName}</h3>

                {/* Priority Badge */}
                <RequiredOptionalBadge priority={priority} size="sm" />

                {/* Info Tooltip */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-text-tertiary hover:text-text-secondary">
                        <HelpCircle className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <IntegrationPriorityTooltip
                        priority={priority}
                        consequenceIfSkipped={consequenceIfSkipped}
                        enablesFeatures={enablesFeatures}
                      />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <p className="text-sm text-text-secondary">{shortDescription}</p>
            </div>
          </div>

          {/* Connection Status Badge */}
          {connected && (
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
              Connected
            </Badge>
          )}
        </div>

        {/* Features Enabled */}
        {enablesFeatures.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-text-tertiary mb-2">Enables:</div>
            <div className="flex flex-wrap gap-2">
              {enablesFeatures.map((feature) => (
                <Badge
                  key={feature}
                  variant="outline"
                  className="text-xs bg-bg-raised"
                >
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Consequence if Skipped */}
        {!connected && consequenceIfSkipped && (
          <div className="mb-4 p-3 bg-bg-raised rounded-lg border border-border-base">
            <div className="text-xs font-medium text-text-tertiary mb-1">
              If you skip this:
            </div>
            <div className="text-sm text-text-secondary">{consequenceIfSkipped}</div>
          </div>
        )}

        {/* Setup Time Estimate */}
        {!connected && setupTimeMinutes && (
          <div className="text-xs text-text-tertiary mb-4">
            ⏱️ Setup time: ~{setupTimeMinutes} minute{setupTimeMinutes !== 1 ? 's' : ''}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {connected ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onConfigure}
                className="flex-1"
              >
                Configure
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDisconnect}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                Disconnect
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={onConnect}
                className={`flex-1 ${
                  priority === 'required'
                    ? 'bg-red-500 hover:bg-red-600'
                    : priority === 'recommended'
                    ? 'bg-accent-500 hover:bg-accent-600'
                    : ''
                }`}
              >
                Connect {integrationName}
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
              {priority === 'optional' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-text-tertiary"
                >
                  Skip
                </Button>
              )}
            </>
          )}
        </div>

        {/* Category Tag */}
        <div className="mt-3 pt-3 border-t border-border-base">
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Get emoji for integration
 */
function getIntegrationEmoji(key: string): string {
  const emojis: Record<string, string> = {
    gmail: '📧',
    outlook: '📨',
    google_calendar: '📅',
    xero: '💰',
    stripe: '💳',
    slack: '💬',
    hubspot: '🔗',
    salesforce: '☁️',
    mailchimp: '📬',
  };

  return emojis[key] || '🔌';
}
