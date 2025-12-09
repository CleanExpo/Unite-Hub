'use client';

/**
 * Founder Truth Layer Panel
 * Phase 56: Oversight dashboard for truth-layer compliance
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Settings,
  RefreshCw,
} from 'lucide-react';

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
}

interface TruthLayerStatus {
  compliant: boolean;
  score: number;
  lastCheck: string;
  violations: number;
  warnings: number;
}

interface NavigationStatus {
  orphanRoutes: number;
  placeholderRoutes: number;
  totalRoutes: number;
  activeRoutes: number;
}

interface FounderTruthLayerPanelProps {
  truthLayerStatus: TruthLayerStatus;
  navigationStatus: NavigationStatus;
  featureFlags: FeatureFlag[];
  onToggleFlag?: (key: string, enabled: boolean) => void;
  onRunAudit?: () => void;
}

export function FounderTruthLayerPanel({
  truthLayerStatus,
  navigationStatus,
  featureFlags,
  onToggleFlag,
  onRunAudit,
}: FounderTruthLayerPanelProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) {
return 'text-green-500';
}
    if (score >= 70) {
return 'text-yellow-500';
}
    return 'text-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Truth Layer & System Integrity
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onRunAudit}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Run Audit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Truth Layer Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Truth Layer Compliance
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className={`text-2xl font-bold ${getScoreColor(truthLayerStatus.score)}`}>
                {truthLayerStatus.score}%
              </div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-red-500">
                {truthLayerStatus.violations}
              </div>
              <div className="text-xs text-muted-foreground">Violations</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-yellow-500">
                {truthLayerStatus.warnings}
              </div>
              <div className="text-xs text-muted-foreground">Warnings</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            {truthLayerStatus.compliant ? (
              <Badge className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Compliant
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Issues Found
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Last audit: {new Date(truthLayerStatus.lastCheck).toLocaleString()}
          </div>
        </div>

        {/* Navigation Status */}
        <div className="space-y-3 pt-3 border-t">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Navigation & Routes
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Routes</span>
                <span className="font-bold">
                  {navigationStatus.activeRoutes}/{navigationStatus.totalRoutes}
                </span>
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm">Orphan Routes</span>
                <span className={`font-bold ${navigationStatus.orphanRoutes > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {navigationStatus.orphanRoutes}
                </span>
              </div>
            </div>
          </div>
          {navigationStatus.placeholderRoutes > 0 && (
            <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              {navigationStatus.placeholderRoutes} placeholder routes detected
            </div>
          )}
        </div>

        {/* Feature Flags */}
        <div className="space-y-3 pt-3 border-t">
          <h4 className="text-sm font-medium">Feature Flags (Kill Switches)</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {featureFlags.map((flag) => (
              <div
                key={flag.key}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
              >
                <div>
                  <div className="text-sm font-medium">{flag.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {flag.description}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      flag.category === 'experimental'
                        ? 'border-yellow-500 text-yellow-500'
                        : flag.category === 'beta'
                        ? 'border-blue-500 text-blue-500'
                        : ''
                    }`}
                  >
                    {flag.category}
                  </Badge>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={(checked) => onToggleFlag?.(flag.key, checked)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-3 border-t">
          <div className="text-xs text-muted-foreground mb-2">Quick Actions</div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              View Violations
            </Button>
            <Button variant="outline" size="sm">
              Export Report
            </Button>
            <Button variant="outline" size="sm">
              Reset Flags
            </Button>
          </div>
        </div>

        {/* Safety Reminder */}
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg p-3 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Safety Note:</strong> Disabling core feature flags may affect
              client experience. All AI content remains draft until approved.
              No marketing promises can be made outside truth-layer guidelines.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FounderTruthLayerPanel;
