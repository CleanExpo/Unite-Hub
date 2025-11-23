'use client';

/**
 * Creative Signature Card
 * Phase 61: Display brand signature overview
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Palette, Type, Volume2, Grid3X3 } from 'lucide-react';

interface BrandSignature {
  name: string;
  primary_colors: string[];
  secondary_colors: string[];
  typography: {
    heading_font: string;
    body_font: string;
  };
  tone_of_voice: string;
  motion_style: string;
}

interface CreativeSignatureCardProps {
  signature: BrandSignature;
  clientName: string;
  onEdit?: () => void;
}

export function CreativeSignatureCard({
  signature,
  clientName,
  onEdit,
}: CreativeSignatureCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{clientName}</CardTitle>
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs text-blue-500 hover:underline"
            >
              Edit
            </button>
          )}
        </div>
        <div className="text-xs text-muted-foreground">{signature.name}</div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Colors */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Palette className="h-3 w-3" />
            <span>Colors</span>
          </div>
          <div className="flex gap-1">
            {signature.primary_colors.map((color, i) => (
              <div
                key={`primary-${i}`}
                className="w-6 h-6 rounded border"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            {signature.secondary_colors.slice(0, 2).map((color, i) => (
              <div
                key={`secondary-${i}`}
                className="w-6 h-6 rounded border opacity-70"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Type className="h-3 w-3" />
            <span>Typography</span>
          </div>
          <div className="text-xs">
            <span className="font-medium">{signature.typography.heading_font}</span>
            {signature.typography.heading_font !== signature.typography.body_font && (
              <span className="text-muted-foreground">
                {' / '}
                {signature.typography.body_font}
              </span>
            )}
          </div>
        </div>

        {/* Tone */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Volume2 className="h-3 w-3" />
            <span>Tone</span>
          </div>
          <div className="text-xs">{signature.tone_of_voice}</div>
        </div>

        {/* Motion */}
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-3 w-3 text-muted-foreground" />
          <Badge variant="outline" className="text-xs">
            {signature.motion_style}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default CreativeSignatureCard;
