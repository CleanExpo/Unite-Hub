import { Metadata } from 'next';
import { Shield, CheckCircle2, ArrowRight, Lock, FileCheck, UserCheck, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Security & Compliance Services | Unite Group',
  description: 'Enterprise-grade security and regulatory compliance frameworks. SOC2, GDPR, HIPAA compliance with advanced security monitoring.',
  keywords: ['Security', 'Compliance', 'SOC2', 'GDPR', 'HIPAA', 'RBAC', 'MFA', 'Zero Trust', 'Enterprise Security'],
};

const features = [
  {
    title: 'Compliance Frameworks',
    description: 'SOC2, GDPR, HIPAA, and other regulatory compliance implementations',
    icon: FileCheck,
  },
  {
    title: 'Identity Management',
    description: 'Multi-factor authentication, SSO, and role-based access control',
    icon: UserCheck,
  },
  {
    title: 'Security Monitoring',
    description: '24/7 threat detection with advanced security analytics',
    icon: AlertTriangle,
  },
  {
    title: 'Data Protection',
    description: 'End-to-end encryption and secure data handling practices',
    icon: Lock,
  },
];

const complianceStandards = [
  {
    name: 'SOC2 Type II',
    description: 'System and Organization Controls for service organizations',
    features: ['Security', 'Availability', 'Processing Integrity', 'Confidentiality', 'Privacy'],
  },
  {
    name: 'GDPR',
    description: 'General Data Protection Regulation for EU data privacy',
    features: ['Data minimization', 'Right to erasure', 'Consent management', 'Privacy by design', 'Data portability'],
  },
  {
    name: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act',
    features: ['PHI protection', 'Access controls', 'Audit controls', 'Transmission security', 'Encryption'],
  },
];

export default function SecurityCompliancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white mb-8">
            <Shield className="w-12 h-12" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Security & Compliance
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Protect your business with enterprise-grade security and meet regulatory requirements. 
            We implement comprehensive security frameworks that keep your data safe and compliant.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90">
              <Link href="/[locale]/contact">
                Get Security Assessment
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/[locale]/contact">
                Book Consultation
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Comprehensive Security Solutions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white">
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

      {/* Compliance Standards */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Compliance Standards We Implement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {complianceStandards.map((standard, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-2xl">{standard.name}</CardTitle>
                  <CardDescription>{standard.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {standard.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Enterprise Security Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold mb-6">Identity & Access Management</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Multi-factor authentication (MFA)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Single Sign-On (SSO) integration</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Role-based access control (RBAC)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Zero trust architecture</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-6">Data Security</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>End-to-end encryption</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Data loss prevention (DLP)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Secure backup and recovery</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Audit logging and monitoring</span>
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
            Why Choose Unite Group for Security?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Regulatory compliance',
              'Data protection',
              'Zero trust security',
              'Audit ready',
              '24/7 monitoring',
              'Incident response',
              'Security training',
              'Compliance reports',
            ].map((benefit, index) => (
              <div key={index} className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
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
            Secure Your Business Today
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Don&apos;t wait for a security breach. Implement enterprise-grade security and compliance now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90">
              <Link href="/[locale]/contact">
                Get Security Assessment
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/[locale]/pricing">
                View Compliance Packages
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
