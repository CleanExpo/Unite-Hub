/**
 * AI Infrastructure Services Page
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Cpu, Shield, Zap, Brain, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Infrastructure Services | Unite Group',
  description: 'Enterprise-grade AI Gateway with multi-provider support, advanced security, and intelligent optimization for your business.',
};

const features = [
  {
    icon: Cpu,
    title: 'Multi-Provider AI Gateway',
    description: 'Seamlessly integrate OpenAI, Claude, Google AI, and Azure with automatic failover and load balancing.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Advanced security framework with real-time monitoring, threat detection, and compliance automation.',
  },
  {
    icon: Zap,
    title: 'Performance Optimization',
    description: 'Intelligent caching, rate limiting, and circuit breakers ensure optimal performance at scale.',
  },
  {
    icon: Brain,
    title: 'Predictive Analytics',
    description: 'AI-powered insights with 95%+ forecasting accuracy for business intelligence.',
  },
  {
    icon: Sparkles,
    title: 'Autonomous Operations',
    description: 'Self-healing infrastructure with automated scaling and intelligent resource allocation.',
  },
];

const benefits = [
  'Reduce AI costs by up to 60% with intelligent routing',
  '99.9% uptime with automatic failover',
  'Sub-100ms response times globally',
  'Enterprise-grade security and compliance',
  'Real-time monitoring and analytics',
  'Seamless integration with existing systems',
];

export default function AIInfrastructurePage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold text-white">
              AI Infrastructure Services
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Transform your business with our enterprise-grade AI infrastructure. 
              Multi-provider support, advanced security, and intelligent optimization 
              to power your AI initiatives.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/contact">
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
                  Get Started
                </Button>
              </Link>
              <Link href="/consultation">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-slate-900">
                  Book Consultation
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
            Enterprise AI Capabilities
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

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">
                Why Choose Unite Group AI Infrastructure?
              </h2>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <h3 className="text-2xl font-bold text-white mb-4">
                AI Gateway Architecture
              </h3>
              <div className="space-y-4 text-slate-300">
                <p>Our AI Gateway provides:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Unified API for all AI providers</li>
                  <li>Automatic provider selection based on cost and performance</li>
                  <li>Built-in fallback mechanisms</li>
                  <li>Response caching and optimization</li>
                  <li>Comprehensive logging and analytics</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Scale Your AI Infrastructure?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start with our $550 consultation to design your custom AI solution
          </p>
          <Link href="/consultation">
            <Button size="lg" variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">
              Book Your Consultation
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
