/**
 * SaaS Development Services Page
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Code2, Database, Cloud, Gauge, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SaaS Development Services | Unite Group',
  description: 'Enterprise-grade SaaS platform development with modern architecture, scalable infrastructure, and comprehensive security.',
};

const features = [
  {
    icon: Code2,
    title: 'Modern Tech Stack',
    description: 'Built with Next.js 14, TypeScript, and cutting-edge frameworks for optimal performance and developer experience.',
  },
  {
    icon: Database,
    title: 'Scalable Architecture',
    description: 'Multi-tenant database design with Supabase, ensuring data isolation and unlimited scalability.',
  },
  {
    icon: Cloud,
    title: 'Cloud-Native Deployment',
    description: 'Automated CI/CD pipelines with Vercel deployment for instant global availability.',
  },
  {
    icon: Gauge,
    title: 'Performance Optimized',
    description: 'Sub-second load times with edge caching, code splitting, and intelligent resource loading.',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant architecture with end-to-end encryption and advanced authentication.',
  },
];

const technologies = {
  'Frontend': ['Next.js 14', 'React 18', 'TypeScript', 'Tailwind CSS', 'Shadcn/ui'],
  'Backend': ['Node.js', 'Supabase', 'PostgreSQL', 'Redis', 'REST APIs'],
  'Infrastructure': ['Vercel', 'Docker', 'GitHub Actions', 'Cloudflare', 'AWS'],
  'Security': ['OAuth 2.0', 'JWT', 'MFA', 'RBAC', 'SSL/TLS'],
};

export default function SaaSDevelopmentPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold text-white">
              SaaS Development Services
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Build your next-generation SaaS platform with our expert team. 
              From MVP to enterprise scale, we deliver robust, scalable solutions 
              that grow with your business.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/contact">
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
                  Start Your Project
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
            Enterprise SaaS Capabilities
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

      {/* Tech Stack Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Technology Stack
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(technologies).map(([category, techs]) => (
              <div key={category} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-xl font-semibold text-teal-500 mb-4">{category}</h3>
                <ul className="space-y-2">
                  {techs.map((tech, index) => (
                    <li key={index} className="text-slate-300 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-500" />
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Our Development Process
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Discovery', description: 'Understand your business needs and define project scope' },
              { step: '02', title: 'Design', description: 'Create user-centric designs and technical architecture' },
              { step: '03', title: 'Development', description: 'Build your platform with agile methodology' },
              { step: '04', title: 'Deployment', description: 'Launch and scale with continuous support' },
            ].map((phase, index) => (
              <div key={index} className="text-center">
                <div className="bg-teal-600 text-white text-2xl font-bold w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  {phase.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{phase.title}</h3>
                <p className="text-slate-300">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Build Your SaaS Platform?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start with our $550 consultation to plan your development roadmap
          </p>
          <Link href="/consultation">
            <Button size="lg" variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">
              Schedule Your Consultation
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
