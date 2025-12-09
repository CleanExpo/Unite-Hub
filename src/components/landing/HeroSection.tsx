'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

export interface HeroSectionProps {
  badge?: string;
  headline: string;
  subheadline: string;
  primaryCTA?: {
    text: string;
    href: string;
    onClick?: () => void;
  };
  secondaryCTA?: {
    text: string;
    href: string;
    onClick?: () => void;
  };
  trustIndicators?: string[];
  gradient?: 'default' | 'blue' | 'orange' | 'purple' | 'green';
  className?: string;
}

const gradientClasses = {
  default: 'from-slate-950 via-blue-950 to-slate-900',
  blue: 'from-blue-950 via-cyan-950 to-blue-900',
  orange: 'from-orange-950 via-amber-950 to-orange-900',
  purple: 'from-purple-950 via-violet-950 to-purple-900',
  green: 'from-green-950 via-emerald-950 to-green-900',
};

const headlineGradients = {
  default: 'from-blue-400 to-cyan-400',
  blue: 'from-cyan-400 to-blue-400',
  orange: 'from-orange-400 to-amber-400',
  purple: 'from-purple-400 to-violet-400',
  green: 'from-green-400 to-emerald-400',
};

const buttonColors = {
  default: 'bg-blue-600 hover:bg-blue-700',
  blue: 'bg-cyan-600 hover:bg-cyan-700',
  orange: 'bg-orange-600 hover:bg-orange-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
  green: 'bg-green-600 hover:bg-green-700',
};

/**
 * Hero Section Component
 *
 * Main hero section for landing pages with headline, subheadline, and CTA buttons.
 *
 * @example
 * ```tsx
 * <HeroSection
 *   badge="AI-Powered Platform"
 *   headline="Transform Your Marketing with AI"
 *   subheadline="Automate workflows and grow your business faster"
 *   primaryCTA={{ text: 'Start Free Trial', href: '/signup' }}
 *   secondaryCTA={{ text: 'Watch Demo', href: '/demo' }}
 *   trustIndicators={['No credit card required', '14-day trial', 'Cancel anytime']}
 *   gradient="blue"
 * />
 * ```
 */
export function HeroSection({
  badge,
  headline,
  subheadline,
  primaryCTA,
  secondaryCTA,
  trustIndicators,
  gradient = 'default',
  className = '',
}: HeroSectionProps) {
  return (
    <div className={`min-h-[80vh] bg-gradient-to-br ${gradientClasses[gradient]} ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="space-y-8 text-center">
          {badge && (
            <Badge className="mx-auto bg-primary/20 text-primary border-primary/30 px-4 py-2">
              {badge}
            </Badge>
          )}

          <h1 className="text-5xl md:text-6xl font-bold text-white max-w-4xl mx-auto">
            {headline.split('{{highlight}}').map((part, index) => {
              if (index === 0) {
return part;
}
              return (
                <span key={index}>
                  <span className={`bg-gradient-to-r ${headlineGradients[gradient]} bg-clip-text text-transparent`}>
                    {part}
                  </span>
                </span>
              );
            })}
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            {subheadline}
          </p>

          {(primaryCTA || secondaryCTA) && (
            <div className="flex gap-4 justify-center flex-wrap">
              {primaryCTA && (
                <Button
                  size="lg"
                  className={`${buttonColors[gradient]} gap-2`}
                  onClick={primaryCTA.onClick}
                  asChild
                >
                  <a href={primaryCTA.href}>
                    {primaryCTA.text} <ArrowRight className="w-4 h-4" />
                  </a>
                </Button>
              )}
              {secondaryCTA && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  onClick={secondaryCTA.onClick}
                  asChild
                >
                  <a href={secondaryCTA.href}>
                    {secondaryCTA.text}
                  </a>
                </Button>
              )}
            </div>
          )}

          {trustIndicators && trustIndicators.length > 0 && (
            <div className="flex justify-center gap-6 text-sm text-slate-400 flex-wrap">
              {trustIndicators.map((indicator, index) => (
                <div key={index}>{indicator}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
