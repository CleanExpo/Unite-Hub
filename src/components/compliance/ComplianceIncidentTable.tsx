'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import type { ComplianceIncident } from '@/lib/compliance';

interface ComplianceIncidentTableProps {
  incidents: ComplianceIncident[];
  onResolve?: (id: string) => void;
  onOverride?: (id: string) => void;
  onViewDetails?: (incident: ComplianceIncident) => void;
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200',
};

const statusIcons: Record<string, typeof AlertTriangle> = {
  warning: AlertTriangle,
  blocked: AlertTriangle,
  overridden: CheckCircle,
};

export function ComplianceIncidentTable({
  incidents,
  onResolve,
  onOverride,
  onViewDetails
}: ComplianceIncidentTableProps) {
  if (incidents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Incidents</h3>
          <p className="text-muted-foreground">
            No compliance incidents found for the selected filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Incidents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {incidents.map((incident) => {
            const StatusIcon = statusIcons[incident.status] || AlertTriangle;

            return (
              <div
                key={incident.id}
                className={`p-4 rounded-lg border ${
                  incident.status === 'blocked'
                    ? 'border-red-200 bg-red-50'
                    : incident.resolvedAt
                    ? 'border-green-200 bg-green-50'
                    : 'border-amber-200 bg-amber-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <StatusIcon
                      className={`h-5 w-5 mt-0.5 ${
                        incident.status === 'blocked'
                          ? 'text-red-500'
                          : incident.resolvedAt
                          ? 'text-green-500'
                          : 'text-amber-500'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{incident.policyCode}</span>
                        <Badge
                          variant="outline"
                          className={severityColors[incident.severity]}
                        >
                          {incident.severity}
                        </Badge>
                        <Badge variant="outline">{incident.platform}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {incident.notesMarkdown.split('\n')[0].slice(0, 100)}
                        {incident.notesMarkdown.length > 100 ? '...' : ''}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(incident.createdAt).toLocaleDateString()}
                        </span>
                        {incident.contentRef.preview && (
                          <span className="truncate max-w-[200px]">
                            "{incident.contentRef.preview.slice(0, 50)}..."
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onViewDetails && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(incident)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    {!incident.resolvedAt && onResolve && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResolve(incident.id)}
                      >
                        Resolve
                      </Button>
                    )}
                    {!incident.resolvedAt && incident.status === 'blocked' && onOverride && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onOverride(incident.id)}
                      >
                        Override
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
