'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';

interface EditionProfile {
  key: string;
  label: string;
  description: string;
  tier: string;
  capabilitiesRequired: string[];
  capabilitiesNiceToHave: string[];
  minOverallScore: number;
  recommendedOverallScore: number;
  isDefault?: boolean;
}

interface EditionFitGap {
  capabilityKey: string;
  label?: string;
  gapType: 'missing' | 'low_score';
  currentScore?: number;
  targetScore?: number;
}

interface EditionFit {
  key: string;
  label: string;
  tier: string;
  overallFitScore: number;
  status: 'not_started' | 'emerging' | 'aligned' | 'exceeds';
  capabilityScores: Record<string, { score: number; status: string; weight: number }>;
  gaps: EditionFitGap[];
}

const TIER_COLORS = {
  core: 'bg-blue-100 text-blue-800',
  pro: 'bg-purple-100 text-purple-800',
  elite: 'bg-amber-100 text-amber-800',
  custom: 'bg-gray-100 text-gray-800',
};

const STATUS_COLORS = {
  not_started: 'bg-red-100 text-red-800 border-red-300',
  emerging: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  aligned: 'bg-green-100 text-green-800 border-green-300',
  exceeds: 'bg-blue-100 text-blue-800 border-blue-300',
};

export default function EditionsPage() {
  const [editions, setEditions] = useState<EditionProfile[]>([]);
  const [fits, setFits] = useState<EditionFit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);
  const [expandedEdition, setExpandedEdition] = useState<string | null>(null);

  const workspaceId = '00000000-0000-0000-0000-000000000000'; // TODO: Get from auth

  // Load editions and fits on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load edition profiles
        const edRes = await fetch('/api/guardian/meta/editions');
        if (!edRes.ok) throw new Error(`Failed to load editions: ${edRes.status}`);
        const edData = await edRes.json();
        setEditions(edData.data?.editions || []);

        // Load edition fits
        const fitRes = await fetch(
          `/api/guardian/meta/editions/fit?workspaceId=${workspaceId}`
        );
        if (!fitRes.ok) throw new Error(`Failed to load fits: ${fitRes.status}`);
        const fitData = await fitRes.json();
        setFits(fitData.data?.editions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleComputeFit = async () => {
    try {
      setComputing(true);
      const res = await fetch(
        `/api/guardian/meta/editions/fit/compute?workspaceId=${workspaceId}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );

      if (!res.ok) throw new Error(`Failed to compute: ${res.status}`);
      const data = await res.json();
      setFits(data.data?.editions || []);
    } catch (err) {
      console.error('Failed to compute edition fit:', err);
    } finally {
      setComputing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12 text-gray-500">Loading editions...</div>
      </div>
    );
  }

  // Map editions to fits for display
  const fitMap = new Map(fits.map((f) => [f.key, f]));
  const editionsWithFits = editions.map((ed) => ({
    ...ed,
    fit: fitMap.get(ed.key),
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Guardian Editions</h1>
          <p className="text-gray-600 mt-1">Capability packaging & adoption roadmap</p>
        </div>
        <Button
          onClick={handleComputeFit}
          disabled={computing}
          className="bg-accent-600 hover:bg-accent-700"
        >
          {computing ? 'Computing...' : 'Compute Fit'}
        </Button>
      </div>

      {/* Advisory Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 flex items-start gap-2">
            <TrendingUp className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <strong>Editions are Advisory.</strong> Guardian editions help you plan adoption
              journeys by grouping capabilities into named packages (Core, Pro, Network-Intelligent).
              Edition fit shows how close your current configuration is to each target edition—no
              enforcement or licensing applied.
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Editions Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {editionsWithFits.map((edition) => {
          const fit = edition.fit;
          const fitScore = fit?.overallFitScore ?? 0;

          return (
            <Card
              key={edition.key}
              className="border-2 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setExpandedEdition(expandedEdition === edition.key ? null : edition.key)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{edition.label}</CardTitle>
                    <Badge className={`mt-2 ${TIER_COLORS[edition.tier as keyof typeof TIER_COLORS]}`}>
                      {edition.tier.charAt(0).toUpperCase() + edition.tier.slice(1)}
                    </Badge>
                  </div>
                  {edition.isDefault && (
                    <Badge className="bg-accent-100 text-accent-800">Default</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2">{edition.description}</p>

                {/* Fit Progress (if computed) */}
                {fit && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium">Edition Fit</span>
                      <Badge
                        className={`text-xs ${STATUS_COLORS[fit.status as keyof typeof STATUS_COLORS]}`}
                      >
                        {fit.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          fit.status === 'not_started'
                            ? 'bg-red-500'
                            : fit.status === 'emerging'
                              ? 'bg-yellow-500'
                              : fit.status === 'aligned'
                                ? 'bg-green-500'
                                : 'bg-blue-500'
                        }`}
                        style={{ width: `${fitScore}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600">
                      {fitScore}/100 (Target: {edition.recommendedOverallScore})
                    </p>
                  </div>
                )}

                {/* Expand button */}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedEdition(expandedEdition === edition.key ? null : edition.key);
                  }}
                >
                  {expandedEdition === edition.key ? 'Collapse' : 'View Details'}{' '}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>

              {/* Expanded Details */}
              {expandedEdition === edition.key && fit && (
                <div className="border-t bg-gray-50 p-4 space-y-4">
                  {/* Gaps */}
                  {fit.gaps.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-900">Gaps to Address</h4>
                      <div className="space-y-2">
                        {fit.gaps.map((gap, idx) => (
                          <div key={idx} className="text-xs bg-white p-2 rounded border border-gray-200">
                            <p className="font-medium text-gray-700">{gap.capabilityKey}</p>
                            <p className="text-gray-600 mt-1">
                              {gap.gapType === 'missing'
                                ? 'Not yet configured'
                                : `Score: ${gap.currentScore} → Target: ${gap.targetScore}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  <div className="pt-2">
                    <p className="text-xs font-medium text-gray-700 mb-2">Next Steps</p>
                    <Button variant="ghost" size="sm" className="w-full text-accent-600 hover:text-accent-700">
                      → Generate Uplift Plan
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Edition Selection Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Edition Selection Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {editionsWithFits.slice(0, 3).map((ed) => (
              <div key={ed.key} className="p-3 border rounded">
                <p className="font-medium text-sm mb-1">{ed.label}</p>
                <p className="text-xs text-gray-600">
                  {ed.description.split('.')[0]}. Best for: {ed.tier === 'core' ? 'teams starting out' : ed.tier === 'pro' ? 'scaling operations' : 'full-stack monitoring'}.
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  Min score: {ed.minOverallScore} | Target: {ed.recommendedOverallScore}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Banner */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
