import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Key, Zap, Shield, ArrowRight, Terminal } from 'lucide-react';

export const metadata = {
  title: 'API Reference - Unite-Hub',
  description: 'Comprehensive API documentation for building integrations with Unite-Hub.',
};

export default function APIPage() {
  const apiEndpoints = [
    {
      method: 'POST',
      endpoint: '/api/contacts',
      description: 'Create or update contacts',
      auth: true,
    },
    {
      method: 'GET',
      endpoint: '/api/contacts',
      description: 'Retrieve contacts list',
      auth: true,
    },
    {
      method: 'POST',
      endpoint: '/api/campaigns',
      description: 'Create email campaigns',
      auth: true,
    },
    {
      method: 'POST',
      endpoint: '/api/agents/contact-intelligence',
      description: 'AI-powered contact analysis',
      auth: true,
    },
  ];

  const features = [
    {
      icon: Key,
      title: 'API Keys',
      description: 'Secure authentication with API keys and OAuth 2.0',
      color: 'text-blue-600',
    },
    {
      icon: Zap,
      title: 'Real-time',
      description: 'Webhooks for instant notifications',
      color: 'text-yellow-600',
    },
    {
      icon: Shield,
      title: 'Secure',
      description: 'Enterprise-grade security and encryption',
      color: 'text-green-600',
    },
    {
      icon: Terminal,
      title: 'Developer-Friendly',
      description: 'RESTful design with comprehensive docs',
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Code className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              API Reference
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Build powerful integrations with Unite-Hub's RESTful API.
              Access contacts, campaigns, and AI features programmatically.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/dashboard/settings/integrations">
                  Get API Key <Key className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/docs">View Guides</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">API Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <CardHeader>
                    <div className={`mx-auto p-3 rounded-lg bg-muted w-fit ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg mt-4">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Quick Start</h2>
            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>
                  Include your API key in the Authorization header
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-sm overflow-x-auto">
                  <pre>{`curl -X POST https://api.unite-hub.com/v1/contacts \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Acme Inc"
  }'`}</pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Core Endpoints</h2>
            <div className="space-y-4">
              {apiEndpoints.map((endpoint, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={endpoint.method === 'GET' ? 'secondary' : 'default'}
                          className="font-mono"
                        >
                          {endpoint.method}
                        </Badge>
                        <code className="font-mono text-sm">{endpoint.endpoint}</code>
                      </div>
                      {endpoint.auth && (
                        <Badge variant="outline" className="gap-1">
                          <Key className="h-3 w-3" /> Required
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      {endpoint.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Rate Limits</CardTitle>
                <CardDescription>
                  API requests are rate-limited per API key
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Starter</h4>
                    <p className="text-2xl font-bold text-primary">1,000</p>
                    <p className="text-sm text-muted-foreground">requests/hour</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Professional</h4>
                    <p className="text-2xl font-bold text-primary">10,000</p>
                    <p className="text-sm text-muted-foreground">requests/hour</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Enterprise</h4>
                    <p className="text-2xl font-bold text-primary">Unlimited</p>
                    <p className="text-sm text-muted-foreground">custom limits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to build?</h2>
            <p className="text-muted-foreground mb-8">
              Get your API key and start integrating Unite-Hub into your applications.
            </p>
            <Button size="lg" asChild>
              <Link href="/dashboard/settings/integrations">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
