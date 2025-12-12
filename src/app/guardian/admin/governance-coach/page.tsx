'use client';

/**
 * Guardian H05: Governance Coach Admin Page
 * Enablement wizard UI with:
 * - New Session panel (initiates coaching)
 * - Sessions list (history of coach sessions)
 * - Session detail view (plan, actions, apply button)
 * - Actions table (approval workflow)
 * - Role-specific views (operator, leadership, cs_handoff)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';

export default function GovernanceCoachPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || '';

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedActions, setSelectedActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coachMode, setCoachMode] = useState('operator');
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [showApplyConfirmation, setShowApplyConfirmation] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  // Load sessions on mount
  useEffect(() => {
    if (workspaceId) {
      loadSessions();
    }
  }, [workspaceId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/guardian/meta/coach/sessions?workspaceId=${workspaceId}`);
      if (!res.ok) throw new Error('Failed to load sessions');
      const data = await res.json();
      setSessions(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetail = async (sessionId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/guardian/meta/coach/sessions/${sessionId}?workspaceId=${workspaceId}`);
      if (!res.ok) throw new Error('Failed to load session');
      const data = await res.json();
      setSelectedSession(data.session);
      setSelectedActions(data.actions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`/api/guardian/meta/coach/sessions?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachMode,
          targetFeatures: 'h01_h02_h03_h04',
        }),
      });
      if (!res.ok) throw new Error('Failed to create session');
      const session = await res.json();
      setSessions([session, ...sessions]);
      setSelectedSession(session);
      setShowNewSessionDialog(false);
      await loadSessionDetail(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const approveAction = async (actionId: string) => {
    if (!selectedSession) return;
    try {
      const res = await fetch(
        `/api/guardian/meta/coach/sessions/${selectedSession.id}/actions/${actionId}/approve?workspaceId=${workspaceId}`,
        { method: 'POST' }
      );
      if (!res.ok) throw new Error('Failed to approve action');
      await loadSessionDetail(selectedSession.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const applySession = async () => {
    if (!selectedSession) return;
    try {
      setApplyLoading(true);
      const res = await fetch(`/api/guardian/meta/coach/sessions/${selectedSession.id}?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          confirm: true,
        }),
      });
      if (!res.ok) throw new Error('Failed to apply session');
      const result = await res.json();
      setShowApplyConfirmation(false);
      await loadSessionDetail(selectedSession.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setApplyLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      initial: { color: 'bg-gray-200', icon: <Clock className="w-3 h-3" /> },
      plan_generated: { color: 'bg-blue-200', icon: <Zap className="w-3 h-3" /> },
      approved: { color: 'bg-amber-200', icon: <AlertCircle className="w-3 h-3" /> },
      applied: { color: 'bg-green-200', icon: <CheckCircle className="w-3 h-3" /> },
      failed: { color: 'bg-red-200', icon: <AlertCircle className="w-3 h-3" /> },
    };
    const config = statusConfig[status] || { color: 'bg-gray-200', icon: <Clock className="w-3 h-3" /> };
    return (
      <Badge className={`${config.color} text-gray-900 flex items-center gap-1`}>
        {config.icon}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const pendingApprovals = selectedActions?.filter((a: any) => a.status === 'pending') || [];
  const allApproved = pendingApprovals.length === 0 && selectedActions.length > 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guardian Governance Coach</h1>
          <p className="text-gray-600 mt-2">Safe, staged rollout planning for H-series features</p>
        </div>
        <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
          <DialogTrigger asChild>
            <Button className="bg-accent-500 hover:bg-accent-600">+ New Session</Button>
          </DialogTrigger>
          <DialogContent className="bg-bg-card border-border">
            <DialogHeader>
              <DialogTitle>Start Governance Coach Session</DialogTitle>
              <DialogDescription>Create a new enablement coaching session</DialogDescription>
            </DialogHeader>
            <form onSubmit={createNewSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Coach Mode</label>
                <Select value={coachMode} onValueChange={setCoachMode}>
                  <SelectTrigger className="bg-bg-primary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-card border-border">
                    <SelectItem value="operator">Operator (Technical Details)</SelectItem>
                    <SelectItem value="leadership">Leadership (Business Impact)</SelectItem>
                    <SelectItem value="cs_handoff">CS Handoff (Transfer Kit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-accent-500 hover:bg-accent-600" disabled={loading}>
                {loading ? 'Creating...' : 'Create Session'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Main Content */}
      {selectedSession ? (
        // Session Detail View
        <div className="space-y-6">
          {/* Back Button */}
          <Button variant="outline" onClick={() => setSelectedSession(null)}>
            ← Back to Sessions
          </Button>

          {/* Session Header */}
          <Card className="bg-bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-text-primary">{selectedSession.summary}</CardTitle>
                  <CardDescription className="mt-2">{selectedSession.metadata?.rolloutStateSummary}</CardDescription>
                </div>
                {getStatusBadge(selectedSession.status)}
              </div>
            </CardHeader>
          </Card>

          {/* Plan Overview */}
          <Card className="bg-bg-card border-border">
            <CardHeader>
              <CardTitle className="text-text-primary">Enablement Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedSession.proposed_plan?.stages && (
                <div className="space-y-2">
                  {selectedSession.proposed_plan.stages.map((stage: any, idx: number) => (
                    <div key={idx} className="border-l-4 border-accent-500 pl-4 py-2">
                      <h4 className="font-medium text-text-primary">
                        Stage {stage.index}: {stage.name}
                      </h4>
                      <p className="text-sm text-gray-600">{stage.description}</p>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {stage.actions.map((action: any, aIdx: number) => (
                          <Badge key={aIdx} variant="outline" className="text-xs">
                            {action.actionKey}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-bg-primary rounded p-3">
                <p className="text-sm text-gray-700">
                  <strong>Total Duration:</strong> {selectedSession.proposed_plan?.totalDurationMinutes} minutes
                  <br />
                  <strong>Current Stage:</strong> {selectedSession.proposed_plan?.currentStage}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Narrative & Recommendations */}
          {selectedSession.recommendations?.narrative && (
            <Card className="bg-bg-card border-border">
              <CardHeader>
                <CardTitle className="text-text-primary">Coach Narrative</CardTitle>
                <Badge variant="outline" className="w-fit mt-2">
                  Source: {selectedSession.recommendations.narrative.source}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-text-primary">{selectedSession.recommendations.narrative.summary}</p>
                </div>
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Key Points</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {selectedSession.recommendations.narrative.keyPoints?.map((point: string, idx: number) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Risk Summary</h4>
                  <p className="text-sm text-gray-700">{selectedSession.recommendations.narrative.riskSummary}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions Table */}
          <Card className="bg-bg-card border-border">
            <CardHeader>
              <CardTitle className="text-text-primary">Stage Actions</CardTitle>
              <CardDescription>Review and approve each action before applying</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-text-primary">Action</th>
                      <th className="text-left py-2 px-3 font-medium text-text-primary">Description</th>
                      <th className="text-left py-2 px-3 font-medium text-text-primary">Status</th>
                      <th className="text-right py-2 px-3 font-medium text-text-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedActions.map((action: any) => (
                      <tr key={action.id} className="border-b border-border hover:bg-bg-primary">
                        <td className="py-3 px-3">
                          <code className="text-xs bg-bg-primary rounded px-2 py-1">{action.action_key}</code>
                        </td>
                        <td className="py-3 px-3">{action.description}</td>
                        <td className="py-3 px-3">{getStatusBadge(action.status)}</td>
                        <td className="py-3 px-3 text-right">
                          {action.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveAction(action.id)}
                              disabled={loading}
                            >
                              Approve
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Apply Section */}
          {selectedSession.status === 'plan_generated' && allApproved && (
            <Card className="bg-green-50 border border-green-200">
              <CardHeader>
                <CardTitle className="text-green-900">Ready to Apply</CardTitle>
                <CardDescription className="text-green-700">All actions approved. Review plan and apply when ready.</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showApplyConfirmation} onOpenChange={setShowApplyConfirmation}>
                  <DialogTrigger asChild>
                    <Button className="bg-accent-500 hover:bg-accent-600 w-full">
                      <Zap className="w-4 h-4 mr-2" />
                      Apply Coach Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>Confirm Apply</DialogTitle>
                      <DialogDescription>Apply all approved actions to your Guardian system?</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-sm text-yellow-900">
                          <strong>⚠️ This will:</strong>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Update Z10 governance flags</li>
                            <li>Create Z13 automation schedules</li>
                            <li>Capture Z14 status snapshots</li>
                            <li>Trigger Z16 validation</li>
                          </ul>
                        </p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm text-blue-900">
                          <strong>✓ You can:</strong>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Rollback individual changes using Z15 backups</li>
                            <li>Disable Z13 schedules if needed</li>
                            <li>Adjust Z10 flags at any time</li>
                          </ul>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowApplyConfirmation(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={applySession}
                        className="flex-1 bg-accent-500 hover:bg-accent-600"
                        disabled={applyLoading}
                      >
                        {applyLoading ? 'Applying...' : 'Apply Session'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        // Sessions List View
        <Card className="bg-bg-card border-border">
          <CardHeader>
            <CardTitle className="text-text-primary">Recent Coaching Sessions</CardTitle>
            <CardDescription>History of governance coach sessions and enablement plans</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-600">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-gray-600">No sessions yet. Create one to get started.</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session: any) => (
                  <div
                    key={session.id}
                    className="border border-border rounded-lg p-4 hover:bg-bg-primary cursor-pointer transition-colors"
                    onClick={() => loadSessionDetail(session.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-text-primary">{session.summary}</h4>
                        <p className="text-sm text-gray-600 mt-1">{session.coach_mode} • {session.target}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(session.created_at).toLocaleDateString()} at{' '}
                          {new Date(session.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      {getStatusBadge(session.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
