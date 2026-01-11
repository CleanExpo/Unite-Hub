'use client';

/**
 * Test Integration Priority System (Bypasses Auth)
 * Navigate to: http://localhost:3008/test-integrations
 */

import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { SmartRecommendations } from '@/components/integrations/SmartRecommendations';
import { useState } from 'react';

export default function TestIntegrationsPage() {
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([]);

  const integrations = [
    {
      integrationKey: 'gmail',
      integrationName: 'Gmail',
      priority: 'required' as const,
      shortDescription: 'Enables email intelligence (core feature)',
      enablesFeatures: ['Email Intelligence', 'Contact Auto-linking', 'AI Email Generation', 'Meeting Detection'],
      consequenceIfSkipped: 'Email agent won\'t work. You\'ll need to manually process all emails.',
      setupTimeMinutes: 3,
      category: 'email',
      connected: connectedIntegrations.includes('gmail'),
    },
    {
      integrationKey: 'google_calendar',
      integrationName: 'Google Calendar',
      priority: 'recommended' as const,
      shortDescription: 'Sync meetings and detect scheduling requests',
      enablesFeatures: ['Meeting Detection', 'Calendar Scheduling', 'Availability Sync'],
      consequenceIfSkipped: 'Meeting requests won\'t be auto-detected. Manual calendar management.',
      setupTimeMinutes: 2,
      category: 'calendar',
      connected: connectedIntegrations.includes('google_calendar'),
    },
    {
      integrationKey: 'xero',
      integrationName: 'Xero',
      priority: 'optional' as const,
      shortDescription: 'Sync accounting data and invoices',
      enablesFeatures: ['Invoice Sync', 'Expense Tracking', 'Financial Reports'],
      consequenceIfSkipped: 'Manual expense and invoice tracking. No automatic financial reporting.',
      setupTimeMinutes: 5,
      category: 'accounting',
      connected: connectedIntegrations.includes('xero'),
    },
    {
      integrationKey: 'stripe',
      integrationName: 'Stripe',
      priority: 'optional' as const,
      shortDescription: 'Payment processing and billing',
      enablesFeatures: ['Payment Processing', 'Subscription Billing', 'Revenue Tracking'],
      consequenceIfSkipped: 'No payment processing. Use external billing system.',
      setupTimeMinutes: 10,
      category: 'payments',
      connected: connectedIntegrations.includes('stripe'),
    },
  ];

  const recommendations = [
    {
      integrationKey: 'gmail',
      integrationName: 'Gmail',
      priority: 'required' as const,
      reason: 'Required for email intelligence (core Unite-Hub feature)',
      connected: connectedIntegrations.includes('gmail'),
    },
    {
      integrationKey: 'google_calendar',
      integrationName: 'Google Calendar',
      priority: 'recommended' as const,
      reason: 'Recommended for meeting detection and scheduling',
      connected: connectedIntegrations.includes('google_calendar'),
    },
  ];

  const handleConnect = (key: string) => {
    setConnectedIntegrations([...connectedIntegrations, key]);
  };

  const handleDisconnect = (key: string) => {
    setConnectedIntegrations(connectedIntegrations.filter(k => k !== key));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-base to-bg-raised p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-3">
            Integration Priority System Demo
          </h1>
          <p className="text-text-secondary text-lg">
            Pattern 3 Solution: "I don't know what's required vs optional" (3 users)
          </p>
        </div>

        {/* Smart Recommendations */}
        <SmartRecommendations
          businessType="small_business"
          recommendations={recommendations}
          onConnectAll={() => {
            setConnectedIntegrations(['gmail', 'google_calendar']);
          }}
          onCustomize={() => alert('Customize: Show all integrations')}
        />

        {/* Integration Cards */}
        <div>
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            All Integrations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.integrationKey}
                {...integration}
                onConnect={() => handleConnect(integration.integrationKey)}
                onDisconnect={() => handleDisconnect(integration.integrationKey)}
                onConfigure={() => alert(`Configure ${integration.integrationName}`)}
              />
            ))}
          </div>
        </div>

        {/* Pattern 3 Feedback Addressed */}
        <div className="bg-accent-500/10 border border-accent-500/20 rounded-lg p-6">
          <h3 className="font-semibold text-text-primary mb-2">Pattern 3 Feedback Addressed:</h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>✅ John: "Not sure which one is for email intelligence" → Gmail marked REQUIRED</li>
            <li>✅ Tom: "Which ones are required vs optional?" → Clear badges on all integrations</li>
            <li>✅ Emma: "Can I skip features?" → Optional clearly marked with consequences</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
