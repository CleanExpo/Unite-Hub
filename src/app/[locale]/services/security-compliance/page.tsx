/**
 * Security & Compliance Services Page
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Shield, Lock, FileCheck, AlertTriangle, Key } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security & Compliance Services | Unite Group',
  description: 'Enterprise-grade security solutions with comprehensive compliance frameworks including SOC 2, GDPR, CCPA, and ISO 27001.',
};

const features = [
  {
    icon: Shield,
    title: 'Zero-Trust Architecture',
    description: 'Implement defense-in-depth security with continuous verification and least privilege access control.',
  },
  {
    icon: Lock,
    title: 'Advanced Threat Protection',
    description: 'AI-powered threat detection with real-time monitoring and automated incident response.',
  },
  {
    icon: FileCheck,
    title: 'Compliance Automation',
    description: 'Streamline compliance with automated policy enforcement and continuous monitoring.',
  },
  {
    icon: Key,
    title: 'Identity Management',
    description: 'Enterprise SSO, MFA, and identity governance with seamless user experience.',
  },
  {
    icon: AlertTriangle,
    title: '24/7 Security Monitoring',
    description: 'Round-the-clock security operations center with expert threat analysts.',
  },
];

const certifications = [
  'SOC 2 Type II',
  'ISO 27001',
  'GDPR Compliant',
  'CCPA Compliant',
  'HIPAA Ready',
  'PCI DSS',
  'Australian Privacy Act',
  'NIST Framework',
];

export default function SecurityCompliancePage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold text-white">
              Security & Compliance Services
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Protect your business with enterprise-grade security and maintain 
              compliance with global regulations. Our comprehensive security 
              framework keeps your data safe and your business compliant.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/contact">
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
                  Secure Your Business
                </Button>
              </Link>
              <Link href="/consultation">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-slate-900">
                  Security Assessment
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
            Comprehensive Security Solutions
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

      {/* Compliance Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">
                Global Compliance Standards
              </h2>
              <p className="text-slate-300 mb-6">
                We ensure your business meets all regulatory requirements with our 
                comprehensive compliance framework:
              </p>
              <div className="grid grid-cols-2 gap-4">
                {certifications.map((cert, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-teal-500" />
                    <span className="text-slate-300">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <h3 className="text-2xl font-bold text-white mb-4">
                Security-First Approach
              </h3>
              <div className="space-y-4 text-slate-300">
                <p>Our security services include:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Vulnerability assessments and penetration testing</li>
                  <li>Security architecture design and review</li>
                  <li>Incident response planning and execution</li>
                  <li>Security awareness training</li>
                  <li>Compliance gap analysis and remediation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Security Excellence
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-teal-500 mb-2">99.99%</div>
              <p className="text-xl text-white mb-2">Threat Prevention Rate</p>
              <p className="text-slate-300">Advanced AI-powered protection</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-teal-500 mb-2">24/7</div>
              <p className="text-xl text-white mb-2">Security Monitoring</p>
              <p className="text-slate-300">Round-the-clock protection</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-teal-500 mb-2">100%</div>
              <p className="text-xl text-white mb-2">Compliance Success</p>
              <p className="text-slate-300">All audits passed first time</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Don&apos;t Leave Security to Chance
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start with our $550 security assessment and compliance consultation
          </p>
          <Link href="/consultation">
            <Button size="lg" variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">
              Protect Your Business Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
