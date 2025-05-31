import { Metadata } from 'next';
import { Award, CheckCircle2, ArrowRight, Shield, Zap, Target, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Quality Assurance | Unite Group',
  description: 'Rigorous testing and quality assurance processes to ensure your solutions meet the highest standards.',
};

export default function QualityAssurancePage() {
  const features = [
    'Comprehensive testing',
    'Performance optimization',
    'Security audits',
    'Ongoing maintenance'
  ];

  const benefits = [
    {
      icon: Shield,
      title: 'Risk Mitigation',
      description: 'Identify and eliminate potential issues before they impact users'
    },
    {
      icon: Zap,
      title: 'Enhanced Performance',
      description: 'Optimize application performance for the best user experience'
    },
    {
      icon: Target,
      title: 'Quality Standards',
      description: 'Ensure your solutions meet industry standards and best practices'
    },
    {
      icon: Users,
      title: 'User Satisfaction',
      description: 'Deliver reliable, high-quality experiences that users can trust'
    }
  ];

  const testingServices = [
    {
      title: 'Functional Testing',
      description: 'Comprehensive testing of all application features and functionality to ensure they work as intended.',
      features: ['Unit Testing', 'Integration Testing', 'System Testing', 'User Acceptance Testing'],
      coverage: '95%+'
    },
    {
      title: 'Performance Testing',
      description: 'Evaluate application performance under various conditions to ensure optimal speed and stability.',
      features: ['Load Testing', 'Stress Testing', 'Volume Testing', 'Scalability Testing'],
      coverage: 'All Critical Paths'
    },
    {
      title: 'Security Testing',
      description: 'Identify vulnerabilities and security gaps to protect your application and user data.',
      features: ['Vulnerability Assessment', 'Penetration Testing', 'Security Audits', 'Compliance Verification'],
      coverage: 'Full Security Review'
    },
    {
      title: 'Automation Testing',
      description: 'Implement automated testing frameworks for efficient, repeatable, and comprehensive testing.',
      features: ['Test Automation', 'Continuous Integration', 'Regression Testing', 'API Testing'],
      coverage: '80%+ Automation'
    }
  ];

  const methodology = [
    {
      phase: 'Planning',
      description: 'Define testing strategy, scope, and success criteria based on project requirements.',
      deliverables: ['Test Strategy', 'Test Plan', 'Test Cases', 'Risk Assessment']
    },
    {
      phase: 'Execution',
      description: 'Execute comprehensive testing across all application layers and components.',
      deliverables: ['Test Results', 'Bug Reports', 'Performance Metrics', 'Coverage Reports']
    },
    {
      phase: 'Analysis',
      description: 'Analyze results, identify issues, and provide recommendations for improvements.',
      deliverables: ['Quality Reports', 'Recommendations', 'Risk Analysis', 'Improvement Plan']
    },
    {
      phase: 'Optimization',
      description: 'Implement improvements and conduct regression testing to ensure quality standards.',
      deliverables: ['Optimized Code', 'Updated Tests', 'Performance Improvements', 'Final Report']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex p-4 rounded-full bg-red-500 text-white mb-6">
              <Award className="w-8 h-8" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Quality Assurance
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
              Rigorous testing and quality assurance processes to ensure your solutions meet the highest standards.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <Badge className="bg-red-500 text-white px-4 py-2 text-sm">
                Comprehensive Testing
              </Badge>
              <Badge className="bg-blue-500 text-white px-4 py-2 text-sm">
                Performance Optimization
              </Badge>
              <Badge className="bg-green-500 text-white px-4 py-2 text-sm">
                Security Audits
              </Badge>
            </div>
            <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-lg">
              Start Quality Assessment
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
              QA Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center p-6 bg-white rounded-lg shadow-sm">
                  <CheckCircle2 className="w-6 h-6 text-red-500 mr-4 flex-shrink-0" />
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
              Quality Benefits
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto p-3 rounded-full bg-red-100 text-red-500 w-fit">
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

      {/* Testing Services Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Testing Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testingServices.map((service, index) => (
                <Card key={index} className="bg-white text-slate-900">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-2xl text-red-500">{service.title}</CardTitle>
                      <Badge variant="outline">{service.coverage}</Badge>
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
                    <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-900">
              QA Methodology
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {methodology.map((phase, index) => (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-lg mb-4">
                      {index + 1}
                    </div>
                    <CardTitle className="text-xl text-red-500">{phase.phase}</CardTitle>
                    <CardDescription className="text-slate-600">
                      {phase.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm text-slate-600">
                      {phase.deliverables.map((deliverable, deliverableIndex) => (
                        <li key={deliverableIndex} className="flex items-center">
                          <CheckCircle2 className="w-3 h-3 text-green-500 mr-1" />
                          {deliverable}
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
      <section className="py-20 bg-red-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
              Ready to Ensure Quality Excellence?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Let&apos;s implement comprehensive quality assurance processes to deliver exceptional user experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white px-8 py-4">
                Start QA Assessment
                <Award className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-4" asChild>
                <Link href="/contact">
                  Discuss Testing Needs
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
