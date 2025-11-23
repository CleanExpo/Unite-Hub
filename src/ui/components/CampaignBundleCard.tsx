'use client';

/**
 * Campaign Bundle Card
 * Phase 69: Display campaign bundle template information
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  Clock,
  DollarSign,
  Layers,
  Image,
  Video,
  FileText,
  Target,
} from 'lucide-react';
import { BundleTemplate } from '@/lib/visual/campaign/campaignBundles';

interface CampaignBundleCardProps {
  bundle: BundleTemplate;
  onClick?: () => void;
  selected?: boolean;
}

export function CampaignBundleCard({
  bundle,
  onClick,
  selected = false,
}: CampaignBundleCardProps) {
  const getGoalIcon = () => {
    switch (bundle.goal) {
      case 'awareness':
        return <Target className="h-4 w-4" />;
      case 'engagement':
        return <Layers className="h-4 w-4" />;
      case 'conversion':
        return <DollarSign className="h-4 w-4" />;
      case 'launch':
        return <Package className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getBudgetColor = () => {
    switch (bundle.min_budget_tier) {
      case 'starter':
        return 'bg-green-500';
      case 'growth':
        return 'bg-blue-500';
      case 'premium':
        return 'bg-purple-500';
      case 'enterprise':
        return 'bg-orange-500';
    }
  };

  const { social_set } = bundle.asset_structure;
  const socialTotal = social_set.feed_posts + social_set.stories + social_set.reels + social_set.carousels;

  return (
    <Card
      className={`hover:shadow-md transition-all cursor-pointer ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-muted rounded">
              {getGoalIcon()}
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{bundle.name}</CardTitle>
              <div className="text-xs text-muted-foreground capitalize">
                {bundle.goal} campaign
              </div>
            </div>
          </div>
          <Badge className={getBudgetColor()}>
            {bundle.min_budget_tier}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {bundle.description}
        </p>

        {/* Asset breakdown */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Image className="h-3 w-3 text-blue-500" />
            <span>{social_set.feed_posts} posts</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3 text-pink-500" />
            <span>{social_set.stories} stories</span>
          </div>
          <div className="flex items-center gap-1">
            <Video className="h-3 w-3 text-red-500" />
            <span>{social_set.reels} reels</span>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total Assets</span>
            <span className="font-medium">{bundle.estimated_assets}</span>
          </div>
          <Progress value={(socialTotal / bundle.estimated_assets) * 100} className="h-1" />
        </div>

        {/* Channels */}
        <div className="flex flex-wrap gap-1">
          {bundle.recommended_channels.slice(0, 4).map((channel) => (
            <span
              key={channel}
              className="text-[10px] px-1.5 py-0.5 bg-muted rounded capitalize"
            >
              {channel.replace('_', ' ')}
            </span>
          ))}
          {bundle.recommended_channels.length > 4 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">
              +{bundle.recommended_channels.length - 4}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{bundle.typical_timeline_days} days</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Layers className="h-3 w-3" />
            <span>{bundle.asset_structure.variants.length} variants</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CampaignBundleCard;
