'use client';

/**
 * Capability Matrix - Display allowed/blocked capabilities
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Capability {
  commandName: string;
  description: string;
  riskLevel: string;
  requiresApproval: boolean;
  parameters: Record<string, any>;
  version: string;
}

interface CapabilityMatrixProps {
  workspaceId: string;
  accessToken: string;
}

export function CapabilityMatrix({
  workspaceId,
  accessToken,
}: CapabilityMatrixProps) {
  const [capabilities, setCapabilities] = useState<Record<string, Capability[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCapabilities = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/desktop/capabilities?workspaceId=${workspaceId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch capabilities');
        }

        const data = await response.json();
        setCapabilities(data.capabilities || {});
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCapabilities();
  }, [workspaceId, accessToken]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'safe':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading capabilities...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Capability Matrix</CardTitle>
        <CardDescription>Allowed desktop agent commands by risk level</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {Object.entries(capabilities).map(([category, caps]) => (
          <div key={category} className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300">
              {category.replace(/_/g, ' ')}
            </h3>

            <div className="space-y-2">
              {(caps as Capability[]).map((cap) => (
                <div
                  key={cap.commandName}
                  className="flex items-start justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="font-mono font-semibold text-sm text-blue-600 dark:text-blue-400">
                        {cap.commandName}
                      </code>
                      <Badge className={getRiskColor(cap.riskLevel)}>
                        {cap.riskLevel}
                      </Badge>
                      {cap.requiresApproval && (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                          Requires Approval
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {cap.description}
                    </p>
                    {Object.keys(cap.parameters).length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Parameters: {Object.keys(cap.parameters).join(', ')}
                      </p>
                    )}
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>
        ))}

        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
          <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
            ✓ Sandboxed execution • ✓ Founder approval required for high-risk • ✓ All actions logged
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
