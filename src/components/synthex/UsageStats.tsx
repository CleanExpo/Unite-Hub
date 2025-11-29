"use client";

/**
 * Usage Stats Component
 * Phase 4 of Unite-Hub Rebuild
 *
 * Display current usage against tier limits.
 * Shows progress bars and warnings when approaching limits.
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLimit } from '@/contexts/TierContext';
import { Users, Mail, FolderKanban, Database } from 'lucide-react';

interface UsageData {
  contacts: number;
  campaigns: number;
  emailsSent: number;
  storageMB: number;
}

export function UsageStats() {
  const [usage, setUsage] = useState<UsageData>({
    contacts: 0,
    campaigns: 0,
    emailsSent: 0,
    storageMB: 0,
  });

  const contactsLimit = useLimit('contacts_limit', usage.contacts);
  const campaignsLimit = useLimit('campaigns_limit', usage.campaigns);
  const emailsLimit = useLimit('emails_per_month', usage.emailsSent);
  const storageLimit = useLimit('storage_limit_mb', usage.storageMB);

  // Fetch usage data (placeholder - implement actual API call)
  useEffect(() => {
    // TODO: Fetch from /api/synthex/usage
    setUsage({
      contacts: 150,
      campaigns: 2,
      emailsSent: 450,
      storageMB: 120,
    });
  }, []);

  const formatLimit = (limit: number, isUnlimited: boolean) => {
    if (isUnlimited) return 'Unlimited';
    return limit.toLocaleString();
  };

  const getWarningLevel = (percentage: number) => {
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    return 'normal';
  };

  const stats = [
    {
      icon: Users,
      label: 'Contacts',
      current: usage.contacts,
      limit: contactsLimit.limit,
      isUnlimited: contactsLimit.isUnlimited,
      percentage: contactsLimit.percentage,
    },
    {
      icon: FolderKanban,
      label: 'Campaigns',
      current: usage.campaigns,
      limit: campaignsLimit.limit,
      isUnlimited: campaignsLimit.isUnlimited,
      percentage: campaignsLimit.percentage,
    },
    {
      icon: Mail,
      label: 'Emails This Month',
      current: usage.emailsSent,
      limit: emailsLimit.limit,
      isUnlimited: emailsLimit.isUnlimited,
      percentage: emailsLimit.percentage,
    },
    {
      icon: Database,
      label: 'Storage (MB)',
      current: usage.storageMB,
      limit: storageLimit.limit,
      isUnlimited: storageLimit.isUnlimited,
      percentage: storageLimit.percentage,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const warningLevel = getWarningLevel(stat.percentage);

        return (
          <Card key={stat.label} className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-gray-400" />
                {warningLevel === 'danger' && (
                  <Badge variant="destructive" className="text-xs">
                    Limit Reached
                  </Badge>
                )}
                {warningLevel === 'warning' && (
                  <Badge className="bg-yellow-600 text-xs">
                    75%+ Used
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-gray-100">
                  {stat.current.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  / {formatLimit(stat.limit, stat.isUnlimited)}
                </p>
              </div>
              <p className="text-xs text-gray-400">{stat.label}</p>
              {!stat.isUnlimited && (
                <Progress
                  value={Math.min(100, stat.percentage)}
                  className="h-2"
                  indicatorClassName={
                    warningLevel === 'danger'
                      ? 'bg-red-600'
                      : warningLevel === 'warning'
                      ? 'bg-yellow-600'
                      : 'bg-purple-600'
                  }
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
