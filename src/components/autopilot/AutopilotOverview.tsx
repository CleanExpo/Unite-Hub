'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import type { AutopilotStats, AutopilotPreferences } from '@/lib/autopilot';

interface AutopilotOverviewProps {
  stats: AutopilotStats;
  preferences: AutopilotPreferences | null;
}

export function AutopilotOverview({ stats, preferences }: AutopilotOverviewProps) {
  const getProfileBadge = (profile: string) => {
    const colors: Record<string, string> = {
      off: 'bg-gray-500',
      conservative: 'bg-blue-500',
      balanced: 'bg-green-500',
      aggressive: 'bg-orange-500',
    };
    return colors[profile] || 'bg-gray-500';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Automation Profile</CardTitle>
          <Bot className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge className={getProfileBadge(preferences?.automationProfile || 'off')}>
              {preferences?.automationProfile || 'off'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {preferences?.automationProfile === 'off' && 'All actions require approval'}
            {preferences?.automationProfile === 'conservative' && 'Only low-risk actions auto-execute'}
            {preferences?.automationProfile === 'balanced' && 'Low & medium risk can auto-execute'}
            {preferences?.automationProfile === 'aggressive' && 'Most actions auto-execute'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Auto-Executed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.autoExecuted}</div>
          <p className="text-xs text-muted-foreground">
            Actions automatically completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Awaiting Approval</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.awaitingApproval}</div>
          <p className="text-xs text-muted-foreground">
            Actions requiring your review
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalActions}</div>
          <p className="text-xs text-muted-foreground">
            From {stats.totalPlaybooks} playbooks
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
