import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Code, FileText, Zap, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Documentation - Unite-Hub',
  description: 'Learn how to use Unite-Hub to automate your marketing and CRM workflows with AI.',
};

export default function DocsPage() {
  const docSections = [
    {
      icon: Zap,
      title: 'Quick Start',
      description: 'Get up and running with Unite-Hub in minutes',
      href: '/docs/quickstart',
      color: 'text-blue-600',
    },
    {
      icon: Code,
      title: 'API Reference',
      description: 'Complete API documentation for integrations',
      href: '/api',
      color: 'text-purple-600',
    },
    {
      icon: FileText,
      title: 'Guides',
      description: 'Step-by-step tutorials and best practices',
      href: '/docs/guides',
      color: 'text-green-600',
    },
    {
      icon: BookOpen,
      title: 'Use Cases',
      description: 'Real-world examples and implementations',
      href: '/docs/use-cases',
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Documentation
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Everything you need to know about building with Unite-Hub.
              From getting started to advanced integrations.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/dashboard/overview">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/api">View API Docs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {docSections.map((section) => (
              <Card key={section.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-muted ${section.color}`}>
                      <section.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="mb-2">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link
                    href={section.href}
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Explore {section.title.toLowerCase()}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-xl font-semibold mb-4">Need Help Getting Started?</h3>
            <p className="text-muted-foreground mb-6">
              Our team is here to help you get the most out of Unite-Hub.
              Whether you need technical support or strategic guidance, we&apos;re ready to assist.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/contact">Contact Support</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
