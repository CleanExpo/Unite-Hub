'use client';

/**
 * Template Preview Card
 * Phase 68: Display platform template and format previews
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  Image as ImageIcon,
  Video,
  Layers,
  Monitor,
  Smartphone,
} from 'lucide-react';

interface TemplatePreviewCardProps {
  platform_id: string;
  platform_name: string;
  format_id: string;
  format_name: string;
  type: 'image' | 'video' | 'carousel' | 'story' | 'reel' | 'cover';
  dimensions: { width: number; height: number };
  aspect_ratio: string;
  max_file_size_mb: number;
  max_duration_seconds?: number;
  onClick?: () => void;
}

export function TemplatePreviewCard({
  platform_id,
  platform_name,
  format_name,
  type,
  dimensions,
  aspect_ratio,
  max_file_size_mb,
  max_duration_seconds,
  onClick,
}: TemplatePreviewCardProps) {
  const getPlatformIcon = () => {
    switch (platform_id) {
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />;
      case 'youtube':
        return <Youtube className="h-4 w-4" />;
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'video':
      case 'reel':
        return <Video className="h-3 w-3" />;
      case 'carousel':
        return <Layers className="h-3 w-3" />;
      case 'story':
        return <Smartphone className="h-3 w-3" />;
      default:
        return <ImageIcon className="h-3 w-3" />;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'video':
      case 'reel':
        return 'bg-red-500';
      case 'carousel':
        return 'bg-purple-500';
      case 'story':
        return 'bg-pink-500';
      case 'cover':
        return 'bg-blue-500';
      default:
        return 'bg-green-500';
    }
  };

  // Calculate preview box dimensions (max 80px height)
  const previewScale = 80 / dimensions.height;
  const previewWidth = Math.round(dimensions.width * previewScale);
  const previewHeight = 80;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-muted rounded">
              {getPlatformIcon()}
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{format_name}</CardTitle>
              <div className="text-xs text-muted-foreground">{platform_name}</div>
            </div>
          </div>
          <Badge className={`${getTypeColor()} gap-1`}>
            {getTypeIcon()}
            {type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Preview box */}
        <div className="flex justify-center">
          <div
            className="border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center bg-muted/30"
            style={{ width: previewWidth, height: previewHeight }}
          >
            <span className="text-[10px] text-muted-foreground">
              {dimensions.width}x{dimensions.height}
            </span>
          </div>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-muted-foreground">Aspect Ratio</div>
            <div className="font-medium">{aspect_ratio}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Max Size</div>
            <div className="font-medium">{max_file_size_mb} MB</div>
          </div>
          {max_duration_seconds && (
            <>
              <div>
                <div className="text-muted-foreground">Max Duration</div>
                <div className="font-medium">
                  {max_duration_seconds >= 60
                    ? `${Math.round(max_duration_seconds / 60)}m`
                    : `${max_duration_seconds}s`}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TemplatePreviewCard;
