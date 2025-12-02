'use client';

/**
 * Geo Grid Ranking Report Component
 * Phase 89B: Visualize GMB rankings across 5x5 geospatial grid
 *
 * Research Foundation:
 * - Google reduced local pack from 7 to 3 listings (must be top 3 to show)
 * - NAP consistency critical for local ranking
 * - Weekly updates boost freshness signal
 * - Based on Australian local SEO challenges (PWD, Abi White Local SEO)
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, TrendingUp, AlertCircle } from 'lucide-react';

export interface GeoGridPoint {
  id: string;
  latitude: number;
  longitude: number;
  keyword: string;
  rank: number; // 1-100, where 1-3 = visible in Google Maps, 4-10 = page 1, 11+ = page 2+
  visibility: 'visible' | 'page1' | 'page2_plus'; // visible = top 3
  lastUpdated: string;
  reviewCount: number;
  rating: number;
}

export interface GeoGridAnalysis {
  businessName: string;
  centerLocation: { lat: number; lng: number };
  radiusKm: number;
  gridPoints: GeoGridPoint[];
  keywords: string[];
  summary: {
    averageRank: number;
    visiblePoints: number; // Top 3
    page1Points: number; // 4-10
    improvementOpportunities: number;
  };
}

interface GeoGridRankingReportProps {
  analysis: GeoGridAnalysis;
  className?: string;
}

/**
 * Render a single grid cell with rank visualization
 * Color coding based on actual Google visibility tiers
 */
function RankCell({
  point,
  keyword,
}: {
  point: GeoGridPoint;
  keyword: string;
}) {
  // Color scale: green (1-3) → yellow (4-10) → orange (11-20) → red (21+)
  let bgColor = 'bg-red-100';
  let textColor = 'text-red-900';
  let borderColor = 'border-red-300';

  if (point.rank <= 3) {
    bgColor = 'bg-green-100';
    textColor = 'text-green-900';
    borderColor = 'border-green-400';
  } else if (point.rank <= 10) {
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-900';
    borderColor = 'border-yellow-400';
  } else if (point.rank <= 20) {
    bgColor = 'bg-orange-100';
    textColor = 'text-orange-900';
    borderColor = 'border-orange-400';
  }

  return (
    <div
      className={`
        p-3 rounded-lg border-2 ${borderColor} ${bgColor}
        text-center cursor-help hover:shadow-lg transition-shadow
        min-h-[80px] flex flex-col justify-center
      `}
      title={`${keyword} - Rank #${point.rank} at ${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`}
    >
      <div className={`font-bold text-lg ${textColor}`}>#{point.rank}</div>
      <div className={`text-xs ${textColor} font-medium`}>{keyword.split(' ')[0]}</div>
      <div className={`text-xs ${textColor} opacity-75`}>
        {point.rating}★ ({point.reviewCount})
      </div>
    </div>
  );
}

export default function GeoGridRankingReport({
  analysis,
  className = '',
}: GeoGridRankingReportProps) {
  // Group points by keyword for easier visualization
  const gridByKeyword = useMemo(() => {
    const groups: Record<string, GeoGridPoint[]> = {};
    analysis.keywords.forEach((kw) => {
      groups[kw] = analysis.gridPoints.filter((p) => p.keyword === kw);
    });
    return groups;
  }, [analysis]);

  const renderVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'visible':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
            ✓ Visible (Top 3)
          </span>
        );
      case 'page1':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
            Page 1 (4-10)
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
            Page 2+ (11+)
          </span>
        );
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            GeoGrid Ranking Analysis
          </CardTitle>
          <CardDescription>
            {analysis.businessName} • {analysis.keywords.length} keywords • {analysis.gridPoints.length} grid points
            (5×5 grid, {analysis.radiusKm}km radius)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{analysis.summary.visiblePoints}</div>
              <div className="text-sm text-green-600 font-medium">Visible (Top 3)</div>
              <div className="text-xs text-green-500 mt-1">Google Maps rank</div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">{analysis.summary.page1Points}</div>
              <div className="text-sm text-yellow-600 font-medium">Page 1 Rank (4-10)</div>
              <div className="text-xs text-yellow-500 mt-1">Easy wins</div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">#{{ num: Math.round(analysis.summary.averageRank) }}</div>
              <div className="text-sm text-orange-600 font-medium">Avg Rank</div>
              <div className="text-xs text-orange-500 mt-1">Across grid</div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{analysis.summary.improvementOpportunities}</div>
              <div className="text-sm text-blue-600 font-medium">Quick Wins</div>
              <div className="text-xs text-blue-500 mt-1">to top 10</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Keyword Grid Visualizations */}
      {analysis.keywords.map((keyword) => {
        const points = gridByKeyword[keyword] || [];
        const visibleCount = points.filter((p) => p.visibility === 'visible').length;
        const page1Count = points.filter((p) => p.visibility === 'page1').length;

        return (
          <Card key={keyword}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{keyword}</CardTitle>
                  <CardDescription>5×5 geospatial grid analysis</CardDescription>
                </div>
                <div className="flex gap-2">
                  {renderVisibilityBadge(
                    visibleCount > 0 ? 'visible' : page1Count > 0 ? 'page1' : 'page2_plus'
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 5x5 Grid Visualization */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 25 }).map((_, index) => {
                    // Create 5x5 grid positions
                    const gridX = index % 5;
                    const gridY = Math.floor(index / 5);

                    // Find point at this grid position
                    const point = points.find(
                      (p) =>
                        Math.abs(p.latitude - (analysis.centerLocation.lat + (gridY - 2) * 0.05)) < 0.03 &&
                        Math.abs(p.longitude - (analysis.centerLocation.lng + (gridX - 2) * 0.05)) < 0.03
                    );

                    return (
                      <div key={index}>
                        {point ? (
                          <RankCell point={point} keyword={keyword} />
                        ) : (
                          <div className="p-3 rounded-lg bg-gray-200 text-center text-gray-500 text-xs font-medium min-h-[80px] flex items-center justify-center">
                            No data
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Grid Legend */}
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-200 border-2 border-green-400 rounded"></div>
                    <span className="text-xs">Rank 1-3 (Visible)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-200 border-2 border-yellow-400 rounded"></div>
                    <span className="text-xs">Rank 4-10 (Page 1)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-200 border-2 border-orange-400 rounded"></div>
                    <span className="text-xs">Rank 11-20</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-200 border-2 border-red-400 rounded"></div>
                    <span className="text-xs">Rank 21+ (Page 2+)</span>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="mt-4 space-y-3">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-900">Top 3 Visibility:</p>
                      <p className="text-blue-700 mt-1">
                        {visibleCount === 0
                          ? 'Your business is not appearing in Google Maps top 3 for this keyword. This is critical - you must reach top 3 to be visible in local pack results.'
                          : `Great! Your business appears in top 3 for ${visibleCount}/5 grid locations. Maintain weekly GMB updates.`}
                      </p>
                    </div>
                  </div>
                </div>

                {page1Count > 0 && visibleCount < 5 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold text-yellow-900">Quick Wins Available:</p>
                        <p className="text-yellow-700 mt-1">
                          You're on page 1 for {page1Count} locations. These are closest to top 3 visibility.
                          Focus on: reviews, fresh photos, updated hours, and posts for these keywords.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations Based on Research</CardTitle>
          <CardDescription>Proven tactics to improve GeoGrid visibility</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-blue-900">1. Weekly GMB Updates (Verified Impact)</h4>
              <p className="text-sm text-gray-700 mt-1">
                Update your Google Business Profile at least weekly. Research shows this signals freshness and boosts local ranking.
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-green-900">2. NAP Consistency (Critical)</h4>
              <p className="text-sm text-gray-700 mt-1">
                Ensure Name, Address, Phone are identical across all listings (Google, Localsearch, TrueLocal, Hotfrog, StartLocal).
                Inconsistencies confuse Google's algorithm.
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold text-purple-900">3. Review Generation (Most Powerful Signal)</h4>
              <p className="text-sm text-gray-700 mt-1">
                5-star reviews are more powerful than any other factor for local ranking. Target {Math.round(analysis.gridPoints[0]?.reviewCount || 20) + 10} reviews minimum.
              </p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-semibold text-orange-900">4. Photo Updates & Posts</h4>
              <p className="text-sm text-gray-700 mt-1">
                Upload new photos weekly. Create posts for offers, events, or updates. This keeps your listing fresh and improves visibility.
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-red-900">5. Audit Your Competitors</h4>
              <p className="text-sm text-gray-700 mt-1">
                Competitors in green (top 3) are likely updating weekly, posting reviews, and maintaining consistent NAP.
                Match or exceed their activity level.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
