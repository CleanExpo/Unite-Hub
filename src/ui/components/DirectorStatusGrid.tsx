'use client';

/**
 * Director Status Grid
 * Phase 60: Overview grid of all clients from AI Director
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';

interface ClientOverview {
  client_id: string;
  client_name: string;
  industry: string;
  activation_day: number;
  health_score: number;
  risk_count: number;
  opportunity_count: number;
  status: 'healthy' | 'attention_needed' | 'at_risk' | 'critical';
}

interface DirectorStatusGridProps {
  clients: ClientOverview[];
  summary: {
    total: number;
    healthy: number;
    attention_needed: number;
    at_risk: number;
    critical: number;
  };
  onClientClick?: (clientId: string) => void;
}

export function DirectorStatusGrid({
  clients,
  summary,
  onClientClick,
}: DirectorStatusGridProps) {
  const getStatusIcon = (status: ClientOverview['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'attention_needed':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'at_risk':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: ClientOverview['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'attention_needed':
        return 'bg-yellow-500';
      case 'at_risk':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-500';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 75) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-xs text-muted-foreground">Total Clients</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-500">{summary.healthy}</div>
                <div className="text-xs text-muted-foreground">Healthy</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-500">{summary.attention_needed}</div>
                <div className="text-xs text-muted-foreground">Attention</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-500">{summary.at_risk}</div>
                <div className="text-xs text-muted-foreground">At Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-500">{summary.critical}</div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Client Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clients.map((client) => (
              <button
                key={client.client_id}
                onClick={() => onClientClick?.(client.client_id)}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(client.status)}
                    <span className="font-medium text-sm truncate">
                      {client.client_name}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Day {client.activation_day}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {/* Health Score */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Health</span>
                    <span className={`font-medium ${getHealthColor(client.health_score)}`}>
                      {client.health_score}
                    </span>
                  </div>
                  <Progress value={client.health_score} className="h-1" />

                  {/* Risk/Opportunity counts */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span>{client.risk_count} risks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span>{client.opportunity_count} opps</span>
                    </div>
                  </div>

                  {/* Industry */}
                  <div className="text-xs text-muted-foreground">
                    {client.industry}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {clients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No clients found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DirectorStatusGrid;
