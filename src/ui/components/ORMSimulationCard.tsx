'use client';

/**
 * ORM Simulation Card
 * Phase 67: Display simulation results for new client onboarding
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';

interface SimulationImpact {
  revenue_change: number;
  cost_change: number;
  margin_change: number;
  staff_utilization_change: number;
  ai_capacity_change: number;
  workload_index_change: number;
}

interface ORMSimulationCardProps {
  scenario_name: string;
  new_clients: number;
  current_clients: number;
  projected_workload_index: number;
  feasibility: 'safe' | 'caution' | 'risky' | 'not_recommended';
  confidence: number;
  impact: SimulationImpact;
  recommendations: string[];
  required_upgrades: string[];
  onSelect?: () => void;
}

export function ORMSimulationCard({
  scenario_name,
  new_clients,
  current_clients,
  projected_workload_index,
  feasibility,
  confidence,
  impact,
  recommendations,
  required_upgrades,
  onSelect,
}: ORMSimulationCardProps) {
  const getFeasibilityConfig = () => {
    switch (feasibility) {
      case 'safe':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-500',
          icon: <CheckCircle2 className="h-4 w-4" />,
          label: 'Safe',
        };
      case 'caution':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-500',
          icon: <AlertTriangle className="h-4 w-4" />,
          label: 'Caution',
        };
      case 'risky':
        return {
          color: 'bg-orange-500',
          textColor: 'text-orange-500',
          icon: <AlertTriangle className="h-4 w-4" />,
          label: 'Risky',
        };
      case 'not_recommended':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-500',
          icon: <XCircle className="h-4 w-4" />,
          label: 'Not Recommended',
        };
    }
  };

  const feasibilityConfig = getFeasibilityConfig();

  const formatChange = (value: number, prefix: string = '') => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${prefix}${value.toFixed(0)}`;
  };

  const getChangeColor = (value: number, inverse: boolean = false) => {
    if (inverse) {
      return value <= 0 ? 'text-green-500' : value > 10 ? 'text-red-500' : 'text-yellow-500';
    }
    return value >= 0 ? 'text-green-500' : 'text-red-500';
  };

  return (
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer ${feasibility === 'not_recommended' ? 'border-l-4 border-l-red-500' : feasibility === 'safe' ? 'border-l-4 border-l-green-500' : ''}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm font-medium">{scenario_name}</CardTitle>
          </div>
          <Badge className={`${feasibilityConfig.color} gap-1`}>
            {feasibilityConfig.icon}
            {feasibilityConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Client change */}
        <div className="flex items-center justify-center gap-3 text-lg font-bold">
          <span>{current_clients}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-blue-500">{current_clients + new_clients}</span>
          <span className="text-xs text-muted-foreground font-normal">clients</span>
        </div>

        {/* Workload index */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Projected Workload</span>
            <span className={projected_workload_index > 80 ? 'text-red-500' : projected_workload_index > 60 ? 'text-yellow-500' : 'text-green-500'}>
              {projected_workload_index}%
            </span>
          </div>
          <Progress
            value={projected_workload_index}
            className={`h-2 ${projected_workload_index > 80 ? '[&>div]:bg-red-500' : projected_workload_index > 60 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
          />
        </div>

        {/* Impact grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-muted-foreground">Revenue</div>
            <div className={`font-bold ${getChangeColor(impact.revenue_change)}`}>
              {formatChange(impact.revenue_change, '$')}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Margin</div>
            <div className={`font-bold ${getChangeColor(impact.margin_change)}`}>
              {formatChange(impact.margin_change, '$')}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Staff Util</div>
            <div className={`font-bold ${getChangeColor(impact.staff_utilization_change, true)}`}>
              {formatChange(impact.staff_utilization_change)}%
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">AI Capacity</div>
            <div className={`font-bold ${getChangeColor(impact.ai_capacity_change, true)}`}>
              {formatChange(impact.ai_capacity_change)}%
            </div>
          </div>
        </div>

        {/* Required upgrades */}
        {required_upgrades.length > 0 && (
          <div className="text-xs text-orange-500 bg-orange-500/10 p-2 rounded">
            <div className="font-medium mb-1">Required Upgrades:</div>
            <ul className="space-y-1">
              {required_upgrades.map((u, i) => (
                <li key={i}>• {u}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Confidence */}
        <div className="flex items-center justify-between text-xs pt-2 border-t">
          <span className="text-muted-foreground">Confidence</span>
          <span>{confidence}%</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default ORMSimulationCard;
