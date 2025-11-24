'use client';

/**
 * Founder Intel Alerts Panel
 * Phase 80: Filterable alert list with status controls
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Lightbulb,
  Info,
} from 'lucide-react';
import {
  FounderIntelAlert,
  AlertStatus,
  getRiskLevelDisplay,
  getAlertStatusDisplay,
  getSourceEngineDisplay,
} from '@/lib/founderIntel/founderIntelTypes';

interface FounderIntelAlertsPanelProps {
  alerts: FounderIntelAlert[];
  onStatusChange?: (alertId: string, status: AlertStatus) => void;
  className?: string;
}

export function FounderIntelAlertsPanel({
  alerts,
  onStatusChange,
  className = '',
}: FounderIntelAlertsPanelProps) {
  const [statusFilter, setStatusFilter] = useState<string>('active');

  const filteredAlerts = alerts.filter(alert => {
    if (statusFilter === 'active') {
      return ['open', 'acknowledged', 'in_progress'].includes(alert.status);
    }
    if (statusFilter === 'resolved') {
      return ['resolved', 'dismissed'].includes(alert.status);
    }
    return true;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'risk':
        return AlertTriangle;
      case 'opportunity':
        return Lightbulb;
      case 'anomaly':
        return XCircle;
      default:
        return Info;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No alerts to display
          </p>
        ) : (
          filteredAlerts.map(alert => {
            const Icon = getAlertIcon(alert.alert_type);
            const riskDisplay = getRiskLevelDisplay(alert.severity);
            const statusDisplay = getAlertStatusDisplay(alert.status);
            const sourceDisplay = getSourceEngineDisplay(alert.source_engine);

            return (
              <div
                key={alert.id}
                className="p-3 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-4 w-4 mt-0.5 ${riskDisplay.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {alert.description_markdown.slice(0, 100)}
                      {alert.description_markdown.length > 100 ? '...' : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${riskDisplay.color}`}>
                        {riskDisplay.label}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${sourceDisplay.color}`}>
                        {sourceDisplay.label}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${statusDisplay.color}`}>
                        {statusDisplay.label}
                      </Badge>
                    </div>
                    {onStatusChange && alert.status === 'open' && (
                      <div className="flex gap-1 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px]"
                          onClick={() => onStatusChange(alert.id, 'acknowledged')}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px]"
                          onClick={() => onStatusChange(alert.id, 'resolved')}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default FounderIntelAlertsPanel;
