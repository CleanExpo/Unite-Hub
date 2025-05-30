import { Metadata } from 'next';
import { Zap, CheckCircle2, ArrowRight, Gauge, Server, Rocket, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Performance Optimization Services | Unite Group',
  description: 'Lightning-fast applications with global reach and enterprise performance. CDN optimization, database tuning, and sub-second load times.',
  keywords: ['Performance Optimization', 'CDN', 'Database Optimization', 'Caching', 'Load Testing', 'Web Performance', 'Core Web Vitals'],
};

const features = [
  {
    title: 'CDN Optimization',
    description: 'Global content delivery with intelligent caching and image optimization',
    icon: Server,
  },
  {
    title: 'Database Performance',
    description: 'Query optimization, indexing strategies, and connection pooling',
    icon: Gauge,
  },
  {
    title: 'Application Speed',
    description: 'Code splitting, bundle optimization, and lazy loading implementation',
    icon: Rocket,
  },
  {
    title: 'Real-Time Monitoring',
    description: 'Performance tracking with alerts and automated optimization',
    icon: TrendingUp,
  },
];

const performanceMetrics = [
  { metric: 'Page Load Time', target: '< 1s', description: 'First contentful paint under 1 second' },
  { metric: 'Time to Interactive', target: '< 2s', description: 'Full interactivity within 2 seconds' },
  { metric: 'Core Web Vitals', target: '95%+', description: 'Excellent scores on all metrics' },
  { metric: 'API Response', target: '< 100ms', description: 'Sub-100ms API response times' },
];

export default function PerformancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white mb-8">
            <Zap className="w-12 h-12" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Performance Optimization
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Deliver lightning-fast experiences to your users with enterprise-grade performance optimization. 
            We make your applications blazing fast and globally accessible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:opacity-90">
              <Link href="/[locale]/contact">
                Optimize Performance
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/[locale]/contact">
                Get Performance Audit
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Performance Optimization Solutions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Performance Targets We Achieve
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {performanceMetrics.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{item.metric}</CardTitle>
                    <Badge className="text-lg px-4 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0">
                      {item.target}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Optimization Areas */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Comprehensive Optimization Areas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold mb-6">Frontend Optimization</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Bundle size reduction</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Image optimization & WebP</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Code splitting & lazy loading</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Critical CSS extraction</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-6">Backend Optimization</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Database query optimization</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Caching strategies (Redis)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>API response optimization</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Load balancing & scaling</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tools & Technologies */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Tools & Technologies We Use
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Cloudflare CDN',
              'Vercel Edge',
              'Redis Cache',
              'Lighthouse CI',
              'WebPageTest',
              'Bundle Analyzer',
              'New Relic',
              'DataDog',
            ].map((tool, index) => (
              <div key={index} className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <span className="text-sm font-medium">{tool}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready for Lightning-Fast Performance?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Let&apos;s optimize your application for speed, scalability, and user satisfaction.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:opacity-90">
              <Link href="/[locale]/contact">
                Start Optimization
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/[locale]/pricing">
                View Packages
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
