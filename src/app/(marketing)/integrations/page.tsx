import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Calendar, CreditCard, Code, Check, ArrowRight, Zap } from 'lucide-react';

export const metadata = {
  title: 'Integrations - Unite-Hub',
  description: 'Connect Unite-Hub with your favorite tools and services. Gmail, Google Calendar, Stripe, and more.',
};

export default function IntegrationsPage() {
  const integrations = [
    {
      name: 'Gmail',
      description: 'Sync emails, send campaigns, and track engagement',
      icon: Mail,
      status: 'Available',
      features: ['Email sync', 'OAuth 2.0', 'Tracking pixels', 'Auto-link contacts'],
      color: 'text-red-600',
    },
    {
      name: 'Google Calendar',
      description: 'Schedule meetings and sync calendar events',
      icon: Calendar,
      status: 'Available',
      features: ['Event sync', 'Meeting detection', 'Auto-scheduling', 'Timezone handling'],
      color: 'text-blue-600',
    },
    {
      name: 'Stripe',
      description: 'Manage subscriptions and payments',
      icon: CreditCard,
      status: 'Available',
      features: ['Subscription management', 'Webhooks', 'Invoice tracking', 'Customer portal'],
      color: 'text-purple-600',
    },
    {
      name: 'REST API',
      description: 'Build custom integrations with our API',
      icon: Code,
      status: 'Available',
      features: ['Full access', 'Webhooks', 'Rate limiting', 'Documentation'],
      color: 'text-green-600',
    },
  ];

  const comingSoon = [
    { name: 'Outlook', icon: Mail },
    { name: 'Salesforce', icon: Code },
    { name: 'HubSpot', icon: Zap },
    { name: 'Slack', icon: Mail },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Integrations
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connect Unite-Hub with the tools you already use.
              Seamless integrations that just work.
            </p>
            <Button size="lg" asChild>
              <Link href="/dashboard/settings/integrations">
                View Your Integrations <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Available Integrations */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Available Now</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {integrations.map((integration) => (
                <Card key={integration.name} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-muted ${integration.color}`}>
                          <integration.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle>{integration.name}</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {integration.status}
                            </Badge>
                          </div>
                          <CardDescription>{integration.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {integration.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/dashboard/settings/integrations">
                        Configure
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Coming Soon</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {comingSoon.map((integration) => (
                <Card key={integration.name} className="text-center">
                  <CardHeader>
                    <div className="mx-auto p-3 rounded-lg bg-muted w-fit text-muted-foreground">
                      <integration.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Custom Integration */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <Code className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle className="text-2xl">Need a Custom Integration?</CardTitle>
                <CardDescription>
                  Build your own integration with our comprehensive REST API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center gap-4">
                  <Button asChild>
                    <Link href="/api">
                      View API Docs <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/contact">Request Integration</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
