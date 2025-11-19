'use client';

/**
 * ProposalTierCard Component - Phase 3 Step 5
 *
 * Beautiful card UI for displaying individual proposal packages (Good/Better/Best).
 * Features:
 * - Tier-specific colors and styling
 * - Feature list with checkmarks
 * - Pricing display
 * - Timeline and hours
 * - Selection state with highlight
 * - Call-to-action button
 */

import { Check, ArrowRight, Loader2, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ScopePackage } from '@/lib/projects/scope-planner';

interface ProposalTierCardProps {
  package: ScopePackage;
  selected: boolean;
  onSelect: () => void;
  submitting: boolean;
  onConfirm: () => void;
}

export function ProposalTierCard({
  package: pkg,
  selected,
  onSelect,
  submitting,
  onConfirm,
}: ProposalTierCardProps) {
  // Tier-specific styling
  const tierConfig = {
    good: {
      badge: 'bg-green-600 text-white',
      border: 'border-green-500',
      borderHover: 'hover:border-green-400',
      button: 'bg-green-600 hover:bg-green-700 text-white',
      gradient: 'from-green-900/20 to-gray-900/50',
      icon: <Check className="w-5 h-5" />,
    },
    better: {
      badge: 'bg-blue-600 text-white',
      border: 'border-blue-500',
      borderHover: 'hover:border-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      gradient: 'from-blue-900/20 to-gray-900/50',
      icon: <Star className="w-5 h-5" />,
      highlight: true, // Recommended tier
    },
    best: {
      badge: 'bg-purple-600 text-white',
      border: 'border-purple-500',
      borderHover: 'hover:border-purple-400',
      button: 'bg-purple-600 hover:bg-purple-700 text-white',
      gradient: 'from-purple-900/20 to-gray-900/50',
      icon: <Star className="w-5 h-5 fill-current" />,
    },
  };

  const config = tierConfig[pkg.tier];

  // Format price
  const formatPrice = (): string => {
    if (pkg.priceMin !== undefined && pkg.priceMax !== undefined) {
      return `$${pkg.priceMin.toLocaleString()} - $${pkg.priceMax.toLocaleString()}`;
    }
    if (pkg.priceMin !== undefined) {
      return `Starting at $${pkg.priceMin.toLocaleString()}`;
    }
    return 'Contact for pricing';
  };

  return (
    <Card
      className={`relative transition-all duration-200 ${
        selected
          ? `border-2 ${config.border} shadow-lg`
          : `border border-gray-800 ${config.borderHover}`
      } ${
        config.highlight && !selected ? 'ring-2 ring-blue-500/20' : ''
      }`}
    >
      {/* Recommended Badge */}
      {config.highlight && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-600 text-white font-semibold shadow-lg">
            ⭐ RECOMMENDED
          </Badge>
        </div>
      )}

      <div className={`bg-gradient-to-br ${config.gradient}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-2">
            <Badge className={`${config.badge} uppercase font-bold px-3 py-1`}>
              {pkg.label}
            </Badge>
            <div className={`${selected ? 'text-' + pkg.tier + '-400' : 'text-gray-600'}`}>
              {config.icon}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-100">
            {pkg.summary}
          </CardTitle>
          {pkg.estimatedHours && (
            <CardDescription className="text-gray-400">
              Estimated {pkg.estimatedHours} hours
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Pricing */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-100">
                {formatPrice()}
              </div>
              {pkg.timeline && (
                <div className="text-sm text-gray-400 mt-1">
                  Timeline: {pkg.timeline}
                </div>
              )}
            </div>
          </div>

          {/* Deliverables */}
          {pkg.deliverables && pkg.deliverables.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">
                What's Included:
              </h4>
              <ul className="space-y-2">
                {pkg.deliverables.map((deliverable, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-400">{deliverable}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {selected ? (
            <Button
              onClick={onConfirm}
              disabled={submitting}
              className={`w-full ${config.button}`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm {pkg.label}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onSelect}
              variant="outline"
              disabled={submitting}
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Select {pkg.label}
            </Button>
          )}
          {selected && (
            <p className="text-xs text-center text-gray-400">
              Click confirm to proceed to next steps
            </p>
          )}
        </CardFooter>
      </div>
    </Card>
  );
}
