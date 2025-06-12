/**
 * Performance Optimization Services Page
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Zap, Gauge, Rocket, Globe, Server } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Performance Optimization Services | Unite Group',
  description: 'Achieve sub-second load times and optimal user experience with our advanced performance optimization services.',
};

const features = [
  {
    icon: Zap,
    title: 'Lightning-Fast Load Times',
    description: 'Achieve sub-second page loads with advanced optimization techniques and edge caching.',
  },
  {
    icon: Gauge,
    title: 'Core Web Vitals',
    description: 'Perfect scores on Google&apos;s Core Web Vitals for better SEO and user experience.',
  },
  {
    icon: Rocket,
    title: 'Code Optimization',
    description: 'Minification, tree-shaking, and code splitting for minimal bundle sizes.',
  },
  {
    icon: Globe,
    title: 'Global CDN',
    description: 'Content delivery from 300+ edge locations worldwide for instant access anywhere.',
  },
  {
    icon: Server,
    title: 'Server Optimization',
    description: 'Database query optimization, caching strategies, and efficient resource utilization.',
  },
];

const metrics = [
  'First Contentful Paint (FCP) < 1.8s',
  'Largest Contentful Paint (LCP) < 2.5s',
  'Cumulative Layout Shift (CLS) < 0.1',
  'First Input Delay (FID) < 100ms',
  'Time to Interactive (TTI) < 3.8s',
  'Total Blocking Time (TBT) < 200ms',
  'Speed Index < 3.4s',
  'Lighthouse Score 95+',
];

export default function PerformancePage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold text-white">
              Performance Optimization Services
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Speed is revenue. Every second of delay costs conversions. 
              Our performance optimization services ensure your platform 
              delivers exceptional user experience at lightning speed.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/contact">
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
                  Optimize Now
                </Button>
              </Link>
              <Link href="/consultation">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-slate-900">
                  Get Performance Audit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Performance Optimization Solutions
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-teal-500 mb-2" />
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">
                Performance Targets We Achieve
              </h2>
              <p className="text-slate-300 mb-6">
                We optimize every aspect of your application to meet and exceed 
                industry-leading performance benchmarks:
              </p>
              <ul className="space-y-3">
                {metrics.map((metric, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                    <span className="text-slate-300">{metric}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <h3 className="text-2xl font-bold text-white mb-4">
                Optimization Techniques
              </h3>
              <div className="space-y-4 text-slate-300">
                <p>Our comprehensive approach includes:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Image optimization and lazy loading</li>
                  <li>Critical CSS extraction and inlining</li>
                  <li>JavaScript bundle optimization</li>
                  <li>Server-side rendering and static generation</li>
                  <li>Database indexing and query optimization</li>
                  <li>Redis caching implementation</li>
                  <li>HTTP/3 and compression</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Real Performance Results
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-teal-500 mb-2">73%</div>
              <p className="text-xl text-white mb-2">Faster Load Times</p>
              <p className="text-slate-300">Average improvement across clients</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-teal-500 mb-2">52%</div>
              <p className="text-xl text-white mb-2">Higher Conversion</p>
              <p className="text-slate-300">Due to improved performance</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-teal-500 mb-2">98+</div>
              <p className="text-xl text-white mb-2">Lighthouse Score</p>
              <p className="text-slate-300">Across all metrics</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Every Second Counts
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start with our $550 performance audit and optimization consultation
          </p>
          <Link href="/consultation">
            <Button size="lg" variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">
              Boost Your Performance
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
