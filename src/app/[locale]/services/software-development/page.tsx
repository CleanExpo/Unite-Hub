import { Metadata } from 'next';
import { Code, CheckCircle2, ArrowRight, Zap, Shield, Layers, Rocket } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Software Development | Unite Group',
  description: 'Cutting-edge software solutions built with modern technologies to streamline your operations and boost efficiency.',
};

export default function SoftwareDevelopmentPage() {
  const features = [
    'Custom application development',
    'Modern tech stack implementation',
    'Scalable architecture design',
    'Quality assurance & testing'
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'High Performance',
      description: 'Optimized applications built for speed and efficiency'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security and robust error handling'
    },
    {
      icon: Layers,
      title: 'Scalable Architecture',
      description: 'Future-proof solutions that grow with your business'
    },
    {
      icon: Rocket,
      title: 'Modern Tech Stack',
      description: 'Built with cutting-edge technologies and best practices'
    }
  ];

  const technologies = [
    {
      category: 'Frontend',
      technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS']
    },
    {
      category: 'Backend',
      technologies: ['Node.js', 'Python', 'PostgreSQL', 'Supabase']
    },
    {
      category: 'Cloud & DevOps',
      technologies: ['Vercel', 'AWS', 'Docker', 'CI/CD']
    },
    {
      category: 'Mobile',
      technologies: ['React Native', 'Flutter', 'Progressive Web Apps']
    }
  ];

  const services = [
    {
      title: 'Web Applications',
      description: 'Modern, responsive web applications built with React, Next.js, and cutting-edge technologies.',
      features: ['Single Page Applications', 'Progressive Web Apps', 'E-commerce Platforms', 'Content Management Systems']
    },
    {
      title: 'Mobile Development',
      description: 'Cross-platform mobile applications that work seamlessly across iOS and Android devices.',
      features: ['Native Performance', 'Cross-Platform Compatibility', 'Offline Functionality', 'Push Notifications']
    },
    {
      title: 'API Development',
      description: 'Robust, scalable APIs that power your applications and integrate with third-party services.',
      features: ['RESTful APIs', 'GraphQL', 'Real-time Communication', 'Third-party Integrations']
    },
    {
      title: 'Cloud Solutions',
      description: 'Scalable cloud infrastructure and deployment solutions for maximum performance and reliability.',
      features: ['Auto-scaling Infrastructure', 'Database Management', 'CDN Integration', 'Monitoring & Analytics']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex p-4 rounded-full bg-blue-600 text-white mb-6">
              <Code className="w-8 h-8" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Software Development
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
              Cutting-edge software solutions built with modern technologies to streamline your operations and boost efficiency.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <Badge className="bg-blue-600 text-white px-4 py-2 text-sm">
                Modern Tech Stack
              </Badge>
              <Badge className="bg-green-500 text-white px-4 py-2 text-sm">
                Scalable Architecture
              </Badge>
              <Badge className="bg-purple-500 text-white px-4 py-2 text-sm">
                Custom Solutions
              </Badge>
            </div>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
              Start Your Project
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
              Development Approach
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center p-6 bg-white rounded-lg shadow-sm">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 mr-4 flex-shrink-0" />
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
              Why Choose Our Development
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

      {/* Technologies Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Technologies We Use
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {technologies.map((tech, index) => (
                <Card key={index} className="bg-white text-slate-900">
                  <CardHeader>
                    <CardTitle className="text-xl text-blue-600">{tech.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tech.technologies.map((technology, techIndex) => (
                        <li key={techIndex} className="flex items-center">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-slate-700">{technology}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-900">
              Development Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.map((service, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-2xl text-blue-600">{service.title}</CardTitle>
                    <CardDescription className="text-slate-600 text-base">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
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
              Ready to Build Something Amazing?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Let&apos;s discuss your project and create a custom software solution that drives your business forward.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4">
                Start Your Project
                <Code className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-4" asChild>
                <Link href="/contact">
                  Get Consultation
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
