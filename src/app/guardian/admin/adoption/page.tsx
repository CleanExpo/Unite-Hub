'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import CoachPanel from '@/components/guardian/meta/CoachPanel';

const ScoreBar = ({ score }: { score: number }) => {
  const safeScore = Math.min(100, Math.max(0, score));
  // Use inline style for dynamic score width (CSS variable pattern)
  return (
    <div className="w-full bg-gray-300 rounded-full h-2">
      <div
        className="bg-accent-500 h-2 rounded-full transition-all duration-300"
        // eslint-disable-next-line @stylistic/jsx-no-constructed-context-values
        style={{ width: `${safeScore}%` } as React.CSSProperties}
      />
    </div>
  );
};

interface DimensionScore {
  dimension: string;
  score: number;
  status: string;
  signals: Record<string, any>;
  sub_dimension: string;
}

interface AdoptionData {
  computed_at: string;
  dimensions: Array<{
    dimension: string;
    subdimensions: DimensionScore[];
  }>;
}

export default function AdoptionOverviewPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');
  const [adoption, setAdoption] = useState<AdoptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const fetchAdoption = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/guardian/meta/adoption/overview?workspaceId=${workspaceId}`);
        if (!res.ok) throw new Error('Failed to load adoption overview');
        const data = await res.json();
        setAdoption(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAdoption();
  }, [workspaceId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'power':
        return 'bg-green-100 text-green-800';
      case 'regular':
        return 'bg-blue-100 text-blue-800';
      case 'light':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading adoption overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!adoption) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>No adoption data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Adoption Overview</h1>
          <p className="text-gray-600 mt-2">
            Last updated: {new Date(adoption.computed_at).toLocaleDateString()}
          </p>
        </div>

        {/* Coach Panel + Dimensions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Coach Panel - Sidebar */}
          <div className="lg:col-span-1">
            {workspaceId && <CoachPanel workspaceId={workspaceId} />}
          </div>

          {/* Dimension Cards Grid */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {adoption.dimensions.map((dimension) => (
            <div
              key={dimension.dimension}
              className="bg-white rounded-lg shadow p-6 border-l-4 border-accent-500"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                {dimension.dimension.replace(/_/g, ' ')}
              </h2>

              {/* Subdimension Cards */}
              <div className="space-y-3">
                {dimension.subdimensions.map((sub) => (
                  <div key={sub.sub_dimension} className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700 font-medium">
                        {sub.sub_dimension.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(sub.status)}`}>
                        {getStatusLabel(sub.status)}
                      </span>
                    </div>

                    {/* Score Bar */}
                    <ScoreBar score={sub.score} />

                    {/* Score Text */}
                    <p className="text-xs text-gray-500 mt-1">{Math.round(sub.score)}/100</p>

                    {/* Signals Detail */}
                    {Object.keys(sub.signals).length > 0 && (
                      <div className="text-xs text-gray-600 mt-2 border-t border-gray-200 pt-2">
                        <details className="cursor-pointer">
                          <summary className="font-medium">Signals ({Object.keys(sub.signals).length})</summary>
                          <div className="mt-1 space-y-1 ml-2">
                            {Object.entries(sub.signals).map(([key, value]) => (
                              <div key={key} className="text-gray-600">
                                {typeof value === 'object'
                                  ? `${key}: ${(value as any).value || value}`
                                  : `${key}: ${value}`}
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Health</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {adoption.dimensions.map((dimension) => {
              const avgScore =
                dimension.subdimensions.reduce((sum, sub) => sum + sub.score, 0) /
                (dimension.subdimensions.length || 1);
              const powerCount = dimension.subdimensions.filter((s) => s.status === 'power').length;

              return (
                <div key={dimension.dimension} className="text-center">
                  <p className="text-sm text-gray-600 mb-2 capitalize">
                    {dimension.dimension.replace(/_/g, ' ')}
                  </p>
                  <p className="text-2xl font-bold text-accent-500">{Math.round(avgScore)}</p>
                  <p className="text-xs text-gray-500">
                    {powerCount} power adoption{powerCount !== 1 ? 's' : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
