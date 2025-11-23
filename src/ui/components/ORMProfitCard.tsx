'use client';

/**
 * ORM Profit Card
 * Phase 67: Visualize client profitability status
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from 'lucide-react';

interface ORMProfitCardProps {
  client_name: string;
  revenue: number;
  cost: number;
  margin: number;
  margin_percent: number;
  status: 'profitable' | 'marginal' | 'loss_leading';
  trend: 'improving' | 'stable' | 'declining';
  weeks_unprofitable: number;
  recommendations: string[];
  onClick?: () => void;
}

export function ORMProfitCard({
  client_name,
  revenue,
  cost,
  margin,
  margin_percent,
  status,
  trend,
  weeks_unprofitable,
  recommendations,
  onClick,
}: ORMProfitCardProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'profitable':
        return { color: 'bg-green-500', textColor: 'text-green-500', label: 'Profitable' };
      case 'marginal':
        return { color: 'bg-yellow-500', textColor: 'text-yellow-500', label: 'Marginal' };
      case 'loss_leading':
        return { color: 'bg-red-500', textColor: 'text-red-500', label: 'Loss-Leading' };
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const statusConfig = getStatusConfig();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer ${status === 'loss_leading' ? 'border-l-4 border-l-red-500' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium truncate">{client_name}</CardTitle>
          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Financial metrics */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-muted-foreground">Revenue</div>
            <div className="font-bold text-green-500">{formatCurrency(revenue)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Cost</div>
            <div className="font-bold text-red-500">{formatCurrency(cost)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Margin</div>
            <div className={`font-bold ${margin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(margin)}
            </div>
          </div>
        </div>

        {/* Margin percent bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Margin %</span>
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className={statusConfig.textColor}>{margin_percent.toFixed(1)}%</span>
            </div>
          </div>
          <Progress
            value={Math.max(0, Math.min(100, margin_percent + 50))} // Shift to show negative margins
            className={`h-1 ${status === 'profitable' ? '[&>div]:bg-green-500' : status === 'marginal' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'}`}
          />
        </div>

        {/* Warnings */}
        {weeks_unprofitable > 0 && (
          <div className="flex items-center gap-2 text-xs text-orange-500 bg-orange-500/10 p-2 rounded">
            <AlertTriangle className="h-3 w-3" />
            <span>Unprofitable for {weeks_unprofitable} week(s)</span>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="text-xs text-muted-foreground">
            💡 {recommendations[0]}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ORMProfitCard;
