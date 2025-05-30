import { Metadata } from 'next';
import { BarChart3, CheckCircle2, ArrowRight, TrendingUp, PieChart, Activity, LineChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Business Intelligence Services | Unite Group',
  description: 'Advanced analytics and performance monitoring with AI-powered insights. Real-time dashboards, predictive analytics, and custom reporting.',
  keywords: ['Business Intelligence', 'Analytics', 'Data Visualization', 'Predictive Analytics', 'Real-time Dashboards', 'Performance Monitoring', 'AI Insights'],
};

const features = [
  {
    title: 'Real-Time Analytics',
    description: 'Live dashboards with instant data updates and interactive visualizations',
    icon: Activity,
  },
  {
    title: 'Predictive Analytics',
    description: 'AI-powered forecasting and trend analysis for data-driven decisions',
    icon: TrendingUp,
  },
  {
    title: 'Custom Reporting',
    description: 'Tailored reports and insights specific to your business needs',
    icon: PieChart,
  },
  {
    title: 'Performance Monitoring',
    description: 'Track KPIs and business metrics with automated alerting',
    icon: LineChart,
  },
];

const capabilities = [
  {
    title: 'Data Sources',
    items: ['Databases', 'APIs', 'CSV/Excel', 'Real-time Streams', 'Cloud Storage', 'Third-party Services'],
  },
  {
    title: 'Analytics Features',
    items: ['Trend Analysis', 'Cohort Analysis', 'Funnel Analytics', 'User Behavior', 'Revenue Analytics', 'Churn Prediction'],
  },
  {
    title: 'Visualization Types',
    items: ['Interactive Charts', 'Heat Maps', 'Geographic Maps', 'Custom Dashboards', 'Mobile Reports', 'Embedded Analytics'],
  },
];

export default function BusinessIntelligencePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white mb-8">
            <BarChart3 className="w-12 h-12" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Business Intelligence
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Transform your data into actionable insights with advanced analytics and AI-powered intelligence. 
            Make informed decisions with real-time dashboards and predictive analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90">
              <Link href="/[locale]/contact">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/[locale]/contact">
                View Demo
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Business Intelligence Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white">
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

      {/* Capabilities */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Comprehensive Analytics Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {capabilities.map((capability, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{capability.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {capability.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Industry Applications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">E-Commerce & Retail</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Sales performance analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Customer behavior insights</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Inventory optimization</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Revenue forecasting</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">SaaS & Technology</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>User engagement metrics</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Churn prediction & prevention</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Feature adoption tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Growth analytics</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            The Unite Group Advantage
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Real-time insights',
              'AI-powered analytics',
              'Custom dashboards',
              'Predictive modeling',
              'Automated reporting',
              'Data integration',
              'Mobile access',
              'Enterprise security',
            ].map((benefit, index) => (
              <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Unlock Your Data&apos;s Potential?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Transform your business with data-driven insights and AI-powered analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90">
              <Link href="/[locale]/contact">
                Start Your Analytics Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/[locale]/pricing">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
