import { Metadata } from 'next';
import { Users, CheckCircle2, ArrowRight, BookOpen, Award, Target, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Expert Education | Unite Group',
  description: 'Professional training and development programs designed to enhance your team capabilities and drive innovation.',
};

export default function ExpertEducationPage() {
  const features = [
    'Custom curriculum development',
    'Expert-led training sessions',
    'Hands-on workshops',
    'Certification programs'
  ];

  const benefits = [
    {
      icon: BookOpen,
      title: 'Customized Learning',
      description: 'Tailored curriculum designed specifically for your team and industry needs'
    },
    {
      icon: Award,
      title: 'Expert Instructors',
      description: 'Learn from industry professionals with real-world experience'
    },
    {
      icon: Target,
      title: 'Practical Skills',
      description: 'Hands-on workshops that provide immediately applicable skills'
    },
    {
      icon: Lightbulb,
      title: 'Innovation Focus',
      description: 'Training programs designed to drive innovation and growth'
    }
  ];

  const programs = [
    {
      title: 'Technology Training',
      description: 'Modern development practices, cloud technologies, and emerging tech trends',
      duration: '2-4 weeks',
      format: 'Hybrid'
    },
    {
      title: 'Leadership Development',
      description: 'Executive coaching and leadership skills for technical and business leaders',
      duration: '6-8 weeks',
      format: 'In-person'
    },
    {
      title: 'Digital Transformation',
      description: 'Strategic planning and implementation of digital transformation initiatives',
      duration: '4-6 weeks',
      format: 'Virtual'
    },
    {
      title: 'Custom Workshops',
      description: 'Tailored training programs designed specifically for your organization',
      duration: 'Flexible',
      format: 'Hybrid'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex p-4 rounded-full bg-blue-500 text-white mb-6">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Expert Education
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
              Professional training and development programs designed to enhance your team&apos;s capabilities and drive innovation.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <Badge className="bg-blue-500 text-white px-4 py-2 text-sm">
                Custom Training
              </Badge>
              <Badge className="bg-green-500 text-white px-4 py-2 text-sm">
                Expert Instructors
              </Badge>
              <Badge className="bg-purple-500 text-white px-4 py-2 text-sm">
                Certification
              </Badge>
            </div>
            <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 text-lg">
              Explore Training Programs
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
              Program Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center p-6 bg-white rounded-lg shadow-sm">
                  <CheckCircle2 className="w-6 h-6 text-blue-500 mr-4 flex-shrink-0" />
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
              Why Choose Our Training
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto p-3 rounded-full bg-blue-100 text-blue-600 w-fit">
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

      {/* Programs Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Training Programs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {programs.map((program, index) => (
                <Card key={index} className="bg-white text-slate-900">
                  <CardHeader>
                    <CardTitle className="text-2xl text-blue-600">{program.title}</CardTitle>
                    <CardDescription className="text-slate-600 text-base">
                      {program.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-slate-500">Duration: {program.duration}</span>
                      <Badge variant="outline">{program.format}</Badge>
                    </div>
                    <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
              Ready to Invest in Your Team?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Contact us to discuss custom training programs tailored to your organization&apos;s needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4">
                Get Custom Quote
                <BookOpen className="ml-2 w-5 h-5" />
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
