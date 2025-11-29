"use client";

/**
 * Feature Card Component
 * Phase 4 of Unite-Hub Rebuild
 *
 * Card component with tier-based feature gating.
 * Shows upgrade prompt if feature is not accessible.
 */

import React from 'react';
import Link from 'next/link';
import { LucideIcon, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFeatureGate } from '@/contexts/TierContext';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  requiredFeature: 'seo_reports' | 'competitor_analysis' | 'api_access' | 'priority_support' | 'white_label' | 'custom_domain' | 'ai_content_generation' | 'ai_extended_thinking' | 'ai_agent_access';
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  requiredFeature,
}: FeatureCardProps) {
  const { allowed, message } = useFeatureGate(requiredFeature);

  if (!allowed) {
    // Show locked card with upgrade prompt
    return (
      <Card className="bg-gray-900/50 border-gray-800 relative overflow-hidden">
        {/* Lock overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center p-6">
            <Lock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-sm text-gray-300 mb-4">{message}</p>
            <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Link href="/synthex/billing">Upgrade Now</Link>
            </Button>
          </div>
        </div>

        {/* Card content (blurred) */}
        <CardHeader className="blur-sm">
          <div className="flex items-center justify-between">
            <Icon className="h-8 w-8 text-gray-400" />
            <Badge variant="secondary">Locked</Badge>
          </div>
          <CardTitle className="text-gray-100">{title}</CardTitle>
          <CardDescription className="text-gray-400">{description}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Show accessible card
  return (
    <Link href={href}>
      <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-all hover:shadow-lg cursor-pointer">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Icon className="h-8 w-8 text-purple-500" />
            <Badge className="bg-green-600 text-white">Active</Badge>
          </div>
          <CardTitle className="text-gray-100">{title}</CardTitle>
          <CardDescription className="text-gray-400">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="ghost" className="w-full text-purple-400 hover:text-purple-300">
            Open →
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
