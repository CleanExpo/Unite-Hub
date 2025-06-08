import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, TrendingUp, Target, BarChart3, Globe, FileText,
  ArrowRight, CheckCircle, Zap, LineChart, Users, Shield
} from 'lucide-react';
import { generateMetadata as generateSEOMetadata } from '@/components/seo/SEOHead';
import { JsonLd } from '@/components/seo/SEOHead';
import { generateServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Strategic SEO Services - Dominate Search Results',
  description: 'Data-driven SEO services that deliver measurable results. Increase organic traffic, improve rankings, and grow your business with our proven SEO strategies.',
  keywords: ['SEO services', 'search engine optimization', 'Google rankings', 'organic traffic', 'SEO Brisbane', 'local SEO'],
  url: 'https://unitegroup.com.au/services/strategic-seo',
});

export default function StrategicSEOPage() {
  const serviceSchema = generateServiceSchema({
    name: 'Strategic SEO Services',
    description: 'Comprehensive SEO services including technical optimization, content strategy, and link building',
    serviceType: 'Digital Marketing',
  });

  const seoServices = [
    {
      icon: <Search className="h-8 w-8" />,
      title: 'Technical SEO Audit',
      description: 'Complete technical analysis to identify and fix issues impacting your rankings',
      features: [
        'Site speed optimization',
        'Mobile responsiveness',
        'Crawlability analysis',
        'Schema markup implementation',
        'Core Web Vitals optimization',
      ],
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Content Strategy',
      description: 'Data-driven content planning that attracts and converts your target audience',
      features: [
        'Keyword research & mapping',
        'Content gap analysis',
        'Topic cluster planning',
        'Content optimization',
        'Editorial calendar',
      ],
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: 'Link Building',
      description: 'White-hat link building strategies that boost your domain authority',
      features: [
        'Competitor backlink analysis',
        'Outreach campaigns',
        'Digital PR',
        'Guest posting',
        'Broken link recovery',
      ],
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: 'Local SEO',
      description: 'Dominate local search results and attract nearby customers',
      features: [
        'Google My Business optimization',
        'Local citations',
        'Review management',
        'Location page optimization',
        'Local link building',
      ],
    },
  ];

  const results = [
    { metric: 'Average Traffic Increase', value: 156, suffix: '%' },
    { metric: 'First Page Rankings', value: 89, suffix: '%' },
    { metric: 'Conversion Rate Boost', value: 43, suffix: '%' },
    { metric: 'ROI Improvement', value: 312, suffix: '%' },
  ];

  const process = [
    {
      step: '01',
      title: 'SEO Audit',
      description: 'Comprehensive analysis of your current SEO performance and opportunities',
      duration: 'Week 1',
    },
    {
      step: '02',
      title: 'Strategy Development',
      description: 'Custom SEO strategy tailored to your business goals and competition',
      duration: 'Week 2',
    },
    {
      step: '03',
      title: 'Implementation',
      description: 'Execute technical fixes, content optimization, and link building',
      duration: 'Weeks 3-8',
    },
    {
      step: '04',
      title: 'Monitor & Optimize',
      description: 'Track performance, refine strategies, and scale what works',
      duration: 'Ongoing',
    },
  ];

  const packages = [
    {
      name: 'Local Business',
      price: '$1,500',
      duration: '/month',
      description: 'Perfect for local businesses targeting specific geographic areas',
      features: [
        'Technical SEO optimization',
        'Local SEO setup',
        '10 optimized pages',
        'Monthly reporting',
        'Google My Business management',
      ],
      ideal: 'Local businesses, service providers',
    },
    {
      name: 'Growth',
      price: '$3,500',
      duration: '/month',
      description: 'Comprehensive SEO for businesses ready to scale',
      features: [
        'Everything in Local',
        'Content strategy & creation',
        'Link building campaigns',
        '25 optimized pages',
        'Competitor analysis',
        'Bi-weekly calls',
      ],
      ideal: 'Growing businesses, e-commerce',
      recommended: true,
    },
    {
      name: 'Enterprise',
      price: '$7,500',
      duration: '/month',
      description: 'Full-service SEO for market leaders',
      features: [
        'Everything in Growth',
        'Dedicated SEO team',
        'Advanced technical SEO',
        'Unlimited pages',
        'International SEO',
        'Weekly strategy calls',
      ],
      ideal: 'Large businesses, multi-location',
    },
  ];

  return (
    <>
      <JsonLd data={serviceSchema} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10" />
          <div className="relative container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 bg-green-600 text-white">Proven Results</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Strategic SEO Services
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Dominate search results with data-driven SEO strategies. We don&apos;t just improve 
                rankings – we transform your organic presence into a revenue-generating machine.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/contact">
                  <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                    Get Free SEO Audit
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#results">
                  <Button size="lg" variant="outline">
                    View Case Studies
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Results Banner */}
        <section className="py-12 bg-gradient-to-r from-green-600 to-blue-600">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {results.map((result, index) => (
                <div
                  key={result.metric}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    +{result.value}{result.suffix}
                  </div>
                  <div className="text-green-100">{result.metric}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Comprehensive SEO Solutions
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Every aspect of SEO covered to ensure maximum visibility and growth
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {seoServices.map((service, index) => (
                <div key={service.title}>
                  <Card className="h-full hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center text-white mb-4">
                        {service.icon}
                      </div>
                      <CardTitle className="text-2xl">{service.title}</CardTitle>
                      <CardDescription className="text-base">
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {service.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-20 bg-gray-50 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our SEO Process
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                A proven methodology that delivers consistent, measurable results
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                {process.map((step, index) => (
                  <div
                    key={step.step}
                    className="relative"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {step.step}
                        </div>
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-2">{step.duration}</Badge>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {step.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Packages */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                SEO Packages
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Flexible plans designed to match your business goals and budget
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {packages.map((pkg, index) => (
                <div
                  key={pkg.name}
                  className={`relative ${pkg.recommended ? 'md:-mt-4' : ''}`}
                >
                  {pkg.recommended && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <Badge className="bg-green-600 text-white">Most Popular</Badge>
                    </div>
                  )}
                  <Card className={`h-full ${pkg.recommended ? 'border-green-600 shadow-xl' : ''}`}>
                    <CardHeader>
                      <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {pkg.price}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">{pkg.duration}</span>
                      </div>
                      <CardDescription className="mt-4">
                        {pkg.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {pkg.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <strong>Ideal for:</strong> {pkg.ideal}
                      </div>
                      <Button 
                        className={`w-full ${
                          pkg.recommended 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : ''
                        }`}
                        variant={pkg.recommended ? 'default' : 'outline'}
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Free SEO Audit */}
        <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
          <div className="container mx-auto px-4 text-center">
            <div>
              <Badge className="mb-4 bg-white text-green-600">Limited Time Offer</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Get Your Free SEO Audit Report
              </h2>
              <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
                Discover exactly what&apos;s holding your website back from ranking #1. 
                Our comprehensive audit reveals opportunities worth thousands in potential revenue.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/contact">
                  <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                    <Search className="mr-2 h-5 w-5" />
                    Claim Your Free Audit
                  </Button>
                </Link>
                <div className="text-white">
                  <p className="font-semibold">$750 Value • No Obligations</p>
                </div>
              </div>
              <p className="mt-8 text-sm text-green-100">
                📊 20+ page detailed report • 🔍 Technical analysis • 📈 Competitor insights
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
