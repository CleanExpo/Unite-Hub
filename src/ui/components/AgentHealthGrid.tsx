'use client';

/**
 * Agent Health Grid
 * Phase 62: Display health status of all agents
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Cpu,
} from 'lucide-react';

type AgentStatus = 'active' | 'idle' | 'busy' | 'error' | 'maintenance';

interface AgentHealth {
  id: string;
  name: string;
  status: AgentStatus;
  tasks_completed_24h: number;
  avg_response_ms: number;
  error_rate: number;
  last_active: string;
}

interface AgentHealthGridProps {
  agents: AgentHealth[];
  onAgentClick?: (agentId: string) => void;
}

export function AgentHealthGrid({ agents, onAgentClick }: AgentHealthGridProps) {
  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'idle':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'busy':
        return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'idle':
        return 'bg-blue-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'maintenance':
        return 'bg-orange-500';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
return 'Just now';
}
    if (diffMins < 60) {
return `${diffMins}m ago`;
}
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
return `${diffHours}h ago`;
}
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          Agent Health Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => onAgentClick?.(agent.id)}
              className="p-3 border rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(agent.status)}
                  <span className="font-medium text-sm">{agent.name}</span>
                </div>
                <Badge className={getStatusColor(agent.status)} variant="secondary">
                  {agent.status}
                </Badge>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Tasks (24h)</span>
                  <span className="font-medium">{agent.tasks_completed_24h}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Response</span>
                  <span className="font-medium">{agent.avg_response_ms}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Error Rate</span>
                  <span className={`font-medium ${agent.error_rate > 0.05 ? 'text-red-500' : ''}`}>
                    {(agent.error_rate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="pt-1 border-t text-xs">
                  Last active: {formatTime(agent.last_active)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default AgentHealthGrid;
