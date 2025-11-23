'use client';

/**
 * Soft Launch Tracker
 * Phase 57: Monitor controlled rollout of first 1-5 clients
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Shield,
  Power,
  Eye,
} from 'lucide-react';

// Types from controlledRolloutService
type RolloutState = 'invited' | 'trial_active' | 'activation_active' | 'stabilized' | 'paused' | 'churned';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type FounderGate = string;

interface SoftLaunchClient {
  id: string;
  workspace_id: string;
  client_name: string;
  contact_email: string;
  industry: string;
  state: RolloutState;
  gates_completed: FounderGate[];
  risk_level: RiskLevel;
  risk_flags: string[];
  invited_at: string;
  trial_started_at?: string;
  activation_started_at?: string;
  momentum_score: number;
  notes: string;
  kill_switch_active: boolean;
}

interface RolloutSummary {
  total_clients: number;
  by_state: Record<RolloutState, number>;
  by_risk: Record<RiskLevel, number>;
  avg_momentum: number;
  clients_needing_attention: SoftLaunchClient[];
}

interface SoftLaunchTrackerProps {
  clients: SoftLaunchClient[];
  summary: RolloutSummary;
  maxClients?: number;
  onViewClient?: (clientId: string) => void;
  onToggleKillSwitch?: (clientId: string, active: boolean) => void;
}

export function SoftLaunchTracker({
  clients,
  summary,
  maxClients = 5,
  onViewClient,
  onToggleKillSwitch,
}: SoftLaunchTrackerProps) {
  const getStateColor = (state: RolloutState) => {
    switch (state) {
      case 'invited': return 'bg-blue-500';
      case 'trial_active': return 'bg-yellow-500';
      case 'activation_active': return 'bg-green-500';
      case 'stabilized': return 'bg-emerald-500';
      case 'paused': return 'bg-orange-500';
      case 'churned': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStateLabel = (state: RolloutState) => {
    switch (state) {
      case 'invited': return 'Invited';
      case 'trial_active': return 'Trial';
      case 'activation_active': return 'Activating';
      case 'stabilized': return 'Stable';
      case 'paused': return 'Paused';
      case 'churned': return 'Churned';
      default: return state;
    }
  };

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getMomentumIcon = (score: number) => {
    if (score >= 70) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (score >= 40) return <TrendingDown className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Soft Launch Tracker
          </CardTitle>
          <Badge variant="outline">
            {summary.total_clients}/{maxClients} clients
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Capacity Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Launch Capacity</span>
            <span className="font-medium">{Math.round((summary.total_clients / maxClients) * 100)}%</span>
          </div>
          <Progress value={(summary.total_clients / maxClients) * 100} />
        </div>

        {/* State Distribution */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="text-xl font-bold text-yellow-500">
              {summary.by_state.trial_active}
            </div>
            <div className="text-xs text-muted-foreground">Trial</div>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="text-xl font-bold text-green-500">
              {summary.by_state.activation_active}
            </div>
            <div className="text-xs text-muted-foreground">Activating</div>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="text-xl font-bold text-emerald-500">
              {summary.by_state.stabilized}
            </div>
            <div className="text-xs text-muted-foreground">Stable</div>
          </div>
        </div>

        {/* Average Momentum */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Avg Momentum</span>
          </div>
          <span className={`font-bold ${
            summary.avg_momentum >= 70 ? 'text-green-500' :
            summary.avg_momentum >= 40 ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {Math.round(summary.avg_momentum)}
          </span>
        </div>

        {/* Attention Required */}
        {summary.clients_needing_attention.length > 0 && (
          <div className="border border-orange-500/30 bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm font-medium mb-2">
              <AlertTriangle className="h-4 w-4" />
              {summary.clients_needing_attention.length} Need Attention
            </div>
            <div className="space-y-1">
              {summary.clients_needing_attention.slice(0, 3).map((client) => (
                <div key={client.id} className="text-xs text-muted-foreground">
                  {client.client_name} - {client.risk_flags[0] || 'Review needed'}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Client List */}
        <div className="space-y-3 pt-3 border-t">
          <h4 className="text-sm font-medium">Active Clients</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {clients.filter(c => c.state !== 'churned').map((client) => (
              <div
                key={client.id}
                className={`p-3 rounded-lg border ${
                  client.kill_switch_active ? 'bg-red-50 dark:bg-red-900/10 border-red-200' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{client.client_name}</span>
                      <Badge className={`${getStateColor(client.state)} text-xs`}>
                        {getStateLabel(client.state)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {client.industry}
                    </div>
                    {client.risk_flags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle className={`h-3 w-3 ${getRiskColor(client.risk_level)}`} />
                        <span className={`text-xs ${getRiskColor(client.risk_level)}`}>
                          {client.risk_flags[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      {getMomentumIcon(client.momentum_score)}
                      <span className="text-sm font-medium">{client.momentum_score}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onViewClient?.(client.id)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 w-6 p-0 ${client.kill_switch_active ? 'text-red-500' : ''}`}
                        onClick={() => onToggleKillSwitch?.(client.id, !client.kill_switch_active)}
                      >
                        <Power className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                {/* Gates Progress */}
                <div className="mt-2 flex gap-1">
                  {['technical_ready', 'strategy_ready', 'activation_program_started', 'first_7days_reviewed'].map((gate) => (
                    <div
                      key={gate}
                      className={`h-1 flex-1 rounded-full ${
                        client.gates_completed.includes(gate) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      title={gate.replace(/_/g, ' ')}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Launch Readiness */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm">Launch Ready</span>
            </div>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
        </div>

        {/* Honest Expectations Reminder */}
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-3 text-xs">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Timeline Reality:</strong> Meaningful results take 90+ days.
              Monitor client expectations and flag misalignment early.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SoftLaunchTracker;
