import { Metadata } from 'next';
import { Target, CheckCircle2, ArrowRight, TrendingUp, Lightbulb, Users, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Business Strategy | Unite Group',
  description: 'Strategic consulting to help you navigate challenges, identify opportunities, and achieve sustainable growth.',
};

export default function BusinessStrategyPage() {
  const features = [
    'Market analysis',
    'Competitive research',
    'Growth strategy development',
    'Performance optimization'
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Sustainable Growth',
      description: 'Develop strategies that drive long-term business success'
    },
    {
      icon: Lightbulb,
      title: 'Innovation Focus',
      description: 'Identify opportunities for innovation and market leadership'
    },
    {
      icon: Users,
      title: 'Team Alignment',
      description: 'Align your organization around clear strategic objectives'
    },
    {
      icon: BarChart3,
      title: 'Data-Driven Decisions',
      description: 'Make informed decisions based on comprehensive analysis'
    }
  ];

  const services = [
    {
      title: 'Strategic Planning',
      description: 'Comprehensive strategic planning to define your vision, mission, and roadmap for success.',
      features: ['Vision & Mission Development', 'Strategic Roadmapping', 'Goal Setting & KPIs', 'Resource Planning'],
      timeframe: '4-6 weeks'
    },
    {
      title: 'Market Analysis',
      description: 'In-depth analysis of your market, competitors, and opportunities for growth.',
      features: ['Market Research', 'Competitive Analysis', 'Customer Segmentation', 'Trend Analysis'],
      timeframe: '2-3 weeks'
    },
    {
      title: 'Digital Transformation',
      description: 'Guide your organization through digital transformation initiatives and technology adoption.',
      features: ['Technology Assessment', 'Digital Strategy', 'Change Management', 'Implementation Planning'],
      timeframe: '6-8 weeks'
    },
    {
      title: 'Performance Optimization',
      description: 'Optimize your business processes and operations for maximum efficiency and profitability.',
      features: ['Process Analysis', 'Efficiency Improvements', 'Cost Optimization', 'Quality Enhancement'],
      timeframe: '3-4 weeks'
    }
  ];

  const industries = [
    'Technology & Software',
    'Healthcare & Life Sciences',
    'Financial Services',
    'Retail & E-commerce',
    'Manufacturing',
    'Professional Services'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex p-4 rounded-full bg-orange-500 text-white mb-6">
              <Target className="w-8 h-8" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Business Strategy
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
              Strategic consulting to help you navigate challenges, identify opportunities, and achieve sustainable growth.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <Badge className="bg-orange-500 text-white px-4 py-2 text-sm">
                Strategic Planning
              </Badge>
              <Badge className="bg-blue-500 text-white px-4 py-2 text-sm">
                Market Analysis
              </Badge>
              <Badge className="bg-green-500 text-white px-4 py-2 text-sm">
                Growth Strategy
              </Badge>
            </div>
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg">
              Start Strategic Planning
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
              Strategic Consulting Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center p-6 bg-white rounded-lg shadow-sm">
                  <CheckCircle2 className="w-6 h-6 text-orange-500 mr-4 flex-shrink-0" />
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
              Strategic Advantages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto p-3 rounded-full bg-orange-100 text-orange-500 w-fit">
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
              Strategy Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.map((service, index) => (
                <Card key={index} className="bg-white text-slate-900">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-2xl text-orange-500">{service.title}</CardTitle>
                      <Badge variant="outline">{service.timeframe}</Badge>
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
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-slate-900">
              Industries We Serve
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {industries.map((industry, index) => (
                <div key={index} className="p-6 bg-white rounded-lg shadow-sm border-l-4 border-orange-500">
                  <h3 className="font-semibold text-lg text-slate-900">{industry}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-orange-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Let&apos;s develop a strategic plan that positions your business for sustainable growth and success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4">
                Schedule Strategy Session
                <Target className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-4" asChild>
                <Link href="/contact">
                  Contact Our Team
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
