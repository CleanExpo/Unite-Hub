'use client';

/**
 * ProposalComparison Component - Phase 3 Step 5
 *
 * Side-by-side comparison table for Good/Better/Best proposal packages.
 * Displays features, deliverables, pricing, and timeline in a structured format.
 *
 * Features:
 * - Responsive table layout
 * - Highlight selected tier
 * - Visual feature checkmarks
 * - Clear pricing display
 * - Call-to-action buttons
 */

import { Check, X, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ScopePackage } from '@/lib/projects/scope-planner';

interface ProposalComparisonProps {
  packages: ScopePackage[];
  selectedTier: 'good' | 'better' | 'best' | null;
  onSelectTier: (tier: 'good' | 'better' | 'best') => void;
  submitting: boolean;
  onConfirm: (tier: 'good' | 'better' | 'best') => void;
}

export function ProposalComparison({
  packages,
  selectedTier,
  onSelectTier,
  submitting,
  onConfirm,
}: ProposalComparisonProps) {
  // Sort packages by tier order
  const sortedPackages = [...packages].sort((a, b) => {
    const order = { good: 1, better: 2, best: 3 };
    return order[a.tier] - order[b.tier];
  });

  // Extract all unique deliverables across packages
  const allDeliverables = Array.from(
    new Set(
      sortedPackages.flatMap(pkg => pkg.deliverables || [])
    )
  );

  // Check if a package includes a deliverable
  const hasDeliverable = (pkg: ScopePackage, deliverable: string): boolean => {
    return pkg.deliverables?.includes(deliverable) || false;
  };

  // Format price range
  const formatPrice = (pkg: ScopePackage): string => {
    if (pkg.priceMin !== undefined && pkg.priceMax !== undefined) {
      return `$${pkg.priceMin.toLocaleString()} - $${pkg.priceMax.toLocaleString()}`;
    }
    if (pkg.priceMin !== undefined) {
      return `Starting at $${pkg.priceMin.toLocaleString()}`;
    }
    return 'Contact for pricing';
  };

  // Get tier color
  const getTierColor = (tier: 'good' | 'better' | 'best'): string => {
    const colors = {
      good: 'bg-green-600',
      better: 'bg-blue-600',
      best: 'bg-purple-600',
    };
    return colors[tier];
  };

  // Get tier border color
  const getTierBorderColor = (tier: 'good' | 'better' | 'best', isSelected: boolean): string => {
    if (isSelected) {
      const colors = {
        good: 'border-green-500',
        better: 'border-blue-500',
        best: 'border-purple-500',
      };
      return colors[tier];
    }
    return 'border-gray-800';
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 border-b border-gray-800">
                  <span className="text-sm font-semibold text-gray-400 uppercase">
                    Feature
                  </span>
                </th>
                {sortedPackages.map((pkg) => (
                  <th
                    key={pkg.id}
                    className={`p-4 border-b border-l ${
                      getTierBorderColor(pkg.tier, selectedTier === pkg.tier)
                    } ${
                      selectedTier === pkg.tier ? 'border-2' : 'border-gray-800'
                    }`}
                  >
                    <div className="text-center space-y-2">
                      <Badge className={`${getTierColor(pkg.tier)} text-white uppercase font-bold`}>
                        {pkg.label}
                      </Badge>
                      <h3 className="text-lg font-bold text-gray-100">
                        {pkg.summary}
                      </h3>
                      {pkg.estimatedHours && (
                        <p className="text-xs text-gray-400">
                          ~{pkg.estimatedHours} hours
                        </p>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Pricing Row */}
              <tr>
                <td className="p-4 border-b border-gray-800">
                  <span className="text-sm font-semibold text-gray-300">
                    Pricing
                  </span>
                </td>
                {sortedPackages.map((pkg) => (
                  <td
                    key={pkg.id}
                    className={`p-4 border-b border-l ${
                      getTierBorderColor(pkg.tier, selectedTier === pkg.tier)
                    } ${
                      selectedTier === pkg.tier ? 'border-2' : 'border-gray-800'
                    } text-center`}
                  >
                    <span className="text-xl font-bold text-gray-100">
                      {formatPrice(pkg)}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Timeline Row */}
              <tr>
                <td className="p-4 border-b border-gray-800">
                  <span className="text-sm font-semibold text-gray-300">
                    Timeline
                  </span>
                </td>
                {sortedPackages.map((pkg) => (
                  <td
                    key={pkg.id}
                    className={`p-4 border-b border-l ${
                      getTierBorderColor(pkg.tier, selectedTier === pkg.tier)
                    } ${
                      selectedTier === pkg.tier ? 'border-2' : 'border-gray-800'
                    } text-center`}
                  >
                    <span className="text-sm text-gray-400">
                      {pkg.timeline || 'TBD'}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Deliverables Rows */}
              {allDeliverables.map((deliverable, index) => (
                <tr key={index}>
                  <td className="p-4 border-b border-gray-800">
                    <span className="text-sm text-gray-300">
                      {deliverable}
                    </span>
                  </td>
                  {sortedPackages.map((pkg) => (
                    <td
                      key={pkg.id}
                      className={`p-4 border-b border-l ${
                        getTierBorderColor(pkg.tier, selectedTier === pkg.tier)
                      } ${
                        selectedTier === pkg.tier ? 'border-2' : 'border-gray-800'
                      } text-center`}
                    >
                      {hasDeliverable(pkg, deliverable) ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-600 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Action Buttons Row */}
              <tr>
                <td className="p-4 border-gray-800">
                  {/* Empty cell */}
                </td>
                {sortedPackages.map((pkg) => (
                  <td
                    key={pkg.id}
                    className={`p-4 border-l ${
                      getTierBorderColor(pkg.tier, selectedTier === pkg.tier)
                    } ${
                      selectedTier === pkg.tier ? 'border-2' : 'border-gray-800'
                    } text-center`}
                  >
                    {selectedTier === pkg.tier ? (
                      <Button
                        onClick={() => onConfirm(pkg.tier)}
                        disabled={submitting}
                        className={`w-full ${getTierColor(pkg.tier)} hover:opacity-90 text-white`}
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
                        onClick={() => onSelectTier(pkg.tier)}
                        variant="outline"
                        disabled={submitting}
                        className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        Select {pkg.label}
                      </Button>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile Fallback Message */}
        <div className="md:hidden mt-4 p-4 bg-yellow-900/20 border border-yellow-800/30 rounded-lg">
          <p className="text-xs text-yellow-200/70">
            💡 <strong>Tip:</strong> For the best comparison experience, rotate your device to landscape mode
            or switch to card view.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
