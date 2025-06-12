/**
 * Global Solutions Services Page
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Globe2, Languages, Currency, MapPin, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Global Solutions | Unite Group',
  description: 'Expand your business worldwide with our international solutions including multi-language support, global payments, and regional compliance.',
};

const features = [
  {
    icon: Languages,
    title: 'Multi-Language Support',
    description: 'Full internationalization with support for 40+ languages and right-to-left scripts.',
  },
  {
    icon: Currency,
    title: 'Multi-Currency Platform',
    description: 'Process payments in 135+ currencies with real-time exchange rates and localized pricing.',
  },
  {
    icon: Globe2,
    title: 'Global Infrastructure',
    description: 'Deploy across 30+ regions worldwide with automatic failover and geo-routing.',
  },
  {
    icon: MapPin,
    title: 'Regional Compliance',
    description: 'Navigate local regulations with built-in compliance for GDPR, CCPA, PIPEDA, and more.',
  },
  {
    icon: Users,
    title: 'Cultural Localization',
    description: 'Adapt content, design, and user experience to match local cultural preferences.',
  },
];

const regions = [
  'North America (US, Canada, Mexico)',
  'Europe (EU27 + UK, Switzerland)',
  'Asia-Pacific (Australia, NZ, Singapore)',
  'Middle East & Africa',
  'Latin America',
  'Greater China Region',
];

export default function GlobalSolutionsPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold text-white">
              Global Solutions
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Take your business global with our comprehensive international 
              solutions. From multi-language support to regional compliance, 
              we handle the complexity so you can focus on growth.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/contact">
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
                  Go Global Today
                </Button>
              </Link>
              <Link href="/consultation">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-slate-900">
                  International Strategy
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
            International Business Solutions
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

      {/* Global Reach Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">
                Truly Global Reach
              </h2>
              <p className="text-slate-300 mb-6">
                Our platform supports businesses operating in multiple regions 
                with comprehensive localization:
              </p>
              <ul className="space-y-3">
                {regions.map((region, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                    <span className="text-slate-300">{region}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <h3 className="text-2xl font-bold text-white mb-4">
                Complete Global Stack
              </h3>
              <div className="space-y-4 text-slate-300">
                <p>Everything you need for international success:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Automated translation management</li>
                  <li>Local payment method integration</li>
                  <li>Tax calculation and remittance</li>
                  <li>Regional content delivery</li>
                  <li>Local customer support tools</li>
                  <li>International SEO optimization</li>
                  <li>Cross-border data compliance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Global Success Metrics
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-teal-500 mb-2">195</div>
              <p className="text-xl text-white mb-2">Countries Supported</p>
              <p className="text-slate-300">With local compliance</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-teal-500 mb-2">40+</div>
              <p className="text-xl text-white mb-2">Languages Available</p>
              <p className="text-slate-300">Including RTL support</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-teal-500 mb-2">135+</div>
              <p className="text-xl text-white mb-2">Currencies Supported</p>
              <p className="text-slate-300">With real-time rates</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Expand Globally?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start with our $550 consultation to plan your international expansion
          </p>
          <Link href="/consultation">
            <Button size="lg" variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">
              Plan Your Global Strategy
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
