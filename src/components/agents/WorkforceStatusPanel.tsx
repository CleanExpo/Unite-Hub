'use client';

/**
 * WorkforceStatusPanel — Displays real-time workforce engine health
 * Shows agent lifecycle states, loaded skills, active hooks, and memory usage.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Bot,
  Cpu,
  Layers,
  RefreshCw,
  Shield,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface WorkforceStatusData {
  initialized: boolean;
  engine?: {
    protocol: { valid: boolean; agentCount: number; issues: number } | null;
    skills: { indexed: number };
    hooks: {
      registered: number;
      byPhase: Record<string, number>;
      list: Array<{
        id: string;
        name: string;
        phase: string;
        enabled: boolean;
        priority: number;
      }>;
    };
    agents: {
      spawned: number;
      countsByState: Record<string, number>;
      list: Array<{
        id: string;
        name: string;
        state: string;
        spawnedAt: string;
        lastHeartbeat: string;
        activeTasks: number;
        loadedSkills: string[];
      }>;
    };
    registry: any;
  };
  initializedAt?: string;
  error?: string;
}

interface WorkforceStatusPanelProps {
  workspaceId: string;
  accessToken: string;
}

const stateColors: Record<string, string> = {
  idle: 'bg-gray-500',
  active: 'bg-green-500',
  busy: 'bg-yellow-500',
  degraded: 'bg-orange-500',
  offline: 'bg-red-500',
  maintenance: 'bg-blue-500',
};

const stateBadgeVariant = (state: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (state) {
    case 'active': return 'default';
    case 'busy': return 'secondary';
    case 'degraded':
    case 'offline': return 'destructive';
    default: return 'outline';
  }
};

export function WorkforceStatusPanel({ workspaceId, accessToken }: WorkforceStatusPanelProps) {
  const [data, setData] = useState<WorkforceStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hooksExpanded, setHooksExpanded] = useState(false);
  const [agentsExpanded, setAgentsExpanded] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/agent/workforce?workspaceId=${workspaceId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
        setError(null);
      } else {
        setError('Failed to fetch workforce status');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!workspaceId || !accessToken) return;
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [workspaceId, accessToken]);

  if (loading && !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading workforce status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{error}</span>
            <Button variant="ghost" size="sm" onClick={fetchStatus}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.initialized) {
    return (
      <Card className="border-yellow-200 dark:border-yellow-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium">Workforce engine not initialized</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            The engine initializes on first agent plan or execution request.
          </p>
        </CardContent>
      </Card>
    );
  }

  const engine = data.engine!;
  const totalHooksEnabled = engine.hooks.list.filter((h) => h.enabled).length;
  const healthScore = Math.min(100, (
    (engine.protocol?.valid ? 25 : 0) +
    (engine.skills.indexed > 0 ? 25 : 0) +
    (engine.hooks.registered > 0 ? 25 : 0) +
    25 // Base score for being initialized
  ));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Workforce Engine</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={healthScore === 100 ? 'default' : 'secondary'}>
              {healthScore}% Health
            </Badge>
            <Button variant="ghost" size="sm" onClick={fetchStatus} disabled={loading}>
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          Real-time status of skills, hooks, agents, and protocol
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Health Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>System Health</span>
            <span>{healthScore}%</span>
          </div>
          <Progress value={healthScore} className="h-2" />
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Protocol */}
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Shield className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <div className="text-lg font-bold">{engine.protocol?.agentCount || 0}</div>
            <div className="text-xs text-muted-foreground">Protocol Agents</div>
            {engine.protocol?.valid && (
              <Badge variant="outline" className="text-[10px] mt-1">Valid</Badge>
            )}
          </div>

          {/* Skills */}
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Layers className="h-4 w-4 mx-auto mb-1 text-purple-600" />
            <div className="text-lg font-bold">{engine.skills.indexed}</div>
            <div className="text-xs text-muted-foreground">Skills Indexed</div>
          </div>

          {/* Hooks */}
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Zap className="h-4 w-4 mx-auto mb-1 text-yellow-600" />
            <div className="text-lg font-bold">{totalHooksEnabled}/{engine.hooks.registered}</div>
            <div className="text-xs text-muted-foreground">Hooks Active</div>
          </div>

          {/* Agents */}
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Bot className="h-4 w-4 mx-auto mb-1 text-green-600" />
            <div className="text-lg font-bold">{engine.agents.spawned}</div>
            <div className="text-xs text-muted-foreground">Agents Spawned</div>
          </div>
        </div>

        {/* Hooks Detail (Collapsible) */}
        <Collapsible open={hooksExpanded} onOpenChange={setHooksExpanded}>
          <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors w-full">
            <Zap className="h-3 w-3" />
            <span>Hook Details</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {hooksExpanded ? 'Hide' : 'Show'}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="space-y-1.5">
              {engine.hooks.list.map((hook) => (
                <div
                  key={hook.id}
                  className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${hook.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="font-medium">{hook.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{hook.phase}</Badge>
                    <span className="text-muted-foreground">P{hook.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Spawned Agents Detail (Collapsible) */}
        {engine.agents.list.length > 0 && (
          <Collapsible open={agentsExpanded} onOpenChange={setAgentsExpanded}>
            <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors w-full">
              <Bot className="h-3 w-3" />
              <span>Spawned Agents</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {agentsExpanded ? 'Hide' : 'Show'}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-2">
                {engine.agents.list.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${stateColors[agent.state] || 'bg-gray-400'}`} />
                      <span className="font-medium">{agent.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={stateBadgeVariant(agent.state)} className="text-[10px]">
                        {agent.state}
                      </Badge>
                      {agent.activeTasks > 0 && (
                        <span className="text-muted-foreground">{agent.activeTasks} tasks</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Initialized timestamp */}
        {data.initializedAt && (
          <p className="text-[10px] text-muted-foreground text-right">
            Initialized: {new Date(data.initializedAt).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
