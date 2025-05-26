import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4 text-sm font-medium">
            Enterprise-Grade AI Solutions
          </Badge>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Unite Group
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 mb-4">
            Next-Generation Business Intelligence & AI Infrastructure
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            We deliver enterprise-grade SaaS platforms with advanced AI capabilities, 
            bulletproof reliability, and comprehensive business solutions that scale with your organization.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/book-consultation">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Schedule Consultation
              </Button>
            </Link>
            <Link href="/dashboard/ai-gateway">
              <Button variant="outline" size="lg">
                View AI Gateway Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Unite Group?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-green-600">99.9% Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enterprise-grade reliability with automatic failover and advanced monitoring systems.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-blue-600">AI-Powered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Advanced AI gateway supporting OpenAI, Claude, Google AI, and Azure with intelligent routing.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="text-purple-600">Global Scale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Multi-language support, CDN optimization, and worldwide deployment capabilities.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="text-orange-600">Enterprise Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                SOC2 compliance, GDPR ready, MFA authentication, and advanced security monitoring.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="container mx-auto" />

      {/* Our Solutions */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Solutions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          
          {/* AI Infrastructure */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                AI Infrastructure
              </CardTitle>
              <CardDescription>
                Production-ready AI gateway with multi-provider support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• OpenAI, Claude, Google AI, Azure integration</li>
                <li>• Automatic failover and load balancing</li>
                <li>• Intelligent caching and rate limiting</li>
                <li>• Real-time monitoring and analytics</li>
                <li>• Cost optimization and usage tracking</li>
              </ul>
              <div className="mt-4">
                <Badge variant="secondary">503 Error Resolution</Badge>
                <Badge variant="secondary" className="ml-2">Multi-Provider</Badge>
              </div>
            </CardContent>
          </Card>

          {/* SaaS Platform Development */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🏗️</span>
                SaaS Platform Development
              </CardTitle>
              <CardDescription>
                Full-stack enterprise applications with modern architecture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Next.js 14 with App Router</li>
                <li>• TypeScript and modern React patterns</li>
                <li>• Supabase database and authentication</li>
                <li>• Stripe payment integration</li>
                <li>• PWA capabilities and offline support</li>
              </ul>
              <div className="mt-4">
                <Badge variant="secondary">Next.js 14</Badge>
                <Badge variant="secondary" className="ml-2">TypeScript</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Business Intelligence */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Business Intelligence
              </CardTitle>
              <CardDescription>
                Advanced analytics and performance monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Real-time analytics dashboards</li>
                <li>• Performance optimization tools</li>
                <li>• User behavior tracking</li>
                <li>• Custom reporting and insights</li>
                <li>• Predictive analytics with AI</li>
              </ul>
              <div className="mt-4">
                <Badge variant="secondary">Real-time</Badge>
                <Badge variant="secondary" className="ml-2">Predictive AI</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Security & Compliance */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                Security & Compliance
              </CardTitle>
              <CardDescription>
                Enterprise-grade security and regulatory compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• SOC2 Type II compliance framework</li>
                <li>• GDPR and privacy protection</li>
                <li>• Multi-factor authentication (MFA)</li>
                <li>• Role-based access control (RBAC)</li>
                <li>• Advanced security monitoring</li>
              </ul>
              <div className="mt-4">
                <Badge variant="secondary">SOC2</Badge>
                <Badge variant="secondary" className="ml-2">GDPR</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Performance Optimization */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                Performance Optimization
              </CardTitle>
              <CardDescription>
                Lightning-fast applications with global reach
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• CDN optimization and image processing</li>
                <li>• Database query optimization</li>
                <li>• Caching strategies and Redis integration</li>
                <li>• Bundle optimization and code splitting</li>
                <li>• Load testing and performance monitoring</li>
              </ul>
              <div className="mt-4">
                <Badge variant="secondary">CDN</Badge>
                <Badge variant="secondary" className="ml-2">Caching</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Internationalization */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🌍</span>
                Global Solutions
              </CardTitle>
              <CardDescription>
                Multi-language and multi-region capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Multi-language support (i18n)</li>
                <li>• Regional content management</li>
                <li>• Global CDN deployment</li>
                <li>• Currency and payment localization</li>
                <li>• Cultural adaptation and UX</li>
              </ul>
              <div className="mt-4">
                <Badge variant="secondary">i18n</Badge>
                <Badge variant="secondary" className="ml-2">Global CDN</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="container mx-auto" />

      {/* Technology Stack */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Technology Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 text-center">
          <div className="p-4">
            <div className="text-4xl mb-2">⚛️</div>
            <h3 className="font-semibold">React/Next.js</h3>
            <p className="text-sm text-gray-600">Frontend Framework</p>
          </div>
          <div className="p-4">
            <div className="text-4xl mb-2">🟦</div>
            <h3 className="font-semibold">TypeScript</h3>
            <p className="text-sm text-gray-600">Type Safety</p>
          </div>
          <div className="p-4">
            <div className="text-4xl mb-2">🐘</div>
            <h3 className="font-semibold">Supabase</h3>
            <p className="text-sm text-gray-600">Database & Auth</p>
          </div>
          <div className="p-4">
            <div className="text-4xl mb-2">🤖</div>
            <h3 className="font-semibold">AI Gateway</h3>
            <p className="text-sm text-gray-600">Multi-Provider AI</p>
          </div>
          <div className="p-4">
            <div className="text-4xl mb-2">☁️</div>
            <h3 className="font-semibold">Vercel</h3>
            <p className="text-sm text-gray-600">Cloud Platform</p>
          </div>
          <div className="p-4">
            <div className="text-4xl mb-2">🎨</div>
            <h3 className="font-semibold">Tailwind CSS</h3>
            <p className="text-sm text-gray-600">UI Framework</p>
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Proven Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-lg font-semibold mb-1">Uptime Guarantee</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Enterprise reliability with AI failover</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">&lt;1s</div>
              <div className="text-lg font-semibold mb-1">Response Time</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Lightning-fast performance globally</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-lg font-semibold mb-1">Features Built</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Comprehensive enterprise platform</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-lg font-semibold mb-1">Monitoring</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Advanced analytics and alerting</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Let&apos;s discuss how our enterprise-grade AI solutions and comprehensive SaaS platform 
            can accelerate your digital transformation and drive business growth.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/book-consultation">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Schedule Free Consultation
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg">
                Contact Our Team
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>🔒 SOC2 Compliant • 🌍 Global Infrastructure • 🤖 AI-Powered • ⚡ Enterprise Performance</p>
          </div>
        </div>
      </section>
    </div>
  );
}
