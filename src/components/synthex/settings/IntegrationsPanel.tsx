'use client';

/**
 * Synthex Integrations Panel
 *
 * Channel connector management UI:
 * - Resend (email)
 * - Gmail (email)
 * - Facebook (social)
 * - LinkedIn (social)
 * - X/Twitter (social)
 * - Twilio (sms)
 *
 * Phase: B20 - Integration Hub
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Mail,
  MessageSquare,
  Facebook,
  Linkedin,
  Twitter,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Settings,
  Loader2,
} from 'lucide-react';
import { useSynthexTenant } from '@/hooks/useSynthexTenant';
import { SynthexIntegration } from '@/lib/synthex/integrationHubService';

// =============================================================================
// Types
// =============================================================================

type IntegrationStatus = 'disconnected' | 'connected' | 'error';

interface IntegrationConnector {
  provider: string;
  channel: string;
  displayName: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  configurable: boolean;
}

// =============================================================================
// Integration Connectors
// =============================================================================

const INTEGRATION_CONNECTORS: IntegrationConnector[] = [
  {
    provider: 'resend',
    channel: 'email',
    displayName: 'Resend',
    description: 'Email delivery service',
    icon: Mail,
    iconColor: 'text-purple-400',
    configurable: true,
  },
  {
    provider: 'gmail',
    channel: 'email',
    displayName: 'Gmail',
    description: 'Google email service',
    icon: Mail,
    iconColor: 'text-red-400',
    configurable: true,
  },
  {
    provider: 'facebook',
    channel: 'social',
    displayName: 'Facebook',
    description: 'Social media platform',
    icon: Facebook,
    iconColor: 'text-blue-400',
    configurable: false,
  },
  {
    provider: 'linkedin',
    channel: 'social',
    displayName: 'LinkedIn',
    description: 'Professional network',
    icon: Linkedin,
    iconColor: 'text-blue-500',
    configurable: false,
  },
  {
    provider: 'x',
    channel: 'social',
    displayName: 'X (Twitter)',
    description: 'Social media platform',
    icon: Twitter,
    iconColor: 'text-gray-400',
    configurable: false,
  },
  {
    provider: 'twilio',
    channel: 'sms',
    displayName: 'Twilio',
    description: 'SMS messaging service',
    icon: Phone,
    iconColor: 'text-red-500',
    configurable: false,
  },
];

// =============================================================================
// Component
// =============================================================================

export default function IntegrationsPanel() {
  const { tenantId, loading: tenantLoading } = useSynthexTenant();
  const [integrations, setIntegrations] = useState<Record<string, SynthexIntegration>>({});
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState<string | null>(null);

  // =============================================================================
  // Load Integrations
  // =============================================================================

  useEffect(() => {
    if (tenantLoading || !tenantId) return;

    async function loadIntegrations() {
      try {
        setLoading(true);
        const response = await fetch(`/api/synthex/integrations?tenantId=${tenantId}`);
        const result = await response.json();

        if (result.success && result.integrations) {
          const integrationMap: Record<string, SynthexIntegration> = {};
          result.integrations.forEach((integration: SynthexIntegration) => {
            integrationMap[integration.provider] = integration;
          });
          setIntegrations(integrationMap);
        }
      } catch (error) {
        console.error('[IntegrationsPanel] loadIntegrations error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadIntegrations();
  }, [tenantId, tenantLoading]);

  // =============================================================================
  // Get Integration Status
  // =============================================================================

  const getIntegrationStatus = (provider: string): IntegrationStatus => {
    return integrations[provider]?.status || 'disconnected';
  };

  const getStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-900/30 text-green-400 border-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-900/30 text-red-400 border-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-700 text-gray-500">
            <XCircle className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        );
    }
  };

  // =============================================================================
  // Connect/Configure Handler
  // =============================================================================

  const handleConnect = (provider: string) => {
    setConfiguring(provider);
  };

  const handleDisconnect = async (provider: string) => {
    if (!tenantId) return;

    try {
      await fetch('/api/synthex/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          provider,
          channel: INTEGRATION_CONNECTORS.find((c) => c.provider === provider)?.channel || 'email',
          status: 'disconnected',
        }),
      });

      // Reload integrations
      const response = await fetch(`/api/synthex/integrations?tenantId=${tenantId}`);
      const result = await response.json();
      if (result.success && result.integrations) {
        const integrationMap: Record<string, SynthexIntegration> = {};
        result.integrations.forEach((integration: SynthexIntegration) => {
          integrationMap[integration.provider] = integration;
        });
        setIntegrations(integrationMap);
      }
    } catch (error) {
      console.error('[IntegrationsPanel] handleDisconnect error:', error);
    }
  };

  // =============================================================================
  // Render
  // =============================================================================

  if (tenantLoading || loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        </CardContent>
      </Card>
    );
  }

  if (!tenantId) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-400">No tenant selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Integrations */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-400" />
            Email Services
          </CardTitle>
          <CardDescription className="text-gray-400">
            Connect email delivery providers for campaign sending
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {INTEGRATION_CONNECTORS.filter((c) => c.channel === 'email').map((connector) => {
            const status = getIntegrationStatus(connector.provider);
            const Icon = connector.icon;

            return (
              <div
                key={connector.provider}
                className="flex items-center justify-between p-4 bg-gray-950 rounded-lg border border-gray-800"
              >
                <div className="flex items-center gap-4">
                  <Icon className={`h-6 w-6 ${connector.iconColor}`} />
                  <div>
                    <p className="font-medium text-gray-300">{connector.displayName}</p>
                    <p className="text-sm text-gray-500">{connector.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(status)}
                  {status === 'connected' ? (
                    <>
                      {connector.configurable && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-700"
                          onClick={() => handleConnect(connector.provider)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700 text-red-400 hover:text-red-300"
                        onClick={() => handleDisconnect(connector.provider)}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700"
                      onClick={() => handleConnect(connector.provider)}
                      disabled={!connector.configurable}
                    >
                      {connector.configurable ? 'Connect' : 'Coming Soon'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Social Media Integrations */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-400" />
            Social Media
          </CardTitle>
          <CardDescription className="text-gray-400">
            Connect social media platforms for publishing and engagement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {INTEGRATION_CONNECTORS.filter((c) => c.channel === 'social').map((connector) => {
            const status = getIntegrationStatus(connector.provider);
            const Icon = connector.icon;

            return (
              <div
                key={connector.provider}
                className="flex items-center justify-between p-4 bg-gray-950 rounded-lg border border-gray-800"
              >
                <div className="flex items-center gap-4">
                  <Icon className={`h-6 w-6 ${connector.iconColor}`} />
                  <div>
                    <p className="font-medium text-gray-300">{connector.displayName}</p>
                    <p className="text-sm text-gray-500">{connector.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(status)}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-700"
                    disabled
                  >
                    Coming Soon
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* SMS Integrations */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-400" />
            SMS Services
          </CardTitle>
          <CardDescription className="text-gray-400">
            Connect SMS providers for text message campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {INTEGRATION_CONNECTORS.filter((c) => c.channel === 'sms').map((connector) => {
            const status = getIntegrationStatus(connector.provider);
            const Icon = connector.icon;

            return (
              <div
                key={connector.provider}
                className="flex items-center justify-between p-4 bg-gray-950 rounded-lg border border-gray-800"
              >
                <div className="flex items-center gap-4">
                  <Icon className={`h-6 w-6 ${connector.iconColor}`} />
                  <div>
                    <p className="font-medium text-gray-300">{connector.displayName}</p>
                    <p className="text-sm text-gray-500">{connector.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(status)}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-700"
                    disabled
                  >
                    Coming Soon
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Configuration Modal (placeholder) */}
      {configuring && (
        <Card className="bg-gray-900 border-gray-800 mt-6">
          <CardHeader>
            <CardTitle className="text-gray-100">
              Configure {INTEGRATION_CONNECTORS.find((c) => c.provider === configuring)?.displayName}
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter your API credentials to connect
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">API Key</Label>
              <Input
                placeholder="Enter your API key"
                className="bg-gray-950 border-gray-800 text-gray-100"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-gray-700"
                onClick={() => setConfiguring(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // TODO: Implement save
                  setConfiguring(null);
                }}
              >
                Save & Connect
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-4">
              Configuration will be implemented in next phase
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
