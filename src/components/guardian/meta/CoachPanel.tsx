'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface Nudge {
  id: string;
  nudge_key: string;
  title: string;
  body: string;
  category: string;
  severity: 'info' | 'tip' | 'important';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'shown' | 'dismissed' | 'completed';
  context: Record<string, any>;
  metadata: Record<string, any>;
  expiry_at?: string;
}

interface CoachPanelProps {
  workspaceId: string;
}

const SEVERITY_COLORS = {
  info: 'bg-blue-100 text-blue-800',
  tip: 'bg-green-100 text-green-800',
  important: 'bg-amber-100 text-amber-800',
};

const PRIORITY_ICONS = {
  high: <AlertCircle className="w-4 h-4 text-red-500" />,
  medium: <AlertCircle className="w-4 h-4 text-yellow-500" />,
  low: <AlertCircle className="w-4 h-4 text-blue-500" />,
};

export default function CoachPanel({ workspaceId }: CoachPanelProps) {
  const router = useRouter();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const fetchNudges = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/guardian/meta/coach/nudges?workspaceId=${workspaceId}&limit=3`
        );
        if (!res.ok) throw new Error('Failed to load nudges');
        const data = await res.json();
        setNudges(data.data.nudges || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchNudges();
  }, [workspaceId]);

  const handleNudgeAction = async (nudgeId: string, newStatus: 'shown' | 'dismissed' | 'completed') => {
    try {
      const res = await fetch(`/api/guardian/meta/coach/nudges?workspaceId=${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: nudgeId, status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update nudge');

      // Remove nudge from UI after action
      setNudges(nudges.filter((n) => n.id !== nudgeId));
    } catch (err) {
      console.error('Error updating nudge:', err);
    }
  };

  const handleCta = (nudgeKey: string) => {
    // Route based on nudge context
    const routeMap: Record<string, string> = {
      run_first_simulation: '/guardian/admin/simulation',
      enable_network_intelligence: '/guardian/admin/network',
      action_open_recommendations: '/guardian/admin/network?tab=recommendations',
      close_uplift_tasks: '/guardian/admin/readiness?tab=uplift',
      generate_executive_report: '/guardian/admin/executive',
      improve_qa_coverage: '/guardian/admin/qa-coverage',
    };

    const route = routeMap[nudgeKey] || '/guardian/admin/adoption';
    router.push(`${route}?workspaceId=${workspaceId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Guardian Coach</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Loading guidance...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Guardian Coach</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Error loading nudges</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Guardian Coach</CardTitle>
          {nudges.length > 0 && (
            <Badge variant="secondary">{nudges.length} tips</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {nudges.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {nudges.map((nudge) => (
              <div
                key={nudge.id}
                className="border border-gray-200 rounded-lg p-3 bg-gradient-to-r from-blue-50 to-transparent"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    {PRIORITY_ICONS[nudge.priority]}
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900">{nudge.title}</h4>
                      <Badge
                        className={`text-xs mt-1 ${SEVERITY_COLORS[nudge.severity]}`}
                        variant="outline"
                      >
                        {nudge.severity}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNudgeAction(nudge.id, 'dismissed')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <p className="text-sm text-gray-700 mb-3">{nudge.body}</p>

                {/* Micro Tips (from AI enhancement) */}
                {nudge.metadata.ai_micro_tips && nudge.metadata.ai_micro_tips.length > 0 && (
                  <div className="bg-white/50 rounded p-2 mb-3 text-xs text-gray-600 space-y-1">
                    {nudge.metadata.ai_micro_tips.map((tip: string, idx: number) => (
                      <div key={idx}>• {tip}</div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleCta(nudge.nudge_key)}
                    className="bg-accent-500 hover:bg-accent-600 text-white flex-1"
                  >
                    Take Action
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleNudgeAction(nudge.id, 'dismissed')}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Later
                  </Button>
                </div>
              </div>
            ))}

            {/* View All */}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-sm"
              onClick={() => router.push(`/guardian/admin/adoption?workspaceId=${workspaceId}`)}
            >
              View All Guidance
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
