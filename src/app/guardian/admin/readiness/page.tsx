'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, TrendingUp, BookOpen } from 'lucide-react';

interface CapabilityScore {
  key: string;
  label: string;
  category: string;
  description: string;
  score: number;
  status: 'not_configured' | 'partial' | 'ready' | 'advanced';
  details: Record<string, unknown>;
}

interface ReadinessOverview {
  computedAt: string | null;
  overall: {
    score: number;
    status: 'baseline' | 'operational' | 'mature' | 'network_intelligent';
  };
  capabilities: CapabilityScore[];
}

const STATUS_COLORS = {
  not_configured: 'bg-red-100 text-red-800',
  partial: 'bg-yellow-100 text-yellow-800',
  ready: 'bg-green-100 text-green-800',
  advanced: 'bg-blue-100 text-blue-800',
};

const OVERALL_STATUS_COLORS = {
  baseline: 'bg-gray-100 text-gray-800',
  operational: 'bg-yellow-100 text-yellow-800',
  mature: 'bg-green-100 text-green-800',
  network_intelligent: 'bg-blue-100 text-blue-800',
};

const OVERALL_STATUS_DESC = {
  baseline: 'Core Guardian rules engine only. Ready for basic rule-based alerts.',
  operational: 'Core + Risk engine enabled. Running incident correlation and risk scoring.',
  mature: 'Operational + QA chaos testing. Validating rules with simulation.',
  network_intelligent: 'Mature + X-series network intelligence. Leveraging cohort benchmarks and early warnings.',
};

const CATEGORY_DESCRIPTIONS = {
  core: 'Core rule engine, alerts, incidents, and risk scoring',
  ai_intelligence: 'AI-powered assistance (H-series, when available)',
  qa_chaos: 'QA simulation and chaos testing (I-series)',
  network_intelligence: 'Network telemetry and peer intelligence (X-series)',
  governance: 'Audit, compliance, and readiness tracking',
};

export default function GuardianReadinessPage() {
  const [readiness, setReadiness] = useState<ReadinessOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = '00000000-0000-0000-0000-000000000000'; // TODO: Get from auth

  useEffect(() => {
    const loadReadiness = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/guardian/meta/readiness/overview?workspaceId=${workspaceId}`
        );

        if (!res.ok) {
          throw new Error(`Failed to load readiness: ${res.status}`);
        }

        const data = await res.json();
        setReadiness(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadReadiness();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12 text-gray-500">Loading Guardian readiness...</div>
      </div>
    );
  }

  if (!readiness) {
    return (
      <div className="space-y-6 p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-900">{error || 'Failed to load readiness data'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group capabilities by category
  const capsByCategory = readiness.capabilities.reduce(
    (acc, cap) => {
      if (!acc[cap.category]) {
        acc[cap.category] = [];
      }
      acc[cap.category].push(cap);
      return acc;
    },
    {} as Record<string, CapabilityScore[]>
  );

  // Calculate category averages
  const categoryAverages = Object.entries(capsByCategory).reduce(
    (acc, [cat, caps]) => {
      const avg = Math.round(caps.reduce((sum, c) => sum + c.score, 0) / caps.length);
      acc[cat] = avg;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Guardian Readiness Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Capability status and tenant maturity assessment
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Advisory Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 flex items-start gap-2">
            <TrendingUp className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <strong>Advisory-Only:</strong> Readiness scores help identify gaps and opportunities for
              Guardian adoption. They do not affect alerting, incidents, or enforcement logic. Configuration
              and activation remain completely under your control.
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Overall Score Card */}
      <Card className="border-accent-500 border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Guardian Readiness</span>
            <Badge className={OVERALL_STATUS_COLORS[readiness.overall.status]}>
              {readiness.overall.status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <div className="text-6xl font-bold text-accent-600">{readiness.overall.score}</div>
              <p className="text-gray-600 mt-2">Overall Capability Score (0-100)</p>
            </div>

            {/* Status Description */}
            <div className="flex-1 space-y-3">
              <p className="text-sm font-medium text-gray-900">
                {OVERALL_STATUS_DESC[readiness.overall.status]}
              </p>
              <div className="flex gap-2 text-xs">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span className="text-gray-600">Computed at {readiness.computedAt ? new Date(readiness.computedAt).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-gray-900 mb-3">Category Scores</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(categoryAverages).map(([cat, score]) => (
                <div key={cat} className="p-3 bg-gray-50 rounded border">
                  <div className="text-2xl font-bold text-accent-600">{score}</div>
                  <p className="text-xs text-gray-600 mt-1 capitalize">
                    {cat.replace(/_/g, ' ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capabilities by Category */}
      {Object.entries(capsByCategory).map(([category, capabilities]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg capitalize">
              {category.replace(/_/g, ' ')}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {CATEGORY_DESCRIPTIONS[category as keyof typeof CATEGORY_DESCRIPTIONS]}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {capabilities.map((cap) => (
                <div key={cap.key} className="p-4 border rounded hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{cap.label}</p>
                      <p className="text-xs text-gray-600 mt-1">{cap.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-accent-600">{cap.score}</div>
                        <Badge className={STATUS_COLORS[cap.status]} variant="outline">
                          {cap.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  {Object.keys(cap.details).length > 0 && (
                    <div className="mt-3 pt-3 border-t text-xs">
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        {Object.entries(cap.details).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>{' '}
                            {typeof value === 'boolean' ? (value ? '✓ Yes' : '✗ No') : String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Navigation & Next Steps */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-green-900">
            Use your readiness score to prioritize Guardian adoption. Areas with lower scores represent opportunities to expand Guardian capabilities:
          </p>
          <ul className="space-y-2 text-green-900 ml-4">
            <li>• <strong>Rules & Alerts:</strong> Build and activate rule templates</li>
            <li>• <strong>Risk Scoring:</strong> Enable the risk engine for incident prioritization</li>
            <li>• <strong>QA & Simulation:</strong> Add regression testing to validate rule changes</li>
            <li>• <strong>Network Intelligence:</strong> Enable X-series for peer comparison and early warnings</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
