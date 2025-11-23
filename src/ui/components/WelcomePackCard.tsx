'use client';

/**
 * Welcome Pack Card Component
 * Phase 47: Displays client welcome pack summary
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Play, Image, BarChart3, ArrowRight, Sparkles } from 'lucide-react';

interface WelcomePackCardProps {
  status: 'pending' | 'generating' | 'ready' | 'viewed' | 'completed';
  businessName?: string;
  generatedAt?: string;
  onViewPack?: () => void;
  hasWelcomePack?: boolean;
  hasBrandReport?: boolean;
  hasVideoScript?: boolean;
  hasSeoSnapshot?: boolean;
}

export function WelcomePackCard({
  status,
  businessName,
  generatedAt,
  onViewPack,
  hasWelcomePack = false,
  hasBrandReport = false,
  hasVideoScript = false,
  hasSeoSnapshot = false,
}: WelcomePackCardProps) {
  const statusConfig = {
    pending: { label: 'Pending', color: 'secondary', description: 'Setting up your welcome pack...' },
    generating: { label: 'Generating', color: 'default', description: 'Creating your personalized materials...' },
    ready: { label: 'Ready', color: 'default', description: 'Your welcome pack is ready to view!' },
    viewed: { label: 'Viewed', color: 'outline', description: 'Continue where you left off' },
    completed: { label: 'Completed', color: 'outline', description: 'Onboarding complete!' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  const items = [
    { icon: FileText, label: 'Welcome Guide', available: hasWelcomePack },
    { icon: BarChart3, label: 'Brand Report', available: hasBrandReport },
    { icon: Play, label: 'Intro Script', available: hasVideoScript },
    { icon: Image, label: 'SEO Snapshot', available: hasSeoSnapshot },
  ];

  return (
    <Card className="relative overflow-hidden">
      {status === 'generating' && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse" />
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <CardTitle>Welcome Pack</CardTitle>
          </div>
          <Badge variant={config.color as any}>{config.label}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {businessName && (
          <p className="text-sm">
            Personalized for <strong>{businessName}</strong>
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 p-2 rounded-lg ${
                item.available
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-400'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-xs">{item.label}</span>
            </div>
          ))}
        </div>

        {generatedAt && (
          <p className="text-xs text-muted-foreground">
            Generated {new Date(generatedAt).toLocaleDateString()}
          </p>
        )}

        {(status === 'ready' || status === 'viewed') && (
          <Button onClick={onViewPack} className="w-full">
            {status === 'ready' ? 'View Welcome Pack' : 'Continue Setup'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}

        {status === 'generating' && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WelcomePackCard;
