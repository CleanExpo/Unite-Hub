/**
 * Business Intelligence Services Page
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, BarChart3, TrendingUp, Brain, Database, LineChart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Business Intelligence Services | Unite Group',
  description: 'Transform your data into actionable insights with AI-powered analytics, real-time dashboards, and predictive intelligence.',
};

const features = [
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Monitor key metrics with live dashboards that update in real-time, giving you instant visibility into your business performance.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Machine learning algorithms analyze patterns and provide actionable recommendations for business optimization.',
  },
  {
    icon: TrendingUp,
    title: 'Predictive Analytics',
    description: '95%+ accuracy in forecasting sales, customer behavior, and market trends to stay ahead of the competition.',
  },
  {
    icon: Database,
    title: 'Data Integration',
    description: 'Seamlessly connect all your data sources into a unified platform for comprehensive analysis.',
  },
  {
    icon: LineChart,
    title: 'Custom Reporting',
    description: 'Build tailored reports and visualizations that match your specific business needs and KPIs.',
  },
];

const capabilities = [
  'Sales pipeline analytics and forecasting',
  'Customer behavior and segmentation analysis',
  'Financial performance tracking',
  'Marketing campaign effectiveness',
  'Operational efficiency metrics',
  'Competitive market analysis',
  'Risk assessment and mitigation',
  'Resource optimization insights',
];

export default function BusinessIntelligencePage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold text-white">
              Business Intelligence Services
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Unlock the power of your data with AI-driven analytics. Make informed 
              decisions faster with real-time insights and predictive intelligence 
              that drives business growth.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/contact">
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
                  Transform Your Data
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
            Advanced Analytics Capabilities
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

      {/* Analytics Capabilities */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">
                Comprehensive Business Analytics
              </h2>
              <ul className="space-y-4">
                {capabilities.map((capability, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{capability}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <h3 className="text-2xl font-bold text-white mb-4">
                Data-Driven Decision Making
              </h3>
              <div className="space-y-4 text-slate-300">
                <p>Our BI platform delivers:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>360-degree view of your business</li>
                  <li>Automated data collection and processing</li>
                  <li>AI-generated insights and recommendations</li>
                  <li>Customizable alerts and notifications</li>
                  <li>Mobile-responsive dashboards</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Proven Business Impact
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-teal-500 mb-2">45%</div>
              <p className="text-xl text-white mb-2">Average Revenue Increase</p>
              <p className="text-slate-300">Through data-driven optimization</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-teal-500 mb-2">60%</div>
              <p className="text-xl text-white mb-2">Faster Decision Making</p>
              <p className="text-slate-300">With real-time insights</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-teal-500 mb-2">95%+</div>
              <p className="text-xl text-white mb-2">Forecast Accuracy</p>
              <p className="text-slate-300">Using AI predictive models</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Unlock Your Data&apos;s Potential?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start with our $550 consultation to design your custom analytics solution
          </p>
          <Link href="/consultation">
            <Button size="lg" variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
