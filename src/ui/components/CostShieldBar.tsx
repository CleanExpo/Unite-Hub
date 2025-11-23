'use client';

/**
 * Cost Shield Bar
 * Phase 58: Display API cost status and budget usage
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Shield,
} from 'lucide-react';

interface ProviderUsage {
  provider: string;
  cost_usd: number;
  tokens_used: number;
  requests: number;
}

interface CostStatus {
  total_today_usd: number;
  total_month_usd: number;
  by_provider: ProviderUsage[];
  budget: {
    daily_limit_usd: number;
    monthly_limit_usd: number;
  };
  throttled: boolean;
  alerts: string[];
}

interface CostShieldBarProps {
  status: CostStatus;
  onViewDetails?: () => void;
}

export function CostShieldBar({ status, onViewDetails }: CostShieldBarProps) {
  const dailyPercent = (status.total_today_usd / status.budget.daily_limit_usd) * 100;
  const monthlyPercent = (status.total_month_usd / status.budget.monthly_limit_usd) * 100;

  const getStatusColor = (percent: number) => {
    if (percent >= 90) return 'text-red-500';
    if (percent >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Sort providers by cost
  const topProviders = [...status.by_provider]
    .sort((a, b) => b.cost_usd - a.cost_usd)
    .slice(0, 4);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Cost Shield
          </CardTitle>
          {status.throttled && (
            <Badge variant="destructive" className="text-xs">
              Throttled
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily Budget */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Daily Budget</span>
            <span className={`font-medium ${getStatusColor(dailyPercent)}`}>
              ${status.total_today_usd.toFixed(2)} / ${status.budget.daily_limit_usd}
            </span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full ${getProgressColor(dailyPercent)} transition-all`}
              style={{ width: `${Math.min(dailyPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Monthly Budget */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monthly Budget</span>
            <span className={`font-medium ${getStatusColor(monthlyPercent)}`}>
              ${status.total_month_usd.toFixed(2)} / ${status.budget.monthly_limit_usd}
            </span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full ${getProgressColor(monthlyPercent)} transition-all`}
              style={{ width: `${Math.min(monthlyPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Provider Breakdown */}
        <div className="space-y-2 pt-2 border-t">
          <div className="text-xs text-muted-foreground">Cost by Provider</div>
          <div className="space-y-1">
            {topProviders.map((provider) => (
              <div
                key={provider.provider}
                className="flex items-center justify-between text-xs"
              >
                <span className="truncate">{formatProviderName(provider.provider)}</span>
                <span className="font-medium">${provider.cost_usd.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {status.alerts.length > 0 && (
          <div className="pt-2 border-t">
            <div className="space-y-1">
              {status.alerts.slice(0, 2).map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400"
                >
                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatProviderName(provider: string): string {
  const names: Record<string, string> = {
    anthropic_claude: 'Claude',
    google_gemini: 'Gemini',
    openai: 'OpenAI',
    openrouter: 'OpenRouter',
    elevenlabs: 'ElevenLabs',
    perplexity: 'Perplexity',
  };
  return names[provider] || provider;
}

export default CostShieldBar;
