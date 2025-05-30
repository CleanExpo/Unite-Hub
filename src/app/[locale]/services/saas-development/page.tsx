import { Metadata } from 'next';
import { Building2, CheckCircle2, ArrowRight, Code, Database, Cloud, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SaaS Platform Development | Unite Group',
  description: 'Full-stack enterprise applications with modern architecture and scalable design. Next.js 15, TypeScript, Supabase, and Stripe integration.',
  keywords: ['SaaS Development', 'Next.js 15', 'TypeScript', 'React', 'Supabase', 'Stripe', 'Enterprise Applications', 'Full-Stack Development'],
};

const features = [
  {
    title: 'Modern Tech Stack',
    description: 'Built with Next.js 15, TypeScript, React, and cutting-edge web technologies',
    icon: Code,
  },
  {
    title: 'Scalable Architecture',
    description: 'Enterprise-grade architecture designed to scale from startup to enterprise',
    icon: Cloud,
  },
  {
    title: 'Full-Stack Integration',
    description: 'Complete integration with databases, authentication, payments, and APIs',
    icon: Database,
  },
  {
    title: 'Mobile-First Design',
    description: 'Progressive Web App capabilities with offline support and responsive design',
    icon: Smartphone,
  },
];

const techStack = [
  { category: 'Frontend', technologies: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'Shadcn/ui'] },
  { category: 'Backend', technologies: ['Node.js', 'Supabase', 'PostgreSQL', 'Redis', 'Edge Functions'] },
  { category: 'Authentication', technologies: ['Supabase Auth', 'OAuth 2.0', 'Multi-Factor Auth', 'RBAC'] },
  { category: 'Payments', technologies: ['Stripe', 'Subscriptions', 'Invoicing', 'Multi-Currency'] },
  { category: 'DevOps', technologies: ['Vercel', 'GitHub Actions', 'Docker', 'Monitoring'] },
];

export default function SaaSDevelopmentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-8">
            <Building2 className="w-12 h-12" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            SaaS Platform Development
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Build scalable, modern SaaS applications with enterprise-grade architecture. 
            From MVP to enterprise scale, we deliver full-stack solutions that grow with your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90">
              <Link href="/[locale]/contact">
                Start Your Project
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
          Enterprise SaaS Development Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
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

      {/* Tech Stack */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Technology Stack
          </h2>
          <div className="space-y-8">
            {techStack.map((stack, index) => (
              <div key={index}>
                <h3 className="text-xl font-semibold mb-4">{stack.category}</h3>
                <div className="flex flex-wrap gap-3">
                  {stack.technologies.map((tech, techIndex) => (
                    <Badge key={techIndex} variant="secondary" className="text-sm py-2 px-4">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Development Process */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Our Development Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="text-4xl font-bold text-purple-500 mb-2">01</div>
                <CardTitle>Discovery & Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-sm">Requirements analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-sm">Technical architecture</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-sm">Project roadmap</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-4xl font-bold text-purple-500 mb-2">02</div>
                <CardTitle>Development & Testing</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-sm">Agile development</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-sm">Continuous integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-sm">Automated testing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-4xl font-bold text-purple-500 mb-2">03</div>
                <CardTitle>Launch & Scale</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-sm">Production deployment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-sm">Performance monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-sm">Ongoing support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features List */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            What's Included
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold mb-4">Core Features</h3>
              <div className="space-y-2">
                {['User authentication & authorization', 'Multi-tenant architecture', 'Subscription billing', 'Admin dashboard', 'API development', 'Real-time features'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold mb-4">Advanced Features</h3>
              <div className="space-y-2">
                {['AI integration', 'Analytics & reporting', 'Email notifications', 'File uploads & storage', 'Third-party integrations', 'Mobile app support'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Build Your SaaS Platform?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Let's transform your vision into a scalable, modern SaaS application.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90">
              <Link href="/[locale]/contact">
                Start Building Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/[locale]/pricing">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
