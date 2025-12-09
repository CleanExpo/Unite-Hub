'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Image, Video } from 'lucide-react';

interface QuotaMetric {
  limit: number | null;
  used: number;
  remaining: number;
  period: string;
}

interface VisualQuota {
  tier: string;
  images: QuotaMetric;
  videos: QuotaMetric;
  videoDuration: QuotaMetric & { unit: string };
}

interface VisualTierLimitsDisplayProps {
  workspaceId: string;
}

export function VisualTierLimitsDisplay({ workspaceId }: VisualTierLimitsDisplayProps) {
  const [quotas, setQuotas] = useState<VisualQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotas();
  }, [workspaceId]);

  const fetchQuotas = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/synthex/library/visual/quota?workspaceId=${workspaceId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch visual quotas');
      }

      const data = await response.json();
      setQuotas(data.data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading visual tier limits...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading quotas: {error}</div>;
  }

  if (!quotas) {
    return null;
  }

  const getUsagePercentage = (used: number, limit: number | null) => {
    if (!limit) {
return 0;
}
    return Math.min(100, (used / limit) * 100);
  };

  const isNearLimit = (percentage: number) => percentage >= 80;
  const isOverLimit = (percentage: number) => percentage > 100;

  const renderQuotaItem = (
    title: string,
    quota: QuotaMetric,
    icon: React.ReactNode,
    unit: string = ''
  ) => {
    if (!quota.limit) {
      return (
        <div key={title} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <span className="font-medium">{title}</span>
            </div>
            <Badge variant="outline">Unlimited</Badge>
          </div>
        </div>
      );
    }

    const percentage = getUsagePercentage(quota.used, quota.limit);
    const isWarning = isNearLimit(percentage);
    const isOver = isOverLimit(percentage);

    return (
      <div key={title} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
          </div>
          <span className="text-sm text-gray-600">
            {quota.used} / {quota.limit}
            {unit && ` ${unit}`}
          </span>
        </div>

        <Progress
          value={percentage}
          className={isOver ? 'bg-red-100' : isWarning ? 'bg-yellow-100' : ''}
        />

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{percentage.toFixed(0)}% used</span>
          {isOver && (
            <span className="text-red-600 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Over limit
            </span>
          )}
          {isWarning && !isOver && (
            <span className="text-yellow-600 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Approaching limit
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Visual Library Quotas</CardTitle>
            <CardDescription>
              Your monthly limits for visual content generation ({quotas.tier} plan)
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Images */}
        {renderQuotaItem('Images per Month', quotas.images, <Image className="h-4 w-4" />)}

        {/* Videos */}
        {renderQuotaItem('Videos per Month', quotas.videos, <Video className="h-4 w-4" />)}

        {/* Video Duration */}
        {renderQuotaItem(
          'Max Video Duration',
          quotas.videoDuration,
          <Video className="h-4 w-4" />,
          'seconds'
        )}

        {/* Reset Info */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>📅 Monthly Reset:</strong> Your quotas reset on the first day of each month
            (UTC timezone).
          </p>
        </div>

        {/* Upgrade CTA */}
        {quotas.tier !== 'elite' && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>💡 Need more?</strong> Upgrade to access higher visual content quotas.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
