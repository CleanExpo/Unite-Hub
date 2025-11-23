'use client';

/**
 * Channel Asset Matrix
 * Phase 69: Display asset coverage across channels
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { CampaignBundle, ChannelAssetGroup } from '@/lib/visual/campaign/visualCampaignEngine';

interface ChannelAssetMatrixProps {
  bundle: CampaignBundle;
  className?: string;
}

export function ChannelAssetMatrix({
  bundle,
  className = '',
}: ChannelAssetMatrixProps) {
  const getStatusIcon = (count: number, required: number) => {
    if (count >= required) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (count > 0) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500';
      case 'generating':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-muted';
    }
  };

  const totalComplete = bundle.generation_queue.filter(
    (q) => q.status === 'complete'
  ).length;
  const completionPercent = Math.round(
    (totalComplete / bundle.total_assets) * 100
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Channel Coverage</CardTitle>
          <Badge variant="outline">
            {completionPercent}% complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hero asset */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Hero Asset</span>
            {getStatusIcon(1, 1)}
          </div>
          <div className="text-xs text-muted-foreground">
            {bundle.hero_asset.method_name}
          </div>
          <div className="text-xs text-muted-foreground">
            {bundle.hero_asset.dimensions.width}x{bundle.hero_asset.dimensions.height}
          </div>
        </div>

        {/* Channel groups */}
        <div className="space-y-3">
          {bundle.channel_assets.map((channelGroup) => (
            <ChannelRow key={channelGroup.channel} group={channelGroup} />
          ))}
        </div>

        {/* Supporting assets */}
        {bundle.supporting_assets.length > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Supporting Assets</span>
              <span className="text-xs text-muted-foreground">
                {bundle.supporting_assets.length} items
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {bundle.supporting_assets.map((asset) => (
                <span
                  key={asset.asset_id}
                  className="text-[10px] px-1.5 py-0.5 bg-background rounded"
                >
                  {asset.method_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold">{bundle.total_assets}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-500">
                {totalComplete}
              </div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
            <div>
              <div className="text-lg font-bold">
                {bundle.estimated_time_hours}h
              </div>
              <div className="text-xs text-muted-foreground">Est. Time</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChannelRow({ group }: { group: ChannelAssetGroup }) {
  return (
    <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{group.channel_name}</span>
        <Badge variant="outline" className="text-[10px] h-5">
          {group.assets.length} assets
        </Badge>
      </div>
      <div className="flex items-center gap-1">
        {group.formats_covered.slice(0, 3).map((format) => (
          <span
            key={format}
            className="text-[9px] px-1 py-0.5 bg-background rounded"
          >
            {format.split('_').pop()}
          </span>
        ))}
      </div>
    </div>
  );
}

export default ChannelAssetMatrix;
