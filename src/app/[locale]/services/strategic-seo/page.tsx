import { Metadata } from 'next';
import { Search, CheckCircle2, ArrowRight, TrendingUp, Target, BarChart3, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Strategic SEO | Unite Group',
  description: 'Data-driven SEO strategies to improve your online visibility, drive organic growth, and reach your target audience.',
};

export default function StrategicSEOPage() {
  const features = [
    'Comprehensive SEO audit',
    'Keyword research & strategy',
    'Technical SEO optimization',
    'Performance monitoring'
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Increased Visibility',
      description: 'Improve your search engine rankings and online presence'
    },
    {
      icon: Target,
      title: 'Targeted Traffic',
      description: 'Attract high-quality visitors who are ready to convert'
    },
    {
      icon: BarChart3,
      title: 'Data-Driven Results',
      description: 'Strategy based on comprehensive analysis and proven metrics'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Expand your market reach with international SEO strategies'
    }
  ];

  const services = [
    {
      title: 'SEO Audit & Analysis',
      description: 'Comprehensive analysis of your current SEO performance and identification of improvement opportunities.',
      features: ['Technical SEO Review', 'Content Gap Analysis', 'Competitor Research', 'Performance Benchmarking'],
      duration: '2-3 weeks'
    },
    {
      title: 'Keyword Strategy',
      description: 'Research and development of targeted keyword strategies to drive qualified organic traffic.',
      features: ['Keyword Research', 'Search Intent Analysis', 'Competitive Analysis', 'Content Planning'],
      duration: '1-2 weeks'
    },
    {
      title: 'Technical Optimization',
      description: 'Implementation of technical SEO improvements to enhance your website performance and crawlability.',
      features: ['Site Speed Optimization', 'Mobile Optimization', 'Schema Markup', 'URL Structure'],
      duration: '3-4 weeks'
    },
    {
      title: 'Content Strategy',
      description: 'Development of SEO-optimized content that engages your audience and drives organic growth.',
      features: ['Content Calendar', 'SEO Copywriting', 'Blog Strategy', 'Content Optimization'],
      duration: 'Ongoing'
    }
  ];

  const process = [
    {
      step: '01',
      title: 'Discovery & Audit',
      description: 'We analyze your current SEO performance, identify opportunities, and assess your competitive landscape.'
    },
    {
      step: '02',
      title: 'Strategy Development',
      description: 'Based on our findings, we develop a comprehensive SEO strategy tailored to your business goals.'
    },
    {
      step: '03',
      title: 'Implementation',
      description: 'Our team implements the SEO strategy, including technical optimizations and content development.'
    },
    {
      step: '04',
      title: 'Monitoring & Optimization',
      description: 'We continuously monitor performance and optimize the strategy for maximum results.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex p-4 rounded-full bg-green-600 text-white mb-6">
              <Search className="w-8 h-8" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Strategic SEO
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
              Data-driven SEO strategies to improve your online visibility, drive organic growth, and reach your target audience.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <Badge className="bg-green-600 text-white px-4 py-2 text-sm">
                Data-Driven Strategy
              </Badge>
              <Badge className="bg-blue-500 text-white px-4 py-2 text-sm">
                Organic Growth
              </Badge>
              <Badge className="bg-purple-500 text-white px-4 py-2 text-sm">
                Performance Tracking
              </Badge>
            </div>
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg">
              Start SEO Analysis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-900">
              SEO Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center p-6 bg-white rounded-lg shadow-sm">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mr-4 flex-shrink-0" />
                  <span className="text-lg text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-900">
              SEO Benefits
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto p-3 rounded-full bg-green-100 text-green-600 w-fit">
                      <benefit.icon className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600">
                      {benefit.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              SEO Service Packages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.map((service, index) => (
                <Card key={index} className="bg-white text-slate-900">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-2xl text-green-600">{service.title}</CardTitle>
                      <Badge variant="outline">{service.duration}</Badge>
                    </div>
                    <CardDescription className="text-slate-600 text-base">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-900">
              Our SEO Process
            </h2>
            <div className="space-y-8">
              {process.map((step, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 mr-6">
                    <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xl">
                      {step.step}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3 text-slate-900">{step.title}</h3>
                    <p className="text-slate-600 text-lg leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
              Ready to Dominate Search Results?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Let&apos;s analyze your current SEO performance and develop a strategy to drive organic growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4">
                Get SEO Audit
                <Search className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-4" asChild>
                <Link href="/contact">
                  Discuss Strategy
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
