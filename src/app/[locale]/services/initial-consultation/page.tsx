import { Metadata } from 'next';
import { Clock, CheckCircle2, ArrowRight, Calendar, Target, BarChart3, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Initial Consultation | Unite Group',
  description: 'Comprehensive business analysis and strategic planning to understand your unique needs and challenges. Start your transformation journey with expert consultation.',
};

export default function InitialConsultationPage() {
  const features = [
    'In-depth business assessment',
    'Technology needs analysis', 
    'Strategic roadmap development',
    'Custom solution recommendations'
  ];

  const benefits = [
    {
      icon: Target,
      title: 'Strategic Clarity',
      description: 'Get clear direction on your business objectives and technology needs'
    },
    {
      icon: BarChart3,
      title: 'Data-Driven Insights',
      description: 'Receive actionable insights based on comprehensive analysis'
    },
    {
      icon: Users,
      title: 'Expert Guidance',
      description: 'Work with experienced consultants who understand your industry'
    },
    {
      icon: Calendar,
      title: 'Roadmap Planning',
      description: 'Develop a clear timeline and implementation strategy'
    }
  ];

  const process = [
    {
      step: '01',
      title: 'Discovery Session',
      description: 'We start with an in-depth discussion about your business goals, challenges, and current technology landscape.'
    },
    {
      step: '02',
      title: 'Analysis & Assessment',
      description: 'Our team conducts a comprehensive analysis of your systems, processes, and market position.'
    },
    {
      step: '03',
      title: 'Strategic Planning',
      description: 'We develop a customized strategic roadmap with clear milestones and actionable recommendations.'
    },
    {
      step: '04',
      title: 'Presentation & Next Steps',
      description: 'Receive a detailed presentation of findings and recommendations with clear next steps for implementation.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex p-4 rounded-full bg-green-500 text-white mb-6">
              <Clock className="w-8 h-8" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Initial Consultation
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
              Comprehensive business analysis and strategic planning to understand your unique needs and challenges.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <Badge className="bg-green-500 text-white px-4 py-2 text-sm">
                Strategic Planning
              </Badge>
              <Badge className="bg-blue-500 text-white px-4 py-2 text-sm">
                Business Analysis
              </Badge>
              <Badge className="bg-purple-500 text-white px-4 py-2 text-sm">
                Expert Consultation
              </Badge>
            </div>
            <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg">
              Schedule Your Consultation
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
              What's Included
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center p-6 bg-white rounded-lg shadow-sm">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mr-4 flex-shrink-0" />
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
              Key Benefits
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

      {/* Process Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Our Consultation Process
            </h2>
            <div className="space-y-8">
              {process.map((step, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 mr-6">
                    <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xl">
                      {step.step}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                    <p className="text-slate-300 text-lg leading-relaxed">{step.description}</p>
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
              Ready to Get Started?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Schedule your initial consultation today and take the first step towards transforming your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white px-8 py-4">
                Schedule Consultation
                <Calendar className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-4" asChild>
                <Link href="/contact">
                  Contact Us
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
