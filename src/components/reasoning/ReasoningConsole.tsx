'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, Zap, ChevronDown, Copy } from 'lucide-react';

interface ReasoningPass {
  passNumber: number;
  passType: 'recall' | 'analysis' | 'draft' | 'refinement' | 'validation';
  status: 'pending' | 'running' | 'completed' | 'failed';
  output: string;
  artifacts: any[];
  duration?: number;
  timestamp?: string;
}

interface ReasoningConsoleProps {
  workspaceId: string;
  runId?: string;
  onRunComplete?: (trace: any) => void;
}

export function ReasoningConsole({ workspaceId, runId, onRunComplete }: ReasoningConsoleProps) {
  const [objective, setObjective] = useState('');
  const [agent, setAgent] = useState('orchestrator');
  const [isRunning, setIsRunning] = useState(false);
  const [passes, setPasses] = useState<ReasoningPass[]>([]);
  const [expandedPass, setExpandedPass] = useState<number | null>(null);
  const [currentRunId, setCurrentRunId] = useState<string | null>(runId || null);
  const [stats, setStats] = useState({
    finalRisk: 0,
    finalUncertainty: 0,
    totalTime: 0,
  });

  const passTypeColors: Record<string, string> = {
    recall: 'bg-blue-100 text-blue-800',
    analysis: 'bg-purple-100 text-purple-800',
    draft: 'bg-orange-100 text-orange-800',
    refinement: 'bg-green-100 text-green-800',
    validation: 'bg-emerald-100 text-emerald-800',
  };

  const statusIcons = {
    pending: <Clock className="w-4 h-4" />,
    running: <Zap className="w-4 h-4 animate-pulse" />,
    completed: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    failed: <AlertCircle className="w-4 h-4 text-red-600" />,
  };

  const startReasoning = async () => {
    if (!objective.trim()) {
      alert('Please enter an objective');
      return;
    }

    setIsRunning(true);
    setPasses([]);

    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();

      const response = await fetch('/api/reasoning/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          workspaceId,
          agent,
          objective,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start reasoning');
      }

      const result = await response.json();
      setCurrentRunId(result.runId);
      setStats({
        finalRisk: result.finalRisk,
        finalUncertainty: result.finalUncertainty,
        totalTime: result.totalTimeMs,
      });

      // Fetch the complete trace
      fetchTrace(result.runId);

      if (onRunComplete) {
        onRunComplete(result);
      }
    } catch (error) {
      console.error('Error starting reasoning:', error);
      alert('Failed to start reasoning');
    } finally {
      setIsRunning(false);
    }
  };

  const fetchTrace = async (runId: string) => {
    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();

      const response = await fetch(`/api/reasoning/trace?workspaceId=${workspaceId}&runId=${runId}`, {
        headers: {
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trace');
      }

      const result = await response.json();

      // Transform passes for display
      const displayPasses: ReasoningPass[] = (result.passes || []).map((pass: any) => ({
        passNumber: pass.pass_number,
        passType: pass.pass_type,
        status: 'completed' as const,
        output: pass.output || '',
        artifacts: pass.artifacts || [],
        duration: pass.duration_ms,
        timestamp: pass.created_at,
      }));

      setPasses(displayPasses);
      setStats({
        finalRisk: result.summary.finalRisk,
        finalUncertainty: result.summary.finalUncertainty,
        totalTime: result.summary.duration || 0,
      });
    } catch (error) {
      console.error('Error fetching trace:', error);
    }
  };

  useEffect(() => {
    if (currentRunId && !isRunning) {
      fetchTrace(currentRunId);
    }
  }, [currentRunId, isRunning]);

  const copyOutput = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="w-full space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Start Reasoning Run</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Agent</label>
            <select
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              disabled={isRunning}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="orchestrator">Orchestrator</option>
              <option value="email-agent">Email Agent</option>
              <option value="content-agent">Content Agent</option>
              <option value="contact-intelligence">Contact Intelligence</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Objective</label>
            <Textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Enter the reasoning objective..."
              disabled={isRunning}
              className="w-full px-3 py-2 border rounded-md min-h-24"
            />
          </div>

          <Button
            onClick={startReasoning}
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? 'Running Reasoning...' : 'Start Reasoning'}
          </Button>
        </CardContent>
      </Card>

      {/* Stats Section */}
      {passes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reasoning Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Final Risk</div>
                <div className="text-2xl font-bold text-red-600">{stats.finalRisk.toFixed(1)}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Uncertainty</div>
                <div className="text-2xl font-bold text-orange-600">{stats.finalUncertainty.toFixed(1)}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Duration</div>
                <div className="text-2xl font-bold text-blue-600">{(stats.totalTime / 1000).toFixed(1)}s</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Passes Section */}
      <div className="space-y-3">
        {passes.map((pass) => (
          <Card key={pass.passNumber} className="cursor-pointer hover:shadow-md transition-shadow">
            <div
              onClick={() => setExpandedPass(expandedPass === pass.passNumber ? null : pass.passNumber)}
              className="p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusIcons[pass.status]}
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={passTypeColors[pass.passType]}>
                        Pass {pass.passNumber}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {pass.passType}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {pass.timestamp && new Date(pass.timestamp).toLocaleTimeString()}
                      {pass.duration && ` • ${pass.duration}ms`}
                    </div>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    expandedPass === pass.passNumber ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {/* Expanded Content */}
              {expandedPass === pass.passNumber && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-auto">
                    <div className="text-sm whitespace-pre-wrap font-mono text-gray-700">
                      {pass.output || 'No output'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyOutput(pass.output)}
                      className="flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Output
                    </Button>
                  </div>

                  {pass.artifacts.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Artifacts ({pass.artifacts.length})</div>
                      <div className="space-y-1">
                        {pass.artifacts.map((artifact: any, idx: number) => (
                          <div key={idx} className="text-xs bg-blue-50 p-2 rounded">
                            <Badge variant="secondary" className="text-xs">
                              {artifact.artifact_type || 'unknown'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {!isRunning && passes.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-600 mb-2">No reasoning runs yet</p>
            <p className="text-sm text-gray-500">
              Start a reasoning run by entering an objective above
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
