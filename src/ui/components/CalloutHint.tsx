'use client';

/**
 * Callout Hint
 * Phase 72: Subtle inline hints for key pages
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  X,
  Lightbulb,
  ArrowRight,
  Info,
  Sparkles,
  Compass,
} from 'lucide-react';

type HintVariant = 'info' | 'tip' | 'action' | 'explore';

interface CalloutHintProps {
  variant?: HintVariant;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function CalloutHint({
  variant = 'info',
  title,
  description,
  actionLabel,
  onAction,
  dismissible = true,
  onDismiss,
  className = '',
}: CalloutHintProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const getVariantConfig = () => {
    switch (variant) {
      case 'tip':
        return {
          icon: Lightbulb,
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          iconColor: 'text-yellow-500',
        };
      case 'action':
        return {
          icon: Sparkles,
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/30',
          iconColor: 'text-primary',
        };
      case 'explore':
        return {
          icon: Compass,
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          iconColor: 'text-green-500',
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          iconColor: 'text-blue-500',
        };
    }
  };

  const config = getVariantConfig();
  const Icon = config.icon;

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border ${className}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${config.iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-medium">{title}</h4>
              {dismissible && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 -mt-1 -mr-1"
                  onClick={handleDismiss}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
            {actionLabel && onAction && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={onAction}
              >
                {actionLabel}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Inline hint for compact spaces
 */
export function InlineHint({
  text,
  variant = 'info',
}: {
  text: string;
  variant?: HintVariant;
}) {
  const getIconAndColor = () => {
    switch (variant) {
      case 'tip':
        return { icon: Lightbulb, color: 'text-yellow-500' };
      case 'action':
        return { icon: Sparkles, color: 'text-primary' };
      case 'explore':
        return { icon: Compass, color: 'text-green-500' };
      default:
        return { icon: Info, color: 'text-blue-500' };
    }
  };

  const { icon: Icon, color } = getIconAndColor();

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className={`h-3 w-3 ${color}`} />
      {text}
    </div>
  );
}

/**
 * Demo mode banner
 */
export function DemoBanner({ onExit }: { onExit?: () => void }) {
  return (
    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium">Demo Mode</span>
          <span className="text-xs text-muted-foreground">
            Viewing example data for demonstration purposes
          </span>
        </div>
        {onExit && (
          <Button variant="ghost" size="sm" onClick={onExit}>
            Exit Demo
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * No data placeholder with helpful message
 */
export function NoDataPlaceholder({
  message,
  suggestion,
}: {
  message: string;
  suggestion?: string;
}) {
  return (
    <div className="text-center py-8 space-y-2">
      <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
        <Info className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {suggestion && (
        <p className="text-xs text-muted-foreground/70">{suggestion}</p>
      )}
    </div>
  );
}

export default CalloutHint;
